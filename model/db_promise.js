class Database {
    constructor() {
        this.db = require("./db_config");
    }
    connect() {
        return new Promise((resolve, reject) => {
            this.connection = this.db.getConnection();
            this.connection.connect((err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }
    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
}
module.exports = Database;