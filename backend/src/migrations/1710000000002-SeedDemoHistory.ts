import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDemoHistory1710000000002 implements MigrationInterface {
  name = 'SeedDemoHistory1710000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash =
      'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'; // sha256("password123")

    // Demo operator and admin
    await queryRunner.query(
      `INSERT INTO users (email, "passwordHash", role, name, "emailVerified")
       VALUES 
       ('operator@demo.com', $1, 'operator', 'Operador Demo', true),
       ('admin@demo.com', $1, 'admin', 'Admin Demo', true)
       ON CONFLICT (email) DO NOTHING`,
      [passwordHash],
    );

    const shipments = await queryRunner.query(
      `SELECT id, "trackingCode" FROM shipments WHERE "trackingCode" LIKE 'PKG-SEED-%' ORDER BY "trackingCode"`,
    );

    const statusMatrix = [
      { tracking: 'PKG-SEED-001', statuses: ['created', 'in_transit', 'delivered'] },
      { tracking: 'PKG-SEED-002', statuses: ['created', 'out_for_delivery'] },
      { tracking: 'PKG-SEED-003', statuses: ['created', 'at_hub'] },
      { tracking: 'PKG-SEED-004', statuses: ['created', 'in_transit'] },
      { tracking: 'PKG-SEED-005', statuses: ['created'] },
    ];

    for (const s of statusMatrix) {
      const shipment = shipments.find((sh: any) => sh.trackingCode === s.tracking);
      if (!shipment) continue;
      // Clear any prior history for consistency
      await queryRunner.query(`DELETE FROM shipment_status_history WHERE "shipmentId" = $1`, [
        shipment.id,
      ]);

      let lastStatus = 'created';
      for (const status of s.statuses) {
        lastStatus = status;
        await queryRunner.query(
          `INSERT INTO shipment_status_history ("shipmentId","status","note","changedBy","changedAt")
           VALUES ($1,$2,$3,$4, now() - interval '1 hour')`,
          [shipment.id, status, `Estado seed: ${status}`, 'operator@demo.com'],
        );
      }
      await queryRunner.query(`UPDATE shipments SET status = $1 WHERE id = $2`, [
        lastStatus,
        shipment.id,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const shipments = await queryRunner.query(
      `SELECT id FROM shipments WHERE "trackingCode" LIKE 'PKG-SEED-%'`,
    );
    if (shipments.length) {
      const ids = shipments.map((s: any) => `'${s.id}'`).join(',');
      await queryRunner.query(
        `DELETE FROM shipment_status_history WHERE "shipmentId" IN (${ids})`,
      );
    }
    await queryRunner.query(
      `DELETE FROM users WHERE email IN ('operator@demo.com','admin@demo.com')`,
    );
  }
}
