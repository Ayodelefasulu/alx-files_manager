//const redisClient = require('../utils/redis');
import RedisClient from "../utils/db"
import DbClient from "../utils/db"
//const dbClient = require('../utils/db');

class AppController {
  static async getStatus(req, res) {
    const redisAlive = RedisClient.isAlive();
    const dbAlive = await DbClient.isAlive();
    res.status(200).json({ redis: redisAlive, db: dbAlive });
  }

  static async getStats(req, res) {
    const usersCount = await DbClient.nbUsers();
    const filesCount = await DbClient.nbFiles();
    res.status(200).json({ users: usersCount, files: filesCount });
  }
}

module.exports = AppController;
