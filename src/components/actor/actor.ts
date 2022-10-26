import {
    defineComponent, Types
} from 'bitecs'

export enum ActorStateEnum {
    Unavailable,
    Available,
    Selected
}

// Component for assigning a position to an entity along the grid-like board.
export const Actor = defineComponent({
    state: Types.ui8
})