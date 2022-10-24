import * as Phaser from 'phaser'
import {
    addComponent,
    addEntity,
    createWorld,
    IWorld,
    System
} from 'bitecs'
import { Frame } from '../components/frame'
import { Position } from '../components/position'
import { Sprite } from '../components/sprite'
import { createSpriteSystem } from '../systems/spriteSystem'
import { createNoise2D } from 'simplex-noise'

export default class NewScene extends Phaser.Scene {
    private world?: IWorld
    private spriteSystem?: System
    private cameraSystem?: System

    constructor() {
        super({ key: 'MainScene' })
    }

    create() {
        this.world = createWorld()

        // Initialize map
        const noise2D = createNoise2D()
        for (let col = 0; col < 30; ++col) {
            for (let row = 0; row < 20; ++row) {
                const tile = addEntity(this.world)

                // Set position
                addComponent(this.world, Position, tile)
                Position.x[tile] = col * 64
                Position.y[tile] = row * 64

                // Set sprite
                addComponent(this.world, Sprite, tile)
                Sprite.texture[tile] = 2

                // Set frame
                addComponent(this.world, Frame, tile)
                const noise = noise2D(col /10, row /10)
                if (noise < -0.6) {
                    Frame.frame[tile] = 0
                } else if (noise < -0.3) {
                    Frame.frame[tile] = 1
                } else if (noise < 0.4) {
                    Frame.frame[tile] = 2
                } else if (noise < 0.8) {
                    Frame.frame[tile] = 3
                } else if (noise < 1) {
                    Frame.frame[tile] = 4
                }
            }
        }

        // Initialize player
        const player = addEntity(this.world)

        addComponent(this.world, Position, player)
        Position.x[player] = 3 * 64
        Position.y[player] = 4 * 64

        addComponent(this.world, Sprite, player)
        Sprite.texture[player] = 0

        addComponent(this.world, Frame, player)
        Frame.frame[player] = 0

        // Initialize enemy
        const enemy = addEntity(this.world)

        addComponent(this.world, Position, enemy)
        Position.x[enemy] = 6 * 64
        Position.y[enemy] = 6 * 64

        addComponent(this.world, Sprite, enemy)
        Sprite.texture[enemy] = 1

        addComponent(this.world, Frame, enemy)
        Frame.frame[enemy] = 0

        this.spriteSystem = createSpriteSystem(
            this,
            [
                'goodChar',
                'badChar',
                'terrain'
            ]
        )

        //this.cameraSystem = createCameraSystem(this)
        const cam = this.cameras.main
        cam.setBounds(0,0, (240 * 4) * 2, (160 * 4) * 2)
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (!p.isDown) {
                return
            } else {
                cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom
                cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom
            }
        })
    }

    update(
        // t: number,
        // dt: number
    ) {
        if (!this.world) {
            return
        }
        //this.cameraSystem?.(this.world)
        this.spriteSystem?.(this.world)
    }
}