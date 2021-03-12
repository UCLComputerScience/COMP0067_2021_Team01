var express = require('express')
var mysql = require('mysql')
var bodyParser = require('body-parser')
var xlsx = require('node-xlsx')
var fs = require('fs')
var web = express()

web.engine('html', require('express-art-template'))
web.use(bodyParser.urlencoded({extended: false}))
web.use(bodyParser.json())

var session = require('express-session')
web.use(session({
    secret: 'qweqweqweqwe', // 建议使用 128 个字符的随机字符串
    cookie: { maxAge: 20 * 60 * 1000 }, //cookie生存周期20*60秒
    resave: true,  //cookie之间的请求规则,假设每次登陆，就算会话存在也重新保存一次
    saveUninitialized: true //强制保存未初始化的会话到存储器
}));  //这些是写在app.js里面的

web.use('/public/', express.static('./public/'))

web.get('/login', function(req, res){
    res.render('login.html')
})

web.get('/expire', function(req, res){
    res.render('sessionExpire.html')
})

web.get('/pwError', function(req, res){
    res.render('passwordError.html')
})

web.post('/login', function(req, res){
    var user = req.body
    req.session.uname = user.uname
    var queryLogin = 'SELECT `password` FROM `lecturer` WHERE `username`="'+user.uname+'"'
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'traffic_feedback_system'
    })
    connection.connect()

    connection.query(queryLogin, function (error, results) {
        if (error) {
            console.log(error)
        }
        if (results.length === 0) {
            res.redirect('/pwError')
        }
        else if (results[0].password === user.upassword) {
            res.redirect('/')
        }
        else {
            res.redirect('/pwError')
        }
    })
    connection.end()
})

web.get('/', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/expire')
    }
    var querySelect = 'SELECT * FROM module'
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'traffic_feedback_system'
    })
    connection.connect()
    connection.query(querySelect, function (error, results) {
        if (error) {
            console.log(error)
        }
        res.render('index.html', {
            module: results,
            uname: uname
        })
    })
    connection.end()
})

web.get('/module', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }
    var reqObj = req.query
    req.session.moduleID = reqObj.moduleID
    var moduleID = req.session.moduleID
    var querySelectAllModule = 'SELECT * FROM module'
    var querySelectCurrentModule = 'SELECT * FROM module where `moduleID`="'+moduleID+'"'
    var querySelectAllStu = 'SELECT * FROM student where `Module`="'+moduleID+'"'
    var querySelectAttStu = 'SELECT * FROM student where `Module`="'+moduleID+'" and `Feedback5`<=2'
    var querySelectAllGroup = 'SELECT * FROM grouping where `Module`="'+moduleID+'"'
    var querySelectAttGroup = 'SELECT * FROM grouping where `Module`="'+moduleID+'" and `Feedback5`<=2'

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'traffic_feedback_system'
    })
    connection.connect()
    connection.query(querySelectAllModule, function (error, AllMod) {
        if (error) {
            console.log(error)
        }
        connection.query(querySelectCurrentModule, function (error, CurMod) {
            if (error) {
                console.log(error)
            }
            connection.query(querySelectAttStu, function (error, AttStu) {
                if (error) {
                    console.log(error)
                }
                connection.query(querySelectAllStu, function (error, AllStu) {
                    if (error) {
                        console.log(error)
                    }
                    connection.query(querySelectAttGroup, function (error, AttGroup) {
                        if (error) {
                            console.log(error)
                        }
                        connection.query(querySelectAllGroup, function (error, AllGroup) {
                            console.log("*******************")
                            console.log(AllGroup)
                            console.log("*******************")
                            if (error) {
                                console.log(error)
                            }
                            res.render('module.html', {
                                uname: uname,
                                modules: AllMod,
                                module: CurMod[0],
                                attStudents: AttStu,
                                allStudents: AllStu,
                                attGroups: AttGroup,
                                allGroups: AllGroup
                            })
                        })
                    })
                })
            })
        })
    })
    // connection.end()
})

web.get('/group', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }
    res.render('group.html')
})

web.get('/student', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }
    res.render('student.html')
})

web.post('/addModule', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }
    var add = req.body
    var stuPath = "./table/"+add.stuTable
    var groupPath = "./table/"+add.groupTable

    var stuSheetList = xlsx.parse(stuPath)
    var stuData = stuSheetList[0].data
    var groupSheetList = xlsx.parse(groupPath)
    var groupData = groupSheetList[0].data

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'traffic_feedback_system'
    })
    connection.connect()

    for (var i = 1; i < stuData.length; i++) {
        var queryInsertStu = 'INSERT INTO `student`(`ID`, `Name`, `Role`, `Department`, `Email`, `Phone`, `Module`, `Group`, ' +
            '`Project`, `Feedback1`, `Feedback2`, `Feedback3`, `Feedback4`, `Feedback5`) VALUES ("'+stuData[i][0]+'", "' +
            stuData[i][1]+'", "'+ stuData[i][2]+'", "'+stuData[i][3]+'", "'+stuData[i][4]+'", "'+stuData[i][5]+'", "'+add.modID+'", "'+
            stuData[i][7]+'", "'+stuData[i][8]+'", "'+stuData[i][9]+'", "'+stuData[i][10]+'", "'+
            stuData[i][11]+'", "'+stuData[i][12]+'", "'+stuData[i][13]+'")'
        connection.query(queryInsertStu, function (error, results) {
            if (error) {
                console.log(error)
            }
        })
    }

    for (var j = 1; j < groupData.length; j++) {
        var queryInsertGroup = 'INSERT INTO `grouping`(`module`, `teamNumber`, `Project`, `tm1`, `tm2`, `tm3`, `Feedback1`, ' +
            '`Feedback2`, `Feedback3`, `Feedback4`, `Feedback5`) VALUES ("'+add.modID+'", "' + groupData[j][1]+'", "'+
            groupData[j][2]+'", "'+groupData[j][3]+'", "'+groupData[j][4]+'", "'+groupData[j][5]+'", "'+groupData[j][6]+'", "'+
            groupData[j][7]+'", "'+groupData[j][8]+'", "'+groupData[j][9]+'", "'+groupData[j][10]+'")'
        connection.query(queryInsertGroup, function (error, results) {
            if (error) {
                console.log(error)
            }
        })
    }

    var queryInsert = 'INSERT INTO `module`(`moduleID`, `moduleName`, `lecturerID`, `description`, plan) VALUES ("'+add.modID+'", "'+add.modName+'", "'+uname+'", "'+add.modDes+'", "'+add.modPlan+'")'
    connection.query(queryInsert, function (error, results) {
        if (error) {
            console.log(error)
        }
    })
    connection.end()
    res.redirect('/')
})

web.post('/modifyModule', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }
    var modify = req.body
    // var stuPath = "./table/"+modify.stuTable
    // var groupPath = "./table/"+modify.groupTable
    //
    // var stuSheetList = xlsx.parse(stuPath)
    // var stuData = stuSheetList[0].data
    // var groupSheetList = xlsx.parse(groupPath)
    // var groupData = groupSheetList[0].data

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'traffic_feedback_system'
    })
    connection.connect()

    // for (var i = 1; i < stuData.length; i++) {
    //     var queryInsertStu = 'UPDATE `student` SET `ID`="'+stuData[i][0]+'" `Name`="'+stuData[i][1]+'" `Role`="'+stuData[i][2]+
    //         '" `Department`="'+stuData[i][3]+'" `Email`="'+stuData[i][4]+'" `Phone`="'+stuData[i][5]+'" `Module`="'+modify.modID+
    //         '" `Group`="'+stuData[i][7]+' `Project`="'+stuData[i][8]+'" `Feedback1`="'+stuData[i][9]+'" `Feedback2`="'+stuData[i][10]+
    //         '" `Feedback3`="'+stuData[i][11]+'" `Feedback4`="'+stuData[i][12]+'" `Feedback5`="'+stuData[i][13]+
    //         '" WHERE `moduleID`="'+modify.modID+'" and `teamNumber`="' + groupData[i][1]+'"'
    //     connection.query(queryInsertStu, function (error, results) {
    //         if (error) {
    //             console.log(error)
    //         }
    //     })
    // }
    //
    // for (var j = 1; j < groupData.length; j++) {
    //     var queryInsertGroup = 'UPDATE `grouping` SET `Project`="'+ groupData[j][2]+
    //         '" `tm1`="'+groupData[j][3]+'" `tm2`"'+groupData[j][4]+'" `tm3`="'+groupData[j][5]+'" `Feedback1`="'+groupData[j][6]+
    //         '" `Feedback2`="'+groupData[j][7]+'" `Feedback3`="'+groupData[j][8]+'" `Feedback4`="'+groupData[j][9]+
    //         '" `Feedback5`="'+groupData[j][10]+'" WHERE `moduleID`="'+modify.modID+'" and `teamNumber`="'+groupData[j][1]+'"'
    //     connection.query(queryInsertGroup, function (error, results) {
    //         if (error) {
    //             console.log(error)
    //         }
    //     })
    // }

    var queryInsert = 'UPDATE `module` SET `description`="'+modify.modDes+' `plan`="'+modify.modPlan+'" WHERE `moduleID`="'+modify.modID+'"'
    connection.query(queryInsert, function (error, results) {
        if (error) {
            console.log(error)
        }
    })
    connection.end()
    res.redirect('/')
})

web.get('/admin', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname

    } else {
        res.redirect('/login')
    }
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'traffic_feedback_system'
    })
    connection.connect()
    var queryAdd = 'SELECT * FROM module'
    connection.query(queryAdd, function (error, results) {
        if (error) {
            console.log(error)
        }
        res.render('admin.html', {
            module: results,
            uname: uname
        })
    })
    connection.end()
})

web.listen(3000, function () {
    console.log('server starts successfully.')
})