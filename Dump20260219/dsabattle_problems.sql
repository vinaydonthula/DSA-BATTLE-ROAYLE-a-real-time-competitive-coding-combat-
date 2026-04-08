-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: dsa-battle-royale-db-mail2rajeshgundu-4c32.i.aivencloud.com    Database: dsabattle
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '53f47c71-eace-11f0-8698-9efd7f30a6af:1-32,
7e3e1758-0b4e-11f1-b991-bad3cb2d64c5:1-149,
a18ddfbd-eb9a-11f0-8591-f298c6a704ae:1-24,
e1c24407-ec8e-11f0-a0d4-c20af4fa1780:1-29,
fae9379c-edf0-11f0-8270-f6a3777a6028:1-480';

--
-- Table structure for table `problems`
--

DROP TABLE IF EXISTS `problems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `problems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `input_format` text,
  `output_format` text,
  `constraints` text,
  `time_limit_ms` int DEFAULT '1000',
  `memory_limit_mb` int DEFAULT '256',
  `difficulty` enum('easy','medium','hard') NOT NULL,
  `starter_code` text,
  `created_by_admin` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by_admin` (`created_by_admin`),
  CONSTRAINT `problems_ibfk_1` FOREIGN KEY (`created_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `problems`
--

LOCK TABLES `problems` WRITE;
/*!40000 ALTER TABLE `problems` DISABLE KEYS */;
INSERT INTO `problems` VALUES (1,'Two Sum','Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',NULL,NULL,NULL,1000,256,'easy','function twoSum(nums, target) {\n  // your code here\n}',NULL,'2026-01-10 15:50:09'),(2,'Valid Parentheses','Given a string containing parentheses, determine if the input string is valid.',NULL,NULL,NULL,1000,256,'medium','function isValid(s) {\n  // your code here\n}',NULL,'2026-01-10 15:50:09'),(3,'Longest Substring Without Repeating Characters','Given a string s, find the length of the longest substring without repeating characters.',NULL,NULL,NULL,1000,256,'hard','function lengthOfLongestSubstring(s) {\n  // your code here\n}',NULL,'2026-01-10 15:50:09'),(4,'Two Sum','Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.','The first line contains an integer n (2 <= n <= 10^4) - the size of the array.\nThe second line contains n integers separated by spaces - the array elements.\nThe third line contains an integer target - the target sum.','Print two integers separated by space - the indices of the two numbers that add up to target.','- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9\n- Only one valid answer exists.',1000,256,'easy','',NULL,'2026-02-19 08:07:09'),(5,'Reverse Array','Given an array of integers, reverse the array and print the result.','The first line contains an integer n (1 <= n <= 10^5) - the size of the array.\nThe second line contains n integers separated by spaces - the array elements.','Print n integers separated by spaces - the reversed array.','- 1 <= n <= 10^5\n- -10^9 <= arr[i] <= 10^9',1000,256,'easy','',NULL,'2026-02-19 08:07:18');
/*!40000 ALTER TABLE `problems` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-19 17:48:03
