// tests/appController.test.js

import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server'; // Adjust this import based on your app export
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

chai.use(chaiHttp);
const { expect } = chai;

describe('AppController', () => {
  describe('GET /status', () => {
    it('should return the status of Redis and DB', async () => {
      // Mocking the methods from redisClient and dbClient
      redisClient.isAlive = () => true; // Simulating Redis is alive
      dbClient.isAlive = async () => true; // Simulating DB is alive

      const res = await chai.request(app).get('/status');
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({ redis: true, db: true });
    });
  });

  describe('GET /stats', () => {
    it('should return user and file counts', async () => {
      // Mocking the methods for user and file counts
      dbClient.nbUsers = async () => 10; // Simulating there are 10 users
      dbClient.nbFiles = async () => 20; // Simulating there are 20 files

      const res = await chai.request(app).get('/stats');
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({ users: 10, files: 20 });
    });
  });
});

