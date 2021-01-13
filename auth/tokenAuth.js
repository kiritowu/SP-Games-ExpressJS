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

var jwt = require('jsonwebtoken');
var config = require('../config');

module.exports = {
    verifyToken: (req, res, next) => {
        // console.log(req.headers);
        var token = req.headers.authorization; //retrieve authorization header’s content
        //console.log(token);

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
                    req.type = decoded.type; //decode the type and store in req for use
                    next();
                }
            });
        }
    },
    generateToken: async (user_id, type, expires = 86400) => {
        // console.log(user_id)
        // console.log(type)
        if(user_id == undefined || type == undefined) throw new Error("User_id or Type is undefined");
        var payload = {
            id: user_id,
            type: type
        }; 
        return jwt.sign(payload, config.key, { expiresIn: expires });
    }
};

