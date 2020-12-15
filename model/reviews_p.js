Database = require("./db_promise");
conn = new Database();

module.exports = {
    //Qns 10: add a new review to the database for a given user and game
    createReview: (gameID, userId, review, callback) => {
        var result;
        var content = review.content;
        conn.connect()
            .then(() => {
                var createReviewSQL = `
                INSERT INTO 
                reviews 
                (fk_user_id,fk_game_id,content) 
                VALUES 
                (?,?,?) 
                WHERE fk_user_id = ? , fk_game_id = ?
                `;
                return conn.query(createReviewSQL, [userId, gameID, content, userId, gameID]);
            }).then((data) => {
                result = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, result);
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
                r.content, r.rating, u.username, g.game_id 
                FROM 
                reviews r, users u, games g  
                WHERE
                r.fk_game_id = ? AND g.game_id = ? AND u.user_id = r.fk_user_id;
                `;
                return conn.query(getReviewsSQL, [gameID, gameID]);
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


