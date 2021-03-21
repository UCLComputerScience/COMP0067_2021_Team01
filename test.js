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
            res.redirect('/lecturerHomepage')
        }
        else {
            res.redirect('/pwError')
        }
    })
    connection.end()
})

web.get('/lecturerHomepage', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/expire')
    }
    var querySelect = 'SELECT * FROM Module WHERE employeeID = "' + uname + '"'
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
        for (var i = 1; i <= allModules.length; i++) {
            allModules[i-1].index = i;
        }
        res.render('lecturerHomepage.html', {
            uname: uname,
            modules: allModules
        })
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

    // query the information of the selected module
    var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="'+selectedModuleID+'"'

    // query the data used in student table
    var queryStudentAverageScore = 'SELECT studentSPR, AVG(score) avgScore FROM `StudentFeedback` ' +
        'WHERE moduleCode = "'+selectedModuleID+'" GROUP BY studentSPR'
    var queryStudentLastScore = 'SELECT studentSPR, score lastScore, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM StudentFeedback ' +
        'WHERE `moduleCode`="'+selectedModuleID+'" and (studentSPR, weekNumber) IN ' +
        '(SELECT studentSPR, MAX(weekNumber) FROM StudentFeedback WHERE `moduleCode`="'+selectedModuleID+'" GROUP BY studentSPR)'
    var queryStudentTeamProject = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
        'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber and ModStuTe.moduleCode=ProjectInfo.moduleCode) '
    var queryAllStudentTable = queryStudentTeamProject +
        'JOIN ('+queryStudentAverageScore+') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR)' +
        'JOIN ('+queryStudentLastScore+') AS stuLastScore ON (ModStuTe.studentSPR=stuLastScore.studentSPR)' +
        'WHERE ModStuTe.moduleCode="'+selectedModuleID+'"'

    // query the data used in group table
    var queryTeamMembers = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
        'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
        'WHERE `moduleCode`="'+selectedModuleID+'" GROUP BY ModStuTe.teamNumber '
    var queryGroupAverageScore = 'SELECT teamNumber, AVG(score) avgScore FROM `TeamFeedback` ' +
        'WHERE moduleCode = "'+selectedModuleID+'" GROUP BY teamNumber '
    var queryGroupLastScore = 'SELECT teamNumber, score lastScore, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM TeamFeedback ' +
        'WHERE `moduleCode`="'+selectedModuleID+'" and (teamNumber, weekNumber) IN ' +
        '(SELECT teamNumber, MAX(weekNumber) FROM TeamFeedback WHERE `moduleCode`="'+selectedModuleID+'" GROUP BY teamNumber) '
    var queryGroupProjectTA='SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
    var queryAllGroupTable = queryGroupProjectTA +
        ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) '+
        'JOIN ('+queryGroupAverageScore+') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
        'JOIN ('+queryGroupLastScore+') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
        'WHERE ProjectInfo.moduleCode="'+selectedModuleID+'" '

    // query the data used in student need attention table
    var queryAttStudentTable = queryStudentTeamProject +
        'JOIN ('+queryStudentAverageScore+') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR)' +
        'JOIN ('+queryStudentLastScore+') AS stuLastScore ON (ModStuTe.studentSPR=stuLastScore.studentSPR)' +
        'WHERE ModStuTe.moduleCode="'+selectedModuleID+'" and stuLastScore.lastScore < 5'

    // query the data used in group need attention table
    var queryAttGroupTable = queryGroupProjectTA +
        ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) '+
        'JOIN ('+queryGroupAverageScore+') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
        'JOIN ('+queryGroupLastScore+') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
        'WHERE ProjectInfo.moduleCode="'+selectedModuleID+'" and gLastScore.lastScore < 4.1 '

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'feedbackSystem'
    })
    connection.connect()

    connection.query(querySelectCurrentModule, function (error, currentModule) {
        if (error) {
            console.log(error)
        }
        connection.query(queryAllStudentTable, function (error, allStuInfo) {
            if (error) {
                console.log(error)
            }
            connection.query(queryAllGroupTable, function (error, allGroupInfo) {
                if (error) {
                    console.log(error)
                }
                connection.query(queryAttStudentTable, function (error, attStuInfo) {
                    if (error) {
                        console.log(error)
                    }
                    for (var i = 0; i < attStuInfo.length; i++) {
                        attStuInfo[i].index = i + 1
                    }
                    connection.query(queryAttGroupTable, function (error, attGroupInfo) {
                        if (error) {
                            console.log(error)
                        }
                        for (i = 0; i < attGroupInfo.length; i++) {
                            attGroupInfo[i].index = i + 1
                        }
                        // console.log(attGroupInfo)
                        res.render('module.html', {
                            uname: uname,
                            modules: allModule,
                            module: currentModule[0],
                            allStudents: allStuInfo,
                            allGroups: allGroupInfo,
                            attStudents: attStuInfo,
                            attGroups: attGroupInfo
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
        var allModules = req.session.allModules
    } else {
        res.redirect('/login')
    }

    var reqObj = req.query
    req.session.teamNumber = reqObj.teamNumber
    var teamNumber = req.session.teamNumber
    var selectedModuleID = req.session.moduleID

    // query the information of the selected module
    var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="'+selectedModuleID+'"'

    // query team members
    var queryTeamSMembers = 'SELECT Student.surname, Student.forename, ModStuTe.memberIndex FROM `Student` JOIN `ModStuTe` ' +
        'ON ModStuTe.studentSPR=Student.studentSPR ' +
        'WHERE ModStuTe.teamNumber="' + teamNumber + '" AND `moduleCode`="'+selectedModuleID+'" '

    // query team feedback and personal contributions
    var queryContribution = 'SELECT weekNumber WN, group_concat(contribution Separator ", ") contributions FROM `StudentFeedback` ' +
        'JOIN `ModStuTe` ON (ModStuTe.studentSPR=StudentFeedback.studentSPR AND ModStuTe.moduleCode=StudentFeedback.moduleCode) ' +
        'WHERE ModStuTe.moduleCode="'+selectedModuleID+'" AND teamNumber="'+teamNumber+'" GROUP BY weekNumber'
    var queryTeamFeedback = 'SELECT weekNumber, score, contributions, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date ' +
        'FROM `TeamFeedback` JOIN ('+ queryContribution+') AS Con ON TeamFeedback.weekNumber=WN ' +
        'WHERE teamNumber="' + teamNumber + '" AND `moduleCode`="'+selectedModuleID+'"'

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'feedbackSystem'
    })
    connection.connect()
    connection.query(querySelectCurrentModule, function (error, currentModule) {
        if (error) {
            console.log(error)
        }
        connection.query(queryTeamSMembers, function (error, teamMembers) {
            if (error) {
                console.log(error)
            }
            connection.query(queryTeamFeedback, function (error, teamFeedback) {
                if (error) {
                    console.log(error)
                }
                console.log(teamFeedback)
                res.render('group.html', {
                    uname: uname,
                    teamNumber: teamNumber,
                    modules: allModules,
                    module: currentModule[0],
                    member: teamMembers,
                    feedback: teamFeedback
                    // group: group[0],
                    // feedback: feedback
                })
            })
        })
    })
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
    var studentSPR = req.session.studentID
    var selectedModuleID = req.session.moduleID

    // query the information of the selected module
    var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="'+selectedModuleID+'"'

    // query the information of the selected student
    var queryStudentAverageScore = 'SELECT studentSPR, AVG(score) avgScore FROM `StudentFeedback` ' +
        'WHERE moduleCode = "'+selectedModuleID+'" GROUP BY studentSPR'
    var queryStudentTeamProject = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
        'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber and ModStuTe.moduleCode=ProjectInfo.moduleCode) '
    var querySelectStudent = queryStudentTeamProject +
        'JOIN ('+queryStudentAverageScore+') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR) ' +
        'WHERE ModStuTe.moduleCode="'+selectedModuleID+'" AND ModStuTe.studentSPR="'+studentSPR+'"'

    // query the feedback of the selected student
    var queryStudentFeedback = 'SELECT weekNumber, score, contribution, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date FROM studentFeedback WHERE studentSPR="'+studentSPR+'" AND moduleCode="'+selectedModuleID+'"'

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'feedbackSystem'
    })
    connection.connect()
    connection.query(querySelectCurrentModule, function (error, currentModule) {
        if (error) {
            console.log(error)
        }
        connection.query(querySelectStudent, function (error, student) {
            if (error) {
                console.log(error)
            }
            connection.query(queryStudentFeedback, function (error, feedback) {
                if (error) {
                    console.log(error)
                }
                // console.log("********************")
                // console.log(uname)
                // console.log(allModules)
                // console.log(currentModule[0])
                // console.log(feedback)
                // console.log(student)
                // console.log("********************")
                res.render('student.html', {
                    uname: uname,
                    modules: allModules,
                    module: currentModule[0],
                    student: student[0],
                    feedback: feedback
                })
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

    // // Insert into ModTeTA table
    // for (i = 1; i < groupingData.length; i++) {
    //     var queryInsertModTeTA = 'INSERT INTO `ModTeTA`(`moduleCode`, `teamNumber`, `taStudentSPR`) ' +
    //         'VALUES ("'+add.modID+'", "'+groupingData[i][0]+'", "'+groupingData[i][3]+'")'
    //     connection.query(queryInsertModTeTA, function (error, results) {
    //         if (error) {
    //             console.log(error)
    //         }
    //     })
    // }

    // Insert into ProjectInfo table
    for (i = 1; i < groupingData.length; i++) {
        var queryInsertProjectInfo = 'INSERT INTO `ProjectInfo`(`moduleCode`, `teamNumber`, `taStudentSPR`, `labCode`, `projectTitle`, `projectBrief`) ' +
            'VALUES ("'+add.modID+'", "'+groupingData[i][0]+'", "'+groupingData[i][3]+'", "" , "'+groupingData[i][1]+'", "'+groupingData[i][2]+'")'
        connection.query(queryInsertProjectInfo, function (error, results) {
            if (error) {
                console.log(error)
            }
        })
    }

    // Insert into Module table
    var queryInsertModule = 'INSERT INTO `Module`(`moduleCode`, `moduleName`, `moduleDescription`, `modulePlan`, `employeeID`, `csvPath`) ' +
        'VALUES ("'+add.modID+'", "'+add.modName+'", "'+add.modDes+'", "'+add.modPlan+'", "'+uname+'", "'+add.groupingTable+'")'
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

    var update = req.body

    var groupPath = "/public/table/"+update.groupingTable
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

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'feedbackSystem'
    })
    connection.connect()

    // Update Module table
    var queryUpdateModule = 'UPDATE `Module` SET `moduleName`="'+update.modName+'", `moduleDescription`="'+update.modDes+'", ' +
        '`modulePlan`="'+update.modPlan+'", `csvPath`="'+update.groupingTable+'" WHERE `moduleCode`="'+update.modID+'"'
    connection.query(queryUpdateModule, function (error, results) {
        if (error) {
            console.log(error)
        }
    })

    // Delete & insert ProjectInfo table
    var queryDeleteProjectInfo = 'DELETE FROM `ProjectInfo` WHERE `moduleCode`="'+update.modID+'"'
    connection.query(queryDeleteProjectInfo, function (error, results) {
        if (error) {
            console.log(error)
        }
    })
    for (var i = 1; i < groupingData.length; i++) {
        var queryInsertProjectInfo = 'INSERT INTO `ProjectInfo` (`moduleCode`, `teamNumber`, `taStudentSPR`, `labCode`, `projectTitle`, `projectBrief`) ' +
            'VALUES ("'+update.modID+'", "'+groupingData[i][0]+'", "'+groupingData[i][3]+'", "" , "'+groupingData[i][1]+'", "'+groupingData[i][2]+'")'
        connection.query(queryInsertProjectInfo, function (error, results) {
            if (error) {
                console.log(error)
            }
        })
    }

    // Delete & insert ModStuTe table
    var queryDeleteModStuTe = 'DELETE FROM `ModStuTe` WHERE `moduleCode`="'+update.modID+'"'
    connection.query(queryDeleteModStuTe, function (error, results) {
        if (error) {
            console.log(error)
        }
    })
    for (i = 1; i < groupingData.length; i++) {
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

    res.redirect('lecturerHomepage')
})

web.get('/admin', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
        var allModules = req.session.allModules
    } else {
        res.redirect('/login')
    }

    var querySelectAllModules = 'SELECT * FROM Module WHERE employeeID = "' + uname + '"'

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'feedbackSystem'
    })
    connection.connect()
    connection.query(querySelectAllModules, function (error, moduleInfo) {
        if (error) {
            console.log(error)
        }
        console.log(moduleInfo)
        res.render('admin.html', {
            modules: allModules,
            moduleInfo: moduleInfo,
            uname: uname
        })
    })
    connection.end()
})

web.listen(3000, function () {
    console.log('server starts successfully.')
})