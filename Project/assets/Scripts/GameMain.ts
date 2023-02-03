import { _decorator, Component, Node, EventMouse, Prefab, instantiate, Vec3, Vec2, v3, Canvas, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameMain')
export class GameMain extends Component {
    @property(Prefab) NodeLPrefab: Prefab;

    start() {
        console.log('Hello World!');
    }

    update(deltaTime: number) {
        
    }

    OnGroundMouseDown(e: EventMouse): void
    {
        console.log('GameMain OnGroundMouseDown');
        let newNode = instantiate(this.NodeLPrefab);
        //newNode.setPosition(this.MouseLocationToNodePosition(e.getLocation())); 
        newNode.setPosition(this.MouseLocationToNodePosition(e.getUILocation())); 
        this.node.addChild(newNode);
    }

    private MouseLocationToNodePosition(v: Vec2): Vec3
    {
        let contentSize = this.node.getComponent(UITransform).contentSize;
        return v3(v.x - contentSize.width / 2,
            v.y - contentSize.height / 2);
    }
}
