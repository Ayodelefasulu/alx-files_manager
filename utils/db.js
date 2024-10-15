// utils/db.js
import { MongoClient } from 'mongodb';

class DBClient {
    constructor() {
        // Get environment variables or set default values
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';

        const uri = `mongodb://${host}:${port}/${database}`;
        this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        this.isConnected = false;

        // Connect to MongoDB
        this.client.connect()
            .then(() => {
                console.log('Connected to MongoDB');
                this.isConnected = true;
            })
            .catch(err => {
                console.error('MongoDB connection error:', err);
            });
    }

    isAlive() {
        return this.isConnected;
    }

    async nbUsers() {
        if (!this.isAlive()) {
            throw new Error('Not connected to the database');
        }
        const database = this.client.db('files_manager');
        const collection = database.collection('users');
        return await collection.countDocuments();
    }

    async nbFiles() {
        if (!this.isAlive()) {
            throw new Error('Not connected to the database');
        }
        const database = this.client.db();
        const collection = database.collection('files');
        return await collection.countDocuments();
    }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
