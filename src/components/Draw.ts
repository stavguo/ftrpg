import { defineComponent, Types } from 'bitecs'

export enum DrawEnum {
    Water,
    Plain,
    Forest,
    Thicket
}

export const Draw = defineComponent({
    tile: Types.ui8
})