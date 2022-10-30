import * as Phaser from 'phaser'
import {
    defineQuery,
    defineSystem,
    enterQuery
} from 'bitecs'
import { Cell } from '../components/base/cell'
import { Sprite } from '../components/base/sprite'
import { Frame } from '../components/base/frame'
import { Actor } from '../components/actor/actor'
import { Tile } from '../components/tile/tile'

export const createSpriteSystem = (scene: Phaser.Scene, textures: string[], spriteById: Map<number, Phaser.GameObjects.Sprite>) => {
    const actorQuery = defineQuery([Actor])
    const tileQuery = defineQuery([Tile])
    const actorQueryEnter = enterQuery(actorQuery)
    const tileQueryEnter = enterQuery(tileQuery)
    return defineSystem(world => {
        const tileEntities = tileQueryEnter(world)
        for (let i = 0; i < tileEntities.length; ++ i) {
            const id = tileEntities[i]
            const row = Cell.row[id]
            const col = Cell.col[id]
            const textId = Sprite.texture[id]
            const texture = textures[textId]
            const frame = Frame.frame[id]
            spriteById.set(
                id,
                scene.add.sprite(col * 64,row * 64,texture, frame)
                    .setOrigin(0)
                    .setScale(4)
                    .setInteractive()
            )
        }
        const actorEntities = actorQueryEnter(world)
        for (let i = 0; i < actorEntities.length; ++ i) {
            const id = actorEntities[i]
            const row = Cell.row[id]
            const col = Cell.col[id]
            const textId = Sprite.texture[id]
            const texture = textures[textId]
            const frame = Frame.frame[id]
            spriteById.set(
                id,
                scene.add.sprite(col * 64,row * 64,texture, frame)
                    .setOrigin(0)
                    .setScale(4)
                    .setInteractive()
            )
        }
        return world
    })
}