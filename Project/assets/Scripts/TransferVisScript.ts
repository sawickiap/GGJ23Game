import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TransferVisScript')
export class TransferVisScript extends Component {
    start() {

    }

    Init(sun: boolean, water: boolean, poison: boolean): void
    {
        let node = this.node;
        if(!sun)
            node.getChildByName('Transfer Sun').active = false;
        if(!water)
            node.getChildByName('Transfer Water').active = false;
        if(!poison)
            node.getChildByName('Transfer Poison').active = false;
    }
}
