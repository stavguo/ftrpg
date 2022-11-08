import { addComponent, addEntity, IWorld } from 'bitecs'
import { Camera } from '../components/Camera'
import { Position } from '../components/Position'
import { DISPLAY_HEIGHT, DISPLAY_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from '../settings'

export const makeCamera = (world: IWorld) => {
    const eid = addEntity(world)
    addComponent(world, Camera, eid)
    addComponent(world, Position, eid)
    Position.x[eid] = Math.floor((WORLD_WIDTH/2) - (DISPLAY_WIDTH/2))
    Position.y[eid] = Math.floor((WORLD_HEIGHT/2) - (DISPLAY_HEIGHT/2))
}