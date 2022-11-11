import { defineComponent, Types } from 'bitecs'

export enum BackgroundEnum {
    None,
    Water,
    Plain,
    Forest,
    Thicket
}

export const BackgroundArrayEnum = [
    '', // None
    '#5b6ee1', // Water
    '#99e550', // Plain
    '#37946e', // Forest
    '#1a6a49' // Thicket
]

export const Background = defineComponent({
    type: Types.ui8
})