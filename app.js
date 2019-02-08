const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const koajwt = require('koa-jwt')
//  const cors = require('koa-cors')

const index = require('./routes/index')
const users = require('./routes/users')
const sql = require('./routes/sql')
const sc = require('./config')

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'ejs'
}))

//  koa-jwt验证
app.use((ctx, next) => {
  return next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 401
      ctx.body = 'WARNING : Protected resource, use Authorization header to get access\n\n'
    } else {
      throw err
    }
  })
})

app.use(koajwt({
  secret: sc.jwtsecret
}).unless({
  path:[/\/signin/, /\/signup/,/\/userinfo/]
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
app.use(sql.routes(), sql.allowedMethods())

/*
app.use(cors({
  origin: function (ctx) {
    return 'http://localhost:8080'
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['t', 'Content-Type']
}))
*/

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
