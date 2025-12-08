import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class InitSchema1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, default: 'uuid_generate_v4()' },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'passwordHash', type: 'varchar' },
          { name: 'role', type: 'varchar', default: `'client'` },
          { name: 'name', type: 'varchar', isNullable: true },
          { name: 'emailVerified', type: 'boolean', default: false },
          { name: 'phone', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'addresses',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'userId', type: 'uuid' },
          { name: 'label', type: 'varchar' },
          { name: 'street', type: 'varchar' },
          { name: 'city', type: 'varchar', isNullable: true },
          { name: 'state', type: 'varchar', isNullable: true },
          { name: 'country', type: 'varchar', isNullable: true },
          { name: 'zip', type: 'varchar', isNullable: true },
          { name: 'lat', type: 'float', isNullable: true },
          { name: 'lng', type: 'float', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'addresses',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'quotes',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'serviceType', type: 'varchar' },
          { name: 'weightKg', type: 'float' },
          { name: 'volumeM3', type: 'float' },
          { name: 'originZip', type: 'varchar' },
          { name: 'destinationZip', type: 'varchar' },
          { name: 'price', type: 'float' },
          { name: 'etaMinDays', type: 'int' },
          { name: 'etaMaxDays', type: 'int' },
          { name: 'shipDate', type: 'date', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'expiresAt', type: 'timestamptz', isNullable: true },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'shipments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'trackingCode', type: 'varchar', isUnique: true },
          { name: 'userId', type: 'uuid', isNullable: true },
          { name: 'quoteId', type: 'uuid', isNullable: true },
          { name: 'serviceType', type: 'varchar' },
          { name: 'weightKg', type: 'float' },
          { name: 'volumeM3', type: 'float' },
          { name: 'originAddress', type: 'varchar' },
          { name: 'destinationAddress', type: 'varchar' },
          { name: 'originZip', type: 'varchar' },
          { name: 'destinationZip', type: 'varchar' },
          { name: 'pickupDate', type: 'date' },
          { name: 'pickupSlot', type: 'varchar' },
          { name: 'priceQuote', type: 'float' },
          { name: 'priceFinal', type: 'float' },
          { name: 'status', type: 'varchar', default: `'created'` },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createForeignKeys('shipments', [
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['quoteId'],
        referencedTableName: 'quotes',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'shipment_status_history',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'shipmentId', type: 'uuid' },
          { name: 'status', type: 'varchar' },
          { name: 'note', type: 'text', isNullable: true },
          { name: 'location', type: 'varchar', isNullable: true },
          { name: 'changedBy', type: 'varchar', isNullable: true },
          { name: 'changedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'shipment_status_history',
      new TableForeignKey({
        columnNames: ['shipmentId'],
        referencedTableName: 'shipments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'shipmentId', type: 'uuid' },
          { name: 'amount', type: 'float' },
          { name: 'currency', type: 'varchar', default: `'USD'` },
          { name: 'provider', type: 'varchar', default: `'mockpay'` },
          { name: 'status', type: 'varchar', default: `'pending'` },
          { name: 'externalRef', type: 'varchar', isNullable: true },
          { name: 'paidAt', type: 'timestamptz', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['shipmentId'],
        referencedTableName: 'shipments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'routes',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar' },
          { name: 'region', type: 'varchar', isNullable: true },
          { name: 'vehicle', type: 'varchar', isNullable: true },
          { name: 'driver', type: 'varchar', isNullable: true },
          { name: 'capacity', type: 'int', isNullable: true },
          { name: 'active', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'route_assignments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'routeId', type: 'uuid' },
          { name: 'shipmentId', type: 'uuid' },
          { name: 'assignedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createForeignKeys('route_assignments', [
      new TableForeignKey({
        columnNames: ['routeId'],
        referencedTableName: 'routes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['shipmentId'],
        referencedTableName: 'shipments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndex(
      'shipments',
      new TableIndex({ columnNames: ['status'] }),
    );
    await queryRunner.createIndex(
      'shipments',
      new TableIndex({ columnNames: ['userId'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('route_assignments');
    await queryRunner.dropTable('routes');
    await queryRunner.dropTable('payments');
    await queryRunner.dropTable('shipment_status_history');
    await queryRunner.dropTable('shipments');
    await queryRunner.dropTable('quotes');
    await queryRunner.dropTable('addresses');
    await queryRunner.dropTable('users');
  }
}
