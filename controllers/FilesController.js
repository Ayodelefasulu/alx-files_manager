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

    console.log('User authenticated:', newFile);
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
}

module.exports = FilesController;
