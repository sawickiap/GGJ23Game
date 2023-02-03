import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LinkScript')
export class LinkScript extends Component {
    @property IsLeft: boolean = false;
    @property IsFlower: boolean = false;
    @property NodeA: Node = null;
    @property NodeB: Node = null;

    start() {

    }

    update(deltaTime: number) {
        
    }
}
