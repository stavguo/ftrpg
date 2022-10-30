import {
    defineComponent,
    Types
} from 'bitecs'

export enum TintEnum {
    'Blue',
    'Red'
}

// Component for assigning a cost to traverse tiles.
export const Tint = defineComponent({
    isTinted: Types.ui8,
    color: Types.ui8
})