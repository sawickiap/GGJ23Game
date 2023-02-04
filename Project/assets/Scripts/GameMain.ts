import { _decorator, Component, Node, EventMouse, Prefab, instantiate, Vec3, Vec2, v3,
    Canvas, UITransform, Size, Quat, quat, assert, Sprite, macro } from 'cc';
import { NodeScript, NODE_SUN_MAX, NODE_WATER_MAX, NODE_POISON_MAX,
    Transfer } from './NodeScript';
import { LinkScript } from './LinkScript';
import { GroundScript } from './GroundScript';
import { WaterScript } from './WaterScript';
import { SoundManagerScript } from './SoundManagerScript';
const { ccclass, property } = _decorator;

const RAD_TO_DEG = 180 / Math.PI;
const NODE_DIST_MIN = 48;
const NODE_DIST_MAX = 96;
const LOGIC_UPDATE_INTERVAL = 0.2; // in seconds

@ccclass('GameMain')
export class GameMain extends Component {
    @property(Prefab) NodeLPrefab: Prefab;
    @property(Prefab) NodeRPrefab: Prefab;
    @property(Prefab) LinkLPrefab: Prefab;
    @property(Prefab) LinkRPrefab: Prefab;
    @property(Prefab) FlowerLPrefab: Prefab;
    @property(Prefab) FlowerRPrefab: Prefab;
    @property(Prefab) WaterRootPrefab: Prefab;

    #soundManager: SoundManagerScript = null;
    #leftNodes: Node[] = [];
    #rightNodes: Node[] = [];
    #linksLayerNode: Node = null;
    #nodesLayerNode: Node = null;
    #selectionActiveNode : Node = null;
    #selectionMouseHoverNode : Node = null;
    #uiNode: Node = null;
    #uiBarSunNode: Node = null;
    #uiBarWaterNode: Node = null;
    #uiBarPoisonNode: Node = null;

    #selectedNode: Node = null;
    #transfers: Transfer[] = [];

    start() {
        this.#soundManager = this.MustGetChildByName(this.node.parent,
            'SoundManager').getComponent(SoundManagerScript);
        assert(this.#soundManager);

        this.#linksLayerNode = this.MustGetChildByName(this.node, 'LinksLayer');
        this.#nodesLayerNode = this.MustGetChildByName(this.node, 'NodesLayer');

        let selectionsLayerNode = this.MustGetChildByName(
            this.node, 'SelectionsLayer');
        this.#selectionActiveNode = this.MustGetChildByName(
            selectionsLayerNode, 'SelectionActive');
        this.#selectionMouseHoverNode = this.MustGetChildByName(
            selectionsLayerNode, 'SelectionMouseHover');

        this.#uiNode = this.MustGetChildByName(this.node, 'UI');
        this.#uiBarSunNode = this.MustGetChildByName(this.#uiNode, 'BarSun');
        this.#uiBarWaterNode = this.MustGetChildByName(this.#uiNode, 'BarWater');
        this.#uiBarPoisonNode = this.MustGetChildByName(this.#uiNode, 'BarPoison');

        this.GatherExistingNodes();
        this.SelectNode(null);

        this.schedule(() => this.UpdateLogic(), LOGIC_UPDATE_INTERVAL, macro.REPEAT_FOREVER);
    }

    private MustGetChildByName(parentNode: Node, childName: string): Node
    {
        let result = parentNode.getChildByName(childName);
        assert(result);
        return result;
    }

    update(deltaTime: number) {
        
    }

    private UpdateLogic(): void
    {
        for(let node of this.#leftNodes)
        {
            let nodeScript = node.getComponent(NodeScript);
            if(nodeScript.UpdateLogic(LOGIC_UPDATE_INTERVAL))
                nodeScript.UpdateLooks();
        }
        for(let node of this.#rightNodes)
        {
            let nodeScript = node.getComponent(NodeScript);
            if(nodeScript.UpdateLogic(LOGIC_UPDATE_INTERVAL))
                nodeScript.UpdateLooks();
        }

        // Process transfers
        let nodesAffectedByTransfer = new Set<Node>();
        for(let transfer of this.#transfers)
        {
            transfer.srcNode.getComponent(NodeScript).TransferTo(
                LOGIC_UPDATE_INTERVAL, transfer);
            nodesAffectedByTransfer.add(transfer.srcNode);
            nodesAffectedByTransfer.add(transfer.dstNode);
        }

        // Remove finished transfers
        //let transferCountBefore = this.#transfers.length;
        this.#transfers = this.#transfers.filter((t) =>
            t.sunLeft > 0 || t.waterLeft > 0 || t.poisonLeft > 0);
        //let transferCountAfter = this.#transfers.length;
        //if(transferCountAfter != transferCountBefore)
        //    console.log(`Transfers left: ${transferCountAfter}`);
        
        // Update looks of nodes affected by transfers
        for(let n of nodesAffectedByTransfer)
            n.getComponent(NodeScript).UpdateLooks();

        this.UpdateUiResources();
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
            nodeScript.UpdateLooks();
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
            let isCloseToSurface = GroundScript.IsCloseToSurface(e.getUILocation());
            let isCloseToWater = WaterScript.IsCloseToWater(e.getUILocation());

            let newNode = this.CreateNode(isLeft, pos, isCloseToSurface, isCloseToWater);

            for(let nearbyNode of nearbyNodes)
                this.CreateLink(nearbyNode, newNode, isLeft);
            
            if(isCloseToSurface)
                this.CreateFlower(newNode, isLeft);
            
            if(isCloseToWater)
                this.CreateWaterRoot(newNode, isLeft);

            this.#soundManager.PlayTest();
        }
    }

    SelectNode(nodeToSelect: Node): void
    {
        if(nodeToSelect)
        {
            let nodeScript = nodeToSelect.getComponent(NodeScript);
            assert(nodeScript);
            let isLeft = nodeScript.IsLeftTeam;

            this.#selectionActiveNode.setPosition(nodeToSelect.getPosition());
            this.#selectionActiveNode.active = true;
            this.#uiNode.active = true;
        }
        else
        {
            this.#selectionActiveNode.active = false;
            this.#uiNode.active = false;
        }
        this.#selectedNode = nodeToSelect;
        this.UpdateUiResources();
    }

    UpdateUiResources(): void
    {
        if(this.#selectedNode)
        {
            let nodeScript = this.#selectedNode.getComponent(NodeScript);
            assert(nodeScript);
            this.#uiBarSunNode.getComponent(Sprite).fillRange =
                nodeScript.Sun / NODE_SUN_MAX;
            this.#uiBarWaterNode.getComponent(Sprite).fillRange =
                nodeScript.Water / NODE_WATER_MAX;
            this.#uiBarPoisonNode.getComponent(Sprite).fillRange =
                nodeScript.Poison / NODE_POISON_MAX;
        }
    }

    DestroyNode(nodeToDestroy: Node): void
    {
        assert(nodeToDestroy);
        let nodeScript = nodeToDestroy.getComponent(NodeScript);
        assert(nodeScript);
        let isLeft = nodeScript.IsLeftTeam;

        // Remove links of this node
        let linkNodesToDestroy: Node[] = [];
        for(let linkNode of this.#linksLayerNode.children)
        {
            let linkScript = linkNode.getComponent(LinkScript);
            assert(linkScript);
            if(nodeToDestroy == linkScript.NodeA || nodeToDestroy == linkScript.NodeB)
                linkNodesToDestroy.push(linkNode);
        }
        for(let linkNode of linkNodesToDestroy)
            linkNode.destroy();
        
        // Unselect this node
        if(this.#selectedNode == nodeToDestroy)
            this.SelectNode(null);
        
        // Delete transfers affecting this node
        this.#transfers = this.#transfers.filter((t) =>
            t.srcNode != nodeToDestroy && t.dstNode != nodeToDestroy);
        
        // Remove this node from node lists
        if(isLeft)
            this.#leftNodes = this.#leftNodes.filter((n) => n == nodeToDestroy);
        else
            this.#rightNodes = this.#rightNodes.filter((n) => n == nodeToDestroy);

        // Destroy the code
        nodeToDestroy.destroy();
    }

    OnNodeMouseUp(mouseUpNode: Node): void
    {
        let nodeScript = mouseUpNode.getComponent(NodeScript);
        assert(nodeScript);
        if(this.#selectedNode &&
            mouseUpNode != this.#selectedNode &&
            this.#selectedNode.getComponent(NodeScript).IsLeftTeam && // Should be obvious
            nodeScript.IsLeftTeam &&
            Vec3.squaredDistance(this.#selectedNode.getPosition(), mouseUpNode.getPosition())
                <= NODE_DIST_MAX * NODE_DIST_MAX)
        {
            console.log(`Starting transfer ${this.#selectedNode.uuid} -> ${mouseUpNode.uuid}`);
            let transfer = new Transfer();

            let srcNodeScript = this.#selectedNode.getComponent(NodeScript);
            transfer.srcNode = this.#selectedNode;
            transfer.dstNode = mouseUpNode;
            transfer.sunLeft = srcNodeScript.Sun * 0.6667;
            transfer.waterLeft = srcNodeScript.Water * 0.6667;
            transfer.poisonLeft = srcNodeScript.Poison * 0.6667;
            this.#transfers.push(transfer);
            //console.log(`Starting transfer: sun=${transfer.sunLeft}`);
        }
    }

    private CreateNode(isLeft: boolean, pos: Vec3,
        hasFlower: boolean, hasWaterRoot: boolean): Node
    {
        let newNode = instantiate(isLeft ? this.NodeLPrefab : this.NodeRPrefab);
        let nodeScript = newNode.getComponent(NodeScript);
        nodeScript.IsLeftTeam = isLeft;
        nodeScript.HasFlower = hasFlower;
        nodeScript.HasWaterRoot = hasWaterRoot;
        newNode.setPosition(pos);

        let rotation = quat(); Quat.fromAngleZ(rotation, Math.random() * 360);
        newNode.setRotation(rotation);
        
        this.#nodesLayerNode.addChild(newNode);
        if(isLeft)
            this.#leftNodes.push(newNode);
        else
            this.#rightNodes.push(newNode);
        nodeScript.UpdateLooks();
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
