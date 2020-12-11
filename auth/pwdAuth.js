const bcrypt = require('bcrypt');

module.exports = {
    createUserAuth: async (usr_pwd, saltRounds = 10) => {
        // Generate and return the salt and hash key based on the user password
        var hashing = "";
        var salting = "";
        return bcrypt.genSalt(saltRounds)
            .then(salt => {
                salting = salt;
                return bcrypt.hash(usr_pwd, salting);
            }).then(hash => {
                hashing = hash;
                //Return user hash and salt key to be saved in db
                return {
                    "hash": hashing,
                    "salt": salting
                };
            }).catch(() => {
                //Return null values if Error is thrown
                return {
                    "hash": null,
                    "salt": null
                };
            });
    },
    validateUserAuth: async (usr_pwd, oriHash, oriSalt) => {
        // Re-hash based on the current password inputted and original Salt key 
        var curHash = await bcrypt.hash(usr_pwd, oriSalt);
        if (curHash === oriHash) {
            //Return True if both Hashed key is correct
            return true;
        }
        return false;
    }
};

// To test Result Only
// test = async () => {
//     let value = await createUserAuth("thisismypwsd");
//     console.log(value);
// }
// test();

// createUserAuth("thisismypwsd")
//     .then(oriAuth => {
//         return validateUserAuth("thisismypwsd", oriAuth.hash, "$2b$10$nlGAvzic6KYik/lwpufq8u");
//     })
//     .then(bool => console.log(bool));

// bcrypt.genSalt(10).then(salt=>console.log(salt))