//////////////////////////////////////////////////////////////////////////
// By default, resolves any 'glov/foo.js' strings to appropriate relative paths,
// while respecting client/server/common folders.

const { asyncEachSeries } = require('glov-async');
const path = require('path');

const default_options = {
  // Source for resolving paths
  source: 'source',
  // map from input filename to what directories to search
  dir_map: {
    'client/': ['client/glov', 'common/glov'],
    'server/': ['server/glov', 'common/glov'],
    'common/': ['common/glov'],
  },
  // regex to find a path string that should be converted into a relative path to the actual file
  // Note: should be `g`lobal flagged, and include leading and trailing quotes
  path_regex: /'glov\/([^']+\.js)'/g,
  filter: /\.js$/,
};

// Another example:
// { dir_map: '': ['common'], path_regex: /'common\/([^']+\.js)'/g }

function forwardSlashes(str) {
  return str.replace(/\\/g, '/');
}

function defaults(dest, src) {
  for (let f in src) {
    if (dest[f] === undefined) {
      dest[f] = src[f];
    }
  }
  return dest;
}

module.exports = function glovPreResolve(params) {
  params = params || {};
  params = defaults(params, default_options);
  let { source, dir_map, filter, path_regex } = params;
  return {
    input: [`${source}:**`],
    type: 'single',
    func: function (job, done) {
      let file = job.getFile();
      if (!file.relative.match(filter)) {
        job.out(file);
        return void done();
      }
      let search_dirs = [];
      for (let prefix in dir_map) {
        if (file.relative.startsWith(prefix)) {
          search_dirs = search_dirs.concat(dir_map[prefix]);
        }
      }
      if (!search_dirs.length) {
        // Maybe fine for this to not be a warning?
        job.warn(`${file.relative}: Does not match any entry in 'dir_map'`);
        job.out(file);
        return void done();
      }
      let contents = file.contents.toString();
      let files_to_search = [...contents.matchAll(path_regex)].map((a) => a[1]);
      if (!files_to_search.length) {
        job.out(file);
        return void done();
      }
      let mappings = {};
      asyncEachSeries(files_to_search, (filename, next) => {
        asyncEachSeries(search_dirs, (search_dir, next_sub) => {
          let search_file = `${search_dir}/${filename}`;
          job.depAdd(`${source}:${search_file}`, (err, contents1) => {
            if (err) {
              return void next_sub(err);
            }
            if (contents1) {
              let relative = forwardSlashes(path.relative(path.dirname(file.relative), search_file));
              if (relative[0] !== '.') {
                relative = `./${relative}`;
              }
              mappings[filename] = relative;
              return void next(); // skipping out of inner asyncSeries
            }
            next_sub();
          });
        }, (err) => {
          next(err || `Could not resolve path to ${filename}`);
        });
      }, (err) => {
        if (err) {
          return void done(err);
        }
        job.out({
          relative: file.relative,
          contents: contents.replace(path_regex, function (full, filename) {
            return `'${mappings[filename]}'`;
          }),
        });
        done();
      });
    },
  };
};
