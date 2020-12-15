Database = require("./db_promise");
conn = new Database();

module.exports = {
    //Qns 6: Create game and map it to correct categories
    createGame: (game, callback) => {
        var title = game.title;
        var description = game.description;
        var price = game.price;
        var platform = game.platform;
        var year = game.year;
        var categories = game.categories;
        var game_id;
        conn.connect()
            .then(() => {
                var createGameSQL = `
                    INSERT INTO 
                    sp_games.games 
                    (title,description,price,platform,year) 
                    VALUES (?,?,?,?,?);
                `;
                return conn.query(createGameSQL, [title, description, price, platform, year]);
            }).then((data) => {
                game_id = data.insertId;
                var createCategoryMappingSQL = `
                INSERT INTO 
                game_category_map 
                (fk_game_id,fk_cat_id) 
                VALUES (?,?);
                `;
                return Promise.all(categories.map(category => {
                    return conn.query(createCategoryMappingSQL, [game_id, category]);
                }));
            }).then(() => {
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, game_id);
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    },
    //Qns 7: Get all games based on platforms
    readGamesByPlatform : (platform, callback) => {
        var games;
        conn.connect()
            .then(() => {
                var readGamesByPlatformSQL = `
                SELECT 
                g.game_id,  g.title, g.description, g.price, g.platform, g.year, c.catname
                FROM 
                games g, categories c, game_category_map gm 
                WHERE c.cat_id = gm.fk_cat_id AND g.game_id = gm.fk_game_id 
                HAVING g.platform = ?
                `;
                return conn.query(readGamesByPlatformSQL , [platform]);
            }).then((data) => {
                games = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, games);
            }).catch((err)=>{
                console.error(err);
                callback(err, null);
            });
    },
    //Qns 8: Delete game based on ID
    deleteGame : (gameId, callback) => {
        var result;
        conn.connect()
            .then(() => {
                var deleteGameSQL = `
                    DELETE FROM games WHERE game_id = ?;
                `;
                return conn.query(deleteGameSQL , [gameId]);
            }).then((data) => {
                result = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, result.affectedRows);
            }).catch((err)=>{
                console.error(err);
                callback(err, null);
            });
    },
    //Qns 9: Update game listing based on ID and update the category
    updateGames: (gameId, game, callback) => {
        var description = game.description;
        var price = game.price;
        var platform = game.platform;
        var year = game.year;
        var title = game.title;
        var categories = game.categories;
        conn.connect()
            .then(() => {
                var updateGamesSQL = `
                UPDATE
                games
                SET
                description = ?, price = ?, platform = ?, year = ?, title = ? 
                WHERE game_id = ?;  
                `;
                return conn.query(updateGamesSQL, [description, price, platform, year, title, gameId]);
            })
            .then(() => {
                var updateGameCategoriesMapping = `
                UPDATE 
                game_category_map  
                SET fk_cat_id=? 
                WHERE fk_game_id = ?;
                `;
                return Promise.all(categories.map(category => {
                    return conn.query(updateGameCategoriesMapping, [category, gameId]);
                }));
            }).then(() => {
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null);
            }).catch((err) => {
                console.error(err);
                callback(err);
            });
    },
};