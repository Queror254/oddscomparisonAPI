import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'rate_limits'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('key', 191).notNullable().primary()
      table.integer('points', 9).notNullable()
      table.bigint('expire').unsigned()

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
