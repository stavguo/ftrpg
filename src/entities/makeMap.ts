import { addComponent, addEntity, IWorld } from 'bitecs'
import { Noise as RotNoise } from 'rot-js'
import { Background, BackgroundEnum } from '../components/Background'
import { Noise } from '../components/Noise'
import { Position } from '../components/Position'
import { Tile } from '../components/Tile'
import { FOREST_LIMIT, PLAIN_LIMIT, THICKET_LIMIT, WATER_LIMIT, WORLD_HEIGHT, WORLD_WIDTH } from '../lib/settings'

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
            addComponent(world, Background, eid)
            if (noise < WATER_LIMIT) {
                Background.type[eid] = BackgroundEnum.Water
            } else if (noise < PLAIN_LIMIT) {
                Background.type[eid] = BackgroundEnum.Plain
            } else if (noise < FOREST_LIMIT) {
                Background.type[eid] = BackgroundEnum.Forest
            } else if (noise < THICKET_LIMIT) {
                Background.type[eid] = BackgroundEnum.Thicket
            }
        }
    }
}
