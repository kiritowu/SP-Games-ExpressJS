CREATE DATABASE  IF NOT EXISTS `sp_games` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sp_games`;
-- MySQL dump 10.13  Distrib 8.0.22, for Win64 (x86_64)
--
-- Host: localhost    Database: sp_games
-- ------------------------------------------------------
-- Server version	8.0.22

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

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `cat_id` int NOT NULL AUTO_INCREMENT,
  `catname` varchar(45) NOT NULL,
  `description` varchar(512) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cat_id`),
  UNIQUE KEY `cat_id_UNIQUE` (`cat_id`),
  UNIQUE KEY `catname_UNIQUE` (`catname`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'RPG','Role play games','2020-12-18 14:49:35'),(2,'Action','Run around and kill or hit people.','2020-12-18 14:51:06'),(3,'Horror','Horror video games are video games that narratively deal with elements of horror fiction.','2020-12-18 14:51:27'),(4,'FPS','Shooting others in first person point of view','2020-12-18 14:55:24');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_category_map`
--

DROP TABLE IF EXISTS `game_category_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_category_map` (
  `game_cat_id` int NOT NULL AUTO_INCREMENT,
  `fk_game_id` int NOT NULL,
  `fk_cat_id` int NOT NULL,
  PRIMARY KEY (`game_cat_id`),
  UNIQUE KEY `game_cat_id_UNIQUE` (`game_cat_id`),
  KEY `fk_game_id_idx` (`fk_game_id`),
  KEY `cat_id_idx` (`fk_cat_id`),
  CONSTRAINT `cat_id` FOREIGN KEY (`fk_cat_id`) REFERENCES `categories` (`cat_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `game_id` FOREIGN KEY (`fk_game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_category_map`
--

LOCK TABLES `game_category_map` WRITE;
/*!40000 ALTER TABLE `game_category_map` DISABLE KEYS */;
INSERT INTO `game_category_map` VALUES (57,1,2),(58,1,4),(59,2,2),(60,2,4),(63,4,1),(64,4,2),(65,5,2),(66,5,3),(69,3,1),(70,3,2);
/*!40000 ALTER TABLE `game_category_map` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `games` (
  `game_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(45) NOT NULL,
  `description` varchar(512) NOT NULL,
  `price` double NOT NULL,
  `platform` varchar(45) NOT NULL,
  `year` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`game_id`),
  UNIQUE KEY `game_id_UNIQUE` (`game_id`),
  UNIQUE KEY `title_UNIQUE` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `games`
--

LOCK TABLES `games` WRITE;
/*!40000 ALTER TABLE `games` DISABLE KEYS */;
INSERT INTO `games` VALUES (1,'Call of Duty','Call of Duty is a first-person shooter video game franchise published by Activision',49.9,'PC',2018,'2020-12-18 14:58:56'),(2,'PubG','PlayerUnknown\'s Battlegrounds is an online multiplayer battle royale game developed and published by PUBG Corporation, a subsidiary of South Korean video game company Bluehole.',25.5,'PC',2018,'2020-12-18 15:01:43'),(3,'League of Legend','LoL is an 5v5 MMORPG games that is developed by Riot games',0,'PC',2009,'2020-12-18 15:02:42'),(4,'Vain Glory','VG is an 5v5 MMORPG games that is famous among mobile gamers',0,'Mobile',2016,'2020-12-18 15:04:08'),(5,'Resident Evil V','Resident Evil is a adventurous and horror game.',49.99,'PS4',2013,'2020-12-18 15:05:11');
/*!40000 ALTER TABLE `games` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `fk_user_id` int NOT NULL,
  `fk_game_id` int NOT NULL,
  `content` varchar(512) NOT NULL,
  `rating` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `review_id_UNIQUE` (`review_id`),
  KEY `user_id_idx` (`fk_user_id`),
  KEY `game_id_idx` (`fk_game_id`),
  CONSTRAINT `fk_game_id` FOREIGN KEY (`fk_game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_id` FOREIGN KEY (`fk_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,2,1,'My computer too lag cannot play but sounds good',3,'2020-12-18 15:11:08'),(2,4,1,'Good Game Woo Hoo!',5,'2020-12-18 15:11:56'),(3,5,1,'Ok Ok only',2,'2020-12-18 15:12:22');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `email` varchar(45) NOT NULL,
  `type` varchar(45) NOT NULL,
  `profile_pic_url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `password` varchar(255) NOT NULL,
  `salt` varchar(255) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `userid_UNIQUE` (`user_id`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'sudo','sudo@xmail.com','Admin','http://localhost:8081/users/pic/profile-pic-1608302163585-701456215.jpg','2020-12-18 14:36:03','$2b$10$7YDnRxerNOcCIdNE8lrTN.8GaMNqjJHsw2MSMvGjMdulsmwKsksC2','$2b$10$7YDnRxerNOcCIdNE8lrTN.'),(2,'kiritowu','kiritowu@xmail.com','Admin','http://localhost:8081/users/pic/profile-pic-1608302197813-954866209.jpg','2020-12-18 14:36:38','$2b$10$mqV.8koQbjxELxv2AA4cs.kUBOPTu8oFlPMKCN1Gc4jWGgCFvUKZG','$2b$10$mqV.8koQbjxELxv2AA4cs.'),(3,'yxfxn','yxfxn@xmail.com','Admin','http://localhost:8081/users/pic/profile-pic-1608302238234-74672381.jpg','2020-12-18 14:37:18','$2b$10$PSsX4aMvoaf.jG.yPAxAieWXvGlEEu4MYAUqAeavOYLYbn9d3Uz9C','$2b$10$PSsX4aMvoaf.jG.yPAxAie'),(4,'tom','tom@xmail.com','Customer','http://localhost:8081/users/pic/profile-pic-1608302340285-393518271.jpg','2020-12-18 14:39:00','$2b$10$C5Q9OicpNegUV4xQa06FE.WE1NTnZeanZpp2Ko/Fxk51GPJADP7SK','$2b$10$C5Q9OicpNegUV4xQa06FE.'),(5,'john','john@xmail.com','Customer','http://localhost:8081/users/pic/default.jpg','2020-12-18 14:41:09','$2b$10$Nt8whEb1lAKaBUljo4j5EesUUCofNK9oagLGazGoLFK3OoqomH4pq','$2b$10$Nt8whEb1lAKaBUljo4j5Ee'),(6,'nick','nick@xmail.com','Customer','http://localhost:8081/users/pic/profile-pic-1608302804413-322634811.jpg','2020-12-18 14:46:44','$2b$10$IuItHOeoEHmzANamWRmARuJUgb0pYD2xwmA64Ze4m6oCS.9xxLwlq','$2b$10$IuItHOeoEHmzANamWRmARu');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'sp_games'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-12-18 23:14:30
