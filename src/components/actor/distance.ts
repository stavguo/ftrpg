import {
    defineComponent,
    Types
} from 'bitecs'

// Component for assigning the amount an actor can travel in one turn.
export const Distance = defineComponent({
    dist: Types.ui8
})