import * as THREE from "three";
import {OrbitControls} from "three/addons/Addons.js";

const canvas =document.getElementById("canvas");
//scene
const scene=new THREE.Scene();
scene.background=new THREE.Color('#F0F0F0');

//camera
const camera=new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

//object
const geo1=new THREE.CylinderGeometry();
const mater1=new THREE.MeshNormalMaterial({color:new THREE.Color(0xFFFFFF, 0.5)});

const obj1=new THREE.Mesh(geo1,mater1);

const geo2=new THREE.DodecahedronGeometry();
const mater2=new THREE.MeshDepthMaterial();

const obj2=new THREE.Mesh(geo2,mater2);
 obj2.position.y = -1.5;

 scene.add(obj2);
 scene.add(obj1);

 //light
const light=new THREE.SpotLight(0x006796,100);
light.position.set(1,1,1);
scene.add(light);

//renderer
const renderer=new THREE.WebGLRenderer({canvas});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// renderer.render(scene, camera);

// orbitcontrol
const control=new OrbitControls(camera,renderer.domElement);
control.enableDamping = true;
control.dampingFactor=0.05;
control.enableZoom=true;
control.enablePan=true;

//animation
function animate() {
    requestAnimationFrame(animate);
    obj1.rotation.x += 0.01;
    obj1.rotation.y += 0.01;
    obj2.rotation.x += 0.01;
    control.update();
    renderer.render(scene, camera);
}
animate();