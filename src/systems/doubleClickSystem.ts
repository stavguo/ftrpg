import * as Phaser from 'phaser'
import {
    defineQuery,
    defineSystem,
    enterQuery,
    IWorld
} from 'bitecs'
import { Actor, ActorTypeEnum } from '../components/actor/actor'
import { Phase } from '../components/state/phase'
import { Selected } from '../components/state/selected'
import { AvailableTiles } from '../components/actor/availableTiles'
import { Tile } from '../components/tile/tile'
import { Cell } from '../components/base/cell'
import { manStart } from '../helpers/manhattan'

const actorQuery = defineQuery([Actor])
const tileQuery = defineQuery([Tile])
const gameManagerQuery = defineQuery([Phase])
const actorQueryEnter = enterQuery(actorQuery)
const tileQueryEnter = enterQuery(tileQuery)

function clearTint(actorId: number, spriteById: Map<number, Phaser.GameObjects.Sprite>) {
    for (let j = 0; j < AvailableTiles.count[actorId]; ++j) {
        const tileId = AvailableTiles.tiles[actorId][j]
        const tile = spriteById.get(tileId)
        tile.clearTint()
    }
}

function setTint(actorId: number, spriteById: Map<number, Phaser.GameObjects.Sprite>) {
    for (let j = 0; j < AvailableTiles.count[actorId]; ++j) {
        const tile = spriteById.get(AvailableTiles.tiles[actorId][j])
        if (Actor.type[actorId] === ActorTypeEnum.Player) {
            tile.setTint(0x7D99D7,0xffffff,0xffffff,0xffffff)
        } else {
            tile.setTint(0xffffff,0xffffff,0xffffff,0xd77d7d)
        }
    }
}

function actorDoubleClick(
    playerId: number,
    gmId: number,
    spriteById: Map<number, Phaser.GameObjects.Sprite>
) {
    // If this actor is selected when its already selected
    if (Selected.entity[gmId] === playerId) {
        clearTint(playerId, spriteById)
        Selected.entity[gmId] = -1
    }
    // If this actor is selected when its not selected
    else if (Selected.entity[gmId] !== playerId) {
        // If there is already a selected actor
        if (Selected.entity[gmId] !== -1) {
            clearTint(Selected.entity[gmId], spriteById)
        }
        setTint(playerId, spriteById)
        Selected.entity[gmId] = playerId
    }
}

function tileDoubleClick(
    tileId: number,
    gmId: number,
    spriteById: Map<number, Phaser.GameObjects.Sprite>,
    actorEntities: number[],
    world: IWorld
) {
    // Get this tiles row/col
    //const tileRow = Cell.row[tileId]
    //const tileCol = Cell.col[tileId]
    // For every actor
    if (Selected.entity[gmId] !== -1) {
        for (let i = 0; i < actorEntities.length; ++ i) {
            const actorId = actorEntities[i]
            for (let j = 0; j < AvailableTiles.count[actorId]; ++j) {
                if (AvailableTiles.tiles[actorId][j] === tileId && Selected.entity[gmId] === actorId) {
                    Cell.row[actorId] = Cell.row[tileId]
                    Cell.col[actorId] = Cell.col[tileId]
                    clearTint(actorId, spriteById)
                    manStart(world, actorId)
                    Selected.entity[gmId] = -1
                }
            }
        }
    }
}

export const createDoubleClickSystem = (scene: Phaser.Scene, spriteById: Map<number, Phaser.GameObjects.Sprite>) => {
    return defineSystem(world => {
        const gmEntities = gameManagerQuery(world)
        const actorEntities = actorQueryEnter(world)
        const tileEntities = tileQueryEnter(world)
        for (let i = 0; i < actorEntities.length; ++ i) {
            const id = actorEntities[i]
            const char = spriteById.get(id)
            if (char) {
                let lastTime = 0
                char.on('pointerdown', ()=>{
                    const clickDelay = scene.time.now - lastTime
                    lastTime = scene.time.now
                    if(clickDelay < 350) {
                        actorDoubleClick(id, gmEntities[0], spriteById)
                    }
                })
            }
        }
        for (let i = 0; i < tileEntities.length; ++ i) {
            const id = tileEntities[i]
            const tile = spriteById.get(id)
            if (tile) {
                let lastTime = 0
                tile.on('pointerdown', ()=>{
                    const clickDelay = scene.time.now - lastTime
                    lastTime = scene.time.now
                    if(clickDelay < 350) {
                        tileDoubleClick(id, gmEntities[0], spriteById, actorEntities, world)
                        //console.log('tile click')
                    }
                })
            }
        }
        return world
    })
}