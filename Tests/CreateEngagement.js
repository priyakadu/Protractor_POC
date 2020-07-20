let radioButtonCommon = require('../CommonLibrary/RadioButton');

beforeAll(function() {
    browser.waitForAngularEnabled(false);
    browser.ignoreSynchronization = true;
});

it('Login test 1',function(){
	
	browser.driver.get('https://s1.ariba.com/Sourcing/Main/aw?awh=r&awssk=NqiCZXZk&realm=buymore-T&dard=1');
	
	let username_textbox = element(by.id('UserName'));	
	username_textbox.sendKeys('Priya001');
	
	let password_textbox = element(by.id('Password'));
	password_textbox.sendKeys('Supplier@333');
	
	let login_button = element(by.className('w-login-form-btn'));
	login_button.click();
}),

it('Create New Engagement',function(){
	// creating engagement
	element(by.className('a-mastCmd-create-button-aux-icon aw7_a-mastCmd-create-button-aux-icon')).click();
	element(by.linkText('Engagement Request')).click();
	
	browser.sleep(2000);
	
	 browser.ignoreSynchronization = false;
	 browser.waitForAngularEnabled(true);
	 browser.sleep(2000);

	 let iFrame1 = browser.driver.findElement(By.id('RiskFrame'));
	 browser.switchTo().frame(iFrame1);
	
	/*let cancel_button = element(by.id('cancel_engagement_request'));
	cancel_button.click();*/
	
let title_textbox = element(by.xpath('//span[text()="Title"]/following::input[1]')); //OR use xpath('//*[@ng-model="comp.answers[comp.config.itemId]"]'));
	title_textbox.sendKeys('Test_P003');	
	browser.sleep(3000);
	let commodity_textbox = element(by.xpath('//span[text()="Commodity"]/following::input[1]'));;
	commodity_textbox.sendKeys('Data base reporting software').click();
	browser.sleep(1000);
	const hiddenElement = element.all(by.xpath('//div[@awname="app_div"]')).first();
	browser.driver.executeScript('',hiddenElement.getWebElement().click());
	browser.sleep(2000);
	//browser.actions().sendKeys(protractor.Key.ENTER).perform();
	
	let department_textbox = element(by.xpath('//span[text()="Department"]/following::input[1]'));;
	department_textbox.sendKeys('Finance').click();
	browser.sleep(1000);
	
	browser.driver.executeScript('',hiddenElement.getWebElement().click());
	browser.sleep(2000);
//	browser.sleep(1000);
	
	let radioBtn =  element(by.xpath('//span[contains(text(),"FRDM")]/following::input[@value="Yes"][1]'));
	let booleanRadioStatus = false;
	booleanRadioStatus = radioButtonCommon.isRadioButtonSelected(radioBtn);
	console.log('Getting status from function ',booleanRadioStatus);
	
	radioButtonCommon.clickRadioButton(radioBtn);

	browser.sleep(2000);	

	radioBtn.isSelected().then(variableRadioSelected=>{
		console.log('Is radio button selected after click? ',variableRadioSelected);
	})
	
//	browser.sleep(20000);
	let Next_button = element.all(by.xpath('//span[text()="Next"]')).first();
	Next_button.click();
	
	browser.sleep(2000);	
})



it('Inherent screening', function(){
	
	
	/*let iFrame2 = browser.driver.findElement(By.id('RiskFrame'));
	 browser.switchTo().frame(iFrame2); */
	
	///locators
	let Triggered_Attribute_2 = element(by.xpath('//span[contains(text(),"cloud based hosting arrangements")]/following::input[@value="Yes"][1]'));
	let Triggered_Attribute_3 = element(by.xpath('//span[contains(text(),"telecommunication or data center service?")]/following::input[@value="Yes"][1]'));
	let Triggered_Attribute_4 = element(by.xpath('//span[contains(text(),"involve software development")]/following::input[@value="Yes"][1]'));
/*	let Triggered_Attribute_5 = element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[5]'));
	let Triggered_Attribute_6 = element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[7]'));
	let Triggered_Attribute_7 = element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[9]'));
	let Triggered_Attribute_8 = element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[11]'));
*/	let Triggered_Attribute_9= element(by.xpath('//span[contains(text(),"processing of cash or physical assets")]/following::input[@value="Yes"][1]'));
/*	let Triggered_Attribute_10= element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[15]'));
	let Triggered_Attribute_11= element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[17]'));
	let Triggered_Attribute_12 = element.all(by.xpath('//span[@class="sap-icon--slim-arrow-down"]')).first();
	let Triggered_12_dropdown =  element(by.xpath('//span[text()="<1mil EUR"]'));
	let Triggered_Attribute_13 = element.all(by.xpath('//span[@class="sap-icon--slim-arrow-down"]')).get(1);
	let Triggered_13_dropdown = element(by.xpath('//span[text()="Low or Insignificant"]'));*/

	Triggered_Attribute_2.click();
	Triggered_Attribute_3.click();
	Triggered_Attribute_4.click();
	/*Triggered_Attribute_5.click();
	Triggered_Attribute_6.click();
	browser.sleep(1000);
	Triggered_Attribute_7.click();
	browser.executeScript("arguments[0].click()",Triggered_Attribute_7);
	browser.sleep(1000);
	Triggered_Attribute_8.click();
	browser.executeScript("arguments[0].click()",Triggered_Attribute_8);
	browser.sleep(1000);*/
	Triggered_Attribute_9.click();
	browser.executeScript("arguments[0].click()",Triggered_Attribute_9);
	browser.sleep(1000);
	/*Triggered_Attribute_10.click();
	browser.executeScript("arguments[0].click()",Triggered_Attribute_10);
	browser.sleep(1000);
	Triggered_Attribute_11.click();
	browser.executeScript("arguments[0].click()",Triggered_Attribute_11);
	
	Triggered_Attribute_12.click();
	browser.executeScript("arguments[0].click()",Triggered_12_dropdown);
	
	Triggered_Attribute_13.click();
	browser.executeScript("arguments[0].click()",Triggered_13_dropdown);
	
	*/
	browser.sleep(2000);
	let NextOnTop_button = element.all(by.xpath('//span[text()="Next"]')).first();
		//element(by.xpath('//span[text()="Next"]')); // OR use xpath '//span[text()="Next"]'
	NextOnTop_button.click();
	
	browser.sleep(2000);
})

it('Supplier Risk',function(){
	
	let searchSupplier_textbox= element(by.xpath('//input[@awname="app_input_category_search_input_box"]'));
	searchSupplier_textbox.sendKeys('accenture').click();
	browser.sleep(2000);
	 
	const hiddenElement = element.all(by.xpath('//div[@awname="app_div"]')).first();
	browser.driver.executeScript('',hiddenElement.getWebElement().click());
	browser.sleep(2000);
	let save_button = element.all(by.xpath('//span[text()="Save"]')).first();
	save_button.click();
	browser.sleep(2000);
	
	let setSupplier_button = element(by.buttonText('Set Supplier'));
	setSupplier_button.click();
	browser.sleep(20000);
})


