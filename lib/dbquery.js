var mysql = require('mysql');
let sc = require('../config')
let pool = mysql.createPool(sc.sqlconfig);

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