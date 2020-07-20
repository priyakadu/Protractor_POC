let InherentRiskScreeningPage=function()
	{
	
///locators
let Triggered_Attribute_2 = element(by.xpath('//span[text()="Triggered Attributes"]//following::input[@class="ng-pristine ng-untouched ng-valid ng-not-empty"][1]'));
let Triggered_Attribute_3 = element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[@class="ng-pristine ng-untouched ng-valid ng-not-empty"][1]'));
// let Triggered_Attribute_4 = element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[3]'));
let Triggered_Attribute_4 = element(by.xpath('//span[text()="Will / Does the service involve software development?"]//following::input[1]'));
let Triggered_Attribute_5 = element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[5]'));
let Triggered_Attribute_6 = element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[7]'));
let Triggered_Attribute_8 = element(by.xpath('//span[text()="Will / Does the supplier provide internet facing applications or network infrastructure?"]//following::input[1]'));
let Triggered_Attribute_16= element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[8]'));
let Triggered_Attribute_15_textbox= element(by.xpath('//span[text()="Sharada Question 1"]//following::input[1]'));
let Triggered_Attribute_17_textbox= element(by.xpath('//span[text()="Supplier Answer Type"]//following::input[1]'));
let Triggered_Attribute_20= element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[11]'));
let Triggered_Attribute_21= element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[13]'));
let Triggered_Attribute_22= element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[15]'));
let Triggered_Attribute_23= element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[17]'));
let Triggered_Attribute_24= element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[19]'));
let Triggered_Attribute_25= element(by.xpath('//span[text()="Will / Does the service involve telecommunication or data center service?"]//following::input[21]'));
let Click_SaveButton =element(by.xpath('//span[text()="CD1_6"]//following::span[text()="Save"]'));
//let Click_NextButton =element(by.xpath('//span[text()="Save"]//following::span[text()="Next"]"));


this.inherentRiskMandatoryFields = function(){
	Triggered_Attribute_2.click();
	Triggered_Attribute_3.click();
	Triggered_Attribute_4.click();
	Triggered_Attribute_5.click();
	Triggered_Attribute_6.click();
}
this.InherentRisk_Questions=function(Triggered_Attribute_15,Triggered_Attribute_17){
	Triggered_Attribute_15_textbox.sendKeys(Triggered_Attribute_15);
	Triggered_Attribute_2.click();
	Triggered_Attribute_3.click();
	Triggered_Attribute_4.click();
	Triggered_Attribute_9.click();
	Triggered_Attribute_16.click();
	Triggered_Attribute_17_textbox.sendKeys(Triggered_Attribute_17);
	Triggered_Attribute_20.click();
	Triggered_Attribute_21.click();
	Triggered_Attribute_22.click();
	Triggered_Attribute_23.click();
	Triggered_Attribute_24.click();
	Triggered_Attribute_25.click();	
	Click_SaveButton.click();	
	}
}
module.exports = new InherentRiskScreeningPage();