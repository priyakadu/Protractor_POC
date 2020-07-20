let Buymore_Home = function(){
	
//locators
//let firstNumber_input = element(by.model('first')); 
let username_textbox = element(by.id('UserName'));
let password_textbox = element(by.id('Password'));
let login_button = element(by.className('w-login-form-btn'));

let createMenu_dropdown = element (by.xpath('//*[@id="_ikf0vb"]/div/span[2]'));
let engagementRequest_menu = element (by.linkText('Engagement Request'));

// member functions
     this.get = function(url){
    browser.get(url);
    }
   
this.login = function(username, password){
	username_textbox.sendKeys(username);
	password_textbox.sendKeys(password);
	login_button.click();
}
    this.CreateEngagementRequest = function(){
    createMenu_dropdown.click();
	engagementRequest_menu.click();
    }

}

module.exports = new Buymore_Home();  // This statement allows access of above function outside this class