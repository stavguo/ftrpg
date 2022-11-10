import { addComponent, addEntity, IWorld } from 'bitecs'
import { Noise as RotNoise } from 'rot-js'
import { Position } from '../components/Position'
import { Noise } from '../components/Noise'
import { FOREST_LIMIT, PLAIN_LIMIT, THICKET_LIMIT, WATER_LIMIT, WORLD_HEIGHT, WORLD_WIDTH } from '../lib/settings'
import { Draw, DrawEnum } from '../components/Draw'
import { Tile } from '../components/Tile'

export const TILES = new Map<string, number>()

export const makeMap = (world: IWorld) => {
    const noise2D = new RotNoise.Simplex()
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {

            // Create entity
            const eid = addEntity(world)
            TILES.set(`${x},${y}`, eid)

            // Add Tile component
            addComponent(world, Tile, eid)

            // Add Position component
            addComponent(world, Position, eid)
            Position.x[eid] = x
            Position.y[eid] = y

            // Add Noise component
            const noise = noise2D.get(x/20, y/20)
            addComponent(world, Noise, eid)
            Noise.val[eid] = noise

            // Add Draw component
            addComponent(world, Draw, eid)
            if (noise < WATER_LIMIT) Draw.tile[eid] = DrawEnum.Water
            else if (noise < PLAIN_LIMIT) Draw.tile[eid] = DrawEnum.Plain
            else if (noise < FOREST_LIMIT) Draw.tile[eid] = DrawEnum.Forest
            else if (noise < THICKET_LIMIT) Draw.tile[eid] = DrawEnum.Thicket
        }
    }
}
