import { _decorator, Component, Node, EventMouse, Prefab, instantiate, Vec3, Vec2, v3,
    Canvas, UITransform, Size, Quat, quat, assert, Sprite, macro, lerp, v2 } from 'cc';
import { NodeScript, NODE_SUN_MAX, NODE_WATER_MAX, NODE_POISON_MAX,
    NEW_NODE_SUN_COST, NEW_NODE_WATER_COST,
    Transfer } from './NodeScript';
import { LinkScript } from './LinkScript';
import { GroundScript } from './GroundScript';
import { WaterScript } from './WaterScript';
import { SoundManagerScript } from './SoundManagerScript';
import { TransferVisScript } from './TransferVisScript';
const { ccclass, property } = _decorator;

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;
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
    @property(Prefab) TransferVisPrefab: Prefab;

    #soundManager: SoundManagerScript = null;
    #leftNodes: Node[] = [];
    #rightNodes: Node[] = [];
    #linksLayerNode: Node = null;
    #nodesLayerNode: Node = null;
    #transfersLayerNode: Node = null;
    #selectionActiveNode : Node = null;
    #selectionMouseHoverNode : Node = null;
    #uiNode: Node = null;
    #uiBarSunNode: Node = null;
    #uiBarWaterNode: Node = null;
    #uiBarPoisonNode: Node = null;

    #placingNode: Node = null;
    #placingFlower: Node = null;
    #placingWaterRoot: Node = null;

    #selectedNode: Node = null;
    #transfers: Transfer[] = [];

    start() {
        this.#soundManager = this.MustGetChildByName(this.node.parent,
            'SoundManager').getComponent(SoundManagerScript);
        assert(this.#soundManager);

        this.#linksLayerNode = this.MustGetChildByName(this.node, 'LinksLayer');
        this.#nodesLayerNode = this.MustGetChildByName(this.node, 'NodesLayer');
        this.#transfersLayerNode = this.MustGetChildByName(this.node, 'TransfersLayer');

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

        let placingLayerNode = this.MustGetChildByName(this.node, 'PlacingLayer');
        this.#placingNode = this.MustGetChildByName(placingLayerNode, 'Node L');
        this.#placingFlower = this.MustGetChildByName(placingLayerNode, 'Flower L');
        this.#placingWaterRoot = this.MustGetChildByName(placingLayerNode, 'WaterRoot');

        this.GatherExistingNodes();
        this.SelectNode(null);

        this.schedule(() => this.UpdateLogic(), LOGIC_UPDATE_INTERVAL, macro.REPEAT_FOREVER);

        setTimeout(() => this.UpdateAi(), 1000); // TODO increase to 5000
    }

    private UpdateAi(): void
    {
        let step = this.#rightNodes.length;
        if(step == 0)
            return; // Lost, no more nodes, no more moves.
        if(step == 1)
            this.AiStepBeginUp();
        else if(step < 6)
            this.AiStepBeginDown();
        else
            this.AiStepNormal();

        this.AiStepTransfer();

        /*
        let nodesWithSun: Node[] = [];
        let nodesWithWater: Node[] = [];
        for(let node of this.#rightNodes)
        {
            let nodeScript = node.getComponent(NodeScript);
            assert(nodeScript && !nodeScript.IsLeftTeam);
            if(nodeScript.Sun >= NEW_NODE_SUN_COST * 1.2 || nodeScript.HasFlower)
                nodesWithSun.push(node);
            if(nodeScript.Water >= NEW_NODE_WATER_COST * 1.2 || nodeScript.HasWaterRoot)
                nodesWithWater.push(node);
        }
        console.log(`Update AI rightNodes=${this.#rightNodes.length}, ` +
            `nodesWithSun=${nodesWithSun.length}, nodesWithWater=${nodesWithWater.length}`);
        if(nodesWithSun.length == 1)
        {
            let pos = this.AiFindPosForFlower(nodesWithSun);
        }*/

        let nextStepInMilliseconds = lerp(1000, 5000, Math.random());
        setTimeout(() => this.UpdateAi(), nextStepInMilliseconds);
    }

    private AiStepBeginUp(): void
    {
        //console.log('AI step begin up');

        let existingPos = this.#rightNodes[0].getPosition();
        let angle = 150;
        let newPos = v3(
            existingPos.x + Math.cos(angle * DEG_TO_RAD) * NODE_DIST_MAX * 0.95,
            existingPos.y + Math.sin(angle * DEG_TO_RAD) * NODE_DIST_MAX * 0.95, 0);
        this.ActionPlaceNode(newPos, this.NodePositionToMouseLocation(newPos),
            false);
    }

    private AiStepBeginDown(): void
    {
        //console.log('AI step begin down');
        
        let rightNodeCount = this.#rightNodes.length;
        let srcNode = rightNodeCount == 2 ?
            this.#rightNodes[0] : this.#rightNodes[rightNodeCount - 1];
        let existingPos = srcNode.getPosition();
        let angle = 250;
        let newPos = v3(
            existingPos.x + Math.cos(angle * DEG_TO_RAD) * NODE_DIST_MAX * 0.95,
            existingPos.y + Math.sin(angle * DEG_TO_RAD) * NODE_DIST_MAX * 0.95, 0);
        this.ActionPlaceNode(newPos, this.NodePositionToMouseLocation(newPos),
            false);
    }

    private AiStepNormal(): void
    {
        //console.log('AI step normal');
        
    }

    private AiStepTransfer(): void
    {
        let transferSrcNodes = this.#rightNodes.slice();
        //transferSrcNodes.reverse(); // TEMP TEST
        transferSrcNodes.sort((lhs, rhs) =>
            this.AiNodeTransferSrcHigherPriority(lhs, rhs));
        //console.log(`AI sorted nodes, first has sun=${transferSrcNodes[0].getComponent(NodeScript).Sun}`);
        // TODO pick random with decreasing priority not always first one
        let srcIndex = 0;
        let srcNode = transferSrcNodes[srcIndex];

        let dstNode = this.AiFindTransferDstNode(srcNode);
        if(dstNode)
        {
            //console.log(`AiStepTransfer found dstNode`);
            this.ActionStartTransfer(srcNode, dstNode);
        }
        else
            ;//console.log(`AiStepTransfer didn't find dstNode`);
    }

    // If not found, returns null.
    private AiFindTransferDstNode(srcNode: Node): Node
    {
        let srcPos = srcNode.getPosition();
        let dstNodes: Node[] = [];
        for(let node of this.#rightNodes)
        {
            if(node != srcNode &&
                Vec3.squaredDistance(node.getPosition(), srcPos) <=
                NODE_DIST_MAX * NODE_DIST_MAX)
            {
                //console.log(`FOUND POTENTIAL DST NODE`);
                dstNodes.push(node);
            }
        }
        // TODO don't transfer to full or almost full
        // TODO sort, prioritize
        if(dstNodes.length == 0)
            return null;
        let dstNode = dstNodes[Math.floor(Math.random() * dstNodes.length)];
        //console.log(`AiFindTransferDstNode returning dstNode=${dstNode}`);
        return dstNode;
    }

    private AiNodeTransferSrcHigherPriority(lhs: Node, rhs: Node): number
    {
        return this.AiNodeTransferSrcPriority(rhs) -
            this.AiNodeTransferSrcPriority(lhs);
    }

    private AiNodeTransferSrcPriority(n: Node): number
    {
        let nodeScript = n.getComponent(NodeScript);
        assert(nodeScript);
        // TODO include position
        return nodeScript.Sun + nodeScript.Water + nodeScript.Poison;
    }

    /*
    private AiFindPosForFlower(nodesWithSun: Node[]): Vec3
    {
        for(let node of nodesWithSun)
        {
            let nodePos = node.getPosition();
            let xMin = nodePos.x - NODE_DIST_MAX;
            let xMax = nodePos.x;
            let yMin = nodePos.y;
            let yMax = nodePos.y + NODE_DIST_MAX;
            for(let iter = 0; iter < 20; ++iter)
            {
                let x = lerp(xMin, xMax, Math.random());
                let y = lerp(xMin, xMax, Math.random());
                if(this.PlaceGoodForNewNode(false, x, y))
                {
                    return v3(x, y, 0);
                }
            }
        }
        return v3(-1, -1, -1);
    }*/

    // Checks if place is not too close and not too far from other nodes.
    // Return nearby nodes to connect with new one, null if failed.
    private PlaceGoodForNewNode(isLeft: boolean, x: number, y: number): Node[]
    {
        let nearbyNodes: Node[] = [];
        let pos = v3(x, y, 0);
        for(let node of (isLeft ? this.#leftNodes : this.#rightNodes))
        {
            let dist = Vec3.distance(pos, node.getPosition());
            if(dist < NODE_DIST_MIN)
                return null; // Too close
            if(dist <= NODE_DIST_MAX)
                nearbyNodes.push(node);
        }
        return nearbyNodes.length > 0 ? nearbyNodes : null;
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
        let filteredTransfers = this.#transfers.filter((t) =>
            t.sunLeft > 0 || t.waterLeft > 0 || t.poisonLeft > 0);
        // remove transfer vises
        if(filteredTransfers.length != this.#transfers.length)
        {
            for(let t of this.#transfers)
            {
                if(filteredTransfers.indexOf(t) == -1)
                {
                    t.vis.destroy();
                }
            }
        }
        this.#transfers = filteredTransfers;
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

    OnGroundMouseMove(e: EventMouse): void
    {
        let pos = this.MouseLocationToNodePosition(e.getUILocation());
        if(this.PlaceGoodForNewNode(true, pos.x, pos.y))
        {
            let isCloseToSurface = GroundScript.IsCloseToSurface(e.getUILocation());
            let isCloseToWater = WaterScript.IsCloseToWater(e.getUILocation());

            this.#placingNode.setPosition(pos);
            this.#placingNode.active = true;

            if(isCloseToSurface)
                this.#placingFlower.setPosition(pos);
            this.#placingFlower.active = isCloseToSurface;
            if(isCloseToWater)
                this.#placingWaterRoot.setPosition(pos);
            this.#placingWaterRoot.active = isCloseToWater;
        }
        else
        {
            this.#placingNode.active = false;
            this.#placingFlower.active = false;
            this.#placingWaterRoot.active = false;
        }
    }

    OnGroundMouseDown(e: EventMouse): void
    {
        //console.log('GameMain OnGroundMouseDown');

        let pos = this.MouseLocationToNodePosition(e.getUILocation());
        let isLeft = e.getButton() == 0;
        this.ActionPlaceNode(pos, e.getUILocation(), isLeft);
    }

    private ActionPlaceNode(pos: Vec3, uiPos: Vec2, isLeft: boolean): void
    {
        let nearbyNodes = this.PlaceGoodForNewNode(isLeft, pos.x, pos.y);
        if(nearbyNodes)
        {
            let nearbyTotalSun = 0;
            let nearbyTotalWater = 0;
            for(let nearbyNode of nearbyNodes)
            {
                let nearbyNodeScript = nearbyNode.getComponent(NodeScript);
                assert(nearbyNodeScript);
                nearbyTotalSun += nearbyNodeScript.Sun;
                nearbyTotalWater += nearbyNodeScript.Water;
            }
            if(nearbyTotalSun >= NEW_NODE_SUN_COST &&
                nearbyTotalWater >= NEW_NODE_WATER_COST)
            {
                //console.log('Enough sun or water in nearby nodes - creating new node.');
                GameMain.RemoveNewNodeCost(nearbyNodes);

                let isCloseToSurface = GroundScript.IsCloseToSurface(uiPos);
                let isCloseToWater = WaterScript.IsCloseToWater(uiPos);

                let newNode = this.CreateNode(isLeft, pos, isCloseToSurface, isCloseToWater);

                for(let nearbyNode of nearbyNodes)
                    this.CreateLink(nearbyNode, newNode, isLeft);
                
                if(isCloseToSurface)
                {
                    this.CreateFlower(newNode, isLeft);
                    this.#soundManager.PlayNewNodeWithFlower();
                }
                else if(isCloseToWater)
                {
                    this.CreateWaterRoot(newNode, isLeft);
                    this.#soundManager.PlayNewNodeWithWaterRoot();
                }
                else
                    this.#soundManager.PlayNewNode();

                this.#placingNode.active = false;
            }
            else
                ;//console.log('Not enough sun or water in nearby nodes to create new node.');
        }
    }

    private static RemoveNewNodeCost(nearbyNodes: Node[]): void
    {
        let sunToRemoveLeft = NEW_NODE_SUN_COST;
        let waterToRemoveLeft = NEW_NODE_WATER_COST;
        for(let i = 0; i < nearbyNodes.length; ++i)
        {
            let nodeScript = nearbyNodes[i].getComponent(NodeScript);
            assert(nodeScript);

            let sunToRemove = Math.min(sunToRemoveLeft, nodeScript.Sun);
            nodeScript.Sun -= sunToRemove;
            sunToRemoveLeft -= sunToRemove;

            let waterToRemove = Math.min(waterToRemoveLeft, nodeScript.Water);
            nodeScript.Water -= waterToRemove;
            waterToRemoveLeft -= waterToRemove;

            //console.log(`RemoveNewNodeCost from node ${nodeScript.node.uuid} sun=${sunToRemove}, water=${waterToRemove}`);

            nodeScript.UpdateLooks();

            if(sunToRemoveLeft <= 0 && waterToRemoveLeft <= 0)
                break;
        }
    }

    SelectNode(nodeToSelect: Node): void
    {
        if(nodeToSelect)
        {
            if(nodeToSelect != this.#selectedNode)
            this.#soundManager.PlaySelect();

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
        let filteredTransfers = this.#transfers.filter((t) =>
            t.srcNode != nodeToDestroy && t.dstNode != nodeToDestroy);
        // remove transfer vises
        if(filteredTransfers.length != this.#transfers.length)
        {
            for(let t of this.#transfers)
            {
                if(filteredTransfers.indexOf(t) == -1)
                {
                    t.vis.destroy();
                }
            }
        }
        this.#transfers = filteredTransfers;
        
        // Remove this node from node lists
        if(isLeft)
            this.#leftNodes = this.#leftNodes.filter((n) => n == nodeToDestroy);
        else
            this.#rightNodes = this.#rightNodes.filter((n) => n == nodeToDestroy);

        // Destroy the code
        nodeToDestroy.destroy();

        this.#soundManager.PlayDestroy();
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
            this.ActionStartTransfer(this.#selectedNode, mouseUpNode);
            this.#soundManager.PlayTransfer();
        }
    }

    private ActionStartTransfer(srcNode: Node, dstNode: Node): void
    {
        //console.log(`Starting transfer ${srcNode.uuid} -> ${dstNode.uuid}`);
        let transfer = new Transfer();

        let srcNodeScript = srcNode.getComponent(NodeScript);
        transfer.srcNode = srcNode;
        transfer.dstNode = dstNode;
        transfer.sunLeft = srcNodeScript.Sun * 0.6667;
        transfer.waterLeft = srcNodeScript.Water * 0.6667;
        transfer.poisonLeft = srcNodeScript.Poison * 0.6667;

        let vis = instantiate(this.TransferVisPrefab);

        let posA = srcNode.getPosition();
        let posB = dstNode.getPosition();
        let vecAB = v3(); Vec3.subtract(vecAB, posB, posA);

        let midPos = v3(); Vec3.add(midPos, posA, posB);
        Vec3.divide(midPos, midPos, v3(2, 2, 2));
        vis.setPosition(midPos);

        let angle = Math.atan2(vecAB.y, vecAB.x) * RAD_TO_DEG;
        let rotation = quat();
        Quat.fromAngleZ(rotation, angle);
        vis.setRotation(rotation);

        let visScript = vis.getComponent(TransferVisScript);
        assert(visScript);
        visScript.Init(
            transfer.sunLeft > 2, transfer.waterLeft > 2, transfer.poisonLeft > 2);
        this.#transfersLayerNode.addChild(vis);
        transfer.vis = vis;

        this.#transfers.push(transfer);
        //console.log(`Starting transfer: sun=${transfer.sunLeft}`);
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
    private NodePositionToMouseLocation(v: Vec3): Vec2
    {
        let contentSize = this.node.getComponent(UITransform).contentSize;
        return v2(v.x + contentSize.width / 2,
            v.y + contentSize.height / 2);
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

        let width = (Vec3.len(vecAB) - 24) / linkNode.scale.x;
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
            oldContentSize.height + Math.random() * 150);
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
