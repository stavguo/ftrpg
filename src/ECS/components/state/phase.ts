import {
    defineComponent, Types
} from 'bitecs'

export enum PhaseEnum {
    Player,
    Enemy
}

// Component for assigning a position to an entity along the grid-like board.
export const Phase = defineComponent({
    phase: Types.ui8
})