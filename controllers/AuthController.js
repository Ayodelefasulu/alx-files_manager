import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import crypto from 'crypto';

class AuthController {
    // Sign in the user
    static async getConnect(req, res) {
        const authHeader = req.headers.authorization || '';
        const base64Credentials = authHeader.split(' ')[1] || '';
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [email, password] = credentials.split(':');

        if (!email || !password) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const sha1Password = crypto.createHash('sha1').update(password).digest('hex');

        const database = dbClient.client.db('files_manager');
        const user = await database.collection('users').findOne({ email, password: sha1Password });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Generate a token
        const token = uuidv4();
        const key = `auth_${token}`;

        // Store user ID in Redis for 24 hours
        await redisClient.set(key, user._id.toString(), 24 * 3600);

        return res.status(200).json({ token });
    }

    // Sign out the user
    static async getDisconnect(req, res) {
        const token = req.headers['x-token'];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const key = `auth_${token}`;
        const userId = await redisClient.get(key);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Delete the token in Redis
        await redisClient.del(key);

        return res.status(204).send();
    }
}

export default AuthController;
