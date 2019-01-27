const router = require('koa-router')()

router.prefix('/api')

router.post('/add', function (ctx, next) {
  ctx.body = 'this is a users response!'
})

module.exports = router
