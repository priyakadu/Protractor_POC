let ReviewRequestPage = function(){
	
//locators
let title_value = element(by.xpath('//span[text()="Title"]/following::span[starts-with(@awname,"app_span_view-only-")]'));
let commodity_value = element(by.xpath('//span[text()="Commodity"]/following::span[2]'));
let region_value = element(by.xpath('//span[text()="Region"]/following::span[2]'));
let department_value = element(by.xpath('//span[text()="Department"]/following::span[2]'));
let outsourcingEngagement_question = element (by.xpath('//span[text()="Is this an outsourcing engagement?"]/following::div[3]'));
let frdmIndustry_question = element(by.xpath('//span[contains(text(),"FRDM industry")]/following::div[3]'));

let triggeredAttribute_2_value = element(by.xpath('//span[contains(text(),"cloud based hosting arrangements")]/following::div[3]'));
let triggeredAttribute_3_value = element(by.xpath('//span[contains(text(),"telecommunication or data center service")]/following::div[3]'));
let triggeredAttribute_4_value = element(by.xpath('//span[contains(text(),"involve software development")]/following::div[3]'));
let triggeredAttribute_9_value = element(by.xpath('//span[contains(text(),"processing of cash or physical assets")]/following::div[3]'));


let selectedSupplier_1_name = element(by.xpath('//div[@class="companyNameContainer"]/div/span'));
// member functions

//let riskControlsTable = element.all(by.xpath('//tbody[@ng-if="listData.pageList.sortedItems && listData.pageList.sortedItems.length > 0"]')).first();
let riskControlsTable = element.all(by.id('paginatedListTable')).first();

let assessmentTable = element.all(by.xpath('//div[@ng-if="reviewRequestVm.showRiskAssessments"]//following::tbody[1]'));

this.getRiskControlsTableData = function(indexOfColumn){
	// get rows 
	var rows = riskControlsTable.all(by.tagName("tr"));

	// get cell values
	var cells = rows.all(by.tagName("td"));
	
	return cells.get(indexOfColumn).getText();
}

this.getAssessmentsTableData = function(indexOfColumn){
	// get rows 
	var rows = assessmentTable.all(by.tagName("tr"));

	// get cell values
	var cells = rows.all(by.tagName("td"));
	
	return cells.get(indexOfColumn).getText();
}

this.getTitleValue = function (){
	return title_value.getText();
}

this.getCommodityValue = function (){
	return commodity_value.getText();
}

this.getRegionValue = function (){
	return region_value.getText();
}

this.getDepartmentValue = function (){
	return department_value.getText();
}
this.getOutsourcingEngagementQuestionValue = function (){
	return outsourcingEngagement_question.getText();
}

this.getFRDMindustryQuestionValue = function (){
	return frdmIndustry_question.getText();
}

this.getTriggeredAttribute_2_Value = function (){
	return triggeredAttribute_2_value.getText();
}

this.getTriggeredAttribute_3_Value = function (){
	return triggeredAttribute_3_value.getText();
}

this.getTriggeredAttribute_4_Value = function (){
	return triggeredAttribute_4_value.getText();
}

this.getTriggeredAttribute_9_Value = function (){
	return triggeredAttribute_9_value.getText();
}

this.getSelectedSupplier_1_Name = function (){
	browser.executeScript("arguments[0].scrollIntoView()",selectedSupplier_1_name);
	return selectedSupplier_1_name.getText();
}

	
}

module.exports = new ReviewRequestPage();  // This statement allows access of above function outside this class