import * as Phaser from 'phaser'
import {
    defineQuery,
    defineSystem,
    enterQuery,
    exitQuery
} from 'bitecs'
import { Tint, TintEnum } from '../components/tile/tint'

const tintQuery = defineQuery([Tint])
const tintEnterQuery = enterQuery(tintQuery)
const tintExitQuery = exitQuery(tintQuery)

export const createTintSystem = (spriteById: Map<number, Phaser.GameObjects.Sprite>) => {
    return defineSystem(world => {
        const enterEntities = tintEnterQuery(world)
        for (let i = 0; i < enterEntities.length; ++ i) {
            const tileId = enterEntities[i]
            const tile = spriteById.get(tileId)
            if (Tint.color[tileId] === TintEnum.Blue) {
                tile.setTint(0x7D99D7,0xffffff,0xffffff,0xffffff)
            } else {
                tile.setTint(0xffffff,0xffffff,0xffffff,0xd77d7d)
            }
        }
        const exitEntities = tintExitQuery(world)
        for (let i = 0; i < exitEntities.length; ++ i) {
            const tileId = exitEntities[i]
            const tile = spriteById.get(tileId)
            tile.clearTint()
        }
        return world
    })
}