import { addComponent, IWorld, removeComponent } from 'bitecs'
import { GameManager } from '../components/GameManager'
import { Position } from '../components/Position'
import { Selected } from '../components/Selected'
import { cameraQuery } from '../queries/cameraQuery'
import { gameManagerQuery } from '../queries/gameManagerQuery'
import { selectedQuery } from '../queries/selectedQuery'
import { visibleQuery } from '../queries/visibleQuery'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH, SCREEN_HEIGHT, SCREEN_WIDTH } from '../lib/settings'


export const selectSystem = (world: IWorld) => {
    const gmId = gameManagerQuery(world)[0]
    const selectX = GameManager.selectX[gmId]
    const selectY = GameManager.selectY[gmId]
    if (selectX === -1 &&  selectY === -1) return world
    const camEntities = cameraQuery(world)
    for (let i = 0; i < camEntities.length; i++) {
        const camId = camEntities[0]
        const camX = Position.x[camId]
        const camY = Position.y[camId]

        const visibleEntities = visibleQuery(world)
        for (let j = 0; j < visibleEntities.length; j++) {
            const vId = visibleEntities[j]
            const entityX = Position.x[vId]
            const entityY = Position.y[vId]

            const offsetX = Math.floor(SCREEN_WIDTH/2) - Math.floor(DISPLAY_WIDTH/2)
            const offsetY = Math.floor(SCREEN_HEIGHT/2) - Math.floor(DISPLAY_HEIGHT/2)

            // If something on map is selected
            if (selectX === (entityX - camX + offsetX) && selectY === (entityY - camY + offsetY)) {
                console.log('select is visible')
                const selectedEntities = selectedQuery(world)
                for (let k = 0; k < selectedEntities.length; k++) {
                    const selectedId = selectedEntities[k]
                    removeComponent(world, Selected, selectedId)
                }
                addComponent(world, Selected, vId)
                GameManager.selectX[gameManagerQuery(world)[0]] = -1
                GameManager.selectY[gameManagerQuery(world)[0]] = -1
            }
        }
    }
    return world
}