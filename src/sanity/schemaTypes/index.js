import { rikishiType } from './rikishi'
import { tournamentType } from './tournament'
import { matchType } from './match'
import { h2hType } from './h2h'

export const schemaTypes = [rikishiType, tournamentType, matchType, h2hType]
export const schema = { types: [rikishiType, tournamentType, matchType, h2hType] }
