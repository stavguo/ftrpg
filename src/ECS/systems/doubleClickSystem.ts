import * as Phaser from 'phaser'
import {
    addComponent,
    defineQuery,
    defineSystem,
    enterQuery,
    IWorld,
    removeComponent
} from 'bitecs'
import { Actor, ActorTypeEnum } from '../components/actor/actor'
import { Phase } from '../components/state/phase'
import { Selected } from '../components/state/selected'
import { Tile } from '../components/tile/tile'
import { manStart } from '../helpers/manhattan'
import { Path } from '../types/Path'
import { CurrentTile } from '../components/actor/currentTile'
import { Tint } from '../components/tile/tint'
import { Step } from '../components/tile/step'

const actorQuery = defineQuery([Actor])
const tileQuery = defineQuery([Tile])
const gameManagerQuery = defineQuery([Phase])
const actorQueryEnter = enterQuery(actorQuery)
const tileQueryEnter = enterQuery(tileQuery)

function clearTint(
    actorId: number,
    availableTilesAll: Map<number, Map<number, Path>>,
    world: IWorld
) {
    Array.from(availableTilesAll.get(actorId).keys()).map((key) => {
        removeComponent(world, Tint, key)
    })
}

function setTint(
    actorId: number,
    availableTiles: Map<number, Path>,
    world: IWorld
) {
    Array.from(availableTiles.keys()).map((key) => {
        addComponent(world, Tint, key)
        if (Actor.type[actorId] === ActorTypeEnum.Player) {
            Tint.color[key] = 0
        } else {
            Tint.color[key] = 1
        }
    })
}

function moveActor(
    actorId: number,
    targetId: number,
    availableTiles: Map<number, Path>,
    world: IWorld
) {
    let cursor = targetId
    const current = CurrentTile.tile[actorId]
    while (true) {
        const parent = availableTiles.get(cursor).parent
        addComponent(world, Step, cursor)
        Step.actor[cursor] = actorId
        Step.prevTile[cursor] = parent
        Step.targetId[cursor] = targetId
        if (parent === current) break
        cursor = parent
    }
}


async function actorDoubleClick(
    playerId: number,
    gmId: number,
    availableTilesAll: Map<number, Map<number, Path>>,
    world: IWorld
) {
    // If this actor is selected when double clicked
    if (Selected.entity[gmId] === playerId) {
        clearTint(playerId, availableTilesAll, world)
        Selected.entity[gmId] = -1
    }
    // If this actor is not selected when double clicked
    else if (Selected.entity[gmId] !== playerId) {
        // If there is already a selected actor
        if (Selected.entity[gmId] !== -1) {
            clearTint(Selected.entity[gmId], availableTilesAll, world)
            Selected.entity[gmId] = -1
            await new Promise(f => setTimeout(f, 100))
        }
        manStart(world, playerId, availableTilesAll)
        setTint(playerId, availableTilesAll.get(playerId), world)
        Selected.entity[gmId] = playerId
    }
}

function tileDoubleClick(
    tileId: number,
    gmId: number,
    actorEntities: number[],
    world: IWorld,
    availableTiles: Map<number, Map<number, Path>>,
) {
    if (Selected.entity[gmId] !== -1) {
        for (let i = 0; i < actorEntities.length; ++ i) {
            const actorId = actorEntities[i]
            Array.from(availableTiles.keys()).map((key) => {
                if (availableTiles.get(key).has(tileId) && Selected.entity[gmId] === actorId) {
                    moveActor(actorId, tileId, availableTiles.get(actorId), world)
                    clearTint(actorId, availableTiles, world)
                    Selected.entity[gmId] = -1
                }
            })
        }
    }
}

export const createDoubleClickSystem = (
    scene: Phaser.Scene,
    spriteById: Map<number, Phaser.GameObjects.Sprite>,
    availableTilesAll: Map<number, Map<number, Path>>
) => {
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
                        actorDoubleClick(
                            id,
                            gmEntities[0],
                            availableTilesAll,
                            world
                        )
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
                        tileDoubleClick(
                            id,
                            gmEntities[0],
                            actorEntities,
                            world,
                            availableTilesAll
                        )
                    }
                })
            }
        }
        return world
    })
}