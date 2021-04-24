-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- 主机： localhost
-- 生成日期： 2021-04-24 21:22:02
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
('s202101', 'sss', 'student'),
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
('s202101', 'COMP004', '2021-1', '1', '1'),
('s202101', 'COMP0067', '2021-1', '1', '1'),
('s202101', 'COMP0071', '2021-1', '1', '1'),
('s202101', 'COMP0077', '2021-1', '1', '1'),
('s202102', 'COMP0067', '2021-1', '3', '1'),
('s202102', 'COMP0071', '2021-1', '3', '1'),
('s202102', 'COMP0077', '2021-1', '3', '1'),
('s202103', 'COMP0067', '2021-1', '2', '1'),
('s202103', 'COMP0071', '2021-1', '2', '1'),
('s202103', 'COMP0077', '2021-1', '2', '1'),
('s202104', 'COMP0067', '2021-1', '3', '2'),
('s202104', 'COMP0071', '2021-1', '3', '2'),
('s202104', 'COMP0077', '2021-1', '3', '2'),
('s202105', 'COMP004', '2021-1', '1', '2'),
('s202105', 'COMP0067', '2021-1', '1', '2'),
('s202105', 'COMP0071', '2021-1', '1', '2'),
('s202105', 'COMP0077', '2021-1', '1', '2'),
('s202106', 'COMP0067', '2021-1', '2', '2'),
('s202106', 'COMP0071', '2021-1', '2', '2'),
('s202106', 'COMP0077', '2021-1', '2', '2'),
('s202107', 'COMP0067', '2021-1', '2', '3'),
('s202107', 'COMP0071', '2021-1', '2', '3'),
('s202107', 'COMP0077', '2021-1', '2', '3'),
('s202108', 'COMP004', '2021-1', '1', '3'),
('s202108', 'COMP0067', '2021-1', '1', '3'),
('s202108', 'COMP0071', '2021-1', '1', '3'),
('s202108', 'COMP0077', '2021-1', '1', '3'),
('s202109', 'COMP0067', '2021-1', '3', '3'),
('s202109', 'COMP0071', '2021-1', '3', '3'),
('s202109', 'COMP0077', '2021-1', '3', '3'),
('s202110', 'COMP0071', '2021-1', '4', '3'),
('s202110', 'COMP0077', '2021-1', '4', '3'),
('s202111', 'COMP0067', '2021-1', '4', '1'),
('s202111', 'COMP0071', '2021-1', '4', '1'),
('s202111', 'COMP0077', '2021-1', '4', '1'),
('s202112', 'COMP0067', '2021-1', '4', '2'),
('s202112', 'COMP0071', '2021-1', '4', '2'),
('s202112', 'COMP0077', '2021-1', '4', '2'),
('s202113', 'COMP0071', '2021-1', '1', '4'),
('s202113', 'COMP0077', '2021-1', '1', '4'),
('s202114', 'COMP0071', '2021-1', '2', '4'),
('s202114', 'COMP0077', '2021-1', '2', '4'),
('sss', 'COMP0067', '2021-1', '4', '3');

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
('COMP0067', '2021-1', 10, 'App Engineering', 'This is a compulsory module', 'Week1: ***********************\r\nWeek2: ***********************\r\nWeek3: ***********************\r\nWeek4: ***********************\r\nWeek5: ***********************', './public/images/COMP0067.png', 'l111111'),
('COMP0071', '2021-1', 10, 'Software Engineering', 'This is an optional module.', 'week1 : ************\r\nweek2 : ************\r\nweek3 : ************\r\n......\r\nweek10 : ************', './public/images/COMP0071.jpg', 'l111111'),
('COMP0077', '2021-1', 10, 'App Engineering 10', '123', '123', './public/images/COMP0077.jpg', 'l111111');

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
('COMP0067', '2021-1', '1', 't123401', '', 'Traffic Light System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0071', '2021-1', '1', 't123401', '', 'Traffic Light System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0077', '2021-1', '1', 't123401', '', 'Traffic Light System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0067', '2021-1', '2', 't123402', '', 'Medical reservation app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0071', '2021-1', '2', 't123402', '', 'Medical reservation app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0077', '2021-1', '2', 't123402', '', 'Medical reservation app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0067', '2021-1', '3', 't123401', '', 'Algorithm optimization', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0071', '2021-1', '3', 't123401', '', 'Algorithm optimization', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0077', '2021-1', '3', 't123401', '', 'Algorithm optimization', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0067', '2021-1', '4', 't123403', '', 'Land Scape', 'A project to eatablish a model to analysis the sound for medical use'),
('COMP0071', '2021-1', '4', 't123403', '', 'Land Scape', 'A project to eatablish a model to analysis the sound for medical use'),
('COMP0077', '2021-1', '4', 't123403', '', 'Land Scape', 'A project to eatablish a model to analysis the sound for medical use');

-- --------------------------------------------------------

--
-- 表的结构 `Student`
--

CREATE TABLE `Student` (
  `studentSPR` varchar(45) NOT NULL,
  `studentNumber` varchar(20) DEFAULT NULL,
  `surname` varchar(45) NOT NULL,
  `forename` varchar(45) NOT NULL,
  `email` varchar(45) NOT NULL,
  `fileLocation` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `Student`
--

INSERT INTO `Student` (`studentSPR`, `studentNumber`, `surname`, `forename`, `email`, `fileLocation`) VALUES
('s202101', '1', 'SMITH', 'Tom', 's202101@gamil.com', 's202101.jpeg'),
('s202102', '2', 'BROWN', 'Tim', 's202102@gmail.com', 's202102.jpeg'),
('s202103', '3', 'WILSON', 'John', 's202103@gamil.com', 's202103.jpeg'),
('s202104', '4', 'MACDONALD', 'Anne ', '45y45y@gamil.com', 'undefined'),
('s202105', '5', 'CAMPBELL', 'Paulo', 'ghtgj9@gamil.com', 's202105.jpeg'),
('s202106', '6', 'STEWART', 'Syed', 'gverytryre6@gamil.com', 's202106.jpeg'),
('s202107', '7', 'ANDERSON', 'Kim', 'sgr37@gmail.com', 's202107.jpeg'),
('s202108', '8', 'MACDONALD', 'Victoria', 'swvewverwtu8@gmail.com', 'undefined'),
('s202109', '9', 'THOMSON', 'Irene', 'stvbuyknu8@gmail.com', 's202109.jpeg'),
('s202110', '110', 'MACDONALD', 'Adam', 'stuunyiium8@gmail.com', 's202110.jpeg'),
('s202111', '111', 'SCOTT', 'Anger', 'Anger.scott.20@gmail.com', 's202111.jpeg'),
('s202112', '112', 'FINDLAY', 'Oscar', 'gfds@gamil.com', 's202112.jpeg'),
('s202113', '113', 'MOORE', 'Mina', 'sfgdf@gamil.com', 's202113.jpeg'),
('s202114', '114', 'CRAWFORD', 'Joe', 'sfgdfdgdfg@gamil.com', 'undefined');

-- --------------------------------------------------------

--
-- 表的结构 `StudentFeedback`
--

CREATE TABLE `StudentFeedback` (
  `studentSPR` varchar(45) NOT NULL,
  `moduleCode` varchar(45) NOT NULL,
  `yearTerm` varchar(20) NOT NULL,
  `weekNumber` int(10) NOT NULL,
  `score` int(10) NOT NULL,
  `contribution` int(10) DEFAULT NULL,
  `writtenFeedback` varchar(200) DEFAULT NULL,
  `messageLecturer` varchar(200) DEFAULT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `StudentFeedback`
--

INSERT INTO `StudentFeedback` (`studentSPR`, `moduleCode`, `yearTerm`, `weekNumber`, `score`, `contribution`, `writtenFeedback`, `messageLecturer`, `date`) VALUES
('s202101', 'COMP0067', '2021-1', 1, 1, 33, 'bad Tom', 'bad', '2021-04-24'),
('s202101', 'COMP0077', '2021-1', 1, 1, 25, '1', 'bad 3', '2021-04-24'),
('s202101', 'COMP0067', '2021-1', 2, 1, 33, 'absent', 'absent', '2021-04-24'),
('s202101', 'COMP0077', '2021-1', 2, 1, 25, '1', 'absent', '2021-04-24'),
('s202105', 'COMP0067', '2021-1', 1, 2, 33, 'bad Joe 3', 'bad', '2021-04-24'),
('s202105', 'COMP0077', '2021-1', 1, 1, 25, '22', 'bad 3', '2021-04-24'),
('s202105', 'COMP0067', '2021-1', 2, 1, 34, 'absent3', 'absent', '2021-04-24'),
('s202105', 'COMP0077', '2021-1', 2, 2, 25, '2', 'absent', '2021-04-24'),
('s202108', 'COMP0067', '2021-1', 1, 1, 34, 'bad Kim 3', 'bad', '2021-04-24'),
('s202108', 'COMP0077', '2021-1', 1, 2, 25, '33', 'bad 3', '2021-04-24'),
('s202108', 'COMP0067', '2021-1', 2, 1, 33, 'absent2', 'absent', '2021-04-24'),
('s202108', 'COMP0077', '2021-1', 2, 1, 25, '3', 'absent', '2021-04-24'),
('s202113', 'COMP0077', '2021-1', 1, 1, 25, '4', 'bad 3', '2021-04-24'),
('s202113', 'COMP0077', '2021-1', 2, 1, 25, '4', 'absent', '2021-04-24');

-- --------------------------------------------------------

--
-- 表的结构 `StudentNeedAttention`
--

CREATE TABLE `StudentNeedAttention` (
  `studentSPR` varchar(45) NOT NULL,
  `moduleCode` varchar(45) NOT NULL,
  `yearTerm` varchar(6) NOT NULL,
  `weekNumber` int(10) NOT NULL,
  `state` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `StudentNeedAttention`
--

INSERT INTO `StudentNeedAttention` (`studentSPR`, `moduleCode`, `yearTerm`, `weekNumber`, `state`) VALUES
('s202101', 'COMP0067', '2021-1', 2, 0),
('s202101', 'COMP0077', '2021-1', 2, 0),
('s202108', 'COMP0067', '2021-1', 2, 0),
('s202113', 'COMP0077', '2021-1', 2, 0);

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
  `score` int(10) NOT NULL,
  `writtenFeedback` varchar(200) DEFAULT NULL,
  `messageLecturer` varchar(200) DEFAULT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `TeamFeedback`
--

INSERT INTO `TeamFeedback` (`moduleCode`, `yearTerm`, `teamNumber`, `weekNumber`, `score`, `writtenFeedback`, `messageLecturer`, `date`) VALUES
('COMP0067', '2021-1', '1', 1, 1, 'bad3', 'bad', '2021-04-24'),
('COMP0077', '2021-1', '1', 1, 1, 'bad 3', 'bad 3', '2021-04-24'),
('COMP0067', '2021-1', '1', 2, 1, 'absent', 'absent', '2021-04-24'),
('COMP0077', '2021-1', '1', 2, 1, 'absent', 'absent', '2021-04-24');

-- --------------------------------------------------------

--
-- 表的结构 `TeamNeedAttention`
--

CREATE TABLE `TeamNeedAttention` (
  `teamNumber` varchar(10) NOT NULL,
  `moduleCode` varchar(45) NOT NULL,
  `yearTerm` varchar(6) NOT NULL,
  `weekNumber` int(10) NOT NULL,
  `state` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `TeamNeedAttention`
--

INSERT INTO `TeamNeedAttention` (`teamNumber`, `moduleCode`, `yearTerm`, `weekNumber`, `state`) VALUES
('1', 'COMP0067', '2021-1', 2, 0),
('1', 'COMP0077', '2021-1', 2, 1);

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
-- 表的索引 `StudentNeedAttention`
--
ALTER TABLE `StudentNeedAttention`
  ADD PRIMARY KEY (`studentSPR`,`moduleCode`,`yearTerm`,`weekNumber`);

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

--
-- 表的索引 `TeamNeedAttention`
--
ALTER TABLE `TeamNeedAttention`
  ADD PRIMARY KEY (`teamNumber`,`moduleCode`,`yearTerm`,`weekNumber`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
