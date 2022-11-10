import { addComponent, addEntity, IWorld } from 'bitecs'
import { GameManager } from '../components/GameManager'

export const makeGameManager = (world: IWorld) => {
    const gameManager = addEntity(world)
    addComponent(world, GameManager, gameManager)
    return gameManager
}