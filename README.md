Sub-module path resolving task processor for [glov-build](https://github.com/Jimbly/glov-build)
=============================

By default, resolves any referenced `'glov/foo.js'` strings to appropriate relative paths, while respecting client/server/common folders.  This is useful if you have a fork of GLOV.js or similar framework inside your project and want your code to be able to reference the module in the standard node module syntax without messing around with modifying each of Node/Browserify/WebPack/etc's module search paths/mechanisms.

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
* **`dir_map`** - optional map from input filename prefix to paths to search for referenced files.  Default:
```javascript
{
  'client/': ['client/glov', 'common/glov'],
  'server/': ['server/glov', 'common/glov'],
  'common/': ['common/glov'],
}
```
* **`path_regex`** - optional RegExp to find a path string that should be converted into a relative path to the actual file.  Note: should be `g`lobal flagged, and include leading and trailing quotes.  Default: `/'glov\/([^']+\.js)'/g`.
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
    dir_map: { '': ['common'] },
    path_regex: /'common\/([^']+\.js)'/g,
  }),
});

```

Example input in a fork of a GLOV.js project, which also contains a `src/common/mything.js`.
```javascript
// src/client/foo/bar.js
const foo = require('glov/engine.js');
const bar = require('glov/util.js');
const baz = require('common/mything.js');
```
Example output:
```javascript
const foo = require('../glov/engine.js');
const bar = require('../../common/glov/util.js');
const baz = require('../../common/mything.js');
```
