

// This spec is created for understanding the syntax of jasmine
let homePage = require('../pages/HomePage'); // This is like import
describe('Calculator suite',function(){

/* Without POM

it('Addition test',function(){

// Enter URL
browser.get('http://juliemr.github.io/protractor-demo/');
expect(browser.getTitle()).toEqual('Super Calculator');
   
// locate elements   
       let numOne = element(by.model('first')); 
       let addButton = element(by.css('[value="ADDITION"]'));
       let numTwo = element(by.model('second'));
       let goButton = element(by.css('[ng-click="doAddition()"]'));
       let finalResult = element(by.cssContainingText('.ng-binding','60')); 
   
   // perform actual steps
       numOne.sendKeys(20);
       addButton.click();
       numTwo.sendKeys(40);
       
       goButton.click();
       
       browser.sleep(2000);
       expect(finalResult.getText()).toEqual('60');  

       console.log("Output of addition = ");
       console.log(finalResult.getText());
});

*/

// Using POM
it('Addition test',function(){

// Enter URL
homePage.get('http://juliemr.github.io/protractor-demo/');
   
// perform actual steps
       homePage.enterFirstNumber('30');
       homePage.enterSecondNumber('40');
       homePage.selectAdditionSymbol();
       homePage.clickGoButton();
       
       browser.sleep(2000);
       homePage.verifyResult('70'); 

       console.log("Output of addition = ");
      // console.log(finalResult.getText());
});

it('Subtraction test',function(){
// Enter URL
homePage.get('http://juliemr.github.io/protractor-demo/');
   
// perform actual steps
       homePage.enterFirstNumber('20');
       homePage.enterSecondNumber('10');
       homePage.selectSubtractiontionSymbol();
       homePage.clickGoButton();
       
       browser.sleep(2000);
       homePage.verifyResult('100'); 
});

it('Multiplication test',function(){});

it('Division test',function(){});
});
