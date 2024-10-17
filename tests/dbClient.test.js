import chai from 'chai';
import sinon from 'sinon';
import { MongoClient } from 'mongodb';
import dbClient from '../utils/db'; // Adjust the path as necessary

const { expect } = chai;

describe('dbClient', () => {
  //let dbClient;
  let connectStub;
  let dbStub;

  beforeEach(() => {
    connectStub = sinon.stub(MongoClient.prototype, 'connect').returns(Promise.resolve());
    dbStub = sinon.stub(MongoClient.prototype, 'db').returns({
      collection: sinon.stub().returns({
        countDocuments: sinon.stub(),
      }),
    });

    //dbClient = new DBClient();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('isAlive', () => {
    it('should return true if the client is connected', () => {
      expect(dbClient.isAlive()).to.be.true;
    });

    it('should return false if the client is not connected', async () => {
      dbClient.isConnected = false; // Simulate not being connected
      expect(dbClient.isAlive()).to.be.false;
    });
  });

  describe('nbUsers', () => {
    it('should return the number of users', async () => {
      const count = 5;
      dbStub().collection().countDocuments.returns(Promise.resolve(count));

      const result = await dbClient.nbUsers();
      expect(result).to.equal(count);
    });

    it('should throw an error if not connected', async () => {
      dbClient.isConnected = false; // Simulate not being connected

      await expect(dbClient.nbUsers()).to.be.rejectedWith('Not connected to the database');
    });
  });

  describe('nbFiles', () => {
    it('should return the number of files', async () => {
      const count = 10;
      dbStub().collection().countDocuments.returns(Promise.resolve(count));

      const result = await dbClient.nbFiles();
      expect(result).to.equal(count);
    });

    it('should throw an error if not connected', async () => {
      dbClient.isConnected = false; // Simulate not being connected

      await expect(dbClient.nbFiles()).to.be.rejectedWith('Not connected to the database');
    });
  });
});
