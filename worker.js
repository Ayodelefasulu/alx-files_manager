import Bull from 'bull';
import dbClient from './utils/db';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import path from 'path';

const fileQueue = new Bull('fileQueue');

// Process jobs in the queue
fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  // Validate job data
  if (!fileId) {
    return done(new Error('Missing fileId'));
  }
  if (!userId) {
    return done(new Error('Missing userId'));
  }

  try {
    // Find the file document in the DB
    const file = await dbClient.client.db('files_manager').collection('files').findOne({
      _id: ObjectId(fileId),
      userId
    });

    if (!file) {
      return done(new Error('File not found'));
    }

    const { localPath, name } = file;

    // Generate thumbnails
    const sizes = [500, 250, 100];
    for (const size of sizes) {
      const thumbnail = await imageThumbnail(localPath, { width: size });
      const thumbnailPath = `${localPath}_${size}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
    }

    done(); // Mark job as completed
  } catch (err) {
    done(err);
  }
});
