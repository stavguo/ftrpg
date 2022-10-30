import {
    defineComponent,
    Types
} from 'bitecs'

// Component for assigning a cost to traverse tiles.
export const Terrain = defineComponent({
    cost: Types.ui8
})