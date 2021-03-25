var express = require('express')
var mysql = require('mysql')
var bodyParser = require('body-parser')
var xlsx = require('node-xlsx')
var fs = require('fs')
var web = express()
var databaseName = "feedback"
var password = ""
var username = "root"
var host = "localhost"

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
        host: host,
        user: username,
        password: password,
        database: databaseName
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
            if (loginInfo[0].userType === "lecturer"){
                // var queryUserInfo = 'SELECT * FROM `LoginInfo` '
                // connection.query(queryUserInfo, function (error, UserInfo) {
                //     if (error) {
                //         console.log(error)
                //     }
                //     console.log(user.uname, UserInfo)
                //     req.session.fullName = UserInfo[0].forename + ' ' + UserInfo[0].surname
                    res.redirect('/lecturer_homepage')
                // })
            }
            else if (loginInfo[0].userType === "student") {
                res.redirect('/student_homepage')
            }
            else if (loginInfo[0].userType === "TA") {
                res.redirect('/TA_homepage')
            }
        }
        else {
            res.redirect('/pwError')
        }
    })
    connection.end()
})

web.get('/lecturer_Homepage', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
        var fullName = req.session.fullName
    } else {
        res.redirect('/expire')
    }
    var querySelect = 'SELECT * FROM Module WHERE employeeID = "' + uname + '"'
    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
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
        res.render('lecturer_Homepage.html', {
            fullName: fullName,
            uname: uname,
            modules: allModules
        })
    })
    // connection.end()
})

web.get('/lecturer_module', function(req, res){
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

//test
//     var queryMembersTeam = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
//         'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
//         'WHERE `moduleCode`="'+selectedModID+'" GROUP BY ModStuTe.teamNumber '
//     var queryGroupAveScore = 'SELECT teamNumber, AVG(score) avgScore FROM `TeamFeedback` ' +
//         'WHERE moduleCode = "'+selectedModID+'" GROUP BY teamNumber '
//     var queryGroupLatestScore = 'SELECT teamNumber, score lastScore, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM TeamFeedback ' +
//         'WHERE `moduleCode`="'+selectedModID+'" and (teamNumber, weekNumber) IN ' +
//         '(SELECT teamNumber, MAX(weekNumber) FROM TeamFeedback WHERE `moduleCode`="'+selectedModID+'" GROUP BY teamNumber) '
//     var queryGroupTA='SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
//     var queryCoachedGroups = queryGroupTA +
//         ' JOIN (' + queryMembersTeam + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) '+
//         'JOIN ('+queryGroupAveScore+') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
//         'JOIN ('+queryGroupLatestScore+') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
//         'WHERE ProjectInfo.moduleCode="'+selectedModID+'" AND ProjectInfo.taStudentSPR="t123401" '



    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
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
            connection.query(queryAttGroupTable, function (error, allGroupInfo) {
                if (error) {
                    console.log(error)
                }
                connection.query(queryAttStudentTable, function (error, attStuInfo) {
                    if (error) {
                        console.log(error)
                    }
                    if (attStuInfo !== ''){
                        for (var i = 0; i < attStuInfo.length; i++) {
                            attStuInfo[i].index = i + 1
                        }
                    }
                    connection.query(queryAttGroupTable, function (error, attGroupInfo) {
                        if (error) {
                            console.log(error)
                        }
                        if (attGroupInfo !== ''){
                            for (i = 0; i < attGroupInfo.length; i++) {
                                attGroupInfo[i].index = i + 1
                            }
                        }
                        // console.log(allGroupInfo)
                        res.render('lecturer_module.html', {
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

web.get('/lecturer_group', function(req, res){
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
        host: host,
        user: username,
        password: password,
        database: databaseName
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
                // console.log(teamFeedback)
                res.render('lecturer_group.html', {
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

web.get('/lecturer_student', function(req, res){
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
        host: host,
        user: username,
        password: password,
        database: databaseName
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
                res.render('lecturer_student.html', {
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

web.post('/lecturer_addModule', function(req, res){
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
    // console.log(groupingData.length)
    // console.log(groupingData)


    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
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
    var queryInsertModule = 'INSERT INTO `Module`(`moduleCode`, `moduleName`, `moduleDescription`, `modulePlan`, `employeeID`) ' +
        'VALUES ("'+add.modID+'", "'+add.modName+'", "'+add.modDes+'", "'+add.modPlan+'", "'+uname+'")'
    connection.query(queryInsertModule, function (error, results) {
        if (error) {
            console.log(error)
        }
    })
    // connection.end()
    res.redirect('/lecturer_homepage')
})

web.post('/lecturer_modifyModule', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }

    var update = req.body

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()

    // Update Module table
    var queryUpdateModule = 'UPDATE `Module` SET `moduleName`="'+update.modName+'", `moduleDescription`="'+update.modDes+'", ' +
        '`modulePlan`="'+update.modPlan+'" WHERE `moduleCode`="'+update.modID+'"'
    connection.query(queryUpdateModule, function (error, results) {
        if (error) {
            console.log(error)
        }
    })

    if (update.groupingTable !== '') {
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
    }

    res.redirect('lecturer_homepage')
})

web.get('/lecturer_admin', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
        var allModules = req.session.allModules
    } else {
        res.redirect('/login')
    }

    var queryGroupNumber = 'SELECT moduleCode, COUNT(teamNumber) NumberOfTeam FROM `projectInfo` GROUP BY `moduleCode` '
    var queryStudentNumber = 'SELECT moduleCode, COUNT(studentSPR) NumberOfStudent FROM `ModStuTe` GROUP BY `moduleCode` '
    var queryAllModulesInfo = 'SELECT * FROM `Module` ' +
        'JOIN ('+queryGroupNumber+') AS GroupNumber ON Module.moduleCode=GroupNumber.moduleCode ' +
        'JOIN ('+queryStudentNumber+') AS StudentNumber ON Module.moduleCode=StudentNumber.moduleCode ' +
        'WHERE employeeID = "' + uname + '"'

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()
    connection.query(queryAllModulesInfo, function (error, moduleInfo) {
        if (error) {
            console.log(error)
        }
        // console.log(moduleInfo)
        res.render('lecturer_admin.html', {
            modules: allModules,
            moduleInfo: moduleInfo,
            uname: uname
        })
    })
    connection.end()
})

web.get('/studentview', function (req, res) {
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }
    var reqObj = req.query
    req.session.moduleID = reqObj.moduleID
    var moduleID = req.session.moduleID
    //var querySelectAllModule = 'SELECT * FROM module'
    var querySelectCurrentModule = 'SELECT * FROM module where `moduleCode`="' + moduleID + '"'
    var querySelectselectedStu = 'SELECT * FROM student where `studentSPR`="' + uname + '"'

    var queryFeedbackScore = 'SELECT AVG(score) AS score_avg FROM studentfeedback where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '"'

    var querySelectfeedback = 'SELECT * FROM studentfeedback where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '"'

    var querySelectTeamfeedback = 'SELECT * FROM teamfeedback where `moduleCode`="' + moduleID + '" and `teamNumber`= (SELECT teamNumber FROM modstute where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" )'

    var querySelectteam = 'SELECT * FROM modstute where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '"'
    var querySelectproject =
        'SELECT * FROM projectinfo where `moduleCode`="' + moduleID + '" and `teamNumber`= (SELECT teamNumber FROM modstute where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" )'

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()
    connection.query(querySelectCurrentModule, function (error, CMod) {
        if (error) {
            console.log(error)
        }
        connection.query(querySelectselectedStu, function (error, Stu) {
            if (error) {
                console.log(error)
            }
            connection.query(querySelectteam, function (error, Stea) {
                if (error) {
                    console.log(error)
                }
                connection.query(querySelectfeedback, function (error, SFd) {
                    if (error) {
                        console.log(error)
                    }
                    connection.query(querySelectTeamfeedback, function (error, StFd) {
                        if (error) {
                            console.log(error)
                        }
                        connection.query(querySelectproject, function (error, SPro) {
                            if (error) {
                                console.log(error)
                            }
                            connection.query(queryFeedbackScore, function (error, Score) {
                                if (error) {
                                    console.log(error)
                                }
                                console.log(Score[0])
                                console.log(SFd)
                                console.log(StFd)
                                // console.log(SPro)
                                res.render('studentview.html', {
                                    uname: uname,
                                    module: CMod[0],
                                    team: Stea[0],
                                    project: SPro[0],
                                    //module: CurMod[0],
                                    student: Stu[0],
                                    Selectfeedback: SFd,
                                    Selectteamfeedback: StFd,
                                    Score: Score[0]
                                })

                            })
                        })
                    })
                })
            })
        })
    })
})

web.get('/student_homepage', function (req, res) {
    if (req.session.uname) {
        var uname = req.session.uname
        var utype = req.session.utype
    } else {
        res.redirect('/expire')
    }
    //var querySelect = 'SELECT * FROM Module where moduleCode in (select moduleCode from modstute where studentSPR="' + uname + '" ) '
    var querySelect = 'SELECT * FROM Module where moduleCode in (select moduleCode from modstute where studentSPR="' + uname + '" ) '
    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()
    connection.query(querySelect, function (error, allMod) {
        if (error) {
            console.log(error)
        }
        req.session.allModules = allMod
        var allModules = req.session.allModules
        var html = [
            "Sorry student, you haven't registered a module",
        ]
        if (allModules.length === 0) {
            res.render('studentHomepage-Jade.html', {
                html: html,
                modules: allModules,
                uname: uname,
                utype: utype
            })
        } else {
            res.render('studentHomepage-Jade.html', {
                html: '',
                modules: allModules,
                uname: uname,
                utype: utype
            })
        }
    })
    // connection.end()
})

web.get('/TA_Homepage', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/expire')
    }
    var querySelectMods = 'SELECT * FROM Module WHERE Module.moduleCode IN (SELECT projectinfo.moduleCode FROM projectinfo JOIN ta ON (projectinfo.taStudentSPR=ta.taStudentSPR) WHERE projectinfo.taStudentSPR="'+uname+'")'

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()
    connection.query(querySelectMods, function (error, TAMods) {
        if (error) {
            console.log(error)
        }
        req.session.allMods = TAMods
        var allMods = req.session.allMods
        for (var i = 1; i <= allMods.length; i++) {
            allMods[i-1].index = i;
        }
        res.render('TA_homepage.html', {
            uname: uname,
            mods: allMods
        })
    })
    // connection.end()
})

web.get('/TA_module', function(req,res){
    if(req.session.uname){
        var uname = req.session.uname
    } else{
        res.redirect('/login')
    }
    var reqObj = req.query
    req.session.modID = reqObj.moduleID
    var selectedModID = req.session.modID

    var allModTA = req.session.allMods

    // This query selects the module names and module codes to display
    var querySelectCurrentMod = 'SELECT moduleName, moduleCode FROM Module WHERE `moduleCode`="'+selectedModID+'"'

    // This query shows all the groups a TA coaches
    var queryMembersTeam = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
        'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
        'WHERE `moduleCode`="'+selectedModID+'" GROUP BY ModStuTe.teamNumber '
    var queryGroupAveScore = 'SELECT teamNumber, AVG(score) avgScore FROM `TeamFeedback` ' +
        'WHERE moduleCode = "'+selectedModID+'" GROUP BY teamNumber '
    var queryGroupLatestScore = 'SELECT teamNumber, score lastScore, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM TeamFeedback ' +
        'WHERE `moduleCode`="'+selectedModID+'" and (teamNumber, weekNumber) IN ' +
        '(SELECT teamNumber, MAX(weekNumber) FROM TeamFeedback WHERE `moduleCode`="'+selectedModID+'" GROUP BY teamNumber) '
    var queryGroupTA='SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
    var queryCoachedGroups = queryGroupTA +
        'JOIN (' + queryMembersTeam + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) '+
        'JOIN ('+queryGroupAveScore+') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
        'JOIN ('+queryGroupLatestScore+') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
        'WHERE ProjectInfo.moduleCode="'+selectedModID+'" AND ProjectInfo.taStudentSPR="'+uname+'" '
    var query
    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()
    connection.query(querySelectCurrentMod,function(error, ModCurrent){
        if (error){
            console.log(error)
        }
        connection.query(queryCoachedGroups,function(error,TAGroups){
            if (error){
                console.log(error)
            }
            var studentNames =TAGroups[0].studentName
            var studentNamesArray = studentNames.split(',')


            res.render('TA_module.html',{
                uname: uname,
                modules: allModTA,
                module: ModCurrent[0],
                coachedGroups: TAGroups,
                studentNames: studentNamesArray

            })

        })
    })
})

web.get('/feedbackErin', function(req,res){
    if(req.session.uname){
        var uname = req.session.uname
    } else{
        res.redirect('/login')
    }
    var reqObj = req.query
    req.session.modID = reqObj.moduleID
    var selectedModID = req.session.modID
    var allModTA = req.session.allMods

    var querySelectCurrentMod = 'SELECT moduleName, moduleCode FROM Module WHERE `moduleCode`="'+selectedModID+'"'
    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()
    connection.query(querySelectCurrentMod,function(error, ModCurrent){
        if (error){
            console.log(error)
        }
        res.render('feedback-Erin.html',{
            uname: uname,
            modules: allModTA,
            module: ModCurrent[0],
        })

    })  
})

web.post('/provideFeedback', function(req,res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }
    var feedback = req.body
    var selectedModID = req.session.modID
    var studentScore = feedback.studentScore
    var studentContribution = feedback.studentContribution
    var feedbackStudent = feedback.studentFeedback
    // console.log(studentScore)
    // console.log(studentContribution)
    // console.log(feedbackStudent)
    
    var queryStudentSPR = 'SELECT studentSPR FROM ModStuTe WHERE moduleCode="'+selectedModID+'" AND teamNumber="'+feedback.teamNumber+'"'

    var insertTeamFeed = 'INSERT INTO teamfeedback (`moduleCode`,`weekNumber`,`teamNumber`,`score`,`writtenFeedback`,`messageLecturer`)' + 
        'VALUES ("'+selectedModID+'", "'+feedback.weekNumber+'", "'+feedback.teamNumber+'","'+feedback.teamScore+'", "'+feedback.feedbackTeam+'", "'+feedback.message+'")'

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()


    connection.query(insertTeamFeed,function(error,resultFeedback){
        if (error) {
            console.log(error)
        }
        connection.query(queryStudentSPR, function(error,resultStudents){
            if (error) {
                console.log(error)
            }
            var studentSPRNumber=[]
            for (i=0;i<resultStudents.length;i++){
                var studentSPR =resultStudents[i].studentSPR
                studentSPRNumber.push(studentSPR)
            }

            for (i=0; i<studentSPRNumber.length; i++) {
                var insertIntoStudentFeedback = 'INSERT INTO studentfeedback (`studentSPR`,`moduleCode`,`weekNumber`,`score`,`contribution`,`writtenFeedback`,`messageLecturer`)' + 
                'VALUES ("'+studentSPRNumber[i]+'","'+selectedModID+'", "'+feedback.weekNumber+'", "'+studentScore[i]+'", "'+studentContribution[i]+'", "'+feedbackStudent[i]+'", "'+feedback.message+'")'

                connection.query(insertIntoStudentFeedback,function(error,resultFeedback){
                        if (error) {
                            console.log(error)
                        }
                    })
            }
        })
    })
    res.redirect('/TA_homepage')
})

web.post('/updateFeedback', function(req,res){
        if (req.session.uname) {
            var uname = req.session.uname
        } else {
            res.redirect('/login')
        }
        var feedback = req.body
        var studentScore = [feedback.studentScore1,feedback.studentScore2,feedback.studentScore3]
        var studentContribution = [feedback.contributionStudent1,feedback.contributionStudent2,feedback.contributionStudent3]
        var feedbackStudent = [feedback.feedbackStudent1,feedback.feedbackStudent2,feedback.feedbackStudent3]
        var studentSPR =['20063053','20035389','19056538']

        var connection = mysql.createConnection({
            host: host,
            user: username,
            password: password,
            database: databaseName
        })
        connection.connect()

        var updateTeamFeed = 'Update teamfeedback SET `score`="'+feedback.teamScore+'" `writtenFeedback`="'+feedback.feedbackTeam+'" `messageLecturer`="'+feedback.message+'" WHERE `moduleCode`="COMP0067" AND `weekNumber`="'+feedback.weekNumber+'"  AND `teamNumber`="1"'
        connection.query(updateTeamFeed,function(error,resultUpdate){
            if (error) {
                console.log(error)
            }
        })

        for (i=0; i<studentScore.length; i++) {
            var updateStudentFeedback = 'Update studentfeedback SET `score`="'+studentScore[i]+'" `contribution`="'+studentContribution[i]+'" `writtenFeedbaack`="'+feedbackStudent[i]+'" `messageLecturer`="'+feedback.message+'" WHERE `studentSPR`="'+studentSPR[i]+'" AND `moduleCode`="COMP0067" AND `weekNumber`= "'+feedback.weekNumber+'"'

            connection.query(updateStudentFeedback,function(error,resultUpdate){
                if (error) {
                    console.log(error)
                }
            })
        }
        connection.end()
        res.redirect('/TA_homepage')
    }
)

web.get('/UpdatePage',function(req, res) {
    if (req.session.uname){
        var uname = req.session.uname
        var allModules = req.session.allModules
    } else {
        res.redirect('/login')
    }

    var querySelectFeedbackTeam = 'SELECT * FROM teamfeedback  WHERE `moduleCode`="COMP0067" AND `weekNumber`="'+feedback.weekNumber+'"  AND `teamNumber`="1"'
    var querySelectFeedbackStudent = 'SELECT * FROM studentfeedback WHERE `studentSPR`="'+studentSPR[i]+'" AND `moduleCode`="COMP0067" AND `weekNumber`= "'+feedback.weekNumber+'"'

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()
    connection.query(querySelectFeedbackTeam, function(error,updateInfo){
        if (error){
            console.log(error)
        }
        res.render('UpdatePage-Erin.html',{

        })
    })
})

web.listen(3000, function () {
    console.log('server starts successfully.')
})