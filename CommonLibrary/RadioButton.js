let RadioButton = function(){
	
	this.isRadioButtonSelected = function(element){
		element.isSelected().then(variableRadioSelected=>{
			console.log('Is radio button in function works ',variableRadioSelected);
			return variableRadioSelected;
		})
	}
	
	
	this.clickRadioButton = function(element){
		element.click();
		browser.executeScript("arguments[0].click()",element);
	}
	
	
}

module.exports = new RadioButton(); 