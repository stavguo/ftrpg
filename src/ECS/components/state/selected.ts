import {
    defineComponent, Types
} from 'bitecs'

// Component for assigning a position to an entity along the grid-like board.
export const Selected = defineComponent({
    entity: Types.i16
})