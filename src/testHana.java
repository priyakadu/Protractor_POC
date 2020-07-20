import java.sql.Connection;
import java.sql.ResultSet;

/*	import java.sql.*;
public class testHana {
	

	
	   public static void main(String[] argv) {
	      Connection connection = null;
	      try {                
	         connection = DriverManager.getConnection(
	            "jdbc:sap:// hana300.sc1-lab1.ariba.com:30041?reconnect=true","SQLUSER","Aladdin1");                
	      } catch (SQLException e) {
	         System.err.println("Connection Failed. User/Passwd Error?");
	         return;
	      }
	      if (connection != null) {
	         try {
	            System.out.println("Connection to HANA successful!");
	            Statement stmt = connection.createStatement();
	            ResultSet resultSet = stmt.executeQuery("Select 'hello world' from dummy");
	            resultSet.next();
	            String hello = resultSet.getString(1);
	            System.out.println(hello);
	         } catch (SQLException e) {
	            System.err.println("Query failed!");
	         }
	     }
	   }
	}
*/

public class testHana {
	 public static void main(String[] argv) {

try {
	   Class.forName("com.sap.db.jdbc.Driver");
	   String url ="jdbc:sap:// hana300.sc1-lab1.ariba.com:30015?reconnect=true"; //"jdbc:sap://xx.x.x.xxx:30015/DBNAME"; //IP Address of HANAsystem followed by Port number
	   String user ="SQLUSER";
	   String password = "Aladdin1";
	   Connection cn = java.sql.DriverManager.getConnection(url, user, password);
	   ResultSet rs = cn.createStatement().executeQuery("CALL Test.STORED_PROC");
	   // ...Enter the action here
	   rs.next();
       String hello = rs.getString(1);
       System.out.println(hello);
	} catch(Exception e) {
	   e.printStackTrace();
	}

	 }
}
