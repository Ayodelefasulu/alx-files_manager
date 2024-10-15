// utils/redis.js

import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    // Listen for errors and log them to the console
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  isAlive() {
    return this.client.connected; // returns true if the client is connected to Redis
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if (err) {
          reject(err); // reject the promise on error
        } else {
          resolve(value); // resolve with the value found for the key
        }
      });
    });
  }

  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, 'EX', duration, (err, reply) => {
        if (err) {
          reject(err); // reject the promise on error
        } else {
          resolve(reply); // resolve with the reply from Redis
        }
      });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) {
          reject(err); // reject the promise on error
        } else {
          resolve(reply); // resolve with the reply from Redis
        }
      });
    });
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
