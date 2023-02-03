import { _decorator, Component, Node, EventMouse } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WaterScript')
export class WaterScript extends Component {
    start() {
        this.node.on(Node.EventType.MOUSE_DOWN, this.OnMouseDown, this);

    }

    update(deltaTime: number) {
        
    }

    OnMouseDown(e: EventMouse): void
    {
        console.log('WaterScript OnMouseDown');
        //e.propagationStopped = true; // Not needed.
    }
}


