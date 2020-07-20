let LoginPage = function(){
	
//locators

let username_textbox = element(by.id('UserName'));
let password_textbox = element(by.id('Password'));
let login_button = element(by.className('w-login-form-btn'));

// member functions

    this.get = function(url){
   		browser.get(url);
    }
   
	this.login = function(username, password){
		username_textbox.sendKeys(username);
		password_textbox.sendKeys(password);
		login_button.click();
	}
    
}

module.exports = new LoginPage();  // This statement allows access of above function outside this class