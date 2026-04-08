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
-- Table structure for table `matches`
--

DROP TABLE IF EXISTS `matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `player1_id` int NOT NULL,
  `player2_id` int NOT NULL,
  `difficulty` enum('easy','medium','hard') NOT NULL,
  `player1_hp` int DEFAULT '100',
  `player2_hp` int DEFAULT '100',
  `status` enum('waiting','active','completed') DEFAULT 'waiting',
  `winner_id` int DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `problem_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `player2_id` (`player2_id`),
  KEY `winner_id` (`winner_id`),
  KEY `idx_match_players` (`player1_id`,`player2_id`),
  CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`player1_id`) REFERENCES `users` (`id`),
  CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`player2_id`) REFERENCES `users` (`id`),
  CONSTRAINT `matches_ibfk_3` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matches`
--

LOCK TABLES `matches` WRITE;
/*!40000 ALTER TABLE `matches` DISABLE KEYS */;
INSERT INTO `matches` VALUES (1,1,2,'easy',100,100,'active',NULL,'2026-01-10 15:08:32',NULL,1),(2,2,1,'easy',100,100,'active',NULL,'2026-01-10 15:14:21',NULL,1),(3,1,2,'easy',100,100,'active',NULL,'2026-01-10 15:15:48',NULL,1),(4,2,1,'easy',100,100,'active',NULL,'2026-01-10 15:55:35',NULL,1),(5,2,1,'easy',100,100,'active',NULL,'2026-01-10 18:17:53',NULL,1),(6,2,1,'easy',100,100,'active',NULL,'2026-01-10 18:36:01',NULL,1),(7,1,2,'easy',100,100,'active',NULL,'2026-01-10 18:39:02',NULL,1),(8,1,2,'easy',100,100,'active',NULL,'2026-01-11 04:54:08',NULL,1),(9,2,1,'easy',100,100,'active',NULL,'2026-01-11 05:21:01',NULL,1),(10,2,1,'easy',100,100,'active',NULL,'2026-01-11 05:26:07',NULL,1),(11,2,1,'easy',100,100,'active',NULL,'2026-01-11 05:34:44',NULL,1),(12,1,2,'easy',100,100,'active',NULL,'2026-01-11 05:47:44',NULL,1),(13,2,1,'easy',0,50,'completed',1,'2026-01-11 05:55:23','2026-01-11 05:56:49',1),(14,2,1,'easy',100,100,'active',NULL,'2026-01-11 06:10:32',NULL,1),(15,1,2,'easy',100,0,'completed',1,'2026-01-11 06:23:11','2026-01-11 06:30:19',1),(16,1,2,'easy',100,100,'active',NULL,'2026-01-11 06:40:04',NULL,1),(17,1,2,'easy',0,25,'active',NULL,'2026-01-11 06:42:36',NULL,1),(18,1,2,'easy',25,50,'active',NULL,'2026-01-11 06:49:44',NULL,1),(19,1,2,'easy',25,0,'completed',1,'2026-01-11 06:53:40','2026-01-11 06:53:52',1),(20,1,2,'easy',50,75,'active',NULL,'2026-01-11 07:01:34',NULL,1),(21,1,2,'easy',50,0,'completed',1,'2026-01-11 07:09:21','2026-01-11 07:12:35',1),(22,1,2,'easy',75,100,'active',NULL,'2026-01-11 10:36:04',NULL,1),(23,1,2,'easy',25,50,'active',NULL,'2026-01-11 10:49:22',NULL,1),(24,2,1,'easy',75,0,'completed',2,'2026-01-11 11:09:35','2026-01-11 11:10:21',1),(25,2,1,'easy',50,0,'completed',2,'2026-01-11 12:42:06','2026-01-11 12:44:41',1),(26,2,1,'easy',100,100,'active',NULL,'2026-01-11 12:58:34',NULL,1),(27,1,2,'easy',100,100,'active',NULL,'2026-01-11 13:11:35',NULL,1),(28,2,1,'easy',100,100,'active',NULL,'2026-01-11 13:20:33',NULL,1),(29,2,1,'easy',100,100,'active',NULL,'2026-01-11 13:22:00',NULL,1),(30,2,1,'easy',100,100,'active',NULL,'2026-01-11 13:35:42',NULL,1),(31,1,2,'easy',100,100,'active',NULL,'2026-01-11 13:48:40',NULL,1),(32,2,1,'medium',100,100,'active',NULL,'2026-01-11 17:40:33',NULL,1),(33,2,1,'medium',100,100,'active',NULL,'2026-01-11 17:41:31',NULL,1),(34,1,2,'easy',100,100,'active',NULL,'2026-01-11 17:41:46',NULL,1),(35,1,2,'hard',100,100,'active',NULL,'2026-01-11 17:42:08',NULL,1),(36,2,1,'easy',100,100,'active',NULL,'2026-01-11 17:54:17',NULL,1),(37,2,1,'easy',100,100,'active',NULL,'2026-01-11 18:01:26',NULL,1),(38,2,1,'easy',100,100,'active',NULL,'2026-01-11 18:15:43',NULL,1),(39,2,1,'easy',100,100,'active',NULL,'2026-01-11 19:13:58',NULL,1),(40,2,1,'easy',100,100,'active',NULL,'2026-01-11 19:17:33',NULL,1),(41,2,1,'easy',100,100,'active',NULL,'2026-01-11 19:19:32',NULL,1),(42,2,1,'easy',75,65,'active',NULL,'2026-01-11 19:25:02',NULL,1),(43,1,2,'easy',100,85,'active',NULL,'2026-01-11 20:10:15',NULL,1),(44,2,1,'easy',100,0,'active',NULL,'2026-01-11 20:28:12',NULL,1),(45,2,1,'easy',100,100,'active',NULL,'2026-01-11 20:38:20',NULL,1),(46,1,2,'easy',100,100,'active',NULL,'2026-01-11 20:55:34',NULL,1),(47,2,1,'easy',100,0,'active',NULL,'2026-01-11 21:22:43',NULL,1),(48,1,2,'easy',100,0,'completed',1,'2026-01-11 21:30:25',NULL,1),(49,1,2,'easy',100,0,'completed',1,'2026-01-11 22:06:19','2026-01-11 22:06:37',1),(50,2,1,'easy',0,95,'completed',1,'2026-01-12 04:35:19','2026-01-12 04:37:39',1),(51,2,1,'easy',90,0,'completed',2,'2026-01-12 05:47:00','2026-01-12 05:52:54',1),(52,3,4,'easy',100,100,'active',NULL,'2026-02-16 16:53:35',NULL,1),(53,3,4,'easy',100,100,'active',NULL,'2026-02-16 17:15:59',NULL,1),(54,3,4,'easy',100,100,'active',NULL,'2026-02-16 17:32:25',NULL,1),(55,3,4,'easy',100,100,'active',NULL,'2026-02-16 18:39:32',NULL,1),(56,3,4,'easy',100,100,'active',NULL,'2026-02-18 17:22:14',NULL,1),(57,3,4,'easy',100,100,'active',NULL,'2026-02-18 17:40:24',NULL,1),(58,3,4,'easy',100,100,'active',NULL,'2026-02-18 17:40:24',NULL,1),(59,4,3,'easy',100,100,'active',NULL,'2026-02-19 07:15:33',NULL,1),(60,4,3,'easy',100,100,'active',NULL,'2026-02-19 07:15:33',NULL,1),(61,4,3,'easy',100,95,'active',NULL,'2026-02-19 07:23:47',NULL,1),(62,4,3,'easy',100,100,'active',NULL,'2026-02-19 07:45:41',NULL,NULL),(63,4,3,'easy',100,100,'active',NULL,'2026-02-19 08:24:14',NULL,5),(64,3,4,'easy',100,100,'active',NULL,'2026-02-19 08:25:05',NULL,NULL),(65,3,4,'easy',100,100,'active',NULL,'2026-02-19 08:25:05',NULL,4),(66,4,3,'easy',100,100,'active',NULL,'2026-02-19 08:47:21',NULL,1),(67,4,3,'easy',100,100,'active',NULL,'2026-02-19 11:34:39',NULL,4),(68,4,3,'easy',100,100,'active',NULL,'2026-02-19 11:52:18',NULL,1),(69,3,4,'easy',100,100,'active',NULL,'2026-02-19 11:57:47',NULL,5),(70,4,3,'easy',100,100,'active',NULL,'2026-02-19 12:03:48',NULL,1),(71,3,4,'easy',100,100,'active',NULL,'2026-02-19 12:05:53',NULL,5);
/*!40000 ALTER TABLE `matches` ENABLE KEYS */;
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

-- Dump completed on 2026-02-19 17:47:58
