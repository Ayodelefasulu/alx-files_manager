import chai from 'chai';
import sinon from 'sinon';
import redis from 'redis';
import redisClient from '../utils/redis'; // Adjust the path as necessary

const { expect } = chai;

describe('redisClient', () => {
  //let redisClient;
  let redisMock;

  beforeEach(() => {
    redisMock = sinon.stub(redis, 'createClient').returns({
      connected: true,
      get: sinon.stub(),
      set: sinon.stub(),
      del: sinon.stub(),
      on: sinon.stub(),
    });
   // redisClient = new RedisClient();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('isAlive', () => {
    it('should return true if the client is connected', () => {
      expect(redisClient.isAlive()).to.be.true;
    });
  });

  describe('get', () => {
    it('should resolve with the value if the key exists', async () => {
      const key = 'testKey';
      const value = 'testValue';
      redisClient.client.get.callsArgWith(1, null, value); // Simulate Redis response

      const result = await redisClient.get(key);
      expect(result).to.equal(value);
    });

    it('should reject with an error if the key does not exist', async () => {
      const key = 'testKey';
      const error = new Error('Key not found');
      redisClient.client.get.callsArgWith(1, error, null); // Simulate Redis error

      await expect(redisClient.get(key)).to.be.rejectedWith(error);
    });
  });

  describe('set', () => {
    it('should resolve with the reply when setting a key', async () => {
      const key = 'testKey';
      const value = 'testValue';
      const duration = 60;
      const reply = 'OK';
      redisClient.client.set.callsArgWith(3, null, reply); // Simulate Redis response

      const result = await redisClient.set(key, value, duration);
      expect(result).to.equal(reply);
    });

    it('should reject with an error when setting a key fails', async () => {
      const key = 'testKey';
      const value = 'testValue';
      const duration = 60;
      const error = new Error('Failed to set key');
      redisClient.client.set.callsArgWith(3, error, null); // Simulate Redis error

      await expect(redisClient.set(key, value, duration)).to.be.rejectedWith(error);
    });
  });

  describe('del', () => {
    it('should resolve with the reply when deleting a key', async () => {
      const key = 'testKey';
      const reply = 1; // Number of keys removed
      redisClient.client.del.callsArgWith(1, null, reply); // Simulate Redis response

      const result = await redisClient.del(key);
      expect(result).to.equal(reply);
    });

    it('should reject with an error when deleting a key fails', async () => {
      const key = 'testKey';
      const error = new Error('Failed to delete key');
      redisClient.client.del.callsArgWith(1, error, null); // Simulate Redis error

      await expect(redisClient.del(key)).to.be.rejectedWith(error);
    });
  });
});

