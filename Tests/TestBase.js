let loginPage = require('../pages/LoginPage');
let businessPage = require('../Pages/BusinessDetailsPage');
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
	
	/*let title_textbox = element(by.xpath('//span[text()="Title"]/following::input[1]')); //OR use xpath('//*[@ng-model="comp.answers[comp.config.itemId]"]'));
	title_textbox.sendKeys('test_P001');	
	browser.sleep(1000);
	let commodity_textbox = element(by.xpath('//span[text()="Commodity"]/following::input[1]'));;
	commodity_textbox.sendKeys('Data base reporting software')
	browser.sleep(1000);
	let department_textbox = element(by.xpath('//span[text()="Department"]/following::input[1]'));;
	department_textbox.sendKeys('Finance');
	browser.sleep(1000);
	
	let Next_button = element(by.id('next_engagement_request')); // OR use xpath '//span[text()="Next"]'
	Next_button.click();
	
	browser.sleep(2000);
*/
})



