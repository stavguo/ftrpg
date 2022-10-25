import {
    defineComponent,
    Types
} from 'bitecs'

export enum OccupiedEnum {
    False,
    True
}

// Component for signaling whether a tile is occupied by an actor entity.
export const Occupied = defineComponent({
    occupied: Types.ui8
})