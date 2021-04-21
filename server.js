var express = require('express')
var mysql = require('mysql')
var bodyParser = require('body-parser')
var xlsx = require('node-xlsx')
var fs = require('fs')
var objToCsv = require('objects-to-csv')

var web = express()
var databaseName = "feedback"
var password = "password"
var username = "username"
var host = "localhost"

web.engine('html', require('express-art-template'))
web.use(bodyParser.urlencoded({extended: false}))
web.use(bodyParser.json())

var session = require('express-session')
web.use(session({
    secret: 'qweqweqweqwe',
    cookie: { maxAge: 20 * 60 * 1000 },
    resave: true,
    saveUninitialized: true
}));

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
    var queryYS = 'SELECT `yearTerm` FROM `CurrentYearTerm` WHERE `employeeID`="admin"'
    // var query_delete_YearSemester = 'DELETE FROM `CurrentYearTerm` WHERE `employeeID`="admin"'
    var queryInsertYS = 'INSERT INTO `CurrentYearTerm`(`yearTerm`, `employeeID`) VALUES ("2021-1", "admin")'

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

        if (typeof loginInfo === "undefined" || loginInfo.length === 0) {
            res.redirect('/pwError')
        }
        else if (loginInfo[0].password === user.upassword) {
            connection.query(queryYS, function (error, YS) {
                if (error) {
                    console.log(error)
                }
                if (Array.isArray(YS) && YS.length === 0) {
                    connection.query(queryInsertYS, function (error, YS) {
                        if (error) {
                            console.log(error)
                        }
                        req.session.ys = "2021-1"
                    })
                }
                else {
                    req.session.ys = YS[0].yearTerm
                }
                if (loginInfo[0].userType === "lecturer"){
                    res.redirect('/lecturer_homepage')
                }
                else if (loginInfo[0].userType === "student") {
                    res.redirect('/student_homepage')
                }
                else if (loginInfo[0].userType === "TA") {
                    res.redirect('/TA_homepage')
                }
            })
        }
        else {
            res.redirect('/pwError')
        }
    })
    // connection.end()
})

web.get('/lecturer_Homepage', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
        var YS = req.session.ys
    } else {
        res.redirect('/expire')
    }
    var querySelect = 'SELECT * FROM `Module` WHERE `yearTerm`="'+YS+'" AND `employeeID`="'+uname+'"'
    var queryFullName = 'SELECT `surname`, `forename` FROM `Lecturer` WHERE `employeeID`="'+uname+'"'
    // console.log(querySelect)
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
        if (typeof allModules !== "undefined") {
            for (var i = 1; i <= allModules.length; i++) {
                allModules[i-1].index = i;
            }
        }
        connection.query(queryFullName, function (error, fullName) {
            if (error) {
                console.log(error)
            }
            req.session.lFullName = fullName[0].forename + ' ' + fullName[0].surname
            res.render('lecturer_Homepage.html', {
                fullName: fullName,
                uname: req.session.lFullName,
                modules: allModules,
                YS: req.session.ys
            })
        })
    })
    // connection.end()
})

web.get('/lecturer_module', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
        var allModule = req.session.allModules
        var selectedYT = req.session.ys
    } else {
        res.redirect('/login')
    }
    var reqObj = req.query
    req.session.moduleID = reqObj.moduleID
    req.session.selectedYT = reqObj.YT
    var selectedModuleID = req.session.moduleID

    // query the information of the selected module
    var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'"'

    // query the data used in student table
    var queryStudentAverageScore = 'SELECT studentSPR, AVG(score) avgScore FROM `StudentFeedback` ' +
        'WHERE moduleCode = "'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" GROUP BY studentSPR'
    var queryStudentLastScore = 'SELECT studentSPR, score lastScore, weekNumber, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM StudentFeedback ' +
        'WHERE `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" AND (studentSPR, weekNumber) IN ' +
        '(SELECT studentSPR, MAX(weekNumber) FROM StudentFeedback WHERE `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" GROUP BY studentSPR)'
    var queryStudentTeamProject = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
        'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber AND ModStuTe.moduleCode=ProjectInfo.moduleCode AND ModStuTe.yearTerm=ProjectInfo.yearTerm) '
    var queryAllStudentTable = queryStudentTeamProject +
        'JOIN ('+queryStudentAverageScore+') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR)' +
        'JOIN ('+queryStudentLastScore+') AS stuLastScore ON (ModStuTe.studentSPR=stuLastScore.studentSPR)' +
        'WHERE ModStuTe.moduleCode="'+selectedModuleID+'" AND ModStuTe.yearTerm="'+selectedYT+'"'

    // query the data used in group table
    var queryTeamMembers = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
        'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
        'WHERE `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" GROUP BY ModStuTe.teamNumber '
    var queryGroupAverageScore = 'SELECT teamNumber, AVG(score) avgScore FROM `TeamFeedback` ' +
        'WHERE moduleCode = "'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" GROUP BY teamNumber '
    var queryGroupLastScore = 'SELECT teamNumber, score lastScore, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM TeamFeedback ' +
        'WHERE `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" AND (teamNumber, weekNumber) IN ' +
        '(SELECT teamNumber, MAX(weekNumber) FROM TeamFeedback WHERE `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" GROUP BY teamNumber) '
    var queryGroupProjectTA='SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
    var queryAllGroupTable = queryGroupProjectTA +
        ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) '+
        'JOIN ('+queryGroupAverageScore+') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
        'JOIN ('+queryGroupLastScore+') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
        'WHERE ProjectInfo.moduleCode="'+selectedModuleID+'" AND ProjectInfo.yearTerm="'+selectedYT+'" '

    // query the data used in student need attention table
    var queryAttStudentTable = queryStudentTeamProject +
        'JOIN ('+queryStudentAverageScore+') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR)' +
        'JOIN ('+queryStudentLastScore+') AS stuLastScore ON (ModStuTe.studentSPR=stuLastScore.studentSPR)' +
        'WHERE ModStuTe.moduleCode="'+selectedModuleID+'" AND ModStuTe.yearTerm="'+selectedYT+'" AND stuLastScore.lastScore < 5'

    // query the data used in group need attention table
    var queryAttGroupTable = queryGroupProjectTA +
        ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) '+
        'JOIN ('+queryGroupAverageScore+') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
        'JOIN ('+queryGroupLastScore+') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
        'WHERE ProjectInfo.moduleCode="'+selectedModuleID+'" AND ProjectInfo.yearTerm="'+selectedYT+'" AND gLastScore.lastScore < 4.1 '

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
            connection.query(queryAllGroupTable, function (error, allGroupInfo) {
                if (error) {
                    console.log(error)
                }
                connection.query(queryAttStudentTable, function (error, attStuInfo) {
                    if (error) {
                        console.log(error)
                    }
                    if (typeof attStuInfo !== 'undefined'){
                        for (var i = 0; i < attStuInfo.length; i++) {
                            attStuInfo[i].index = i + 1
                        }
                    }
                    connection.query(queryAttGroupTable, function (error, attGroupInfo) {
                        if (error) {
                            console.log(error)
                        }
                        if (typeof attGroupInfo !== 'undefined'){
                            for (i = 0; i < attGroupInfo.length; i++) {
                                attGroupInfo[i].index = i + 1
                            }
                        }
                        // console.log(attGroupInfo)
                        res.render('lecturer_module.html', {
                            uname: req.session.lFullName,
                            modules: allModule,
                            module: currentModule[0],
                            allStudents: allStuInfo,
                            allGroups: allGroupInfo,
                            attStudents: attStuInfo,
                            attGroups: attGroupInfo,
                            YS: req.session.ys
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
        var selectedYT = req.session.ys
    } else {
        res.redirect('/login')
    }

    var reqObj = req.query
    req.session.teamNumber = reqObj.teamNumber
    var teamNumber = req.session.teamNumber
    var selectedModuleID = req.session.moduleID

    // query the information of the selected module
    var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'"'

    // query team members
    var queryTeamSMembers = 'SELECT Student.surname, Student.forename, ModStuTe.memberIndex, fileLocation FROM `Student` JOIN `ModStuTe` ' +
        'ON ModStuTe.studentSPR=Student.studentSPR ' +
        'WHERE ModStuTe.teamNumber="' + teamNumber + '" AND `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" '

    // query team feedback and personal contributions
    var queryContribution = 'SELECT weekNumber WN, group_concat(contribution Separator ", ") contributions FROM `StudentFeedback` ' +
        'JOIN `ModStuTe` ON (ModStuTe.studentSPR=StudentFeedback.studentSPR AND ModStuTe.moduleCode=StudentFeedback.moduleCode AND ModStuTe.yearTerm=StudentFeedback.yearTerm) ' +
        'WHERE ModStuTe.moduleCode="'+selectedModuleID+'" AND teamNumber="'+teamNumber+'" AND StudentFeedback.yearTerm="'+selectedYT+'" GROUP BY weekNumber'
    var queryTeamFeedback = 'SELECT weekNumber, score, contributions, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date ' +
        'FROM `TeamFeedback` JOIN ('+ queryContribution+') AS Con ON TeamFeedback.weekNumber=WN ' +
        'WHERE teamNumber="' + teamNumber + '" AND `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'"'

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
            req.session.teamMember = 0
            for (var i = 0; i < teamMembers.length; i++) {
                // console.log(teamMembers[i].fileLocation)
                fs.exists("./public/images/"+teamMembers[i].fileLocation, (exists) => {
                    if (exists === false) {
                        teamMembers[req.session.teamMember].fileLocation = "/public/images/profile_default.jpeg"
                        req.session.teamMember ++
                        // console.log(req.session.teamMember)
                    }
                    else {
                        if (teamMembers[req.session.teamMember].fileLocation === '') {
                            teamMembers[req.session.teamMember].fileLocation = "/public/images/profile_default.jpeg"
                        }
                        else {
                            teamMembers[req.session.teamMember].fileLocation = "/public/images/" + teamMembers[req.session.teamMember].fileLocation
                        }
                        req.session.teamMember ++
                    }
                });
            }
            connection.query(queryTeamFeedback, function (error, teamFeedback) {
                if (error) {
                    console.log(error)
                }
                // console.log(teamFeedback)
                res.render('lecturer_group.html', {
                    uname: req.session.lFullName,
                    teamNumber: teamNumber,
                    modules: allModules,
                    module: currentModule[0],
                    member: teamMembers,
                    feedback: teamFeedback,
                    YS: req.session.ys
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
        var selectedYT = req.session.ys
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
        'WHERE moduleCode = "'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" GROUP BY studentSPR'
    var queryStudentTeamProject = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
        'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber and ModStuTe.moduleCode=ProjectInfo.moduleCode) '
    var querySelectStudent = queryStudentTeamProject +
        'JOIN ('+queryStudentAverageScore+') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR) ' +
        'WHERE ModStuTe.moduleCode="'+selectedModuleID+'" AND ModStuTe.studentSPR="'+studentSPR+'" AND ModStuTe.yearTerm="'+selectedYT+'"'

    // query the feedback of the selected student
    var queryStudentFeedback = 'SELECT weekNumber, score, contribution, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date FROM studentFeedback ' +
        'WHERE studentSPR="'+studentSPR+'" AND moduleCode="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'"'

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
            fs.exists("/public/images/"+student[0].fileLocation, (exists) => {
                if (exists === false) {
                    student[0].fileLocation = "/public/images/profile_default.jpeg"
                }
            });
            connection.query(queryStudentFeedback, function (error, feedback) {
                if (error) {
                    console.log(error)
                }
                res.render('lecturer_student.html', {
                    uname: req.session.lFullName,
                    modules: allModules,
                    module: currentModule[0],
                    student: student[0],
                    feedback: feedback,
                    YS: req.session.ys
                })
            })
        })
    })
})

web.post('/lecturer_addModule', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
        var selectedYT = req.session.ys
    } else {
        res.redirect('/login')
    }
    var add = req.body

    var groupPath = "./public/table/"+add.groupingTable
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
            var queryInsertModStuTe = 'INSERT INTO `ModStuTe`(`studentSPR`, `moduleCode`, `yearTerm`, `teamNumber`, `memberIndex`) ' +
                'VALUES ("'+groupingData[i][indexArray[j]]+'", "'+add.modID+'", "'+selectedYT+'", "'+groupingData[i][0]+'", "'+(j+1)+'")'
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
        var queryInsertProjectInfo = 'INSERT INTO `ProjectInfo`(`moduleCode`, `yearTerm`, `teamNumber`, `taStudentSPR`, `labCode`, `projectTitle`, `projectBrief`) ' +
            'VALUES ("'+add.modID+'", "'+selectedYT+'", "'+groupingData[i][0]+'", "'+groupingData[i][3]+'", "" , "'+groupingData[i][1]+'", "'+groupingData[i][2]+'")'
        connection.query(queryInsertProjectInfo, function (error, results) {
            if (error) {
                console.log(error)
            }
        })
    }

    // Insert into Module table
    var queryInsertModule = 'INSERT INTO `Module`(`moduleCode`, `yearTerm`, `moduleName`, `moduleDescription`, `modulePlan`, `employeeID`) ' +
        'VALUES ("'+add.modID+'", "'+selectedYT+'", "'+add.modName+'", "'+add.modDes+'", "'+add.modPlan+'", "'+uname+'")'
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
        var selectedYT = req.session.ys
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
        '`modulePlan`="'+update.modPlan+'" WHERE `moduleCode`="'+update.modID+'" AND `yearTerm`="'+selectedYT+'"'
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
        var queryDeleteProjectInfo = 'DELETE FROM `ProjectInfo` WHERE `moduleCode`="'+update.modID+'" AND `yearTerm`="'+selectedYT+'"'
        connection.query(queryDeleteProjectInfo, function (error, results) {
            if (error) {
                console.log(error)
            }
        })
        for (var i = 1; i < groupingData.length; i++) {
            var queryInsertProjectInfo = 'INSERT INTO `ProjectInfo` (`moduleCode`, `yearTerm`, `teamNumber`, `taStudentSPR`, `labCode`, `projectTitle`, `projectBrief`) ' +
                'VALUES ("'+update.modID+'", "'+selectedYT+'", "'+groupingData[i][0]+'", "'+groupingData[i][3]+'", "" , "'+groupingData[i][1]+'", "'+groupingData[i][2]+'")'
            connection.query(queryInsertProjectInfo, function (error, results) {
                if (error) {
                    console.log(error)
                }
            })
        }

        // Delete & insert ModStuTe table
        var queryDeleteModStuTe = 'DELETE FROM `ModStuTe` WHERE `moduleCode`="'+update.modID+'" AND `yearTerm`="'+selectedYT+'"'
        connection.query(queryDeleteModStuTe, function (error, results) {
            if (error) {
                console.log(error)
            }
        })
        for (i = 1; i < groupingData.length; i++) {
            for (var j = 0; j < membersInTeam; j++) {
                var queryInsertModStuTe = 'INSERT INTO `ModStuTe`(`studentSPR`, `moduleCode`, `yearTerm`, `teamNumber`, `memberIndex`) ' +
                    'VALUES ("'+groupingData[i][indexArray[j]]+'", "'+add.modID+'", "'+selectedYT+'", "'+groupingData[i][0]+'", "'+(j+1)+'")'
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

web.get('/lecturer_setYS', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }

    req.session.y_s = req.query.YS
    // console.log(req.query.YS)
    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()

    var query_delete_YearSemester = 'DELETE FROM `CurrentYearTerm` WHERE `employeeID`="'+uname+'"'
    var query_setYearSemester = 'INSERT INTO `CurrentYearTerm`(`yearTerm`, `employeeID`) VALUES ("'+ req.session.y_s +'", "'+uname+'")'
    var queryYS = 'SELECT `yearTerm` FROM `CurrentYearTerm` WHERE `employeeID`="'+uname+'"'
    // console.log(query_setYearSemester)
    connection.query(query_delete_YearSemester, function (error, results) {
        if (error) {
            console.log(error)
        }
        connection.query(query_setYearSemester, function (error, results) {
            if (error) {
                console.log(error)
            }
            connection.query(queryYS, function (error, YS) {
                if (error) {
                    console.log(error)
                }
                req.session.ys = YS[0].yearTerm
                res.redirect('/lecturer_homepage')
            })
        })
    })
    // res.redirect('lecturer_homepage')
})

web.post('/lecturer_exportCsv', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }

    var module = ''

    req.session.export_module = req.body.module

    console.log(typeof req.session.export_module !== "undefined")
    if (typeof req.session.export_module !== "undefined") {
        if (req.session.export_module.length === 0) {
            res.redirect('lecturer_admin')
        }
        else if (typeof req.session.export_module === "string") {
            module = req.session.export_module
        }
        else {
            module = req.session.export_module[0]
        }
        res.redirect('lecturer_exportCsv?module='+module+'')
    }
    else {
        res.redirect('lecturer_admin')
    }
})

web.get('/lecturer_exportCsv', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
        var selectedYT = req.session.ys
    } else {
        res.redirect('/login')
    }
    var module = req.query.module
    // console.log(module)
    fs.exists('./module_database_csv', (exists) => {
        if (exists === false) {
            fs.mkdir('module_database_csv', (err) => {
                if (err) return console.log(err, '--->mkdir<---')
            })
        }
    });

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()

    var queryStudentScore = 'SELECT studentSPR, score, writtenFeedback, contribution, weekNumber FROM `StudentFeedback` ' +
        'WHERE moduleCode = "'+module+'" AND yearTerm="'+selectedYT+'"'
    var queryStudentTeamProject = 'SELECT Student.studentSPR, surname, forename, department, email, weekNumber, score, contribution, writtenFeedback ' +
        'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR '
    var queryStudentFeedback = queryStudentTeamProject +
        'JOIN ('+queryStudentScore+') AS stuScore ON (ModStuTe.studentSPR=stuScore.studentSPR)' +
        'WHERE ModStuTe.moduleCode="'+module+'" AND ModStuTe.yearTerm="'+selectedYT+'"'
    var queryTeamFeedback = 'SELECT TeamFeedback.teamNumber, projectTitle, weekNumber, score, writtenFeedback ' +
        'FROM `TeamFeedback` JOIN `ProjectInfo` ON TeamFeedback.moduleCode=ProjectInfo.moduleCode AND TeamFeedback.teamNumber=ProjectInfo.teamNumber ' +
        'AND TeamFeedback.yearTerm=ProjectInfo.yearTerm ' +
        'WHERE TeamFeedback.moduleCode="'+module+'" AND TeamFeedback.yearTerm="'+selectedYT+'"'

    fs.exists('./module_database_csv/'+module+'.csv', (exists) => {
        if (exists === true) {
            fs.unlink('./module_database_csv/' + module + '.csv', err => {
                if (err) {
                    console.log(err);
                }
            })
        }
    });

    connection.query(queryStudentFeedback, function (error, StudentFeedback) {
        if (error) {
            console.log(error)
        }
        // console.log(StudentFeedback)
        const csv = new objToCsv(StudentFeedback)
        csv.toDisk('./module_database_csv/'+module+'_'+selectedYT+'.csv')

        connection.query(queryTeamFeedback, function (error, TeamFeedback) {
            if (error) {
                console.log(error)
            }
            // console.log(TeamFeedback)
            const csv = new objToCsv(TeamFeedback)
            csv.toDisk('./module_database_csv/'+module+'_'+selectedYT+'.csv', {append: true})
        })
    })

    // console.log(req.session.export_module)
    // console.log("***************")
    // console.log(typeof req.session.export_module)
    // console.log("***************")

    if (typeof req.session.export_module === "string") {
        res.redirect('lecturer_admin')
    }
    else {
        req.session.export_module.shift()
        if (req.session.export_module.length === 0) {
            res.redirect('lecturer_admin')
        }
        else {
            res.redirect('lecturer_exportCsv?module='+req.session.export_module[0])
        }
    }
})

web.get('/lecturer_admin', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
        var allModules = req.session.allModules
        var selectedYT = req.session.ys
    } else {
        res.redirect('/login')
    }

    var queryGroupNumber = 'SELECT moduleCode, COUNT(teamNumber) NumberOfTeam FROM `projectInfo` WHERE yearTerm="'+selectedYT+'" ' +
        'GROUP BY `moduleCode` '
    var queryStudentNumber = 'SELECT moduleCode, COUNT(studentSPR) NumberOfStudent FROM `ModStuTe` WHERE yearTerm="'+selectedYT+'" ' +
        'GROUP BY `moduleCode` '
    var queryAllModulesInfo = 'SELECT * FROM `Module` ' +
        'JOIN ('+queryGroupNumber+') AS GroupNumber ON Module.moduleCode=GroupNumber.moduleCode ' +
        'JOIN ('+queryStudentNumber+') AS StudentNumber ON Module.moduleCode=StudentNumber.moduleCode ' +
        'WHERE employeeID = "' + uname + '" AND yearTerm="'+selectedYT+'"'

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
            uname: req.session.lFullName,
            YS: req.session.ys
        })
    })
    connection.end()
})

web.get('/student_feedback', function (req, res) {
    if (req.session.uname) {
        var uname = req.session.uname
        var selectedYT = req.session.ys
    } else {
        res.redirect('/login')
    }
    var reqObj = req.query
    req.session.moduleID = reqObj.moduleID
    var moduleID = req.session.moduleID
    var allModules = req.session.allModules
    //var querySelectAllModule = 'SELECT * FROM module'
    var querySelectCurrentModule = 'SELECT * FROM module where `moduleCode`="' + moduleID + '" AND yearTerm="'+selectedYT+'"'
    var querySelectselectedStu = 'SELECT * FROM student where `studentSPR`="' + uname + '"'

    var selectMandS = '`moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" AND yearTerm="'+selectedYT+'"'

    var selectT = 'SELECT teamNumber FROM modstute where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" AND yearTerm="'+selectedYT+'" '

    var queryFeedbackScore = 'SELECT AVG(score) AS score_avg FROM studentfeedback where' + selectMandS

    var querySelectfeedback = 'SELECT weekNumber, score, contribution, writtenFeedback, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer ' +
        'FROM studentfeedback where' + selectMandS

    var querySelectTeamfeedback = 'SELECT  weekNumber, score, writtenFeedback, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer ' +
        'FROM teamfeedback where `moduleCode`="' + moduleID + '" and `teamNumber`= (' + selectT + ') AND yearTerm="'+selectedYT+'"'

    var querySelectteam = 'SELECT * FROM modstute where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" AND yearTerm="'+selectedYT+'"'
    var querySelectproject =
        'SELECT * FROM projectinfo where `moduleCode`="' + moduleID + '" and `teamNumber`= (' + selectT + ') AND yearTerm="'+selectedYT+'"'

    var countstudent = 'select count(score) As scount from studentfeedback where' + selectMandS
    var countteam = 'select count(score) As scount from teamfeedback ' +
        'where `moduleCode`="' + moduleID + '" and `teamNumber`= (' + selectT + ') AND yearTerm="'+selectedYT+'"'

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
            fs.exists("/public/images/" + Stu[0].fileLocation, (exists) => {
                if (exists === false) {
                    Stu[0].fileLocation = "/public/images/profile_default.jpeg"
                }
            });
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
                                connection.query(countstudent, function (error, countst) {
                                    if (error) {
                                        console.log(error)
                                    }
                                    connection.query(countteam, function (error, countte) {
                                        if (error) {
                                            console.log(error)
                                        }
                                        // console.log(Score[0])
                                        // console.log(SFd)

                                        //console.log(countst[0].scount)
                                        // console.log(countst[0][0])


                                        // console.log(countte)

                                        //console.log(SFd[score])

                                        var studata = new Array();
                                        var teamdata = new Array();

                                        for (var j = 0; j < countst[0].scount; j++) {
                                            //     //studata[j] = document.getElementById("ccccc").innerText;
                                            //     SFd.score
                                            studata[j] = SFd[j].score;
                                            //console.log(SFd[j].score)
                                            //console.log(studata)

                                            //     console.log(nstudata[j])
                                        }

                                        for (var j = 0; j < countte[0].scount; j++) {
                                            //     //studata[j] = document.getElementById("ccccc").innerText;
                                            //     SFd.score
                                            teamdata[j] = StFd[j].score;
                                            //console.log(StFd[j].score)
                                            //console.log(teamdata)

                                            //     console.log(nstudata[j])
                                        }
                                        // console.log(SPro)
                                        //console.log(SFd)
                                        //console.log(StFd)


                                        res.render('student_feedback.html', {
                                            uname: req.session.sFullName,
                                            module: CMod[0],
                                            team: Stea[0],
                                            project: SPro[0],
                                            countst: countst[0],
                                            countte: countte[0],
                                            modules: allModules,
                                            student: Stu[0],
                                            Selectfeedback: SFd,
                                            Selectteamfeedback: StFd,
                                            Score: Score[0],
                                            studata: studata,
                                            teamdata: teamdata,
                                            YS: req.session.ys
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })
})

web.get('/student_setYS', function(req, res){
    if (req.session.uname) {
        var uname = req.session.uname
    } else {
        res.redirect('/login')
    }

    req.session.y_s = req.query.YS
    // console.log(req.query.YS)
    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()

    var query_delete_YearSemester = 'DELETE FROM `CurrentYearTerm` WHERE `employeeID`="'+uname+'"'
    var query_setYearSemester = 'INSERT INTO `CurrentYearTerm`(`yearTerm`, `employeeID`) VALUES ("'+ req.session.y_s +'", "'+uname+'")'
    var queryYS = 'SELECT `yearTerm` FROM `CurrentYearTerm` WHERE `employeeID`="'+uname+'"'
    // console.log(query_setYearSemester)
    connection.query(query_delete_YearSemester, function (error, results) {
        if (error) {
            console.log(error)
        }
        connection.query(query_setYearSemester, function (error, results) {
            if (error) {
                console.log(error)
            }
            connection.query(queryYS, function (error, YS) {
                if (error) {
                    console.log(error)
                }
                req.session.ys = YS[0].yearTerm
                res.redirect('/student_homepage')
            })
        })
    })
    // res.redirect('lecturer_homepage')
})

web.get('/student_homepage', function (req, res) {
    if (req.session.uname) {
        var uname = req.session.uname
        var utype = req.session.utype
        var selectedYT = req.session.ys
    } else {
        res.redirect('/expire')
    }
    //var querySelect = 'SELECT * FROM Module where moduleCode in (select moduleCode from modstute where studentSPR="' + uname + '" ) '
    var querySelect = 'SELECT * FROM Module where moduleCode in (select moduleCode from modstute where studentSPR="' + uname + '" AND yearTerm="'+selectedYT+'" ) '
    var queryStudentName = 'SELECT surname, forename FROM `Student` WHERE `studentSPR`="'+req.session.uname+'"'

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
        connection.query(queryStudentName, function (error, StudentName) {
            if (error) {
                console.log(error)
            }
            req.session.sFullName = StudentName[0].forename + " " + StudentName[0].surname
            res.render('student_homepage.html', {
                modules: allModules,
                uname: req.session.sFullName,
                utype: utype,
                YS: req.session.ys
            })
        })
    })
    // connection.end()
})

web.get('/TA_Homepage', function (req, res) {
    if (req.session.uname) {
        var uname = req.session.uname
        var YS = req.session.ys
    } else {
        res.redirect('/expire')
    }
    var querySelectMods = 'SELECT * FROM Module WHERE Module.moduleCode IN ' +
        '(SELECT projectinfo.moduleCode FROM projectinfo JOIN TA ON (projectinfo.taStudentSPR=ta.taStudentSPR) ' +
        'WHERE projectinfo.taStudentSPR="' + uname + '" AND Module.yearTerm="'+YS+'")'
    var queryTAName = 'SELECT surname, forename FROM `TA` WHERE `taStudentSPR`="'+uname+'"'

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
            allMods[i - 1].index = i;
        }
        connection.query(queryTAName, function (error, TAName) {
            if (error) {
                console.log(error)
            }
            req.session.taFullName = TAName[0].forename + " " + TAName[0].surname
            res.render('TA_homepage.html', {
                uname: req.session.taFullName,
                mods: allMods,
                YS: req.session.ys
            })
        })
    })
    // connection.end()
})

web.get('/TA_module', function (req, res) {
    if (req.session.uname) {
        var uname = req.session.uname
        var YS = req.session.ys
    } else {
        res.redirect('/login')
    }
    var reqObj = req.query
    req.session.modID = reqObj.moduleID
    var selectedModID = req.session.modID

    var allMod = req.session.allMods

    // This query selects the module names and module codes to display
    var querySelectCurrentMod = 'SELECT moduleName, moduleCode FROM Module WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="'+YS+'"'

    // This query shows all the groups a TA coaches
    var queryMembersTeam = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
        'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
        'WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="'+YS+'" GROUP BY ModStuTe.teamNumber '
    var queryGroupAveScore = 'SELECT teamNumber, AVG(score) avgScore FROM `TeamFeedback` ' +
        'WHERE moduleCode = "' + selectedModID + '" AND `yearTerm`="'+YS+'" GROUP BY teamNumber '
    var queryGroupLatestScore = 'SELECT teamNumber, score lastScore, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM TeamFeedback ' +
        'WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="'+YS+'" AND (teamNumber, weekNumber) IN ' +
        '(SELECT teamNumber, MAX(weekNumber) FROM TeamFeedback WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="'+YS+'" GROUP BY teamNumber) '
    var queryGroupTA = 'SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
    var queryCoachedGroups = queryGroupTA +
        'JOIN (' + queryMembersTeam + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
        'JOIN (' + queryGroupAveScore + ') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
        'JOIN (' + queryGroupLatestScore + ') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
        'WHERE ProjectInfo.moduleCode="' + selectedModID + '" AND ProjectInfo.taStudentSPR="' + uname + '" AND ProjectInfo.yearTerm="'+YS+'" '

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()
    connection.query(querySelectCurrentMod, function (error, ModCurrent) {
        if (error) {
            console.log(error)
        }
        connection.query(queryCoachedGroups, function (error, TAGroups) {
            if (error) {
                console.log(error)
            }

            var studentNames = TAGroups[0].studentName
            var studentNamesArray = studentNames.split(',')

            res.render('TA_module.html', {
                uname: req.session.taFullName,
                mods: allMod,
                module: ModCurrent[0],
                coachedGroups: TAGroups,
                studentNames: studentNamesArray,
                YS: req.session.ys
            })

        })
    })
})

web.get('/TA_group', function(req,res){
    if(req.session.uname){
        var uname = req.session.uname
        var YS = req.session.ys
    } else {
        res.redirect('/login')
    }
    var reqObj = req.query
    req.session.modID = reqObj.moduleID
    var selectedModID = req.session.modID
    req.session.teamNumber = reqObj.teamNumber
    var teamNumber = req.session.teamNumber

    var allMod = req.session.allMods
    var allTAGroups = req.session.TAGroup


    // This query selects the module names and module codes to display
    var querySelectCurrentMod = 'SELECT moduleName, moduleCode FROM Module WHERE `moduleCode`="'+selectedModID+'" AND `yearTerm`="'+YS+'"'

    // This query shows all the group members in a module
    var queryTeamMembers = 'SELECT Student.surname, Student.forename, Student.fileLocation, ModStuTe.memberIndex FROM `Student` JOIN `ModStuTe` ' +
        'ON ModStuTe.studentSPR=Student.studentSPR ' +
        'WHERE ModStuTe.teamNumber="' + teamNumber + '" AND `moduleCode`="'+selectedModID+'" AND `yearTerm`="'+YS+'" '

    // query team feedback
    var queryTeamFeedback = 'SELECT teamNumber, weekNumber, score, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date ' +
        'FROM `TeamFeedback` WHERE teamNumber="' + teamNumber + '" AND `moduleCode`="'+selectedModID+'" AND `yearTerm`="'+YS+'"'

    // This query select all student feedback information for a given group in a module
    var queryStudentFeedback = 'SELECT concat(Student.surname, " ", Student.forename) studentName, ' +
        'StudentFeedback.weekNumber,StudentFeedback.score, StudentFeedback.contribution, StudentFeedback.writtenFeedback ' +
        'FROM `student` JOIN `StudentFeedback` ON student.studentSPR=StudentFeedback.studentSPR ' +
        'JOIN `ModStuTe` ON (StudentFeedback.studentSPR=ModStuTe.studentSPR AND StudentFeedback.moduleCode=ModStuTe.moduleCode AND StudentFeedback.yearTerm=ModStuTe.yearTerm)' +
        'WHERE ModStuTe.teamNumber = "' + teamNumber + '" AND StudentFeedback.moduleCode = "' + selectedModID +'" AND ModStuTe.yearTerm="'+YS+'"'
    // how to get the week number

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()
    connection.query(querySelectCurrentMod, function (error, ModCurrent) {
        if (error) {
            console.log(error)
        }
        connection.query(queryTeamMembers,function(error,TeamMembers){
            if (error){
                console.log(error)
            }
            req.session.teamMember = 0
            for (var i = 0; i < TeamMembers.length; i++) {
                fs.exists("./public/images/" + TeamMembers[i].fileLocation, (exists) => {
                    if (exists === false) {
                        TeamMembers[req.session.teamMember].fileLocation = "/public/images/profile_default.jpeg"
                        req.session.teamMember++
                    }
                    else {
                        if (TeamMembers[req.session.teamMember].fileLocation === '') {
                            TeamMembers[req.session.teamMember].fileLocation = "/public/images/profile_default.jpeg"
                        }
                        else {
                            TeamMembers[req.session.teamMember].fileLocation = "/public/images/" + TeamMembers[req.session.teamMember].fileLocation
                        }
                        req.session.teamMember++
                    }
                });
            }
            connection.query(queryTeamFeedback, function(error,TeamFeedback){
                if (error){
                    console.log(error)
                }
                connection.query(queryStudentFeedback, function(error,Student){
                    if (error){
                        console.log(error)
                    }
                    var memberNum = 0
                    var weeklyFeedback = new Array()
                    // console.log(typeof Student)
                    loop:
                    for (var weekNum=1; weekNum<21; weekNum++) {
                        if (weekNum > TeamFeedback.length) {
                            break
                        }
                        weeklyFeedback[weekNum-1] = new Array()
                        for (const teamF of TeamFeedback) {
                            if (typeof(teamF) === "undefined") {
                                break loop
                            }
                            if (parseInt(teamF.weekNumber) === weekNum) {
                                weeklyFeedback[weekNum - 1].push(teamNumber);
                                weeklyFeedback[weekNum - 1].push(teamF.weekNumber);
                                weeklyFeedback[weekNum - 1].push(teamF.score);
                                weeklyFeedback[weekNum - 1].push(teamF.writtenFeedback);
                                weeklyFeedback[weekNum - 1].push(teamF.messageLecture);
                                break
                            }
                        }
                        if (weeklyFeedback[weekNum - 1].length === 0) {
                            weeklyFeedback[weekNum - 1] = null
                            break
                        }
                        for (const stuF of Student) {
                            if (typeof(stuF) === "undefined") {
                                break loop
                            }
                            if (parseInt(stuF.weekNumber) === weekNum){
                                memberNum++
                                weeklyFeedback[weekNum-1].push(stuF.studentName);
                                weeklyFeedback[weekNum-1].push(stuF.score);
                                weeklyFeedback[weekNum-1].push(stuF.contribution);
                                weeklyFeedback[weekNum-1].push(stuF.writtenFeedback);
                            }
                            // console.log(FeedbackByWeek[weekNum-1].length)
                        }
                        weeklyFeedback[weekNum-1].splice(5, 0, memberNum)
                        memberNum = 0
                    }
                    // console.log(weeklyFeedback)
                    res.render('TA_group.html',{
                        uname: req.session.taFullName,
                        mods: allMod,
                        module: ModCurrent[0],
                        teamMember: TeamMembers,
                        teamFeedback: TeamFeedback,
                        student : Student,
                        weeklyFeedback : weeklyFeedback,
                        YS: req.session.ys
                    })
                })
            })
        })
    })
})

web.post('/provideFeedback', function (req, res) {
    if (req.session.uname) {
        var uname = req.session.uname
        var YS = req.session.ys
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

    var queryStudentSPR = 'SELECT studentSPR FROM ModStuTe WHERE moduleCode="' + selectedModID + '" AND teamNumber="' + feedback.teamNumber + '"'

    var insertTeamFeed = 'INSERT INTO teamfeedback (`moduleCode`,`yearTerm`,`weekNumber`,`teamNumber`,`score`,`writtenFeedback`,`messageLecturer`)' +
        'VALUES ("' + selectedModID + '", "' + YS + '", "' + feedback.weekNumber + '", "' + feedback.teamNumber + '","' + feedback.teamScore + '", "' + feedback.feedbackTeam + '", "' + feedback.message + '")'

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()


    connection.query(insertTeamFeed, function (error, resultFeedback) {
        if (error) {
            console.log(error)
        }
        connection.query(queryStudentSPR, function (error, resultStudents) {
            if (error) {
                console.log(error)
            }
            var studentSPRNumber = []
            for (i = 0; i < resultStudents.length; i++) {
                var studentSPR = resultStudents[i].studentSPR
                studentSPRNumber.push(studentSPR)
            }

            for (i = 0; i < studentSPRNumber.length; i++) {
                var insertIntoStudentFeedback = 'INSERT INTO studentfeedback (`studentSPR`,`moduleCode`,`yearTerm`,`weekNumber`,`score`,`contribution`,`writtenFeedback`,`messageLecturer`)' +
                    'VALUES ("' + studentSPRNumber[i] + '","' + selectedModID + '", "' + YS + '", "' + feedback.weekNumber + '", "' + studentScore[i] + '", "' + studentContribution[i] + '", "' + feedbackStudent[i] + '", "' + feedback.message + '")'

                connection.query(insertIntoStudentFeedback, function (error, resultFeedback) {
                    if (error) {
                        console.log(error)
                    }
                })
            }
        })
    })
    res.redirect('/TA_homepage')
})

web.post('/updateFeedback', function (req, res) {
    if (req.session.uname) {
        var uname = req.session.uname
        var YS = req.session.ys
    } else {
        res.redirect('/login')
    }
    var feedback = req.body
    var selectedModID = req.session.modID
    var studentScore = feedback.studentScore
    var studentContribution = feedback.studentContribution
    var feedbackStudent = feedback.studentFeedback
    // Update teamfeedback table
    var queryUpdateTeam = 'UPDATE `teamfeedback` SET `score`="' + feedback.teamScore + '", `writtenFeedback`="' + feedback.feedbackTeam + '", ' +
        '`messageLecturer`="' + feedback.message + '" ' +
        'WHERE `moduleCode`="' + selectedModID + '" AND `teamNumber`="' + feedback.teamNumber +'" AND `weekNumber`="' + feedback.weekNumber + '" AND `yearTerm`="'+YS+'"'
    var queryStudentSPR = 'SELECT studentSPR FROM ModStuTe ' +
        'WHERE moduleCode="' + selectedModID + '" AND teamNumber="' + feedback.teamNumber + '" AND `yearTerm`="'+YS+'"'

    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password,
        database: databaseName
    })
    connection.connect()

    connection.query(queryUpdateTeam, function (error, results) {
        if (error) {
            console.log(error)
        }
        connection.query(queryStudentSPR, function(error, resultStudents){
            if (error){
                console.log(error)
            }
            // Update studentFeedback table
            var studentSPRNumber = []
            for (i = 0; i < resultStudents.length; i++) {
                var studentSPR = resultStudents[i].studentSPR
                studentSPRNumber.push(studentSPR)
            }

            for (i = 0; i < studentSPRNumber.length; i++) {
                var insertIntoStudentFeedback = 'UPDATE `studentfeedback` SET ' +
                    '`score`="' + studentScore[i] + '",`contribution`="' + studentContribution[i] + '",`writtenFeedback`="' + feedbackStudent[i] + '",`messageLecturer`="' + feedback.message + '" ' +
                    'WHERE `moduleCode`="' + selectedModID + '" AND `studentSPR`="' + studentSPRNumber[i] +'" AND `weekNumber`="' + feedback.weekNumber + '" AND `yearTerm`="'+YS+'"'
            }
            connection.query(insertIntoStudentFeedback, function(error,studentFeedbackResult){
                if (error){
                    console.log(error)
                }
            })
        })

    })
    res.redirect('/TA_module?moduleID='+selectedModID+'&teamNumber='+feedback.teamNumber)
})

web.listen(3000, function () {
    console.log('server starts successfully.')
})