import { IWorld } from 'bitecs'
import invert from 'invert-color'
import { Draw, DrawEnum } from '../components/Draw'
import { Position } from '../components/Position'
import { TILES } from '../entities/makeMap'
import { DISPLAY } from '../lib/display'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH, offsetX, offsetY } from '../lib/settings'
import { cameraQuery } from '../queries/cameraQuery'
import { selectedQuery } from '../queries/selectedQuery'


export const renderSystem = (world: IWorld) => {
    //Get camera origin coordinates
    const camEntities = cameraQuery(world)
    const camX = Position.x[camEntities[0]]
    const camY = Position.y[camEntities[0]]

    for (let y = 0; y < DISPLAY_HEIGHT; y++) {
        for (let x = 0; x < DISPLAY_WIDTH; x++) {
            const entity = TILES.get(`${camX + x},${camY + y}`)
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
    }
    return world
}