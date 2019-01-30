var sqlserver = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'vct',
    port: 3306,
    multipleStatements: true // 允许每个mysql语句有多条查询, 未防止sql注入不开启
}

module.exports = sqlserver