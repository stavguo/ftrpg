import * as Phaser from 'phaser'
import MainScene from './PubSub/scenes/mainScene'
import EcsScene from './ECS/scenes/EcsScene'
import PreloadScene from './preloadScene'

let default_width: number
let default_height: number
let center_mode: number
//16x16 tiles, 15 by 10
if (window.innerWidth > window.innerHeight) {
    default_width = 240 * 4
    default_height = 160 * 4
    center_mode = Phaser.Scale.CENTER_BOTH
} else {
    default_width = 160 * 4
    default_height = 240 * 4
    center_mode = Phaser.Scale.CENTER_HORIZONTALLY
}

const config = {
    //type: Phaser.AUTO,
    type: Phaser.WEBGL,
    backgroundColor: '#000',
    pixelArt: true,
    scale: {
        parent: 'phaser-game',
        mode: Phaser.Scale.FIT,
        autoCenter: center_mode,
        width: default_width,
        height: default_height
    },
    dom: {
        createContainer: true
    },
    scene: [
        PreloadScene,
        //MainScene
        EcsScene
    ]
}

new Phaser.Game(config)