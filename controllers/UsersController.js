const crypto = require('crypto');
import dbClient from '../utils/db'
import router from '../routes/index'
//const dbClient = require('../utils/db');  // Your MongoDB client

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // Check if password is provided
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if email already exists in the database
      const database = dbClient.client.db('files_manager');  // Ensure the correct database name
      const usersCollection = database.collection('users');

      const existingUser = await usersCollection.findOne({ email });
      //const existingUser = await dbClient.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA-1
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Insert the new user into the database
      const result = await usersCollection.insertOne({ email, password: hashedPassword });
      //const result = await dbClient.collection('users').insertOne({
        //email,
        //password: hashedPassword,
      //});

      // Return the newly created user
      return res.status(201).json({
        id: result.insertedId,
        email,
      });
    } catch (error) {
      console.error('Error inserting user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UsersController;
