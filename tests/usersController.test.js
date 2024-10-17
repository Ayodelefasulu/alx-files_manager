// tests/usersController.test.js

import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server'; // Adjust this import based on your app export
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import crypto from 'crypto';

chai.use(chaiHttp);
const { expect } = chai;

describe('UsersController', () => {
  describe('POST /new', () => {
    it('should create a new user when email and password are provided', async () => {
      const mockUser = { _id: '123', email: 'user@example.com', password: crypto.createHash('sha1').update('password').digest('hex') };

      // Mocking database methods
      dbClient.client.db = () => ({
        collection: () => ({
          findOne: async () => null, // No user found
          insertOne: async () => ({ insertedId: mockUser._id }),
        }),
      });

      const res = await chai.request(app)
        .post('/new') // Adjust based on your routes
        .send({ email: 'user@example.com', password: 'password' });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('id', mockUser._id);
      expect(res.body).to.have.property('email', mockUser.email);
    });

    it('should return 400 if email is missing', async () => {
      const res = await chai.request(app)
        .post('/new')
        .send({ password: 'password' });

      expect(res).to.have.status(400);
      expect(res.body).to.deep.equal({ error: 'Missing email' });
    });

    it('should return 400 if password is missing', async () => {
      const res = await chai.request(app)
        .post('/new')
        .send({ email: 'user@example.com' });

      expect(res).to.have.status(400);
      expect(res.body).to.deep.equal({ error: 'Missing password' });
    });

    it('should return 400 if user already exists', async () => {
      // Mocking database methods
      dbClient.client.db = () => ({
        collection: () => ({
          findOne: async () => ({ _id: '123', email: 'user@example.com' }), // User exists
          insertOne: async () => {},
        }),
      });

      const res = await chai.request(app)
        .post('/new')
        .send({ email: 'user@example.com', password: 'password' });

      expect(res).to.have.status(400);
      expect(res.body).to.deep.equal({ error: 'Already exist' });
    });

    it('should return 500 on internal error', async () => {
      // Mocking database methods
      dbClient.client.db = () => ({
        collection: () => ({
          findOne: async () => null, // No user found
          insertOne: async () => { throw new Error('Database error'); },
        }),
      });

      const res = await chai.request(app)
        .post('/new')
        .send({ email: 'user@example.com', password: 'password' });

      expect(res).to.have.status(500);
      expect(res.body).to.deep.equal({ error: 'Internal server error' });
    });
  });

  describe('GET /me', () => {
    it('should return user info when a valid token is provided', async () => {
      const token = 'validToken';
      const userId = '123';
      const user = { _id: userId, email: 'user@example.com' };

      // Mocking Redis methods
      redisClient.get = async () => userId; // Simulating a user ID is returned

      // Mocking database methods
      dbClient.client.db = () => ({
        collection: () => ({
          findOne: async () => user, // Returning the mock user
        }),
      });

      const res = await chai.request(app)
        .get('/me')
        .set('x-token', token);

      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({ id: user._id, email: user.email });
    });

    it('should return 401 if no token is provided', async () => {
      const res = await chai.request(app).get('/me');
      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    it('should return 401 if an invalid token is provided', async () => {
      const token = 'invalidToken';

      // Mocking Redis methods
      redisClient.get = async () => null; // Simulating no user ID found

      const res = await chai.request(app)
        .get('/me')
        .set('x-token', token);

      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    it('should return 401 if user not found', async () => {
      const token = 'validToken';
      const userId = '123';

      // Mocking Redis methods
      redisClient.get = async () => userId; // Simulating a user ID is returned

      // Mocking database methods
      dbClient.client.db = () => ({
        collection: () => ({
          findOne: async () => null, // No user found
        }),
      });

      const res = await chai.request(app)
        .get('/me')
        .set('x-token', token);

      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });
  });
});
