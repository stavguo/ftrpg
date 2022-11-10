import { IWorld } from 'bitecs'
import invert from 'invert-color'
import { Draw, DrawEnum } from '../components/Draw'
import { Position } from '../components/Position'
import { DISPLAY } from '../lib/display'
import { cameraQuery } from '../queries/cameraQuery'
import { selectedQuery } from '../queries/selectedQuery'
import { visibleQuery } from '../queries/visibleQuery'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH, SCREEN_HEIGHT, SCREEN_WIDTH } from '../lib/settings'


export const renderSystem = (world: IWorld) => {
    const visibleEntities = visibleQuery(world)

    //Get camera origin coordinates
    const camEntities = cameraQuery(world)
    const camX = Position.x[camEntities[0]]
    const camY = Position.y[camEntities[0]]

    // Get display offset
    const offsetX = Math.floor(SCREEN_WIDTH/2) - Math.floor(DISPLAY_WIDTH/2)
    const offsetY = Math.floor(SCREEN_HEIGHT/2) - Math.floor(DISPLAY_HEIGHT/2)

    for (let i = 0; i < visibleEntities.length; i++) {
        const entity = visibleEntities[i]
        const entityX = Position.x[entity]
        const entityY = Position.y[entity]

        const char = ''
        const foreground = ''
        let background = ''
        const drawType = Draw.tile[entity]
        // If a map tile (water, plain, forest, thicket)
        if (drawType === DrawEnum.Water) background = '#5b6ee1'
        else if (drawType === DrawEnum.Plain) background = '#99e550'
        else if (drawType === DrawEnum.Forest) background = '#37946e'
        else if (drawType === DrawEnum.Thicket) background = '#1a6a49'

        if (selectedQuery(world).includes(entity)) background = invert(background)
        DISPLAY.draw(entityX - camX + offsetX, entityY - camY + offsetY, char, foreground, background)
    }
    return world
}