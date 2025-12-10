import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddUserToQuotes1710000000006 implements MigrationInterface {
  name = 'AddUserToQuotes1710000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'quotes',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      'quotes',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('quotes');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('userId'));
    if (fk) {
      await queryRunner.dropForeignKey('quotes', fk);
    }
    await queryRunner.dropColumn('quotes', 'userId');
  }
}
