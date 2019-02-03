const router = require('koa-router')()
const jwtverify = require('./utils/jwtverify')
const sc = require('../config')
const db = require('../lib/dbquery.js')
const toShortUrl = require('./utils/toShortUrl')
router.prefix('/api')

//  添加商品接口
router.post('/additem', async (ctx, next) => {
  //  校验token，取到userid
  const token = ctx.header.authorization.split(' ')[1]
  const verify = jwtverify(token, sc.jwtsecret)
  await verify.then(async (decoded) => {
    const userid = decoded.userid
    let { name, price, cost, type, size, rate, color, colorcode, tags, pic, picurl, itemlink, remark } = ctx.request.body
    //  转短链接
    picurl = await toShortUrl(picurl)

    if (userid) {
      try {
        const sqlAdd = 'INSERT INTO vcitems(NAME, price, cost, type, size, rate, color, colorcode, tags,  pic, picurl, itemlink, remark, isdelete, userinfo, userid) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        const sqlAddValues = [name, price, cost, type, size, rate, color, colorcode, tags, pic, picurl, itemlink, remark, 0, null, userid]
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


//  获取商品接口
router.post('/getitems', async (ctx, next) => {
  //  校验token，取到userid
  const token = ctx.header.authorization.split(' ')[1]
  await jwtverify(token, sc.jwtsecret).then(async (decoded) => {
    const userid = decoded.userid
    if (userid) {
      try {
        const sqlGet = 'SELECT * FROM vcitems WHERE userid = ?'
        await db.query(sqlGet, userid).then((itemlist) => {
          ctx.body = {
            code: 1,
            msg: '数据获取成功',
            userid,
            itemlist
          }
        })
      } catch (err) {
        console.log('###SQLGETERROR### ' + err)
        ctx.body = {
          code: -1,
          msg: '数据获取失败'
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