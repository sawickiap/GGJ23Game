import { _decorator, Component, Node, EventMouse, Prefab, instantiate, Vec3, Vec2, v3,
    Canvas, UITransform, Size, Quat, quat } from 'cc';
const { ccclass, property } = _decorator;

const RAD_TO_DEG = 180 / Math.PI;

@ccclass('GameMain')
export class GameMain extends Component {
    @property(Prefab) NodeLPrefab: Prefab;
    @property(Prefab) LinkLPrefab: Prefab;

    #previousNode: Node = null;

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
        if(this.#previousNode)
            this.CreateLink(this.#previousNode, newNode);
        this.#previousNode = newNode;
    }

    private MouseLocationToNodePosition(v: Vec2): Vec3
    {
        let contentSize = this.node.getComponent(UITransform).contentSize;
        return v3(v.x - contentSize.width / 2,
            v.y - contentSize.height / 2);
    }

    private CreateLink(nodeA: Node, nodeB: Node): void
    {
        let linkNode = instantiate(this.LinkLPrefab);

        let posA = nodeA.getPosition();
        let posB = nodeB.getPosition();
        let vecAB = v3(); Vec3.subtract(vecAB, posB, posA);

        let midPos = v3(); Vec3.add(midPos, posA, posB);
        Vec3.divide(midPos, midPos, v3(2, 2, 2));
        linkNode.setPosition(midPos);

        let width = Vec3.len(vecAB) - 16;
        let height = linkNode.getComponent(UITransform).contentSize.height;
        linkNode.getComponent(UITransform).setContentSize(width, height);

        let angle = Math.atan2(vecAB.y, vecAB.x) * RAD_TO_DEG;
        let rotation = quat();
        Quat.fromAngleZ(rotation, angle);
        linkNode.setRotation(rotation);

        this.node.getChildByName('LinksParent').addChild(linkNode);
    }
}
