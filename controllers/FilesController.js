import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Define the storage folder based on the environment variable
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Validate input fields
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const validTypes = ['folder', 'file', 'image'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Validate parentId if set
    let parentFile = null;
    if (parentId !== 0) {
      parentFile = await dbClient.client.db('files_manager').collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    //console.log('User authenticated:', user);


    const newFile = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? '0' : ObjectId(parentId),
    };

    console.log('User authenticated:', newFile); //
    console.log('POST /files endpoint hit'); //
    console.log('Request body:', req.body); //
    console.log('Request headers:', req.headers); //



    if (type === 'folder') {
      // Insert folder into the database
      const result = await dbClient.client.db('files_manager').collection('files').insertOne(newFile);
      return res.status(201).json({ id: result.insertedId, ...newFile });
    }
    console.log('Starting file saving process...'); //

    // If it's a file or image, handle file storage
    const filePath = path.join(FOLDER_PATH, uuidv4());

    try {
      // Ensure the folder path exists
      console.log('Checking folder path:', FOLDER_PATH); //
      if (!fs.existsSync(FOLDER_PATH)) {
        console.log('Folder does not exist, creating it...'); //
        fs.mkdirSync(FOLDER_PATH, { recursive: true });
      } else {
        console.log('Folder exist'); //
      }

      // Decode the Base64 data and save it to the file
      const fileData = Buffer.from(data, 'base64');
      console.log('File data decoded, preparing to write...'); //
      fs.writeFileSync(filePath, fileData);
      console.log('File successfully written to:', filePath); //

      newFile.localPath = filePath;

      // Insert file into the database

      const result = await dbClient.client.db('files_manager');  // Ensure the correct database> 
      const resultCollection = result.collection('files');
      const resultFile = resultCollection.insertOne(newFile)

     /// const result = await dbClient.db.collection('files').insertOne(newFile);
     /// console.log('File inserted in DB with ID:', result.insertedId); //

      return res.status(201).json({ id: resultFile.insertedId, ...newFile });
    } catch (err) {
        console.error("Error during file saving:", err.message); //
      return res.status(500).json({ error: 'Error saving file' });
    }
  }

  static async getShow(req, res) {
    try {
      console.log("Beginning of getShow function...");

      // Get token from the headers
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      // Retrieve userId from Redis
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const fileId = req.params.id;
      console.log('userID: ', userId);

      // Query the file by userId and _id (which is ObjectId)
      let query = { userId: new ObjectId(userId) };

      if (ObjectId.isValid(fileId)) {
        query._id = new ObjectId(fileId);
      } else {
        return res.status(400).json({ error: 'Invalid file ID' });
      }

      // Search for the file in the database
      const file = await dbClient.client.db('files_manager').collection('files').findOne(query);
      if (!file) return res.status(404).json({ error: 'Not found' });

      // Send back the file information
      return res.status(200).json({
        id: file._id.toString(),
        userId: file.userId.toString(),
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
        localPath: file.localPath || null
      });

    } catch (error) {
      console.error('Error in getShow:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

/*  static async getShow(req, res) {
    try {
      console.log("The beginning of function..."); //

      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      console.log('userID: ', userId); //

      const fileId = req.params.id;
      console.log("BEFORE FILE....");

      // Check if fileId is a valid ObjectId
      if (!ObjectId.isValid(fileId)) {
        return res.status(400).json({ error: 'Invalid file ID' });
      }

      // Check if userId is a valid ObjectId
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Check if fileId is "0" or similar special case (not an ObjectId)
      let query = { userId: new ObjectId(userId) };

      if (fileId === "0") {
        query.parentId = "0"; // Handle files with parentId = '0'
      } else if (ObjectId.isValid(fileId)) {
        query._id = new ObjectId(fileId); // Valid ObjectId case
      } else {
        return res.status(400).json({ error: 'Invalid file ID' });
      }

      const file = await dbClient.client.db('files_manager').collection('files')
        .findOne({
          _id: new ObjectId(fileId),
          userId: new ObjectId(userId)
        });
      console.log("AFTER FILE.... :", file);

      if (!file) return res.status(404).json({ error: 'Not found' });

      const fileResponse = {
        id: file._id.toString(),
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId
      };

      return res.status(200).json(fileResponse);

    } catch (error) {
        console.error('Error in getShow:', error); // This will log errors to the console
        return res.status(500).json({ error: 'Internal server error' });
      }
  }

*/


  // The getshow function
/*  static async getShow(req, res) {
    console.log("The beginning of function...") //
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // Find the user by token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    console.log('userID: ', userId) //

    // Retrieve the file by ID
    const fileId = req.params.id; //await dbClient.client.db('files_manager')
    console.log("BEFORE FILE....") //
    const file = await dbClient.client.db('files_manager').collection('files').findOne({
      _id: new dbClient.ObjectID(fileId),
      userId: userId
    });
    console.log("AFTER FILE.... :", file) //

    if (!file) return res.status(404).json({ error: 'Not found' });

    const fileResponse = {
      id: file._id.toString(),
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId
    };

    return res.status(200).json(fileResponse);
  }
*/

/*
  // New function for file listing (pagination)
  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // Find the user by token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parentId = req.query.parentId || '0'; // Default to root
    const page = parseInt(req.query.page, 10) || 0; // Default to page 0
    const pageSize = 20;
    const skip = page * pageSize;

    // Retrieve files with pagination
    const files = await dbClient.client.db('files_manager').collection('files')
      .aggregate([
        { $match: { userId, parentId } },
        { $skip: skip },
        { $limit: pageSize }
      ]).toArray();

    return res.status(200).json(files);
  }
*/

  static async getIndex(req, res) {
    try {
      console.log("Inside getIndex");

      const token = req.headers['x-token'];
      console.log("Token:", token); //
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      // Find the user by token
      const userIdString = await redisClient.get(`auth_${token}`);
      if (!userIdString) return res.status(401).json({ error: 'Unauthorized' });

      const userId = new ObjectId(userIdString);
      console.log('userID:', userId); //
      //if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Handle parentId from query params, default to '0' (root) if not provided
      let parentId = req.query.parentId || '0';
      if (parentId !== '0') {
        try {
          parentId = new ObjectId(parentId); // Convert to ObjectId if it's not '0'
        } catch (error) {
          return res.status(400).json({ error: 'Invalid parentId format' });
        }
      }
      //const parentId = req.query.parentId || '0'; // Default to root
      //const parentId = req.query.parentId && req.query.parentId !== '0'
        //? new ObjectId(req.query.parentId)
        //: '0'; // Handle parentId conversion if needed, root is '0'
      const page = parseInt(req.query.page, 10) || 0; // Default to page 0
      const pageSize = 20;
      const skip = page * pageSize;

      console.log('parentId:', parentId); //
      console.log('page:', page, 'skip:', skip); //

      // Retrieve files with pagination
      //const files = await dbClient.client.db('files_manager').collection('files')
      const allFiles = await dbClient.client.db('files_manager').collection('files').find({}).toArray();
        /*.aggregate([
          { $match: { userId, parentId } },
          { $skip: skip },
          { $limit: pageSize }
        ]).toArray();*/

      console.log('All files:', allFiles);

      //console.log("Files found:", files); //
      //const rootFiles = await dbClient.client.db('files_manager').collection('files').find({ parentId: '0' }).toArray();
      //console.log('Root files found:', rootFiles);
      //const nestedFiles = await dbClient.client.db('files_manager').collection('files').find({ parentId: { $ne: '0' } }).toArray();
      //console.log('Nested files found:', nestedFiles);

      //const allFiles = await dbClient.client.db('files_manager').collection('files').find({}).toArray();
      //console.log('All files:', allFiles);



      return res.status(200).json(allFiles);
    } catch (error) {
      console.error('Error in getIndex:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

}

module.exports = FilesController;
