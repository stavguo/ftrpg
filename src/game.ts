import {
    createWorld,
    pipe
} from 'bitecs' // shift-alt-O to optimize imports
import { DISPLAY } from './lib/display'
import { makeCamera } from './entities/makeCamera'
import { makeGameManager } from './entities/makeGameManager'
import { makeMap } from './entities/makeMap'
import { makeMouseListener } from './entities/makeMouseListener'
import { inputSystem } from './systems/inputSystem'
import { movementSystem } from './systems/movementSystem'
import { renderSystem } from './systems/renderSystem'
import { selectSystem } from './systems/selectSystem'
import { uiSystem } from './systems/uiSystem'
import { visibleSystem } from './systems/visibleSystem'

//Create display
document.body.appendChild(DISPLAY.getContainer())

const pipeline = pipe(
    inputSystem,
    movementSystem,
    visibleSystem,
    selectSystem,
    uiSystem,
    renderSystem
)

const world = createWorld()
const gm = makeGameManager(world)
makeCamera(world)
makeMap(world)
makeMouseListener(gm)

setInterval(() => {
    pipeline(world)
}, 16)