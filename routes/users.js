const router = require('koa-router')()
const jwt = require('jsonwebtoken')
const db = require('../lib/dbquery.js')
const getuserid = require('./utils/userid.js')
const jwtverify = require('./utils/jwtverify')
const sc = require('../config')
const nodeMailer = require('nodemailer')

router.prefix('/api')

router.get('/', function(ctx, next) {
  ctx.body = 'this is a users response!'
})

//  注册接口
router.post('/signup', async (ctx, next) => {
  const { username, pass, email, phone, sex, vcode } = ctx.request.body
  let vcodeValid = false
  if (!username || !pass || !email || !vcode) {
    ctx.body = {
      code: -1,
      msg: '注册信息有误'
    }
  } else {
    if (vcode) {
      let sqlvcode = 'SELECT * FROM mail WHERE email = ?'
      await db.query(sqlvcode, email).then(async res => {
        if (res[res.length - 1].vcode === vcode) {
          if (res[res.length - 1].expire - new Date().getTime() < 0) {
            ctx.body = {
              code: -1,
              msg: '验证码已过期'
            }
          } else {
            vcodeValid = true
          }
        } else {
          ctx.body = {
            code: -1,
            msg: '验证码有误'
          }
        }
      })
    }
    if (vcodeValid) {
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
        console.log('###SQLERROR### ' + err)
        ctx.body = {
          code: -1,
          msg: '服务器错误'
        }
      }
    }
  }
})

//  注册验证码接口
router.post('/verify', async (ctx, next) => {
  const { username, email } = ctx.request.body
  let sqlbfv = 'SELECT expire FROM mail WHERE username = ? AND email = ?'
  let sqlbfvValues = [username, email]
  try {
    await db.query(sqlbfv, sqlbfvValues).then(async (res) => {
      if (res.length > 0) {
        let nowExp = new Date().getTime()
        if (res[res.length - 1].expire > nowExp) {
          ctx.body = {
            code: -1,
            msg: '请不要重复提交'
          }
          return false
        }
      }
      //  node邮箱配置
      let transporter = nodeMailer.createTransport({
        service: 'qq',
        auth: {
          user: sc.smtp.user,
          pass: sc.smtp.pass
        }
      })
      let mo = {
        username,
        email,
        vcode: sc.smtp.vcode(),
        expire: sc.smtp.expire()
      }
      let mailOptions = {
        from: `“认证邮件” <${sc.smtp.user}>`,
        to: mo.email,
        subject: `这是VC的注册邮件`,
        html: `${mo.username}您好，这是VC的注册邮件，验证码：${mo.vcode}，有效期为1分钟。`
      }
      //  node邮箱配置 END
      await transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          return console.log('###NODEMAILERROR### ' + error)
        } else {
          let sqlSend = 'INSERT INTO mail(username, email, vcode, expire) VALUES(?,?,?,?)'
          let sqlSendValues = [mo.username, mo.email, mo.vcode, mo.expire]
          await db.query(sqlSend, sqlSendValues)
        }
      })
      ctx.body = {
        code: 1,
        msg: '验证码发送成功'
      }
    })
  } catch (err) {
    console.log('###SQLERROR### ' + err)
    ctx.body = {
      code: -1,
      msg: '服务器错误，请重新获取验证码'
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
      if (res.length !== 0) {
        const token = jwt.sign({
          username,
          userid: res[0].userid
        }, sc.jwtsecret, { expiresIn: '1h' })
        ctx.body = {
          code: 1,
          msg: '登陆成功',
          username,
          userid: res[0].userid,
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
    console.log('###SQLERROR### ' + err)
    ctx.body = {
      code: -1,
      msg: '服务器错误'
    }
  }
})

//  用户登陆状态验证
router.post('/userinfo', async (ctx, next) => {
  const token = ctx.header.authorization.split(' ')[1]
  const verify = jwtverify(token, sc.jwtsecret)
  await verify.then((data) => {
    const { username, userid } = data
    ctx.body = {
      code: 1,
      msg: '登陆信息有效',
      username,
      userid,
      token
    }
  }).catch((err) => {
    ctx.body = {
      code: -1,
      msg: '请重新登陆'
    }
  })
})

module.exports = router