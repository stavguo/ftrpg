import {
    defineComponent,
    Types
} from 'bitecs'

// Component for assigning a sprite texture to an entity.
export const Sprite = defineComponent({
    texture: Types.ui8
})