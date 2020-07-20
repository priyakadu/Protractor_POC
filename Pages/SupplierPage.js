let SelectSupplierPage = function(){
	
//locators

	//Due Diligence section locators
	let dueDiligence_toggle = element.all(by.xpath('//button[@class="removeBtnStyle"]'));
	let dueDiligence_menuContainer = element.all(by.xpath('//table[@class="table hierarchyTable overrideTDStyle"]'));
	let dueDiligence_text = element.all(by.xpath('//span[text()="No recommended risk controls for this engagement"]'));
	let firstRowRiskControl = element.all(by.xpath('//td[@ng-bind="control[\'ControlName\']"]')).first();
	let SecondRowRiskControl = element.all(by.xpath('//td[@ng-bind="control[\'ControlName\']"]')).get(1);
	let firstRowAssessment = element.all(by.xpath('//td[@ng-bind="control[\'AssessmentIds\']"]')).first();
	let SecondRowAssessment = element.all(by.xpath('//td[@ng-bind="control[\'AssessmentIds\']"]')).get(1);
	
	// search supplier
	let searchSupplier_textbox= element(by.xpath('//input[@awname="app_input_category_search_input_box"]'));
	let setSupplier_button = element(by.xpath('//button[text()="Set Supplier"]'));
	
	
	//remove supplier
	let removeSupplier_button = element(by.xpath('//span[text()="Remove supplier"]'));
	
let firstRecommendedSupplier = element(by.xpath('//span[text()="Recommended suppliers"]/following::div[5]'));
let selectedSupplier = element(by.xpath('//span[text()="Selected supplier"]/following::div[6]'));



// member functions
this.clickDueDiligenceToggle = function(){
	dueDiligence_toggle.click();
}

this.isDueDiligenceMenuContainerDisplayed = function(){
//	return dueDiligence_menuContainer.isDisplayed();
		dueDiligence_menuContainer.isDisplayed().then(containerYes=>{
		console.log('Due Diligence menu container is displayed?   ',containerYes);
		return containerYes;
	})	
}

this.expandDueDiligenceSection = function(){
	dueDiligence_menuContainer.isDisplayed().then(containerStatus=>{
		console.log('Due Diligence menu container is displayed?   ',containerStatus);	
		
		if(containerStatus!=false){
			browser.sleep(2000);
			console.log('Due Diligence toggle is already Expanded');
		}	
		else{
			this.clickDueDiligenceToggle();
			browser.sleep(2000);
			console.log('Due Diligence toggle got expanded');
		}
	})	
}// End of expandDueDiligenceSection function

this.collapseDueDiligenceSection = function(){
	dueDiligence_menuContainer.isDisplayed().then(containerStatus=>{
		console.log('Due Diligence menu container in collapse is displayed?   ',containerStatus);	
		
		if(containerStatus!=false){
			this.clickDueDiligenceToggle();
			browser.sleep(2000);
			console.log('Due Diligence toggle got collapsed now');
		}		
		else{
			browser.sleep(2000);
			console.log('Due Diligence toggle is already Collapse');
			
		}
	})	
}// End of collapseDueDiligenceSection function

this.isDueDiligenceSectionBlank = function(){
	
	dueDiligence_text.isDisplayed().then(isBlank=>{
		console.log('Is due diligence section blank?: ',isBlank);	
	
		if(isBlank!=false){
			//fail test case here
			console.log('This Test case fails. Reason of failure: Due Diligence section cannot be blank.');			
		}else{
			// pass test case here
			console.log('Due Diligence section is NOT blank');
		}
	})	
	
}// End of isDueDiligenceSectionBlank function

// Below function will be used when Due Diligence section is blank
this.getTextOfDueDiligence = function(){
	
	dueDiligence_text.getText().then(function(textValue){
		console.log('Text seen on Due Diligence section is = ',textValue);
		//expect(textValue).toEqual('No recommended risk controls for this engagement');
		if(textValue=='No recommended risk controls for this engagement'){
			//fail test case here
			console.log('This Test case fails. Reason of failure: \"No recommended risk controls for this engagement\". ');
		}
		else{
			console.log('\"No recommended risk controls for this engagement\". text is not displayed. This is correct working.');
		}
		
	})

}// End of getTextOfDueDiligence function

 this.VerifyRiskControlColumnText = function(rowNumber){
	 if(rowNumber==1){
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
	 }
 if(rowNumber==2){
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
	 }
 } //End of VerifyRiskControlColumnText function
 
 this.VerifyAssessmentColumnText = function(rowNumber){
	 if(rowNumber==1){
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
	 }
	 if(rowNumber==2){
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
	 }
 } // End of VerifyAssessmentColumnText function
	 

this.searchSupplier = function(supplierName){
	searchSupplier_textbox.sendKeys(supplierName).click();
	browser.sleep(2000);
	 
	const hiddenElement = element.all(by.xpath('//div[@awname="app_div"]')).first();
	browser.driver.executeScript('',hiddenElement.getWebElement().click());
	browser.sleep(1000);
}

this.setSupplier = function(nameOfSupplier){
	searchSupplier_textbox.sendKeys(nameOfSupplier).click();
	browser.sleep(2000);
	 
	const hiddenElement = element.all(by.xpath('//div[@awname="app_div"]')).first();
	browser.executeScript("arguments[0].scrollIntoView()",hiddenElement);
	browser.driver.executeScript('',hiddenElement.getWebElement().click());
	browser.sleep(10000);
	
	setSupplier_button.isEnabled().then(btnSelected=>{
		console.log('Is set Supplier button enabled?:   ',btnSelected);
		//setSupplier_button.click();
		
		if(btnSelected!=false){
			browser.executeScript("arguments[0].scrollIntoView()",setSupplier_button);
			browser.sleep(1000);
			browser.executeScript("arguments[0].click()",setSupplier_button);
			console.log('Set Supplier button is clicked.');
		}else{
			console.log('Set Supplier button is Disabled.');
			// fail test case here
		}
		
	})
	browser.sleep(2000);
}// End of setSupplier function

this.removeSelectedSupplier = function(){
	removeSupplier_button.isPresent().then(btnSelected=>{
		console.log('Is remove Supplier button present?:   ',btnSelected);
		
		if(btnSelected!=false){
			browser.executeScript("arguments[0].scrollIntoView()",removeSupplier_button);
			browser.sleep(1000);
			browser.executeScript("arguments[0].click()",removeSupplier_button);
			console.log('Remove Supplier button is clicked.');
		}else{
			console.log('Remove Supplier button is Disabled.');
			// fail test case here
		}
	})
	
}// End of removeSelectedSupplier function


this.methodToGetTheText = function () {
	
	dueDiligence_text.getText().then(function (elementText){
		console.log('Within method = ',elementText);
		return elementText;
	}	)
	
  }// End of methodToGetTheText function

   
	
}

module.exports = new SelectSupplierPage();  // This statement allows access of above function outside this class