import {
    defineQuery,
    defineSystem,
    enterQuery
} from 'bitecs'
import { Actor } from '../components/actor'
import { manStart } from '../helpers/manhattan'

const actorQuery = defineQuery([Actor])
const actorQueryEnter = enterQuery(actorQuery)

export const createAvailableTileSystem = () => {
    return defineSystem(world => {
        const enterEntities = actorQueryEnter(world)
        for (let i = 0; i < enterEntities.length; ++ i) {
            const id = enterEntities[i]
            manStart(world, id)
        }
        return world
    })
}