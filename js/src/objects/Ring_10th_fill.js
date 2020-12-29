//https://threejs.org/examples/#webgl_rtt
//Three.jsの公式のshaderMaterialに色々サンプルあるよ

// import * as THREE from '../../libs/three.module.js';
// import SimplexNoise from '../../libs/SimplexNoise.js';


export default class Ring extends THREE.Object3D {
  
  constructor() {
    super();
    // var material = new THREE.MeshBasicMaterial({
    //   // color: 0xffffff,
    //   vertexColors: THREE.VertexColors,//これをかくとrgb送れる！ただしアルファは送れない。。。
    //   wireframe: true,
    //   transparent:true,
    //   opacity:0.6,
    //   // blending:THREE.AdditiveBlending
    // });
    this.datUpdate = this.datUpdate.bind(this);

    var material = new THREE.ShaderMaterial({
      // wireframe: true,//gl_Linesになる！
      // wireframeLinewidth: 10.0,
      transparent:true,//これ、gl_FragColorのアルファ設定に必要！！！！！！！！！！！１
      // vertexColors: THREE.VertexColors,//これは送れない。。。
      defaultAttributeValues:{
        'alpha': this.alphas
      },
      vertexShader: vertex,
      fragmentShader: fragment
    });


    this.frame = 0;
    let MAX_POINTS = 360;
    this.newValue = MAX_POINTS;//DrawRangeに使う
    
    let Params = function(){
      // size
      this.radius = 150;
      this.span = 20;
      this.noise_step = 0.33;
      this.noise_min = 0.71;
      this.noise_max = 0.86;
      // this.posX_cos_rad = 4.0;
      this.posY_cos_rad = 0.8;
      this.posZ_sin_rad = 4.6;
      this.posZ_cos_rad = 2.2;
      // speed
      this.sin_freq = 0.20;//0.67
      this.noise_speed = 0.031;
      this.rotateY_speed = 0.002;
      this.rotateZ_speed = 0.005;
    }


    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array( MAX_POINTS * 3 );
    this.colors = new Float32Array( MAX_POINTS * 3 );
    this.nowCol = new Float32Array( MAX_POINTS * 3 );
    this.targetCol = new Float32Array( MAX_POINTS * 3 );
    this.alphas = new Float32Array( MAX_POINTS * 1); //ここ4つにしても遅れるのは3つだけ。。。
    this.indices = new Uint16Array( MAX_POINTS * MAX_POINTS);
    this.geometry.setIndex(new THREE.BufferAttribute(this.indices,1));
    this.geometry.setAttribute( 'position', new THREE.BufferAttribute( this.positions, 3 ) );
    this.geometry.setAttribute( 'color', new THREE.BufferAttribute( this.colors, 3 ) );
    this.geometry.setAttribute( 'alpha', new THREE.BufferAttribute( this.alphas, 1) );
    this.geometry.setDrawRange( 0, this.newValue );//このthis.newValueを更新させていく

    this.mesh = new THREE.Mesh( this.geometry, material );
    this.mesh.rotateZ(70);
    this.mesh.rotateY(60);
    this.add( this.mesh );


    this.noise_seed_list = [];
    this.noise_param_list = [];
    for (let i = 0; i < 2; i++) {
      // this.noise_seed_list.push(Math.random(1000));
      this.noise_seed_list.push(300*i);
      this.noise_param_list.push(0);
    }
    this.simplexNoise = new SimplexNoise;


    var gui = new dat.GUI();
    this.params = new Params();
    this.datUpdate();

    var folder1 = gui.addFolder('fill_size');
        folder1.add( this.params, 'radius', 100, 200 ).onChange( this.datUpdate );
        folder1.add( this.params, 'span', 10, 40 ).onChange( this.datUpdate );
        folder1.add( this.params, 'noise_step', 0.001, 0.5).onChange( this.datUpdate );
        folder1.add( this.params, 'noise_min', 0, 1 ).onChange( this.datUpdate );
        folder1.add( this.params, 'noise_max', 0, 1 ).onChange( this.datUpdate );
        // folder1.add( this.params, 'posX_cos_rad', 0, 10 ).onChange( this.datUpdate );
        folder1.add( this.params, 'posY_cos_rad', 0, 10 ).onChange( this.datUpdate );
        folder1.add( this.params, 'posZ_sin_rad', 0, 10 ).onChange( this.datUpdate );
        folder1.add( this.params, 'posZ_cos_rad', 0, 10 ).onChange( this.datUpdate );
    folder1.open();

    var folder2 = gui.addFolder('fill_speed');
        folder2.add( this.params, 'sin_freq', 0, 1 ).onChange( this.datUpdate );
        folder2.add( this.params, 'noise_speed', 0, 0.1 ).onChange( this.datUpdate );
        folder2.add( this.params, 'rotateY_speed', 0, 0.1 ).onChange( this.datUpdate );
        folder2.add( this.params, 'rotateZ_speed', 0, 0.1).onChange( this.datUpdate );
    folder2.open();

  }

  datUpdate() {
    // size
    this.radius = this.params.radius;
    this.span = this.params.span;
    this.noise_step = this.params.noise_step;
    this.noise_min = this.params.noise_min;
    this.noise_max = this.params.noise_max;
    // this.posX_cos_rad = this.params.posX_cos_rad;
    this.posY_cos_rad = this.params.posY_cos_rad;
    this.posZ_sin_rad = this.params.posZ_sin_rad;
    this.posZ_cos_rad = this.params.posZ_cos_rad;
    // speed
    this.sin_freq = this.params.sin_freq;
    this.noise_speed = this.params.noise_speed;
    this.rotateY_speed = this.params.rotateY_speed;
    this.rotateZ_speed = this.params.rotateZ_speed;
    
  }


  update() {
    let posNum = 0;//this.positionsの数、毎回0から更新していく →数は普遍
    let idxNum = 0;//this.indicesの数、毎回0から更新していく   →距離によって毎回数はかわる。

    for (let i = 0; i < this.alphas.length; i++) {
        this.alphas[i] = 1.0;
    }

    if(this.frame %10 ==0){
      for (let i = 0; i < this.colors.length; i+=3) {
          // if( i/3 %1 ==0){
          if( i/3 %1 ==0){
            let red = [1.0, 0.0, 0.0];
            let green = [0.0, 1.0, 0.0];
            let yellow = [1.0, 0.0, 1.0];
            // let blue = [0.0, 0.0, 1.0];
            let RGB = [
              red, 
              green, 
              yellow,
              // blue,
            ];
            this.selectCol = ~~Maf.randomInRange( 0, RGB.length);
            
            this.targetCol[i] = RGB[this.selectCol][0];
            this.targetCol[i+1] = RGB[this.selectCol][1];
            this.targetCol[i+2]  = RGB[this.selectCol][2];

            // this.colors[i] = RGB[this.selectCol][0];
            // this.colors[i+1] = RGB[this.selectCol][1];
            // this.colors[i+2] = RGB[this.selectCol][2];
          // }else{
            // this.colors[i] = this.colors[i-3];
            // this.colors[i+1] = this.colors[i-2];
            // this.colors[i+2] = this.colors[i-1];
          }

          this.nowCol[i] += (this.targetCol[i] - this.nowCol[i])* 0.5;
          this.nowCol[i+1] += (this.targetCol[i+1] - this.nowCol[i+1])* 0.5;
          this.nowCol[i+2] += (this.targetCol[i+2] - this.nowCol[i]+2)* 0.5;

          this.colors[i] = this.nowCol[i];
          this.colors[i+1] = this.nowCol[i+1];
          this.colors[i+2] = this.nowCol[i+2];

      }

    }

    if(this.frame %2 ==0){

      function THREEmap(value, start1, end1, start2, end2) {
        return start2 + (end2 - start2) * ((value - start1) / (end1 - start1));
      }
  
      for (let i = 0; i < this.noise_seed_list.length; i++) {
        for (let deg = 0; deg < 360; deg += 1) {

          let noise_location = new THREE.Vector2(
            this.radius * Math.cos(deg * Math.PI/180), 
            this.radius * Math.sin(deg * Math.PI/180)
          )
          let noise_param = THREEmap(this.simplexNoise.noise4d(
            this.noise_seed_list[i], 
            noise_location.x * this.noise_step, 
            noise_location.y * this.noise_step, 
            this.noise_param_list[i]), 0, 1, this.noise_min, this.noise_max);

          // position x
            this.posX_cos_rad = 1 *Math.sin(this.sin_freq* this.frame* Math.PI/180)+3;//0.20
          // this.posX_cos_rad = this.sin_freq+2;//0.67
          this.positions[posNum] = this.radius *noise_param * Math.cos(this.posX_cos_rad * deg * Math.PI/180);
          posNum +=1;
          // position y
          this.positions[posNum] = this.radius *noise_param * Math.cos(this.posY_cos_rad * deg * Math.PI/180);
          posNum +=1;
          // position z
          this.positions[posNum] = this.radius *0.7* noise_param * Math.sin(this.posZ_sin_rad *deg * Math.PI/180)+ this.radius *0.2* noise_param * Math.sin(this.posZ_cos_rad *deg * Math.PI/180);
          posNum +=1;

        }
        this.noise_param_list[i] += this.noise_speed;
      }

      for (let i = 0; i < this.positions.length-3; i+=3) {
        for (let k = i +3; k < this.positions.length; k+=3) {

          let startPoint = new THREE.Vector3(
            this.positions[i+ 0],
            this.positions[i+ 1],
            this.positions[i+ 2]
          );
          let endPoint = new THREE.Vector3(
            this.positions[k+ 0],
            this.positions[k+ 1],
            this.positions[k+ 2]
          );
          let distance = startPoint.distanceTo (endPoint); 
          if (distance < this.span && distance >0) {
            let alpha = distance < this.span * 0.25 ? 255 : THREEmap(distance, this.span * 0.25, this.span, 255, -50)/50;

            this.alphas[i] = alpha;

            this.geometry.index.array[idxNum] = i/3;
            idxNum +=1;
            this.geometry.index.array[idxNum] = k/3; 
            idxNum +=1;
            this.geometry.index.array[idxNum] = i/3-1; 
            idxNum +=1;

            // this.geometry.index.array[idxNum] = i/3-1;
            // idxNum +=1;
            // this.geometry.index.array[idxNum] = k/3; 
            // idxNum +=1;
            // this.geometry.index.array[idxNum] = k/3-1; 
            // idxNum +=1;
          }
        }
      }

      this.geometry.index.needsUpdate = true; //indexはTHREE.Bufferattributeの必要あり
      this.mesh.rotation.y += this.rotateY_speed;
      this.mesh.rotation.z += this.rotateZ_speed;
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
      this.geometry.attributes.alpha.needsUpdate = true;

      //draw
      this.newValue = idxNum-1;
      this.geometry.setDrawRange( 0, this.newValue );//毎回設定し直す必要あり
    }

    this.frame += 1;
  }
}

const vertex= `
  attribute vec3 color;
  attribute float alpha;
  varying float vAlpha;
  varying vec3 vColor;
  void main(){
      vAlpha = alpha;
      vColor = color;
      // vColor = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      // gl_Position = vec4( position, 1.0 );
  }
`;

const fragment = `
  varying float vAlpha;
  varying vec3 vColor;
  void main(){
      // gl_FragColor = vec4( vec3(1.0), vAlpha*0.5);
      gl_FragColor = vec4( vColor, vAlpha*0.5);
      // gl_FragColor = vec4( vec3(0.2), 0.02 );
  }
`;
