import { _decorator, Component, Node, EventMouse, PhysicsSystem2D } from 'cc';
import { GameMain } from './GameMain';
const { ccclass, property } = _decorator;

const PHYSICS_GROUP_GROUND = 1 << 1;

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
        let groundFound = false;
        for(let collider of colliders)
        {
            if(collider.group == PHYSICS_GROUP_GROUND)
            {
                groundFound = true;
                break;
            }
        }
        if(groundFound)
            this.node.parent.getComponent(GameMain).OnGroundMouseDown(e);
        //e.propagationStopped = true; // Not needed.
    }
}


