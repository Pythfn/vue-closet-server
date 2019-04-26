const router = require('koa-router')()
const jwt = require('jsonwebtoken')
const db = require('../lib/dbquery.js')
const getuserid = require('./utils/userid.js')
const jwtverify = require('./utils/jwtverify')
const sc = require('../config')
const nodeMailer = require('nodemailer')
const expireDate = '3d'


function resbody(ctx, code, msg, data) {
    ctx.body = {
        code,
        msg,
        ...data
    }
}


router.prefix('/api');

//  注册接口
router.post('/signup', async (ctx, next) => {
    const { username, pass, email, phone, sex, vcode } = ctx.request.body;

    if (!username || !pass || !email || !vcode) {
        resbody(ctx, -1, '注册信息有误');
        return false;
    }
    let sqlvcode = 'SELECT * FROM mail WHERE email = ?';

    let vcodeRes = await db.query(sqlvcode, email);
    if (vcodeRes[vcodeRes.length - 1].vcode === vcode) {
        if (vcodeRes[vcodeRes.length - 1].expire - new Date().getTime() < 0) {
          resbody(ctx, -1, '验证码已过期');
          return false;
        }
    } else {
        resbody(ctx, -1, '验证码有误');
        return false;
    }

    try {
        const sqlbeforereg = 'SELECT username FROM users where username = (?)';
        let bfr = await db.query(sqlbeforereg, username);
            if (bfr.length) {
                resbody(ctx, -1, '用户名已存在');
                return false;
            } else {
            //  数据库无重复用户名则进行写库
                const userid       = getuserid();
                const sqlReg       = 'INSERT INTO users(userid, username, password, email) VALUES(?,?,?,?)';
                const sqlRegValues = [userid, username, pass, email];
                let reg = await db.query(sqlReg, sqlRegValues).catch((e) => {
                    resbody(ctx, -1, {e});
                    return false;
                });

                resbody(ctx, 1, '注册成功');
                return true;
          }
    } catch (err) {
        console.log('###SQLERROR### ' + err)
        resbody(ctx, -1, '数据库错误');
        return false;
    }
})

//  注册验证码接口
router.post('/verify', async (ctx, next) => {
    const { username, email } = ctx.request.body;
    let sqlbfv = 'SELECT expire FROM mail WHERE username = ? AND email = ?';
    let sqlbfvValues = [username, email];

    try {
        let bfvRes = await db.query(sqlbfv, sqlbfvValues);

        if (bfvRes.length > 0) {
            let nowExp = new Date().getTime()
            if (bfvRes[bfvRes.length - 1].expire > nowExp) {
            resbody(ctx, -1, '请不要重复提交');
            return false;
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
          return console.log('###NODEMAILERROR### ' + error);
        } else {
          let sqlSend       = 'INSERT INTO mail(username, email, vcode, expire) VALUES(?,?,?,?)';
          let sqlSendValues = [mo.username, mo.email, mo.vcode, mo.expire];
          await db.query(sqlSend, sqlSendValues);
        }
      });

      resbody(ctx, 1, '验证码发送成功');
      return true;

  } catch (err) {
    console.log('###SQLERROR### ' + err);
    resbody(ctx, -1, '服务器错误，请重新获取验证码');
    return false;
  }
})

//  登陆接口
router.post('/signin', async (ctx, next) => {
    const { username, password } = ctx.request.body;
    const sqlIn       = 'select userid from users where username = (?) and password = (?)';
    const sqlInValues = [username, password];

    try {
        let dbIn = await db.query(sqlIn, sqlInValues);
        if (dbIn.length !== 0) {
            const token = jwt.sign({
              username,
              userid: dbIn[0].userid
            }, sc.jwtsecret, { expiresIn: expireDate });

            resbody(ctx, 1, '登陆成功', {username, userid: dbIn[0].userid, token});
            return true;

        } else {
            resbody(ctx, -1, '用户名或密码有误');
            return false;
        }
    } catch (err) {
        console.log('###SQLERROR### ' + err);
        resbody(ctx, -1, '服务器错误');
    }
})

//  用户登陆状态验证
router.post('/userinfo', async (ctx, next) => {
    //校验token，取到userid
    const token   = ctx.header.authorization.split(' ')[1];
    const decoded = await jwtverify(token, sc.jwtsecret).catch(err=> {
        console.log('###JWTERROR### ' + err);
    });

    if(!decoded) {
        resbody(ctx, -1, '请重新登陆');
        return false;
    }

    const { username, userid, exp } = decoded;

    //  单位秒
    let minTime = 60 * 60 * 12;
    if (exp - Math.round(new Date() / 1000) < minTime) {
        console.log(exp - Math.round(new Date() / 1000));

        const newtoken = jwt.sign({
            username,
            userid,
        }, sc.jwtsecret, { expiresIn: expireDate });

        resbody(ctx, 1, '登陆信息续签', {username, userid, token: newtoken});
        return true;

    } else {
        resbody(ctx, 1, '登陆信息有效', {username, userid, token});
        return true;
    }
})

module.exports = router