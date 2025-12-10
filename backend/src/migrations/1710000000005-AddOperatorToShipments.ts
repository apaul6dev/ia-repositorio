import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddOperatorToShipments1710000000005 implements MigrationInterface {
  name = 'AddOperatorToShipments1710000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'shipments',
      new TableColumn({
        name: 'operatorId',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      'shipments',
      new TableForeignKey({
        columnNames: ['operatorId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('shipments');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('operatorId'));
    if (fk) {
      await queryRunner.dropForeignKey('shipments', fk);
    }
    await queryRunner.dropColumn('shipments', 'operatorId');
  }
}
