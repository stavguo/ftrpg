import { IWorld } from 'bitecs'
import invert from 'invert-color'
import { Background, BackgroundArrayEnum } from '../components/Background'
import { Character, CharacterArrayEnum } from '../components/Character'
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

            // Somehow get character from tile, maybe character map
            const char = CharacterArrayEnum[Character.type[entity]]
            const foreground = ''
            let background = BackgroundArrayEnum[Background.type[entity]]

            if (selectedQuery(world).includes(entity)) background = invert(background)
            DISPLAY.draw(entityX - camX + offsetX, entityY - camY + offsetY, char, foreground, background)
        }
    }
    return world
}