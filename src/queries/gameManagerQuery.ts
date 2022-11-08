import { defineQuery, enterQuery } from 'bitecs'
import { GameManager } from '../components/GameManager'

export const gameManagerQuery = defineQuery([GameManager])
export const gameManagerEnterQuery = enterQuery(gameManagerQuery)