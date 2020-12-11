//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+

const db = require("./db_config");
const pwdAuth = require("../auth/pwdAuth");
const tokenAuth = require("../auth/tokenAuth");

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
                var raw_pwd = user.password;
                pwdAuth.createUserAuth(raw_pwd)
                    .then(pwd => {
                        var hased_pwd = pwd.hash;
                        var salt = pwd.salt;
                        var createUserSQL = `
                            INSERT INTO users(username, email, type, profile_pic_url, password, salt)
                            VALUES (?, ?, ?, ?, ? ,?);
                        `;
                        conn.query(createUserSQL, [username, email, type, profile_pic_url, hased_pwd, salt], (err, result) => {
                            conn.end();
                            if (err) {
                                console.error(err);
                                return callback(err, null);
                            } else {
                                return callback(null, result.insertId);
                            }
                        });
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
    },
    userLogin: (userCredential, callback) => {
        var conn = db.getConnection();
        conn.connect((err) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                var email = userCredential.email;
                var raw_pwd = userCredential.password;
                var getUserCredentialSQL = `
                    SELECT * FROM users WHERE email = ?;
                `;
                conn.query(getUserCredentialSQL, [email], (err, userCredentials) => {
                    conn.end();
                    if (err) {
                        console.error(err);
                        return callback(err, null);
                    } else {
                        var userCredential = userCredentials[0];
                        if(userCredential == null){
                            return callback({ errCode: 401 }, null);
                        }
                        var hashed_pwd = userCredential.password;
                        var salt = userCredential.salt;
                        var type = userCredential.type;
                        var user_id = userCredential.user_id;
                        var username = userCredential.username;
                        pwdAuth.validateUserAuth(raw_pwd, hashed_pwd, salt)
                            .then(authorised => {
                                if (authorised) {
                                    tokenAuth.generateToken(user_id, type)
                                        .then(token => {
                                            return callback(null, {token:token, username:username});
                                        })
                                        .catch(err=> {
                                            console.error(err); 
                                            return callback(err, null);
                                        });
                                } else {
                                    return callback({ errCode: 401 }, null);
                                }
                            }).catch(console.error);
                    }
                });
            }
        });
    }
};