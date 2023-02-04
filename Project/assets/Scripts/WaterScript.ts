import { _decorator, Component, Node, EventMouse, PhysicsSystem,
     PhysicsSystem2D, PolygonCollider2D, Vec2, Collider2D, v2 } from 'cc';
import { GameMain } from './GameMain';
const { ccclass, property } = _decorator;

const PHYSICS_GROUP_WATER = 1 << 6;
const NODE_MAX_DIST_TO_WATER_FOR_WATER_ROOT = 24;

@ccclass('WaterScript')
export class WaterScript extends Component {
    start() {
        this.node.on(Node.EventType.MOUSE_DOWN, this.OnMouseDown, this);

    }

    update(deltaTime: number) {
        
    }

    OnMouseDown(e: EventMouse): void
    {
        let colliders = PhysicsSystem2D.instance.testPoint(e.getUILocation());
        if(!WaterScript.ContainsWater(colliders))
            this.node.parent.parent.getComponent(GameMain).OnGroundMouseDown(e);
    }

    static IsCloseToWater(uiLocation: Vec2): boolean
    {
        let locationAbove = v2(uiLocation.x, uiLocation.y - NODE_MAX_DIST_TO_WATER_FOR_WATER_ROOT);
        let colliders = PhysicsSystem2D.instance.testPoint(locationAbove);
        return this.ContainsWater(colliders);
    }

    private static ContainsWater(colliders: readonly Collider2D[]): boolean
    {
        for(let collider of colliders)
            if(collider.group == PHYSICS_GROUP_WATER)
                return true;
        return false;
    }
}


