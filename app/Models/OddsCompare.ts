import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class OddsCompare extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public matchday: string

  @column()
  public league: string

  @column()
  public game: string

  @column()
  public logos: string

  @column()
  public oddscompare: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
