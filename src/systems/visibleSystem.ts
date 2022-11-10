import { addComponent, IWorld, removeComponent } from 'bitecs'
import { Position } from '../components/Position'
import { Visible } from '../components/Visible'
import { cameraQuery } from '../queries/cameraQuery'
import { invisibleQuery } from '../queries/invisibleQuery'
import { visibleQuery } from '../queries/visibleQuery'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH } from '../lib/settings'

export const visibleSystem = (world: IWorld) => {
    const visibleEntities = visibleQuery(world)
    const invisibleEntities = invisibleQuery(world)
    const camEntities = cameraQuery(world)

    if (camEntities.length === 0) console.log('Error: Camera DNE.')
    const camId = camEntities[0]
    const camX = Position.x[camId]
    const camY = Position.y[camId]

    for (let i = 0; i < visibleEntities.length; i++) {
        const entity = visibleEntities[i]
        const entityX = Position.x[entity]
        const entityY = Position.y[entity]

        if ((entityX < camX || entityX >= camX + DISPLAY_WIDTH) ||
        (entityY < camY || entityY >= camY + DISPLAY_HEIGHT)) {
            removeComponent(world, Visible, entity)
        }
    }

    for (let i = 0; i < invisibleEntities.length; i++) {
        const entity = invisibleEntities[i]
        const entityX = Position.x[entity]
        const entityY = Position.y[entity]

        if ((entityX >= camX && entityX < camX + DISPLAY_WIDTH) &&
        (entityY >= camY && entityY < camY + DISPLAY_HEIGHT)) {
            addComponent(world, Visible, entity)
        }
    }
    return world
}