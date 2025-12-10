import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAddresses1710000000004 implements MigrationInterface {
  name = 'SeedAddresses1710000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.query(
      `SELECT id, email FROM users WHERE email IN ('user1@demo.com','user2@demo.com','user3@demo.com','user4@demo.com','user5@demo.com')`,
    );
    const addresses = [
      {
        label: 'Casa',
        street: 'Calle Principal 101',
        city: 'Ciudad Demo',
        state: 'Estado Demo',
        country: 'Pais Demo',
        zip: '10001',
      },
      {
        label: 'Oficina',
        street: 'Avenida Trabajo 202',
        city: 'Ciudad Negocio',
        state: 'Estado Negocio',
        country: 'Pais Demo',
        zip: '20002',
      },
    ];

    for (const u of users) {
      for (const addr of addresses) {
        await queryRunner.query(
          `INSERT INTO addresses ("userId","label","street","city","state","country","zip")
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            u.id,
            `${addr.label} de ${u.email.split('@')[0]}`,
            addr.street,
            addr.city,
            addr.state,
            addr.country,
            addr.zip,
          ],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM addresses WHERE "label" LIKE 'Casa de user%' OR "label" LIKE 'Oficina de user%'`,
    );
  }
}
