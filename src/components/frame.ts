import {
    defineComponent,
    Types
} from 'bitecs'

// Component for assigning a frame on a spritesheet to an entity.
export const Frame = defineComponent({
    frame: Types.ui8
})