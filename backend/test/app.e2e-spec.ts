import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { QuotesModule } from '../src/quotes/quotes.module';
import { ShipmentsModule } from '../src/shipments/shipments.module';
import { User } from '../src/entities/user.entity';
import { Address } from '../src/entities/address.entity';
import { Quote } from '../src/entities/quote.entity';
import { Shipment } from '../src/entities/shipment.entity';
import { ShipmentStatus } from '../src/entities/shipment-status.entity';
import { Route } from '../src/entities/route.entity';
import { RouteAssignment } from '../src/entities/route-assignment.entity';
import { Payment } from '../src/entities/payment.entity';

describe('Parcel API (e2e)', () => {
  jest.setTimeout(20000);
  process.env.DB_TYPE = 'sqlite';
  let app: INestApplication;
  let httpServer: any;
  let clientToken: string;
  let operatorToken: string;
  let adminToken: string;
  let shipmentId: string;
  let trackingCode: string;
  let quoteId: string;
  let operatorId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [User, Address, Quote, Shipment, ShipmentStatus, Route, RouteAssignment, Payment],
          synchronize: true,
        }),
        UsersModule,
        AuthModule,
        QuotesModule,
        ShipmentsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpAdapter().getInstance();
  });

  afterAll(async () => {
    await app.close();
  });

  it('executes the end-to-end flow: auth -> quote -> shipment -> tracking -> operator update', async () => {
    const clientRes = await request(httpServer).post('/auth/register').send({
      email: 'client@test.com',
      password: 'secret123',
      role: 'client',
    });
    clientToken = clientRes.body.accessToken;

    const operatorRes = await request(httpServer).post('/auth/register').send({
      email: 'op@test.com',
      password: 'secret123',
      role: 'operator',
    });
    operatorToken = operatorRes.body.accessToken;
    operatorId = operatorRes.body.user.id;

    const adminRes = await request(httpServer).post('/auth/register').send({
      email: 'admin@test.com',
      password: 'secret123',
      role: 'admin',
    });
    adminToken = adminRes.body.accessToken;

    const quoteRes = await request(httpServer)
      .post('/quotes')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        originZip: '28001',
        destinationZip: '08001',
        weightKg: 1.5,
        volumeM3: 0.05,
        serviceType: 'standard',
      })
      .expect(201);
    quoteId = quoteRes.body.id;

    const shipmentRes = await request(httpServer)
      .post('/shipments')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        quoteId,
        originAddress: 'Av. Siempre Viva 123',
        destinationAddress: 'Calle Falsa 456',
        originZip: '28001',
        destinationZip: '08001',
        pickupDate: '2024-01-01',
        pickupSlot: '09-12',
        weightKg: 1.5,
        volumeM3: 0.05,
        serviceType: 'standard',
        priceQuote: quoteRes.body.price,
        priceFinal: quoteRes.body.price,
      })
      .expect(201);
    shipmentId = shipmentRes.body.id;
    trackingCode = shipmentRes.body.trackingCode;

    const myShipments = await request(httpServer)
      .get('/shipments')
      .query({ me: 'true' })
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
    expect(myShipments.body.find((s: any) => s.id === shipmentId)).toBeTruthy();

    const initialTracking = await request(httpServer)
      .get(`/shipments/${trackingCode}/tracking`)
      .expect(200);
    expect(initialTracking.body[0].status).toBe('created');

    await request(httpServer)
      .post(`/ops/shipments/${shipmentId}/assign-operator`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ operatorId })
      .expect(201);

    const statusRes = await request(httpServer)
      .post(`/ops/shipments/${shipmentId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ status: 'in_transit', note: 'Despachado', location: 'Hub central' })
      .expect(201);
    expect(statusRes.body[statusRes.body.length - 1].status).toBe('in_transit');

    const tracking = await request(httpServer).get(`/shipments/${shipmentId}/tracking`).expect(200);
    expect(tracking.body.some((s: any) => s.status === 'in_transit')).toBe(true);
  });

  it('protects operator routes with JWT guard', async () => {
    await request(httpServer).get('/ops/shipments').expect(401);
  });
});
