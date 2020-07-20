let loginPage = require('../pages/LoginPage');
let businessPage = require('../Pages/BusinessDetailsPage');
let inherentPage = require('../Pages/InherentRiskScreeningPage');
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
	
	// add here code for iframe if it doesnt work 
	let iFrame1 = browser.driver.findElement(By.id('RiskFrame'));
	 browser.switchTo().frame(iFrame1);
	 
	 browser.sleep(2000);
	let engagementRequest_hyperlink = element(by.linkText('Engagement requests'));
	engagementRequest_hyperlink.click();
	browser.sleep(2000);
	let newRequests_tab = element.all(by.className('dashboardTab removeBtnStyle')).first();
	newRequests_tab.click();
	browser.sleep(2000);
	let engagementName_link = element.all(by.xpath('//a[text()="test_P003"]')).first();
	engagementName_link.click();
	browser.sleep(2000);
	
		
	// Due Diligence section
	
	let dueDiligence_toggle = element(by.xpath('//button[@class="removeBtnStyle"]'));
	let dueDiligence_menuContainer = element.all(by.xpath('//table[@class="table hierarchyTable overrideTDStyle"]'));
	
	//	dueDiligence_toggle.click();
	supplierPage.clickDueDiligenceToggle();
	dueDiligence_menuContainer.isDisplayed().then(containerYes=>{
		console.log('Is menu expanded after click? ',containerYes);
	})
/*	let dueDiligence_text = element(by.xpath('//span[text()="No recommended risk controls for this engagement"]'));
	dueDiligence_text.isDisplayed().then(textSeen=>{
		console.log('Is due diligence section blank?: ',textSeen);	
		if(textSeen==true){
			// fail test case
			console.log('This testcase needs to be fail');
		}
	})
	
	dueDiligence_text.getText().then(textStatus=>{
		console.log('Text status = ',textStatus);
		if(textStatus=='No recommended risk controls for this engagement'){
			// fail test case
			console.log('First testcase needs to be fail');
		}
	});
	
	// 1. Due Diligence should not be blank
	expect(dueDiligence_text.isDisplayed()).toBe(true);*/
	
	
	
	
	//2.	Risk control column should be validated
	let firstRowOfDueDiligence = element(by.repeater('control in supplierSelectionVm.vm.items').row(0));
	let secondRowOfDueDiligence = element(by.repeater('control in supplierSelectionVm.vm.items').row(1));
	
	let firstRowRiskControl = element.all(by.xpath('//td[@ng-bind="control[\'ControlName\']"]')).first();
	let SecondRowRiskControl = element.all(by.xpath('//td[@ng-bind="control[\'ControlName\']"]')).get(1);
	
	firstRowRiskControl.getText().then(firstControlTypeText=>{
		console.log('What is the text seen in first row 3rd column? = ',firstControlTypeText);
		if(firstControlTypeText=='Critical data element'){
			console.log('Correct data is seen in 1st row col 3');
			// pass the test case
			
		}
		if(firstControlTypeText!='Critical data element'){
			console.log('Incorrect data is seen in 2nd row col 3');
			// fail test case here
		}
	})
	
	SecondRowRiskControl.getText().then(secondControlTypeText=>{
		console.log('What is the text seen in second row 3rd column? = ',secondControlTypeText);
		if(secondControlTypeText=='ITDR check Singapore'){
			console.log('Correct data is seen in 2nd row col 3');
			// pass the test case
			
		}
		if(secondControlTypeText!='ITDR check Singapore'){
			console.log('Incorrect data is seen in 2nd row col 3');
			// fail test case here
		}
	})

//	3.	Assessment column should be validated
	let firstRowAssessment = element.all(by.xpath('//td[@ng-bind="control[\'AssessmentIds\']"]')).first();
	let SecondRowAssessment = element.all(by.xpath('//td[@ng-bind="control[\'AssessmentIds\']"]')).get(1);
	
	firstRowAssessment.getText().then(firstAssessmentText=>{
		console.log('What is the text seen in first row 3rd column? = ',firstAssessmentText);
		if(firstAssessmentText=='Capacity Management Policy'){
			console.log('Correct data is seen in 1st row col 7');
			// pass the test case
			
		}
		if(firstAssessmentText!='Capacity Management Policy'){
			console.log('Incorrect data is seen in 2nd row col 7');
			// fail test case here
		}
	})
	
	SecondRowAssessment.getText().then(secondAssessmentText=>{
		console.log('What is the text seen in second row 3rd column? = ',secondAssessmentText);
		if(secondAssessmentText=='Call Tree'){
			console.log('Correct data is seen in 2nd row col 7');
			// pass the test case
			
		}
		if(secondAssessmentText!='Call Tree'){
			console.log('Incorrect data is seen in 2nd row col 7');
			// fail test case here
		}
	})	
	
//	4.	set supplier working
	let searchSupplier_textbox= element(by.xpath('//input[@awname="app_input_category_search_input_box"]'));
	searchSupplier_textbox.sendKeys('accenture').click();
	browser.sleep(2000);
	 
	const hiddenElement = element.all(by.xpath('//div[@awname="app_div"]')).first();
	browser.driver.executeScript('',hiddenElement.getWebElement().click());
	browser.sleep(1000);
	
	let setSupplier_button = element(by.xpath('//button[text()="Set Supplier"]'));
		
	setSupplier_button.isEnabled().then(btnSelected=>{
		console.log('Is set Supplier button enabled?:   ',btnSelected);
	})
	
	//setSupplier_button.click();
	browser.executeScript("arguments[0].scrollIntoView()",setSupplier_button);
	browser.executeScript("arguments[0].click()",setSupplier_button);
	browser.sleep(2000);
	
//	5.	remove supplier working
	searchSupplier_textbox.clear();
	searchSupplier_textbox.sendKeys('vodafone').click();
	browser.sleep(2000);
	const hiddenElement2 = element.all(by.xpath('//div[@awname="app_div"]')).first();
	browser.driver.executeScript('',hiddenElement2.getWebElement().click());
	browser.sleep(1000);
	
	let removeSupplier_button = element(by.xpath('//span[text()="Remove supplier"]'));
	removeSupplier_button.isPresent().then(btnSelected=>{
		console.log('Is remove Supplier button present?:   ',btnSelected);
	})
	
	browser.executeScript("arguments[0].scrollIntoView()",removeSupplier_button);
	browser.executeScript("arguments[0].click()",removeSupplier_button);
	
	browser.sleep(2000);
//	6.	hover over supplier and get tooltip

	
	
	  //  });
/*	
	// Supplier section
	let searchSupplier_textbox= element(by.xpath('//input[@awname="app_input_category_search_input_box"]'));
	searchSupplier_textbox.sendKeys('accenture').click();
	browser.sleep(2000);
	 
	const hiddenElement = element.all(by.xpath('//div[@awname="app_div"]')).first();
	browser.driver.executeScript('',hiddenElement.getWebElement().click());
	browser.sleep(1000);
	
	let setSupplier_button = element(by.xpath('//button[text()="Set Supplier"]'));
		
	setSupplier_button.isEnabled().then(btnSelected=>{
		console.log('Is set Supplier button enabled?:   ',btnSelected);
	})
	
	//setSupplier_button.click();
	browser.executeScript("arguments[0].scrollIntoView()",setSupplier_button);
	browser.executeScript("arguments[0].click()",setSupplier_button);
	browser.sleep(2000);
	
	let removeSupplier_button = element(by.xpath('//span[text()="Remove supplier"]'));
	
	removeSupplier_button.isPresent().then(btnSelected=>{
		console.log('Is remove Supplier button present?:   ',btnSelected);
	})
	
	browser.executeScript("arguments[0].scrollIntoView()",removeSupplier_button);
	browser.executeScript("arguments[0].click()",removeSupplier_button);
	
	browser.sleep(2000);
	let save_button = element.all(by.xpath('//span[text()="Save"]')).first();
	save_button.click();
	browser.sleep(2000);
	*/
	
	/*browser.executeScript("arguments[0].scrollIntoView(true);",searchSupplier_textbox);
	browser.executeScript("arguments[0].click()",searchSupplier_textbox);*/
//	browser.actions().click(searchSupplier_textbox).perform();
	
	
})

/*
it('Create New Engagement',function(){
	// creating engagement
	element(by.className('a-mastCmd-create-button-aux-icon aw7_a-mastCmd-create-button-aux-icon')).click();
	element(by.linkText('Engagement Request')).click();
	
	browser.sleep(2000);
	
	 browser.ignoreSynchronization = false;
	 browser.waitForAngularEnabled(true);
	 let iFrame1 = browser.driver.findElement(By.id('RiskFrame'));
		browser.switchTo().frame(iFrame1);
		
	 businessPage.businessDetails('test_P001','Data base reporting software','Finance');
	
})

it('Inherent Risk screening',function(){
	 let iFrame1 = browser.driver.findElement(By.id('RiskFrame'));
		browser.switchTo().frame(iFrame1);
		
		inherentPage.inherentRiskMandatoryFields();
	
})

it('Select Supplier >> Due Diligence should not be blank',function(){
	let iFrame1 = browser.driver.findElement(By.id('RiskFrame'));
	browser.switchTo().frame(iFrame1);
	
	supplierPage.selectSupplier('accenture');
	
})
*/

