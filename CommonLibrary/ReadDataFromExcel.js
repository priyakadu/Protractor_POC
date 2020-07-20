var XLSX=require('xlsx');

let ReadDataFromExcel = function(){
	
	this.getValueFromCell = function(excelFilePath,indexOfSheet,cellNumber){
		var workbook=XLSX.readFile(excelFilePath);
		var sheet = workbook.SheetNames[indexOfSheet];
		var BusinessDetails_worksheet = workbook.Sheets[sheet];
		var actualCellValue = BusinessDetails_worksheet[cellNumber].v;
		return actualCellValue;
	}
	
}

module.exports = new ReadDataFromExcel(); 