import { defineQuery, IWorld } from 'bitecs'
import { Cell } from '../components/base/cell'
import { Distance } from '../components/actor/distance'
import { Terrain } from '../components/tile/terrain'
import { Tile } from '../components/tile/tile'
import { Path } from '../types/Path'
import { Actor } from '../components/actor/actor'
import { CurrentTile } from '../components/actor/currentTile'

const tileQuery = defineQuery([Tile])
const actorQuery = defineQuery([Actor])


export function manStart(
    world: IWorld,
    playerId: number,
    possibleTilesAll: Map<number, Map<number, Path>>
) {
    const possibleTiles = new Map<number, Path>()
    const tileEntities = tileQuery(world)
    const actorEntities = actorQuery(world)
    const row = Cell.row[CurrentTile.tile[playerId]]
    const col = Cell.col[CurrentTile.tile[playerId]]
    const tileId = tileEntities[(row * 30) + col]
    const dist = Distance.dist[playerId]
    manhattan(tileEntities, actorEntities, possibleTiles, row - 1, col, playerId, dist, tileId)
    manhattan(tileEntities, actorEntities, possibleTiles, row + 1, col, playerId, dist, tileId)
    manhattan(tileEntities, actorEntities, possibleTiles, row, col + 1, playerId, dist, tileId)
    manhattan(tileEntities, actorEntities, possibleTiles, row, col - 1, playerId, dist, tileId)
    possibleTilesAll.set(
        playerId,
        possibleTiles
    )
}

function manhattan(
    tiles: number[],
    actors: number[],
    possibleTiles: Map<number, Path>,
    row: number,
    col: number,
    playerId: number,
    dist: number,
    parent: number
) {
    if (!satisfiesBounds(row, col)) return
    const tileId = tiles[(row * 30) + col]
    const cost = Terrain.cost[tileId]
    const remainder = dist - cost
    if (cost === 0) return
    if (remainder < 0) return
    if (row === Cell.row[CurrentTile.tile[playerId]] && col === Cell.col[CurrentTile.tile[playerId]]) return
    for (let i = 0; i < actors.length; ++i) {
        const actorId = actors[i]
        if (CurrentTile.tile[actorId] === tileId) return
    }
    if (possibleTiles.has(tileId)) {
        if (possibleTiles.get(tileId).cost < remainder) {
            possibleTiles.set(
                tileId,
                {
                    cost: remainder,
                    parent: parent
                }
            )
        }
    } else {
        possibleTiles.set(
            tileId,
            {
                cost: remainder,
                parent: parent
            }
        )
    }
    manhattan(tiles, actors, possibleTiles, row - 1, col, playerId, dist - cost, tileId)
    manhattan(tiles, actors, possibleTiles, row + 1, col, playerId, dist - cost, tileId)
    manhattan(tiles, actors, possibleTiles, row, col + 1, playerId, dist - cost, tileId)
    manhattan(tiles, actors, possibleTiles, row, col - 1, playerId, dist - cost, tileId)
}

function satisfiesBounds(row: number, col: number) {
    return (row >= 0 && row < 20 && col >= 0 && col < 30) ? true : false
}