import * as Phaser from 'phaser'
import {
    addComponent,
    addEntity,
    createWorld,
    IWorld,
    System
} from 'bitecs'
import { Frame } from '../components/base/frame'
import { Cell } from '../components/base/cell'
import { Sprite } from '../components/base/sprite'
import { createDoubleClickSystem } from '../systems/doubleClickSystem'
import { createSpriteSystem } from '../systems/spriteSystem'
import { createNoise2D } from 'simplex-noise'
import { createCameraSystem } from '../systems/cameraSystem'
import { Player } from '../components/actor/player'
import { Enemy } from '../components/actor/enemy'
import { Tile } from '../components/tile/tile'
import { Distance } from '../components/actor/distance'
import { Terrain } from '../components/tile/terrain'
import { createAvailableTileSystem } from '../systems/availableTileSystem'
import { Occupied, OccupiedEnum } from '../components/tile/occupied'
import { Actor, ActorStateEnum, ActorTypeEnum } from '../components/actor/actor'
import { Phase } from '../components/state/phase'
import { Selected } from '../components/state/selected'
import { Path } from '../types/Path'
import { CurrentTile } from '../components/actor/currentTile'
import { createTintSystem } from '../systems/tintSystem'
import { createMovementSystem } from '../systems/movementSystem'


export default class EcsScene extends Phaser.Scene {
    private world?: IWorld
    private spriteSystem?: System
    private cameraSystem?: System
    private doubleClickSystem?: System
    private availableTileSystem?: System
    private tintSystem?: System
    private movementSystem?: System
    spriteById: Map<number, Phaser.GameObjects.Sprite>
    availableTiles: Map<number, Map<number, Path>>

    constructor() {
        super({ key: 'EcsScene' })
    }

    create() {
        this.world = createWorld()
        this.spriteById = new Map<number, Phaser.GameObjects.Sprite>()
        this.availableTiles = new Map<number, Map<number, Path>>()

        // Initialize enemy
        const enemy = addEntity(this.world)
        addComponent(this.world, Actor, enemy)
        Actor.state[enemy] = ActorStateEnum.Available
        Actor.type[enemy] = ActorTypeEnum.Enemy
        addComponent(this.world, Enemy, enemy)
        addComponent(this.world, Cell, enemy)
        Cell.row[enemy] = 6
        Cell.col[enemy] = 6
        addComponent(this.world, Sprite, enemy)
        Sprite.texture[enemy] = 1
        addComponent(this.world, Frame, enemy)
        Frame.frame[enemy] = 0
        addComponent(this.world, Distance, enemy)
        Distance.dist[enemy] = 4
        addComponent(this.world, CurrentTile, enemy)

        // Initialize player
        const player = addEntity(this.world)
        addComponent(this.world, Actor, player)
        Actor.state[player] = ActorStateEnum.Available
        Actor.type[player] = ActorTypeEnum.Player
        addComponent(this.world, Player, player)
        addComponent(this.world, Cell, player)
        Cell.row[player] = 3
        Cell.col[player] = 4
        addComponent(this.world, Sprite, player)
        Sprite.texture[player] = 0
        addComponent(this.world, Frame, player)
        Frame.frame[player] = 0
        addComponent(this.world, Distance, player)
        Distance.dist[player] = 4
        addComponent(this.world, CurrentTile, enemy)

        // Initialize map
        const noise2D = createNoise2D()
        for (let row = 0; row < 20; ++row) {
            for (let col = 0; col < 30; ++col) {
                const tile = addEntity(this.world)
                addComponent(this.world, Tile, tile)

                // Set Cell
                addComponent(this.world, Cell, tile)
                Cell.row[tile] = row
                Cell.col[tile] = col

                // Set sprite
                addComponent(this.world, Sprite, tile)
                Sprite.texture[tile] = 2

                // Set frame
                addComponent(this.world, Frame, tile)
                addComponent(this.world, Terrain, tile)
                const noise = noise2D(row /10, col /10)
                if (noise < -0.6) {
                    Frame.frame[tile] = 0
                    Terrain.cost[tile] = 0
                } else if (noise < -0.3) {
                    Frame.frame[tile] = 1
                    Terrain.cost[tile] = 2
                } else if (noise < 0.4) {
                    Frame.frame[tile] = 2
                    Terrain.cost[tile] = 1
                } else if (noise < 0.8) {
                    Frame.frame[tile] = 3
                    Terrain.cost[tile] = 2
                } else if (noise < 1) {
                    Frame.frame[tile] = 4
                    Terrain.cost[tile] = 3
                }

                // Set occupied
                addComponent(this.world, Occupied, tile)
                Occupied.occupied[tile] = OccupiedEnum.False
            }
        }

        // Initialize game manager
        const gm = addEntity(this.world)
        addComponent(this.world, Phase, gm)
        addComponent(this.world, Selected, gm)
        Selected.entity[gm] = -1

        // Sprite system
        this.spriteSystem = createSpriteSystem(
            this,
            [
                'goodChar',
                'badChar',
                'terrain'
            ],
            this.spriteById
        )

        // Initialize camera system
        this.cameraSystem = createCameraSystem(this)

        // Initialize available tile system
        this.availableTileSystem = createAvailableTileSystem(this.availableTiles)

        // Initialize double click detection system
        this.doubleClickSystem = createDoubleClickSystem(this, this.spriteById, this.availableTiles)

        this.tintSystem = createTintSystem(this.spriteById)

        this.movementSystem = createMovementSystem(this.spriteById)
    }

    update(
        // t: number,
        // dt: number
    ) {
        if (!this.world) {
            return
        }
        this.cameraSystem?.(this.world)
        this.spriteSystem?.(this.world)
        this.availableTileSystem?.(this.world)
        this.doubleClickSystem?.(this.world)
        this.tintSystem?.(this.world)
        this.movementSystem?.(this.world)
    }
}