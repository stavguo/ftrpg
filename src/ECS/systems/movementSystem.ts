import * as Phaser from 'phaser'
import {
    defineQuery,
    defineSystem,
    IWorld,
    removeComponent
} from 'bitecs'
import { Step } from '../components/tile/step'
import { CurrentTile } from '../components/actor/currentTile'
import { Cell } from '../components/base/cell'

const stepQuery = defineQuery([Step])
const SPEED = 5

function resetTile(
    sprite: Phaser.GameObjects.Sprite,
    actorId: number,
    tileId: number,
    world: IWorld
) {
    Cell.col[actorId] = Cell.row[tileId]
    sprite.x = Cell.col[tileId] * 64
    Cell.row[actorId] = Cell.row[tileId]
    sprite.y = Cell.row[tileId] * 64
    CurrentTile.tile[actorId] = tileId
    if (Step.targetId[tileId] === tileId) {
        // TODO: Done moving
    }
    removeComponent(world, Step, tileId)
}

export const createMovementSystem = (spriteById: Map<number, Phaser.GameObjects.Sprite>) => {
    return defineSystem(world => {
        const stepEntities = stepQuery(world)
        for (let i = 0; i < stepEntities.length; ++ i) {
            const tileId = stepEntities[i]
            const actorId = Step.actor[tileId]
            const prevTileId = Step.prevTile[tileId]
            const currentTileId = CurrentTile.tile[actorId]
            if (currentTileId === prevTileId) {
                const sprite = spriteById.get(actorId)
                // Right
                if (Cell.row[currentTileId] === Cell.row[tileId] && Cell.col[currentTileId] < Cell.col[tileId]) {
                    if (sprite.x >= Cell.col[tileId] * 64) {
                        resetTile(sprite, actorId, tileId, world)
                        continue
                    }
                    sprite.x += SPEED
                }
                // Left
                else if (Cell.row[currentTileId] === Cell.row[tileId] && Cell.col[currentTileId] > Cell.col[tileId]) {
                    if (sprite.x <= Cell.col[tileId] * 64) {
                        resetTile(sprite, actorId, tileId, world)
                        continue
                    }
                    sprite.x -= SPEED
                }
                // Up
                else if (Cell.row[currentTileId] > Cell.row[tileId] && Cell.col[currentTileId] === Cell.col[tileId]) {
                    if (sprite.y <= Cell.row[tileId] * 64) {
                        resetTile(sprite, actorId, tileId, world)
                        continue
                    }
                    sprite.y -= SPEED
                }
                // Down
                else if (Cell.row[currentTileId] < Cell.row[tileId] && Cell.col[currentTileId] === Cell.col[tileId]) {
                    if (sprite.y >= Cell.row[tileId] * 64) {
                        resetTile(sprite, actorId, tileId, world)
                        continue
                    }
                    sprite.y += SPEED
                }
            }
        }
        return world
    })
}