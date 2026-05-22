import { rikishiType } from './rikishi'
import { tournamentType } from './tournament'
import { matchType } from './match'

export const schemaTypes = [rikishiType, tournamentType, matchType]
export const schema = { types: [rikishiType, tournamentType, matchType] }
