exports.config = {
  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'firefox'
  },

 // seleniumAddress: 'http://localhost:4444/wd/hub',
  directConnect: true,
  // Framework to use. Jasmine is recommended.
  framework: 'jasmine',

  // Spec patterns are relative to the current working directory when
  // protractor is called.
  specs: ['C:\\Users\\kadu_p\\eclipse-workspace\\Protractor\\Tests\\test.js'],

  SELENIUM_PROMISE_MANAGER: false,

  // Options to be passed to Jasmine.
  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};

