//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+

const dbUser = 'root';
const dbPassword = 'root';
const schem = "sp_games";

const mysql = require('mysql');
const dbconnect = {
    getConnection: (schema = schem) => {
        return mysql.createConnection({
            host: "localhost",
            user: dbUser, 
            password: dbPassword ,
            database: schema,
            port:3306,
            dateStrings: true,
          
        });
    }
};
module.exports = dbconnect;
