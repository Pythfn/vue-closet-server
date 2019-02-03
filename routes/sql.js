const router = require('koa-router')()
const jwtverify = require('./utils/jwtverify')
const sc = require('../config')
const db = require('../lib/dbquery.js')
router.prefix('/api')

router.post('/additem', async (ctx, next) => {
  //  校验token，取到userid
  const token = ctx.header.authorization.split(' ')[1]
  const verify = jwtverify(token, sc.jwtsecret)
  await verify.then(async (decoded) => {
    const userid = decoded.userid
    const { name, price, cost, rate, color, colorcode, tags, pic, picurl, remark } = ctx.request.body
    if (userid) {
      try {
        const sqlAdd = 'INSERT INTO vcitems(NAME, price, cost, rate, color, colorcode, tags,  pic, picurl, remark, isdelete, userinfo, userid) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        const sqlAddValues = [name, price, cost, rate, color, colorcode, tags, pic, picurl, remark, 0, null, userid]
        const dbAdd = db.query(sqlAdd, sqlAddValues)
        await dbAdd.then((res) => {
          ctx.body = {
            code: 1,
            msg: '添加成功',
            itemname: name
          }
        })
      } catch (err) {
        console.log('###SQLADDERROR### ' + err)
        ctx.body = {
          code: -1,
          msg: '添加失败，提交数据有误'
        }
      }
    }
  }).catch((err) => {
    console.log('###JWTERROR### ' + err)
    ctx.body = {
      code: -1,
      msg: '请重新登陆'
    }
  })
})

module.exports = router