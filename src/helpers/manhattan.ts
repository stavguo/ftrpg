import { defineQuery, IWorld } from 'bitecs'
import { AvailableTiles } from '../components/actor/availableTiles'
import { Cell } from '../components/base/cell'
import { Distance } from '../components/actor/distance'
import { Terrain } from '../components/tile/terrain'
import { Tile } from '../components/tile/tile'

const tileQuery = defineQuery([Tile])

export function manStart(world: IWorld, playerId: number) {
    const tileEntities = tileQuery(world)
    const row = Cell.row[playerId]
    const col = Cell.col[playerId]
    const dist = Distance.dist[playerId]
    const possibleTiles: number[] = []
    manhattan(tileEntities, possibleTiles, row - 1, col, playerId, dist)
    manhattan(tileEntities, possibleTiles, row + 1, col, playerId, dist)
    manhattan(tileEntities, possibleTiles, row, col + 1, playerId, dist)
    manhattan(tileEntities, possibleTiles, row, col - 1, playerId, dist)
    const tiles = [...new Set(possibleTiles)]
    AvailableTiles.count[playerId] = tiles.length
    AvailableTiles.tiles[playerId].set(tiles)
}

function manhattan(
    tiles: number[],
    possibleTiles: number[],
    row: number,
    col: number,
    playerId: number,
    dist: number
) {
    if (!satisfiesBounds(row, col)) return
    const tileId = tiles[(row * 30) + col]
    const cost = Terrain.cost[tileId]
    if (cost === 0) return
    if (dist - cost < 0) return
    if (row === Cell.row[playerId] && col === Cell.col[playerId]) return
    possibleTiles.push(tileId)
    manhattan(tiles, possibleTiles, row - 1, col, playerId, dist - cost)
    manhattan(tiles, possibleTiles, row + 1, col, playerId, dist - cost)
    manhattan(tiles, possibleTiles, row, col + 1, playerId, dist - cost)
    manhattan(tiles, possibleTiles, row, col - 1, playerId, dist - cost)
}

function satisfiesBounds(row: number, col: number) {
    return (row >= 0 && row < 20 && col >= 0 && col < 30) ? true : false
}