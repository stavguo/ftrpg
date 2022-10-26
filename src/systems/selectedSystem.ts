import * as Phaser from 'phaser'
import {
    defineQuery,
    defineSystem
} from 'bitecs'
import { Actor } from '../components/actor/actor'
import { AvailableTiles } from '../components/actor/availableTiles'
import { Phase } from '../components/state/phase'
import { Selected } from '../components/state/selected'

export const createSelectedSystem = (spriteById: Map<number, Phaser.GameObjects.Sprite>) => {
    const actorQuery = defineQuery([Actor])
    const gmQuery = defineQuery([Phase])
    return defineSystem(world => {
        const actorEntities = actorQuery(world)
        const gmEntities = gmQuery(world)
        const gmId = gmEntities[0]
        for (let i = 0; i < actorEntities.length; ++i) {
            const playerId = actorEntities[i]
            // if (Selected.entity[gmId] === playerId) {
            //     for (let j = 0; j < AvailableTiles.count[playerId]; ++j) {
            //         const tile = spriteById.get(AvailableTiles.tiles[playerId][j])
            //         if (!tile.isTinted) {
            //             tile.setTint(0x7D99D7,0xffffff,0xffffff,0xffffff)
            //         }
            //     }
            // } else {
            //     for (let j = 0; j < AvailableTiles.count[playerId]; ++j) {
            //         const tileId = AvailableTiles.tiles[playerId][j]
            //         const tile = spriteById.get(tileId)
            //         const selectedId = Selected.entity[gmEntities[0]]
            //         if (selectedId >= 0) {
            //             if (!AvailableTiles.tiles[selectedId].includes(tileId)) {
            //                 tile.clearTint()
            //             }
            //         }
            //     }
            // }
        }
        return world
    })
}