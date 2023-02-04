import { _decorator, Component, Node, AudioClip, AudioSource, assert } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManagerScript')
export class SoundManagerScript extends Component {
    @property(AudioClip) NewNode: AudioClip = null;
    @property(AudioClip) NewNodeWithFlower: AudioClip = null;
    @property(AudioClip) NewNodeWithWaterRoot: AudioClip = null;
    @property(AudioClip) Transfer: AudioClip = null;
    @property(AudioClip) Fight: AudioClip = null;
    @property(AudioClip) Destroy: AudioClip = null;
    @property(AudioClip) Select: AudioClip = null;

    #audioSource: AudioSource;
    
    start() {
        this.#audioSource = this.node.getComponent(AudioSource);
        assert(this.#audioSource);
    }

    update(deltaTime: number) {
    }

    PlayNewNode(): void {
        this.#audioSource.playOneShot(this.NewNode, 1);
    }
    PlayNewNodeWithFlower(): void {
        this.#audioSource.playOneShot(this.NewNodeWithFlower, 1);
    }
    PlayNewNodeWithWaterRoot(): void {
        this.#audioSource.playOneShot(this.NewNodeWithWaterRoot, 1);
    }
    PlayTransfer(): void {
        this.#audioSource.playOneShot(this.Transfer, 1);
    }
    PlayFight(): void {
        this.#audioSource.playOneShot(this.Fight, 1);
    }
    PlayDestroy(): void {
        this.#audioSource.playOneShot(this.Destroy, 1);
    }
    PlaySelect(): void {
        this.#audioSource.playOneShot(this.Select, 0.6);
    }
}