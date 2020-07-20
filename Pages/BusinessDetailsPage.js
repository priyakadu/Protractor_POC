let BusinessDetailsPage = function(){
	
//locators
let title_textbox = element(by.model('comp.answers[comp.config.itemId]'));
let commodity_textbox = element(by.xpath('//span[text()="Commodity"]/following::input[1]'));
let department_textbox = element(by.xpath('//span[text()="Department"]/following::input[1]'));

let cancel_button = element(by.id('cancel_engagement_request'));
let Next_button = element(by.id('next_engagement_request')); // OR use xpath '//span[text()="Next"]'


// member functions

this.businessDetails = function(title, commodity, department){
	title_textbox.sendKeys(title);
	commodity_textbox.sendKeys(commodity);
	department_textbox.sendKeys(department);
	Next_button.click();
}   

this.cancelBusinessDetails = function(){
	cancel_button.click();
}   
	
}

module.exports = new BusinessDetailsPage();  // This statement allows access of above function outside this class