import { _decorator, Component, Node, EventMouse } from 'cc';
import { GameMain } from './GameMain';
const { ccclass, property } = _decorator;

@ccclass('GroundScript')
export class GroundScript extends Component {
    start() {
        this.node.on(Node.EventType.MOUSE_DOWN, this.OnMouseDown, this);

    }

    update(deltaTime: number) {
        
    }

    OnMouseDown(e: EventMouse): void
    {
        //console.log('GroundScript OnMouseDown');
        this.node.parent.getComponent(GameMain).OnGroundMouseDown(e);
    }
}


