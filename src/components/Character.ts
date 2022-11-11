import { defineComponent, Types } from 'bitecs'

export enum CharacterEnum {
    None,
    Lord
}

export const CharacterArrayEnum = [
    '', // None
    '@' // Lord
]

export const Character = defineComponent({
    type: Types.ui8
})