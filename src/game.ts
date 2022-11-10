import {
    createWorld,
    pipe
} from 'bitecs'
import { makeCamera } from './entities/makeCamera'
import { makeGameManager } from './entities/makeGameManager'
import { makeMap } from './entities/makeMap'
import { makeMouseListener } from './entities/makeMouseListener'
import { DISPLAY } from './lib/display'
import { inputSystem } from './systems/inputSystem'
import { renderSystem } from './systems/renderSystem'
import { uiSystem } from './systems/uiSystem'

//Create display
document.body.appendChild(DISPLAY.getContainer())

const pipeline = pipe(
    inputSystem,
    uiSystem,
    renderSystem
)

const world = createWorld()
makeGameManager(world)
makeCamera(world)
makeMap(world)
makeMouseListener(world)

setInterval(() => {
    pipeline(world)
}, 16)