import { Display } from 'rot-js'
import { DISPLAY_FONT_SIZE, SCREEN_HEIGHT, SCREEN_WIDTH } from './settings'

export const DISPLAY = new Display({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    fontSize: DISPLAY_FONT_SIZE,
    forceSquareRatio: true
})