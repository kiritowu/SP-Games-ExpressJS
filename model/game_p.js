//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+

var Database = require("./db_promise");
var conn = new Database();
var fs = require('fs');

module.exports = {
    //Qns 6: Create game and map it to correct categories
    createGame: (game, callback) => {
        var title = game.title;
        var description = game.description;
        var price = game.price;
        var platform = game.platform;
        var year = parseInt(game.year);
        var categories = game.categories;
        var game_pic_url = game.game_pic_url;
        var game_id;
        conn.connect()
            .then(() => {
                var createGameSQL = `
                    INSERT INTO 
                    sp_games.games 
                    (title,description,price,platform,year,game_pic_url) 
                    VALUES (?,?,?,?,?,?);
                `;
                return conn.query(createGameSQL, [title, description, price, platform, year, game_pic_url]);
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
                if (game_id) err.Inserted_game_id = game_id;
                console.error(err);
                callback(err, null);
            });
    },
    //Qns 7: Get all games based on platforms
    readGamesByPlatform: (platform, callback) => {
        var games;
        var categories;
        var gameIdArr = [];
        conn.connect()
            .then(() => {
                var readGamesByPlatformSQL = `
                SELECT 
                game_id, title, description, price, platform, year, game_pic_url
                FROM 
                games
                WHERE platform = ?
                `;
                return conn.query(readGamesByPlatformSQL, [platform]);
            }).then((data) => {
                games = data;
                games.forEach((game) => { gameIdArr.push(game.game_id); });
                var readCategoryListFromGameID = `
                SELECT c.catname
                FROM categories c, game_category_map cg
                WHERE c.cat_id = cg.fk_cat_id
                AND cg.fk_game_id = ?;
                `;
                return Promise.all(gameIdArr.map(gameId => {
                    return conn.query(readCategoryListFromGameID, [gameId]);
                }));
            }).then(data => {
                categories = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                for (var i = 0; i < games.length; i++) {
                    games[i].categories = categories[i].map(category => category.catname);
                }
                callback(null, games);
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    },
    //Qns 8: Delete game based on ID
    deleteGame: (gameId, callback) => {
        var result;
        conn.connect()
            .then(() => {
                return conn.query("SELECT game_pic_url FROM games WHERE game_id = ?", [gameId]);
            }).then((response) => {
                if(response[0]){
                    if(response[0].game_pic_url !== '/game/pic/default.jpg'){
                        try{
                            fs.unlinkSync(`${__dirname}/../tmp/images/game-pic/${response[0].game_pic_url.split('/').slice(-1)}`);
                        }catch(err){
                            throw err;
                        }
                    }
                }
                var deleteGameSQL = `
                    DELETE FROM games WHERE game_id = ?;
                `;
                return conn.query(deleteGameSQL, [gameId]);
            }).then((data) => {
                result = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, result.affectedRows);
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    },
    //Qns 9: Update game listing based on ID and update the category
    updateGames: (gameId, game, callback) => {
        var result;
        var description = game.description;
        var price = game.price;
        var platform = game.platform;
        var year = parseInt(game.year);
        var title = game.title;
        var categories = game.categories;
        var game_pic_url = game.game_pic_url;
        conn.connect().then(() => {
            if(game_pic_url=='/game/pic/default.jpg'){
                return conn.query("SELECT game_pic_url FROM games WHERE game_id = ?",[gameId]);
            }
        }).then((response) => {
            game_pic_url = response[0]?response[0].game_pic_url:game_pic_url;
            var updateGamesSQL = `
                UPDATE
                games
                SET
                description = ?, price = ?, platform = ?, year = ?, title = ?, game_pic_url = ?
                WHERE game_id = ?;  
                `;
                return conn.query(updateGamesSQL, [description, price, platform, year, title, game_pic_url, gameId]);
            }).then(() => {
                var deleteCategoryMapping = `
                DELETE FROM
                game_category_map
                WHERE fk_game_id = ?;
                `;
                return conn.query(deleteCategoryMapping, [gameId]);
            })
            .then((data) => {
                result = data;
                var updateGameCategoriesMapping = `
                INSERT INTO 
                game_category_map  
                (fk_cat_id, fk_game_id)
                VALUES(?,?);
                `;
                return Promise.all(categories.map(category => {
                    return conn.query(updateGameCategoriesMapping, [category, gameId]);
                }));
            }).then(() => {
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, result.affectedRows);
            }).catch((err) => {
                console.error(err, null);
                callback(err);
            });
    },
    searchGames: (properties, callback) => {
        var games;
        var gameIdArr = [];
        var id = properties.id ? properties.id : "%";
        var title = properties.title ? "%" + properties.title + "%" : "%";
        var max = properties.max ? properties.max : "9223372036854775807"; // Maximum value of BigInt
        var min = properties.min ? properties.min : "0";
        var year = properties.year ? properties.year : "%";
        var cat =  properties.cat ? properties.cat : undefined;
        conn.connect()
            .then(() => {
                var searchGameSQL = `
                    SELECT * 
                    FROM games 
                    WHERE 
                        game_id like ? AND
                        title like ? AND 
                        (price BETWEEN ? AND ?) AND
                        year like ? 
                    ` + (properties.platform ? `AND platform in (?) ` : "") + { "asc": "ORDER BY price ASC", "desc": "ORDER BY price DESC", "def": "", undefined: "" }[properties.sortBy] + ";";
                return conn.query(searchGameSQL, [id, title, min, max, year, properties.platform]);
            }).then((data) => {
                games = data;
                games.forEach((game) => { gameIdArr.push(game.game_id); });
                var readCategoryListFromGameID = `
                SELECT c.catname
                FROM categories c, game_category_map cg
                WHERE c.cat_id = cg.fk_cat_id
                AND cg.fk_game_id = ?;
                `;
                return Promise.all(gameIdArr.map(gameId => {
                    return conn.query(readCategoryListFromGameID, [gameId]);
                }));
            }).then(data => {
                categories = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                for (var i = 0; i < games.length; i++) {
                    games[i].categories = categories[i].map(category => category.catname);
                }
                if(cat){
                    games = games.filter(game=>{
                        return game.categories.includes(cat);
                    });
                }
                callback(null, games);
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    },
    uniquePlatform: (callback) => {
        var platforms;
        conn.connect()
            .then(() => {
                var uniquePlatformSQL = `
                SELECT DISTINCT platform FROM games ;
                `;
                return conn.query(uniquePlatformSQL);
            }).then((data) => {
                platforms = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, platforms);
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    },
    getGameByID: (gameID, callback) => {
        var game;
        conn.connect()
            .then(() => {
                var getGameByIDSQL = `
                SELECT * FROM games WHERE game_id = ?;
                `;
                return conn.query(getGameByIDSQL, [gameID]);
            }).then((data) => {
                game = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, game);
            }).catch((err) => {
                console.error(err);
                callback(err, null);
            });
    },
};