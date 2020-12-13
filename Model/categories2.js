module.exports={
// question 6 :Used to add a new game to the database.
    // this includes adding its categories 
    
    // part 1 of qn 6 : to post the game and its relevant information ( title , description, price, platform, year)
    post_game: (title,description,price,platform,year, callback) => {
        var conn = db.getConnection();
        conn.connect((err) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                var sql = `
                INSERT INTO sp_games.games (title,description,price,platform,year) VALUES (?,?,?,?,?);
                
            `;
            //SELECT * FROM sp_games.games -> cannot use multiStatements if not will affect auto increment
      
                conn.query(sql, [title,description,price,platform,year], (err, data) => {
                  // insert the main description of the game
                    conn.end();
                    if (err) {
                        console.error(err);
                        return callback(err, null);
                    } else {
                        return callback(null, data);
                       
                    }
                });
            }
        });
    },
    
    // part 2 of qn6 : to get the id of the game 
    get_id: (title, callback) => {
        var conn = db.getConnection();
        conn.connect((err) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                var sql = `
                SELECT game_id FROM games WHERE title = ?; `;
                // can select based on title since title is unique
            
                conn.query(sql, [title], (err, data) => {
                 
                    conn.end();
                    if (err) {
                        console.error(err);
                        return callback(err, null);
                    } else {
                        
                        return callback(null, data);
                        // this data returned ( containing game id needs to be stored to be reused later to store new category ids )
                     
                    }
                });
            }
        });
    },

    //part 3 of qn 6 : to insert the categories into the game_category_map table based on the list of categories 
    // insert into the game_category_map table the based on game id obtained from prev
    post_category: (gameId,category, callback) => {
        var conn = db.getConnection();
        conn.connect((err) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                var sql = `
                INSERT INTO game_category_map (fk_game_id,fk_cat_id) VALUES (?,?);  
            `;
            console.log(category)
                conn.query(sql, [gameId,category], (err, data) => {
                   // game id obtained from previous function , category is a list of ids that will be inserted in through a for loop
                    conn.end();
                    if (err) {
                        console.error(err);
                        return callback(err, null);
                    } else {
                        return callback(null, data);
                       
                    }
                });
            }
        });
    },

    
    //part 4 of qn 6 : to get the updated game listing of the game added in
    // returns the updated listing with the new game added in
    get_updatedListing: ( title,callback) => {
        var conn = db.getConnection();
        conn.connect((err) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                var sql = `
                SELECT  c.catname, g.description, g.title, g.year, g.price, g.game_id FROM game_category_map cm INNER JOIN games g ON cm.fk_game_id = g.game_id INNER JOIN categories c ON c.cat_id=cm.fk_cat_id WHERE g.title=? ;
            `;
        // inner join the tables so that can see the cat name 
                conn.query(sql, [title], (err, data) => {
                   
                    conn.end();
                    if (err) {
                        console.error(err);
                        return callback(err, null);
                    } else {
                        return callback(null, data);
                       
                    }
                });
            }
        });
    },
    

// question 7 get all games based on platforms

get_gameOnPlatform:(platform,callback)=>{
    var conn = db.getConnection();
    conn.connect((err) => {
        if (err) {
            console.error(err);
            return callback(err, null);
        } else {
            var sql = `SELECT g.game_id,  g.title, g.description, g.price, g.platform, g.year, c.catname
             FROM games g , categories c ,game_category_map gm WHERE  c.cat_id = gm.fk_cat_id and g.game_id=gm.fk_game_id HAVING g.platform = ?;
        `;
  
            conn.query(sql,[platform], (err, data) => {
                
                conn.end();
                if (err) {
                    console.error(err);
                    return callback(err, null);
                } else {
                    return callback(null, data);
                    
                }
            });
        }
    });
},


//question 8 : Delete game based on id of game given
delete_game : (gameId, callback)=>{
    var conn = db.getConnection();
    conn.connect((err)=>{
        if(err){
            console.error(err);
            return callback(err,null);
        }else{
            var sql = `
            DELETE FROM games WHERE game_id = ?;
            `;
            conn.query(sql, [gameId], (err)=>{
                conn.end();
                if(err){
            console.error(err);
                    return callback(err, null);
                }else{
                    return callback(null);
                }
            });
        }
    });
},

//question 9 : update game listing => assuming one can change the category and game descriptions 
//update game listing based on its id ( description,price,platform,year )
update_game : (description,price,platform,year,title,gameId,callback) =>{
    var conn = db.getConnection();
    conn.connect((err)=>{
        if(err){
            console.error(err);
            return callback(err,null);
        }else{
            var sql = `
            UPDATE games SET description = ?,price=?,platform=?,year=? ,title=? WHERE game_id = ?;
            `;
            conn.query(sql, [description,price,platform,year,title,gameId,], (err)=>{
                conn.end();
                if(err){
            console.error(err);
                    return callback(err, null);
                }else{
                    return callback(null);
                }
            });
        }
    });
},

//part 2 of question 9 : update the category of the game
update_category: (category,gameId,callback) =>{
    var conn = db.getConnection();
    conn.connect((err)=>{
        if(err){
            console.error(err);
            return callback(err,null);
        }else{
            var sql = `
            UPDATE  game_category_map  SET fk_cat_id=? WHERE fk_game_id = ?;
            `;
            conn.query(sql, [category,gameId], (err)=>{
                conn.end();
                if(err){
            console.error(err);
                    return callback(err, null);
                }else{
                    return callback(null);
                }
            });
        }
    });
},




// question 10 used to add a new review to the database for a given user and game
post_review: (gameId,userId,content, callback)=>{
    var conn = db.getConnection();
    conn.connect((err)=>{
        if(err){
            console.error(err);
            return callback(err,null);
        }else{
            var sql= `
            INSERT INTO reviews (fk_user_id,fk_game_id,content) VALUES (?,?,?) WHERE fk_user_id = ? , fk_game_id = ?
            `;
            conn.query(sql, [userId,gameId,content,userId,gameId], (err,data)=>{
                conn.end();
                if(err){
            console.error(err);
                    return callback(err, null);
                }else{
                    return callback(null,data);
                }
            });
        }
    });
},

//question 11  retrieve reviews of particular game including username 
retrieve_reviews : (gameId, callback)=>{
    var conn = db.getConnection();
    conn.connect((err)=>{
        if(err){
            console.error(err);
            return callback(err,null);
        }else{
            var sql = `
            SELECT r.content, r.rating, u.username, g.game_id from reviews r, users u, games g  WHERE r.fk_game_id = ?and g.game_id=? and u.user_id=r.fk_user_id;
            `;
            conn.query(sql, [gameId,gameId], (err,data)=>{
                conn.end();
                if(err){
            console.error(err);
                    return callback(err, null);
                }else{
                    return callback(null,data);
                }
            });
        }
    });
},
}
