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
    detectBrowsers: {
      usePhantomJS: false,
    },
    browserify: {
      debug: true,
      bare: true,
    },
    plugins: [
      'karma-browserify',
      'karma-mocha',
      'karma-spec-reporter',
      'karma-chrome-launcher',
      'karma-edge-launcher',
      'karma-firefox-launcher',
      'karma-ie-launcher',
      'karma-safari-launcher',
      'karma-safaritechpreview-launcher',
      'karma-opera-launcher',
      'karma-detect-browsers'
    ],
    reporters: [ 'spec' ],
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: true,
  })

}
