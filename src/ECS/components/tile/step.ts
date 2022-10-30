import {
    defineComponent,
    Types
} from 'bitecs'

// Component assigned to tiles to help the actor move.
export const Step = defineComponent({
    actor: Types.eid,
    prevTile: Types.eid,
    targetId: Types.eid
})