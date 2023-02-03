import { _decorator, Component, Node, EventMouse, PhysicsSystem2D, Vec2, v2, Collider2D } from 'cc';
import { GameMain } from './GameMain';
const { ccclass, property } = _decorator;

const PHYSICS_GROUP_GROUND = 1 << 1;
const NODE_MAX_DIST_TO_SURFACE_FOR_FLOWER = 24;

@ccclass('GroundScript')
export class GroundScript extends Component {
    start() {
        this.node.on(Node.EventType.MOUSE_DOWN, this.OnMouseDown, this);

    }

    update(deltaTime: number) {
        
    }

    OnMouseDown(e: EventMouse): void
    {
        let colliders = PhysicsSystem2D.instance.testPoint(e.getUILocation());
        if(this.ContainsGround(colliders))
            this.node.parent.getComponent(GameMain).OnGroundMouseDown(e);
        //e.propagationStopped = true; // Not needed.
    }

    IsCloseToSurface(uiLocation: Vec2): boolean
    {
        let locationAbove = v2(uiLocation.x, uiLocation.y + NODE_MAX_DIST_TO_SURFACE_FOR_FLOWER);
        let colliders = PhysicsSystem2D.instance.testPoint(locationAbove);
        return !this.ContainsGround(colliders);
    }

    private ContainsGround(colliders: readonly Collider2D[]): boolean
    {
        for(let collider of colliders)
            if(collider.group == PHYSICS_GROUP_GROUND)
                return true;
        return false;
    }
}


