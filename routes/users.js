const router = require('koa-router')()
const db = require('../lib/dbquery.js')
const getuserid = require('../utils/userid.js')

router.prefix('/api')

router.get('/', function (ctx, next) {
  ctx.body = 'this is a users response!'
})

//  注册接口
router.post('/signup', async function (ctx, next) {
  const {username, pass, email, phone, sex} = await ctx.request.body
  if (!username || !pass || !email) {
    ctx.body = {
      code: -1,
      msg: '注册信息有误'
    }
  } else {
    const sqlbeforereg = 'SELECT username FROM users where username = (?)'
    let bfr = db.query(sqlbeforereg, username)
    await bfr.then(async res => {
      if (res.length) {
        ctx.body = {
          code: -1,
          msg:'用户名已存在'
        }
      } else {
        //  数据库无重复用户名则进行写库
        const userid = getuserid()
        const sqlReg = 'INSERT INTO users(userid, username, password, email) VALUES(?,?,?,?)'
        const sqlRegValues = [userid, username, pass, email]
        let reg = db.query(sqlReg, sqlRegValues)
        await reg.then(res => {
          ctx.body = {
            code: 1,
            msg: '注册成功'
          }
        }).catch((e) => {
          ctx.body = {
            code: -1,
            msg: e
          }
        })
      }
    })
  }
})

//  登陆接口
router.get('/signin', async (ctx, next) => {
  const sql = 'select * from users where username = (?) and password = (?)'
  const values = ['abcde', 123456]
  const d = db.query(sql, values)
  d.then((ctx) => {
    console.log(ctx)
  })
  const req = ctx.request.body
  ctx.body = await d
})

module.exports = router
