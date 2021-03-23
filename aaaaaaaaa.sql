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
DROP DATABASE IF EXISTS feedback;
CREATE DATABASE IF NOT EXISTS feedback;
CREATE SCHEMA IF NOT EXISTS feedback;
USE feedback;
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
('aaa', 'professor', 'West', 'John'),
('l111111', 'professor', 'HILL', 'Martin'),
('l222222', 'professor', 'SHAW', 'Patrick'),
('l333333', 'professor', 'JAMIESON', 'Qing'),
('l444444', 'professor', 'REILLY', 'Sunita');
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
('sss', 'sss', 'student'),
('s202001', 'sss', 'student'),
('ttt', 'ttt', 'TA'),
('t123401', 'ttt', 'TA');

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
('s202101', 'COMP0067', '1', '1'),
('s202102', 'COMP0067', '2', '1'),
('s202103', 'COMP0067', '3', '1'),
('s202104', 'COMP0067', '1', '2'),
('s202105', 'COMP0067', '2', '2'),
('s202106', 'COMP0067', '3', '2'),
('s202107', 'COMP0067', '1', '3'),
('s202108', 'COMP0067', '2', '3'),
('s202109', 'COMP0067', '3', '3'),

('s202101', 'COMP00142', '1', '1'),
('s202102', 'COMP00142', '2', '1'),
('s202103', 'COMP00142', '3', '1'),
('s202104', 'COMP00142', '1', '2'),
('s202105', 'COMP00142', '2', '2'),
('s202106', 'COMP00142', '3', '2'),
('s202107', 'COMP00142', '1', '3'),
('s202108', 'COMP00142', '2', '3'),
('s202109', 'COMP00142', '3', '3'),

('s202101', 'COMP0024', '1', '1'),
('s202109', 'COMP0024', '1', '2'),

('sss', 'COMP0067', '1', '4'),
('sss', 'COMP00142', '2', '4'),
('sss', 'COMP0024', '3', '4');

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
('COMP0024', 'Artificial Intelligence', 'This is a optional module in term 2.', 'week 1-2: ************\r\nweek 3-4: ************\r\nweek 5-6: ************\r\nweek 6-7: ************\r\nweek 7-8: ************', 'aaa'),
('COMP0077', 'Functional Programming', 'This is a optional module in term 2.', 'week 1-2: ************\r\nweek 3-4: ************\r\nweek 5-6: ************\r\nweek 6-7: ************\r\nweek 7-8: ************', 'aaa'),
('COMP00142', 'Machine Learning', 'This is a compulsory module in term 2.', 'week 1-2: ************\r\nweek 3-4: ************\r\nweek 5-6: ************\r\nweek 6-7: ************\r\nweek 7-8: ************', 'aaa'),
('COMP0067', 'App Engineering', 'This is a compulsory module in term 2.', 'week 1-2: ************\r\nweek 3-4: ************\r\nweek 5-6: ************\r\nweek 6-7: ************\r\nweek 7-8: ************', 'aaa');
-- --------------------------------------------------------

--
-- 表的结构 `ProjectInfo`
--

CREATE TABLE `ProjectInfo` (
  `moduleCode` varchar(45) NOT NULL,
  `teamNumber` varchar(10) NOT NULL,
  `taStudentSPR` varchar(45) DEFAULT NULL,
  `labCode` varchar(10) NOT NULL,
  `projectTitle` varchar(100) NOT NULL,
  `projectBrief` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `ProjectInfo`
--

INSERT INTO `ProjectInfo` (`moduleCode`, `teamNumber`, `taStudentSPR`, `labCode`, `projectTitle`, `projectBrief`) VALUES
('COMP0067', '1', 't123401', '', 'Traffic Light System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0067', '2', 't123401', '', 'Medical reservation app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0067', '3', 't123401', '', 'Algorithm optimization', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0067', '4', 't123401', '', 'help System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0067', '5', 't123402', '', 'NHS app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0067', '6', 't123402', '', 'text inprovement', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0067', '7', 't123403', '', 'webisite for clothes', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0067', '8', 't123403', '', 'music shop', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP0067', '9', 't123403', '', 'animal gllary', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),

('COMP00142', '1', 't123404', '', 'GP app', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP00142', '2', 't123404', '', 'GP app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP00142', '3', 't123405', '', 'GP app', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),
('COMP00142', '4', 't123405', '', 'GP app', 'A project to optimize the Q-learning algorism used in Enforcement Learning'),

('COMP0024', '1', 't123406', '', 'Traffic Light System', 'A system to help TAs to give feedback to students and lecturers to check the feedbacks'),
('COMP0024', '2', 't123406', '', 'Medical reservation app', 'An application installed in mobile phone to help patients reserve medical service'),
('COMP0024', '3', 't123406', '', 'help app', 'An application installed in mobile phone to help patients reserve medical service');
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
('s202101', 'SMITH', 'Tom', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 's202101@gamil.com', '', 'Yes', ''),
('s202102', 'BROWN', 'Tim', '2021-03-03 03:57:07', '', NULL, '', '', NULL, 's202102@gmail.com', '', 'Yes', ''),
('s202103', 'WILSON', 'John', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 's202103@gamil.com', '', 'Yes', ''),
('s202104', 'THOMSON', 'Jerry', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu3@gamil.com', '', 'Yes', ''),
('s202105', 'ROBERTSON', 'Joe', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu4@gamil.com', '', 'Yes', ''),
('s202106', 'CAMPBELL', 'Cindy', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu5@gamil.com', '', 'Yes', ''),
('s202107', 'STEWART', 'Ben', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu6@gamil.com', '', 'Yes', ''),
('s202108', 'ANDERSON', 'Kim', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu7@gmail.com', '', 'Yes', ''),
('s202109', 'MACDONALD', 'Lily', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu8@gmail.com', '', 'Yes', ''),

('s202110', 'BLACK', 'Bibi', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'vdfgdg1@gamil.com', '', 'Yes', ''),
('s202111', 'MACLEOD', 'Monica', '2021-03-03 03:57:07', '', NULL, '', '', NULL, 'gfdgd@gmail.com', '', 'Yes', ''),
('s202112', 'FINDLAY', 'Oscar', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'gfds@gamil.com', '', 'Yes', ''),
('s202113', 'MOORE', 'Mina', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'sfgdf@gamil.com', '', 'Yes', ''),
('s202114', 'CRAWFORD', 'Joe', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'sfgdfdgdfg@gamil.com', '', 'Yes', ''),
('s202115', 'CAMPBELL', 'Lan', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'fdgdfg@gamil.com', '', 'Yes', ''),
('s202116', 'STEWART', 'Ben', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'fgdfgdfgf@gamil.com', '', 'Yes', ''),
('s202117', 'ANDERSON', 'Suresh', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stu7@gmail.com', '', 'Yes', ''),
('s202118', 'MACDONALD', 'Lily', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'xcvzcv@gmail.com', '', 'Yes', ''),

('s202119', 'HENDERSON', 'ZhenZhen', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'dsgsd@gamil.com', '', 'Yes', ''),
('s202120', 'BROWN', 'Luz', '2021-03-03 03:57:07', '', NULL, '', '', NULL, 'zcxvxcv@gmail.com', '', 'Yes', ''),
('s202121', 'WILSON', 'John', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'jyjts@gamil.com', '', 'Yes', ''),
('s202122', 'THOMSON', 'Jerry', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'fdg545@gamil.com', '', 'Yes', ''),
('s202123', 'MACDONALD', 'Anne	', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', '45y45y@gamil.com', '', 'Yes', ''),
('s202124', 'CAMPBELL', 'Paulo', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'ghtgj9@gamil.com', '', 'Yes', ''),
('s202125', 'STEWART', 'Syed', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'gverytryre6@gamil.com', '', 'Yes', ''),
('s202126', 'ANDERSON', 'Kim', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'sgr37@gmail.com', '', 'Yes', ''),
('s202127', 'MACDONALD', 'Victoria', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'swvewverwtu8@gmail.com', '', 'Yes', ''),
('s202128', 'THOMSON', 'Irene', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stvbuyknu8@gmail.com', '', 'Yes', ''),
('s202129', 'MACDONALD', 'Adam', '2020-03-19 16:00:00', '', '', 'Master', 'CS', '', 'stuunyiium8@gmail.com', '', 'Yes', ''),
('sss', 'SCOTT', 'Anger', '2021-03-03 03:57:07', '', NULL, '', '', NULL, 'Anger.scott.20@gmail.com', '', 'Yes', '');

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
  `writtenFeedback` varchar(200) DEFAULT NULL,
  `messageLecturer` varchar(200) DEFAULT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `StudentFeedback`
--

INSERT INTO `StudentFeedback` (`studentSPR`, `moduleCode`, `weekNumber`, `score`, `contribution`, `writtenFeedback`, `date`) VALUES
('sss', 'COMP0067', '1', 4, '0.33', 'I really appreciated how you kept me up to date on X project this week — it helped me coordinate with our stakeholders, and I’m excited to share that we’re on track to launch. It’s also great to see your process. I’m impressed with the efficiencies you’re introducing.', '2021-3-12'),
('sss', 'COMP0067', '2', 4, '0.33', 'I’m curious about where we are with Y project. If any issues have come up, it’s best that I know as soon as possible so I can help you get back on target. How about you shoot me daily updates just so I know where we are?', '2021-3-12'),
('sss', 'COMP0067', '3', 4, '0.33', 'I can’t help but notice that this is the third deadline that’s caught up to you this month. I understand this is a fast-paced environment, and I think you’d be more effective if we rethought your time management strategies.', '2021-3-12'),
('sss', 'COMP0067', '4', 4, '0.33', 'Thanks for letting me know you’re running behind schedule on this project. Let’s take a look at your goals and see how you’re spending your time — I bet there are opportunities for efficiencies there.', '2021-3-12'),
('sss', 'COMP0067', '5', 4, '0.33', 'It’d be great to see you take on fewer projects, or narrow your focus to be more attainable. What do you think?', ''),
('sss', 'COMP0067', '6', 4, '0.33', 'Your work on X, Y and Z were solid, valuable accomplishments this quarter. I know you didn’t complete every goal you set, and that’s okay — it’s great to see you reach high. But I recognize that it can be discouraging, too. So let’s take this opportunity to rethink your goals moving forward.', '2021-3-12'),
('sss', 'COMP0067', '7', 4, '0.33', 'You know I’ve always appreciated your grasp of our larger vision, and it’s great that you see big-picture. But you’ve missed out on some smaller details in your last few projects, like X and Y. Unfortunately, that ultimately set the team back because they had to correct those oversights.', '2021-3-12'),
('sss', 'COMP0067', '8', 4, '0.33', 'I’d love for you to keep that big-picture vision while working on those little blind spots. For your next project, let’s put together a detailed checklist of all your deliverables to make sure you don’t miss anything. Give it a shot, then let’s follow up and reassess from there.', '2021-3-12'),
('sss', 'COMP0067', '9', 4, '0.33', 'You did a fantastic job collaborating with your team last week, but I worry that you may have derailed Howie by seeking his help with X. I’ve seen you work, and I’m confident that if you’d thought about it a little longer, you could have come up with a solution on your own. I know you can do it. Do you believe you can?', '2021-3-12'),
('sss', 'COMP0067', '10', 4, '0.33', 'It’d be great to see you tap into your resourcefulness and apply it to problem-solving before reaching out to others. Try sitting with an issue for 5 minutes before you reach out to anybody else.  If this doesn’t work, check in with me and we can come up with a solution.', '2021-3-12'),
('sss', 'COMP00142', '1', 4, '0.33', 'I wanted to check in and see how things are going. You don’t seem to be quite as engaged at work lately — is there something I can do to help you get back on track? I’d like to keep you happy here. Let’s set a time to review your goals and responsibilities and make sure we’re on the same page.', '2021-3-12'),
('sss', 'COMP00142', '2', 4, '0.33', 'I’m glad we’re taking the time to check-in. I feel like you haven’t been as happy at work lately. How do you feel? Is there something I can do to help you have a better experience here?', '2021-3-12'),
('sss', 'COMP00142', '3', 4, '0.33', 'I know there are a lot of rumors flying around about X, and I know you’re concerned about it. I value your trust and contributions here, so I’d like to set the record straight and explain what I can.', '2021-3-12'),
('sss', 'COMP00142', '4', 4, '0.33', 'I understand your feelings, and I know it’s frustrating when you feel your questions aren’t being answered. In the future, though, please bring your concerns directly to me. When you share them with your teammates, it creates a company culture of fear and negativity without providing answers.', '2021-3-12'),
('sss', 'COMP00142', '5', 1, '0.33', 'This morning you left our team meeting early. I could tell you were frustrated by the discussion, but walking out on your teammates doesn’t show them the same respect they show you during the conflict. How can we find a solution moving forward?', '2021-3-12'),
('sss', 'COMP00142', '6', 5, '0.33', ' I wanted to check-in and see how you felt about your work this week. Samika mentioned that you used a sarcastic tone with her in a meeting and it made her uncomfortable. We need to be able to function as a team, and I was hoping to hear your side of the story to see if everything is okay.', '2021-3-12'),
('sss', 'COMP0024', '1', 4, '0.33', 'I wanted to check in and see how things are going. You don’t seem to be quite as engaged at work lately — is there something I can do to help you get back on track? I’d like to keep you happy here. Let’s set a time to review your goals and responsibilities and make sure we’re on the same page.', '2021-3-12'),
('sss', 'COMP0024', '2', 4, '0.33', 'I’m glad we’re taking the time to check-in. I feel like you haven’t been as happy at work lately. How do you feel? Is there something I can do to help you have a better experience here?', '2021-3-12'),
('sss', 'COMP0024', '3', 4, '0.33', 'I know there are a lot of rumors flying around about X, and I know you’re concerned about it. I value your trust and contributions here, so I’d like to set the record straight and explain what I can.', '2021-3-12'),
('sss', 'COMP0024', '4', 4, '0.33', 'I understand your feelings, and I know it’s frustrating when you feel your questions aren’t being answered. In the future, though, please bring your concerns directly to me. When you share them with your teammates, it creates a company culture of fear and negativity without providing answers.', '2021-3-12'),
('sss', 'COMP0024', '5', 1, '0.33', 'This morning you left our team meeting early. I could tell you were frustrated by the discussion, but walking out on your teammates doesn’t show them the same respect they show you during the conflict. How can we find a solution moving forward?', '2021-3-12'),
('sss', 'COMP0024', '6', 5, '0.33', ' I wanted to check-in and see how you felt about your work this week. Samika mentioned that you used a sarcastic tone with her in a meeting and it made her uncomfortable. We need to be able to function as a team, and I was hoping to hear your side of the story to see if everything is okay.', '2021-3-12');

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
('t123401', 'WALKER', 'Ali', 't123401@gamil.com', 'Doctor'),
('t123402', 'YOUNG', 'Ying', 't123fhghr402@gamil.com', 'Doctor'),
('t123403', 'MILLER', 'James', 'tghfdgfhfdhgfdh403@gamil.com', 'Doctor'),
('t123404', 'Lee', 'Anne', 't1hfgfhgfhgfh401@gamil.com', 'Doctor'),
('t123405', 'Harris', 'Michel', 'dghdgfhgfh@gamil.com', 'Doctor'),
('t123406', 'Hall', 'Albert', 't12hdhgfdhfh1@gamil.com', 'Doctor'),
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
  `messageLecturer` varchar(200) DEFAULT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- 转存表中的数据 `TeamFeedback`
--

INSERT INTO `TeamFeedback` (`moduleCode`, `teamNumber`, `weekNumber`, `score`,  `writtenFeedback`,  `date`) VALUES
('COMP0067', 1, '1', 4, 'I really appreciated how you kept me up to date on X project this week — it helped me coordinate with our stakeholders, and I’m excited to share that we’re on track to launch. It’s also great to see your process. I’m impressed with the efficiencies you’re introducing.', '2021-3-12'),
('COMP0067',1, '2', 4, 'I’m curious about where we are with Y project. If any issues have come up, it’s best that I know as soon as possible so I can help you get back on target. How about you shoot me daily updates just so I know where we are?', '2021-3-12'),
('COMP0067',1, '3', 4,  'I can’t help but notice that this is the third deadline that’s caught up to you this month. I understand this is a fast-paced environment, and I think you’d be more effective if we rethought your time management strategies.', '2021-3-12'),
('COMP0067',1, '4', 4,  'Thanks for letting me know you’re running behind schedule on this project. Let’s take a look at your goals and see how you’re spending your time — I bet there are opportunities for efficiencies there.', '2021-3-12'),
('COMP0067',1, '5', 4,  'It’d be great to see you take on fewer projects, or narrow your focus to be more attainable. What do you think?', ''),
('COMP0067',1, '6', 4,  'Your work on X, Y and Z were solid, valuable accomplishments this quarter. I know you didn’t complete every goal you set, and that’s okay — it’s great to see you reach high. But I recognize that it can be discouraging, too. So let’s take this opportunity to rethink your goals moving forward.', '2021-3-12'),
('COMP0067',1, '7', 4,  'You know I’ve always appreciated your grasp of our larger vision, and it’s great that you see big-picture. But you’ve missed out on some smaller details in your last few projects, like X and Y. Unfortunately, that ultimately set the team back because they had to correct those oversights.', '2021-3-12'),
('COMP0067',1, '8', 4,  'I’d love for you to keep that big-picture vision while working on those little blind spots. For your next project, let’s put together a detailed checklist of all your deliverables to make sure you don’t miss anything. Give it a shot, then let’s follow up and reassess from there.', '2021-3-12'),
('COMP0067',1, '9', 4,  'You did a fantastic job collaborating with your team last week, but I worry that you may have derailed Howie by seeking his help with X. I’ve seen you work, and I’m confident that if you’d thought about it a little longer, you could have come up with a solution on your own. I know you can do it. Do you believe you can?', '2021-3-12'),
('COMP0067',1, '10', 4,  'It’d be great to see you tap into your resourcefulness and apply it to problem-solving before reaching out to others. Try sitting with an issue for 5 minutes before you reach out to anybody else.  If this doesn’t work, check in with me and we can come up with a solution.', '2021-3-12'),
('COMP00142',2, '1', 4,  'I wanted to check in and see how things are going. You don’t seem to be quite as engaged at work lately — is there something I can do to help you get back on track? I’d like to keep you happy here. Let’s set a time to review your goals and responsibilities and make sure we’re on the same page.', '2021-3-12'),
('COMP00142',2, '2', 4,  'I’m glad we’re taking the time to check-in. I feel like you haven’t been as happy at work lately. How do you feel? Is there something I can do to help you have a better experience here?', '2021-3-12'),
('COMP00142',2,'3', 4,  'I know there are a lot of rumors flying around about X, and I know you’re concerned about it. I value your trust and contributions here, so I’d like to set the record straight and explain what I can.', '2021-3-12'),
('COMP00142',2, '4', 4,  'I understand your feelings, and I know it’s frustrating when you feel your questions aren’t being answered. In the future, though, please bring your concerns directly to me. When you share them with your teammates, it creates a company culture of fear and negativity without providing answers.', '2021-3-12'),
('COMP00142',2, '5', 1,  'This morning you left our team meeting early. I could tell you were frustrated by the discussion, but walking out on your teammates doesn’t show them the same respect they show you during the conflict. How can we find a solution moving forward?', '2021-3-12'),
('COMP00142',2, '6', 5,  ' I wanted to check-in and see how you felt about your work this week. Samika mentioned that you used a sarcastic tone with her in a meeting and it made her uncomfortable. We need to be able to function as a team, and I was hoping to hear your side of the story to see if everything is okay.', '2021-3-12'),
('COMP0024',3, '1', 4,  'I wanted to check in and see how things are going. You don’t seem to be quite as engaged at work lately — is there something I can do to help you get back on track? I’d like to keep you happy here. Let’s set a time to review your goals and responsibilities and make sure we’re on the same page.', '2021-3-12'),
('COMP0024',3, '2', 4,  'I’m glad we’re taking the time to check-in. I feel like you haven’t been as happy at work lately. How do you feel? Is there something I can do to help you have a better experience here?', '2021-3-12'),
('COMP0024',3, '3', 4,  'I know there are a lot of rumors flying around about X, and I know you’re concerned about it. I value your trust and contributions here, so I’d like to set the record straight and explain what I can.', '2021-3-12'),
('COMP0024',3, '4', 4,  'I understand your feelings, and I know it’s frustrating when you feel your questions aren’t being answered. In the future, though, please bring your concerns directly to me. When you share them with your teammates, it creates a company culture of fear and negativity without providing answers.', '2021-3-12'),
('COMP0024',3, '5', 1,  'This morning you left our team meeting early. I could tell you were frustrated by the discussion, but walking out on your teammates doesn’t show them the same respect they show you during the conflict. How can we find a solution moving forward?', '2021-3-12'),
('COMP0024',3, '6', 5,  ' I wanted to check-in and see how you felt about your work this week. Samika mentioned that you used a sarcastic tone with her in a meeting and it made her uncomfortable. We need to be able to function as a team, and I was hoping to hear your side of the story to see if everything is okay.', '2021-3-12');

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
