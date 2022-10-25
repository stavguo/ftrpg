import {
    defineComponent,
    Types
} from 'bitecs'

export enum ActorStateEnum {
    Unavailable,
    Available,
    Selected
}

// Component for signaling whether a tile is occupied by an actor entity.
export const ActorState = defineComponent({
    occupied: Types.ui8
})