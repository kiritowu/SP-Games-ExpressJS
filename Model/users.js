//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+

const db = require("./db_config");

module.exports = {
    getAllUsers: (callback) => {
        var conn = db.getConnection();
        conn.connect((err) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                var getAllUsersSQL = `
                    SELECT * FROM users;
                `;// Careful the password not selecting
                conn.query(getAllUsersSQL, (err, users) => {
                    conn.end();
                    if (err) {
                        console.error(err);
                        return callback(err, null);
                    } else {
                        return callback(null, users);
                    }
                });
            }
        });
    },
    createUser: (user, callback) => {
        var conn = db.getConnection();
        conn.connect((err) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                var username = user.username;
                var email = user.email;
                var type = user.type;
                var profile_pic_url = user.profile_pic_url;
                var createUserSQL = `
                    INSERT INTO users(username, email, type, profile_pic_url)
                    VALUES (?, ?, ?, ?);
                `;
                conn.query(createUserSQL, [username, email, type, profile_pic_url], (err, result) => {
                    conn.end();
                    if (err) {
                        console.error(err);
                        return callback(err, null);
                    } else {
                        return callback(null, result.insertId);
                    }
                });
            }
        });
    },
    getUserWithID: (user_id, callback) => {
        var conn = db.getConnection();
        conn.connect((err) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                var getUserWithIDSQL = `
                    SELECT * FROM users WHERE user_id = ?;
                `;
                conn.query(getUserWithIDSQL, [user_id], (err, user) => {
                    conn.end();
                    if (err) {
                        console.error(err);
                        return callback(err, null);
                    } else {
                        return callback(null, user);
                    }
                });
            }
        });
    }
};