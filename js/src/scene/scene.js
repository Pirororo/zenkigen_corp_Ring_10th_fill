// import * as THREE from '../../libs/three.module.js';
import Ring_fill from '../objects/Ring_10th_fill.js';

export class Scene extends THREE.Scene {

    constructor(){

        super();

        //カメラ
        this._persCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 500);
        this.camera = this._persCamera; //初期値
        this.camera.camPos = new THREE.Vector3(132, 170, -170);//10th
        this.camera.position.set(this.camera.camPos.x,this.camera.camPos.y,this.camera.camPos.z);

        //リング、色付き三角
        this._ring_fill = new Ring_fill();
        this.add(this._ring_fill);

    }

    update(){

        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this._ring_fill.update();

    }
}
