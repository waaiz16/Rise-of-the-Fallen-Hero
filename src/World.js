import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class World {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.houses = [];
        this.letters = [];
        this.clueCardPos = new THREE.Vector3(0, 1, -10);
        this.puzzleComplete = false;
        this.currentLetterIndex = 0;
        this.targetWord = "";

        this.initEnvironment();
    }

    initEnvironment() {
        const floorGeo = new THREE.PlaneGeometry(1000, 1000);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const floorBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane()
        });
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(floorBody);

        // Tutorial walls
        this.createBox(0, 5, -25, 20, 10, 1);
    }

    createBox(x, y, z, w, h, d, color = 0x111111) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshStandardMaterial({ color })
        );
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        const body = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2))
        });
        body.position.set(x, y, z);
        this.world.addBody(body);
        return mesh;
    }

    setupStreetLevel(correctWord, wordPool) {
        // Clue Card Visual
        const card = this.createBox(0, 0.5, -10, 1, 0.1, 1, 0x00ffff);
        this.clueCardPos.copy(card.position);

        // Houses
        const shuffledWords = [...wordPool].sort(() => Math.random() - 0.5);
        for (let i = 0; i < 5; i++) {
            const x = (i - 2) * 15;
            const z = -40;
            const word = shuffledWords[i];
            const house = this.createBox(x, 5, z, 10, 10, 10, 0x1a1a1a);
            
            // Label
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 256; canvas.height = 128;
            ctx.fillStyle = 'black'; ctx.fillRect(0,0,256,128);
            ctx.fillStyle = 'red'; ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center'; ctx.fillText(word, 128, 80);
            const tex = new THREE.CanvasTexture(canvas);
            const label = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.5), new THREE.MeshBasicMaterial({ map: tex }));
            label.position.set(x, 4, z + 5.1);
            this.scene.add(label);
            
            this.houses.push({ pos: new THREE.Vector3(x, 0, z), word: word });
        }
    }

    setupBasementLevel(targetWord) {
        this.targetWord = targetWord;
        this.createBox(100, 5, 0, 50, 10, 50, 0x050510); // Basement floor/walls
        
        const letters = targetWord.split('').sort(() => Math.random() - 0.5);
        letters.forEach((l, i) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 64; canvas.height = 64;
            ctx.fillStyle = '#222'; ctx.fillRect(0,0,64,64);
            ctx.fillStyle = 'cyan'; ctx.font = '40px Arial';
            ctx.textAlign = 'center'; ctx.fillText(l, 32, 45);
            const tex = new THREE.CanvasTexture(canvas);
            const tile = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshStandardMaterial({ map: tex }));
            tile.rotation.x = -Math.PI/2;
            const x = 100 + (Math.random() - 0.5) * 10;
            const z = (Math.random() - 0.5) * 10;
            tile.position.set(x, 0.1, z);
            tile.userData = { letter: l };
            this.scene.add(tile);
            this.letters.push(tile);
        });
    }

    setupArenaLevel() {
        this.createBox(200, 5, 0, 100, 10, 100, 0x0a0505);
        // Broken walls
        for(let i=0; i<10; i++) {
            this.createBox(200 + (Math.random()-0.5)*80, 2, (Math.random()-0.5)*80, 5, 4, 1);
        }
    }

    checkLetterStanding(pos) {
        for (const tile of this.letters) {
            if (pos.distanceTo(tile.position) < 1.2) return tile.userData.letter;
        }
        return null;
    }

    handleLetterInput(letter) {
        if (letter === this.targetWord[this.currentLetterIndex]) {
            this.currentLetterIndex++;
            if (this.currentLetterIndex === this.targetWord.length) {
                this.puzzleComplete = true;
            }
            return true;
        }
        return false;
    }

    update(dt) {
        // Floating effects for cards/items
        this.scene.children.forEach(c => {
            if (c.userData && c.userData.letter) {
                c.position.y = 0.1 + Math.sin(Date.now() * 0.005) * 0.05;
            }
        });
    }
}
