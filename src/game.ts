import {
    addComponent,
    addEntity,
    createWorld,
    pipe
} from 'bitecs' // shift-alt-O to optimize imports
import { GameManager } from './components/GameManager'
import { DISPLAY } from './display'
import { makeCamera } from './entities/makeCamera'
import { makeMap } from './entities/makeMap'
import { inputSystem } from './systems/inputSystem'
import { movementSystem } from './systems/movementSystem'
import { renderSystem } from './systems/renderSystem'

//Create display
document.body.appendChild(DISPLAY.getContainer())

const pipeline = pipe(
    inputSystem,
    movementSystem,
    renderSystem
)

const world = createWorld()

// Add entities here
const gameManager = addEntity(world)
addComponent(world, GameManager, gameManager)

makeCamera(world)
makeMap(world)

setInterval(() => {
    pipeline(world)
}, 16)