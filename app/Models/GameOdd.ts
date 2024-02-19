import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import League from 'App/Models/League';

export default class GameOdd extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public matchday: string

  @column()
  public match: string

  @column()
  public matchodds: string

  @column()
  public oddsvender: string

  @column()
  public league_id: number

  @belongsTo(() => League, {
    foreignKey: 'league_id',
  })
  public league: BelongsTo<typeof League>;


}