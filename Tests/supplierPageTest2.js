let loginPage = require('../pages/LoginPage');
//let businessPage = require('../Pages/BusinessDetailsPage');
let supplierPage = require('../Pages/SupplierPage');
var propertiesReader = require('properties-reader');
var properties = propertiesReader('C:\\Users\\kadu_p\\eclipse-workspace\\Protractor\\Config\\config.properties');


beforeAll(function() {
    browser.waitForAngularEnabled(false);
    browser.ignoreSynchronization = true;
});

it('Login test',function(){	
	// getting details from config.properties file
	let url = properties.get('url');
	let username = properties.get('username');
	let password = properties.get('password');
	
	// perform actual steps
	loginPage.get(url);
	loginPage.login(username,password); 
	browser.sleep(2000);	
	console.log('Login successful');	
	browser.sleep(2000);
})

it('Review Engagements',function(){	
	
	let iFrame1 = browser.driver.findElement(By.id('RiskFrame'));
	 browser.switchTo().frame(iFrame1);	 
	 browser.sleep(2000);
	let engagementRequest_hyperlink = element(by.linkText('Engagement requests'));
	engagementRequest_hyperlink.click();
	browser.sleep(2000);
	let newRequests_tab = element.all(by.className('dashboardTab removeBtnStyle')).first();
	newRequests_tab.click();
	browser.sleep(2000);
//	let engagementName_link = element.all(by.xpath('//a[text()="Test_p001"]')).first();
	let engagementName_link = element.all(by.xpath('//a[text()="test_P003"]')).first();
	engagementName_link.click();
	browser.sleep(2000);
})

it('Supplier Page => TC 01: Due Diligence section should not be blank',function(){		
	
	supplierPage.expandDueDiligenceSection();
	browser.sleep(2000);
	supplierPage.isDueDiligenceSectionBlank();
	supplierPage.getTextOfDueDiligence();
	
	console.log('Supplier Page => TC 01: Due Diligence section should not be blank. This testcase is complete.');
})

it('Supplier Page => TC 02: Risk control column should be validated',function(){		
	
	supplierPage.expandDueDiligenceSection();
	browser.sleep(2000);
	supplierPage.VerifyRiskControlColumnText(1);
	supplierPage.VerifyRiskControlColumnText(2);
	
	console.log('Supplier Page => TC 02: Risk control column should be validated. This testcase is complete.');
})

it('Supplier Page => TC 03: Assessment column should be validated',function(){		
	
	supplierPage.expandDueDiligenceSection();
	browser.sleep(2000);
	supplierPage.VerifyAssessmentColumnText(1);
	supplierPage.VerifyAssessmentColumnText(2);
	
	console.log('Supplier Page => TC 03: Assessment column should be validated. This testcase is complete.');
})

it('Supplier Page => TC 04: Set supplier working',function(){		
	supplierPage.setSupplier('accenture');
	
	console.log('Supplier Page => TC 04: Set supplier working. This testcase is complete.');
})

it('Supplier Page => TC 05: Remove supplier working',function(){		
	supplierPage.removeSelectedSupplier();
	
	console.log('Supplier Page => TC 05: Remove supplier working. This testcase is complete.');
})




  