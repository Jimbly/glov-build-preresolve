Sub-module path resolving task processor for [glov-build](https://github.com/Jimbly/glov-build)
=============================

By default, resolves any 'glov/foo.js' strings to appropriate relative paths assuming glov is located in the root of the source.  This is useful if you have a fork of GLOV.js or similar framework inside your project and want your code to be able to reference the module in the standard node module syntax without messing around with modifying each of Node/Browserify/WebPack/etc's module search paths/mechanisms.  To maintain compatibility with IDEs and other tooling, this may be best used in conjunction with adding a local file path module to your package.json (npm will then also create a symlink to the module within node_modules).

Example package.json entry:
```json
{
  "dependencies": {
    "glov": "file:./src/glov"
  }
}
```

API usage:
```javascript
const preresolve = require('glov-build-preresolve');

gb.task({
  name: ...,
  ...preresolve(options),
});
```
Options
* **`source`** - optional input source task.  This is used as a source for looking for matching paths and for sourcing inputs to this task.  Expected usage it to source another task that is outputting .js and .map files.  Default: `'source'`.
* **`modules`** - optional map from module name to local path within the source.  Default:
```javascript
{
  'glov': 'glov',
}
```
* **`filter`** - optional RegExp to filter which files get processed and which get passed through.  Default: `/\.js$/`.


Example usage:
```javascript
const gb = require('glov-build');
const preresolve = require('glov-build-preresolve');

gb.configure({
  source: 'src',
  statedir: 'out/.gbstate',
  targets: {
    dev: 'out',
  },
});

gb.task({
  name: 'preresovle_glov',
  ...preresolve(),
});

gb.task({
  name: 'preresolve_common'
  target: 'dev',
  ...preresolve({
    source: 'preresovle_glov',
    modules: {
      common: 'common',
    },
  }),
});

```

Example input in a fork of a GLOV.js project, which also contains a `src/common/mything.js`.
```javascript
// src/client/foo/bar.js
const foo = require('glov/client/engine.js');
const bar = require('glov/common/util.js');
const baz = require('common/mything.js');
```
Example output:
```javascript
const foo = require('../../glov/client/engine.js');
const bar = require('../../glov/common/util.js');
const baz = require('../../common/mything.js');
```
