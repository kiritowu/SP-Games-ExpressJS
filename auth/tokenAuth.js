//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+


var jwt = require('jsonwebtoken');
var config = require('../config');

module.exports = {
    verifyToken: (req, res, next) => {
        // console.log(req.headers);
        var token = req.cookies.authcookie; //retrieve authorization header’s content
        if (!token) { //process the token
            req.type = 'Public'; //Set user Type of Public if token is not present.
            next();
        } else {
            // console.log(token);
            jwt.verify(token, config.key, (err, decoded) => {//verify token
                if (err) {
                    res.status(403);
                    return res.send({auth: 'false', message: 'Please Login Again'});
                } else {
                    // console.log(decoded);
                    req.user_id = decoded.id; //decode the userid and store in req for use
                    req.type = decoded.type; //decode the type and store in req for use
                    next();
                }
            });
        }
    },
    // checkToken:(req, res, token)=>{
    //     jwt.verify(token, config.key, (err, decoded) => {//verify token
    //         if (err) {
    //             res.status(403);
    //             return res.send({auth: 'false', message: 'Not authorized!'});
    //         } else {
    //             // console.log(decoded);
    //             req.user_id = decoded.id; //decode the userid and store in req for use
    //             req.type = decoded.type; //decode the type and store in req for use
    //         }
    //     });
    // },
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

