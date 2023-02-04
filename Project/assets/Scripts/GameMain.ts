import { _decorator, Component, Node, EventMouse, Prefab, instantiate, Vec3, Vec2, v3,
    Canvas, UITransform, Size, Quat, quat, assert } from 'cc';
import { NodeScript } from './NodeScript';
import { LinkScript } from './LinkScript';
import { GroundScript } from './GroundScript';
import { WaterScript } from './WaterScript';
const { ccclass, property } = _decorator;

const RAD_TO_DEG = 180 / Math.PI;
const NODE_DIST_MIN = 48;
const NODE_DIST_MAX = 96;

@ccclass('GameMain')
export class GameMain extends Component {
    @property(Prefab) NodeLPrefab: Prefab;
    @property(Prefab) NodeRPrefab: Prefab;
    @property(Prefab) LinkLPrefab: Prefab;
    @property(Prefab) LinkRPrefab: Prefab;
    @property(Prefab) FlowerLPrefab: Prefab;
    @property(Prefab) FlowerRPrefab: Prefab;
    @property(Prefab) WaterRootPrefab: Prefab;

    #leftNodes: Node[] = [];
    #rightNodes: Node[] = [];
    #linksLayerNode: Node = null;
    #nodesLayerNode: Node = null;

    start() {
        //console.log('Hello World!');
        this.#linksLayerNode = this.node.getChildByName('LinksLayer');
        assert(this.#linksLayerNode);
        this.#nodesLayerNode = this.node.getChildByName('NodesLayer');
        assert(this.#nodesLayerNode);

        this.GatherExistingNodes();
    }

    update(deltaTime: number) {
        
    }

    private GatherExistingNodes(): void
    {
        for(let childNode of this.#nodesLayerNode.children)
        {
            let nodeScript = childNode.getComponent(NodeScript);
            assert(nodeScript);
            if(nodeScript.IsLeftTeam)
                this.#leftNodes.push(childNode);
            else
                this.#rightNodes.push(childNode);
        }
    }

    OnGroundMouseDown(e: EventMouse): void
    {
        console.log('GameMain OnGroundMouseDown');

        let pos = this.MouseLocationToNodePosition(e.getUILocation());
        let isLeft = e.getButton() == 0;

        let tooClose = false;
        let nearbyNodes: Node[] = [];
        for(let node of (isLeft ? this.#leftNodes : this.#rightNodes))
        {
            let dist = Vec3.distance(pos, node.getPosition());
            if(dist < NODE_DIST_MIN)
            {
                tooClose = true;
                break;
            }
            else if(dist <= NODE_DIST_MAX)
                nearbyNodes.push(node);
        }
        //console.log(`tooClose=${tooClose}, nearbyNodes=${nearbyNodes}`);
        if(!tooClose && nearbyNodes.length > 0)
        {
            let newNode = this.CreateNode(isLeft, pos);

            for(let nearbyNode of nearbyNodes)
                this.CreateLink(nearbyNode, newNode, isLeft);
            
            let isCloseToSurface = GroundScript.IsCloseToSurface(e.getUILocation());
            if(isCloseToSurface)
                this.CreateFlower(newNode, isLeft);
            
            let isCloseToWater = WaterScript.IsCloseToWater(e.getUILocation());
            if(isCloseToWater)
                this.CreateWaterRoot(newNode, isLeft);
        }
    }

    private CreateNode(isLeft: boolean, pos: Vec3): Node
    {
        let newNode = instantiate(isLeft ? this.NodeLPrefab : this.NodeRPrefab);
        //newNode.setPosition(this.MouseLocationToNodePosition(e.getLocation())); 
        newNode.getComponent(NodeScript).IsLeftTeam = isLeft;
        newNode.setPosition(pos); 
        this.#nodesLayerNode.addChild(newNode);
        if(isLeft)
            this.#leftNodes.push(newNode);
        else
            this.#rightNodes.push(newNode);
        return newNode;
    }

    private MouseLocationToNodePosition(v: Vec2): Vec3
    {
        let contentSize = this.node.getComponent(UITransform).contentSize;
        return v3(v.x - contentSize.width / 2,
            v.y - contentSize.height / 2);
    }

    private CreateLink(nodeA: Node, nodeB: Node, isLeft: boolean): void
    {
        let linkNode = instantiate(isLeft ? this.LinkLPrefab : this.LinkRPrefab);

        let linkScript = linkNode.getComponent(LinkScript);
        linkScript.NodeA = nodeA;
        linkScript.NodeB = nodeB;

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

        this.#linksLayerNode.addChild(linkNode);
    }

    private CreateFlower(nodeA: Node, isLeft: boolean): void
    {
        let flowerNode = instantiate(isLeft ? this.FlowerLPrefab : this.FlowerRPrefab);

        let linkScript = flowerNode.getComponent(LinkScript);
        linkScript.NodeA = nodeA;

        flowerNode.setPosition(nodeA.getPosition());

        let oldContentSize = flowerNode.getComponent(UITransform).contentSize;
        let newContentSize = new Size(
            oldContentSize.width,
            oldContentSize.height + Math.random() * 64 - 32);
        flowerNode.getComponent(UITransform).setContentSize(newContentSize);

        this.#linksLayerNode.addChild(flowerNode);
    }

    private CreateWaterRoot(nodeA: Node, isLeft: boolean): void
    {
        let rootNode = instantiate(this.WaterRootPrefab);

        let linkScript = rootNode.getComponent(LinkScript);
        linkScript.NodeA = nodeA;
        linkScript.IsLeft = isLeft;

        rootNode.setPosition(nodeA.getPosition());

        this.#linksLayerNode.addChild(rootNode);
    }
}
