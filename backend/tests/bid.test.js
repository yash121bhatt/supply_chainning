const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Bid API', () => {
  let shipperToken;
  let carrierToken;
  let shipmentId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const shipper = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bid Shipper',
        email: `bidshipper${Date.now()}@test.com`,
        phone: '9876543210',
        password: 'password123',
        role: 'shipper'
      });
    shipperToken = shipper.body.data.token;

    const carrier = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bid Carrier',
        email: `bidcarrier${Date.now()}@test.com`,
        phone: '9876543211',
        password: 'password123',
        role: 'carrier'
      });
    carrierToken = carrier.body.data.token;

    const shipment = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${shipperToken}`)
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
          description: 'Test Goods',
          weight: 100,
          value: 50000
        },
        pricing: {
          quotedPrice: 10000
        }
      });
    shipmentId = shipment.body.data._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/bids', () => {
    it('should place a bid on a shipment', async () => {
      const res = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${carrierToken}`)
        .send({
          shipmentId,
          amount: 9500,
          notes: 'Competitive price',
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bid).toHaveProperty('amount', 9500);
    });

    it('should not place bid without auth', async () => {
      const res = await request(app)
        .post('/api/bids')
        .send({
          shipmentId,
          amount: 9000
        });

      expect(res.status).toBe(401);
    });

    it('should not place bid as shipper', async () => {
      const res = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${shipperToken}`)
        .send({
          shipmentId,
          amount: 9000
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/bids/my-bids', () => {
    it('should get carrier bids', async () => {
      const res = await request(app)
        .get('/api/bids/my-bids')
        .set('Authorization', `Bearer ${carrierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.bids)).toBe(true);
    });
  });
});

describe('Payment API', () => {
  let shipperToken;
  let shipmentId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const shipper = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Payment Shipper',
        email: `paymentshipper${Date.now()}@test.com`,
        phone: '9876543210',
        password: 'password123',
        role: 'shipper'
      });
    shipperToken = shipper.body.data.token;

    const shipment = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${shipperToken}`)
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
          description: 'Test Goods',
          weight: 100,
          value: 50000
        },
        pricing: {
          quotedPrice: 10000
        }
      });
    shipmentId = shipment.body.data._id;
  });

  describe('GET /api/payments/status/:shipmentId', () => {
    it('should get payment status', async () => {
      const res = await request(app)
        .get(`/api/payments/status/${shipmentId}`)
        .set('Authorization', `Bearer ${shipperToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
