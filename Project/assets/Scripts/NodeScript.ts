import { _decorator, Component, Node, CCBoolean, EventMouse, assert, SpriteComponent, v3, lerp, color } from 'cc';
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
    @property Sun: number = 0;
    @property Water: number = 0;
    @property Poison: number = 0;

    HasFlower: boolean = false;
    HasWaterRoot: boolean = false;

    #gameMain: GameMain = null;
    #overlaySprite: SpriteComponent = null;

    onLoad(): void
    {
        this.#gameMain = this.node.parent.parent.getComponent(GameMain);
        assert(this.#gameMain);
        this.#overlaySprite = this.node.children[0].getComponent(SpriteComponent);
        assert(this.#overlaySprite);
    }

    start()
    {
        this.node.on(Node.EventType.MOUSE_DOWN, this.OnMouseDown, this);
    }

    update(deltaTime: number) {
    }

    UpdateLogic(dt: number): boolean
    {
        let needsUpdateLooks = false;
        if(this.HasFlower && this.Sun < NODE_SUN_MAX)
        {
            this.Sun = Math.min(this.Sun + SUN_GATHER_PER_SECOND * dt, NODE_SUN_MAX);
            needsUpdateLooks = true;
        }
        if(this.HasWaterRoot && this.Water < NODE_WATER_MAX)
        {
            this.Water = Math.min(this.Water + WATER_GATHER_PER_SECOND * dt, NODE_WATER_MAX);
            needsUpdateLooks = true;
        }
        return needsUpdateLooks;
    }

    UpdateLooks(): void
    {
        let sunPercent = this.Sun / NODE_SUN_MAX;
        let waterPercent = this.Water / NODE_WATER_MAX;
        
        let scale = lerp(0.9, 2, waterPercent);
        let overlayAlpha = sunPercent * 255;

        this.node.setScale(v3(scale, scale, scale));
        this.#overlaySprite.color = color(255, 255, 255, overlayAlpha);
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
