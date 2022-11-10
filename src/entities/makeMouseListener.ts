import { GameManager } from '../components/GameManager'
import { DISPLAY } from '../lib/display'

export const makeMouseListener = (gmId: number) => {
    window.addEventListener('mouseup', (e) => {
        GameManager.selectX[gmId] = DISPLAY.eventToPosition(e)[0]
        GameManager.selectY[gmId] = DISPLAY.eventToPosition(e)[1]
    })
}
