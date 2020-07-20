var hana = require('@sap/hana-client');
 
var conn = hana.createConnection();
 
var conn_params = {
  serverNode  : 'hana300.sc1-lab1.ariba.com:30041',
  uid         : 'SQLUSER',
  pwd         : 'Aladdin1'
};
 
conn.connect(conn_params, function(err) {
  if (err) throw err;
  conn.exec('SELECT Name, Description FROM Products WHERE id = ?', [301], function (err, result) {
    if (err) throw err;
 
    console.log('Name: ', result[0].Name, ', Description: ', result[0].Description);
    // output --> Name: Tee Shirt, Description: V-neck
    conn.disconnect();
  })
});