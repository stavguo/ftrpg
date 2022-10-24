import * as Phaser from 'phaser'
import {
    defineQuery,
    defineSystem,
    enterQuery,
    exitQuery
} from 'bitecs'
import { Position } from '../components/position'
import { Sprite } from '../components/sprite'
import { Frame } from '../components/frame'

export const createSpriteSystem = (scene: Phaser.Scene, textures: string[]) => {
    const spriteById = new Map<number, Phaser.GameObjects.Sprite>()
    const spriteQuery = defineQuery([Sprite, Position, Frame])
    const spriteQueryEnter = enterQuery(spriteQuery)
    const spriteQueryExit = exitQuery(spriteQuery)
    return defineSystem(world => {
        const enterEntities = spriteQueryEnter(world)
        for (let i = 0; i < enterEntities.length; ++ i) {
            const id = enterEntities[i]
            const textId = Sprite.texture[id]
            const texture = textures[textId]
            const frame = Frame.frame[id]
            spriteById.set(
                id,
                scene.add.sprite(0,0,texture, frame)
                    .setOrigin(0)
                    .setScale(4)
            )
        }
        const entities = spriteQuery(world)
        for (let i = 0; i < entities.length; ++i) {
            const id = entities[i]
            const sprite = spriteById.get(id)
            if (!sprite) {
                continue
            }
            sprite.x = Position.x[id]
            sprite.y = Position.y[id]
        }
        const exitEntities = spriteQueryExit(world)
        for (let i = 0; i < exitEntities.length; ++i) {
            const id = exitEntities[i]
            const sprite = spriteById.get(id)
            if (!sprite) continue
            sprite.destroy()
            spriteById.delete(id)
        }
        return world
    })
}