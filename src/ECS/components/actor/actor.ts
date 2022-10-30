import {
    defineComponent, Types
} from 'bitecs'

export enum ActorStateEnum {
    Unavailable,
    Available,
    Selected
}

export enum ActorTypeEnum {
    Player,
    Enemy
}

// Component for assigning a position to an entity along the grid-like board.
export const Actor = defineComponent({
    state: Types.ui8,
    type: Types.ui8
})