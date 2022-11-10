import { IWorld } from 'bitecs'
import { DISPLAY } from '../lib/display'
import { cameraQuery } from '../queries/cameraQuery'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH, SCREEN_HEIGHT, SCREEN_WIDTH } from '../lib/settings'

export const uiSystem = (world: IWorld) => {
    //Get camera origin coordinates
    const camEntities = cameraQuery(world)
    // Draw text
    for (let i = 0; i < camEntities.length; i++) {
        DISPLAY.drawText(0, SCREEN_HEIGHT - 2, 'Hello World.', SCREEN_WIDTH)
        DISPLAY.drawText(0, SCREEN_HEIGHT - 1, 'WASD to move. Left click to select tile.', SCREEN_WIDTH)
        // Draw legends
        //DISPLAY.drawText(offsetX, offsetY - 1, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcd', DISPLAY_WIDTH)
        //DISPLAY.drawText(offsetX, offsetY - 1, '||||||||||||||||||||||||||||||', DISPLAY_WIDTH)
        //for (let j = 0; j < DISPLAY_HEIGHT; j++) {
        //DISPLAY.draw(offsetX - 1, offsetY + j, '-','','')
        //DISPLAY.draw(offsetX - 1, offsetY + j, `${j + 1}`,'','')
        //}
    }
    return world
}