const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Auth API', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: `test${Date.now()}@test.com`,
          phone: '9876543210',
          password: 'password123',
          role: 'shipper'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('token');
    });

    it('should not register user with existing email', async () => {
      const email = `duplicate${Date.now()}@test.com`;
      
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email,
          phone: '9876543210',
          password: 'password123',
          role: 'shipper'
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email,
          phone: '9876543211',
          password: 'password123',
          role: 'shipper'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeAll(async () => {
      testUser = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login Test User',
          email: `logintest${Date.now()}@test.com`,
          phone: '9876543210',
          password: 'password123',
          role: 'shipper'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.body.data.user.email,
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.body.data.user.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

describe('Shipment API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const user = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Shipper Test',
        email: `shipper${Date.now()}@test.com`,
        phone: '9876543210',
        password: 'password123',
        role: 'shipper'
      });

    authToken = user.body.data.token;
    userId = user.body.data.user._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/shipments', () => {
    it('should create a new shipment', async () => {
      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pickupLocation: {
            address: '123 Pickup St',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001'
          },
          deliveryLocation: {
            address: '456 Delivery Ave',
            city: 'Delhi',
            state: 'Delhi',
            zipCode: '110001'
          },
          pickupDate: new Date(Date.now() + 86400000).toISOString(),
          deliveryDate: new Date(Date.now() + 172800000).toISOString(),
          goodsDetails: {
            description: 'Electronics',
            weight: 100,
            value: 50000
          },
          pricing: {
            quotedPrice: 10000
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('shipmentNumber');
      expect(res.body.data.status).toBe('pending');
    });

    it('should not create shipment without auth', async () => {
      const res = await request(app)
        .post('/api/shipments')
        .send({
          pickupLocation: { address: 'Test', city: 'Test', state: 'Test', zipCode: '123' },
          deliveryLocation: { address: 'Test', city: 'Test', state: 'Test', zipCode: '123' },
          pickupDate: new Date().toISOString(),
          deliveryDate: new Date().toISOString(),
          goodsDetails: { description: 'Test', weight: 10, value: 100 },
          pricing: { quotedPrice: 100 }
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/shipments/my-shipments', () => {
    it('should get user shipments', async () => {
      const res = await request(app)
        .get('/api/shipments/my-shipments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.shipments)).toBe(true);
    });
  });
});

describe('Health Check', () => {
  it('should return ok status', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
