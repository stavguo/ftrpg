import {
    defineQuery,
    defineSystem,
    enterQuery
} from 'bitecs'
import { Actor } from '../components/actor/actor'
import { CurrentTile } from '../components/actor/currentTile'
import { Cell } from '../components/base/cell'
import { Tile } from '../components/tile/tile'
import { manStart } from '../helpers/manhattan'
import { Path } from '../types/Path'

const actorQuery = defineQuery([Actor])
const tileQuery = defineQuery([Tile])
const actorQueryEnter = enterQuery(actorQuery)

export const createAvailableTileSystem = (availableTiles: Map<number, Map<number, Path>>) => {
    return defineSystem(world => {
        const enterEntities = actorQueryEnter(world)
        const tileEntities = tileQuery(world)
        for (let i = 0; i < enterEntities.length; ++ i) {
            const actorId = enterEntities[i]
            for (let j = 0; j < tileEntities.length; ++j) {
                const tileId = tileEntities[j]
                if (
                    Cell.row[actorId] === Cell.row[tileId] &&
                    Cell.col[actorId] === Cell.col[tileId]
                ) {
                    CurrentTile.tile[actorId] = tileId
                    break
                }
            }
            manStart(world, actorId, availableTiles)
        }
        return world
    })
}