import {
    defineComponent,
    Types
} from 'bitecs'

// Component used for moving entity
export const CanMove = defineComponent({
    path: [Types.eid, 99],
    count: Types.ui16,
    current: Types.eid
})