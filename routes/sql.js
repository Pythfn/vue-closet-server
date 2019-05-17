const router = require('koa-router')()
const jwtverify = require('./utils/jwtverify')
const sc = require('../config')
const db = require('../lib/dbquery.js')
const toShortUrl = require('./utils/toShortUrl')
const getFormatDate = require('./utils/getFormatDate')
router.prefix('/api')


function resbody(ctx, code, msg, data) {
    ctx.body = {
        code,
        msg,
        ...data
    }
}


//  添加商品接口
router.post('/additem', async (ctx, next) => {
    //校验token，取到userid
    const token   = ctx.header.authorization.split(' ')[1];
    const decoded = await jwtverify(token, sc.jwtsecret).catch(err=> {
        console.log('###JWTERROR### ' + err);
        return false;
    });

    if(!decoded) {
        resbody(ctx, -1, '请重新登陆');
        return false;
    }

    let userid = decoded.userid;

    let { name, price, cost, type, size, rate, color, colorcode, tags, cover, pic, picurl, itemlink, remark, isstar, ispublic } = ctx.request.body;

    try {
        //  转短链接
        if (picurl && picurl.length >= 450) {
            picurl = await toShortUrl(picurl);
        }
        if (cover && cover.length >= 100) {
            cover = await toShortUrl(cover, 'single');
        }

        let sqlSort       = 'SELECT Max(sort) AS MAXSORT FROM vcitems WHERE userid = ?';
        let sqlSortValues = [userid];

        //获取当前最大排序号
        let runSqlSort   = await db.query(sqlSort, sqlSortValues);
        let maxSort      = isNaN(runSqlSort[0].MAXSORT) ? 1 : runSqlSort[0].MAXSORT + 1;
        
        let createtime   = getFormatDate();
        let sqlAdd       = 'INSERT INTO vcitems(name, price, cost, type, size, rate, color, colorcode, tags, cover, pic, picurl, itemlink, remark, isdelete, userid, isstar, ispublic, createtime, updatetime, sort) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        let sqlAddValues = [name, price, cost, type, size, rate, color, colorcode, tags, cover, pic, picurl, itemlink, remark, 0, userid, isstar, ispublic, createtime, createtime, maxSort];

        let runSqlAdd = await db.query(sqlAdd, sqlAddValues);
        resbody(ctx, 1, '添加成功', {itemname: name});
        return true;

    } catch (err) {
        console.log('###SQLADDERROR### ' + err);
        resbody(ctx, -1, '添加失败，提交数据有误');
        return false;
    }
})

//  商品修改接口
router.post('/updateitem', async (ctx, next) => {
    //校验token，取到userid
    const token   = ctx.header.authorization.split(' ')[1];
    const decoded = await jwtverify(token, sc.jwtsecret).catch(err=> {
        console.log('###JWTERROR### ' + err);
    });

    if(!decoded) {
        resbody(ctx, -1, '请重新登陆');
        return;
    }
    let userid = decoded.userid;


    let { itemid, name, price, cost, type, size, rate, color, colorcode, tags, cover, pic, picurl, itemlink, remark, isstar, ispublic } = ctx.request.body

    try {
        if (picurl && picurl.length >= 450) {
            picurl = await toShortUrl(picurl);
        }
        if (cover && cover.length >= 100) {
            cover  = await toShortUrl(cover, 'single');
        }
        //  修改语句中加入判断userid的条件，防止他人篡改
        let updatetime      = getFormatDate();
        let sqlUpdate       = "UPDATE vcitems SET name = ?, price = ?, cost = ?, type = ?, size = ?, rate = ?, color = ?, colorcode = ?, tags = ?, cover = ?, pic = ?, picurl = ?, itemlink = ?, remark = ?, isstar = ?, ispublic = ?, updatetime = ? WHERE itemid = ? AND userid = ?";
        let sqlUpdateValues = [name, price, cost, type, size, rate, color, colorcode, tags, cover, pic, picurl, itemlink, remark, isstar, ispublic, updatetime, itemid, userid];
        let updateRes       = await db.query(sqlUpdate, sqlUpdateValues);
        resbody(ctx, 1, '修改成功', {itemname: name});
    } catch (err) {
        console.log('###SQLADDERROR### ' + err);
        resbody(ctx, -1, '修改失败，提交数据有误');
    }

})

//  商品标记删除接口
router.post('/removeitem', async (ctx, next) => {
    //校验token，取到userid
    const token   = ctx.header.authorization.split(' ')[1];
    const decoded = await jwtverify(token, sc.jwtsecret).catch(err=> {
        console.log('###JWTERROR### ' + err);
    });

    if(!decoded) {
        resbody(ctx, -1, '请重新登陆');
        return false;
    }
    
    let userid = decoded.userid;


    try {
        const { itemid }    = ctx.request.body;
        let sqlRemove       = 'UPDATE vcitems SET isdelete = ? WHERE itemid = ? AND userid = ?';
        let sqlRemoveValues = [1, itemid, userid];
        let runSqlRemove    = await db.query(sqlRemove, sqlRemoveValues);
        resbody(ctx, 1, '删除成功');
        return true;
    } catch (err) {
        console.log('###SQLADDERROR### ' + err);
        resbody(ctx, -1, '删除失败');
        return false;
    }
})

//  获取商品接口
router.post('/getitems', async (ctx, next) => {
    //校验token，取到userid
    const token   = ctx.header.authorization.split(' ')[1];
    const decoded = await jwtverify(token, sc.jwtsecret).catch(err=> {
        console.log('###JWTERROR### ' + err);
    });

    if(!decoded) {
        resbody(ctx, -1, '请重新登陆');
        return false;
    }
    let userid = decoded.userid;

    try {
        const sqlGet  = 'SELECT * FROM vcitems WHERE userid = ? AND isdelete <> 1 ORDER BY updatetime DESC';
        let runSqlGet = await db.query(sqlGet, userid);
        ctx.body = {
            code: 1,
            msg: '数据获取成功',
            userid,
            itemlist: runSqlGet
         }
    } catch (err) {
        console.log('###SQLGETERROR### ' + err);
        resbody(ctx, -1, '数据获取失败');
        return false;
    }
})

//  获取商品接口
router.post('/getdata', async (ctx, next) => {
    //校验token，取到userid
    const token   = ctx.header.authorization.split(' ')[1];
    const decoded = await jwtverify(token, sc.jwtsecret).catch(err=> {
        console.log('###JWTERROR### ' + err);
    });

    if(!decoded) {
        resbody(ctx, -1, '请重新登陆');
        return false;
    }
    let userid = decoded.userid;

    try {
        const sqlGet  = 'SELECT * FROM vcitems WHERE userid = ? AND isdelete <> 1 ORDER BY updatetime DESC';
        let runSqlGet = await db.query(sqlGet, userid);

        const sqlGetGroup = 'SELECT * FROM vcgroup WHERE userid = ?';
        const sqlGetGroupItem = 'SELECT * FROM vcgroup_item WHERE userid = ?';
        const runSqlGetGroup = await db.query(sqlGetGroup, userid);
        const runSqlGetGroupItem = await db.query(sqlGetGroupItem, userid);

        ctx.body = {
            code: 1,
            msg: '数据获取成功',
            userid,
            itemlist: runSqlGet,
            grouplist: runSqlGetGroup,
            groupitem: runSqlGetGroupItem
         }
    } catch (err) {
        console.log('###SQLGETERROR### ' + err);
        resbody(ctx, -1, '数据获取失败');
        return false;
    }
})


router.post('/addgroup', async (ctx, next) => {
    //校验token，取到userid
    const token   = ctx.header.authorization.split(' ')[1];
    const decoded = await jwtverify(token, sc.jwtsecret).catch(err=> {
        console.log('###JWTERROR### ' + err);
    });

    if(!decoded) {
        resbody(ctx, -1, '请重新登陆');
        return false;
    }
    let userid = decoded.userid;
    let { name, price, cost, rate, color, tags, cover, pic, remark, isstar, ispublic, grouplist } = ctx.request.body;
    if (grouplist) grouplist = grouplist.split(',');

    try {

        let createtime = getFormatDate();
        let sqlGAdd = 'INSERT INTO vcgroup(name, price, cost, rate, color, tags, remark, userid, isstar, ispublic, createtime, updatetime) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        let sqlGAddValues = [name, price, cost, rate, color, tags, remark, userid, isstar, ispublic, createtime, createtime];
        //存入组合表并获取组合id
        let { insertId }= await db.query(sqlGAdd, sqlGAddValues);

        if (grouplist) {
            let sqlGIAdd = 'INSERT INTO vcgroup_item(itemid, groupid, sort, userid) VALUES ?';
            let sqlGIAddValues = [];
            grouplist.forEach(g => {
                sqlGIAddValues.push([g, insertId, 0, userid]);
            })

            let res = await db.query(sqlGIAdd, [sqlGIAddValues]);
            resbody(ctx, 1, '组合添加成功');
        }

    } catch (err) {
        console.log('###SQLGETERROR### ' + err);
        resbody(ctx, -1, '数据获取失败');
        return false;
    }
})

module.exports = router