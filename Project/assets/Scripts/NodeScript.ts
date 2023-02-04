import { _decorator, Component, Node, CCBoolean, EventMouse, assert } from 'cc';
import { GameMain } from './GameMain';
const { ccclass, property } = _decorator;

export const NODE_SUN_MAX = 100;
export const NODE_WATER_MAX = 100;
export const NODE_POISON_MAX = 100;

const SUN_GATHER_PER_SECOND = 1;
const WATER_GATHER_PER_SECOND = 1;

@ccclass('NodeScript')
export class NodeScript extends Component {
    @property IsLeftTeam: boolean = false;
    @property Sun: number = 50;
    @property Water: number = 50;
    @property Poison: number = 50;

    HasFlower: boolean = false;
    HasWaterRoot: boolean = false;

    #gameMain: GameMain = null;

    onLoad(): void
    {
        this.#gameMain = this.node.parent.parent.getComponent(GameMain);
        assert(this.#gameMain);
    }

    start()
    {
        this.node.on(Node.EventType.MOUSE_DOWN, this.OnMouseDown, this);
    }

    update(deltaTime: number) {
    }

    UpdateLogic(dt: number): void
    {
        if(this.HasFlower)
            this.Sun = Math.min(this.Sun + SUN_GATHER_PER_SECOND * dt, NODE_SUN_MAX);
        if(this.HasWaterRoot)
            this.Water = Math.min(this.Water + WATER_GATHER_PER_SECOND * dt, NODE_WATER_MAX);
    }

    OnMouseDown(e: EventMouse): void
    {
        //console.log('NodeScript OnMouseDown');

        if(e.getButton() == 0)
            // TODO only left team
            this.#gameMain.SelectNode(this.node);

        //if(e.getButton() == 1)
        //    this.#gameMain.DestroyNode(this.node);

        //e.propagationStopped = true; // Not needed.
    }
}
