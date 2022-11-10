import { addComponent, IWorld, removeComponent } from 'bitecs'
import { Position } from '../components/Position'
import { Selected } from '../components/Selected'
import { DISPLAY } from '../lib/display'
import { offsetX, offsetY } from '../lib/settings'
import { cameraQuery } from '../queries/cameraQuery'
import { selectedQuery } from '../queries/selectedQuery'
import { TILES } from './makeMap'

export const makeMouseListener = (world: IWorld) => {
    window.addEventListener('mouseup', (e) => {
        const displayX = DISPLAY.eventToPosition(e)[0]
        const displayY = DISPLAY.eventToPosition(e)[1]

        //Get camera origin coordinates
        const camEntities = cameraQuery(world)
        const camX = Position.x[camEntities[0]]
        const camY = Position.y[camEntities[0]]

        // What coordinates were clicked relative to the world
        const worldX = (displayX - offsetX) + camX
        const worldY = (displayY - offsetY) + camY

        const vId = TILES.get(`${worldX},${worldY}`)

        const selectedEntities = selectedQuery(world)
        for (let k = 0; k < selectedEntities.length; k++) {
            const selectedId = selectedEntities[k]
            removeComponent(world, Selected, selectedId)
        }
        addComponent(world, Selected, vId)
    })
}
