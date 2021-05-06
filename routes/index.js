var express = require('express');
var router = express.Router();
const mysql = require('./../database');
var xlsx = require('node-xlsx')
var fs = require('fs')
var bodyParser = require('body-parser')
var objToCsv = require('objects-to-csv')
var multiparty = require('multiparty');
var util = require('util')

/* GET home page. */
router.get('/', function (req, res, next) {
  let params = {
    active: { home: true }
  };

  res.render('index', params);
});


router.get('/expire', function (req, res) {
  res.render('sessionExpire.html')
})

router.get('/authorized_error', function (req, res) {
  res.render('authorized_error.html')
})

router.get('/login', function (req, res) {

  // if (req.app.locals.users[req.session.userId]) {
  //   req.session.uname = req.app.locals.users[req.session.userId].email
  // }
  // else if (req.session.email) {

  // }

  req.session.uname = req.session.email
  // console.log(req.app.locals.users[req.session.userId].email)
  // console.log(req.session.uname)

  var queryLogin = 'SELECT `userType` FROM `LoginInfo` WHERE `username`="' + req.session.uname + '"'
  var queryYS = 'SELECT `yearTerm` FROM `CurrentYearTerm` WHERE `employeeID`="admin"'
  // var query_delete_YearSemester = 'DELETE FROM `CurrentYearTerm` WHERE `employeeID`="admin"'
  var queryInsertYS = 'INSERT INTO `CurrentYearTerm`(`yearTerm`, `employeeID`) VALUES ("2021-1", "admin")'


  //427  


  mysql.query(queryLogin, function (error, loginInfo) {
    if (error) {
      console.log(error)
    }
    console.log(loginInfo)
    if (typeof loginInfo[0] === "undefined" || loginInfo[0].length === 0) {
      res.redirect('/authorized_error')
    }
    else {
      req.session.type = loginInfo[0].userType



      //req.session.type = loginInfo[0].userType

      if (req.session.type) {

        var type = req.session.type

        mysql.query(queryYS, function (error, YS) {
          if (error) {
            console.log(error)
          }

          if (Array.isArray(YS) && YS.length === 0) {
            mysql.query(queryInsertYS, function (error, YS) {
              if (error) {
                console.log(error)
              }
              req.session.ys = "2021-1"
            })
          }
          else {
            req.session.ys = YS[0].yearTerm
          }

          if (type === "lecturer") {
            res.redirect('/lecturer_homepage')
          }
          else if (type === "student") {
            res.redirect('/student_homepage')
          }
          else if (type === "TA") {
            res.redirect('/TA_homepage')
          }

        })
      }
      else {
        res.redirect('/authorized_error')
      }
    }

  })

})


router.get('/lecturer_Homepage', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var YS = req.session.ys
  } else {
    res.redirect('/expire')
  }
  var querySelect = 'SELECT * FROM `Module` WHERE `yearTerm`="' + YS + '" AND `employeeID`="' + uname + '"'
  var queryFullName = 'SELECT `surname`, `forename` FROM `Lecturer` WHERE `employeeID`="' + uname + '"'
  // console.log(querySelect)


  mysql.query(querySelect, function (error, allMod) {
    if (error) {
      console.log(error)
    }
    req.session.allModules = allMod
    var allModules = req.session.allModules
    if (typeof allModules !== "undefined") {
      for (var i = 1; i <= allModules.length; i++) {
        allModules[i - 1].index = i;
      }
    }
    mysql.query(queryFullName, function (error, fullName) {
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
})

router.get('/lecturer_module', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var allModule = req.session.allModules
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }
  var reqObj = req.query
  req.session.moduleID = reqObj.moduleID
  req.session.selectedYT = reqObj.YT
  var selectedModuleID = req.session.moduleID

  // query the information of the selected module
  var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '"'

  // query the data used in student table
  var queryStudentAverageScore = 'SELECT studentSPR, AVG(score) avgScore FROM `StudentFeedback` ' +
    'WHERE moduleCode = "' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY studentSPR'
  // var queryStudentSecondLastScore2 = 'SELECT studentSPR, MAX(weekNumber)-1 mw FROM StudentFeedback WHERE `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" ' +
  //     'GROUP BY studentSPR '
  var queryStudentSecondLastScore = 'SELECT studentSPR, score secondLastScore, weekNumber sWN, DATE_FORMAT(date,"%Y-%m-%d") date FROM StudentFeedback ' +
    'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND (studentSPR, weekNumber) IN ' +
    '(SELECT studentSPR, MAX(weekNumber)-1 mw FROM StudentFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" ' +
    'GROUP BY studentSPR) '
  var queryStudentLastScore = 'SELECT studentSPR, score lastScore, weekNumber, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM StudentFeedback ' +
    'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND (studentSPR, weekNumber) IN ' +
    '(SELECT studentSPR, MAX(weekNumber) FROM StudentFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY studentSPR) '
  var queryStudentTeamProject = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
    'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber AND ModStuTe.moduleCode=ProjectInfo.moduleCode AND ModStuTe.yearTerm=ProjectInfo.yearTerm) '
  var queryAllStudentTable = queryStudentTeamProject +
    'JOIN (' + queryStudentAverageScore + ') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR)' +
    'JOIN (' + queryStudentLastScore + ') AS stuLastScore ON (ModStuTe.studentSPR=stuLastScore.studentSPR)' +
    'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.yearTerm="' + selectedYT + '"'
  var queryAllStudentTableNoScore = queryStudentTeamProject +
    'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.yearTerm="' + selectedYT + '"'
  // query the data used in group table
  var queryTeamMembers = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
    'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
    'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY ModStuTe.teamNumber '
  var queryGroupAverageScore = 'SELECT teamNumber, AVG(score) avgScore FROM `TeamFeedback` ' +
    'WHERE moduleCode = "' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY teamNumber '
  var queryGroupSecondLastScore = 'SELECT teamNumber, score secondLastScore, DATE_FORMAT(date,"%Y-%m-%d") date FROM TeamFeedback ' +
    'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND (teamNumber, weekNumber) IN ' +
    '(SELECT teamNumber, MAX(weekNumber)-1 mw FROM TeamFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" ' +
    'GROUP BY teamNumber ) '
  var queryGroupLastScore = 'SELECT teamNumber, score lastScore, weekNumber, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM TeamFeedback ' +
    'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND (teamNumber, weekNumber) IN ' +
    '(SELECT teamNumber, MAX(weekNumber) FROM TeamFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY teamNumber) '
  var queryGroupProjectTA = 'SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
  var queryAllGroupTable = queryGroupProjectTA +
    ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
    'JOIN (' + queryGroupAverageScore + ') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
    'JOIN (' + queryGroupLastScore + ') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
    'WHERE ProjectInfo.moduleCode="' + selectedModuleID + '" AND ProjectInfo.yearTerm="' + selectedYT + '" '
  var queryAllGroupTableNoScore = queryGroupProjectTA +
    ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
    'WHERE ProjectInfo.moduleCode="' + selectedModuleID + '" AND ProjectInfo.yearTerm="' + selectedYT + '" '

  // query the data used in student need attention table
  var queryAttStudentTable = queryStudentTeamProject +
    'JOIN (' + queryStudentAverageScore + ') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR) ' +
    'JOIN (' + queryStudentLastScore + ') AS stuLastScore ON (ModStuTe.studentSPR=stuLastScore.studentSPR) ' +
    'JOIN (' + queryStudentSecondLastScore + ') AS stuSecondLastScore ON (ModStuTe.studentSPR=stuSecondLastScore.studentSPR) ' +
    'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.yearTerm="' + selectedYT + '" AND stuLastScore.lastScore < 2 AND stuSecondLastScore.secondLastScore < 2'

  // query the data used in group need attention table
  var queryAttGroupTable = queryGroupProjectTA +
    ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
    'JOIN (' + queryGroupAverageScore + ') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
    'JOIN (' + queryGroupLastScore + ') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
    'JOIN (' + queryGroupSecondLastScore + ') AS gSecondLastScore ON (ProjectInfo.teamNumber=gSecondLastScore.teamNumber) ' +
    'WHERE ProjectInfo.moduleCode="' + selectedModuleID + '" AND ProjectInfo.yearTerm="' + selectedYT + '" AND gLastScore.lastScore < 2 AND gSecondLastScore.secondLastScore < 2 '

  var queryStudentAttFalse = 'SELECT StudentNeedAttention.studentSPR, StudentNeedAttention.weekNumber FROM `StudentNeedAttention` JOIN ' +
    '(SELECT StudentFeedback.studentSPR, MAX(weekNumber) weekNumber FROM StudentFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY StudentFeedback.studentSPR) AS MaxWeek ' +
    'ON (StudentNeedAttention.studentSPR=MaxWeek.studentSPR AND StudentNeedAttention.weekNumber=MaxWeek.weekNumber) ' +
    'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND `state`=' + false
  // query the data used in student need attention table
  var queryAttStudentTableFalse = queryStudentTeamProject +
    'JOIN (' + queryStudentAverageScore + ') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR) ' +
    'JOIN (' + queryStudentLastScore + ') AS stuLastScore ON (ModStuTe.studentSPR=stuLastScore.studentSPR) ' +
    'JOIN (' + queryStudentSecondLastScore + ') AS stuSecondLastScore ON (ModStuTe.studentSPR=stuSecondLastScore.studentSPR) ' +
    'JOIN (' + queryStudentAttFalse + ') AS stuAttFalse ON (ModStuTe.studentSPR=stuAttFalse.studentSPR) ' +
    'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.yearTerm="' + selectedYT + '" AND stuLastScore.lastScore < 2 AND stuSecondLastScore.secondLastScore < 2'
  var queryGroupAttFalse = 'SELECT TeamNeedAttention.teamNumber, TeamNeedAttention.weekNumber FROM `TeamNeedAttention` JOIN ' +
    '(SELECT TeamFeedback.teamNumber, MAX(weekNumber) weekNumber FROM TeamFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY TeamFeedback.teamNumber) AS MaxWeek ' +
    'ON (TeamNeedAttention.teamNumber=MaxWeek.teamNumber AND TeamNeedAttention.weekNumber=MaxWeek.weekNumber) ' +
    'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND `state`=' + false
  var queryAttGroupTableFalse = queryGroupProjectTA +
    ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
    'JOIN (' + queryGroupAverageScore + ') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
    'JOIN (' + queryGroupLastScore + ') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
    'JOIN (' + queryGroupSecondLastScore + ') AS gSecondLastScore ON (ProjectInfo.teamNumber=gSecondLastScore.teamNumber) ' +
    'JOIN (' + queryGroupAttFalse + ') AS groupAttFalse ON (ProjectInfo.teamNumber=groupAttFalse.teamNumber) ' +
    'WHERE ProjectInfo.moduleCode="' + selectedModuleID + '" AND ProjectInfo.yearTerm="' + selectedYT + '" AND gLastScore.lastScore < 2 AND gSecondLastScore.secondLastScore < 2 '

  req.session.attStuState = []

  mysql.query(querySelectCurrentModule, function (error, currentModule) {
    if (error) {
      console.log(error)
    }
    mysql.query(queryAllStudentTable, function (error, allStuInfo) {
      if (error) {
        console.log(error)
      }
      req.session.stuScore = allStuInfo
      mysql.query(queryAllStudentTableNoScore, function (error, allStuInfoNoScore) {
        if (error) {
          console.log(error)
        }
        if (allStuInfoNoScore.length !== req.session.stuScore.length) {
          // console.log(TAGroups[0])
          // console.log("*************")
          for (var i = 0; i < allStuInfoNoScore.length; i++) {
            for (var j = 0; j < req.session.stuScore.length; j++) {
              if (i === 0) {
                req.session.stuScore[j].weekNumber = '; week' + req.session.stuScore[j].weekNumber
              }
              if (allStuInfoNoScore[i].teamNumber === req.session.stuScore[j].teamNumber) {
                allStuInfoNoScore.splice(i, 1); //利用splice函数删除元素，从第i个位置，截取长度为1的元素
              }
            }
          }
          for (var m = 0; m < allStuInfoNoScore.length; m++) {
            // console.log(TAGroups[m])
            // console.log("&&&&&&&&&&&")
            allStuInfoNoScore[m].avgScore = "NA"
            allStuInfoNoScore[m].lastScore = "NA"
            allStuInfoNoScore[m].weekNumber = "NA"
            req.session.stuScore.push(allStuInfoNoScore[m])
          }
        }
        // console.log(allStuInfo)
        mysql.query(queryAllGroupTable, function (error, allGroupInfo) {
          if (error) {
            console.log(error)
          }
          req.session.gScore = allGroupInfo
          mysql.query(queryAllGroupTableNoScore, function (error, allGroupInfoNoScore) {
            if (error) {
              console.log(error)
            }
            if (allGroupInfoNoScore.length !== req.session.gScore.length) {
              // console.log(TAGroups[0])
              // console.log("*************")
              for (var i = 0; i < allGroupInfoNoScore.length; i++) {
                for (var j = 0; j < req.session.gScore.length; j++) {
                  if (i === 0) {
                    req.session.gScore[j].weekNumber = '; week' + req.session.gScore[j].weekNumber
                  }
                  if (allGroupInfoNoScore[i].teamNumber === req.session.gScore[j].teamNumber) {
                    allGroupInfoNoScore.splice(i, 1); //利用splice函数删除元素，从第i个位置，截取长度为1的元素
                  }
                }
              }
              for (var m = 0; m < allGroupInfoNoScore.length; m++) {
                // console.log(TAGroups[m])
                // console.log("&&&&&&&&&&&")
                allGroupInfoNoScore[m].avgScore = "NA"
                allGroupInfoNoScore[m].lastScore = "NA"
                allGroupInfoNoScore[m].weekNumber = "NA"
                req.session.gScore.push(allGroupInfoNoScore[m])
              }
            }
            mysql.query(queryAttStudentTable, function (error, attStuInfo) {
              if (error) {
                console.log(error)
              }
              if (typeof attStuInfo !== 'undefined') {
                for (var i = 0; i < attStuInfo.length; i++) {
                  attStuInfo[i].index = i + 1
                  var queryInsertAttStudent = 'INSERT INTO `StudentNeedAttention` (`studentSPR`, `moduleCode`, `yearTerm`, `weekNumber`, `state`) ' +
                    'SELECT "' + attStuInfo[i].studentSPR + '","' + req.session.moduleID + '","' + req.session.ys + '","' + attStuInfo[i].weekNumber + '", ' + false + ' ' +
                    'FROM DUAL WHERE NOT EXISTS (SELECT `studentSPR`, `moduleCode`, `yearTerm`, `weekNumber` FROM `studentNeedAttention` ' +
                    'WHERE `studentSPR`="' + attStuInfo[i].studentSPR + '" AND `moduleCode`="' + req.session.moduleID + '" ' +
                    'AND `yearTerm`="' + req.session.ys + '" AND `weekNumber`="' + attStuInfo[i].weekNumber + '")'
                  mysql.query(queryInsertAttStudent, function (error, result) {
                    if (error) {
                      console.log(error)
                    }
                  })
                }
              }
              // console.log(attStuInfo)
              mysql.query(queryAttStudentTableFalse, function (error, attStuInfoFalse) {
                if (error) {
                  console.log(error)
                }
                for (i = 0; i < attStuInfoFalse.length; i++) {
                  attStuInfoFalse[i].index = i + 1
                }
                // console.log(attStuInfoFalse)
                mysql.query(queryAttGroupTable, function (error, attGroupInfo) {
                  if (error) {
                    console.log(error)
                  }
                  if (typeof attGroupInfo !== 'undefined') {
                    for (i = 0; i < attGroupInfo.length; i++) {
                      attGroupInfo[i].index = i + 1
                      var queryInsertAttGroup = 'INSERT INTO `TeamNeedAttention` (`teamNumber`, `moduleCode`, `yearTerm`, `weekNumber`, `state`) ' +
                        'SELECT "' + attGroupInfo[i].teamNumber + '","' + req.session.moduleID + '","' + req.session.ys + '","' + attGroupInfo[i].weekNumber + '", ' + false + ' ' +
                        'FROM DUAL WHERE NOT EXISTS (SELECT `teamNumber`, `moduleCode`, `yearTerm`, `weekNumber` FROM `TeamNeedAttention` ' +
                        'WHERE `teamNumber`="' + attGroupInfo[i].teamNumber + '" AND `moduleCode`="' + req.session.moduleID + '" ' +
                        'AND `yearTerm`="' + req.session.ys + '" AND `weekNumber`="' + attGroupInfo[i].weekNumber + '")'
                      mysql.query(queryInsertAttGroup, function (error, result) {
                        if (error) {
                          console.log(error)
                        }
                      })
                    }
                  }
                  // console.log(attGroupInfo)
                  mysql.query(queryAttGroupTableFalse, function (error, attGroupInfoFalse) {
                    if (error) {
                      console.log(error)
                    }
                    for (i = 0; i < attGroupInfoFalse.length; i++) {
                      attGroupInfoFalse[i].index = i + 1
                    }
                    // console.log(attGroupInfoFalse)
                    res.render('lecturer_module.html', {
                      uname: req.session.lFullName,
                      modules: allModule,
                      module: currentModule[0],
                      allStudents: req.session.stuScore,
                      allGroups: req.session.gScore,
                      attStudents: attStuInfoFalse,
                      attGroups: attGroupInfoFalse,
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

router.get('/lecturer_delete_att_stu', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var allModules = req.session.allModules
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }

  var reqObj = req.query
  var studnentSPR = reqObj.student
  var moduleID = reqObj.moduleID
  var YS = reqObj.YT
  var week = reqObj.week

  var querySetAttStudentTrue = 'UPDATE `StudentNeedAttention` SET `state`=' + true +
    ' WHERE `studentSPR`="' + studnentSPR + '" AND `moduleCode`="' + moduleID + '" AND `yearTerm`="' + YS + '" AND `weekNumber`="' + week + '"'

  mysql.query(querySetAttStudentTrue, function (error, result) {
    if (error) {
      console.log(error)
    }
  })
  res.redirect("/lecturer_module?moduleID=" + moduleID)
})

router.get('/lecturer_delete_att_group', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var allModules = req.session.allModules
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }

  var reqObj = req.query
  var team = reqObj.team
  var moduleID = reqObj.moduleID
  var YS = reqObj.YT
  var week = reqObj.week

  var querySetAttGroupTrue = 'UPDATE `TeamNeedAttention` SET `state`=' + true +
    ' WHERE `teamNumber`="' + team + '" AND `moduleCode`="' + moduleID + '" AND `yearTerm`="' + YS + '" AND `weekNumber`="' + week + '"'


  mysql.query(querySetAttGroupTrue, function (error, result) {
    if (error) {
      console.log(error)
    }
  })
  res.redirect("/lecturer_module?moduleID=" + moduleID)
})

router.get('/lecturer_group', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var allModules = req.session.allModules
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }

  var reqObj = req.query
  req.session.teamNumber = reqObj.teamNumber
  var teamNumber = req.session.teamNumber
  var selectedModuleID = req.session.moduleID

  // query the information of the selected module
  var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '"'
  // query team members
  var queryTeamSMembers = 'SELECT Student.surname, Student.forename, ModStuTe.memberIndex, fileLocation FROM `Student` JOIN `ModStuTe` ' +
    'ON ModStuTe.studentSPR=Student.studentSPR ' +
    'WHERE ModStuTe.teamNumber="' + teamNumber + '" AND `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" '
  // query team feedback and personal contributions
  var queryContribution = 'SELECT weekNumber WN, group_concat(contribution ORDER BY ModStuTe.memberIndex ASC Separator "%, ") contributions FROM `StudentFeedback` ' +
    'JOIN ModStuTe ON (ModStuTe.studentSPR=StudentFeedback.studentSPR AND ModStuTe.moduleCode=StudentFeedback.moduleCode AND ModStuTe.yearTerm=StudentFeedback.yearTerm) ' +
    'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND teamNumber="' + teamNumber + '" AND StudentFeedback.yearTerm="' + selectedYT + '" GROUP BY weekNumber'
  var queryTeamFeedback = 'SELECT weekNumber, score, contributions, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date ' +
    'FROM `TeamFeedback` JOIN (' + queryContribution + ') AS Con ON TeamFeedback.weekNumber=WN ' +
    'WHERE teamNumber="' + teamNumber + '" AND `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '"'
  // This query select all student feedback information for a given group in a module
  var queryStudentFeedback = 'SELECT concat(Student.surname, " ", Student.forename) studentName, ' +
    'StudentFeedback.weekNumber,StudentFeedback.score, StudentFeedback.contribution, StudentFeedback.writtenFeedback, ModStuTe.memberIndex ' +
    'FROM `student` JOIN `StudentFeedback` ON student.studentSPR=StudentFeedback.studentSPR ' +
    'JOIN `ModStuTe` ON (StudentFeedback.studentSPR=ModStuTe.studentSPR AND StudentFeedback.moduleCode=ModStuTe.moduleCode AND StudentFeedback.yearTerm=ModStuTe.yearTerm)' +
    'WHERE ModStuTe.teamNumber = "' + teamNumber + '" AND StudentFeedback.moduleCode = "' + selectedModuleID + '" AND ModStuTe.yearTerm="' + selectedYT + '"'


  mysql.query(querySelectCurrentModule, function (error, currentModule) {
    if (error) {
      console.log(error)
    }
    mysql.query(queryTeamSMembers, function (error, teamMembers) {
      if (error) {
        console.log(error)
      }
      // console.log(teamMembers)
      var Member
      for(var k = 0; k < teamMembers.length - 1; k++){
        for(var l = k + 1; l < teamMembers.length; l++){
          if(teamMembers[l].memberIndex < teamMembers[k].memberIndex){
            Member = teamMembers[k]
            teamMembers[k] = teamMembers[l]
            teamMembers[l] = Member
          }
        }
      }
      // console.log(teamMembers)
      req.session.teamMember = 0
      for (var i = 0; i < teamMembers.length; i++) {
        // console.log(teamMembers[i].fileLocation)
        // teamMembers[i].fileLocation = "/public/images/profile_default.jpeg"
        // console.log("*********"+i)
        fs.exists("./public/images/" + teamMembers[i].fileLocation, (exists) => {
          // console.log(req.session.teamMember)
          // console.log("outside: "+teamMembers[req.session.teamMember].fileLocation)
          if (exists === false) {
            // console.log("a: " + teamMembers[req.session.teamMember].fileLocation)
            teamMembers[req.session.teamMember].fileLocation = "./public/images/profile_default.jpeg"
          }
          else if (teamMembers[req.session.teamMember] === 'undefined' ||
              teamMembers[req.session.teamMember].fileLocation === 'undefined' ||
              teamMembers[req.session.teamMember].fileLocation === '' ||
              teamMembers[req.session.teamMember].fileLocation.length === 0 ||
              typeof teamMembers[req.session.teamMember].fileLocation === 'undefined') {
            // console.log("b:" + teamMembers[req.session.teamMember].fileLocation)
            teamMembers[req.session.teamMember].fileLocation = "./public/images/profile_default.jpeg"
          }
          else {
            // console.log("c:" + teamMembers[req.session.teamMember].fileLocation)
            teamMembers[req.session.teamMember].fileLocation = "./public/images/" + teamMembers[req.session.teamMember].fileLocation
          }
          req.session.teamMember++
          if (req.session.teamMember === teamMembers.length) {
            // console.log("*****************")
            for (var i = 0; i < teamMembers.length; i++) {
              console.log(teamMembers[i].fileLocation)
            }
            req.session.teamMember = 0
            mysql.query(queryTeamFeedback, function (error, teamFeedback) {
              if (error) {
                console.log(error)
              }
              if (typeof teamFeedback === "undefined" || teamFeedback.length === 0) {
                res.render('lecturer_group.html', {
                  uname: req.session.lFullName,
                  teamNumber: teamNumber,
                  modules: allModules,
                  module: currentModule[0],
                  member: teamMembers,
                  feedback: {},
                  YS: req.session.ys,
                  // group: group[0],
                  // feedback: feedback,
                  weeklyFeedback: {}
                })
              }
              // console.log(teamFeedback)
              else {
                mysql.query(queryStudentFeedback, function (error, Student) {
                  if (error) {
                    console.log(error)
                  }
                  var stuFeedback
                  for(var k = 0; k < Student.length - 1; k++){
                    for(var l = k + 1; l < Student.length; l++){
                      if(Student[l].memberIndex < Student[k].memberIndex){
                        stuFeedback = Student[k]
                        Student[k] = Student[l]
                        Student[l] = stuFeedback
                      }
                    }
                  }
                  // console.log(Student)
                  var memberNum = 0
                  var weeklyFeedback = new Array()
                  // console.log(typeof Student)
                  loop:
                  for (var weekNum = 1; weekNum < 21; weekNum++) {
                    if (weekNum > teamFeedback.length) {
                      break
                    }
                    weeklyFeedback[weekNum - 1] = new Array()
                    for (const teamF of teamFeedback) {
                      if (typeof (teamF) === "undefined") {
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
                      if (typeof (stuF) === "undefined") {
                        break loop
                      }
                      if (parseInt(stuF.weekNumber) === weekNum) {
                        memberNum++
                        weeklyFeedback[weekNum - 1].push(stuF.studentName);
                        weeklyFeedback[weekNum - 1].push(stuF.score);
                        weeklyFeedback[weekNum - 1].push(stuF.contribution);
                        weeklyFeedback[weekNum - 1].push(stuF.writtenFeedback);
                      }
                      // console.log(FeedbackByWeek[weekNum-1].length)
                    }
                    weeklyFeedback[weekNum - 1].splice(5, 0, memberNum)
                    memberNum = 0
                  }
                  // console.log(teamMembers)
                  res.render('lecturer_group.html', {
                    uname: req.session.lFullName,
                    teamNumber: teamNumber,
                    modules: allModules,
                    module: currentModule[0],
                    member: teamMembers,
                    feedback: teamFeedback,
                    YS: req.session.ys,
                    // group: group[0],
                    // feedback: feedback,
                    weeklyFeedback: weeklyFeedback
                  })
                })
              }
            })
          }
        });
      }
    })
  })
})

router.get('/lecturer_student', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var allModules = req.session.allModules
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }

  var reqObj = req.query
  req.session.studentID = reqObj.studentID
  var studentSPR = req.session.studentID
  var selectedModuleID = req.session.moduleID
  req.session.student = 0
  console.log(studentSPR)
  // query the information of the selected module
  var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="' + selectedModuleID + '"'

  // query the information of the selected student
  var queryStudentAverageScore = 'SELECT studentSPR, FORMAT(AVG(score),1) avgScore FROM `StudentFeedback` ' +
    'WHERE moduleCode = "' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY studentSPR'
  var queryStudentTeamProject = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
    'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber and ModStuTe.moduleCode=ProjectInfo.moduleCode) '
  var queryStudentTeamProjectNoScore = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
    'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber and ModStuTe.moduleCode=ProjectInfo.moduleCode) ' +
    'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.studentSPR="' + studentSPR + '" AND ModStuTe.yearTerm="' + selectedYT + '" '
  var querySelectStudent = queryStudentTeamProject +
    'JOIN (' + queryStudentAverageScore + ') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR) ' +
    'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.studentSPR="' + studentSPR + '" AND ModStuTe.yearTerm="' + selectedYT + '"'

  // query the feedback of the selected student
  var queryStudentFeedback = 'SELECT weekNumber, score, contribution, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date FROM studentFeedback ' +
    'WHERE studentSPR="' + studentSPR + '" AND moduleCode="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '"'


  mysql.query(querySelectCurrentModule, function (error, currentModule) {
    if (error) {
      console.log(error)
    }
    mysql.query(querySelectStudent, function (error, student) {
      if (error) {
        console.log(error)
      }
      console.log(student.length)
      // for (var i = 0; i < student.length; i++) {
      //     // console.log(teamMembers[i].fileLocation)

      // }
      if (student.length === 0) {
        mysql.query(queryStudentTeamProjectNoScore, function (error, student) {
          if (error) {
            console.log(error)
          }
          fs.exists("./public/images/" + student[0].fileLocation, (exists) => {
            if (exists === false) {
              student[0].fileLocation = "/public/images/profile_default.jpeg"
              // console.log("**************")
            }
            else {
              if (student[0].fileLocation === '') {
                student[0].fileLocation = "/public/images/profile_default.jpeg"
                // console.log("&&&&&&&&&&&&")
              }
              else {
                student[0].fileLocation = "/public/images/" + student[0].fileLocation
                // console.log("$$$$$$$$$$$$$$$$")
                // console.log(student[0].fileLocation)
              }
            }
            res.render('lecturer_student.html', {
              uname: req.session.lFullName,
              modules: allModules,
              module: currentModule[0],
              student: student[0],
              feedback: feedback,
              YS: req.session.ys
            })
          });
          var feedback = {}
          // console.log(student_s)
          // fs.exists("/public/images/"+student[req.session.indexation].fileLocation, (exists) => {
          //     if (exists === false) {
          //         student[req.session.indexation].fileLocation = "/public/images/profile_default.jpeg"
          //     }
          //     else {
          //         if(student[req.session.indexation].fileLocation.length === 0 || student[req.session.indexation].fileLocation === "undefined" ||
          //             typeof student[req.session.indexation].fileLocation === "undefined") {
          //             // console.log("**"+student[0].fileLocation)
          //             student[req.session.indexation].fileLocation = "/public/images/profile_default.jpeg"
          //         }
          //         else {
          //             student[req.session.indexation].fileLocation = "/public/images/" + student[req.session.indexation].fileLocation
          //         }
          //     }
          // });
        })
      }
      else {
        fs.exists("./public/images/" + student[0].fileLocation, (exists) => {
          if (exists === false) {
            student[0].fileLocation = "/public/images/profile_default.jpeg"
            // console.log(req.session.teamMember)
          }
          else {
            if (student[0].fileLocation === '') {
              student[0].fileLocation = "/public/images/profile_default.jpeg"
            }
            else {
              student[0].fileLocation = "/public/images/" + student[0].fileLocation
            }
          }
          mysql.query(queryStudentFeedback, function (error, feedback) {
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
        });
      }
    })
  })
})

router.post('/lecturer_addModule', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }
  var add = req.body


  /* 生成multiparty对象，并配置上传目标路径 */
  var form = new multiparty.Form();
  /* 设置编辑 */
  form.encoding = 'utf-8';
  //设置文件存储路劲
  form.uploadDir = './public/upload_files';
  //设置文件大小限制
  form.maxFilesSize = 10 * 1024 * 1024;
  // form.maxFields = 1000;   //设置所有文件的大小总和//上传后处理
  form.parse(req, function (err, fields, files) {
    var filesTemp = JSON.stringify(files, null, 2);
    if (err) {
      console.log('parse error:' + err);
    }
    else {
      console.log('parse files:' + filesTemp);

      //process cover page
      var img_dstPath = ''
      if (files.coverImage[0].originalFilename === '') {
        img_dstPath = "/public/images/default_cover.jpg"
      } else {
        var inputFile = files.coverImage[0];
        var uploadedPath = inputFile.path
        img_dstPath = './public/images/' + fields.modID + '.jpg';
        //重命名为真实文件名
        fs.rename(uploadedPath, img_dstPath, function (err) {
          if (err) {
            console.log('rename error:' + err);
          } else {
            console.log('rename cover page ok');
          }
        })
        // console.log("img:" + img_dstPath)
      }
      req.session.img_dstPath = img_dstPath

      //process student profiles
      for (var i = 0; i < files.stuImage.length; i++) {
        var inputFileProfile = files.stuImage[i];
        var uploadedPathProfile = inputFileProfile.path
        var img_dstPath_profile = './public/images/' + inputFileProfile.originalFilename.split('/')[1];
        fs.rename(uploadedPathProfile, img_dstPath_profile, function (err) {
          if (err) {
            console.log('rename error:' + err);
          } else {
            console.log('rename profile ok');
          }
        })
      }

      // process TA csv and insert into database
      var inputFileTA = files.taTable[0];
      var uploadedPathTA = inputFileTA.path;
      var csv_dstPath_ta = './public/table/' + fields.modID + '_ta.xlsx';
      fs.rename(uploadedPathTA, csv_dstPath_ta, function (err) {
        if (err) {
          console.log('rename error:' + err);
        } else {
          console.log('rename TA csv ok');
        }
        // console.log(groupPath)
        var taSheetList = xlsx.parse(csv_dstPath_ta)
        var taData = taSheetList[0].data

        //calculate how many members in one team and the members' columns in the table
        var taHeader = taData[0]
        var length = 0
        for (var l = 1; l < taData.length; l++) {
          // console.log(taData[l])
          if (taData[l].length !== 0) {
            length++
          }
        }
        // console.log(length)
        // Insert into TA table
        if (taHeader[0] === "taEmailAccount") {
          for (var i = 1; i <= length; i++) {
            var queryInsertTAStuTe = 'INSERT INTO `TA` (`taStudentSPR`, `surname`, `forename`, ' +
              '`email`, `degree`) ' +
              'SELECT "' + taData[i][0] + '", "' + taData[i][1] + '", "' + taData[i][2] + '", "' + taData[i][3] + '", "' + taData[i][4] + '" ' +
              'FROM DUAL WHERE NOT EXISTS (SELECT `taStudentSPR` FROM `TA` WHERE `taStudentSPR`="' + taData[i][0] + '")'
            var queryInsertTALog = 'INSERT INTO `LoginInfo` (`username`, `userType`) ' +
              'SELECT "' + taData[i][0] + '", "TA" ' +
              ' FROM DUAL WHERE NOT EXISTS (SELECT `username` FROM `LoginInfo` WHERE `username`="' + taData[i][0] + '")'
            console.log(queryInsertTALog)


            mysql.query(queryInsertTAStuTe, function (error, results) {
              if (error) {
                console.log(error)
              }
            })
            mysql.query(queryInsertTALog, function (error, logresults) {
              if (error) {
                console.log(error)
              }
            })
          }
        }


      })

      // process student csv and insert into database
      var inputFileStudent = files.studentTable[0];
      var uploadedPathStudent = inputFileStudent.path;
      var csv_dstPath_student = './public/table/' + fields.modID + '_student.xlsx';
      fs.rename(uploadedPathStudent, csv_dstPath_student, function (err) {
        if (err) {
          console.log('rename error:' + err);
        } else {
          console.log('rename student csv ok');
        }
        // console.log(groupPath)
        var studentSheetList = xlsx.parse(csv_dstPath_student)
        var studentData = studentSheetList[0].data

        //calculate how many members in one team and the members' columns in the table
        var studentHeader = studentData[0]
        var length = 0
        for (var l = 1; l < studentData.length; l++) {
          // console.log(studentData[l])
          if (studentData[l].length !== 0) {
            length++
          }
        }
        // console.log(length)

        // Insert into Student table
        if (studentHeader[0] === "studentEmailAccount") {
          for (var i = 1; i <= length; i++) {
            var queryInsertStudentStuTe = 'INSERT INTO `Student` (`studentSPR`, `studentNumber`, ' +
              '`surname`, `forename`, `email`, `fileLocation`) ' +
              'SELECT "' + studentData[i][0] + '", "' + studentData[i][1] + '", "' + studentData[i][2] + '", "' + studentData[i][3] + '", "' + studentData[i][4] + '", "' + studentData[i][5] + '" ' +
              'FROM DUAL WHERE NOT EXISTS (SELECT `studentSPR` FROM `Student` WHERE `studentSPR`="' + studentData[i][0] + '")'
            var queryInsertStudentLog = 'INSERT INTO `LoginInfo` (`username`, `userType`) ' +
              'SELECT "' + studentData[i][0] + '", "student" ' +
              ' FROM DUAL WHERE NOT EXISTS (SELECT `username` FROM `LoginInfo` WHERE `username`="' + studentData[i][0] + '")'
            console.log(queryInsertStudentLog)


            mysql.query(queryInsertStudentStuTe, function (error, results) {
              if (error) {
                console.log(error)
              }
            })
            mysql.query(queryInsertStudentLog, function (error, logresults) {
              if (error) {
                console.log(error)
              }
            })
          }
        }

      })

      // process grouping csv and insert into database
      var inputFileGrouping = files.groupingTable[0];
      var uploadedPathGrouping = inputFileGrouping.path;
      var csv_dstPath_grouping = './public/table/' + fields.modID + '_grouping.xlsx';
      fs.rename(uploadedPathGrouping, csv_dstPath_grouping, function (err) {
        if (err) {
          console.log('rename error:' + err);
        } else {
          console.log('rename grouping csv ok');
        }
        // console.log(groupPath)
        var groupingSheetList = xlsx.parse(csv_dstPath_grouping)
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
        // console.log(groupingData[4].length,groupingData[5].length)
        var length = 0
        for (var l = 1; l < groupingData.length; l++) {
          if (groupingData[l].length !== 0) {
            length++
          }
        }
        // console.log(length)

        // Insert into Module table
        var queryInsertModule = 'INSERT INTO `Module`(`moduleCode`, `yearTerm`, `numberofWeeks`, `moduleName`, `moduleDescription`, `modulePlan`, `imgPath`, `employeeID`) ' +
          'VALUES ("' + fields.modID + '", "' + fields.modYs[0].split(",")[0] + '", "' + fields.NoW[0].split(",")[0] + '", "' + fields.modName[0].split(",")[0] + '", "' + fields.modDes[0].split(",")[0] + '", "' + fields.modPlan[0].split(",")[0] + '", "' + req.session.img_dstPath + '", "' + uname + '")'



        mysql.query(queryInsertModule, function (error, results) {
          if (error) {
            console.log(error)
          }
          // console.log("queryInsertModule")
        })

        // Insert into ModStuTe table
        for (var i = 1; i <= length; i++) {
          for (var j = 0; j < membersInTeam; j++) {
            if (typeof groupingData[i][indexArray[j]] !== "undefined") {
              var queryInsertModStuTe = 'INSERT INTO `ModStuTe`(`studentSPR`, `moduleCode`, `yearTerm`, `teamNumber`, `memberIndex`) ' +
                'VALUES ("' + groupingData[i][indexArray[j]] + '", "' + fields.modID + '", "' + fields.modYs[0].split(",")[0] + '", "' + groupingData[i][0] + '", "' + (j + 1) + '")'



              mysql.query(queryInsertModStuTe, function (error, results) {
                if (error) {
                  console.log(error)
                }
                // console.log("queryInsertModStuTe")
              })
            }
          }
        }

        // Insert into ProjectInfo table
        for (i = 1; i <= length; i++) {
          var queryInsertProjectInfo = 'INSERT INTO `ProjectInfo`(`moduleCode`, `yearTerm`, `teamNumber`, `taStudentSPR`, `labCode`, `projectTitle`, `projectBrief`) ' +
            'VALUES ("' + fields.modID + '", "' + fields.modYs[0].split(",")[0] + '", "' + groupingData[i][0] + '", "' + groupingData[i][3] + '", "" , "' + groupingData[i][1] + '", "' + groupingData[i][2] + '")'



          mysql.query(queryInsertProjectInfo, function (error, results) {
            if (error) {
              console.log(error)
            }
            // console.log("queryInsertProjectInfo")
          })
        }

        res.redirect('/lecturer_homepage')
      })
    }
  })

  // form.parse(req, function(err, fields, files) {
  //     var filesTemp = JSON.stringify(files, null, 2);
  //     if(err) {
  //         console.log('parse error:' + err);
  //     }else {
  //         console.log('parse files:' + filesTemp);


  // console.log("csv:"+csv_dstPath)
  // console.log("img:" + req.session.img_dstPath)
  // console.log(fields)

  // res.writeHead(200, {'content-type': 'text/plain;charset=utf-8'});
  // res.write('received upload:\n\n');
  // res.end(util.inspect({fields: fields, files: filesTemp}))
  //     }
  // })
})

router.post('/lecturer_modifyModule', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }

  var queryUpdateModule = ''
  /* 生成multiparty对象，并配置上传目标路径 */
  var form = new multiparty.Form();
  /* 设置编辑 */
  form.encoding = 'utf-8';
  //设置文件存储路劲
  form.uploadDir = './public/upload_files';
  //设置文件大小限制
  form.maxFilesSize = 10 * 1024 * 1024;
  // form.maxFields = 1000;   //设置所有文件的大小总和//上传后处理
  form.parse(req, function (err, fields, files) {
    var filesTemp = JSON.stringify(files, null, 2);
    if (err) {
      console.log('parse error:' + err);
    }
    else {
      console.log('parse files:' + filesTemp);
      var img_dstPath = ''
      if (files.coverImage[0].originalFilename === '') {
        queryUpdateModule = 'UPDATE `Module` SET `moduleName`="' + fields.modName + '", `numberofWeeks`="' + fields.NoW + '",`moduleDescription`="' + fields.modDes + '", ' +
          '`modulePlan`="' + fields.modPlan + '" WHERE `moduleCode`="' + fields.modID + '" AND `yearTerm`="' + selectedYT + '"'
      } else {
        inputFile = files.coverImage[0];
        uploadedPath = inputFile.path;
        img_dstPath = './public/images/' + fields.modID + ".jpg";
        //重命名为真实文件名
        fs.rename(uploadedPath, img_dstPath, function (err) {
          if (err) {
            console.log('rename error:' + err);
          } else {
            console.log('rename ok');
          }
        })
        req.session.img_dstPath = img_dstPath
        queryUpdateModule = 'UPDATE `Module` SET `moduleName`="' + fields.modName + '", `numberofWeeks`="' + fields.NoW + '",`moduleDescription`="' + fields.modDes + '", ' +
          '`modulePlan`="' + fields.modPlan + '", `imgPath`="' + req.session.img_dstPath + '" WHERE `moduleCode`="' + fields.modID + '" AND `yearTerm`="' + selectedYT + '"'
        // console.log("img:" + img_dstPath)
      }
      // Update Module table
      mysql.query(queryUpdateModule, function (error, results) {
        if (error) {
          console.log(error)
        }
      })
      // console.log(files.groupingTable[0].originalFilename === '')
      // console.log(files.groupingTable[0].originalFilename)
      if (files.groupingTable[0].originalFilename !== '') {
        var inputFile = files.groupingTable[0];
        var uploadedPath = inputFile.path;
        var dstPath = './public/table/' + inputFile.originalFilename;
        //重命名为真实文件名
        fs.rename(uploadedPath, dstPath, function (err) {
          if (err) {
            console.log('rename error:' + err);
          } else {
            console.log('rename ok');
          }
        })

        // res.writeHead(200, {'content-type': 'text/plain;charset=utf-8'});
        // res.write('received upload:\n\n');
        // res.end(util.inspect({fields: fields, files: filesTemp}))

        var groupPath = './public/table/' + inputFile.originalFilename;
        var groupingSheetList = xlsx.parse(groupPath)
        var groupingData = groupingSheetList[0].data


        // calculate how many members in one team and the members' columns in the table
        var groupingHeader = groupingData[0]
        var membersInTeam = 0
        var indexArray = []
        for (var n = 0; n < groupingHeader.length; n++) {
          if (groupingHeader[n].indexOf("member") != -1) {
            indexArray[membersInTeam] = n
            membersInTeam += 1
          }
        }

        var length = 0
        for (var l = 1; l < groupingData.length; l++) {
          if (groupingData[l].length !== 0) {
            length++
          }
        }
        console.log(groupingData.length, length)

        // Delete & insert ProjectInfo table
        var queryDeleteProjectInfo = 'DELETE FROM `ProjectInfo` WHERE `moduleCode`="' + fields.modID + '" AND `yearTerm`="' + selectedYT + '"'



        mysql.query(queryDeleteProjectInfo, function (error, results) {
          if (error) {
            console.log(error)
          }
          for (var i = 1; i <= length; i++) {
            var queryInsertProjectInfo = 'INSERT INTO `ProjectInfo` (`moduleCode`, `yearTerm`, `teamNumber`, `taStudentSPR`, `labCode`, `projectTitle`, `projectBrief`) ' +
              'VALUES ("' + fields.modID + '", "' + selectedYT + '", "' + groupingData[i][0] + '", "' + groupingData[i][3] + '", "" , "' + groupingData[i][1] + '", "' + groupingData[i][2] + '")'
            mysql.query(queryInsertProjectInfo, function (error, results) {
              if (error) {
                console.log(error)
              }
              console.log("insert project")
            })
          }
        })


        // Delete & insert ModStuTe table
        var queryDeleteModStuTe = 'DELETE FROM `ModStuTe` WHERE `moduleCode`="' + fields.modID + '" AND `yearTerm`="' + selectedYT + '"'

        mysql.query(queryDeleteModStuTe, function (error, results) {
          if (error) {
            console.log(error)
          }
          for (var i = 1; i <= length; i++) {
            for (var j = 0; j < membersInTeam; j++) {
              if (typeof groupingData[i][indexArray[j]] !== "undefined") {
                var queryInsertModStuTe = 'INSERT INTO `ModStuTe`(`studentSPR`, `moduleCode`, `yearTerm`, `teamNumber`, `memberIndex`) ' +
                  'VALUES ("' + groupingData[i][indexArray[j]] + '", "' + fields.modID + '", "' + selectedYT + '", "' + groupingData[i][0] + '", "' + (j + 1) + '")'
                mysql.query(queryInsertModStuTe, function (error, results) {
                  if (error) {
                    console.log(error)
                  }
                  console.log("insert ModStuTe")
                })
              }
            }
          }
        })
      }
      res.redirect('lecturer_admin')
    }
  })

  // form.parse(req, function (err, fields, files) {
  //   var filesTemp = JSON.stringify(files, null, 2);
  //   if (err) {
  //     console.log('parse error:' + err);
  //   } else {
  //     console.log('parse files:' + filesTemp);
  //   }
  // })
})

router.get('/lecturer_delete_module', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }

  module = req.query.module


  var queryDeleteModule = 'DELETE FROM `Module` WHERE `moduleCode`="' + module + '" AND `yearTerm`="' + selectedYT + '"'


  mysql.query(queryDeleteModule, function (error, results) {
    if (error) {
      console.log(error)
    }
  })

  // Delete ProjectInfo table
  var queryDeleteProjectInfo = 'DELETE FROM `ProjectInfo` WHERE `moduleCode`="' + module + '" AND `yearTerm`="' + selectedYT + '"'



  mysql.query(queryDeleteProjectInfo, function (error, results) {
    if (error) {
      console.log(error)
    }
  })

  // Delete ModStuTe table
  var queryDeleteModStuTe = 'DELETE FROM `ModStuTe` WHERE `moduleCode`="' + module + '" AND `yearTerm`="' + selectedYT + '"'



  mysql.query(queryDeleteModStuTe, function (error, results) {
    if (error) {
      console.log(error)
    }
  })

  // Delete StudentFeedback table
  var queryDeleteStudentFeedback = 'DELETE FROM `StudentFeedback` WHERE `moduleCode`="' + module + '" AND `yearTerm`="' + selectedYT + '"'



  mysql.query(queryDeleteStudentFeedback, function (error, results) {
    if (error) {
      console.log(error)
    }
  })

  // Delete TeamFeedback table
  var queryDeleteTeamFeedback = 'DELETE FROM `TeamFeedback` WHERE `moduleCode`="' + module + '" AND `yearTerm`="' + selectedYT + '"'



  mysql.query(queryDeleteTeamFeedback, function (error, results) {
    if (error) {
      console.log(error)
    }
  })

  res.redirect('lecturer_admin')
})

router.get('/lecturer_setYS', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
  } else {
    res.redirect('/expire')
  }

  req.session.y_s = req.query.YS
  // console.log(req.query.YS)

  var query_delete_YearSemester = 'DELETE FROM `CurrentYearTerm` WHERE `employeeID`="' + uname + '"'
  var query_setYearSemester = 'INSERT INTO `CurrentYearTerm`(`yearTerm`, `employeeID`) VALUES ("' + req.session.y_s + '", "' + uname + '")'
  var queryYS = 'SELECT `yearTerm` FROM `CurrentYearTerm` WHERE `employeeID`="' + uname + '"'
  // console.log(query_setYearSemester)



  mysql.query(query_delete_YearSemester, function (error, results) {
    if (error) {
      console.log(error)
    }
    mysql.query(query_setYearSemester, function (error, results) {
      if (error) {
        console.log(error)
      }
      mysql.query(queryYS, function (error, YS) {
        if (error) {
          console.log(error)
        }
        req.session.ys = YS[0].yearTerm
        res.redirect('/lecturer_homepage')
      })
    })
  })
})

router.get('/lecturer_exportCsv', function(req, res){
  if (req.session.uname) {
    var uname = req.session.uname
    var selectedYT = req.session.ys
  } else {
    res.redirect('/login')
  }
  // console.log(req.session.ys)
  var module = req.query.module
  // console.log(module)
  fs.exists('./module_database_csv', (exists) => {
    if (exists === false) {
      fs.mkdir('module_database_csv', (err) => {
        if (err) return console.log(err, '--->mkdir<---')
      })
    }
  });

  var queryStudentScore = 'SELECT studentSPR, score, writtenFeedback, contribution, weekNumber FROM `StudentFeedback` ' +
      'WHERE moduleCode = "'+module+'" AND yearTerm="'+selectedYT+'"'
  var queryStudentTeamProject = 'SELECT Student.studentSPR, surname, forename, email, weekNumber, score, contribution, writtenFeedback ' +
      'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR '
  var queryStudentFeedback = queryStudentTeamProject +
      'JOIN ('+queryStudentScore+') AS stuScore ON (ModStuTe.studentSPR=stuScore.studentSPR)' +
      'WHERE ModStuTe.moduleCode="'+module+'" AND ModStuTe.yearTerm="'+selectedYT+'"'
  var queryTeamFeedback = 'SELECT TeamFeedback.teamNumber, projectTitle, weekNumber, score, writtenFeedback ' +
      'FROM `TeamFeedback` JOIN `ProjectInfo` ON TeamFeedback.moduleCode=ProjectInfo.moduleCode AND TeamFeedback.teamNumber=ProjectInfo.teamNumber ' +
      'AND TeamFeedback.yearTerm=ProjectInfo.yearTerm ' +
      'WHERE TeamFeedback.moduleCode="'+module+'" AND TeamFeedback.yearTerm="'+selectedYT+'"'

  fs.exists('./module_database_csv/' + module + '_' + selectedYT + '.csv', (exists) => {
    if (exists === true) {
      fs.unlink('./module_database_csv/' + module + '_' + selectedYT + '.csv', err => {
        if (err) {
          console.log(err);
        }
      })
    }
  });

  mysql.query(queryTeamFeedback, function (error, TeamFeedback) {
    if (error) {
      console.log(error)
    }
    // console.log(StudentFeedback)
    if (typeof TeamFeedback === "undefined" || TeamFeedback.length === 0) {
      TeamFeedback[0].hint = "No team feedback exists for this course. "
    }
    const csv = new objToCsv(TeamFeedback)
    csv.toDisk('./module_database_csv/'+module+'_'+selectedYT+'.csv')

    mysql.query(queryStudentFeedback, function (error, StudentFeedback) {
      if (error) {
        console.log(error)
      }
      var blank = {studentSPR: '', surname: '', forename: '', email: '', weekNumber: '', score: '', contribution: '', writtenFeedback: ''}
      var stuHeader = {studentSPR: 'studentSPR', surname: 'surname', forename: 'forename', email: 'email',
        weekNumber: 'weekNumber', score: 'score', contribution: 'contribution', writtenFeedback: 'writtenFeedback'}
      StudentFeedback.splice(0, 0, stuHeader);
      StudentFeedback.splice(0, 0, blank);
      console.log(StudentFeedback)
      if (typeof StudentFeedback === "undefined" || StudentFeedback.length === 0) {
        StudentFeedback[0].hint = "No student feedback exists for this course. "
      }
      const csv = new objToCsv(StudentFeedback)
      csv.toDisk('./module_database_csv/'+module+'_'+selectedYT+'.csv', {append: true})
      res.redirect('lecturer_download_csv?module='+module)
    })
  })
  //
  // // console.log(req.session.export_module)
  // // console.log("***************")
  // // console.log(typeof req.session.export_module)
  // // console.log("***************")
})

router.get('/lecturer_download_csv', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }

  var module = req.query.module
  // console.log(modules)
  var csv_name = module + '_' + selectedYT + '.csv'
  var path = 'module_database_csv/' + csv_name;

  // console.log(csv_name)
  // console.log(selectedYT)
  // console.log(csv_name)
  // console.log(path)
  // console.log(__dirname)


  // *************合并csv

  path = __dirname.replace(/routes/, path)
  // console.log(filepath)
  // console.log("++++++++++++++++++++++++++++++++++++++++++++++++")
  res.download(path, csv_name, function (err) {
    if (err) {
      console.log(err)
    } else {
      // res.send('ok')
    }
  })
  // res.redirect('lecturer_admin')
})

router.get('/lecturer_admin', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    // var allModules = req.session.allModules
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }

  var querySelect = 'SELECT * FROM `Module` WHERE `yearTerm`="' + selectedYT + '" AND `employeeID`="' + uname + '"'
  var queryGroupNumber = 'SELECT moduleCode, COUNT(teamNumber) NumberOfTeam FROM `projectInfo` WHERE yearTerm="' + selectedYT + '" ' +
    'GROUP BY `moduleCode` '
  var queryStudentNumber = 'SELECT moduleCode, COUNT(studentSPR) NumberOfStudent FROM `ModStuTe` WHERE yearTerm="' + selectedYT + '" ' +
    'GROUP BY `moduleCode` '
  var queryAllModulesInfo = 'SELECT * FROM `Module` ' +
    'JOIN (' + queryGroupNumber + ') AS GroupNumber ON Module.moduleCode=GroupNumber.moduleCode ' +
    'JOIN (' + queryStudentNumber + ') AS StudentNumber ON Module.moduleCode=StudentNumber.moduleCode ' +
    'WHERE employeeID = "' + uname + '" AND yearTerm="' + selectedYT + '"'
  var queryAllModuleCodes = 'SELECT moduleCode, yearTerm FROM `Module`'


  mysql.query(querySelect, function (error, allModules) {
    if (error) {
      console.log(error)
    }
    mysql.query(queryAllModulesInfo, function (error, moduleInfo) {
      if (error) {
        console.log(error)
      }
      for (var i = 1; i <= moduleInfo.length; i++) {
        moduleInfo[i - 1].index = i
      }
      // console.log(moduleInfo)
      mysql.query(queryAllModuleCodes, function (error, moduleCodes) {
        if (error) {
          console.log(error)
        }
        // console.log(moduleCodes)
        res.render('lecturer_admin.html', {
          modules: allModules,
          moduleInfo: moduleInfo,
          uname: req.session.lFullName,
          YS: req.session.ys,
          allModuleCodes: moduleCodes,
          muduleNumber: allModules.length
        })
      })
    })
  })
})

router.get('/student_feedback', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }
  var reqObj = req.query
  req.session.moduleID = reqObj.moduleID
  var moduleID = req.session.moduleID
  var allModules = req.session.allModules
  //var querySelectAllModule = 'SELECT * FROM module'
  var querySelectCurrentModule = 'SELECT * FROM module where `moduleCode`="' + moduleID + '" AND yearTerm="' + selectedYT + '"'
  var querySelectselectedStu = 'SELECT * FROM student where `studentSPR`="' + uname + '"'

  var selectMandS = '`moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" AND yearTerm="' + selectedYT + '"'

  var selectT = 'SELECT teamNumber FROM modstute where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" AND yearTerm="' + selectedYT + '" '

  var queryFeedbackScore = 'SELECT  FORMAT(AVG(score),1) AS score_avg FROM studentfeedback where' + selectMandS

  var querySelectfeedback = 'SELECT weekNumber, score, contribution, writtenFeedback, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer ' +
    'FROM studentfeedback where' + selectMandS

  var querySelectTeamfeedback = 'SELECT  weekNumber, score, writtenFeedback, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer ' +
    'FROM teamfeedback where `moduleCode`="' + moduleID + '" and `teamNumber`= (' + selectT + ') AND yearTerm="' + selectedYT + '"'

  var querySelectteam = 'SELECT * FROM modstute where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" AND yearTerm="' + selectedYT + '"'
  var querySelectproject =
    'SELECT * FROM projectinfo where `moduleCode`="' + moduleID + '" and `teamNumber`= (' + selectT + ') AND yearTerm="' + selectedYT + '"'

  var countstudent = 'select count(score) As scount from studentfeedback where' + selectMandS
  var countteam = 'select count(score) As scount from teamfeedback ' +
    'where `moduleCode`="' + moduleID + '" and `teamNumber`= (' + selectT + ') AND yearTerm="' + selectedYT + '"'




  mysql.query(querySelectCurrentModule, function (error, CMod) {
    if (error) {
      console.log(error)
    }
    mysql.query(querySelectselectedStu, function (error, Stu) {
      if (error) {
        console.log(error)
      }



      // fs.exists("/public/images/" + Stu[0].fileLocation, (exists) => {
      //   if (exists === false) {
      //     Stu[0].fileLocation = "/public/images/profile_default.jpeg"
      //   }
      // });
      fs.exists("./public/images/" + Stu[0].fileLocation, (exists) => {
        if (exists === false) {
          Stu[0].fileLocation = "/public/images/profile_default.jpeg"
          // console.log("**************")
        }
        else {
          if (Stu[0].fileLocation === '') {
            Stu[0].fileLocation = "/public/images/profile_default.jpeg"
            // console.log("&&&&&&&&&&&&")
          }
          else {
            Stu[0].fileLocation = "/public/images/" + Stu[0].fileLocation
            // console.log("$$$$$$$$$$$$$$$$")
            // console.log(student[0].fileLocation)
          }
        }
      })


      mysql.query(querySelectteam, function (error, Stea) {
        if (error) {
          console.log(error)
        }
        mysql.query(querySelectfeedback, function (error, SFd) {
          if (error) {
            console.log(error)
          }
          mysql.query(querySelectTeamfeedback, function (error, StFd) {
            if (error) {
              console.log(error)
            }
            mysql.query(querySelectproject, function (error, SPro) {
              if (error) {
                console.log(error)
              }
              mysql.query(queryFeedbackScore, function (error, Score) {
                if (error) {
                  console.log(error)
                }
                mysql.query(countstudent, function (error, countst) {
                  if (error) {
                    console.log(error)
                  }
                  mysql.query(countteam, function (error, countte) {
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

router.get('/student_setYS', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
  } else {
    res.redirect('/expire')
  }

  req.session.y_s = req.query.YS
  // console.log(req.query.YS)

  var query_delete_YearSemester = 'DELETE FROM `CurrentYearTerm` WHERE `employeeID`="' + uname + '"'
  var query_setYearSemester = 'INSERT INTO `CurrentYearTerm`(`yearTerm`, `employeeID`) VALUES ("' + req.session.y_s + '", "' + uname + '")'
  var queryYS = 'SELECT `yearTerm` FROM `CurrentYearTerm` WHERE `employeeID`="' + uname + '"'
  // console.log(query_setYearSemester)



  mysql.query(query_delete_YearSemester, function (error, results) {
    if (error) {
      console.log(error)
    }
    mysql.query(query_setYearSemester, function (error, results) {
      if (error) {
        console.log(error)
      }
      mysql.query(queryYS, function (error, YS) {
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

router.get('/student_homepage', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    var utype = req.session.utype
    var selectedYT = req.session.ys
  } else {
    res.redirect('/expire')
  }
  //var querySelect = 'SELECT * FROM Module where moduleCode in (select moduleCode from modstute where studentSPR="' + uname + '" ) '
  var querySelect = 'SELECT * FROM Module where moduleCode in (select moduleCode from modstute where studentSPR="' + uname + '" AND yearTerm="' + selectedYT + '" ) '
  var queryStudentName = 'SELECT surname, forename FROM `Student` WHERE `studentSPR`="' + req.session.uname + '"'


  mysql.query(querySelect, function (error, allMod) {
    if (error) {
      console.log(error)
    }
    req.session.allModules = allMod
    var allModules = req.session.allModules
    for (var i = 1; i <= allModules.length; i++) {
      allModules[i - 1].index = i;
    }
    mysql.query(queryStudentName, function (error, StudentName) {
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
})

router.get('/TA_Homepage', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    // var YS = req.session.ys
  } else {
    res.redirect('/expire')
  }
  var querySelectMods = 'SELECT * FROM Module WHERE Module.moduleCode IN ' +
    '(SELECT projectinfo.moduleCode FROM projectinfo JOIN TA ON (projectinfo.taStudentSPR=ta.taStudentSPR) ' +
    'WHERE projectinfo.taStudentSPR="' + uname + '")'
  var queryTAName = 'SELECT surname, forename FROM `TA` WHERE `taStudentSPR`="' + uname + '"'


  mysql.query(querySelectMods, function (error, TAMods) {
    if (error) {
      console.log(error)
    }
    req.session.allMods = TAMods
    var allMods = req.session.allMods
    for (var i = 1; i <= allMods.length; i++) {
      allMods[i - 1].index = i;
    }
    mysql.query(queryTAName, function (error, TAName) {
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
})

router.get('/TA_module', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    // var YS = req.session.ys
  } else {
    res.redirect('/expire')
  }
  var reqObj = req.query
  req.session.modID = reqObj.moduleID
  req.session.selectedYS = reqObj.YS
  var selectedModID = req.session.modID
  var YS = req.session.selectedYS

  var allMod = req.session.allMods

  // This query selects the module names and module codes to display
  var querySelectCurrentMod = 'SELECT moduleName, moduleCode FROM Module WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '"'

  // This query shows all the groups a TA coaches
  var queryMembersTeam = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
    'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
    'WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '" GROUP BY ModStuTe.teamNumber '
  var queryGroupAveScore = 'SELECT teamNumber, AVG(score) avgScore FROM `TeamFeedback` ' +
    'WHERE moduleCode = "' + selectedModID + '" AND `yearTerm`="' + YS + '" GROUP BY teamNumber '
  var queryGroupLatestScore = 'SELECT teamNumber, score lastScore, weekNumber, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM TeamFeedback ' +
    'WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '" AND (teamNumber, weekNumber) IN ' +
    '(SELECT teamNumber, MAX(weekNumber) FROM TeamFeedback WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '" GROUP BY teamNumber) '
  var queryGroupTA = 'SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
  var queryCoachedGroups = queryGroupTA +
    'JOIN (' + queryMembersTeam + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
    'JOIN (' + queryGroupAveScore + ') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
    'JOIN (' + queryGroupLatestScore + ') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
    'WHERE ProjectInfo.moduleCode="' + selectedModID + '" AND ProjectInfo.taStudentSPR="' + uname + '" AND ProjectInfo.yearTerm="' + YS + '" '
  var queryCoachedGroupsNoScore = queryGroupTA +
    'JOIN (' + queryMembersTeam + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
    'WHERE ProjectInfo.moduleCode="' + selectedModID + '" AND ProjectInfo.taStudentSPR="' + uname + '" AND ProjectInfo.yearTerm="' + YS + '" '

  // This query shows the weeks that have had feedback
  var queryWeekNumber = 'SELECT weekNumber FROM `teamfeedback` WHERE `moduleCode`="' + selectedModID + '" GROUP BY weekNumber'


  mysql.query(querySelectCurrentMod, function (error, ModCurrent) {
    if (error) {
      console.log(error)
    }
    mysql.query(queryCoachedGroupsNoScore, function (error, TAGroupsNoScore) {
      if (error) {
        console.log(error)
      }
      req.session.group = TAGroupsNoScore
      mysql.query(queryCoachedGroups, function (error, TAGroups) {
        if (error) {
          console.log(error)
        }
        var studentIndexNames = new Object()
        // console.log(TAGroups.length)
        // console.log(typeof TAGroups)

        // console.log(req.session.group)
        // console.log("%%%%%%%%%%%%%%")
        if (TAGroups.length !== req.session.group.length) {
          // console.log(TAGroups[0])
          // console.log("*************")
          for (var i = 0; i < req.session.group.length; i++) {
            for (var j = 0; j < TAGroups.length; j++) {
              if (req.session.group[i].teamNumber === TAGroups[j].teamNumber) {
                req.session.group.splice(i, 1); //利用splice函数删除元素，从第i个位置，截取长度为1的元素
              }
            }
          }
          for (var m = 0; m < req.session.group.length; m++) {
            // console.log(TAGroups[m])
            // console.log("&&&&&&&&&&&")
            req.session.group[m].avgScore = "NA"
            req.session.group[m].lastScore = "NA"
            req.session.group[m].weekNumber = "NA"
            TAGroups.push(req.session.group[m])
          }
        }
        else {
          for (j = 0; j < TAGroups.length; j++) {
            TAGroups[j].weekNumber = "; week" + TAGroups[j].weekNumber
            var studentNames = TAGroups[j].studentName
            var studentNamesArray = studentNames.split(',')
            studentIndexNames[j] = new Object()
            var studentNumber = studentNamesArray.length
            for (i = 0; i < studentNumber; i++) {
              studentIndexNames[j][i] = new Object()
              studentIndexNames[j][i].teamNumber = TAGroups[j].teamNumber
              studentIndexNames[j][i].indexNumber = i.toString()
              studentIndexNames[j][i].name = studentNamesArray[i]
            }
            console.log("*************")
            console.log(TAGroups)
            console.log("*************")
          }
        }
        // console.log(studentIndexNames[0][0].name)
        mysql.query(queryWeekNumber, function (error, weekNumbers) {
          if (error) {
            console.log(error)
          }
          var weekexist = new Array()
          for (j = 0; j < weekNumbers.length; j++) {
            weekexist[j] = weekNumbers[j].weekNumber
          }
          var weeknum = new Array()
          var listIndex = 0
          for (s = 1; s < 21; s++) {
            if (weekexist.includes(s.toString())) {
              continue
            }
            else {
              weeknum[listIndex] = s.toString()
            }
            listIndex++
          }
          // console.log(TAGroups)
          res.render('TA_module.html', {
            uname: req.session.taFullName,
            mods: allMod,
            module: ModCurrent[0],
            coachedGroups: TAGroups,
            studentNames: studentIndexNames,
            weekNumbers: weeknum,
            YS: req.session.ys
          })
        })
      })
    })
  })
})

router.get('/TA_group', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    // var YS = req.session.ys
  } else {
    res.redirect('/expire')
  }
  var reqObj = req.query
  req.session.modID = reqObj.moduleID
  var selectedModID = req.session.modID
  req.session.teamNumber = reqObj.teamNumber
  var teamNumber = req.session.teamNumber
  req.session.selectedYS = reqObj.YS
  var YS = req.session.selectedYS

  var allMod = req.session.allMods
  var allTAGroups = req.session.TAGroup


  // This query selects the module names and module codes to display
  var querySelectCurrentMod = 'SELECT moduleName, moduleCode, modulePlan, numberofWeeks FROM Module WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '"'
  // console.log(querySelectCurrentMod)
  // This query shows all the group members in a module
  var queryTeamMembers = 'SELECT Student.surname, Student.forename, Student.fileLocation, ModStuTe.memberIndex FROM `Student` JOIN `ModStuTe` ' +
    'ON ModStuTe.studentSPR=Student.studentSPR ' +
    'WHERE ModStuTe.teamNumber="' + teamNumber + '" AND `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '" '

  // query team feedback
  var queryTeamFeedback = 'SELECT teamNumber, weekNumber, score, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date ' +
    'FROM `TeamFeedback` WHERE teamNumber="' + teamNumber + '" AND `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '"'

  // This query select all student feedback information for a given group in a module
  var queryStudentFeedback = 'SELECT concat(Student.surname, " ", Student.forename) studentName, ModStuTe.memberIndex, ' +
    'StudentFeedback.weekNumber,StudentFeedback.score, StudentFeedback.contribution, StudentFeedback.writtenFeedback ' +
    'FROM `student` JOIN `StudentFeedback` ON student.studentSPR=StudentFeedback.studentSPR ' +
    'JOIN `ModStuTe` ON (StudentFeedback.studentSPR=ModStuTe.studentSPR AND StudentFeedback.moduleCode=ModStuTe.moduleCode AND StudentFeedback.yearTerm=ModStuTe.yearTerm)' +
    'WHERE ModStuTe.teamNumber = "' + teamNumber + '" AND StudentFeedback.moduleCode = "' + selectedModID + '" AND ModStuTe.yearTerm="' + YS + '"'

  // This query shows the weeks that have had feedback
  var queryWeekNumber = 'SELECT weekNumber FROM `teamFeedback` WHERE `moduleCode`="' + selectedModID + '" AND `teamNumber`="' + teamNumber + '" AND yearTerm="' + YS + '" GROUP BY weekNumber'

  var queryGroupTA = 'SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
  var queryMembersTeam = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
    'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
    'WHERE `moduleCode`="' + selectedModID + '" AND `teamNumber`="' + teamNumber + '" AND `yearTerm`="' + YS + '" GROUP BY ModStuTe.teamNumber '
  var queryGroup = queryGroupTA +
    'JOIN (' + queryMembersTeam + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
    'WHERE ProjectInfo.moduleCode="' + selectedModID + '" AND ProjectInfo.teamNumber="' + teamNumber + '" AND ProjectInfo.taStudentSPR="' + uname + '" AND ProjectInfo.yearTerm="' + YS + '" '



  mysql.query(querySelectCurrentMod, function (error, ModCurrent) {
    if (error) {
      console.log(error)
    }
    mysql.query(queryTeamMembers, function (error, TeamMembers) {
      if (error) {
        console.log(error)
      }
      // console.log(TeamMembers)
      var Member
      for(var k = 0; k < TeamMembers.length - 1; k++){
        for(var l = k + 1; l < TeamMembers.length; l++){
          if(TeamMembers[l].memberIndex < TeamMembers[k].memberIndex){
            Member = TeamMembers[k]
            TeamMembers[k] = TeamMembers[l]
            TeamMembers[l] = Member
          }
        }
      }
      // console.log(TeamMembers)
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
      // console.log(TeamMembers)

      mysql.query(queryTeamFeedback, function (error, TeamFeedback) {
        if (error) {
          console.log(error)
        }
        mysql.query(queryStudentFeedback, function (error, Student) {
          if (error) {
            console.log(error)
          }
          var stuFeedback
          for(var k = 0; k < Student.length - 1; k++){
            for(var l = k + 1; l < Student.length; l++){
              if(Student[l].memberIndex < Student[k].memberIndex){
                stuFeedback = Student[k]
                Student[k] = Student[l]
                Student[l] = stuFeedback
              }
            }
          }
          var memberNum = 0
          var weeklyFeedback = new Array()
          // console.log(typeof Student)
          loop:
          for (var weekNum = 1; weekNum < 21; weekNum++) {
            if (weekNum > TeamFeedback.length) {
              break
            }
            weeklyFeedback[weekNum - 1] = new Array()
            for (const teamF of TeamFeedback) {
              if (typeof (teamF) === "undefined") {
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
            // console.log(Student)
            for (const stuF of Student) {
              if (typeof (stuF) === "undefined") {
                break loop
              }
              if (parseInt(stuF.weekNumber) === weekNum) {
                memberNum++
                weeklyFeedback[weekNum - 1].push(stuF.studentName);
                weeklyFeedback[weekNum - 1].push(stuF.score);
                weeklyFeedback[weekNum - 1].push(stuF.contribution);
                weeklyFeedback[weekNum - 1].push(stuF.writtenFeedback);
              }
              // console.log(FeedbackByWeek[weekNum-1].length)
            }
            weeklyFeedback[weekNum - 1].splice(5, 0, memberNum)
            memberNum = 0
          }
          // console.log(weeklyFeedback)
          mysql.query(queryWeekNumber, function (error, weekNumbers) {
            if (error) {
              console.log(error)
            }
            var weekexist = new Array()
            for (var j = 0; j < weekNumbers.length; j++) {
              weekexist[j] = weekNumbers[j].weekNumber
            }
            var weeknum = new Array()
            var listIndex = 0
            for (var s = 1; s <= ModCurrent[0].numberofWeeks; s++) {
              if (weekexist.includes(s)) {
                continue
              } else {
                weeknum[listIndex] = s.toString()
              }
              listIndex++
            }
            // console.log(weeknum)
            mysql.query(queryGroup, function (error, TAGroup) {
              if (error) {
                console.log(error)
              }
              // console.log(TAGroup)
              res.render('TA_group.html', {
                uname: req.session.taFullName,
                mods: allMod,
                module: ModCurrent[0],
                teamMember: TeamMembers,
                teamFeedback: TeamFeedback,
                student: Student,
                weeklyFeedback: weeklyFeedback,
                YS: req.session.ys,
                weekNumbers: weeknum,
                selectedGroup: TAGroup,
                group: teamNumber,
                memberNumber: TeamMembers.length,
                weeks: weekNumbers.length
              })
            })
          })
        })
      })
    })
  })
})

router.post('/provideFeedback', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    // var YS = req.session.ys
  } else {
    res.redirect('/expire')
  }
  var feedback = req.body
  var selectedModID = req.session.modID
  var studentScore = feedback.studentScore
  var studentContribution = feedback.studentContribution
  var feedbackStudent = feedback.studentFeedback
  var YS = req.session.selectedYS
  // console.log(studentScore)
  // console.log(studentContribution)
  // console.log(feedbackStudent)
  var time = new Date()
  var date = time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate()

  var queryStudentSPR = 'SELECT studentSPR FROM ModStuTe WHERE moduleCode="' + selectedModID + '" AND teamNumber="' + feedback.teamNumber + '" ORDER BY memberIndex ASC'

  var insertTeamFeed = 'INSERT INTO teamfeedback (`moduleCode`,`yearTerm`,`weekNumber`,`teamNumber`,`score`,`writtenFeedback`,`messageLecturer`,`date`)' +
    'VALUES ("' + selectedModID + '", "' + YS + '", "' + feedback.weekNumber + '", "' + feedback.teamNumber + '","' + feedback.teamScore + '", ' +
    '"' + feedback.feedbackTeam + '", "' + feedback.message + '", "' + date + '")'



  mysql.query(insertTeamFeed, function (error, resultFeedback) {
    if (error) {
      console.log(error)
    }
    mysql.query(queryStudentSPR, function (error, resultStudents) {
      if (error) {
        console.log(error)
      }
      var studentSPRNumber = []
      for (i = 0; i < resultStudents.length; i++) {
        var studentSPR = resultStudents[i].studentSPR
        studentSPRNumber.push(studentSPR)
      }

      for (i = 0; i < studentSPRNumber.length; i++) {
        var insertIntoStudentFeedback = 'INSERT INTO studentfeedback (`studentSPR`,`moduleCode`,`yearTerm`,`weekNumber`,`score`,`contribution`,`writtenFeedback`,`messageLecturer`,`date`)' +
          'VALUES ("' + studentSPRNumber[i] + '","' + selectedModID + '", "' + YS + '", "' + feedback.weekNumber + '", "' + studentScore[i] + '", "' + studentContribution[i] + '", ' +
          '"' + feedbackStudent[i] + '", "' + feedback.message + '", "' + date + '")'

        mysql.query(insertIntoStudentFeedback, function (error, resultFeedback) {
          if (error) {
            console.log(error)
          }
        })
      }
    })
  })
  res.redirect('/TA_group?moduleID=' + selectedModID + '&teamNumber=' + feedback.teamNumber + '&YS=' + req.session.selectedYS)
})

router.post('/updateFeedback', function (req, res) {
  if (req.session.uname) {
    var uname = req.session.uname
    // var YS = req.session.ys
  } else {
    res.redirect('/expire')
  }
  var feedback = req.body
  var selectedModID = req.session.modID
  var YS = req.session.selectedYS
  // req.session.studentScore = feedback.studentScore
  // req.session.studentContribution = feedback.studentContribution
  // req.session.feedbackStudent = feedback.studentFeedback
  //
  // console.log(studentScore)
  var time = new Date()
  var date = time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate()

  // Update teamfeedback table
  var queryUpdateTeam = 'UPDATE `teamfeedback` SET `score`="' + feedback.teamScore + '", `writtenFeedback`="' + feedback.feedbackTeam + '", ' +
    '`messageLecturer`="' + feedback.message + '", `date`="' + date + '" ' +
    'WHERE `moduleCode`="' + selectedModID + '" AND `teamNumber`="' + feedback.teamNumber + '" AND `weekNumber`="' + feedback.weekNumber + '" AND `yearTerm`="' + YS + '"'
  var queryStudentSPR = 'SELECT studentSPR FROM ModStuTe ' +
    'WHERE moduleCode="' + selectedModID + '" AND teamNumber="' + feedback.teamNumber + '" AND `yearTerm`="' + YS + '" ORDER BY memberIndex ASC'



  mysql.query(queryUpdateTeam, function (error, results) {
    if (error) {
      console.log(error)
    }
    mysql.query(queryStudentSPR, function (error, resultStudents) {
      if (error) {
        console.log(error)
      }
      // Update studentFeedback table
      var studentSPRNumber = []
      for (var i = 0; i < resultStudents.length; i++) {
        var studentSPR = resultStudents[i].studentSPR
        studentSPRNumber.push(studentSPR)
      }
      for (i = 0; i < studentSPRNumber.length; i++) {
        var insertIntoStudentFeedback = 'UPDATE `studentFeedback` SET ' +
          '`score`="' + feedback.studentScore[i] + '",`contribution`="' + feedback.studentContribution[i] + '",' +
          '`writtenFeedback`="' + feedback.studentFeedback[i] + '",`messageLecturer`="' + feedback.message + '", `date`="' + date + '" ' +
          'WHERE `moduleCode`="' + req.session.modID + '" AND `studentSPR`="' + studentSPRNumber[i] + '" AND `weekNumber`="' + feedback.weekNumber + '" AND `yearTerm`="' + YS + '"'
        // console.log(insertIntoStudentFeedback)
        mysql.query(insertIntoStudentFeedback, function (error, studentFeedbackResult) {
          if (error) {
            console.log(error)
          }
        })
      }
    })
  })
  res.redirect('/TA_group?moduleID=' + selectedModID + '&teamNumber=' + feedback.teamNumber + '&YS=' + req.session.selectedYS)
})

// router.use('/public/', express.static('./public/'))

// router.get('/expire', function (req, res) {
//   res.render('sessionExpire.html')
// })

// router.get('/pwError', function (req, res) {
//   res.render('passwordError.html')
// })

// router.get('/login', function (req, res) {
//   var user = req.body
//   var uname = req.session.email

//   var queryLogin = 'SELECT `userType` FROM `LoginInfo` WHERE `username`="' + uname + '"'
//   var queryYS = 'SELECT `yearTerm` FROM `CurrentYearTerm` WHERE `employeeID`="admin"'
//   // var query_delete_YearSemester = 'DELETE FROM `CurrentYearTerm` WHERE `employeeID`="admin"'
//   var queryInsertYS = 'INSERT INTO `CurrentYearTerm`(`yearTerm`, `employeeID`) VALUES ("2021-1", "admin")'

//   mysql.query(queryLogin, function (error, loginInfo) {
//     if (error) {
//       console.log(error)
//     }

//     if (typeof loginInfo === "undefined" || loginInfo.length === 0) {
//       res.redirect('/pwError')
//     }
//     else if (loginInfo[0].password === user.upassword) {
//       mysql.query(queryYS, function (error, YS) {
//         if (error) {
//           console.log(error)
//         }
//         if (Array.isArray(YS) && YS.length === 0) {
//           mysql.query(queryInsertYS, function (error, YS) {
//             if (error) {
//               console.log(error)
//             }
//             req.session.ys = "2021-1"
//           })
//         }
//         else {
//           req.session.ys = YS[0].yearTerm
//         }
//         if (loginInfo[0].userType === "lecturer") {
//           res.redirect('/lecturer_homepage')
//         }
//         else if (loginInfo[0].userType === "student") {
//           res.redirect('/student_homepage')
//         }
//         else if (loginInfo[0].userType === "TA") {
//           res.redirect('/TA_homepage')
//         }
//       })
//     }
//     else {
//       res.redirect('/pwError')
//     }
//   })
// })

// router.get('/lecturer_Homepage', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var YS = req.session.ys
//   } else {
//     res.redirect('/expire')
//   }
//   var querySelect = 'SELECT * FROM `Module` WHERE `yearTerm`="' + YS + '" AND `employeeID`="' + uname + '"'
//   var queryFullName = 'SELECT `surname`, `forename` FROM `Lecturer` WHERE `employeeID`="' + uname + '"'
//   // console.log(querySelect)

//   mysql.query(querySelect, function (error, allMod) {
//     if (error) {
//       console.log(error)
//     }
//     req.session.allModules = allMod
//     var allModules = req.session.allModules
//     if (typeof allModules !== "undefined") {
//       for (var i = 1; i <= allModules.length; i++) {
//         allModules[i - 1].index = i;
//       }
//     }
//     mysql.query(queryFullName, function (error, fullName) {
//       if (error) {
//         console.log(error)
//       }
//       req.session.lFullName = fullName[0].forename + ' ' + fullName[0].surname
//       res.render('lecturer_Homepage.html', {
//         fullName: fullName,
//         uname: req.session.lFullName,
//         modules: allModules,
//         YS: req.session.ys
//       })
//     })
//   })
// })

// router.get('/lecturer_module', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var allModule = req.session.allModules
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }
//   var reqObj = req.query
//   req.session.moduleID = reqObj.moduleID
//   req.session.selectedYT = reqObj.YT
//   var selectedModuleID = req.session.moduleID

//   // query the information of the selected module
//   var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '"'

//   // query the data used in student table
//   var queryStudentAverageScore = 'SELECT studentSPR, AVG(score) avgScore FROM `StudentFeedback` ' +
//     'WHERE moduleCode = "' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY studentSPR'
//   // var queryStudentSecondLastScore2 = 'SELECT studentSPR, MAX(weekNumber)-1 mw FROM StudentFeedback WHERE `moduleCode`="'+selectedModuleID+'" AND `yearTerm`="'+selectedYT+'" ' +
//   //     'GROUP BY studentSPR '
//   var queryStudentSecondLastScore = 'SELECT studentSPR, score secondLastScore, weekNumber sWN, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM StudentFeedback ' +
//     'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND (studentSPR, weekNumber) IN ' +
//     '(SELECT studentSPR, MAX(weekNumber)-1 mw FROM StudentFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" ' +
//     'GROUP BY studentSPR) '
//   var queryStudentLastScore = 'SELECT studentSPR, score lastScore, weekNumber, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM StudentFeedback ' +
//     'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND (studentSPR, weekNumber) IN ' +
//     '(SELECT studentSPR, MAX(weekNumber) FROM StudentFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY studentSPR) '
//   var queryStudentTeamProject = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
//     'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber AND ModStuTe.moduleCode=ProjectInfo.moduleCode AND ModStuTe.yearTerm=ProjectInfo.yearTerm) '
//   var queryAllStudentTable = queryStudentTeamProject +
//     'JOIN (' + queryStudentAverageScore + ') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR)' +
//     'JOIN (' + queryStudentLastScore + ') AS stuLastScore ON (ModStuTe.studentSPR=stuLastScore.studentSPR)' +
//     'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.yearTerm="' + selectedYT + '"'
//   var queryAllStudentTableNoScore = queryStudentTeamProject +
//     'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.yearTerm="' + selectedYT + '"'
//   // query the data used in group table
//   var queryTeamMembers = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
//     'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
//     'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY ModStuTe.teamNumber '
//   var queryGroupAverageScore = 'SELECT teamNumber, AVG(score) avgScore FROM `TeamFeedback` ' +
//     'WHERE moduleCode = "' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY teamNumber '
//   var queryGroupSecondLastScore = 'SELECT teamNumber, score secondLastScore, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM TeamFeedback ' +
//     'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND (teamNumber, weekNumber) IN ' +
//     '(SELECT teamNumber, MAX(weekNumber)-1 mw FROM TeamFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" ' +
//     'GROUP BY teamNumber ) '
//   var queryGroupLastScore = 'SELECT teamNumber, score lastScore, weekNumber, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM TeamFeedback ' +
//     'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND (teamNumber, weekNumber) IN ' +
//     '(SELECT teamNumber, MAX(weekNumber) FROM TeamFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY teamNumber) '
//   var queryGroupProjectTA = 'SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
//   var queryAllGroupTable = queryGroupProjectTA +
//     ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
//     'JOIN (' + queryGroupAverageScore + ') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
//     'JOIN (' + queryGroupLastScore + ') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
//     'WHERE ProjectInfo.moduleCode="' + selectedModuleID + '" AND ProjectInfo.yearTerm="' + selectedYT + '" '
//   var queryAllGroupTableNoScore = queryGroupProjectTA +
//     ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
//     'WHERE ProjectInfo.moduleCode="' + selectedModuleID + '" AND ProjectInfo.yearTerm="' + selectedYT + '" '

//   // query the data used in student need attention table
//   var queryAttStudentTable = queryStudentTeamProject +
//     'JOIN (' + queryStudentAverageScore + ') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR) ' +
//     'JOIN (' + queryStudentLastScore + ') AS stuLastScore ON (ModStuTe.studentSPR=stuLastScore.studentSPR) ' +
//     'JOIN (' + queryStudentSecondLastScore + ') AS stuSecondLastScore ON (ModStuTe.studentSPR=stuSecondLastScore.studentSPR) ' +
//     'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.yearTerm="' + selectedYT + '" AND stuLastScore.lastScore < 2 AND stuSecondLastScore.secondLastScore < 2'

//   // query the data used in group need attention table
//   var queryAttGroupTable = queryGroupProjectTA +
//     ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
//     'JOIN (' + queryGroupAverageScore + ') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
//     'JOIN (' + queryGroupLastScore + ') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
//     'JOIN (' + queryGroupSecondLastScore + ') AS gSecondLastScore ON (ProjectInfo.teamNumber=gSecondLastScore.teamNumber) ' +
//     'WHERE ProjectInfo.moduleCode="' + selectedModuleID + '" AND ProjectInfo.yearTerm="' + selectedYT + '" AND gLastScore.lastScore < 2 AND gSecondLastScore.secondLastScore < 2 '

//   var queryStudentAttFalse = 'SELECT StudentNeedAttention.studentSPR, StudentNeedAttention.weekNumber FROM `StudentNeedAttention` JOIN ' +
//     '(SELECT StudentFeedback.studentSPR, MAX(weekNumber) weekNumber FROM StudentFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY StudentFeedback.studentSPR) AS MaxWeek ' +
//     'ON (StudentNeedAttention.studentSPR=MaxWeek.studentSPR AND StudentNeedAttention.weekNumber=MaxWeek.weekNumber) ' +
//     'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND `state`=' + false
//   // query the data used in student need attention table
//   var queryAttStudentTableFalse = queryStudentTeamProject +
//     'JOIN (' + queryStudentAverageScore + ') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR) ' +
//     'JOIN (' + queryStudentLastScore + ') AS stuLastScore ON (ModStuTe.studentSPR=stuLastScore.studentSPR) ' +
//     'JOIN (' + queryStudentSecondLastScore + ') AS stuSecondLastScore ON (ModStuTe.studentSPR=stuSecondLastScore.studentSPR) ' +
//     'JOIN (' + queryStudentAttFalse + ') AS stuAttFalse ON (ModStuTe.studentSPR=stuAttFalse.studentSPR) ' +
//     'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.yearTerm="' + selectedYT + '" AND stuLastScore.lastScore < 2 AND stuSecondLastScore.secondLastScore < 2'
//   var queryGroupAttFalse = 'SELECT TeamNeedAttention.teamNumber, TeamNeedAttention.weekNumber FROM `TeamNeedAttention` JOIN ' +
//     '(SELECT TeamFeedback.teamNumber, MAX(weekNumber) weekNumber FROM TeamFeedback WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY TeamFeedback.teamNumber) AS MaxWeek ' +
//     'ON (TeamNeedAttention.teamNumber=MaxWeek.teamNumber AND TeamNeedAttention.weekNumber=MaxWeek.weekNumber) ' +
//     'WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" AND `state`=' + false
//   var queryAttGroupTableFalse = queryGroupProjectTA +
//     ' JOIN (' + queryTeamMembers + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
//     'JOIN (' + queryGroupAverageScore + ') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
//     'JOIN (' + queryGroupLastScore + ') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
//     'JOIN (' + queryGroupSecondLastScore + ') AS gSecondLastScore ON (ProjectInfo.teamNumber=gSecondLastScore.teamNumber) ' +
//     'JOIN (' + queryGroupAttFalse + ') AS groupAttFalse ON (ProjectInfo.teamNumber=groupAttFalse.teamNumber) ' +
//     'WHERE ProjectInfo.moduleCode="' + selectedModuleID + '" AND ProjectInfo.yearTerm="' + selectedYT + '" AND gLastScore.lastScore < 2 AND gSecondLastScore.secondLastScore < 2 '




//   req.session.attStuState = []
//   mysql.query(querySelectCurrentModule, function (error, currentModule) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(queryAllStudentTable, function (error, allStuInfo) {
//       if (error) {
//         console.log(error)
//       }
//       req.session.stuScore = allStuInfo
//       mysql.query(queryAllStudentTableNoScore, function (error, allStuInfoNoScore) {
//         if (error) {
//           console.log(error)
//         }
//         if (allStuInfoNoScore.length !== req.session.stuScore.length) {
//           // console.log(TAGroups[0])
//           // console.log("*************")
//           for (var i = 0; i < allStuInfoNoScore.length; i++) {
//             for (var j = 0; j < req.session.stuScore.length; j++) {
//               if (i === 0) {
//                 req.session.stuScore[j].weekNumber = '; week' + req.session.stuScore[j].weekNumber
//               }
//               if (allStuInfoNoScore[i].teamNumber === req.session.stuScore[j].teamNumber) {
//                 allStuInfoNoScore.splice(i, 1); //利用splice函数删除元素，从第i个位置，截取长度为1的元素
//               }
//             }
//           }
//           for (var m = 0; m < allStuInfoNoScore.length; m++) {
//             // console.log(TAGroups[m])
//             // console.log("&&&&&&&&&&&")
//             allStuInfoNoScore[m].avgScore = "NA"
//             allStuInfoNoScore[m].lastScore = "NA"
//             allStuInfoNoScore[m].weekNumber = "NA"
//             req.session.stuScore.push(allStuInfoNoScore[m])
//           }
//         }
//         // console.log(allStuInfo)
//         mysql.query(queryAllGroupTable, function (error, allGroupInfo) {
//           if (error) {
//             console.log(error)
//           }
//           req.session.gScore = allGroupInfo
//           mysql.query(queryAllGroupTableNoScore, function (error, allGroupInfoNoScore) {
//             if (error) {
//               console.log(error)
//             }
//             if (allGroupInfoNoScore.length !== req.session.gScore.length) {
//               // console.log(TAGroups[0])
//               // console.log("*************")
//               for (var i = 0; i < allGroupInfoNoScore.length; i++) {
//                 for (var j = 0; j < req.session.gScore.length; j++) {
//                   if (i === 0) {
//                     req.session.gScore[j].weekNumber = '; week' + req.session.gScore[j].weekNumber
//                   }
//                   if (allGroupInfoNoScore[i].studentSPR === req.session.gScore[j].studentSPR) {
//                     allGroupInfoNoScore.splice(i, 1); //利用splice函数删除元素，从第i个位置，截取长度为1的元素
//                   }
//                 }
//               }
//               for (var m = 0; m < allGroupInfoNoScore.length; m++) {
//                 // console.log(TAGroups[m])
//                 // console.log("&&&&&&&&&&&")
//                 allGroupInfoNoScore[m].avgScore = "NA"
//                 allGroupInfoNoScore[m].lastScore = "NA"
//                 allGroupInfoNoScore[m].weekNumber = "NA"
//                 req.session.gScore.push(allGroupInfoNoScore[m])
//               }
//             }
//             mysql.query(queryAttStudentTable, function (error, attStuInfo) {
//               if (error) {
//                 console.log(error)
//               }
//               if (typeof attStuInfo !== 'undefined') {
//                 for (var i = 0; i < attStuInfo.length; i++) {
//                   attStuInfo[i].index = i + 1
//                   var queryInsertAttStudent = 'INSERT INTO `StudentNeedAttention` (`studentSPR`, `moduleCode`, `yearTerm`, `weekNumber`, `state`) ' +
//                     'SELECT "' + attStuInfo[i].studentSPR + '","' + req.session.moduleID + '","' + req.session.ys + '","' + attStuInfo[i].weekNumber + '", ' + false + ' ' +
//                     'FROM DUAL WHERE NOT EXISTS (SELECT `studentSPR`, `moduleCode`, `yearTerm`, `weekNumber` FROM `studentNeedAttention` ' +
//                     'WHERE `studentSPR`="' + attStuInfo[i].studentSPR + '" AND `moduleCode`="' + req.session.moduleID + '" ' +
//                     'AND `yearTerm`="' + req.session.ys + '" AND `weekNumber`="' + attStuInfo[i].weekNumber + '")'
//                   mysql.query(queryInsertAttStudent, function (error, result) {
//                     if (error) {
//                       console.log(error)
//                     }
//                   })
//                 }
//               }
//               // console.log(attStuInfo)
//               mysql.query(queryAttStudentTableFalse, function (error, attStuInfoFalse) {
//                 if (error) {
//                   console.log(error)
//                 }
//                 // console.log(attStuInfoFalse)
//                 mysql.query(queryAttGroupTable, function (error, attGroupInfo) {
//                   if (error) {
//                     console.log(error)
//                   }
//                   if (typeof attGroupInfo !== 'undefined') {
//                     for (i = 0; i < attGroupInfo.length; i++) {
//                       attGroupInfo[i].index = i + 1
//                       var queryInsertAttGroup = 'INSERT INTO `TeamNeedAttention` (`teamNumber`, `moduleCode`, `yearTerm`, `weekNumber`, `state`) ' +
//                         'SELECT "' + attGroupInfo[i].teamNumber + '","' + req.session.moduleID + '","' + req.session.ys + '","' + attGroupInfo[i].weekNumber + '", ' + false + ' ' +
//                         'FROM DUAL WHERE NOT EXISTS (SELECT `teamNumber`, `moduleCode`, `yearTerm`, `weekNumber` FROM `TeamNeedAttention` ' +
//                         'WHERE `teamNumber`="' + attGroupInfo[i].teamNumber + '" AND `moduleCode`="' + req.session.moduleID + '" ' +
//                         'AND `yearTerm`="' + req.session.ys + '" AND `weekNumber`="' + attGroupInfo[i].weekNumber + '")'
//                       mysql.query(queryInsertAttGroup, function (error, result) {
//                         if (error) {
//                           console.log(error)
//                         }
//                       })
//                     }
//                   }
//                   // console.log(attGroupInfo)
//                   mysql.query(queryAttGroupTableFalse, function (error, attGroupInfoFalse) {
//                     if (error) {
//                       console.log(error)
//                     }
//                     // console.log(attGroupInfoFalse)
//                     res.render('lecturer_module.html', {
//                       uname: req.session.lFullName,
//                       modules: allModule,
//                       module: currentModule[0],
//                       allStudents: req.session.stuScore,
//                       allGroups: req.session.gScore,
//                       attStudents: attStuInfoFalse,
//                       attGroups: attGroupInfoFalse,
//                       YS: req.session.ys
//                     })
//                   })
//                 })
//               })
//             })
//           })
//         })
//       })
//     })
//   })
// })

// router.get('/lecturer_delete_att_stu', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var allModules = req.session.allModules
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }

//   var reqObj = req.query
//   var studnentSPR = reqObj.student
//   var moduleID = reqObj.moduleID
//   var YS = reqObj.YT
//   var week = reqObj.week

//   var querySetAttStudentTrue = 'UPDATE `StudentNeedAttention` SET `state`=' + true +
//     ' WHERE `studentSPR`="' + studnentSPR + '" AND `moduleCode`="' + moduleID + '" AND `yearTerm`="' + YS + '" AND `weekNumber`="' + week + '"'

//   mysql.query(querySetAttStudentTrue, function (error, result) {
//     if (error) {
//       console.log(error)
//     }
//   })
//   res.redirect("/lecturer_module?moduleID=" + moduleID)
// })

// router.get('/lecturer_delete_att_group', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var allModules = req.session.allModules
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }

//   var reqObj = req.query
//   var team = reqObj.team
//   var moduleID = reqObj.moduleID
//   var YS = reqObj.YT
//   var week = reqObj.week

//   var querySetAttGroupTrue = 'UPDATE `TeamNeedAttention` SET `state`=' + true +
//     ' WHERE `teamNumber`="' + team + '" AND `moduleCode`="' + moduleID + '" AND `yearTerm`="' + YS + '" AND `weekNumber`="' + week + '"'

//   mysql.query(querySetAttGroupTrue, function (error, result) {
//     if (error) {
//       console.log(error)
//     }
//   })
//   res.redirect("/lecturer_module?moduleID=" + moduleID)
// })

// router.get('/lecturer_group', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var allModules = req.session.allModules
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }

//   var reqObj = req.query
//   req.session.teamNumber = reqObj.teamNumber
//   var teamNumber = req.session.teamNumber
//   var selectedModuleID = req.session.moduleID

//   // query the information of the selected module
//   var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '"'
//   // query team members
//   var queryTeamSMembers = 'SELECT Student.surname, Student.forename, ModStuTe.memberIndex, fileLocation FROM `Student` JOIN `ModStuTe` ' +
//     'ON ModStuTe.studentSPR=Student.studentSPR ' +
//     'WHERE ModStuTe.teamNumber="' + teamNumber + '" AND `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" '
//   // query team feedback and personal contributions
//   var queryContribution = 'SELECT weekNumber WN, group_concat(contribution Separator "%, ") contributions FROM `StudentFeedback` ' +
//     'JOIN `ModStuTe` ON (ModStuTe.studentSPR=StudentFeedback.studentSPR AND ModStuTe.moduleCode=StudentFeedback.moduleCode AND ModStuTe.yearTerm=StudentFeedback.yearTerm) ' +
//     'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND teamNumber="' + teamNumber + '" AND StudentFeedback.yearTerm="' + selectedYT + '" GROUP BY weekNumber'
//   var queryTeamFeedback = 'SELECT weekNumber, score, contributions, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date ' +
//     'FROM `TeamFeedback` JOIN (' + queryContribution + ') AS Con ON TeamFeedback.weekNumber=WN ' +
//     'WHERE teamNumber="' + teamNumber + '" AND `moduleCode`="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '"'
//   // This query select all student feedback information for a given group in a module
//   var queryStudentFeedback = 'SELECT concat(Student.surname, " ", Student.forename) studentName, ' +
//     'StudentFeedback.weekNumber,StudentFeedback.score, StudentFeedback.contribution, StudentFeedback.writtenFeedback ' +
//     'FROM `student` JOIN `StudentFeedback` ON student.studentSPR=StudentFeedback.studentSPR ' +
//     'JOIN `ModStuTe` ON (StudentFeedback.studentSPR=ModStuTe.studentSPR AND StudentFeedback.moduleCode=ModStuTe.moduleCode AND StudentFeedback.yearTerm=ModStuTe.yearTerm)' +
//     'WHERE ModStuTe.teamNumber = "' + teamNumber + '" AND StudentFeedback.moduleCode = "' + selectedModuleID + '" AND ModStuTe.yearTerm="' + selectedYT + '"'


//   mysql.query(querySelectCurrentModule, function (error, currentModule) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(queryTeamSMembers, function (error, teamMembers) {
//       if (error) {
//         console.log(error)
//       }
//       req.session.teamMember = 0
//       for (var i = 0; i < teamMembers.length; i++) {
//         // console.log(teamMembers[i].fileLocation)
//         fs.exists("./public/images/" + teamMembers[i].fileLocation, (exists) => {
//           if (exists === false) {
//             teamMembers[req.session.teamMember].fileLocation = "/public/images/profile_default.jpeg"
//             req.session.teamMember++
//             // console.log(req.session.teamMember)
//           }
//           else {
//             if (teamMembers[req.session.teamMember].fileLocation === '') {
//               teamMembers[req.session.teamMember].fileLocation = "/public/images/profile_default.jpeg"
//             }
//             else {
//               teamMembers[req.session.teamMember].fileLocation = "/public/images/" + teamMembers[req.session.teamMember].fileLocation
//             }
//             req.session.teamMember++
//           }
//         });
//       }
//       mysql.query(queryTeamFeedback, function (error, teamFeedback) {
//         if (error) {
//           console.log(error)
//         }
//         if (teamFeedback.length === 0) {
//           res.render('lecturer_group.html', {
//             uname: req.session.lFullName,
//             teamNumber: teamNumber,
//             modules: allModules,
//             module: currentModule[0],
//             member: teamMembers,
//             feedback: {},
//             YS: req.session.ys,
//             // group: group[0],
//             // feedback: feedback,
//             weeklyFeedback: {}
//           })
//         }
//         // console.log(teamFeedback)
//         else {
//           mysql.query(queryStudentFeedback, function (error, Student) {
//             if (error) {
//               console.log(error)
//             }
//             var memberNum = 0
//             var weeklyFeedback = new Array()
//             // console.log(typeof Student)
//             loop:
//             for (var weekNum = 1; weekNum < 21; weekNum++) {
//               if (weekNum > teamFeedback.length) {
//                 break
//               }
//               weeklyFeedback[weekNum - 1] = new Array()
//               for (const teamF of teamFeedback) {
//                 if (typeof (teamF) === "undefined") {
//                   break loop
//                 }
//                 if (parseInt(teamF.weekNumber) === weekNum) {
//                   weeklyFeedback[weekNum - 1].push(teamNumber);
//                   weeklyFeedback[weekNum - 1].push(teamF.weekNumber);
//                   weeklyFeedback[weekNum - 1].push(teamF.score);
//                   weeklyFeedback[weekNum - 1].push(teamF.writtenFeedback);
//                   weeklyFeedback[weekNum - 1].push(teamF.messageLecture);
//                   break
//                 }
//               }
//               if (weeklyFeedback[weekNum - 1].length === 0) {
//                 weeklyFeedback[weekNum - 1] = null
//                 break
//               }
//               for (const stuF of Student) {
//                 if (typeof (stuF) === "undefined") {
//                   break loop
//                 }
//                 if (parseInt(stuF.weekNumber) === weekNum) {
//                   memberNum++
//                   weeklyFeedback[weekNum - 1].push(stuF.studentName);
//                   weeklyFeedback[weekNum - 1].push(stuF.score);
//                   weeklyFeedback[weekNum - 1].push(stuF.contribution);
//                   weeklyFeedback[weekNum - 1].push(stuF.writtenFeedback);
//                 }
//                 // console.log(FeedbackByWeek[weekNum-1].length)
//               }
//               weeklyFeedback[weekNum - 1].splice(5, 0, memberNum)
//               memberNum = 0
//             }
//             res.render('lecturer_group.html', {
//               uname: req.session.lFullName,
//               teamNumber: teamNumber,
//               modules: allModules,
//               module: currentModule[0],
//               member: teamMembers,
//               feedback: teamFeedback,
//               YS: req.session.ys,
//               // group: group[0],
//               // feedback: feedback,
//               weeklyFeedback: weeklyFeedback
//             })
//           })
//         }
//       })
//     })
//   })
// })

// router.get('/lecturer_student', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var allModules = req.session.allModules
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }

//   var reqObj = req.query
//   req.session.studentID = reqObj.studentID
//   var studentSPR = req.session.studentID
//   var selectedModuleID = req.session.moduleID
//   req.session.student = 0
//   console.log(studentSPR)
//   // query the information of the selected module
//   var querySelectCurrentModule = 'SELECT * FROM Module WHERE `moduleCode`="' + selectedModuleID + '"'

//   // query the information of the selected student
//   var queryStudentAverageScore = 'SELECT studentSPR, FORMAT(AVG(score),1) avgScore FROM `StudentFeedback` ' +
//     'WHERE moduleCode = "' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '" GROUP BY studentSPR'
//   var queryStudentTeamProject = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
//     'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber and ModStuTe.moduleCode=ProjectInfo.moduleCode) '
//   var queryStudentTeamProjectNoScore = 'SELECT * FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
//     'JOIN `ProjectInfo` ON (ModStuTe.teamNumber=ProjectInfo.teamNumber and ModStuTe.moduleCode=ProjectInfo.moduleCode) ' +
//     'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.studentSPR="' + studentSPR + '" AND ModStuTe.yearTerm="' + selectedYT + '" '
//   var querySelectStudent = queryStudentTeamProject +
//     'JOIN (' + queryStudentAverageScore + ') AS stuAvgScore ON (ModStuTe.studentSPR=stuAvgScore.studentSPR) ' +
//     'WHERE ModStuTe.moduleCode="' + selectedModuleID + '" AND ModStuTe.studentSPR="' + studentSPR + '" AND ModStuTe.yearTerm="' + selectedYT + '"'

//   // query the feedback of the selected student
//   var queryStudentFeedback = 'SELECT weekNumber, score, contribution, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date FROM studentFeedback ' +
//     'WHERE studentSPR="' + studentSPR + '" AND moduleCode="' + selectedModuleID + '" AND `yearTerm`="' + selectedYT + '"'

//   mysql.query(querySelectCurrentModule, function (error, currentModule) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(querySelectStudent, function (error, student) {
//       if (error) {
//         console.log(error)
//       }
//       console.log(student.length)
//       // for (var i = 0; i < student.length; i++) {
//       //     // console.log(teamMembers[i].fileLocation)

//       // }
//       if (student.length === 0) {
//         mysql.query(queryStudentTeamProjectNoScore, function (error, student) {
//           if (error) {
//             console.log(error)
//           }
//           fs.exists("./public/images/" + student[0].fileLocation, (exists) => {
//             if (exists === false) {
//               student[0].fileLocation = "/public/images/profile_default.jpeg"
//               // console.log("**************")
//             }
//             else {
//               if (student[0].fileLocation === '') {
//                 student[0].fileLocation = "/public/images/profile_default.jpeg"
//                 // console.log("&&&&&&&&&&&&")
//               }
//               else {
//                 student[0].fileLocation = "/public/images/" + student[0].fileLocation
//                 // console.log("$$$$$$$$$$$$$$$$")
//                 // console.log(student[0].fileLocation)
//               }
//             }
//             res.render('lecturer_student.html', {
//               uname: req.session.lFullName,
//               modules: allModules,
//               module: currentModule[0],
//               student: student[0],
//               feedback: feedback,
//               YS: req.session.ys
//             })
//           });
//           var feedback = {}
//           // console.log(student_s)
//           // fs.exists("/public/images/"+student[req.session.indexation].fileLocation, (exists) => {
//           //     if (exists === false) {
//           //         student[req.session.indexation].fileLocation = "/public/images/profile_default.jpeg"
//           //     }
//           //     else {
//           //         if(student[req.session.indexation].fileLocation.length === 0 || student[req.session.indexation].fileLocation === "undefined" ||
//           //             typeof student[req.session.indexation].fileLocation === "undefined") {
//           //             // console.log("**"+student[0].fileLocation)
//           //             student[req.session.indexation].fileLocation = "/public/images/profile_default.jpeg"
//           //         }
//           //         else {
//           //             student[req.session.indexation].fileLocation = "/public/images/" + student[req.session.indexation].fileLocation
//           //         }
//           //     }
//           // });
//         })
//       }
//       else {
//         fs.exists("./public/images/" + student[0].fileLocation, (exists) => {
//           if (exists === false) {
//             student[0].fileLocation = "/public/images/profile_default.jpeg"
//             // console.log(req.session.teamMember)
//           }
//           else {
//             if (student[0].fileLocation === '') {
//               student[0].fileLocation = "/public/images/profile_default.jpeg"
//             }
//             else {
//               student[0].fileLocation = "/public/images/" + student[0].fileLocation
//             }
//           }
//           mysql.query(queryStudentFeedback, function (error, feedback) {
//             if (error) {
//               console.log(error)
//             }
//             res.render('lecturer_student.html', {
//               uname: req.session.lFullName,
//               modules: allModules,
//               module: currentModule[0],
//               student: student[0],
//               feedback: feedback,
//               YS: req.session.ys
//             })
//           })
//         });
//       }
//     })
//   })
// })

// router.post('/lecturer_addModule', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }
//   var add = req.body


//   /* 生成multiparty对象，并配置上传目标路径 */
//   var form = new multiparty.Form();
//   /* 设置编辑 */
//   form.encoding = 'utf-8';
//   //设置文件存储路劲
//   form.uploadDir = './public/upload_files';
//   //设置文件大小限制
//   form.maxFilesSize = 10 * 1024 * 1024;
//   // form.maxFields = 1000;   //设置所有文件的大小总和//上传后处理
//   form.parse(req, function (err, fields, files) {
//     var filesTemp = JSON.stringify(files, null, 2);
//     if (err) {
//       console.log('parse error:' + err);
//     }
//     else {
//       console.log('parse files:' + filesTemp);

//       //process cover page
//       var img_dstPath = ''
//       if (files.coverImage[0].originalFilename === '') {
//         img_dstPath = "/public/images/default_cover.jpg"
//       } else {
//         var inputFile = files.coverImage[0];
//         var uploadedPath = inputFile.path
//         img_dstPath = './public/images/' + fields.modID + '.jpg';
//         //重命名为真实文件名
//         fs.rename(uploadedPath, img_dstPath, function (err) {
//           if (err) {
//             console.log('rename error:' + err);
//           } else {
//             console.log('rename cover page ok');
//           }
//         })
//         // console.log("img:" + img_dstPath)
//       }
//       req.session.img_dstPath = img_dstPath

//       //process student profiles
//       for (var i = 0; i < files.stuImage.length; i++) {
//         var inputFileProfile = files.stuImage[i];
//         var uploadedPathProfile = inputFileProfile.path
//         var img_dstPath_profile = './public/images/' + inputFileProfile.originalFilename.split('/')[1];
//         fs.rename(uploadedPathProfile, img_dstPath_profile, function (err) {
//           if (err) {
//             console.log('rename error:' + err);
//           } else {
//             console.log('rename profile ok');
//           }
//         })
//       }

//       // process TA csv and insert into database
//       var inputFileTA = files.taTable[0];
//       var uploadedPathTA = inputFileTA.path;
//       var csv_dstPath_ta = './public/table/' + fields.modID + '_ta.xlsx';
//       fs.rename(uploadedPathTA, csv_dstPath_ta, function (err) {
//         if (err) {
//           console.log('rename error:' + err);
//         } else {
//           console.log('rename TA csv ok');
//         }
//         // console.log(groupPath)
//         var taSheetList = xlsx.parse(csv_dstPath_ta)
//         var taData = taSheetList[0].data

//         //calculate how many members in one team and the members' columns in the table
//         var taHeader = taData[0]
//         var length = 0
//         for (var l = 1; l < taData.length; l++) {
//           // console.log(taData[l])
//           if (taData[l].length !== 0) {
//             length++
//           }
//         }
//         // console.log(length)
//         // Insert into TA table
//         if (taHeader[0] === "taEmailAccount") {
//           for (var i = 1; i <= length; i++) {
//             var queryInsertTAStuTe = 'INSERT INTO `TA` (`taStudentSPR`, `surname`, `forename`, ' +
//               '`email`, `degree`) ' +
//               'SELECT "' + taData[i][0] + '", "' + taData[i][1] + '", "' + taData[i][2] + '", "' + taData[i][3] + '", "' + taData[i][4] + '" ' +
//               'FROM DUAL WHERE NOT EXISTS (SELECT `taStudentSPR` FROM `TA` WHERE `taStudentSPR`="' + taData[i][0] + '")'
//             mysql.query(queryInsertTAStuTe, function (error, results) {
//               if (error) {
//                 console.log(error)
//               }
//             })
//           }
//         }
//       })

//       // process student csv and insert into database
//       var inputFileStudent = files.studentTable[0];
//       var uploadedPathStudent = inputFileStudent.path;
//       var csv_dstPath_student = './public/table/' + fields.modID + '_student.xlsx';
//       fs.rename(uploadedPathStudent, csv_dstPath_student, function (err) {
//         if (err) {
//           console.log('rename error:' + err);
//         } else {
//           console.log('rename student csv ok');
//         }
//         // console.log(groupPath)
//         var studentSheetList = xlsx.parse(csv_dstPath_student)
//         var studentData = studentSheetList[0].data

//         //calculate how many members in one team and the members' columns in the table
//         var studentHeader = studentData[0]
//         var length = 0
//         for (var l = 1; l < studentData.length; l++) {
//           // console.log(studentData[l])
//           if (studentData[l].length !== 0) {
//             length++
//           }
//         }
//         // console.log(length)

//         // Insert into Student table
//         if (studentHeader[0] === "studentEmailAccount") {
//           for (var i = 1; i <= length; i++) {
//             var queryInsertStudentStuTe = 'INSERT INTO `Student` (`studentSPR`, `studentNumber`, ' +
//               '`surname`, `forename`, `email`, `fileLocation`) ' +
//               'SELECT "' + studentData[i][0] + '", "' + studentData[i][1] + '", "' + studentData[i][2] + '", "' + studentData[i][3] + '", "' + studentData[i][4] + '", "' + studentData[i][5] + '" ' +
//               'FROM DUAL WHERE NOT EXISTS (SELECT `studentSPR` FROM `Student` WHERE `studentSPR`="' + studentData[i][0] + '")'
//             mysql.query(queryInsertStudentStuTe, function (error, results) {
//               if (error) {
//                 console.log(error)
//               }
//             })
//           }
//         }
//       })

//       // process grouping csv and insert into database
//       var inputFileGrouping = files.groupingTable[0];
//       var uploadedPathGrouping = inputFileGrouping.path;
//       var csv_dstPath_grouping = './public/table/' + fields.modID + '_grouping.xlsx';
//       fs.rename(uploadedPathGrouping, csv_dstPath_grouping, function (err) {
//         if (err) {
//           console.log('rename error:' + err);
//         } else {
//           console.log('rename grouping csv ok');
//         }
//         // console.log(groupPath)
//         var groupingSheetList = xlsx.parse(csv_dstPath_grouping)
//         var groupingData = groupingSheetList[0].data

//         //calculate how many members in one team and the members' columns in the table
//         var groupingHeader = groupingData[0]
//         var membersInTeam = 0
//         var indexArray = []
//         for (var n = 0; n < groupingHeader.length; n++) {
//           if (groupingHeader[n].indexOf("member") != -1) {
//             indexArray[membersInTeam] = n
//             membersInTeam += 1
//           }
//         }
//         // console.log(groupingData.length)
//         // console.log(groupingData[4].length,groupingData[5].length)
//         var length = 0
//         for (var l = 1; l < groupingData.length; l++) {
//           if (groupingData[l].length !== 0) {
//             length++
//           }
//         }
//         // console.log(length)

//         // Insert into Module table
//         var queryInsertModule = 'INSERT INTO `Module`(`moduleCode`, `yearTerm`, `numberofWeeks`, `moduleName`, `moduleDescription`, `modulePlan`, `imgPath`, `employeeID`) ' +
//           'VALUES ("' + fields.modID + '", "' + fields.modYs[0].split(",")[0] + '", "' + fields.NoW[0].split(",")[0] + '", "' + fields.modName[0].split(",")[0] + '", "' + fields.modDes[0].split(",")[0] + '", "' + fields.modPlan[0].split(",")[0] + '", "' + req.session.img_dstPath + '", "' + uname + '")'
//         mysql.query(queryInsertModule, function (error, results) {
//           if (error) {
//             console.log(error)
//           }
//           // console.log("queryInsertModule")
//         })

//         // Insert into ModStuTe table
//         for (var i = 1; i <= length; i++) {
//           for (var j = 0; j < membersInTeam; j++) {
//             if (typeof groupingData[i][indexArray[j]] !== "undefined") {
//               var queryInsertModStuTe = 'INSERT INTO `ModStuTe`(`studentSPR`, `moduleCode`, `yearTerm`, `teamNumber`, `memberIndex`) ' +
//                 'VALUES ("' + groupingData[i][indexArray[j]] + '", "' + fields.modID + '", "' + fields.modYs[0].split(",")[0] + '", "' + groupingData[i][0] + '", "' + (j + 1) + '")'
//               mysql.query(queryInsertModStuTe, function (error, results) {
//                 if (error) {
//                   console.log(error)
//                 }
//                 // console.log("queryInsertModStuTe")
//               })
//             }
//           }
//         }

//         // Insert into ProjectInfo table
//         for (i = 1; i <= length; i++) {
//           var queryInsertProjectInfo = 'INSERT INTO `ProjectInfo`(`moduleCode`, `yearTerm`, `teamNumber`, `taStudentSPR`, `labCode`, `projectTitle`, `projectBrief`) ' +
//             'VALUES ("' + fields.modID + '", "' + fields.modYs[0].split(",")[0] + '", "' + groupingData[i][0] + '", "' + groupingData[i][3] + '", "" , "' + groupingData[i][1] + '", "' + groupingData[i][2] + '")'
//           mysql.query(queryInsertProjectInfo, function (error, results) {
//             if (error) {
//               console.log(error)
//             }
//             // console.log("queryInsertProjectInfo")
//           })
//         }

//         res.redirect('/lecturer_homepage')
//       })
//     }
//   })

//   // form.parse(req, function(err, fields, files) {
//   //     var filesTemp = JSON.stringify(files, null, 2);
//   //     if(err) {
//   //         console.log('parse error:' + err);
//   //     }else {
//   //         console.log('parse files:' + filesTemp);


//   // console.log("csv:"+csv_dstPath)
//   // console.log("img:" + req.session.img_dstPath)
//   // console.log(fields)

//   // res.writeHead(200, {'content-type': 'text/plain;charset=utf-8'});
//   // res.write('received upload:\n\n');
//   // res.end(util.inspect({fields: fields, files: filesTemp}))
//   //     }
//   // })
// })

// router.post('/lecturer_modifyModule', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }

//   var queryUpdateModule = ''
//   /* 生成multiparty对象，并配置上传目标路径 */
//   var form = new multiparty.Form();
//   /* 设置编辑 */
//   form.encoding = 'utf-8';
//   //设置文件存储路劲
//   form.uploadDir = './public/images';
//   //设置文件大小限制
//   form.maxFilesSize = 10 * 1024 * 1024;
//   // form.maxFields = 1000;   //设置所有文件的大小总和//上传后处理
//   form.parse(req, function (err, fields, files) {
//     var filesTemp = JSON.stringify(files, null, 2);
//     if (err) {
//       console.log('parse error:' + err);
//     }
//     else {
//       console.log('parse files:' + filesTemp);
//       var img_dstPath = ''
//       if (files.coverImage[0].originalFilename === '') {
//         queryUpdateModule = 'UPDATE `Module` SET `moduleName`="' + fields.modName + '", `numberofWeeks`="' + fields.NoW + '",`moduleDescription`="' + fields.modDes + '", ' +
//           '`modulePlan`="' + fields.modPlan + '" WHERE `moduleCode`="' + fields.modID + '" AND `yearTerm`="' + selectedYT + '"'
//       } else {
//         inputFile = files.coverImage[0];
//         uploadedPath = inputFile.path;
//         img_dstPath = './public/images/' + fields.modID + ".jpg";
//         //重命名为真实文件名
//         fs.rename(uploadedPath, img_dstPath, function (err) {
//           if (err) {
//             console.log('rename error:' + err);
//           } else {
//             console.log('rename ok');
//           }
//         })
//         req.session.img_dstPath = img_dstPath
//         queryUpdateModule = 'UPDATE `Module` SET `moduleName`="' + fields.modName + '", `numberofWeeks`="' + fields.NoW + '",`moduleDescription`="' + fields.modDes + '", ' +
//           '`modulePlan`="' + fields.modPlan + '", `imgPath`="' + req.session.img_dstPath + '" WHERE `moduleCode`="' + fields.modID + '" AND `yearTerm`="' + selectedYT + '"'
//         // console.log("img:" + img_dstPath)
//       }
//       // Update Module table
//       mysql.query(queryUpdateModule, function (error, results) {
//         if (error) {
//           console.log(error)
//         }
//       })
//     }
//   })

//   form.uploadDir = './public/table';
//   form.parse(req, function (err, fields, files) {
//     var filesTemp = JSON.stringify(files, null, 2);
//     if (err) {
//       console.log('parse error:' + err);
//     } else {
//       console.log('parse files:' + filesTemp);

//       // console.log(files.groupingTable[0].originalFilename === '')
//       // console.log(files.groupingTable[0].originalFilename)
//       if (files.groupingTable[0].originalFilename !== '') {
//         var inputFile = files.groupingTable[0];
//         var uploadedPath = inputFile.path;
//         var dstPath = './public/table/' + inputFile.originalFilename;
//         //重命名为真实文件名
//         fs.rename(uploadedPath, dstPath, function (err) {
//           if (err) {
//             console.log('rename error:' + err);
//           } else {
//             console.log('rename ok');
//           }
//         })

//         // res.writeHead(200, {'content-type': 'text/plain;charset=utf-8'});
//         // res.write('received upload:\n\n');
//         // res.end(util.inspect({fields: fields, files: filesTemp}))

//         var groupPath = './public/table/' + inputFile.originalFilename;
//         var groupingSheetList = xlsx.parse(groupPath)
//         var groupingData = groupingSheetList[0].data


//         // calculate how many members in one team and the members' columns in the table
//         var groupingHeader = groupingData[0]
//         var membersInTeam = 0
//         var indexArray = []
//         for (var n = 0; n < groupingHeader.length; n++) {
//           if (groupingHeader[n].indexOf("member") != -1) {
//             indexArray[membersInTeam] = n
//             membersInTeam += 1
//           }
//         }

//         var length = 0
//         for (var l = 1; l < groupingData.length; l++) {
//           if (groupingData[l].length !== 0) {
//             length++
//           }
//         }

//         // Delete & insert ProjectInfo table
//         var queryDeleteProjectInfo = 'DELETE FROM `ProjectInfo` WHERE `moduleCode`="' + fields.modID + '" AND `yearTerm`="' + selectedYT + '"'
//         mysql.query(queryDeleteProjectInfo, function (error, results) {
//           if (error) {
//             console.log(error)
//           }
//         })
//         for (var i = 1; i < length; i++) {
//           var queryInsertProjectInfo = 'INSERT INTO `ProjectInfo` (`moduleCode`, `yearTerm`, `teamNumber`, `taStudentSPR`, `labCode`, `projectTitle`, `projectBrief`) ' +
//             'VALUES ("' + fields.modID + '", "' + selectedYT + '", "' + groupingData[i][0] + '", "' + groupingData[i][3] + '", "" , "' + groupingData[i][1] + '", "' + groupingData[i][2] + '")'
//           mysql.query(queryInsertProjectInfo, function (error, results) {
//             if (error) {
//               console.log(error)
//             }
//           })
//         }

//         // Delete & insert ModStuTe table
//         var queryDeleteModStuTe = 'DELETE FROM `ModStuTe` WHERE `moduleCode`="' + fields.modID + '" AND `yearTerm`="' + selectedYT + '"'
//         mysql.query(queryDeleteModStuTe, function (error, results) {
//           if (error) {
//             console.log(error)
//           }
//         })
//         for (i = 1; i < length; i++) {
//           for (var j = 0; j < membersInTeam; j++) {
//             var queryInsertModStuTe = 'INSERT INTO `ModStuTe`(`studentSPR`, `moduleCode`, `yearTerm`, `teamNumber`, `memberIndex`) ' +
//               'VALUES ("' + groupingData[i][indexArray[j]] + '", "' + fields.modID + '", "' + selectedYT + '", "' + groupingData[i][0] + '", "' + (j + 1) + '")'
//             mysql.query(queryInsertModStuTe, function (error, results) {
//               if (error) {
//                 console.log(error)
//               }
//             })
//           }
//         }
//       }

//       res.redirect('lecturer_admin')
//     }
//   })
// })

// router.get('/lecturer_delete_module', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }

//   module = req.query.module


//   var queryDeleteModule = 'DELETE FROM `Module` WHERE `moduleCode`="' + module + '" AND `yearTerm`="' + selectedYT + '"'
//   mysql.query(queryDeleteModule, function (error, results) {
//     if (error) {
//       console.log(error)
//     }
//   })

//   // Delete ProjectInfo table
//   var queryDeleteProjectInfo = 'DELETE FROM `ProjectInfo` WHERE `moduleCode`="' + module + '" AND `yearTerm`="' + selectedYT + '"'
//   mysql.query(queryDeleteProjectInfo, function (error, results) {
//     if (error) {
//       console.log(error)
//     }
//   })

//   // Delete ModStuTe table
//   var queryDeleteModStuTe = 'DELETE FROM `ModStuTe` WHERE `moduleCode`="' + module + '" AND `yearTerm`="' + selectedYT + '"'
//   mysql.query(queryDeleteModStuTe, function (error, results) {
//     if (error) {
//       console.log(error)
//     }
//   })

//   // Delete StudentFeedback table
//   var queryDeleteStudentFeedback = 'DELETE FROM `StudentFeedback` WHERE `moduleCode`="' + module + '" AND `yearTerm`="' + selectedYT + '"'
//   mysql.query(queryDeleteStudentFeedback, function (error, results) {
//     if (error) {
//       console.log(error)
//     }
//   })

//   // Delete TeamFeedback table
//   var queryDeleteTeamFeedback = 'DELETE FROM `TeamFeedback` WHERE `moduleCode`="' + module + '" AND `yearTerm`="' + selectedYT + '"'
//   mysql.query(queryDeleteTeamFeedback, function (error, results) {
//     if (error) {
//       console.log(error)
//     }
//   })

//   res.redirect('lecturer_admin')
// })

// router.get('/lecturer_setYS', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//   } else {
//     res.redirect('/login')
//   }

//   req.session.y_s = req.query.YS
//   // console.log(req.query.YS)

//   var query_delete_YearSemester = 'DELETE FROM `CurrentYearTerm` WHERE `employeeID`="' + uname + '"'
//   var query_setYearSemester = 'INSERT INTO `CurrentYearTerm`(`yearTerm`, `employeeID`) VALUES ("' + req.session.y_s + '", "' + uname + '")'
//   var queryYS = 'SELECT `yearTerm` FROM `CurrentYearTerm` WHERE `employeeID`="' + uname + '"'
//   // console.log(query_setYearSemester)
//   mysql.query(query_delete_YearSemester, function (error, results) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(query_setYearSemester, function (error, results) {
//       if (error) {
//         console.log(error)
//       }
//       mysql.query(queryYS, function (error, YS) {
//         if (error) {
//           console.log(error)
//         }
//         req.session.ys = YS[0].yearTerm
//         res.redirect('/lecturer_homepage')
//       })
//     })
//   })
// })

// router.get('/lecturer_exportCsv', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }
//   // console.log(req.session.ys)
//   var module = req.query.module
//   // console.log(module)
//   fs.exists('./module_database_csv', (exists) => {
//     if (exists === false) {
//       fs.mkdir('module_database_csv', (err) => {
//         if (err) return console.log(err, '--->mkdir<---')
//       })
//     }
//   });


//   var queryStudentScore = 'SELECT studentSPR, score, writtenFeedback, contribution, weekNumber FROM `StudentFeedback` ' +
//     'WHERE moduleCode = "' + module + '" AND yearTerm="' + selectedYT + '"'
//   var queryStudentTeamProject = 'SELECT Student.studentSPR, surname, forename, email, weekNumber, score, contribution, writtenFeedback ' +
//     'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR '
//   var queryStudentFeedback = queryStudentTeamProject +
//     'JOIN (' + queryStudentScore + ') AS stuScore ON (ModStuTe.studentSPR=stuScore.studentSPR)' +
//     'WHERE ModStuTe.moduleCode="' + module + '" AND ModStuTe.yearTerm="' + selectedYT + '"'
//   var queryTeamFeedback = 'SELECT TeamFeedback.teamNumber, projectTitle, weekNumber, score, writtenFeedback ' +
//     'FROM `TeamFeedback` JOIN `ProjectInfo` ON TeamFeedback.moduleCode=ProjectInfo.moduleCode AND TeamFeedback.teamNumber=ProjectInfo.teamNumber ' +
//     'AND TeamFeedback.yearTerm=ProjectInfo.yearTerm ' +
//     'WHERE TeamFeedback.moduleCode="' + module + '" AND TeamFeedback.yearTerm="' + selectedYT + '"'

//   fs.exists('./module_database_csv/' + module + '.csv', (exists) => {
//     if (exists === true) {
//       fs.unlink('./module_database_csv/' + module + '.csv', err => {
//         if (err) {
//           console.log(err);
//         }
//       })
//     }
//   });

//   mysql.query(queryStudentFeedback, function (error, StudentFeedback) {
//     if (error) {
//       console.log(error)
//     }
//     // console.log(StudentFeedback)
//     if (StudentFeedback.length === 0) {
//       StudentFeedback.noStudentFeedback = "No student feedback exists for this course. "
//     }
//     const csv = new objToCsv(StudentFeedback)
//     csv.toDisk('./module_database_csv/' + module + '_' + selectedYT + '.csv')

//     mysql.query(queryTeamFeedback, function (error, TeamFeedback) {
//       if (error) {
//         console.log(error)
//       }
//       // console.log(TeamFeedback)
//       if (TeamFeedback.length === 0) {
//         TeamFeedback.noTeamFeedback = "No team feedback exists for this course. "
//       }
//       const csv = new objToCsv(TeamFeedback)
//       csv.toDisk('./module_database_csv/' + module + '_' + selectedYT + '.csv', { routerend: true })
//       res.redirect('lecturer_download_csv?module=' + module)
//     })
//   })
//   //
//   // // console.log(req.session.export_module)
//   // // console.log("***************")
//   // // console.log(typeof req.session.export_module)
//   // // console.log("***************")
// })

// router.get('/lecturer_download_csv', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }

//   module = req.query.module
//   // console.log(modules)
//   var csv_name = ''
//   var path = ''
//   csv_name = module + '_' + selectedYT + '.csv'
//   // console.log(csv_name)
//   path = '/module_database_csv/' + csv_name;
//   res.download(__dirname + path, csv_name, function (err) {
//     if (err) {
//       console.log(err)
//     } else {
//       // res.send('ok')
//     }
//   })
//   // res.redirect('lecturer_admin')
// })


// router.get('/lecturer_admin', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     // var allModules = req.session.allModules
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }

//   var querySelect = 'SELECT * FROM `Module` WHERE `yearTerm`="' + selectedYT + '" AND `employeeID`="' + uname + '"'
//   var queryGroupNumber = 'SELECT moduleCode, COUNT(teamNumber) NumberOfTeam FROM `projectInfo` WHERE yearTerm="' + selectedYT + '" ' +
//     'GROUP BY `moduleCode` '
//   var queryStudentNumber = 'SELECT moduleCode, COUNT(studentSPR) NumberOfStudent FROM `ModStuTe` WHERE yearTerm="' + selectedYT + '" ' +
//     'GROUP BY `moduleCode` '
//   var queryAllModulesInfo = 'SELECT * FROM `Module` ' +
//     'JOIN (' + queryGroupNumber + ') AS GroupNumber ON Module.moduleCode=GroupNumber.moduleCode ' +
//     'JOIN (' + queryStudentNumber + ') AS StudentNumber ON Module.moduleCode=StudentNumber.moduleCode ' +
//     'WHERE employeeID = "' + uname + '" AND yearTerm="' + selectedYT + '"'
//   var queryAllModuleCodes = 'SELECT moduleCode, yearTerm FROM `Module`'

//   mysql.query(querySelect, function (error, allModules) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(queryAllModulesInfo, function (error, moduleInfo) {
//       if (error) {
//         console.log(error)
//       }
//       for (var i = 1; i <= moduleInfo.length; i++) {
//         moduleInfo[i - 1].index = i
//       }
//       // console.log(moduleInfo)
//       mysql.query(queryAllModuleCodes, function (error, moduleCodes) {
//         if (error) {
//           console.log(error)
//         }
//         // console.log(moduleCodes)
//         res.render('lecturer_admin.html', {
//           modules: allModules,
//           moduleInfo: moduleInfo,
//           uname: req.session.lFullName,
//           YS: req.session.ys,
//           allModuleCodes: moduleCodes,
//           muduleNumber: allModules.length
//         })
//       })
//     })
//   })
// })

// router.get('/student_feedback', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/login')
//   }
//   var reqObj = req.query
//   req.session.moduleID = reqObj.moduleID
//   var moduleID = req.session.moduleID
//   var allModules = req.session.allModules
//   //var querySelectAllModule = 'SELECT * FROM module'
//   var querySelectCurrentModule = 'SELECT * FROM module where `moduleCode`="' + moduleID + '" AND yearTerm="' + selectedYT + '"'
//   var querySelectselectedStu = 'SELECT * FROM student where `studentSPR`="' + uname + '"'

//   var selectMandS = '`moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" AND yearTerm="' + selectedYT + '"'

//   var selectT = 'SELECT teamNumber FROM modstute where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" AND yearTerm="' + selectedYT + '" '

//   var queryFeedbackScore = 'SELECT  FORMAT(AVG(score),1) AS score_avg FROM studentfeedback where' + selectMandS

//   var querySelectfeedback = 'SELECT weekNumber, score, contribution, writtenFeedback, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer ' +
//     'FROM studentfeedback where' + selectMandS

//   var querySelectTeamfeedback = 'SELECT  weekNumber, score, writtenFeedback, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer ' +
//     'FROM teamfeedback where `moduleCode`="' + moduleID + '" and `teamNumber`= (' + selectT + ') AND yearTerm="' + selectedYT + '"'

//   var querySelectteam = 'SELECT * FROM modstute where `moduleCode`="' + moduleID + '" and `studentSPR`="' + uname + '" AND yearTerm="' + selectedYT + '"'
//   var querySelectproject =
//     'SELECT * FROM projectinfo where `moduleCode`="' + moduleID + '" and `teamNumber`= (' + selectT + ') AND yearTerm="' + selectedYT + '"'

//   var countstudent = 'select count(score) As scount from studentfeedback where' + selectMandS
//   var countteam = 'select count(score) As scount from teamfeedback ' +
//     'where `moduleCode`="' + moduleID + '" and `teamNumber`= (' + selectT + ') AND yearTerm="' + selectedYT + '"'

//   mysql.query(querySelectCurrentModule, function (error, CMod) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(querySelectselectedStu, function (error, Stu) {
//       if (error) {
//         console.log(error)
//       }
//       fs.exists("/public/images/" + Stu[0].fileLocation, (exists) => {
//         if (exists === false) {
//           Stu[0].fileLocation = "/public/images/profile_default.jpeg"
//         }
//       });
//       mysql.query(querySelectteam, function (error, Stea) {
//         if (error) {
//           console.log(error)
//         }
//         mysql.query(querySelectfeedback, function (error, SFd) {
//           if (error) {
//             console.log(error)
//           }
//           mysql.query(querySelectTeamfeedback, function (error, StFd) {
//             if (error) {
//               console.log(error)
//             }
//             mysql.query(querySelectproject, function (error, SPro) {
//               if (error) {
//                 console.log(error)
//               }
//               mysql.query(queryFeedbackScore, function (error, Score) {
//                 if (error) {
//                   console.log(error)
//                 }
//                 mysql.query(countstudent, function (error, countst) {
//                   if (error) {
//                     console.log(error)
//                   }
//                   mysql.query(countteam, function (error, countte) {
//                     if (error) {
//                       console.log(error)
//                     }
//                     // console.log(Score[0])
//                     // console.log(SFd)

//                     //console.log(countst[0].scount)
//                     // console.log(countst[0][0])


//                     // console.log(countte)

//                     //console.log(SFd[score])

//                     var studata = new Array();
//                     var teamdata = new Array();

//                     for (var j = 0; j < countst[0].scount; j++) {
//                       //     //studata[j] = document.getElementById("ccccc").innerText;
//                       //     SFd.score
//                       studata[j] = SFd[j].score;
//                       //console.log(SFd[j].score)
//                       //console.log(studata)

//                       //     console.log(nstudata[j])
//                     }

//                     for (var j = 0; j < countte[0].scount; j++) {
//                       //     //studata[j] = document.getElementById("ccccc").innerText;
//                       //     SFd.score
//                       teamdata[j] = StFd[j].score;
//                       //console.log(StFd[j].score)
//                       //console.log(teamdata)

//                       //     console.log(nstudata[j])
//                     }
//                     // console.log(SPro)
//                     //console.log(SFd)
//                     //console.log(StFd)


//                     res.render('student_feedback.html', {
//                       uname: req.session.sFullName,
//                       module: CMod[0],
//                       team: Stea[0],
//                       project: SPro[0],
//                       countst: countst[0],
//                       countte: countte[0],
//                       modules: allModules,
//                       student: Stu[0],
//                       Selectfeedback: SFd,
//                       Selectteamfeedback: StFd,
//                       Score: Score[0],
//                       studata: studata,
//                       teamdata: teamdata,
//                       YS: req.session.ys
//                     })
//                   })
//                 })
//               })
//             })
//           })
//         })
//       })
//     })
//   })
// })

// router.get('/student_setYS', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//   } else {
//     res.redirect('/login')
//   }

//   req.session.y_s = req.query.YS
//   // console.log(req.query.YS)

//   var query_delete_YearSemester = 'DELETE FROM `CurrentYearTerm` WHERE `employeeID`="' + uname + '"'
//   var query_setYearSemester = 'INSERT INTO `CurrentYearTerm`(`yearTerm`, `employeeID`) VALUES ("' + req.session.y_s + '", "' + uname + '")'
//   var queryYS = 'SELECT `yearTerm` FROM `CurrentYearTerm` WHERE `employeeID`="' + uname + '"'
//   // console.log(query_setYearSemester)
//   mysql.query(query_delete_YearSemester, function (error, results) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(query_setYearSemester, function (error, results) {
//       if (error) {
//         console.log(error)
//       }
//       mysql.query(queryYS, function (error, YS) {
//         if (error) {
//           console.log(error)
//         }
//         req.session.ys = YS[0].yearTerm
//         res.redirect('/student_homepage')
//       })
//     })
//   })
//   // res.redirect('lecturer_homepage')
// })

// router.get('/student_homepage', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     var utype = req.session.utype
//     var selectedYT = req.session.ys
//   } else {
//     res.redirect('/expire')
//   }
//   //var querySelect = 'SELECT * FROM Module where moduleCode in (select moduleCode from modstute where studentSPR="' + uname + '" ) '
//   var querySelect = 'SELECT * FROM Module where moduleCode in (select moduleCode from modstute where studentSPR="' + uname + '" AND yearTerm="' + selectedYT + '" ) '
//   var queryStudentName = 'SELECT surname, forename FROM `Student` WHERE `studentSPR`="' + req.session.email + '"'

//   mysql.query(querySelect, function (error, allMod) {
//     if (error) {
//       console.log(error)
//     }
//     req.session.allModules = allMod
//     var allModules = req.session.allModules
//     for (var i = 1; i <= allModules.length; i++) {
//       allModules[i - 1].index = i;
//     }
//     mysql.query(queryStudentName, function (error, StudentName) {
//       if (error) {
//         console.log(error)
//       }
//       req.session.sFullName = StudentName[0].forename + " " + StudentName[0].surname
//       res.render('student_homepage.html', {
//         modules: allModules,
//         uname: req.session.sFullName,
//         utype: utype,
//         YS: req.session.ys
//       })
//     })
//   })
// })

// router.get('/TA_Homepage', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     // var YS = req.session.ys
//   } else {
//     res.redirect('/expire')
//   }
//   var querySelectMods = 'SELECT * FROM Module WHERE Module.moduleCode IN ' +
//     '(SELECT projectinfo.moduleCode FROM projectinfo JOIN TA ON (projectinfo.taStudentSPR=ta.taStudentSPR) ' +
//     'WHERE projectinfo.taStudentSPR="' + uname + '")'
//   var queryTAName = 'SELECT surname, forename FROM `TA` WHERE `taStudentSPR`="' + uname + '"'

//   mysql.query(querySelectMods, function (error, TAMods) {
//     if (error) {
//       console.log(error)
//     }
//     req.session.allMods = TAMods
//     var allMods = req.session.allMods
//     for (var i = 1; i <= allMods.length; i++) {
//       allMods[i - 1].index = i;
//     }
//     mysql.query(queryTAName, function (error, TAName) {
//       if (error) {
//         console.log(error)
//       }
//       req.session.taFullName = TAName[0].forename + " " + TAName[0].surname
//       res.render('TA_homepage.html', {
//         uname: req.session.taFullName,
//         mods: allMods,
//         YS: req.session.ys
//       })
//     })
//   })
// })

// router.get('/TA_module', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     // var YS = req.session.ys
//   } else {
//     res.redirect('/login')
//   }
//   var reqObj = req.query
//   req.session.modID = reqObj.moduleID
//   req.session.selectedYS = reqObj.YS
//   var selectedModID = req.session.modID
//   var YS = req.session.selectedYS

//   var allMod = req.session.allMods

//   // This query selects the module names and module codes to display
//   var querySelectCurrentMod = 'SELECT moduleName, moduleCode FROM Module WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '"'

//   // This query shows all the groups a TA coaches
//   var queryMembersTeam = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
//     'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
//     'WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '" GROUP BY ModStuTe.teamNumber '
//   var queryGroupAveScore = 'SELECT teamNumber, AVG(score) avgScore FROM `TeamFeedback` ' +
//     'WHERE moduleCode = "' + selectedModID + '" AND `yearTerm`="' + YS + '" GROUP BY teamNumber '
//   var queryGroupLatestScore = 'SELECT teamNumber, score lastScore, weekNumber, DATE_FORMAT(date,"%Y-%m-%d") date, messageLecturer FROM TeamFeedback ' +
//     'WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '" AND (teamNumber, weekNumber) IN ' +
//     '(SELECT teamNumber, MAX(weekNumber) FROM TeamFeedback WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '" GROUP BY teamNumber) '
//   var queryGroupTA = 'SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
//   var queryCoachedGroups = queryGroupTA +
//     'JOIN (' + queryMembersTeam + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
//     'JOIN (' + queryGroupAveScore + ') AS gAvgScore ON (ProjectInfo.teamNumber=gAvgScore.teamNumber) ' +
//     'JOIN (' + queryGroupLatestScore + ') AS gLastScore ON (ProjectInfo.teamNumber=gLastScore.teamNumber) ' +
//     'WHERE ProjectInfo.moduleCode="' + selectedModID + '" AND ProjectInfo.taStudentSPR="' + uname + '" AND ProjectInfo.yearTerm="' + YS + '" '
//   var queryCoachedGroupsNoScore = queryGroupTA +
//     'JOIN (' + queryMembersTeam + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
//     'WHERE ProjectInfo.moduleCode="' + selectedModID + '" AND ProjectInfo.taStudentSPR="' + uname + '" AND ProjectInfo.yearTerm="' + YS + '" '

//   // This query shows the weeks that have had feedback
//   var queryWeekNumber = 'SELECT weekNumber FROM `teamfeedback` WHERE `moduleCode`="' + selectedModID + '" GROUP BY weekNumber'

//   mysql.query(querySelectCurrentMod, function (error, ModCurrent) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(queryCoachedGroupsNoScore, function (error, TAGroupsNoScore) {
//       if (error) {
//         console.log(error)
//       }
//       req.session.group = TAGroupsNoScore
//       mysql.query(queryCoachedGroups, function (error, TAGroups) {
//         if (error) {
//           console.log(error)
//         }
//         var studentIndexNames = new Object()
//         // console.log(TAGroups.length)
//         // console.log(typeof TAGroups)

//         // console.log(req.session.group)
//         // console.log("%%%%%%%%%%%%%%")
//         if (TAGroups.length !== req.session.group.length) {
//           // console.log(TAGroups[0])
//           // console.log("*************")
//           for (var i = 0; i < req.session.group.length; i++) {
//             for (var j = 0; j < TAGroups.length; j++) {
//               if (req.session.group[i].teamNumber === TAGroups[j].teamNumber) {
//                 req.session.group.splice(i, 1); //利用splice函数删除元素，从第i个位置，截取长度为1的元素
//               }
//             }
//           }
//           for (var m = 0; m < req.session.group.length; m++) {
//             // console.log(TAGroups[m])
//             // console.log("&&&&&&&&&&&")
//             req.session.group[m].avgScore = "NA"
//             req.session.group[m].lastScore = "NA"
//             req.session.group[m].weekNumber = "NA"
//             TAGroups.push(req.session.group[m])
//           }
//         }
//         else {
//           for (j = 0; j < TAGroups.length; j++) {
//             TAGroups[j].weekNumber = "; week" + TAGroups[j].weekNumber
//             var studentNames = TAGroups[j].studentName
//             var studentNamesArray = studentNames.split(',')
//             studentIndexNames[j] = new Object()
//             var studentNumber = studentNamesArray.length
//             for (i = 0; i < studentNumber; i++) {
//               studentIndexNames[j][i] = new Object()
//               studentIndexNames[j][i].teamNumber = TAGroups[j].teamNumber
//               studentIndexNames[j][i].indexNumber = i.toString()
//               studentIndexNames[j][i].name = studentNamesArray[i]
//             }
//             console.log("*************")
//             console.log(TAGroups)
//             console.log("*************")
//           }
//         }
//         // console.log(studentIndexNames[0][0].name)
//         mysql.query(queryWeekNumber, function (error, weekNumbers) {
//           if (error) {
//             console.log(error)
//           }
//           var weekexist = new Array()
//           for (j = 0; j < weekNumbers.length; j++) {
//             weekexist[j] = weekNumbers[j].weekNumber
//           }
//           var weeknum = new Array()
//           var listIndex = 0
//           for (s = 1; s < 21; s++) {
//             if (weekexist.includes(s.toString())) {
//               continue
//             }
//             else {
//               weeknum[listIndex] = s.toString()
//             }
//             listIndex++
//           }
//           // console.log(TAGroups)
//           res.render('TA_module.html', {
//             uname: req.session.taFullName,
//             mods: allMod,
//             module: ModCurrent[0],
//             coachedGroups: TAGroups,
//             studentNames: studentIndexNames,
//             weekNumbers: weeknum,
//             YS: req.session.ys
//           })
//         })
//       })
//     })
//   })
// })

// router.get('/TA_group', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     // var YS = req.session.ys
//   } else {
//     res.redirect('/login')
//   }
//   var reqObj = req.query
//   req.session.modID = reqObj.moduleID
//   var selectedModID = req.session.modID
//   req.session.teamNumber = reqObj.teamNumber
//   var teamNumber = req.session.teamNumber
//   req.session.selectedYS = reqObj.YS
//   var YS = req.session.selectedYS

//   var allMod = req.session.allMods
//   var allTAGroups = req.session.TAGroup


//   // This query selects the module names and module codes to display
//   var querySelectCurrentMod = 'SELECT moduleName, moduleCode, modulePlan, numberofWeeks FROM Module WHERE `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '"'
//   // console.log(querySelectCurrentMod)
//   // This query shows all the group members in a module
//   var queryTeamMembers = 'SELECT Student.surname, Student.forename, Student.fileLocation, ModStuTe.memberIndex FROM `Student` JOIN `ModStuTe` ' +
//     'ON ModStuTe.studentSPR=Student.studentSPR ' +
//     'WHERE ModStuTe.teamNumber="' + teamNumber + '" AND `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '" '

//   // query team feedback
//   var queryTeamFeedback = 'SELECT teamNumber, weekNumber, score, writtenFeedback, messageLecturer, DATE_FORMAT(date,"%Y-%m-%d") date ' +
//     'FROM `TeamFeedback` WHERE teamNumber="' + teamNumber + '" AND `moduleCode`="' + selectedModID + '" AND `yearTerm`="' + YS + '"'

//   // This query select all student feedback information for a given group in a module
//   var queryStudentFeedback = 'SELECT concat(Student.surname, " ", Student.forename) studentName, ' +
//     'StudentFeedback.weekNumber,StudentFeedback.score, StudentFeedback.contribution, StudentFeedback.writtenFeedback ' +
//     'FROM `student` JOIN `StudentFeedback` ON student.studentSPR=StudentFeedback.studentSPR ' +
//     'JOIN `ModStuTe` ON (StudentFeedback.studentSPR=ModStuTe.studentSPR AND StudentFeedback.moduleCode=ModStuTe.moduleCode AND StudentFeedback.yearTerm=ModStuTe.yearTerm)' +
//     'WHERE ModStuTe.teamNumber = "' + teamNumber + '" AND StudentFeedback.moduleCode = "' + selectedModID + '" AND ModStuTe.yearTerm="' + YS + '"'

//   // This query shows the weeks that have had feedback
//   var queryWeekNumber = 'SELECT weekNumber FROM `teamFeedback` WHERE `moduleCode`="' + selectedModID + '" AND `teamNumber`="' + teamNumber + '" AND yearTerm="' + YS + '" GROUP BY weekNumber'

//   var queryGroupTA = 'SELECT * FROM `ProjectInfo` JOIN `TA` ON (ProjectInfo.taStudentSPR=TA.taStudentSPR) '
//   var queryMembersTeam = 'SELECT ModStuTe.teamNumber, group_concat(Student.surname, " ", Student.forename Separator ", ") studentName ' +
//     'FROM `ModStuTe` JOIN `Student` ON ModStuTe.studentSPR=Student.studentSPR ' +
//     'WHERE `moduleCode`="' + selectedModID + '" AND `teamNumber`="' + teamNumber + '" AND `yearTerm`="' + YS + '" GROUP BY ModStuTe.teamNumber '
//   var queryGroup = queryGroupTA +
//     'JOIN (' + queryMembersTeam + ') AS TeamMembers ON (ProjectInfo.teamNumber=TeamMembers.teamNumber) ' +
//     'WHERE ProjectInfo.moduleCode="' + selectedModID + '" AND ProjectInfo.teamNumber="' + teamNumber + '" AND ProjectInfo.taStudentSPR="' + uname + '" AND ProjectInfo.yearTerm="' + YS + '" '


//   mysql.query(querySelectCurrentMod, function (error, ModCurrent) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(queryTeamMembers, function (error, TeamMembers) {
//       if (error) {
//         console.log(error)
//       }
//       req.session.teamMember = 0
//       for (var i = 0; i < TeamMembers.length; i++) {
//         fs.exists("./public/images/" + TeamMembers[i].fileLocation, (exists) => {
//           if (exists === false) {
//             TeamMembers[req.session.teamMember].fileLocation = "/public/images/profile_default.jpeg"
//             req.session.teamMember++
//           }
//           else {
//             if (TeamMembers[req.session.teamMember].fileLocation === '') {
//               TeamMembers[req.session.teamMember].fileLocation = "/public/images/profile_default.jpeg"
//             }
//             else {
//               TeamMembers[req.session.teamMember].fileLocation = "/public/images/" + TeamMembers[req.session.teamMember].fileLocation
//             }
//             req.session.teamMember++
//           }
//         });
//       }
//       // console.log(TeamMembers)

//       mysql.query(queryTeamFeedback, function (error, TeamFeedback) {
//         if (error) {
//           console.log(error)
//         }
//         mysql.query(queryStudentFeedback, function (error, Student) {
//           if (error) {
//             console.log(error)
//           }
//           var memberNum = 0
//           var weeklyFeedback = new Array()
//           // console.log(typeof Student)
//           loop:
//           for (var weekNum = 1; weekNum < 21; weekNum++) {
//             if (weekNum > TeamFeedback.length) {
//               break
//             }
//             weeklyFeedback[weekNum - 1] = new Array()
//             for (const teamF of TeamFeedback) {
//               if (typeof (teamF) === "undefined") {
//                 break loop
//               }
//               if (parseInt(teamF.weekNumber) === weekNum) {
//                 weeklyFeedback[weekNum - 1].push(teamNumber);
//                 weeklyFeedback[weekNum - 1].push(teamF.weekNumber);
//                 weeklyFeedback[weekNum - 1].push(teamF.score);
//                 weeklyFeedback[weekNum - 1].push(teamF.writtenFeedback);
//                 weeklyFeedback[weekNum - 1].push(teamF.messageLecture);
//                 break
//               }
//             }
//             if (weeklyFeedback[weekNum - 1].length === 0) {
//               weeklyFeedback[weekNum - 1] = null
//               break
//             }
//             for (const stuF of Student) {
//               if (typeof (stuF) === "undefined") {
//                 break loop
//               }
//               if (parseInt(stuF.weekNumber) === weekNum) {
//                 memberNum++
//                 weeklyFeedback[weekNum - 1].push(stuF.studentName);
//                 weeklyFeedback[weekNum - 1].push(stuF.score);
//                 weeklyFeedback[weekNum - 1].push(stuF.contribution);
//                 weeklyFeedback[weekNum - 1].push(stuF.writtenFeedback);
//               }
//               // console.log(FeedbackByWeek[weekNum-1].length)
//             }
//             weeklyFeedback[weekNum - 1].splice(5, 0, memberNum)
//             memberNum = 0
//           }
//           // console.log(weeklyFeedback)
//           mysql.query(queryWeekNumber, function (error, weekNumbers) {
//             if (error) {
//               console.log(error)
//             }
//             var weekexist = new Array()
//             for (var j = 0; j < weekNumbers.length; j++) {
//               weekexist[j] = weekNumbers[j].weekNumber
//             }
//             var weeknum = new Array()
//             var listIndex = 0
//             for (var s = 1; s <= ModCurrent[0].numberofWeeks; s++) {
//               if (weekexist.includes(s)) {
//                 continue
//               } else {
//                 weeknum[listIndex] = s.toString()
//               }
//               listIndex++
//             }
//             // console.log(weeknum)
//             mysql.query(queryGroup, function (error, TAGroup) {
//               if (error) {
//                 console.log(error)
//               }
//               // console.log(TAGroup)
//               res.render('TA_group.html', {
//                 uname: req.session.taFullName,
//                 mods: allMod,
//                 module: ModCurrent[0],
//                 teamMember: TeamMembers,
//                 teamFeedback: TeamFeedback,
//                 student: Student,
//                 weeklyFeedback: weeklyFeedback,
//                 YS: req.session.ys,
//                 weekNumbers: weeknum,
//                 selectedGroup: TAGroup,
//                 group: teamNumber,
//                 memberNumber: TeamMembers.length,
//                 weeks: weekNumbers.length
//               })
//             })
//           })
//         })
//       })
//     })
//   })
// })

// router.post('/provideFeedback', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     // var YS = req.session.ys
//   } else {
//     res.redirect('/login')
//   }
//   var feedback = req.body
//   var selectedModID = req.session.modID
//   var studentScore = feedback.studentScore
//   var studentContribution = feedback.studentContribution
//   var feedbackStudent = feedback.studentFeedback
//   var YS = req.session.selectedYS
//   // console.log(studentScore)
//   // console.log(studentContribution)
//   // console.log(feedbackStudent)
//   var time = new Date()
//   var date = time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate()

//   var queryStudentSPR = 'SELECT studentSPR FROM ModStuTe WHERE moduleCode="' + selectedModID + '" AND teamNumber="' + feedback.teamNumber + '"'

//   var insertTeamFeed = 'INSERT INTO teamfeedback (`moduleCode`,`yearTerm`,`weekNumber`,`teamNumber`,`score`,`writtenFeedback`,`messageLecturer`,`date`)' +
//     'VALUES ("' + selectedModID + '", "' + YS + '", "' + feedback.weekNumber + '", "' + feedback.teamNumber + '","' + feedback.teamScore + '", ' +
//     '"' + feedback.feedbackTeam + '", "' + feedback.message + '", "' + date + '")'

//   mysql.query(insertTeamFeed, function (error, resultFeedback) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(queryStudentSPR, function (error, resultStudents) {
//       if (error) {
//         console.log(error)
//       }
//       var studentSPRNumber = []
//       for (i = 0; i < resultStudents.length; i++) {
//         var studentSPR = resultStudents[i].studentSPR
//         studentSPRNumber.push(studentSPR)
//       }

//       for (i = 0; i < studentSPRNumber.length; i++) {
//         var insertIntoStudentFeedback = 'INSERT INTO studentfeedback (`studentSPR`,`moduleCode`,`yearTerm`,`weekNumber`,`score`,`contribution`,`writtenFeedback`,`messageLecturer`,`date`)' +
//           'VALUES ("' + studentSPRNumber[i] + '","' + selectedModID + '", "' + YS + '", "' + feedback.weekNumber + '", "' + studentScore[i] + '", "' + studentContribution[i] + '", ' +
//           '"' + feedbackStudent[i] + '", "' + feedback.message + '", "' + date + '")'

//         mysql.query(insertIntoStudentFeedback, function (error, resultFeedback) {
//           if (error) {
//             console.log(error)
//           }
//         })
//       }
//     })
//   })
//   res.redirect('/TA_group?moduleID=' + selectedModID + '&teamNumber=' + feedback.teamNumber + '&YS=' + req.session.selectedYS)
// })

// router.post('/updateFeedback', function (req, res) {
//   if (req.session.email) {
//     var uname = req.session.email
//     // var YS = req.session.ys
//   } else {
//     res.redirect('/login')
//   }
//   var feedback = req.body
//   var selectedModID = req.session.modID
//   var YS = req.session.selectedYS
//   // req.session.studentScore = feedback.studentScore
//   // req.session.studentContribution = feedback.studentContribution
//   // req.session.feedbackStudent = feedback.studentFeedback
//   //
//   // console.log(studentScore)
//   var time = new Date()
//   var date = time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate()

//   // Update teamfeedback table
//   var queryUpdateTeam = 'UPDATE `teamfeedback` SET `score`="' + feedback.teamScore + '", `writtenFeedback`="' + feedback.feedbackTeam + '", ' +
//     '`messageLecturer`="' + feedback.message + '", `date`="' + date + '" ' +
//     'WHERE `moduleCode`="' + selectedModID + '" AND `teamNumber`="' + feedback.teamNumber + '" AND `weekNumber`="' + feedback.weekNumber + '" AND `yearTerm`="' + YS + '"'
//   var queryStudentSPR = 'SELECT studentSPR FROM ModStuTe ' +
//     'WHERE moduleCode="' + selectedModID + '" AND teamNumber="' + feedback.teamNumber + '" AND `yearTerm`="' + YS + '"'


//   mysql.query(queryUpdateTeam, function (error, results) {
//     if (error) {
//       console.log(error)
//     }
//     mysql.query(queryStudentSPR, function (error, resultStudents) {
//       if (error) {
//         console.log(error)
//       }
//       // Update studentFeedback table
//       var studentSPRNumber = []
//       for (var i = 0; i < resultStudents.length; i++) {
//         var studentSPR = resultStudents[i].studentSPR
//         studentSPRNumber.push(studentSPR)
//       }
//       for (i = 0; i < studentSPRNumber.length; i++) {
//         var insertIntoStudentFeedback = 'UPDATE `studentFeedback` SET ' +
//           '`score`="' + feedback.studentScore[i] + '",`contribution`="' + feedback.studentContribution[i] + '",' +
//           '`writtenFeedback`="' + feedback.studentFeedback[i] + '",`messageLecturer`="' + feedback.message + '", `date`="' + date + '" ' +
//           'WHERE `moduleCode`="' + req.session.modID + '" AND `studentSPR`="' + studentSPRNumber[i] + '" AND `weekNumber`="' + feedback.weekNumber + '" AND `yearTerm`="' + YS + '"'
//         // console.log(insertIntoStudentFeedback)
//         mysql.query(insertIntoStudentFeedback, function (error, studentFeedbackResult) {
//           if (error) {
//             console.log(error)
//           }
//         })
//       }
//     })
//   })
//   res.redirect('/TA_group?moduleID=' + selectedModID + '&teamNumber=' + feedback.teamNumber + '&YS=' + req.session.selectedYS)
// })

module.exports = router;

