-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- 主机： localhost
-- 生成日期： 2021-03-15 23:08:16
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
-- 数据库： `feedbackSystem`
--

-- --------------------------------------------------------

--
-- 表的结构 `Lecturer`
--

CREATE TABLE `Lecturer` (
  `employeeID` varchar(45) NOT NULL,
  `title` varchar(45) NOT NULL,
  `surname` varchar(45) NOT NULL,
  `forename` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `Lecturer`
--

INSERT INTO `Lecturer` (`employeeID`, `title`, `surname`, `forename`) VALUES
('aaa', 'professor', 'John', 'West');

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
('aaa', 'aaa', 'lecturer');

-- --------------------------------------------------------

--
-- 表的结构 `ModStuTe`
--

CREATE TABLE `ModStuTe` (
  `studentSPR` varchar(45) NOT NULL,
  `moduleCode` varchar(45) NOT NULL,
  `teamNumber` varchar(10) DEFAULT NULL,
  `memberIndex` varchar(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `ModStuTe`
--

INSERT INTO `ModStuTe` (`studentSPR`, `moduleCode`, `teamNumber`, `memberIndex`) VALUES
('stu1', 'COMP0067', '1', '1'),
('stu2', 'COMP0067', '2', '1'),
('stu3', 'COMP0067', '3', '1'),
('stu4', 'COMP0067', '1', '2'),
('stu5', 'COMP0067', '2', '2'),
('stu6', 'COMP0067', '3', '2'),
('stu7', 'COMP0067', '1', '3'),
('stu8', 'COMP0067', '2', '3'),
('stu9', 'COMP0067', '3', '3');

-- --------------------------------------------------------

--
-- 表的结构 `ModTeTA`
--

CREATE TABLE `ModTeTA` (
  `moduleCode` varchar(45) NOT NULL,
  `teamNumber` varchar(10) NOT NULL,
  `taStudentSPR` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `ModTeTA`
--

INSERT INTO `ModTeTA` (`moduleCode`, `teamNumber`, `taStudentSPR`) VALUES
('COMP0067', '1', 'TA1'),
('COMP0067', '2', 'TA2'),
('COMP0067', '3', 'TA2');

-- --------------------------------------------------------

--
-- 表的结构 `Module`
--

CREATE TABLE `Module` (
  `moduleCode` varchar(10) NOT NULL,
  `moduleName` varchar(100) DEFAULT NULL,
  `moduleDescription` varchar(200) DEFAULT NULL,
  `modulePlan` varchar(500) DEFAULT NULL,
  `employeeID` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `Module`
--

INSERT INTO `Module` (`moduleCode`, `moduleName`, `moduleDescription`, `modulePlan`, `employeeID`) VALUES
('COMP0067', 'App Engineering', 'This is a compulsory module in term 2.', 'week 1-2: ************\r\nweek 3-4: ************\r\nweek 5-6: ************\r\nweek 6-7: ************\r\nweek 7-8: ************', 'aaa');

-- --------------------------------------------------------

--
-- 表的结构 `ProjectInfo`
--

CREATE TABLE `ProjectInfo` (
  `moduleCode` varchar(45) NOT NULL,
  `teamNumber` varchar(10) NOT NULL,
  `labCode` varchar(10) NOT NULL,
  `projectTitle` varchar(100) NOT NULL,
  `projectBrief` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `ProjectInfo`
--

INSERT INTO `ProjectInfo` (`moduleCode`, `teamNumber`, `labCode`, `projectTitle`, `projectBrief`) VALUES
('COMP0067', '1', '', 'Traffic Light System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0067', '2', '', 'Medical reservation app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0067', '3', '', 'Algorithm optimization', 'A project to optimize the Q-learning algorism used in Enforcement Learning');

-- --------------------------------------------------------

--
-- 表的结构 `Student`
--

CREATE TABLE `Student` (
  `studentSPR` varchar(45) NOT NULL,
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

INSERT INTO `Student` (`studentSPR`, `surname`, `forename`, `registrationDate`, `routeCode`, `routeName`, `degreeLevel`, `department`, `modeOfAttendance`, `email`, `optionalCompulsory`, `enrolmentStatus`, `fileLocation`) VALUES
('stu1', 'stu1', 'stu1', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu1@gamil.com', '', 'Yes', ''),
('stu10', 'stu10', 'stu10', '2021-03-03 03:57:07', '', NULL, '', '', NULL, 'stu10@gmail.com', '', 'Yes', ''),
('stu2', 'stu2', 'stu2', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu2@gamil.com', '', 'Yes', ''),
('stu3', 'stu3', 'stu3', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu3@gamil.com', '', 'Yes', ''),
('stu4', 'stu4', 'stu4', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu4@gamil.com', '', 'Yes', ''),
('stu5', 'stu5', 'stu5', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu5@gamil.com', '', 'Yes', ''),
('stu6', 'stu6', 'stu6', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu6@gamil.com', '', 'Yes', ''),
('stu7', 'stu7', 'stu7', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu7@gmail.com', '', 'Yes', ''),
('stu8', 'stu8', 'stu8', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu8@gmail.com', '', 'Yes', ''),
('stu9', 'stu9', 'stu9', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu9@gmail.com', '', 'Yes', '');

-- --------------------------------------------------------

--
-- 表的结构 `StudentFeedback`
--

CREATE TABLE `StudentFeedback` (
  `studentSPR` varchar(45) NOT NULL,
  `moduleCode` varchar(45) NOT NULL,
  `weekNumber` varchar(10) NOT NULL,
  `score` int(11) NOT NULL,
  `contribution` decimal(10,2) DEFAULT NULL,
  `writtenFeedbaack` varchar(200) DEFAULT NULL,
  `messageLecturer` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `StudentFeedback`
--

INSERT INTO `StudentFeedback` (`studentSPR`, `moduleCode`, `weekNumber`, `score`, `contribution`, `writtenFeedbaack`, `messageLecturer`) VALUES
('stu1', 'COMP0067', '1', 4, '0.33', 'Good job', ''),
('stu1', 'COMP0067', '2', 4, '0.33', 'Good job', ''),
('stu2', 'COMP0067', '1', 4, '0.33', 'Good job', ''),
('stu2', 'COMP0067', '2', 4, '0.33', 'Good job', ''),
('stu3', 'COMP0067', '1', 4, '0.33', 'Good job', ''),
('stu3', 'COMP0067', '2', 4, '0.33', 'Good job', ''),
('stu4', 'COMP0067', '1', 4, '0.33', 'Good job', ''),
('stu4', 'COMP0067', '2', 4, '0.33', 'Good job', ''),
('stu5', 'COMP0067', '1', 4, '0.33', 'Good job', ''),
('stu5', 'COMP0067', '2', 4, '0.33', 'Good job', ''),
('stu6', 'COMP0067', '1', 4, '0.33', 'Good job', ''),
('stu6', 'COMP0067', '2', 4, '0.33', 'Good job', ''),
('stu7', 'COMP0067', '1', 4, '0.33', 'Good job', ''),
('stu7', 'COMP0067', '2', 4, '0.33', 'Good job', ''),
('stu8', 'COMP0067', '1', 4, '0.33', 'Good job', ''),
('stu8', 'COMP0067', '2', 4, '0.33', 'Good job', ''),
('stu9', 'COMP0067', '1', 4, '0.33', 'Good job', ''),
('stu9', 'COMP0067', '2', 4, '0.33', 'Good job', '');

-- --------------------------------------------------------

--
-- 表的结构 `TA`
--

CREATE TABLE `TA` (
  `taStudentSPR` varchar(11) NOT NULL,
  `surname` varchar(45) NOT NULL,
  `forename` varchar(45) NOT NULL,
  `email` varchar(45) NOT NULL,
  `degree` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `TA`
--

INSERT INTO `TA` (`taStudentSPR`, `surname`, `forename`, `email`, `degree`) VALUES
('TA2', 'TA2', 'TA2', 'TA2@gamil.com', 'Doctor'),
('TA3', 'TA3', 'TA3', 'TA3@gamil.com', 'Doctor'),
('ttt', 'TA1', 'TA1', 'TA1@gamil.com', 'Doctor');

-- --------------------------------------------------------

--
-- 表的结构 `TeamFeedback`
--

CREATE TABLE `TeamFeedback` (
  `moduleCode` varchar(45) NOT NULL,
  `teamNumber` varchar(10) NOT NULL,
  `weekNumber` varchar(10) NOT NULL,
  `score` int(11) NOT NULL,
  `writtenFeedback` varchar(200) DEFAULT NULL,
  `messageLecturer` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转储表的索引
--

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
  ADD PRIMARY KEY (`studentSPR`,`moduleCode`);

--
-- 表的索引 `ModTeTA`
--
ALTER TABLE `ModTeTA`
  ADD PRIMARY KEY (`moduleCode`,`teamNumber`);

--
-- 表的索引 `Module`
--
ALTER TABLE `Module`
  ADD PRIMARY KEY (`moduleCode`);

--
-- 表的索引 `ProjectInfo`
--
ALTER TABLE `ProjectInfo`
  ADD PRIMARY KEY (`moduleCode`,`teamNumber`);

--
-- 表的索引 `Student`
--
ALTER TABLE `Student`
  ADD PRIMARY KEY (`studentSPR`);

--
-- 表的索引 `StudentFeedback`
--
ALTER TABLE `StudentFeedback`
  ADD PRIMARY KEY (`studentSPR`,`moduleCode`,`weekNumber`);

--
-- 表的索引 `TA`
--
ALTER TABLE `TA`
  ADD PRIMARY KEY (`taStudentSPR`);

--
-- 表的索引 `TeamFeedback`
--
ALTER TABLE `TeamFeedback`
  ADD PRIMARY KEY (`moduleCode`,`teamNumber`,`weekNumber`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
