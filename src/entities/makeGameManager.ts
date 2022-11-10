import { addComponent, addEntity, IWorld } from 'bitecs'
import { GameManager } from '../components/GameManager'

export const makeGameManager = (world: IWorld) => {
    const gameManager = addEntity(world)
    addComponent(world, GameManager, gameManager)
    GameManager.selectX[gameManager] = -1
    GameManager.selectY[gameManager] = -1
    return gameManager
}