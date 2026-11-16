// Resolve local packages from this checkout, even when node_modules is shared with another worktree.
const { createHash } = require('crypto');
const path = require('path');
const root = path.resolve(__dirname, '../..');

module.exports = (env, argv) => {
  const config = require('./webpack.prod.js')(env, argv);
  // Worktrees share node_modules. Cached resolutions must never retain another
  // checkout's UI/context modules alongside the packages aliased below.
  config.cache.name = `wall-preview-${createHash('sha256').update(root).digest('hex').slice(0, 12)}`;
  config.cache.buildDependencies.config.push(__filename);
  for (const name of ['ui', 'sql', 'prometheus']) {
    config.resolve.alias[`@grafana/${name}`] = path.join(root, `packages/grafana-${name}`);
  }
  return config;
};
