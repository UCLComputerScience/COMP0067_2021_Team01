-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- 主机： localhost
-- 生成日期： 2021-04-23 05:42:39
-- 服务器版本： 5.7.26
-- PHP 版本： 7.4.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 数据库： `feedback`
--

-- --------------------------------------------------------

--
-- 表的结构 `CurrentYearTerm`
--

CREATE TABLE `CurrentYearTerm` (
  `yearTerm` varchar(20) NOT NULL,
  `employeeID` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `CurrentYearTerm`
--

INSERT INTO `CurrentYearTerm` (`yearTerm`, `employeeID`) VALUES
('2021-1', 'admin'),
('2021-1', 'l111111'),
('2021-1', 'sss');

-- --------------------------------------------------------

--
-- 表的结构 `Lecturer`
--

CREATE TABLE `Lecturer` (
  `employeeID` varchar(45) NOT NULL,
  `title` varchar(45) NOT NULL,
  `surname` varchar(45) NOT NULL,
  `forename` varchar(45) NOT NULL,
  `profile` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `Lecturer`
--

INSERT INTO `Lecturer` (`employeeID`, `title`, `surname`, `forename`, `profile`) VALUES
('aaa', 'professor', 'West', 'John', NULL),
('l111111', 'professor', 'HILL', 'Martin', NULL),
('l222222', 'professor', 'SHAW', 'Patrick', NULL),
('l333333', 'professor', 'JAMIESON', 'Qing', NULL),
('l444444', 'professor', 'REILLY', 'Sunita', NULL);

-- --------------------------------------------------------

--
-- 表的结构 `LoginInfo`
--

CREATE TABLE `LoginInfo` (
  `username` varchar(45) NOT NULL,
  `password` varchar(45) DEFAULT NULL,
  `userType` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `LoginInfo`
--

INSERT INTO `LoginInfo` (`username`, `password`, `userType`) VALUES
('aaa', 'aaa', 'lecturer'),
('l111111', 'aaa', 'lecturer'),
('s202001', 'sss', 'student'),
('sss', 'sss', 'student'),
('t123401', 'ttt', 'TA'),
('ttt', 'ttt', 'TA');

-- --------------------------------------------------------

--
-- 表的结构 `ModStuTe`
--

CREATE TABLE `ModStuTe` (
  `studentSPR` varchar(45) NOT NULL,
  `moduleCode` varchar(45) NOT NULL,
  `yearTerm` varchar(20) NOT NULL,
  `teamNumber` varchar(10) DEFAULT NULL,
  `memberIndex` varchar(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `ModStuTe`
--

INSERT INTO `ModStuTe` (`studentSPR`, `moduleCode`, `yearTerm`, `teamNumber`, `memberIndex`) VALUES
('s202101', 'COMP00142', '2021-1', '1', '1'),
('s202101', 'COMP0024', '2021-1', '1', '1'),
('s202101', 'COMP0060', '2021-1', '1', '1'),
('s202101', 'COMP0067', '2021-1', '1', '1'),
('s202102', 'COMP00142', '2021-1', '2', '1'),
('s202102', 'COMP0060', '2021-1', '3', '1'),
('s202102', 'COMP0067', '2021-1', '2', '1'),
('s202103', 'COMP00142', '2021-1', '3', '1'),
('s202103', 'COMP0060', '2021-1', '2', '1'),
('s202103', 'COMP0067', '2021-1', '3', '1'),
('s202104', 'COMP00142', '2021-1', '1', '2'),
('s202104', 'COMP0060', '2021-1', '3', '2'),
('s202104', 'COMP0067', '2021-1', '1', '2'),
('s202105', 'COMP00142', '2021-1', '2', '2'),
('s202105', 'COMP0060', '2021-1', '1', '2'),
('s202105', 'COMP0067', '2021-1', '2', '2'),
('s202105', 'COMP006723', '2021-1', '1', '2'),
('s202105', 'COMP00673', '2021-1', '1', '2'),
('s202106', 'bbb', '2021-1', '2', '2'),
('s202106', 'COMP00142', '2021-1', '3', '2'),
('s202106', 'COMP006', '2021-1', '2', '2'),
('s202106', 'COMP0060', '2021-1', '2', '2'),
('s202106', 'COMP0067', '2021-1', '3', '2'),
('s202106', 'COMP006723', '2021-1', '2', '2'),
('s202107', 'COMP00142', '2021-1', '1', '3'),
('s202107', 'COMP0060', '2021-1', '2', '3'),
('s202107', 'COMP0067', '2021-1', '1', '3'),
('s202108', 'COMP00142', '2021-1', '2', '3'),
('s202108', 'COMP0060', '2021-1', '1', '3'),
('s202108', 'COMP0067', '2021-1', '2', '3'),
('s202109', 'COMP0067', '2021-1', '3', '3'),
('s202111', 'COMP0060', '2021-1', '4', '1'),
('s202111', 'COMP0067', '2021-1', '4', '1'),
('s202112', 'COMP0060', '2021-1', '4', '2'),
('s202112', 'COMP0067', '2021-1', '4', '2'),
('sss', 'COMP00142', '2021-1', '2', '4'),
('sss', 'COMP0024', '2021-1', '3', '4'),
('sss', 'COMP0060', '2021-1', '4', '3'),
('sss', 'COMP0067', '2021-1', '1', '4');

-- --------------------------------------------------------

--
-- 表的结构 `Module`
--

CREATE TABLE `Module` (
  `moduleCode` varchar(10) NOT NULL,
  `yearTerm` varchar(20) NOT NULL,
  `numberofWeeks` int(5) DEFAULT NULL,
  `moduleName` varchar(100) DEFAULT NULL,
  `moduleDescription` varchar(200) DEFAULT NULL,
  `modulePlan` varchar(500) DEFAULT NULL,
  `imgPath` varchar(200) DEFAULT NULL,
  `employeeID` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `Module`
--

INSERT INTO `Module` (`moduleCode`, `yearTerm`, `numberofWeeks`, `moduleName`, `moduleDescription`, `modulePlan`, `imgPath`, `employeeID`) VALUES
('COMP00142', '2021-1', 10, 'Machine Learning', 'This is a compulsory module in term 2.', 'week 1-2: ************\r\nweek 3-4: ************\r\nweek 5-6: ************\r\nweek 6-7: ************\r\nweek 7-8: ************', './public/images/WX20210416-154311@2x.png\r\n', 'l111111'),
('COMP0024', '2021-1', 10, 'Artificial Intelligence', 'This is a optional module in term 2.', 'week 1-2: ************\r\nweek 3-4: ************\r\nweek 5-6: ************\r\nweek 6-7: ************\r\nweek 7-8: ************', './public/images/WX20210416-154311@2x.png\r\n', 'l111111'),
('COMP0060', '2021-1', 10, 'English History', 'No', 'No', '/public/images/img_same_dimension_3.jpg', 'l111111'),
('COMP0067', '2021-1', 15, 'App Engineering', 'This is a COMPULSORY module in term 2.', 'week 1-2: ************\r\nweek 3-4: ************\r\nweek 5-6: ************\r\nweek 6-7: ************\r\nweek 7-8: ************', './public/images/WX20210416-154311@2x.png\r\n', 'l111111');

-- --------------------------------------------------------

--
-- 表的结构 `ProjectInfo`
--

CREATE TABLE `ProjectInfo` (
  `moduleCode` varchar(45) NOT NULL,
  `yearTerm` varchar(20) NOT NULL,
  `teamNumber` varchar(10) NOT NULL,
  `taStudentSPR` varchar(45) DEFAULT NULL,
  `labCode` varchar(10) NOT NULL,
  `projectTitle` varchar(100) NOT NULL,
  `projectBrief` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `ProjectInfo`
--

INSERT INTO `ProjectInfo` (`moduleCode`, `yearTerm`, `teamNumber`, `taStudentSPR`, `labCode`, `projectTitle`, `projectBrief`) VALUES
('COMP00142', '2021-1', '1', 't123404', '', 'GP app', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0024', '2021-1', '1', 't123406', '', 'Traffic Light System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0060', '2021-1', '1', 't123401', '', 'Traffic Light System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0067', '2021-1', '1', 't123401', '', 'Traffic Light System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP00142', '2021-1', '2', 't123404', '', 'GP app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0024', '2021-1', '2', 't123406', '', 'Medical reservation app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0060', '2021-1', '2', 't123402', '', 'Medical reservation app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0067', '2021-1', '2', 't123401', '', 'Medical reservation app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP00142', '2021-1', '3', 't123405', '', 'GP app', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0024', '2021-1', '3', 't123406', '', 'help app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0060', '2021-1', '3', 't123401', '', 'Algorithm optimization', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0067', '2021-1', '3', 't123401', '', 'Algorithm optimization', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP00142', '2021-1', '4', 't123405', '', 'GP app', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0060', '2021-1', '4', 't123403', '', 'Land Scape', 'A project to eatablish a model to analysis the sound for medical use'),
('COMP0067', '2021-1', '4', 't123401', '', 'help System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0067', '2021-1', '5', 't123402', '', 'NHS app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0067', '2021-1', '6', 't123402', '', 'text inprovement', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0067', '2021-1', '7', 't123403', '', 'webisite for clothes', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0067', '2021-1', '8', 't123403', '', 'music shop', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0067', '2021-1', '9', 't123403', '', 'animal gllary', 'A project to optimize the Q-learning algorism used in Enforcement Learning');

-- --------------------------------------------------------

--
-- 表的结构 `Student`
--

CREATE TABLE `Student` (
  `studentSPR` varchar(45) NOT NULL,
  `studentNumber` varchar(20) DEFAULT NULL,
  `surname` varchar(45) NOT NULL,
  `forename` varchar(45) NOT NULL,
  `registrationDate` timestamp NOT NULL,
  `routeCode` varchar(45) NOT NULL,
  `routeName` varchar(45) DEFAULT NULL,
  `degreeLevel` varchar(45) NOT NULL,
  `department` varchar(45) NOT NULL,
  `modeOfAttendance` varchar(20) DEFAULT NULL,
  `email` varchar(45) NOT NULL,
  `optionalCompulsory` varchar(10) NOT NULL,
  `enrolmentStatus` varchar(20) NOT NULL,
  `fileLocation` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `Student`
--

INSERT INTO `Student` (`studentSPR`, `studentNumber`, `surname`, `forename`, `registrationDate`, `routeCode`, `routeName`, `degreeLevel`, `department`, `modeOfAttendance`, `email`, `optionalCompulsory`, `enrolmentStatus`, `fileLocation`) VALUES
('s202101', '0001', 'SMITH', 'Tom', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 's202101@gamil.com', '', 'Yes', ''),
('s202102', '0002', 'BROWN', 'Tim', '2021-03-03 03:57:07', '', NULL, '', '', NULL, 's202102@gmail.com', '', 'Yes', ''),
('s202103', '0003', 'WILSON', 'John', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 's202103@gamil.com', '', 'Yes', ''),
('s202104', '0004', 'THOMSON', 'Jerry', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu3@gamil.com', '', 'Yes', ''),
('s202105', '0005', 'ROBERTSON', 'Joe', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu4@gamil.com', '', 'Yes', ''),
('s202106', '0006', 'CAMPBELL', 'Cindy', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu5@gamil.com', '', 'Yes', ''),
('s202107', '0007', 'STEWART', 'Ben', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu6@gamil.com', '', 'Yes', ''),
('s202108', '0008', 'ANDERSON', 'Kim', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu7@gmail.com', '', 'Yes', ''),
('s202109', '0009', 'MACDONALD', 'Lily', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu8@gmail.com', '', 'Yes', ''),
('s202110', '0110', 'BLACK', 'Bibi', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'vdfgdg1@gamil.com', '', 'Yes', ''),
('s202111', '0111', 'MACLEOD', 'Monica', '2021-03-03 03:57:07', '', NULL, '', '', NULL, 'gfdgd@gmail.com', '', 'Yes', ''),
('s202112', '0112', 'FINDLAY', 'Oscar', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'gfds@gamil.com', '', 'Yes', ''),
('s202113', '0113', 'MOORE', 'Mina', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'sfgdf@gamil.com', '', 'Yes', ''),
('s202114', '0114', 'CRAWFORD', 'Joe', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'sfgdfdgdfg@gamil.com', '', 'Yes', ''),
('s202115', '0115', 'CAMPBELL', 'Lan', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'fdgdfg@gamil.com', '', 'Yes', ''),
('s202116', '0116', 'STEWART', 'Ben', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'fgdfgdfgf@gamil.com', '', 'Yes', ''),
('s202117', '0117', 'ANDERSON', 'Suresh', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu7@gmail.com', '', 'Yes', ''),
('s202118', '0118', 'MACDONALD', 'Lily', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'xcvzcv@gmail.com', '', 'Yes', ''),
('s202119', '0119', 'HENDERSON', 'ZhenZhen', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'dsgsd@gamil.com', '', 'Yes', ''),
('s202120', '0120', 'BROWN', 'Luz', '2021-03-03 03:57:07', '', NULL, '', '', NULL, 'zcxvxcv@gmail.com', '', 'Yes', ''),
('s202121', '0121', 'WILSON', 'John', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'jyjts@gamil.com', '', 'Yes', ''),
('s202122', '0122', 'THOMSON', 'Jerry', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'fdg545@gamil.com', '', 'Yes', ''),
('s202123', '0123', 'MACDONALD', 'Anne	', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', '45y45y@gamil.com', '', 'Yes', ''),
('s202124', '0124', 'CAMPBELL', 'Paulo', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'ghtgj9@gamil.com', '', 'Yes', ''),
('s202125', '0125', 'STEWART', 'Syed', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'gverytryre6@gamil.com', '', 'Yes', ''),
('s202126', '0026', 'ANDERSON', 'Kim', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'sgr37@gmail.com', '', 'Yes', ''),
('s202127', '0027', 'MACDONALD', 'Victoria', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'swvewverwtu8@gmail.com', '', 'Yes', ''),
('s202128', '0028', 'THOMSON', 'Irene', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stvbuyknu8@gmail.com', '', 'Yes', ''),
('s202129', '0029', 'MACDONALD', 'Adam', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stuunyiium8@gmail.com', '', 'Yes', ''),
('sss', '0999', 'SCOTT', 'Anger', '2021-03-03 03:57:07', '', NULL, '', '', NULL, 'Anger.scott.20@gmail.com', '', 'Yes', 'person_1.jpeg');

-- --------------------------------------------------------

--
-- 表的结构 `StudentFeedback`
--

CREATE TABLE `StudentFeedback` (
  `studentSPR` varchar(45) NOT NULL,
  `moduleCode` varchar(45) NOT NULL,
  `yearTerm` varchar(20) NOT NULL,
  `weekNumber` int(10) NOT NULL,
  `score` int(11) NOT NULL,
  `contribution` int(10) DEFAULT NULL,
  `writtenFeedback` varchar(200) DEFAULT NULL,
  `messageLecturer` varchar(200) DEFAULT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `StudentFeedback`
--

INSERT INTO `StudentFeedback` (`studentSPR`, `moduleCode`, `yearTerm`, `weekNumber`, `score`, `contribution`, `writtenFeedback`, `messageLecturer`, `date`) VALUES
('s202101', 'COMP0067', '2021-1', 1, 4, 33, 'good', '', '2021-04-23'),
('s202101', 'COMP0067', '2021-1', 2, 4, 33, 'good', NULL, NULL),
('s202101', 'COMP0067', '2021-1', 3, 4, 33, 'good', NULL, NULL),
('s202101', 'COMP0067', '2021-1', 4, 1, 20, 'a123', 'no msg12312312432123432434', NULL),
('s202101', 'COMP0067', '2021-1', 5, 3, 25, '', 'no msg!!!', NULL),
('s202101', 'COMP0067', '2021-1', 6, 4, 25, '23', '123', NULL),
('s202101', 'COMP0067', '2021-1', 7, 2, 25, '23', 'qweqwe', NULL),
('s202101', 'COMP0067', '2021-1', 8, 2, 25, '123', '123', '2021-04-22'),
('s202101', 'COMP0067', '2021-1', 9, 2, 24, '123', '123', '2021-04-22'),
('s202101', 'COMP0067', '2021-1', 10, 4, 25, 'Brilliant Tom!!Brilliant Tom!!', 'No msg', '2021-04-22'),
('s202101', 'COMP0067', '2021-1', 11, 0, 0, 'absent', '312', '2021-04-23'),
('s202101', 'COMP0067', '2021-1', 12, 1, 25, '1', '', '2021-04-23'),
('s202102', 'COMP0067', '2021-1', 1, 1, 33, 'good', NULL, NULL),
('s202102', 'COMP0067', '2021-1', 2, 1, 33, 'no', 'no', '2021-03-28'),
('s202103', 'COMP0067', '2021-1', 1, 4, 33, 'good', NULL, NULL),
('s202104', 'COMP0067', '2021-1', 1, 4, 25, 'No', '', '2021-04-23'),
('s202104', 'COMP0067', '2021-1', 2, 4, 25, 'No', 'No', '2021-02-28'),
('s202104', 'COMP0067', '2021-1', 3, 4, 25, 'No', 'No', '2021-03-05'),
('s202104', 'COMP0067', '2021-1', 4, 4, 30, 'b123', 'no msg12312312432123432434', NULL),
('s202104', 'COMP0067', '2021-1', 5, 4, 25, '', 'no msg!!!', NULL),
('s202104', 'COMP0067', '2021-1', 6, 1, 25, '231', '123', NULL),
('s202104', 'COMP0067', '2021-1', 7, 2, 25, '1223', 'qweqwe', NULL),
('s202104', 'COMP0067', '2021-1', 8, 3, 25, '132', '123', '2021-04-22'),
('s202104', 'COMP0067', '2021-1', 9, 2, 25, '312', '123', '2021-04-22'),
('s202104', 'COMP0067', '2021-1', 10, 5, 30, 'Brilliant Jerry!!Brilliant Jerry!!', 'No msg', '2021-04-22'),
('s202104', 'COMP0067', '2021-1', 11, 0, 0, 'absent', '312', '2021-04-23'),
('s202104', 'COMP0067', '2021-1', 12, 1, 25, '1', '', '2021-04-23'),
('s202107', 'COMP0067', '2021-1', 1, 4, 25, 'No', '', '2021-04-23'),
('s202107', 'COMP0067', '2021-1', 2, 4, 25, 'No', 'No', '2021-02-28'),
('s202107', 'COMP0067', '2021-1', 3, 4, 25, 'No', 'No', '2021-03-05'),
('s202107', 'COMP0067', '2021-1', 4, 2, 20, 'c213', 'no msg12312312432123432434', NULL),
('s202107', 'COMP0067', '2021-1', 5, 2, 25, '', 'no msg!!!', NULL),
('s202107', 'COMP0067', '2021-1', 6, 2, 25, '123', '123', NULL),
('s202107', 'COMP0067', '2021-1', 7, 3, 25, '324', 'qweqwe', NULL),
('s202107', 'COMP0067', '2021-1', 8, 5, 25, '132', '123', '2021-04-22'),
('s202107', 'COMP0067', '2021-1', 9, 2, 25, '312', '123', '2021-04-22'),
('s202107', 'COMP0067', '2021-1', 10, 4, 20, 'Brilliant Ben!!Brilliant Ben!!', 'No msg', '2021-04-22'),
('s202107', 'COMP0067', '2021-1', 11, 0, 0, 'absent', '312', '2021-04-23'),
('s202107', 'COMP0067', '2021-1', 12, 1, 25, '1', '', '2021-04-23'),
('s202109', 'COMP0067', '2021-1', 1, 4, 33, 'good', NULL, NULL),
('s202109', 'COMP0067', '2021-1', 2, 4, 33, 'good', NULL, NULL),
('s202109', 'COMP0067', '2021-1', 3, 4, 33, 'good', NULL, NULL),
('sss', 'COMP00142', '2021-1', 1, 4, 33, 'I wanted to check in and see how things are going. You don’t seem to be quite as engaged at work lately — is there something I can do to help you get back on track? I’d like to keep you happy here. Le', NULL, '2021-03-12'),
('sss', 'COMP0024', '2021-1', 1, 4, 0, 'I wanted to check in and see how things are going. You don’t seem to be quite as engaged at work lately — is there something I can do to help you get back on track? I’d like to keep you happy here. Le', NULL, '2021-03-12'),
('sss', 'COMP0067', '2021-1', 1, 2, 33, 'I really appreciated how you kept me up to date on X project this week — it helped me coordinate with our stakeholders, and I’m excited to share that we’re on track to launch. It’s also great to see y', '', '2021-04-23'),
('sss', 'COMP00142', '2021-1', 2, 4, 0, 'I’m glad we’re taking the time to check-in. I feel like you haven’t been as happy at work lately. How do you feel? Is there something I can do to help you have a better experience here?', NULL, '2021-03-12'),
('sss', 'COMP0024', '2021-1', 2, 4, 0, 'I’m glad we’re taking the time to check-in. I feel like you haven’t been as happy at work lately. How do you feel? Is there something I can do to help you have a better experience here?', NULL, '2021-03-12'),
('sss', 'COMP0067', '2021-1', 2, 4, 33, 'I’m curious about where we are with Y project. If any issues have come up, it’s best that I know as soon as possible so I can help you get back on target. How about you shoot me daily updates just so ', 'I’m curious about where we are with Y project. If any issues have come up, it’s best that I know as soon as possible so I can help you get back on target. How about you shoot me daily updates just so ', '2021-03-12'),
('sss', 'COMP00142', '2021-1', 3, 4, 0, 'I know there are a lot of rumors flying around about X, and I know you’re concerned about it. I value your trust and contributions here, so I’d like to set the record straight and explain what I can.', NULL, '2021-03-12'),
('sss', 'COMP0024', '2021-1', 3, 4, 0, 'I know there are a lot of rumors flying around about X, and I know you’re concerned about it. I value your trust and contributions here, so I’d like to set the record straight and explain what I can.', NULL, '2021-03-12'),
('sss', 'COMP0067', '2021-1', 3, 4, 33, 'I can’t help but notice that this is the third deadline that’s caught up to you this month. I understand this is a fast-paced environment, and I think you’d be more effective if we rethought your time', 'I’m curious about where we are with Y project. If any issues have come up, it’s best that I know as soon as possible so I can help you get back on target. How about you shoot me daily updates just so ', '2021-03-12'),
('sss', 'COMP00142', '2021-1', 4, 4, 0, 'I understand your feelings, and I know it’s frustrating when you feel your questions aren’t being answered. In the future, though, please bring your concerns directly to me. When you share them with y', NULL, '2021-03-12'),
('sss', 'COMP0024', '2021-1', 4, 4, 0, 'I understand your feelings, and I know it’s frustrating when you feel your questions aren’t being answered. In the future, though, please bring your concerns directly to me. When you share them with y', NULL, '2021-03-12'),
('sss', 'COMP0067', '2021-1', 4, 3, 30, 'd123', 'no msg12312312432123432434', NULL),
('sss', 'COMP00142', '2021-1', 5, 1, 0, 'This morning you left our team meeting early. I could tell you were frustrated by the discussion, but walking out on your teammates doesn’t show them the same respect they show you during the conflict', NULL, '2021-03-12'),
('sss', 'COMP0024', '2021-1', 5, 1, 0, 'This morning you left our team meeting early. I could tell you were frustrated by the discussion, but walking out on your teammates doesn’t show them the same respect they show you during the conflict', NULL, '2021-03-12'),
('sss', 'COMP0067', '2021-1', 5, 3, 25, 'a', 'no msg!!!', NULL),
('sss', 'COMP00142', '2021-1', 6, 5, 0, ' I wanted to check-in and see how you felt about your work this week. Samika mentioned that you used a sarcastic tone with her in a meeting and it made her uncomfortable. We need to be able to functio', NULL, '2021-03-12'),
('sss', 'COMP0024', '2021-1', 6, 5, 0, ' I wanted to check-in and see how you felt about your work this week. Samika mentioned that you used a sarcastic tone with her in a meeting and it made her uncomfortable. We need to be able to functio', NULL, '2021-03-12'),
('sss', 'COMP0067', '2021-1', 6, 2, 25, '24', '123', NULL),
('sss', 'COMP0067', '2021-1', 7, 2, 25, '24', 'qweqwe', NULL),
('sss', 'COMP0067', '2021-1', 8, 2, 25, '132', '123', '2021-04-22'),
('sss', 'COMP0067', '2021-1', 9, 1, 30, '123', '123', '2021-04-22'),
('sss', 'COMP0067', '2021-1', 10, 1, 25, 'Brilliant Anger!!Brilliant Anger!!', 'No msg', '2021-04-22'),
('sss', 'COMP0067', '2021-1', 11, 0, 0, 'absent', '312', '2021-04-23'),
('sss', 'COMP0067', '2021-1', 12, 1, 25, '1', '', '2021-04-23');

-- --------------------------------------------------------

--
-- 表的结构 `TA`
--

CREATE TABLE `TA` (
  `taStudentSPR` varchar(11) NOT NULL,
  `surname` varchar(45) NOT NULL,
  `forename` varchar(45) NOT NULL,
  `email` varchar(45) NOT NULL,
  `degree` varchar(45) NOT NULL,
  `profile` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `TA`
--

INSERT INTO `TA` (`taStudentSPR`, `surname`, `forename`, `email`, `degree`, `profile`) VALUES
('t123401', 'WALKER', 'Ali', 't123401@gamil.com', 'Doctor', NULL),
('t123402', 'YOUNG', 'Ying', 't123fhghr402@gamil.com', 'Doctor', NULL),
('t123403', 'MILLER', 'James', 'tghfdgfhfdhgfdh403@gamil.com', 'Doctor', NULL),
('t123404', 'Lee', 'Anne', 't1hfgfhgfhgfh401@gamil.com', 'Doctor', NULL),
('t123405', 'Harris', 'Michel', 'dghdgfhgfh@gamil.com', 'Doctor', NULL),
('t123406', 'Hall', 'Albert', 't12hdhgfdhfh1@gamil.com', 'Doctor', NULL),
('ttt', 'TA1', 'TA1', 'TA1@gamil.com', 'Doctor', NULL);

-- --------------------------------------------------------

--
-- 表的结构 `TeamFeedback`
--

CREATE TABLE `TeamFeedback` (
  `moduleCode` varchar(45) NOT NULL,
  `yearTerm` varchar(20) NOT NULL,
  `teamNumber` varchar(10) NOT NULL,
  `weekNumber` int(10) NOT NULL,
  `score` int(11) NOT NULL,
  `writtenFeedback` varchar(200) DEFAULT NULL,
  `messageLecturer` varchar(200) DEFAULT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `TeamFeedback`
--

INSERT INTO `TeamFeedback` (`moduleCode`, `yearTerm`, `teamNumber`, `weekNumber`, `score`, `writtenFeedback`, `messageLecturer`, `date`) VALUES
('COMP0067', '2021-1', '1', 1, 4, 'I really appreciated how you kept me up to date on X project this week — it helped me coordinate with our stakeholders, and I’m excited to share that we’re on track to launch. It’s also great to see y', '', '2021-04-23'),
('COMP0067', '2021-1', '1', 2, 4, 'I’m curious about where we are with Y project. If any issues have come up, it’s best that I know as soon as possible so I can help you get back on target. How about you shoot me daily updates just so ', NULL, '2021-03-12'),
('COMP0067', '2021-1', '1', 3, 4, 'I can’t help but notice that this is the third deadline that’s caught up to you this month. I understand this is a fast-paced environment, and I think you’d be more effective if we rethought your time', NULL, '2021-03-12'),
('COMP0067', '2021-1', '1', 4, 3, 'good!!!good', 'no msg12312312432123432434', NULL),
('COMP0067', '2021-1', '1', 5, 3, 'not bad!!!', 'no msg!!!', NULL),
('COMP0067', '2021-1', '1', 6, 3, '123', '123', NULL),
('COMP0067', '2021-1', '1', 7, 3, 'qweqwe', 'qweqwe', NULL),
('COMP0067', '2021-1', '1', 8, 4, '132', '123', '2021-04-22'),
('COMP0067', '2021-1', '1', 9, 1, '123', '123', '2021-04-22'),
('COMP0067', '2021-1', '1', 10, 1, 'Brilliant!!Brilliant!!Brilliant!!', 'No msg', '2021-04-22'),
('COMP0067', '2021-1', '1', 11, 0, '123', '312', '2021-04-23'),
('COMP0067', '2021-1', '1', 12, 1, '123213', '', '2021-04-23'),
('COMP00142', '2021-1', '2', 1, 4, 'I wanted to check in and see how things are going. You don’t seem to be quite as engaged at work lately — is there something I can do to help you get back on track? I’d like to keep you happy here. Le', NULL, '2021-03-12'),
('COMP00142', '2021-1', '2', 2, 4, 'I’m glad we’re taking the time to check-in. I feel like you haven’t been as happy at work lately. How do you feel? Is there something I can do to help you have a better experience here?', NULL, '2021-03-12'),
('COMP00142', '2021-1', '2', 3, 4, 'I know there are a lot of rumors flying around about X, and I know you’re concerned about it. I value your trust and contributions here, so I’d like to set the record straight and explain what I can.', NULL, '2021-03-12'),
('COMP00142', '2021-1', '2', 4, 4, 'I understand your feelings, and I know it’s frustrating when you feel your questions aren’t being answered. In the future, though, please bring your concerns directly to me. When you share them with y', NULL, '2021-03-12'),
('COMP00142', '2021-1', '2', 5, 1, 'This morning you left our team meeting early. I could tell you were frustrated by the discussion, but walking out on your teammates doesn’t show them the same respect they show you during the conflict', NULL, '2021-03-12'),
('COMP00142', '2021-1', '2', 6, 5, ' I wanted to check-in and see how you felt about your work this week. Samika mentioned that you used a sarcastic tone with her in a meeting and it made her uncomfortable. We need to be able to functio', NULL, '2021-03-12'),
('COMP0024', '2021-1', '3', 1, 4, 'I wanted to check in and see how things are going. You don’t seem to be quite as engaged at work lately — is there something I can do to help you get back on track? I’d like to keep you happy here. Le', NULL, '2021-03-12'),
('COMP0024', '2021-1', '3', 2, 4, 'I’m glad we’re taking the time to check-in. I feel like you haven’t been as happy at work lately. How do you feel? Is there something I can do to help you have a better experience here?', NULL, '2021-03-12'),
('COMP0024', '2021-1', '3', 3, 4, 'I know there are a lot of rumors flying around about X, and I know you’re concerned about it. I value your trust and contributions here, so I’d like to set the record straight and explain what I can.', NULL, '2021-03-12'),
('COMP0024', '2021-1', '3', 4, 4, 'I understand your feelings, and I know it’s frustrating when you feel your questions aren’t being answered. In the future, though, please bring your concerns directly to me. When you share them with y', NULL, '2021-03-12'),
('COMP0024', '2021-1', '3', 5, 1, 'This morning you left our team meeting early. I could tell you were frustrated by the discussion, but walking out on your teammates doesn’t show them the same respect they show you during the conflict', NULL, '2021-03-12'),
('COMP0024', '2021-1', '3', 6, 5, ' I wanted to check-in and see how you felt about your work this week. Samika mentioned that you used a sarcastic tone with her in a meeting and it made her uncomfortable. We need to be able to functio', NULL, '2021-03-12');

--
-- 转储表的索引
--

--
-- 表的索引 `CurrentYearTerm`
--
ALTER TABLE `CurrentYearTerm`
  ADD PRIMARY KEY (`employeeID`);

--
-- 表的索引 `Lecturer`
--
ALTER TABLE `Lecturer`
  ADD PRIMARY KEY (`employeeID`);

--
-- 表的索引 `LoginInfo`
--
ALTER TABLE `LoginInfo`
  ADD PRIMARY KEY (`username`);

--
-- 表的索引 `ModStuTe`
--
ALTER TABLE `ModStuTe`
  ADD PRIMARY KEY (`studentSPR`,`moduleCode`,`yearTerm`);

--
-- 表的索引 `Module`
--
ALTER TABLE `Module`
  ADD PRIMARY KEY (`moduleCode`,`yearTerm`);

--
-- 表的索引 `ProjectInfo`
--
ALTER TABLE `ProjectInfo`
  ADD PRIMARY KEY (`teamNumber`,`moduleCode`,`yearTerm`);

--
-- 表的索引 `Student`
--
ALTER TABLE `Student`
  ADD PRIMARY KEY (`studentSPR`);

--
-- 表的索引 `StudentFeedback`
--
ALTER TABLE `StudentFeedback`
  ADD PRIMARY KEY (`studentSPR`,`weekNumber`,`moduleCode`,`yearTerm`);

--
-- 表的索引 `TA`
--
ALTER TABLE `TA`
  ADD PRIMARY KEY (`taStudentSPR`);

--
-- 表的索引 `TeamFeedback`
--
ALTER TABLE `TeamFeedback`
  ADD PRIMARY KEY (`teamNumber`,`weekNumber`,`moduleCode`,`yearTerm`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
