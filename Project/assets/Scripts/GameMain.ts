import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameMain')
export class GameMain extends Component {
    start() {
        console.log('Hello World!');
    }

    update(deltaTime: number) {
        
    }
}


