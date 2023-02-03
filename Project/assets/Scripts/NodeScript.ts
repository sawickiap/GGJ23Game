import { _decorator, Component, Node, CCBoolean, EventMouse } from 'cc';
import { GameMain } from './GameMain';
const { ccclass, property } = _decorator;

@ccclass('NodeScript')
export class NodeScript extends Component {
    @property IsLeftTeam: boolean = false;

    onLoad():void {
    }

    start() {
        this.node.on(Node.EventType.MOUSE_DOWN, this.OnMouseDown, this);
    }

    update(deltaTime: number) {
        
    }

    OnMouseDown(e: EventMouse): void
    {
        console.log('NodeScript OnMouseDown');
        //e.propagationStopped = true; // Not needed.
    }
}


