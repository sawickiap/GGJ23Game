import { _decorator, Component, Node, AudioClip, AudioSource, assert } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManagerScript')
export class SoundManagerScript extends Component {
    @property(AudioClip) Test: AudioClip = null;

    #audioSource: AudioSource;
    
    start() {
        this.#audioSource = this.node.getComponent(AudioSource);
        assert(this.#audioSource);
    }

    update(deltaTime: number) {
    }

    PlayTest(): void
    {
        this.#audioSource.playOneShot(this.Test, 1);
    }
}