#!/usr/bin/env python3
"""Record/check a local, copied-DB Wall build; run it only after a successful check."""
import argparse
import configparser
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
from urllib.request import urlopen


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def tree_hash(root, names):
    digest = hashlib.sha256()
    for name in sorted(set(names)):
        path = root / name
        if path.is_file():
            digest.update(name.encode() + b'\0' + sha256(path).encode() + b'\0')
    return digest.hexdigest()


def source_info(root):
    names = subprocess.check_output(
        ['git', '-C', str(root), 'ls-files', '-co', '--exclude-standard', '-z']
    ).decode().split('\0')
    # Wire output is ignored by Git, but it is compiled into the backend.
    names.append('pkg/server/wire_gen.go')
    backend = [n for n in names if n.startswith(('pkg/', 'apps/', 'conf/')) or n in (
        'go.mod', 'go.sum', 'go.work', 'go.work.sum', 'build.go')]
    frontend = [n for n in names if n.startswith(('public/', 'packages/', 'scripts/webpack/')) or n in (
        'package.json', 'yarn.lock', '.yarnrc.yml', 'tsconfig.json', 'tsconfig.base.json')]
    return {
        'root': str(root),
        'head': subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip(),
        'version': json.loads((root / 'package.json').read_text())['version'],
        'backendSourceSha256': tree_hash(root, backend),
        'frontendSourceSha256': tree_hash(root, frontend),
    }


def require_equal(actual, expected, label):
    if actual != expected:
        raise ValueError(f'{label} mismatch: expected {expected}, got {actual}. Rebuild from the recorded source.')


def require_copied_paths(runtime):
    """Never let this opt-in launcher migrate the existing preview's database."""
    overrides = [key for key in os.environ if key.startswith(('GF_DATABASE_', 'GF_PATHS_', 'GF_SERVER_', 'GF_SECURITY_', 'GF_AUTH_'))]
    if overrides:
        raise ValueError('Remove path/database/server environment overrides before isolated startup: ' + ', '.join(overrides))
    config = configparser.ConfigParser(interpolation=None)
    config.read(runtime / 'grafana.ini')
    if config.get('server', 'http_addr', fallback='') not in ('127.0.0.1', '::1'):
        raise ValueError('Coherent preview must bind to loopback.')
    if config.get('server', 'http_port', fallback='') in ('3317', '3318', '3319', ''):
        raise ValueError('Use a separate test port; existing preview/fixture/relay ports are protected.')
    if config.get('database', 'type', fallback='sqlite3') != 'sqlite3':
        raise ValueError('Only an isolated SQLite copy is supported by this local launcher.')
    if config.get('database', 'url', fallback=''):
        raise ValueError('Database URL overrides are not supported by this isolated launcher.')
    for key in ('data', 'logs', 'plugins', 'provisioning'):
        path = Path(config.get('paths', key)).resolve()
        if not path.is_relative_to(runtime) or path == runtime:
            raise ValueError(f'paths.{key} must be inside the isolated runtime.')
    db = Path(config.get('database', 'path', fallback='grafana.db'))
    if not db.is_absolute():
        db = Path(config.get('paths', 'data')) / db
    if not db.resolve().is_relative_to(runtime):
        raise ValueError('Database must be a copy inside the isolated runtime.')
    if not db.is_file():
        raise ValueError('Database copy is missing; refusing to create an empty replacement.')
    static = Path(config.get('server', 'static_root_path')).resolve()
    require_equal(static, (runtime / 'home/public').resolve(), 'Static asset path')


def binary_info(binary, go='go'):
    build = subprocess.check_output([go, 'version', '-m', str(binary)], text=True)
    revision = re.search(r'vcs.revision=(\S+)', build)
    commit = re.search(r'main.commit=([^\s"\']+)', build)
    version = subprocess.check_output([str(binary), '-v'], text=True).strip().split()[-1]
    return {'sha256': sha256(binary), 'version': version,
            'revision': revision.group(1) if revision else None,
            'commit': commit.group(1) if commit else None}


def build(root, runtime):
    """Build both sides while binding their artifacts to the same source fingerprints."""
    binary = runtime / 'bin/grafana'
    if binary.exists() or (runtime / 'wall-runtime.json').exists():
        raise ValueError('Refusing to overwrite an existing runtime binary; choose a new build directory.')
    binary.parent.mkdir(parents=True, exist_ok=True)
    go = shutil.which('go')
    if not go:
        raise ValueError('Go toolchain is missing.')
    env = {**os.environ, 'GOFLAGS': '-mod=readonly', 'NODE_ENV': 'production'}
    wire = [go, 'run', './pkg/build/wire/cmd/wire/main.go', 'gen', '-tags', 'oss', './pkg/server']
    with (runtime / 'wire-build.log').open('w') as output:
        subprocess.run(wire, cwd=root, env=env, stdout=output, stderr=subprocess.STDOUT, check=True)
    source = source_info(root)
    flags = (f'-w -X main.version={source["version"]} -X main.commit={source["head"]}'
             f' -X main.buildBranch={subprocess.check_output(["git", "branch", "--show-current"], cwd=root, text=True).strip()}'
             f' -X main.buildstamp={int(time.time())}')
    commands = [
        [go, 'build', '-buildvcs=true', '-tags=oss', '-ldflags', flags, '-o', str(binary), './pkg/cmd/grafana'],
        [str(root / 'node_modules/.bin/webpack'), '--config', str(root / 'scripts/webpack/webpack.wall-preview.cjs')],
    ]
    for command, name in zip(commands, ('backend', 'frontend')):
        print(f'Building {name} from {source["head"]}', flush=True)
        with (runtime / (name + '-build.log')).open('w') as output:
            subprocess.run(command, cwd=root, env=env, stdout=output, stderr=subprocess.STDOUT, check=True)
    require_equal(source_info(root), source, 'Sources changed during the build')
    assets = root / 'public/build'
    evidence = {'source': source, 'goExecutable': go, 'commands': [wire, *commands],
                'backendSha256': sha256(binary),
                'frontendAssetsSha256': tree_hash(assets, [str(p.relative_to(assets)) for p in assets.rglob('*') if p.is_file()])}
    (runtime / 'build-input.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print('Build complete; copy the static home/config and database before record/run.', flush=True)


def assets_hash(runtime):
    root = runtime / 'home/public/build'
    if not (root / 'assets-manifest.json').is_file():
        raise ValueError('Frontend build manifest is missing.')
    return tree_hash(root, [str(p.relative_to(root)) for p in root.rglob('*') if p.is_file()])


def record(root, runtime):
    if (runtime / 'wall-runtime.json').exists():
        raise ValueError('Build provenance already exists; use a new runtime directory for a new build.')
    require_copied_paths(runtime)
    source = source_info(root)
    evidence = json.loads((runtime / 'build-input.json').read_text())
    require_equal(source, evidence['source'], 'Built source fingerprints')
    binary = binary_info(runtime / 'bin/grafana', evidence['goExecutable'])
    require_equal(binary['sha256'], evidence['backendSha256'], 'Built backend artifact')
    require_equal(assets_hash(runtime), evidence['frontendAssetsSha256'], 'Copied frontend build')
    require_equal(binary['version'], source['version'], 'Backend version')
    if binary['revision'] is not None:
        require_equal(binary['revision'], source['head'], 'Go VCS revision')
    elif not (root / '.git').is_file():
        raise ValueError('Go VCS revision missing outside a linked worktree.')
    # Go 1.23 recognizes only a .git directory, not linked worktree .git files.
    # Retain this absence honestly; require the actual build record, linked commit,
    # source fingerprints and artifact hashes rather than manufacturing vcs metadata.
    require_equal(binary['commit'], source['head'], 'Linked backend commit')
    info = {key: source[key] for key in ('head', 'version', 'frontendSourceSha256')}
    public_info = runtime / 'home/public/wall-build-info.json'
    public_info.write_text(json.dumps(info, indent=2) + '\n')
    manifest = {'source': source, 'backend': binary, 'goExecutable': evidence['goExecutable'],
                'frontendAssetsSha256': assets_hash(runtime),
                'publicInfoSha256': sha256(public_info),
                'configSha256': sha256(runtime / 'grafana.ini')}
    target = runtime / 'wall-runtime.json'
    target.write_text(json.dumps(manifest, indent=2) + '\n')
    target.chmod(0o600)
    print(f'Recorded source {source["head"]}, version {source["version"]}; binary {runtime / "bin/grafana"}')


def check(runtime, url=None):
    require_copied_paths(runtime)
    manifest = json.loads((runtime / 'wall-runtime.json').read_text())
    source = source_info(Path(manifest['source']['root']))
    for key in ('head', 'version', 'backendSourceSha256', 'frontendSourceSha256'):
        require_equal(source[key], manifest['source'][key], f'Source {key}')
    require_equal(binary_info(runtime / 'bin/grafana', manifest['goExecutable']), manifest['backend'], 'Backend artifact')
    require_equal(sha256(runtime / 'grafana.ini'), manifest['configSha256'], 'Runtime config')
    require_equal(assets_hash(runtime), manifest['frontendAssetsSha256'], 'Frontend artifacts')
    require_equal(sha256(runtime / 'home/public/wall-build-info.json'), manifest['publicInfoSha256'], 'Public build record')
    if url:
        with urlopen(url.rstrip('/') + '/api/health', timeout=15) as response:
            health = json.load(response)
        require_equal(health.get('database'), 'ok', 'Database health')
        require_equal(health.get('version'), source['version'], 'Running backend version')
        require_equal(health.get('commit'), source['head'], 'Running backend commit')
        with urlopen(url.rstrip('/') + '/public/wall-build-info.json', timeout=15) as response:
            public_info = json.load(response)
        for key in ('head', 'version', 'frontendSourceSha256'):
            require_equal(public_info[key], source[key], f'Served frontend {key}')
    print(f'Wall preview consistent: {source["version"]} / {source["head"]}; binary {runtime / "bin/grafana"}', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('build', 'record', 'check', 'run'))
    parser.add_argument('--runtime', type=Path, required=True)
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--url', help='Also verify the actual HTTP backend and served frontend build record')
    args = parser.parse_args()
    runtime = args.runtime.resolve()
    try:
        if args.action == 'build':
            build(args.source.resolve(), runtime)
        elif args.action == 'record':
            record(args.source.resolve(), runtime)
        else:
            check(runtime, args.url)
            if args.action == 'run':
                os.execv(str(runtime / 'bin/grafana'), [str(runtime / 'bin/grafana'), 'server',
                         '--homepath', str(runtime / 'home'), '--config', str(runtime / 'grafana.ini')])
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        print(f'Wall preview check FAILED: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
