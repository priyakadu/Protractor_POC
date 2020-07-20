let readDataFromExcel = require('../CommonLibrary/ReadDataFromExcel'); 
let loginPage = require('../pages/LoginPage');
var propertiesReader = require('properties-reader');
var properties = propertiesReader('C:\\Users\\kadu_p\\eclipse-workspace\\Protractor\\Config\\config.properties');

let reviewRequestPage = require('../Pages/ReviewRequestPage');

beforeAll(function() {
    browser.waitForAngularEnabled(false);
    browser.ignoreSynchronization = true;
});

describe('Read data from Excel',function(){
	
	let excelSheetPath = 'C:\\Users\\kadu_p\\eclipse-workspace\\Protractor\\TestData\\InputData.xlsx';
	

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
		
		let iFrame1 = browser.driver.findElement(By.id('RiskFrame'));
		 browser.switchTo().frame(iFrame1);	 
		 browser.sleep(2000);
		let engagementRequest_hyperlink = element(by.linkText('Engagement requests'));
		engagementRequest_hyperlink.click();
		browser.sleep(2000);
		let newRequests_tab = element.all(by.className('dashboardTab removeBtnStyle')).first();
		newRequests_tab.click();
		browser.sleep(2000);

		let engagementName_link = element.all(by.xpath('//a[text()="Test_p002"]')).first();
		engagementName_link.click();
		browser.sleep(2000);
	})
	
	var Title, Commodity, Department, Region,Supplier1;
	var assessmentRow1, assessmentRow2, controlsRow1, controlsRow2;
	
	it('Review Request Page verification',function(){
		
		reviewRequestPage.getRiskControlsTableData(1).then(elementText=>{
			console.log('Risk Control Row1 value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual('Critical data element');		
			})
		reviewRequestPage.getRiskControlsTableData(6).then(elementText=>{
			console.log('Assessment Row1 value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual('Capacity Management Policy');		
			})
		reviewRequestPage.getRiskControlsTableData(12).then(elementText=>{
			console.log('Risk Control Row2 value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual('ITDR check Singapore');		
			})
		reviewRequestPage.getRiskControlsTableData(17).then(elementText=>{
			console.log('Assessment Row2 value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual('Call Tree');		
			})
		assessmentRow1 = readDataFromExcel.getValueFromCell(excelSheetPath,3,'B2');
		assessmentRow2 = readDataFromExcel.getValueFromCell(excelSheetPath,3,'C2')
		controlsRow1 = readDataFromExcel.getValueFromCell(excelSheetPath,3,'B5')
		controlsRow2 = readDataFromExcel.getValueFromCell(excelSheetPath,3,'C5')
		
		reviewRequestPage.getAssessmentsTableData(1).then(elementText=>{
			console.log('Assessment Row1 value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual(assessmentRow1);		
			})
		reviewRequestPage.getAssessmentsTableData(4).then(elementText=>{
			console.log('Controls Row1 value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual(controlsRow1);		
			})
		reviewRequestPage.getAssessmentsTableData(9).then(elementText=>{
			console.log('Assessment Row1 value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual(assessmentRow2);		
			})
		reviewRequestPage.getAssessmentsTableData(12).then(elementText=>{
			console.log('Controls Row2 value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual(controlsRow2);		
			})
		
	Title = readDataFromExcel.getValueFromCell(excelSheetPath,0,'B1');
		Commodity = readDataFromExcel.getValueFromCell(excelSheetPath,0,'B2');
		Department = readDataFromExcel.getValueFromCell(excelSheetPath,0,'B3');
		Region = readDataFromExcel.getValueFromCell(excelSheetPath,0,'B4');
		
		Supplier1 = readDataFromExcel.getValueFromCell(excelSheetPath,2,'B1');
		console.log('Title from Excel =',Title);
		console.log('Commodity  from Excel = ',Commodity);
		console.log('Department  from Excel = ',Department);
		console.log('Region  from Excel = ',Region);
	
		// Getting data from review request page and verifying it with excel
		reviewRequestPage.getTitleValue().then(elementText=>{
			console.log('Title value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual(Title);		
			})
			
		reviewRequestPage.getCommodityValue().then(elementText=>{
			console.log('Commodity value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual(Commodity);		
			})			
		reviewRequestPage.getRegionValue().then(elementText=>{
			console.log('Region value seen on Review Request screen is = ',elementText);
			expect(elementText).toEqual(Region);		
			})
		reviewRequestPage.getDepartmentValue().then(elementText=>{
				console.log('Department value seen on Review Request screen is = ',elementText);
				expect(elementText).toEqual(Department);		
			})			
		reviewRequestPage.getOutsourcingEngagementQuestionValue().then(elementText=>{
				console.log('getOutsourcingEngagementQuestion value seen on Review Request screen is = ',elementText);
				expect(elementText).toEqual('Yes');		
			})
		reviewRequestPage.getFRDMindustryQuestionValue().then(elementText=>{
				console.log('getFRDMindustryQuestion value seen on Review Request screen is = ',elementText);
				expect(elementText).toEqual('Yes');		
			})
		reviewRequestPage.getTriggeredAttribute_2_Value().then(elementText=>{
				console.log('getTriggeredAttribute_2_Value seen on Review Request screen is = ',elementText);
				expect(elementText).toEqual('Yes');		
			})
		reviewRequestPage.getTriggeredAttribute_3_Value().then(elementText=>{
				console.log('getTriggeredAttribute_3_Value seen on Review Request screen is = ',elementText);
				expect(elementText).toEqual('Yes');		
			})
		reviewRequestPage.getTriggeredAttribute_4_Value().then(elementText=>{
				console.log('getTriggeredAttribute_4_Value seen on Review Request screen is = ',elementText);
				expect(elementText).toEqual('Yes');		
			})
		reviewRequestPage.getTriggeredAttribute_9_Value().then(elementText=>{
				console.log('getTriggeredAttribute_9_Value seen on Review Request screen is = ',elementText);
				expect(elementText).toEqual('Yes');		
			})
			
			browser.sleep(3000);
		reviewRequestPage.getSelectedSupplier_1_Name().then(supplierName=>{
				console.log('getSelectedSupplier_1_Name seen on Review Request screen is = ',supplierName);
				expect(supplierName).toEqual(Supplier1);		
			})
	
	})
});
