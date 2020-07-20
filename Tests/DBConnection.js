var hdb    = require('hdb');
var client = hdb.createClient({
  host           : 'hana167.lab1.ariba.com', // system database host
  instanceNumber : '00',       // instance number of the HANA system
  databaseName   : 'SRDEV3',      // name of a particular tenant database
  user           : 'QAUSER',     // user for the tenant database
  password       : 'Aladdin1'    // password for the user specified
});

client.on('error', function (err) {
  console.error('Network connection error', err);
});
client.connect(function (err) {
  if (err) {
  	return console.error('Connect error', err);
  }
  
  let query = 'select top 2 * From acs.organization_sm';
  client.exec(query, function (err, rows) {
	client.end();
    if (err) {
      return console.error('Execute error:', err);
    }
    console.log('User:', client.get('user'));
    console.log('SessionCookie:', client.get('SessionCookie'));
    console.log('Results:', rows);
  });
});


//'use strict';
//const { performance } = require('perf_hooks');
//var t0 = performance.now();
//var util = require('util');
//var hana = require('@sap/hana-client');
//
//var connOptions = {
//    serverNode: 'hana167.lab1.ariba.com:30047',
//    UID: 'QAUSER',
//    PWD: 'Aladdin1',
//    encrypt: 'true',  //Must be set to true when connecting to SAP HANA Cloud
//    sslValidateCertificate: 'false',  //Must be set to false when connecting
//    //to a HANA, express instance that uses a self signed certificate.
//};
//
//var connection = hana.createConnection();
//connection.connect(connOptions, function(err) {
//    if (err) {
//        return console.error(err);
//    }
//    var sql = 'select TITLE, FIRSTNAME, NAME from HOTEL.CUSTOMER;';
//    var rows = connection.exec(sql, function(err, rows) {
//        if (err) {
//            return console.error(err);
//        }
//        console.log(util.inspect(rows, { colors: false }));
//        var t1 = performance.now();
//        console.log("time in ms " +  (t1 - t0));
//        connection.disconnect(function(err) {
//            if (err) {
//                return console.error(err);
//            }   
//        });
//       
//    });
//    conole.log('test = ',rows);
//});
//