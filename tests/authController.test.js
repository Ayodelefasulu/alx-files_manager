// tests/authController.test.js

import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server'; // Adjust this import based on your app export
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import crypto from 'crypto';

chai.use(chaiHttp);
const { expect } = chai;

describe('AuthController', () => {
  describe('POST /connect', () => {
    it('should return a token when credentials are valid', async () => {
      // Mock user data
      const mockUser = { _id: '123', email: 'user@example.com', password: crypto.createHash('sha1').update('password').digest('hex') };

      // Mocking database methods
      dbClient.client.db = () => ({
        collection: () => ({
          findOne: async () => mockUser,
        }),
      });

      // Mocking Redis methods
      redisClient.set = async () => 'OK';

      const credentials = Buffer.from('user@example.com:password').toString('base64');
      const res = await chai.request(app)
        .post('/connect')
        .set('Authorization', `Basic ${credentials}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token');
    });

    it('should return 401 if credentials are invalid', async () => {
      // Mocking database methods
      dbClient.client.db = () => ({
        collection: () => ({
          findOne: async () => null, // No user found
        }),
      });

      const credentials = Buffer.from('user@example.com:wrongpassword').toString('base64');
      const res = await chai.request(app)
        .post('/connect')
        .set('Authorization', `Basic ${credentials}`);

      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    it('should return 401 if no credentials are provided', async () => {
      const res = await chai.request(app).post('/connect');
      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });
  });

  describe('GET /disconnect', () => {
    it('should disconnect the user when a valid token is provided', async () => {
      const token = 'validToken';
      const key = `auth_${token}`;

      // Mocking Redis methods
      redisClient.get = async (key) => '123'; // Simulating a user ID is returned
      redisClient.del = async () => 1; // Simulating successful deletion

      const res = await chai.request(app)
        .get('/disconnect')
        .set('x-token', token);

      expect(res).to.have.status(204);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await chai.request(app).get('/disconnect');
      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    it('should return 401 if an invalid token is provided', async () => {
      const token = 'invalidToken';
      const key = `auth_${token}`;

      // Mocking Redis methods
      redisClient.get = async () => null; // Simulating no user ID found

      const res = await chai.request(app)
        .get('/disconnect')
        .set('x-token', token);

      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });
  });
});

