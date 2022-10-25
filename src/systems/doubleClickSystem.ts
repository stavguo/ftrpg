import * as Phaser from 'phaser'
import {
    defineQuery,
    defineSystem,
    enterQuery,
    IWorld
} from 'bitecs'
import { AvailableTiles } from '../components/availableTiles'
import { Actor } from '../components/actor'

const actorQuery = defineQuery([Actor])
const actorQueryEnter = enterQuery(actorQuery)

function doubleClick(
    world: IWorld,
    playerId: number,
    spriteById: Map<number, Phaser.GameObjects.Sprite>
) {
    // If state = available
    // If state = selected
    // If state = unavailable
}

export const createDoubleClickSystem = (scene: Phaser.Scene, spriteById: Map<number, Phaser.GameObjects.Sprite>) => {
    return defineSystem(world => {
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
                        //doubleClick(world, id, spriteById)
                        console.log(AvailableTiles.count[id])
                    }
                })
            }
        }
        return world
    })
}