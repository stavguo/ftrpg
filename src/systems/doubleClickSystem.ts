import * as Phaser from 'phaser'
import {
    defineQuery,
    defineSystem,
    enterQuery
} from 'bitecs'
import { Actor } from '../components/actor/actor'
import { Phase } from '../components/state/phase'
import { Selected } from '../components/state/selected'
import { AvailableTiles } from '../components/actor/availableTiles'

const actorQuery = defineQuery([Actor])
const gameManagerQuery = defineQuery([Phase])
const actorQueryEnter = enterQuery(actorQuery)

function doubleClick(
    playerId: number,
    gmId: number,
    spriteById: Map<number, Phaser.GameObjects.Sprite>
) {
    if (Selected.entity[gmId] === playerId) {
        // Clear tint of previously selected tiles
        const selectedId = Selected.entity[gmId]
        for (let j = 0; j < AvailableTiles.count[selectedId]; ++j) {
            const tileId = AvailableTiles.tiles[selectedId][j]
            const tile = spriteById.get(tileId)
            tile.clearTint()
        }
        // set selected to -1
        Selected.entity[gmId] = -1
    } else {
        // Clear tint of previously selected tiles
        const selectedId = Selected.entity[gmId]
        for (let j = 0; j < AvailableTiles.count[selectedId]; ++j) {
            const tileId = AvailableTiles.tiles[selectedId][j]
            const tile = spriteById.get(tileId)
            tile.clearTint()
        }
        // set selected to playerId
        Selected.entity[gmId] = playerId
        // Tint tiles
        for (let j = 0; j < AvailableTiles.count[playerId]; ++j) {
            const tile = spriteById.get(AvailableTiles.tiles[playerId][j])
            tile.setTint(0x7D99D7,0xffffff,0xffffff,0xffffff)
        }
    }
    console.log(Selected.entity[gmId])
}

export const createDoubleClickSystem = (scene: Phaser.Scene, spriteById: Map<number, Phaser.GameObjects.Sprite>) => {
    return defineSystem(world => {
        const gmEntities = gameManagerQuery(world)
        const enterEntities = actorQueryEnter(world)
        for (let i = 0; i < enterEntities.length; ++ i) {
            console.log('player')
            const id = enterEntities[i]
            const char = spriteById.get(id)
            if (char) {
                let lastTime = 0
                char.on('pointerdown', ()=>{
                    const clickDelay = scene.time.now - lastTime
                    lastTime = scene.time.now
                    if(clickDelay < 350) {
                        doubleClick(id, gmEntities[0], spriteById)
                    }
                })
            }
        }
        return world
    })
}