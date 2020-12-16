//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+
//.---------------.---------------.
//| Name          | Li Yifan      |
//:---------------+---------------:
//| Class         | DAAA/FT/1B/01 |
//:---------------+---------------:
//| Admission No. | 2011860       |
//'---------------'---------------'


const dbUser = 'root';
const dbPassword = 'kiritowu0818';
const schem = "sp_games";

const mysql = require('mysql');
const dbconnect = {
    getConnection: (schema = schem) => {
        return mysql.createConnection({
            host: "localhost",
            user: dbUser, 
            password: dbPassword ,
            database: schema,// TO cater case of connecting to multiple schema
						// retain DATE as a string
            dateStrings: true
        });
    }
};
module.exports = dbconnect;
