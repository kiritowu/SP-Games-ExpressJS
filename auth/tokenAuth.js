var jwt = require('jsonwebtoken');
var config = require('../config');

module.exports = {
    verifyToken: (req, res, next) => {
        // console.log(req.headers);
        var token = req.headers.authorization; //retrieve authorization header’s content
        // console.log(token);

        if (!token || !token.includes('Bearer')) { //process the token
            res.status(403);
            return res.send({auth: 'false', message: 'Not authorized!'});
        } else {
            token = token.split('Bearer ')[1]; //obtain the token’s value
            // console.log(token);
            jwt.verify(token, config.key, (err, decoded) => {//verify token
                if (err) {
                    res.status(403);
                    return res.send({auth: 'false', message: 'Not authorized!'});
                } else {
                    // console.log(decoded);
                    req.user_id = decoded.id; //decode the userid and store in req for use
                    req.role = decoded.role; //decode the role and store in req for use
                    next();
                }

            });
        }
    },
    generateToken: async (user_id, role, expires = 86400) => {
        if(user_id == undefined || role == undefined) throw new Error("User_id or Role is undefined");
        var payload = {
            id: user_id,
            role: role
        }; 
        return jwt.sign(payload, config.key, { expiresIn: expires });
    }
};

