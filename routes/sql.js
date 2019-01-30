const router = require('koa-router')()

router.prefix('/api')

router.post('/additem', function (ctx, next) {
  const req = ctx.request.body
  ctx.body = req
})

module.exports = router
