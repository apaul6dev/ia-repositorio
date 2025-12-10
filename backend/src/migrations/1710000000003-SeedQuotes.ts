import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedQuotes1710000000003 implements MigrationInterface {
  name = 'SeedQuotes1710000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const now = new Date();
    const shipDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const quotes = [
      {
        serviceType: 'express',
        weightKg: 1.2,
        volumeM3: 0.02,
        originZip: '10001',
        destinationZip: '90001',
        price: 15.5,
        etaMinDays: 1,
        etaMaxDays: 2,
        shipDate,
      },
      {
        serviceType: 'standard',
        weightKg: 2.5,
        volumeM3: 0.04,
        originZip: '33101',
        destinationZip: '77001',
        price: 12.3,
        etaMinDays: 2,
        etaMaxDays: 4,
        shipDate,
      },
      {
        serviceType: 'economic',
        weightKg: 3,
        volumeM3: 0.05,
        originZip: '60601',
        destinationZip: '94101',
        price: 10.1,
        etaMinDays: 3,
        etaMaxDays: 6,
        shipDate,
      },
      {
        serviceType: 'standard',
        weightKg: 0.8,
        volumeM3: 0.015,
        originZip: '75201',
        destinationZip: '85001',
        price: 9.9,
        etaMinDays: 2,
        etaMaxDays: 4,
        shipDate,
      },
      {
        serviceType: 'express',
        weightKg: 1.8,
        volumeM3: 0.03,
        originZip: '33130',
        destinationZip: '20001',
        price: 14.2,
        etaMinDays: 1,
        etaMaxDays: 2,
        shipDate,
      },
    ];

    for (const q of quotes) {
      await queryRunner.query(
        `INSERT INTO quotes ("serviceType","weightKg","volumeM3","originZip","destinationZip","price","etaMinDays","etaMaxDays","shipDate","expiresAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now() + interval '1 hour')`,
        [
          q.serviceType,
          q.weightKg,
          q.volumeM3,
          q.originZip,
          q.destinationZip,
          q.price,
          q.etaMinDays,
          q.etaMaxDays,
          q.shipDate,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM quotes WHERE "originZip" IN ('10001','33101','60601','75201','33130') AND "destinationZip" IN ('90001','77001','94101','85001','20001')`,
    );
  }
}
