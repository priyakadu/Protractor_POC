

// An example configuration file.
/*
var HtmlScreenshotReporter = require('protractor-jasmine2-screenshot-reporter');
var reporter = new HtmlScreenshotReporter({
  dest: '../target/screenshots',
  filename: 'my-report.html'
});*/


exports.config = {
  directConnect: true,

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'firefox'
  },

  // Framework to use. Jasmine is recommended.
  framework: 'jasmine',

  // Spec patterns are relative to the current working directory when
  // protractor is called.
//  specs: ['Addition.js'],
//  specs: ['Addition.js','Subtraction.js','Division.js','Multiplication.js'],
 //  specs: ['readDataFromExcel.js'],
 // specs: ['C:\\Users\\pc\\eclipse-workspace\\ProtractorDemo\\Tests\\Addition.js','C:/Users/pc/eclipse-workspace/ProtractorDemo/Tests/Subtraction.js','..\\Tests\\Division.js'],
//  specs: ['C:\\Users\\kadu_p\\eclipse-workspace\\Protractor\\Tests\\TestBase.js'],
// specs: ['C:\\Users\\kadu_p\\eclipse-workspace\\Protractor\\Tests\\CreateEngagement.js'],
// specs: ['C:\\Users\\kadu_p\\eclipse-workspace\\Protractor\\Tests\\SupplierPageTest2.js'],
  specs: ['C:\\Users\\kadu_p\\eclipse-workspace\\Protractor\\Tests\\test.js'],
  
//  SELENIUM_PROMISE_MANAGER: false,
  // Options to be passed to Jasmine.
  jasmineNodeOpts: {
	  showColors: true,   // Use colors in the command line report.
    defaultTimeoutInterval: 300000
  },

onPrepare: function () {
         browser.driver.ignoreSynchronization = true;// for non-angular set true. default value is false 
         browser.waitForAngularEnabled(false);   // for non-angular set false. default value is true  
       },
  
//Setup the report before any tests start
 /* beforeLaunch: function() {
    return new Promise(function(resolve){
      reporter.beforeLaunch(resolve);
    });
  },
*/
  // Assign the test reporter to each running instance
  /*onPrepare: function() {
 var jasmineReporters = require('jasmine-reporters');
 jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
     consolidateAll: true,
     savePath: '../',
     filePrefix: 'xmlresults'
 }));*/
 
 
   // jasmine.getEnv().addReporter(reporter);
 // },

  // Close the report after all tests finish
  /*afterLaunch: function(exitCode) {
    return new Promise(function(resolve){
      reporter.afterLaunch(resolve.bind(this, exitCode));
    });
  },
  */

/*
//HTMLReport called once tests are finished
  onComplete: function() {
       var browserName, browserVersion;
       var capsPromise = browser.getCapabilities();
   
       capsPromise.then(function (caps) {
          browserName = caps.get('browserName');
          browserVersion = caps.get('version');
          platform = caps.get('platform');
   
        /*  var HTMLReport = require('protractor-html-reporter-2');
   
          testConfig = {
              reportTitle: 'Protractor Test Execution Report',
              outputPath: '../',
              outputFilename: 'ProtractorTestReport',
              screenshotPath: './screenshots',
              testBrowser: browserName,
              browserVersion: browserVersion,
              modifiedSuiteName: false,
              screenshotsOnlyOnFailure: true,
              testPlatform: platform
          };
          new HTMLReport().from('xmlresults.xml', testConfig);*/
    //  });
   
	
};
