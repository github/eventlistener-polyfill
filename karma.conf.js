module.exports = config => {
  const customBrowsers = process.argv.indexOf('--browsers') !== -1
  config.set({
    frameworks: [ 'browserify', 'mocha' ].concat(customBrowsers ? [] : 'detectBrowsers'),
    files: [
      'test/*.js'
    ],
    preprocessors: {
      'test/*.js': [ 'browserify' ],
    },
    browserify: {
      debug: true,
      bare: true,
    },
    plugins: [
      'karma-browserify',
      'karma-chrome-launcher',
      'karma-detect-browsers',
      'karma-edge-launcher',
      'karma-firefox-launcher',
      'karma-ie-launcher',
      'karma-mocha',
      'karma-opera-launcher',
      'karma-phantomjs-launcher',
      'karma-safari-launcher',
      'karma-safaritechpreview-launcher',
      'karma-spec-reporter',
    ],
    reporters: [ 'spec' ],
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: true,
  })

}
