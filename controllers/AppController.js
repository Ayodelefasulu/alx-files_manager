// controllers/AppController.js
const mongoose = require('mongoose');
const redisClient = require('../utils/redisClient'); // Assuming you have a redis client setup

const AppController = {
  async getStatus(req, res) {
    const dbStatus = await mongoose.connection.readyState === 1; // 1 indicates connected
    const redisStatus = redisClient.isAlive(); // Assuming you have a method to check Redis status
    res.status(200).json({ redis: redisStatus, db: dbStatus });
  },

  async getStats(req, res) {
    const userCount = await mongoose.model('User').countDocuments(); // Adjust according to your User model
    const fileCount = await mongoose.model('File').countDocuments(); // Adjust according to your File model
    res.status(200).json({ users: userCount, files: fileCount });
  },
};

module.exports = AppController;
