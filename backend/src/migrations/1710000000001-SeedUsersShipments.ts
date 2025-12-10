import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedUsersShipments1710000000001 implements MigrationInterface {
  name = 'SeedUsersShipments1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash =
      'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'; // sha256("password123")
    const usersData = Array.from({ length: 5 }, (_v, i) => ({
      email: `user${i + 1}@demo.com`,
      name: `Usuario ${i + 1}`,
      role: 'client',
      passwordHash,
    }));

    const users = await Promise.all(
      usersData.map((u) =>
        queryRunner.query(
          `INSERT INTO users (email, "passwordHash", role, name, "emailVerified") VALUES ($1,$2,$3,$4,$5) RETURNING id, email`,
          [u.email, u.passwordHash, u.role, u.name, true],
        ),
      ),
    );

    const userIds = users.map((u) => u[0].id);
    const nowDate = new Date().toISOString().slice(0, 10);

    const shipmentsData = [
      {
        tracking: 'PKG-SEED-001',
        userId: userIds[0],
        originZip: '10001',
        destinationZip: '90001',
      },
      {
        tracking: 'PKG-SEED-002',
        userId: userIds[1],
        originZip: '33101',
        destinationZip: '77001',
      },
      {
        tracking: 'PKG-SEED-003',
        userId: userIds[2],
        originZip: '60601',
        destinationZip: '94101',
      },
      {
        tracking: 'PKG-SEED-004',
        userId: userIds[3],
        originZip: '75201',
        destinationZip: '85001',
      },
      {
        tracking: 'PKG-SEED-005',
        userId: userIds[4],
        originZip: '33130',
        destinationZip: '20001',
      },
    ];

    for (const s of shipmentsData) {
      await queryRunner.query(
        `INSERT INTO shipments ("trackingCode","userId","serviceType","weightKg","volumeM3","originAddress","destinationAddress","originZip","destinationZip","pickupDate","pickupSlot","priceQuote","priceFinal","status")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          s.tracking,
          s.userId,
          'standard',
          1.5,
          0.02,
          'Calle Falsa 123',
          'Avenida Demo 456',
          s.originZip,
          s.destinationZip,
          nowDate,
          '09:00-12:00',
          10,
          10,
          'created',
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM shipments WHERE "trackingCode" LIKE 'PKG-SEED-%'`);
    await queryRunner.query(
      `DELETE FROM users WHERE email IN ('user1@demo.com','user2@demo.com','user3@demo.com','user4@demo.com','user5@demo.com')`,
    );
  }
}
