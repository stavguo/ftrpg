import {
    defineComponent,
    Types
} from 'bitecs'

// Component for keeping track of where an actor can move.
export const AvailableTiles = defineComponent({
    count: Types.ui16,
    tiles: [Types.ui16,99]
})