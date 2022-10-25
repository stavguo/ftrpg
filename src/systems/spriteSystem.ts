import * as Phaser from 'phaser'
import {
    defineQuery,
    defineSystem,
    enterQuery
} from 'bitecs'
import { Cell } from '../components/cell'
import { Sprite } from '../components/sprite'
import { Frame } from '../components/frame'
import { Actor } from '../components/actor'
import { Tile } from '../components/tile'

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
        // const exitEntities = spriteQueryExit(world)
        // for (let i = 0; i < exitEntities.length; ++i) {
        //     const id = exitEntities[i]
        //     const sprite = spriteById.get(id)
        //     if (!sprite) continue
        //     sprite.destroy()
        //     spriteById.delete(id)
        // }
        return world
    })
}