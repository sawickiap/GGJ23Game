import { _decorator, Component, Node, CCBoolean, EventMouse, assert, SpriteComponent, v3, lerp, color } from 'cc';
import { GameMain } from './GameMain';
const { ccclass, property } = _decorator;

export const NODE_SUN_MAX = 100;
export const NODE_WATER_MAX = 100;
export const NODE_POISON_MAX = 100;

export const NEW_NODE_SUN_COST = NODE_SUN_MAX / 6;
export const NEW_NODE_WATER_COST = NODE_WATER_MAX / 6;

const SUN_TRANSFER_PER_SECOND = 10;
const WATER_TRANSFER_PER_SECOND = 10;
const POISON_TRANSFER_PER_SECOND = 10;

const SUN_GATHER_PER_SECOND = 10;
const WATER_GATHER_PER_SECOND = 10;

export class Transfer
{
    srcNode: Node = null;
    dstNode: Node = null;
    sunLeft = 0;
    waterLeft = 0;
    poisonLeft = 0;
}

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
    #mouseUpLocked: boolean = true;

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
        this.node.on(Node.EventType.MOUSE_UP, this.OnMouseUp, this);

        // Protection against treating node creation as transfer destination.
        this.schedule(() => this.#mouseUpLocked = false, 0.3);
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
        
        let scale = lerp(1.5, 2.5, waterPercent);
        let overlayAlpha = sunPercent * 255;

        this.node.setScale(v3(scale, scale, scale));
        this.#overlaySprite.color = color(255, 255, 255, overlayAlpha);
    }

    OnMouseDown(e: EventMouse): void
    {
        //console.log(`NodeScript ${this.node.uuid} OnMouseDown`);

        if(e.getButton() == 0)
            // TODO only left team
            this.#gameMain.SelectNode(this.node);

        //if(e.getButton() == 1)
        //    this.#gameMain.DestroyNode(this.node);

        //e.propagationStopped = true; // Not needed.
    }

    OnMouseUp(e: EventMouse): void
    {
        console.log(`NodeScript ${this.node.uuid} OnMouseUp`);

        if(this.#mouseUpLocked)
            return;

        if(e.getButton() == 0)
            this.#gameMain.OnNodeMouseUp(this.node);
    }

    TransferTo(dt: number, transfer: Transfer): void
    {
        assert(transfer.srcNode == this.node);
        let dstNodeScript = transfer.dstNode.getComponent(NodeScript);
        assert(dstNodeScript);

        let sunToTransfer = Math.min(transfer.sunLeft, SUN_TRANSFER_PER_SECOND * dt);
        transfer.sunLeft -= sunToTransfer;
        sunToTransfer = Math.min(sunToTransfer,
            this.Sun, NODE_SUN_MAX - dstNodeScript.Sun);
        this.Sun -= sunToTransfer;
        dstNodeScript.Sun += sunToTransfer;

        let waterToTransfer = Math.min(transfer.waterLeft, WATER_TRANSFER_PER_SECOND * dt);
        transfer.waterLeft -= waterToTransfer;
        waterToTransfer = Math.min(waterToTransfer,
            this.Water, NODE_WATER_MAX - dstNodeScript.Water);
        this.Water -= waterToTransfer;
        dstNodeScript.Water += waterToTransfer;

        let poisonToTransfer = Math.min(transfer.poisonLeft, POISON_TRANSFER_PER_SECOND * dt);
        transfer.poisonLeft -= poisonToTransfer;
        poisonToTransfer = Math.min(poisonToTransfer,
            this.Poison, NODE_POISON_MAX - dstNodeScript.Poison);
        this.Poison -= poisonToTransfer;
        dstNodeScript.Poison += poisonToTransfer;
    }
}
