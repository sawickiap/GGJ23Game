import { _decorator, Component, Node, EventMouse, PhysicsSystem,
     PhysicsSystem2D, PolygonCollider2D } from 'cc';
import { GameMain } from './GameMain';
const { ccclass, property } = _decorator;

const PHYSICS_GROUP_WATER = 1 << 6;

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
        let waterFound = false;
        for(let collider of colliders)
        {
            if(collider.group == PHYSICS_GROUP_WATER)
            {
                waterFound = true;
                break;
            }
        }
        if(waterFound)
            console.log('WaterScript OnMouseDown.');
        else
            this.node.parent.getComponent(GameMain).OnGroundMouseDown(e);
        //e.propagationStopped = true; // Not needed.
    }
}


