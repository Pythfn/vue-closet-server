var mysql = require('mysql');
let config = require('./dbconfig.js')

let pool = mysql.createPool(config);

let query = (sql, values) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) {
                reject(err)
            } else {
                conn.query(sql, values, (err, res) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(res)
                    }
                    //  释放连接池
                    conn.release()
                })
            }
        })
    })
}

module.exports = {
    query
}