const router = require('koa-router')()
const jwt = require('jsonwebtoken')
const db = require('../lib/dbquery.js')
const getuserid = require('./utils/userid.js')

const jwtsecret = '9af99e8611d033f016eb8aa5d5b6a3df'

router.prefix('/api')

router.get('/', function(ctx, next) {
  ctx.body = 'this is a users response!'
})

//  注册接口
router.post('/signup', async (ctx, next) => {
  const { username, pass, email, phone, sex } = ctx.request.body
  if (!username || !pass || !email) {
    ctx.body = {
      code: -1,
      msg: '注册信息有误'
    }
  } else {
    try {
      const sqlbeforereg = 'SELECT username FROM users where username = (?)'
      let bfr = db.query(sqlbeforereg, username)
      await bfr.then(async res => {
        if (res.length) {
          ctx.body = {
            code: -1,
            msg: '用户名已存在'
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
    } catch (err) {
      console.log(err)
      ctx.body = {
        code: -1,
        msg: '服务器错误'
      }
    }
  }
})

//  登陆接口
router.post('/signin', async (ctx, next) => {
  const { username, password } = ctx.request.body
  const sqlIn = 'select userid from users where username = (?) and password = (?)'
  const sqlInValues = [username, password]
  try {
    const dbIn = db.query(sqlIn, sqlInValues)
    await dbIn.then((res) => {
      console.log(res.length)
      if (res.length !== 0) {
        const token = jwt.sign({
          username,
          userid: res[0].userid
        }, jwtsecret, { expiresIn: '1h' })
        ctx.body = {
          code: 1,
          msg: '登陆成功',
          username,
          token
        }
      } else {
        ctx.body = {
          code: -1,
          msg: '用户名或密码有误'
        }
      }
    })
  } catch (err) {
    console.log(err)
    ctx.body = {
      code: -1,
      msg: '服务器错误'
    }
  }
})

module.exports = router