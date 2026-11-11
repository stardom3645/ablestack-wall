import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('wall_preview_check', Path(__file__).parents[1] / 'wall-preview-check.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class PreviewCheckTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.runtime = Path(self.temp.name).resolve()
        self.env = patch.dict(os.environ, {}, clear=True)
        self.env.start()
        self.addCleanup(self.env.stop)
        for name in ('data', 'logs', 'plugins', 'provisioning', 'home/public/build'):
            (self.runtime / name).mkdir(parents=True)
        (self.runtime / 'data/grafana.db').touch()
        self.config = '\n'.join([
            '[server]', 'http_addr = 127.0.0.1', 'http_port = 3320',
            f'static_root_path = {self.runtime}/home/public', '[paths]',
            *[f'{name} = {self.runtime}/{name}' for name in ('data', 'logs', 'plugins', 'provisioning')],
        ])
        (self.runtime / 'grafana.ini').write_text(self.config)
        (self.runtime / 'home/public/build/assets-manifest.json').write_text('{}')
        self.source = {'root': str(self.runtime), 'head': 'current-head', 'version': '11.4.0-pre',
                       'backendSourceSha256': 'backend-source', 'frontendSourceSha256': 'frontend-source'}
        self.binary = {'sha256': 'artifact', 'version': '11.4.0-pre',
                       'revision': 'current-head', 'commit': 'current-head'}
        evidence = {'source': self.source, 'goExecutable': '/test/go', 'backendSha256': 'artifact',
                    'frontendAssetsSha256': checker.assets_hash(self.runtime)}
        (self.runtime / 'build-input.json').write_text(json.dumps(evidence))
        self.source_mock = patch.object(checker, 'source_info', return_value=self.source)
        self.binary_mock = patch.object(checker, 'binary_info', return_value=self.binary)
        self.source_mock.start()
        self.binary_mock.start()
        self.addCleanup(self.source_mock.stop)
        self.addCleanup(self.binary_mock.stop)

    def test_refuses_the_existing_preview_port(self):
        (self.runtime / 'grafana.ini').write_text(self.config.replace('3320', '3317'))
        with self.assertRaisesRegex(ValueError, 'protected'):
            checker.require_copied_paths(self.runtime)

    def test_refuses_a_database_outside_the_copy(self):
        with (self.runtime / 'grafana.ini').open('a') as output:
            output.write('\n[database]\npath = /tmp/wall-modern-lite-runtime/data/grafana.db\n')
        with self.assertRaisesRegex(ValueError, 'Database must be a copy'):
            checker.require_copied_paths(self.runtime)

    def test_refuses_environment_overrides_that_bypass_path_checks(self):
        os.environ['GF_DATABASE_PATH'] = '/existing/grafana.db'
        with self.assertRaisesRegex(ValueError, 'GF_DATABASE_PATH'):
            checker.require_copied_paths(self.runtime)

    def test_does_not_record_the_old_unlinked_version(self):
        self.binary['version'] = '9.2.0'
        with self.assertRaisesRegex(ValueError, 'Backend version mismatch'):
            checker.record(self.runtime, self.runtime)
        self.assertFalse((self.runtime / 'wall-runtime.json').exists())

    def test_equal_versions_do_not_hide_a_different_source_revision(self):
        self.binary['revision'] = 'older-source'
        with self.assertRaisesRegex(ValueError, 'Go VCS revision mismatch'):
            checker.record(self.runtime, self.runtime)

    def test_accepts_missing_automatic_vcs_stamp_only_in_a_linked_worktree_with_build_evidence(self):
        (self.runtime / '.git').write_text('gitdir: /test/worktree')
        self.binary['revision'] = None
        checker.record(self.runtime, self.runtime)
        checker.check(self.runtime)

    def test_rejects_a_source_change_since_the_actual_build(self):
        self.source['frontendSourceSha256'] = 'changed-after-build'
        with self.assertRaisesRegex(ValueError, 'Built source fingerprints mismatch'):
            checker.record(self.runtime, self.runtime)

    def test_detects_replaced_frontend_files(self):
        checker.record(self.runtime, self.runtime)
        (self.runtime / 'home/public/build/app.js').write_text('a different build')
        with self.assertRaisesRegex(ValueError, 'Frontend artifacts mismatch'):
            checker.check(self.runtime)

    def test_rejects_a_running_backend_with_the_wrong_version(self):
        checker.record(self.runtime, self.runtime)
        reply = io.BytesIO(json.dumps({'database': 'ok', 'version': '9.2.0', 'commit': 'NA'}).encode())
        with patch.object(checker, 'urlopen', return_value=reply):
            with self.assertRaisesRegex(ValueError, 'Running backend version mismatch'):
                checker.check(self.runtime, 'http://localhost:3317')


if __name__ == '__main__':
    unittest.main()
