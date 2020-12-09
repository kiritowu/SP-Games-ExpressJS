//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+

const db = require("./db_config");

module.exports = {
    createCategory: (category, callback) => {
        var conn = db.getConnection();
        conn.connect((err) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                var catname = category.catname;
                var description = category.description;
                var createCategorySQL = `
                    INSERT INTO categories(catname, description)
                    VALUES(?, ?)
                `;
                conn.query(createCategorySQL, [catname, description], (err) => {
                    conn.end();
                    if (err) {
                        console.error(err);
                        return callback(err);
                    } else {
                        return callback(null);
                    }
                });
            }
        });
    },
    updateCategory: (cat_id, category, callback) => {
        var conn = db.getConnection();
        conn.connect((err) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            } else {
                var catname = category.catname;
                var description = category.description;
                var updateCategorySQL = `
                    UPDATE categories 
                    SET
                    catname = ?,
                    description = ?
                    WHERE cat_id = ?;
                `;
                conn.query(updateCategorySQL, [catname, description, cat_id], (err, result) => {
                    conn.end();
                    if (err) {
                        console.error(err);
                        return callback(err);
                    } else {
                        if (result.affectedRows === 0) { //No affected rows is made(cat_id is not found)
                            return callback({
                                errno: 404,
                                sqlMessage: "cat_id is not found "
                            });
                        }
                        return callback(null);
                    }
                });
            }
        });
    }
};