import { expect } from 'chai';
import sinon from 'sinon';
import supertest from 'supertest';
import app from '../server'; // Import your Express app
import dbClient from '../utils/db'; // Your database client
import redisClient from '../utils/redis'; // Your Redis client
import FilesController from '../controllers/FilesController'; // Import your controller

describe('FilesController', () => {
  let request;

  before(() => {
    request = supertest(app); // Initialize supertest with your Express app
  });

  afterEach(() => {
    sinon.restore(); // Restore the original methods after each test
  });

  describe('POST /files', () => {
    it('should upload a file successfully', async () => {
      const reqBody = {
        name: 'test.png',
        type: 'image',
        parentId: 0,
        isPublic: false,
        data: Buffer.from('test data').toString('base64')
      };

      // Mocking Redis
      sinon.stub(redisClient, 'get').returns(Promise.resolve('mockedUserId'));

      // Mocking MongoDB
      const insertStub = sinon.stub(dbClient.client.db('files_manager').collection('files'), 'insertOne');
      insertStub.returns(Promise.resolve({ insertedId: 'mockedId' }));

      const response = await request.post('/files')
        .set('X-Token', 'mockedToken') // Set your token in headers
        .send(reqBody);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id', 'mockedId');
      expect(response.body).to.have.property('name', reqBody.name);
      expect(insertStub.calledOnce).to.be.true;
    });

    it('should return 401 if unauthorized', async () => {
      sinon.stub(redisClient, 'get').returns(Promise.resolve(null));

      const response = await request.post('/files')
        .set('X-Token', 'invalidToken')
        .send({});

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 400 for missing name', async () => {
      const reqBody = {
        type: 'image',
        parentId: 0,
        isPublic: false,
        data: Buffer.from('test data').toString('base64')
      };

      const response = await request.post('/files')
        .set('X-Token', 'mockedToken')
        .send(reqBody);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error', 'Missing name');
    });
  });

  describe('GET /files/:id', () => {
    it('should get file details successfully', async () => {
      const fileId = 'mockedFileId';

      // Mocking Redis
      sinon.stub(redisClient, 'get').returns(Promise.resolve('mockedUserId'));

      // Mocking MongoDB
      const findStub = sinon.stub(dbClient.client.db('files_manager').collection('files'), 'findOne');
      findStub.returns(Promise.resolve({
        _id: fileId,
        userId: 'mockedUserId',
        name: 'test.png',
        type: 'image',
        isPublic: false,
        parentId: 0,
        localPath: '/tmp/files_manager/mockedId'
      }));

      const response = await request.get(`/files/${fileId}`)
        .set('X-Token', 'mockedToken');

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('id', fileId);
      expect(response.body).to.have.property('name', 'test.png');
      expect(findStub.calledOnce).to.be.true;
    });

    it('should return 404 if file not found', async () => {
      const fileId = 'nonExistentId';

      // Mocking Redis
      sinon.stub(redisClient, 'get').returns(Promise.resolve('mockedUserId'));

      // Mocking MongoDB
      sinon.stub(dbClient.client.db('files_manager').collection('files'), 'findOne').returns(Promise.resolve(null));

      const response = await request.get(`/files/${fileId}`)
        .set('X-Token', 'mockedToken');

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error', 'Not found');
    });
  });
});
