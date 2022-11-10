import { defineQuery, Not } from 'bitecs'
import { Position } from '../components/Position'
import { Visible } from '../components/Visible'

export const invisibleQuery = defineQuery([Position, Not(Visible)])