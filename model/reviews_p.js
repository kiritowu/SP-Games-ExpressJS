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
Database = require("./db_promise");
conn = new Database();

module.exports = {
    //Qns 10: add a new review to the database for a given user and game
    createReview: (gameID, userId, review, callback) => {
        var result;
        var content = review.content;
        var rating = parseInt(review.rating);
        conn.connect()
            .then(() => {
                var createReviewSQL = `
                INSERT INTO 
                reviews 
                (fk_user_id,fk_game_id,content,rating) 
                VALUES 
                (?,?,?,?);
                `;
                return conn.query(createReviewSQL, [userId, gameID, content, rating]);
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
    //Qns 11: retrieve reviews of particular game including username
    readReviews: (gameID, callback) => {
        var reviews;
        conn.connect()
            .then(() => {
                var getReviewsSQL = `
                SELECT 
                g.game_id, r.content, r.rating, u.username, r.created_at 
                FROM 
                reviews r, users u, games g  
                WHERE
                r.fk_game_id = g.game_id AND u.user_id = r.fk_user_id AND g.game_id = ?;
                `;
                return conn.query(getReviewsSQL, [gameID]);
            }).then((data) => {
                reviews = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, reviews);
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    }
};


