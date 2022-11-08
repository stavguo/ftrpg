import { IWorld } from 'bitecs'
import { KEYS } from 'rot-js'
import { Position } from '../components/Position'
import { cameraQuery } from '../queries/cameraQuery'
import { gameManagerEnterQuery } from '../queries/gameManagerQuery'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from '../settings'

const keyMap: { [key: number]: number } = {}
keyMap[KEYS.VK_W] = 0 // up
keyMap[KEYS.VK_S] = 1 // down
keyMap[KEYS.VK_D] = 2 // right
keyMap[KEYS.VK_A] = 3 // left

export const inputSystem = (world: IWorld) => {
    const entities = gameManagerEnterQuery(world)
    for (let i = 0; i < entities.length; i++) {
        window.addEventListener('keydown', function(e) {
            const code = e.keyCode
            if (code in keyMap) {
                const camId = cameraQuery(world)[0]
                if (keyMap[code] === 0 && Position.y[camId] > 0) {
                    Position.y[camId] = Position.y[camId] - 1
                }
                if (keyMap[code] === 1 && Position.y[camId] < WORLD_HEIGHT - DISPLAY_HEIGHT) {
                    Position.y[camId] = Position.y[camId] + 1
                }
                if (keyMap[code] === 2 && Position.x[camId] < WORLD_WIDTH - DISPLAY_WIDTH) {
                    Position.x[camId] = Position.x[camId] + 1
                }
                if (keyMap[code] === 3 && Position.x[camId] > 0) {
                    Position.x[camId] = Position.x[camId] - 1
                }
            }
        })
    }
    return world
}