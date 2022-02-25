//////////////////////////////////////////////////////////////////////////
// By default, resolves any 'glov/foo.js' strings to appropriate relative
// paths assuming glov is located in the root of the source.

const path = require('path');

function defaultPathRegexGenerator(key) {
  // Old default:
  //  return new RegExp(`['"]${key}/([^'"]+\\.js)['"]`, 'g');
  return new RegExp(`['"]${key}/([^'"]+)['"]`, 'g');
}

const default_options = {
  // Source for resolving paths
  source: 'source',
  // Map from module name to local path within the source
  modules: {
    glov: 'glov',
  },
  filter: /\.js$/,
  path_regex_generator: defaultPathRegexGenerator,
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
  let { source, filter, modules, path_regex_generator } = params;
  let module_data = {};
  for (let key in modules) {
    module_data[key] = {
      path_regex: path_regex_generator(key),
      dest: modules[key],
    };
  }
  return {
    input: [`${source}:**`],
    type: 'single',
    func: function (job, done) {
      let file = job.getFile();
      if (!file.relative.match(filter)) {
        job.out(file);
        return void done();
      }
      let contents = file.contents.toString();
      let count = 0;
      Object.keys(module_data).forEach(function (key) {
        let { path_regex, dest } = module_data[key];
        contents = contents.replace(path_regex, function (full, filename) {
          ++count;
          let relative = forwardSlashes(path.relative(path.dirname(file.relative), `${dest}/${filename}`));
          if (relative[0] !== '.') {
            relative = `./${relative}`;
          }
          return `'${relative}'`;
        });
      });
      if (!count) {
        job.out(file);
        return void done();
      }
      job.out({
        relative: file.relative,
        contents,
      });
      done();
    },
    version: [
      params,
      2,
    ],
  };
};
