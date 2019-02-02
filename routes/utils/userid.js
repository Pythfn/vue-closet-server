getuserid = function() {
    return 'AX' + new Date().getTime() + parseInt(Math.random() * 100)
    //  前缀 + 时间戳 + 随机两位整数
}

module.exports = getuserid