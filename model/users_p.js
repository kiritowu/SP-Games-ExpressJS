Database = require("./db_promise");
const conn = new Database();
const pwdAuth = require("../auth/pwdAuth");
const tokenAuth = require("../auth/tokenAuth");

module.exports = {
    //Qns 1: Read all informations of users except password
    getAllUsers: (callback) => {
        var users;
        conn.connect()
            .then(() => {
                var getAllUsersSQL = `
                    SELECT 
                    u.user_id, u.username, u.email, u.type, u.profile_pic_url
                    FROM users u;
                `;
                return conn.query(getAllUsersSQL, []);
            }).then((data) => {
                users = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, users);
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    },
    //Qns 2: Create user with password 
    createUser: (user, callback) => {
        var result;
        var username = user.username;
        var email = user.email.toLowerCase(); //convert email into lower cases since email is not case-sensitive
        var type = user.type[0].toUpperCase() + user.type.slice(1).toLowerCase(); //Capitalize the type 
        var profile_pic_url = user.profile_pic_url.toLowerCase(); 
        var raw_pwd = user.password;
        conn.connect()
            .then(() => {
                return pwdAuth.createUserAuth(raw_pwd);
            }).then(pwd => {
                var hased_pwd = pwd.hash;
                var salt = pwd.salt;
                var createUserSQL = `
                    INSERT INTO 
                    users(username, email, type, profile_pic_url, password, salt)
                    VALUES (?, ?, ?, ?, ? ,?);
                `;
                return conn.query(createUserSQL, [username, email, type, profile_pic_url, hased_pwd, salt]);
            }).then((data) => {
                result = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, result.insertId);
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    },
    //Qns 3: Read information of users with specific id
    getUserWithID: (user_id, callback) => {
        var user;
        conn.connect()
            .then(() => {
                var getUserWithIDSQL = `
                SELECT
                u.user_id, u.username, u.email, u.type, u.profile_pic_url
                FROM users u
                WHERE user_id = ?;
                `;
                return conn.query(getUserWithIDSQL, [user_id]);
            }).then((data) => {
                user = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, user);
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    },
    //Qns 12: Login user with the credential
    userLogin: (loginCredential, callback) => {
        var email = loginCredential.email;
        var raw_pwd = loginCredential.password;
        var userCredential;
        var type;
        var user_id;
        var username;
        conn.connect()
            .then(() => {
                var userLoginSQL = `
                SELECT * FROM users WHERE email = ?;
                `;
                return conn.query(userLoginSQL, [email]);
            }).then((data) => {
                userCredential = data[0];
                if (userCredential === undefined) {
                    throw { errCode: 401, message: "Wrong Email! Please try again!" };
                }
                type = userCredential.type;
                user_id = userCredential.user_id;
                username = userCredential.username;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                var hashed_pwd = userCredential.password;
                var salt = userCredential.salt;
                return pwdAuth.validateUserAuth(raw_pwd, hashed_pwd, salt);
            }).then((authorised) => {
                if (authorised) {
                    return tokenAuth.generateToken(user_id, type);
                }
                else {
                    throw { errCode: 401, message: "Wrong Password! Please try again!" };
                }
            }).then(token => {
                callback(null, { token: token, username: username });
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    }
};