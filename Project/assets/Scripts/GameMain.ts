import { _decorator, Component, Node, EventMouse, Prefab, instantiate, Vec3, Vec2, v3,
    Canvas, UITransform, Size, Quat, quat } from 'cc';
import { NodeScript } from './NodeScript';
const { ccclass, property } = _decorator;

const RAD_TO_DEG = 180 / Math.PI;
const NODE_DIST_MIN = 24;
const NODE_DIST_MAX = 128;

@ccclass('GameMain')
export class GameMain extends Component {
    @property(Prefab) NodeLPrefab: Prefab;
    @property(Prefab) LinkLPrefab: Prefab;

    #leftNodes: Node[] = [];
    #rightNodes: Node[] = [];

    start() {
        //console.log('Hello World!');
        this.GatherExistingNodes();
    }

    update(deltaTime: number) {
        
    }

    private GatherExistingNodes(): void
    {
        for(let childNode of this.node.children)
        {
            let nodeScript = childNode.getComponent(NodeScript);
            if(nodeScript)
            {
                if(nodeScript.IsLeftTeam)
                    this.#leftNodes.push(childNode);
                else
                    this.#rightNodes.push(childNode);
            }
        }
    }

    OnGroundMouseDown(e: EventMouse): void
    {
        console.log('GameMain OnGroundMouseDown');

        let pos = this.MouseLocationToNodePosition(e.getUILocation());

        let closestNodeDist = Number.MAX_VALUE;
        for(let node of this.#leftNodes)
        {
            let dist = Vec3.distance(pos, node.getPosition());
            if(dist < closestNodeDist)
                closestNodeDist = dist;
        }
        if(closestNodeDist >= NODE_DIST_MIN &&
            closestNodeDist <= NODE_DIST_MAX)
        {
            this.CreateNode(pos);
        }
    }

    CreateNode(pos: Vec3): void
    {
        let newNode = instantiate(this.NodeLPrefab);
        //newNode.setPosition(this.MouseLocationToNodePosition(e.getLocation())); 
        newNode.setPosition(pos); 
        this.node.addChild(newNode);
        if(this.#leftNodes.length > 0)
            this.CreateLink(this.#leftNodes[this.#leftNodes.length - 1], newNode);
        this.#leftNodes.push(newNode);
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
