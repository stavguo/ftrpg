import { IWorld } from 'bitecs'
import { Draw, DrawEnum } from '../components/Draw'
import { Position } from '../components/Position'
import { DISPLAY } from '../display'
import { cameraQuery } from '../queries/cameraQuery'
import { positionQuery } from '../queries/positionQuery'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH } from '../settings'

export const renderSystem = (world: IWorld) => {
    // Get camera origin coordinates
    const camEntities = cameraQuery(world)
    const camX = Position.x[camEntities[0]]
    const camY = Position.y[camEntities[0]]

    // Draw text
    for (let i = 0; i < camEntities.length; i++) {
        DISPLAY.drawText(0, DISPLAY_HEIGHT - 2, 'Hello World.', DISPLAY_WIDTH)
        DISPLAY.drawText(0, DISPLAY_HEIGHT - 1, 'WASD to move', DISPLAY_WIDTH)
    }

    // Get all entities that have positions
    const entities = positionQuery(world)
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]
        const entityX = Position.x[entity]
        const entityY = Position.y[entity]

        // If position within display
        if ((entityX >= camX && entityX < camX + DISPLAY_WIDTH) &&
        (entityY >= camY && entityY < camY + DISPLAY_HEIGHT - 2)) {
            const char = ''
            const foreground = ''
            let background = ''
            const drawType = Draw.tile[entity]
            // If a map tile (water, plain, forest, thicket)
            if (drawType === DrawEnum.Water) background = '#5b6ee1'
            else if (drawType === DrawEnum.Plain) background = '#99e550'
            else if (drawType === DrawEnum.Forest) background = '#37946e'
            else if (drawType === DrawEnum.Thicket) background = '#1a6a49'
            DISPLAY.draw(entityX - camX, entityY - camY, char, foreground, background)
        }
    }
    return world
}