import { _decorator, Component, Node, CCBoolean, EventMouse, assert } from 'cc';
import { GameMain } from './GameMain';
const { ccclass, property } = _decorator;

export const NODE_SUN_MAX = 100;
export const NODE_WATER_MAX = 100;
export const NODE_POISON_MAX = 100;

@ccclass('NodeScript')
export class NodeScript extends Component {
    @property IsLeftTeam: boolean = false;
    @property Sun: number = 50;
    @property Water: number = 50;
    @property Poison: number = 50;

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
