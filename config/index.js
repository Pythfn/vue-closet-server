//  数据库配置
const sqlconfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'vct',
  port: 3306,
  multipleStatements: true // 允许每个mysql语句有多条查询, 未防止sql注入不开启
}

//  token
const jwtsecret = '9af99e8611d033f016eb8aa5d5b6a3df'

module.exports = {
  sqlconfig,
  jwtsecret
}