import * as THREE from 'three';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    this.enabled = false;
    this.movementSpeed = 5;
    this.lookSpeed = 0.002;
    
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      sprint: false
    };
    
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.isPointerLocked = false;
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }
  
  enable() {
    if (this.enabled) return;
    this.enabled = true;
    
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    this.domElement.addEventListener('click', this.handleClick);
    
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.resetKeys();
  }
  
  disable() {
    this.enabled = false;
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.domElement.removeEventListener('click', this.handleClick);
    
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
    
    this.resetKeys();
  }
  
  resetKeys() {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.up = false;
    this.keys.down = false;
    this.keys.sprint = false;
  }
  
  handleClick() {
    if (!this.enabled) return;
    this.domElement.requestPointerLock();
  }
  
  handlePointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
    if (!this.isPointerLocked) {
      this.resetKeys();
    }
  }
  
  handleKeyDown(event) {
    if (!this.enabled) return;
    
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'KeyQ':
        this.keys.down = true;
        break;
      case 'KeyE':
      case 'Space':
        this.keys.up = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = true;
        break;
      default:
        return;
    }
    event.preventDefault();
  }
  
  handleKeyUp(event) {
    if (!this.enabled) return;
    
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'KeyQ':
        this.keys.down = false;
        break;
      case 'KeyE':
      case 'Space':
        this.keys.up = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = false;
        break;
    }
  }
  
  handleMouseMove(event) {
    if (!this.enabled || !this.isPointerLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    this.euler.y -= movementX * this.lookSpeed;
    this.euler.x -= movementY * this.lookSpeed;
    
    this.euler.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.euler.x));
    
    this.camera.quaternion.setFromEuler(this.euler);
  }
  
  setPosition(x, y, z) {
    this.camera.position.set(x, y, z);
  }
  
  lookAt(x, y, z) {
    const target = new THREE.Vector3(x, y, z);
    const direction = new THREE.Vector3().subVectors(target, this.camera.position).normalize();
    
    this.euler.y = Math.atan2(-direction.x, -direction.z);
    this.euler.x = Math.asin(Math.max(-1, Math.min(1, direction.y)));
    this.euler.z = 0;
    
    this.camera.quaternion.setFromEuler(this.euler);
  }
  
  update(delta) {
    if (!this.enabled) return;
    
    const speed = this.keys.sprint ? this.movementSpeed * 2.5 : this.movementSpeed;
    const distance = speed * delta;
    
    const yaw = this.euler.y;
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);
    
    let dx = 0, dy = 0, dz = 0;
    
    if (this.keys.forward) {
      dx += forwardX * distance;
      dz += forwardZ * distance;
    }
    if (this.keys.backward) {
      dx -= forwardX * distance;
      dz -= forwardZ * distance;
    }
    if (this.keys.left) {
      dx -= rightX * distance;
      dz -= rightZ * distance;
    }
    if (this.keys.right) {
      dx += rightX * distance;
      dz += rightZ * distance;
    }
    if (this.keys.up) {
      dy += distance;
    }
    if (this.keys.down) {
      dy -= distance;
    }
    
    if (dx !== 0 || dy !== 0 || dz !== 0) {
      this.camera.position.x += dx;
      this.camera.position.y += dy;
      this.camera.position.z += dz;
    }
    
    this.camera.position.y = Math.max(0.2, Math.min(20, this.camera.position.y));
    this.camera.position.x = Math.max(-15, Math.min(15, this.camera.position.x));
    this.camera.position.z = Math.max(-15, Math.min(15, this.camera.position.z));
  }
}
