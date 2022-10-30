import {
    defineComponent,
    Types
} from 'bitecs'

// Component for keeping track of actor's current tile.
export const CurrentTile = defineComponent({
    tile: Types.eid
})