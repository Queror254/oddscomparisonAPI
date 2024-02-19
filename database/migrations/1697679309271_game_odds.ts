import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import League from 'App/Models/League'
export default class extends BaseSchema {
  protected tableName = 'game_odds'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('league_id').unsigned().references('id').inTable('leagues')
      table.string('matchday')
      table.string('match')
      table.string('matchodds')
      table.string('oddsvender', 500)

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
