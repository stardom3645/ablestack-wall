// Resolve local packages from this checkout, even when node_modules is shared with another worktree.
const path = require('path');
const root = path.resolve(__dirname, '../..');

module.exports = (env, argv) => {
  const config = require('./webpack.prod.js')(env, argv);
  for (const name of ['ui', 'sql', 'prometheus']) {
    config.resolve.alias[`@grafana/${name}`] = path.join(root, `packages/grafana-${name}`);
  }
  return config;
};
