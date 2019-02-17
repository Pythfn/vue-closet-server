const router = require('koa-router')()
const jwtverify = require('./utils/jwtverify')
const sc = require('../config')
const db = require('../lib/dbquery.js')
const toShortUrl = require('./utils/toShortUrl')
const getFormatDate = require('./utils/getFormatDate')
router.prefix('/api')

//  添加商品接口
router.post('/additem', async (ctx, next) => {
  //  校验token，取到userid
  const token = ctx.header.authorization.split(' ')[1]
  await jwtverify(token, sc.jwtsecret).then(async (decoded) => {
    const userid = decoded.userid
    let { name, price, cost, type, size, rate, color, colorcode, tags, cover, pic, picurl, itemlink, remark, isstar, ispublic } = ctx.request.body
    if (userid) {
      try {
        //  转短链接
        if (picurl && picurl.length >= 450) {
          picurl = await toShortUrl(picurl)
        }
        if (cover && cover.length >= 100) {
          cover = await toShortUrl(cover, 'single')
        }
        let createtime = getFormatDate()
        const sqlAdd = 'INSERT INTO vcitems(name, price, cost, type, size, rate, color, colorcode, tags, cover, pic, picurl, itemlink, remark, isdelete, userinfo, userid, isstar, ispublic, createtime, updatetime) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        const sqlAddValues = [name, price, cost, type, size, rate, color, colorcode, tags, cover, pic, picurl, itemlink, remark, 0, null, userid, isstar, ispublic, createtime, createtime]
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

//  商品修改接口
router.post('/updateitem', async (ctx, next) => {
  //  校验token，取到userid
  const token = ctx.header.authorization.split(' ')[1]
  const verify = jwtverify(token, sc.jwtsecret)
  await verify.then(async (decoded) => {
    const userid = decoded.userid
    let { itemid, name, price, cost, type, size, rate, color, colorcode, tags, cover, pic, picurl, itemlink, remark, isstar, ispublic } = ctx.request.body
    if (userid) {
      try {
        if (picurl && picurl.length >= 450) {
          picurl = await toShortUrl(picurl)
        }
        if (cover && cover.length >= 100) {
          cover = await toShortUrl(cover, 'single')
        }
        //  修改语句中加入判断userid的条件，防止他人篡改
        let updatetime = getFormatDate()
        let sqlUpdate = "UPDATE vcitems SET name = ?, price = ?, cost = ?, type = ?, size = ?, rate = ?, color = ?, colorcode = ?, tags = ?, cover = ?, pic = ?, picurl = ?, itemlink = ?, remark = ?, isstar = ?, ispublic = ?, updatetime = ? WHERE itemid = ? AND userid = ?"
        let sqlUpdateValues = [name, price, cost, type, size, rate, color, colorcode, tags, cover, pic, picurl, itemlink, remark, isstar, ispublic, updatetime, itemid, userid]
        await db.query(sqlUpdate, sqlUpdateValues).then((res) => {
          ctx.body = {
            code: 1,
            msg: '修改成功',
            itemname: name
          }
        })
      } catch (err) {
        console.log('###SQLADDERROR### ' + err)
        ctx.body = {
          code: -1,
          msg: '修改失败，提交数据有误'
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

//  商品标记删除接口
router.post('/removeitem', async (ctx, next) => {
  const token = ctx.header.authorization.split(' ')[1]
  await jwtverify(token, sc.jwtsecret).then(async decoded => {
    const userid = decoded.userid
    if (userid) {
      try {
        const { itemid } = ctx.request.body
        let sqlRemove = 'UPDATE vcitems SET isdelete = ? WHERE itemid = ? AND userid = ?'
        let sqlRemoveValues = [1, itemid, userid]
        await db.query(sqlRemove, sqlRemoveValues).then((res) => {
          ctx.body = {
            code: 1,
            msg: '删除成功'
          }
        })
      } catch (err) {
        console.log('###SQLADDERROR### ' + err)
        ctx.body = {
          code: -1,
          msg: '删除失败'
        }
      }
    }
  }).catch(err => {
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
        const sqlGet = 'SELECT * FROM vcitems WHERE userid = ? AND isdelete <> 1 ORDER BY updatetime DESC'
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