import { DateTime } from 'luxon'
import { BaseModel, column, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import GameOdd from 'App/Models/GameOdd';

export default class League extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public league: string

  @column()
  public logo: string

  @column()
  public link: string

  @column()
  public scraped: boolean

  @hasOne(() => GameOdd, {
    foreignKey: 'league_id',
  })
  public gameOdd: HasOne<typeof GameOdd>;

}
