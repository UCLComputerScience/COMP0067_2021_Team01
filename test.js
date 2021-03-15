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
    var queryLogin = 'SELECT `password`, `userType` FROM `LoginInfo` WHERE `username`="'+user.uname+'"'
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'feedbackSystem'
    })
    connection.connect()

    connection.query(queryLogin, function (error, loginInfo) {
        if (error) {
            console.log(error)
        }
        if (loginInfo.length === 0) {
            res.redirect('/pwError')
        }
        else if (loginInfo[0].password === user.upassword) {
            if (loginInfo[0].userType === "lecturer")
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
    var querySelect = 'SELECT * FROM Module'
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'feedbackSystem'
    })
    connection.connect()
    connection.query(querySelect, function (error, allMod) {
        if (error) {
            console.log(error)
        }
        req.session.allModules = allMod
        var allModules = req.session.allModules
        var html = [
            "Sorry lecturer, you haven't registered a module",
            "Please go to ",
            "Admin page ",
            "to create your module"
            ]
        if (allModules.length ===0){
            res.render('index.html', {
                html: html,
                modules: allModules,
                uname: uname
            })
        } else {
            res.render('index.html', {
                html: '',
                modules: allModules,
                uname: uname
            })
        }
    })
    // connection.end()
})

web.get('/module', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
        var allModule = req.session.allModules
    } else {
        res.redirect('/login')
    }
    var reqObj = req.query
    req.session.moduleID = reqObj.moduleID
    var selectedModuleID = req.session.moduleID

    var querySelectCurrentModule = 'SELECT * FROM Module where `moduleCode`="'+selectedModuleID+'"'
    var querySelectAllStu = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
        'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber and ModStuTe.moduleCode=ProjectInfo.moduleCode) ' +
        'WHERE ModStuTe.moduleCode="'+selectedModuleID+'"'
    var querySelectStudentAverageScore = 'SELECT StudentFeedback.studentSPR, AVG(StudentFeedback.score) avgScore FROM `StudentFeedback` JOIN `ModStuTe` ON (ModStuTe.moduleCode=StudentFeedback.moduleCode ' +
        'and ModStuTe.studentSPR=StudentFeedback.studentSPR) GROUP BY (ModStuTe.studentSPR)'
    // var querySelectStudentLastScore = '(SELECT StudentFeedback.studentSPR, StudentFeedback.score, StudentFeedback.weekNumber weekNumber FROM `StudentFeedback` ' +
    //     'LEFT JOIN (SELECT MAX(StudentFeedback.weekNumber) maxWeek FROM `StudentFeedback` GROUP BY StudentFeedback.studentSPR) ON (weekNumber=maxWeek)' +
    //     'JOIN `ModStuTe` ON (ModStuTe.studentSPR=StudentFeedback.studentSPR)'
    var queryAllStudentTable = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
        'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber and ModStuTe.moduleCode=ProjectInfo.moduleCode) ' +
        'JOIN ('+querySelectStudentAverageScore+') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR)' +
        'JOIN ' +
        'WHERE ModStuTe.moduleCode="'+selectedModuleID+'"'
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'feedbackSystem'
    })
    connection.connect()

    connection.query(querySelectCurrentModule, function (error, currentModuleName) {
        if (error) {
            console.log(error)
        }
        connection.query(queryAllStudentTable, function (error, allStuInfo) {
            if (error) {
                console.log(error)
            }
            // console.log(allStudents)
            // console.log(allStuInfo)
            res.render('module.html', {
                uname: uname,
                modules: allModule,
                module: currentModuleName[0],
                allStudents: allStuInfo
            })
        })
    })



        // connection.query(querySelectCurrentModule, function (error, CurMod) {
        //     if (error) {
        //         console.log(error)
        //     }
        //     connection.query(querySelectAttStu, function (error, AttStu) {
        //         if (error) {
        //             console.log(error)
        //         }
        //         connection.query(querySelectAllStu, function (error, AllStu) {
        //             if (error) {
        //                 console.log(error)
        //             }
        //             connection.query(querySelectAttGroup, function (error, AttGroup) {
        //                 if (error) {
        //                     console.log(error)
        //                 }
        //                 connection.query(querySelectAllGroup, function (error, AllGroup) {
        //                     if (error) {
        //                         console.log(error)
        //                     }
        //                     res.render('module.html', {
        //                         uname: uname,
        //                         modules: allModule,
        //                         module: CurMod[0],
        //                         attStudents: AttStu,
        //                         allStudents: AllStu,
        //                         attGroups: AttGroup,
        //                         allGroups: AllGroup
        //                     })
        //                 })
        //             })
        //         })
        //     })
        // })

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
        var allModules = req.session.allModules
    } else {
        res.redirect('/login')
    }
    var reqObj = req.query
    req.session.studentID = reqObj.studentID
    var studentID = req.session.studentID
    var moduleID = req.session.moduleID
    var querySelectCurrentModule = 'SELECT * FROM `module` where `moduleID`="'+moduleID+'"'
    var querySelectStu = 'SELECT * FROM student where `Module`="'+moduleID+'" and ID="'+studentID+'"'
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'traffic_feedback_system'
    })
    connection.connect()
    connection.query(querySelectCurrentModule, function (error, CurMod) {
        if (error) {
            console.log(error)
        }
        connection.query(querySelectStu, function (error, student) {
            if (error) {
                console.log(error)
            }
            // console.log("********************")
            // console.log(student)
            // console.log("********************")
            res.render('student.html', {
                uname: uname,
                modules: allModules,
                module: CurMod[0],
                student: student[0],
            })
        })
    })
})

web.post('/addModule', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }
    var add = req.body

    var groupPath = "./table/"+add.groupingTable
    var groupingSheetList = xlsx.parse(groupPath)
    var groupingData = groupingSheetList[0].data

    //calculate how many members in one team and the members' columns in the table
    var groupingHeader = groupingData[0]
    var membersInTeam = 0
    var indexArray = []
    for (var n = 0; n < groupingHeader.length; n++) {
        if (groupingHeader[n].indexOf("member") != -1) {
            indexArray[membersInTeam] = n
            membersInTeam += 1
        }
    }
    console.log(groupingData.length)
    console.log(groupingData)


    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'feedbackSystem'
    })
    connection.connect()

    // Insert into ModStuTe table
    for (var i = 1; i < groupingData.length; i++) {
        for (var j = 0; j < membersInTeam; j++) {
            var queryInsertModStuTe = 'INSERT INTO `ModStuTe`(`studentSPR`, `moduleCode`, `teamNumber`, `memberIndex`) ' +
                'VALUES ("'+groupingData[i][indexArray[j]]+'", "'+add.modID+'", "'+groupingData[i][0]+'", "'+(j+1)+'")'
            connection.query(queryInsertModStuTe, function (error, results) {
                if (error) {
                    console.log(error)
                }
            })
        }
    }

    // Insert into ModTeTA table
    for (i = 1; i < groupingData.length; i++) {
        var queryInsertModTeTA = 'INSERT INTO `ModTeTA`(`moduleCode`, `teamNumber`, `taStudentSPR`) ' +
            'VALUES ("'+add.modID+'", "'+groupingData[i][0]+'", "'+groupingData[i][3]+'")'
        connection.query(queryInsertModTeTA, function (error, results) {
            if (error) {
                console.log(error)
            }
        })
    }

    // Insert into ProjectInfo table
    for (i = 1; i < groupingData.length; i++) {
        var queryInsertProjectInfo = 'INSERT INTO `ProjectInfo`(`moduleCode`, `teamNumber`, `labCode`, `projectTitle`, `projectBrief`) ' +
            'VALUES ("'+add.modID+'", "'+groupingData[i][0]+'","" , "'+groupingData[i][1]+'", "'+groupingData[i][2]+'")'
        connection.query(queryInsertProjectInfo, function (error, results) {
            if (error) {
                console.log(error)
            }
        })
    }

    // Insert into Module table
    var queryInsertModule = 'INSERT INTO `Module`(`moduleCode`, `moduleName`, `moduleDescription`, `modulePlan`, `employeeID`) ' +
        'VALUES ("'+add.modID+'", "'+add.modName+'", "'+add.modDes+'", "'+add.modPlan+'", "'+uname+'")'
    connection.query(queryInsertModule, function (error, results) {
        if (error) {
            console.log(error)
        }
    })
    // connection.end()
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
        var allModules = req.session.allModules
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
    res.render('admin.html', {
        modules: allModules,
        uname: uname
    })
    connection.end()
})

web.listen(3000, function () {
    console.log('server starts successfully.')
})