import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Player {
    constructor(scene, world, camera) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        
        this.health = 100;
        this.ammo = 30;
        this.isLocked = false;
        
        this.initPhysics();
        this.initMesh();
        this.setupControls();
    }

    initPhysics() {
        const shape = new CANNON.Capsule(0.5, 1);
        this.body = new CANNON.Body({
            mass: 1,
            shape: shape,
            fixedRotation: true,
            linearDamping: 0.9,
            position: new CANNON.Vec3(0, 2, 0)
        });
        this.world.addBody(this.body);
    }

    initMesh() {
        const group = new THREE.Group();
        
        // Hero model
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.8, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            emissive: 0x004488, 
            emissiveIntensity: 0.5 
        });
        const heroBody = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(heroBody);

        // Eyes
        const eyeGeo = new THREE.BoxGeometry(0.1, 0.05, 0.1);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(0.15, 0.7, 0.4);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(-0.15, 0.7, 0.4);
        group.add(eyeL, eyeR);

        // Cape
        const capeGeo = new THREE.PlaneGeometry(1, 1.5);
        const capeMat = new THREE.MeshStandardMaterial({ color: 0x050505, side: THREE.DoubleSide });
        const cape = new THREE.Mesh(capeGeo, capeMat);
        cape.position.set(0, 0.2, -0.4);
        cape.rotation.x = 0.2;
        group.add(cape);

        this.mesh = group;
        this.scene.add(this.mesh);
    }

    setupControls() {
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.pitch = 0;
        this.yaw = 0;

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        window.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                this.yaw -= e.movementX * 0.002;
                this.pitch -= e.movementY * 0.002;
                this.pitch = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, this.pitch));
            }
        });
        window.addEventListener('mousedown', () => this.shoot());
    }

    requestPointerLock() {
        document.body.requestPointerLock();
    }

    shoot() {
        if (this.ammo <= 0 || document.pointerLockElement !== document.body) return;
        
        this.ammo--;
        document.getElementById('ammo').innerText = `AMMO: ${this.ammo} / ∞`;
        
        // Muzzle flash
        const flash = new THREE.PointLight(0x00ffff, 5, 5);
        flash.position.copy(this.mesh.position).add(new THREE.Vector3(0, 1, 0));
        this.scene.add(flash);
        setTimeout(() => this.scene.remove(flash), 50);

        // Raycast shooting
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({x: 0, y: 0}, this.camera);
        const enemies = this.scene.children.filter(c => c.isEnemy);
        const intersects = raycaster.intersectObjects(enemies);

        if (intersects.length > 0) {
            intersects[0].object.takeDamage(25);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        document.getElementById('health-inner').style.width = `${this.health}%`;
        
        const flash = document.getElementById('flash');
        flash.style.opacity = '0.5';
        setTimeout(() => flash.style.opacity = '0', 100);

        if (this.health <= 0) {
            window.gameInstance.gameOver();
        }
    }

    update(dt) {
        // Movement
        const speed = this.keys['ShiftLeft'] ? 12 : 6;
        const forward = new CANNON.Vec3(
            -Math.sin(this.yaw),
            0,
            -Math.cos(this.yaw)
        );
        const right = new CANNON.Vec3(
            -Math.sin(this.yaw - Math.PI/2),
            0,
            -Math.cos(this.yaw - Math.PI/2)
        );

        let velocity = new CANNON.Vec3();
        if (this.keys['KeyW']) velocity.vadd(forward, velocity);
        if (this.keys['KeyS']) velocity.vsub(forward, velocity);
        if (this.keys['KeyA']) velocity.vadd(right, velocity);
        if (this.keys['KeyD']) velocity.vsub(right, velocity);

        if (velocity.length() > 0) {
            velocity.normalize();
            velocity.scale(speed, velocity);
            this.body.velocity.x = velocity.x;
            this.body.velocity.z = velocity.z;
        }

        if (this.keys['Space'] && Math.abs(this.body.velocity.y) < 0.1) {
            this.body.velocity.y = 8;
        }

        // Sync mesh and camera
        this.mesh.position.copy(this.body.position);
        this.mesh.rotation.y = this.yaw;

        const camOffset = new THREE.Vector3(
            Math.sin(this.yaw) * 4,
            2 + Math.sin(this.pitch) * 2,
            Math.cos(this.yaw) * 4
        );
        this.camera.position.copy(this.mesh.position).add(camOffset);
        this.camera.lookAt(this.mesh.position.x, this.mesh.position.y + 1, this.mesh.position.z);
    }
}
