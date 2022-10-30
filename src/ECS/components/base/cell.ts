import {
    defineComponent,
    Types
} from 'bitecs'

// Component for assigning a position to an entity along the grid-like board.
export const Cell = defineComponent({
    row: Types.ui16,
    col: Types.ui16
})