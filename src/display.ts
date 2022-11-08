import { Display } from 'rot-js'
import { DISPLAY_FONT_SIZE, DISPLAY_HEIGHT, DISPLAY_WIDTH } from './settings'

export const DISPLAY = new Display({
    width: DISPLAY_WIDTH,
    height: DISPLAY_HEIGHT,
    fontSize: DISPLAY_FONT_SIZE,
    forceSquareRatio: true
})