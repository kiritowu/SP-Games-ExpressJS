//+---------------+---------------+
//| Name          | Wong Zhao Wu  |
//| Class         | DAAA/FT/1B/01 |
//| Admission No. | 2036504       |
//+---------------+---------------+

Database = require("./db_promise");
conn = new Database();

module.exports = {
    //Qns 4: Create a new category
    createCategory: (category, callback) => {
        var catname = category.catname;
        var description = category.description;
        conn.connect()
            .then(() => {
                var createCategorySQL = `
                    INSERT INTO categories(catname, description)
                    VALUES(?, ?)
                `;
                return conn.query(createCategorySQL, [catname, description]);
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
    //Qns 5: Update the category name and description
    updateCategory: (cat_id, category, callback) => {
        var result;
        var catname = category.catname;
        var description = category.description;
        conn.connect()
            .then(() => {
                var updateCategorySQL = `
                    UPDATE categories 
                    SET
                    catname = ?,
                    description = ?
                    WHERE cat_id = ?;
                `;
                return conn.query(updateCategorySQL, [catname, description, cat_id]);
            }).then((data) => {
                result = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                if (result.affectedRows === 0) { //No affected rows is made(cat_id is not found)
                    throw {
                        errno: 404,
                        sqlMessage: "cat_id is not found "
                    };
                }
                callback(null);
            }).catch((err) => {
                console.error(err);
                callback(err);
            });
    },
    getUniqueCategory: (callback) => {
        var categories;
        conn.connect()
            .then(() => {
                var getUniqueCategorySQL = `
                    SELECT * FROM categories;
                `;
                return conn.query(getUniqueCategorySQL , []);
            }).then((data) => {
                categories = data;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, categories);
            }).catch((err)=>{
                console.error(err);
                callback(err, null);
            });
    },
    deleteCategory : (cat_id, callback) => {
        var affectedRows;
        conn.connect()
            .then(() => {
                var deleteCategorySQL = `
                    DELETE FROM categories WHERE cat_id = ?;
                `;
                return conn.query(deleteCategorySQL , [cat_id]);
            }).then((data) => {
                affectedRows = data.affectedRows;
                return conn.close();
            }, (err) => {
                return conn.close().then(() => { throw err; });
            }).then(() => {
                callback(null, affectedRows);
            }).catch((err)=>{
                console.error(err);
                callback(err, null);
            });
    },
};
