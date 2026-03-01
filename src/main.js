import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { gsap } from 'gsap';
import { Player } from './Player.js';
import { World } from './World.js';
import { EnemyManager } from './Enemies.js';

class Game {
    constructor() {
        this.state = 'MENU';
        this.score = 0;
        this.level = 1;
        this.timer = 0;
        this.timerActive = false;
        this.clueWord = "";
        
        this.initScene();
        this.initPhysics();
        this.initGameObjects();
        this.setupEventListeners();
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020205);
        this.scene.fog = new THREE.FogExp2(0x020205, 0.08);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        this.sun = new THREE.DirectionalLight(0x4444ff, 0.2);
        this.sun.position.set(10, 50, 10);
        this.sun.castShadow = true;
        this.scene.add(this.sun);
    }

    initPhysics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -15, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        this.physicsStep = 1/60;
    }

    initGameObjects() {
        this.worldBuilder = new World(this.scene, this.world);
        this.player = new Player(this.scene, this.world, this.camera);
        this.enemies = new EnemyManager(this.scene, this.world, this.player);
        
        this.wordPool = ['FIRE', 'DARK', 'DOOR', 'WIND', 'MOON', 'COLD'];
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('close-clue').addEventListener('click', () => {
            document.getElementById('clue-popup').style.display = 'none';
            this.player.isLocked = false;
            this.player.requestPointerLock();
        });
        window.addEventListener('resize', () => this.onWindowResize());
    }

    startGame() {
        document.getElementById('loading').style.display = 'none';
        document.querySelectorAll('.hud').forEach(el => el.style.display = 'block');
        document.getElementById('tutorial-info').style.display = 'block';
        document.getElementById('crosshair').style.display = 'block';
        this.state = 'TUTORIAL';
        this.player.isLocked = true;
        this.player.requestPointerLock();
        this.level = 1;
        this.updateScore(0);
        this.showTutorialMessage("Level 1: Tutorial. Move with WASD. Jump with Space. Shoot with Mouse Left.");
        
        // Thunder effect
        setInterval(() => {
            if (Math.random() > 0.95) this.triggerThunder();
        }, 100);
    }

    triggerThunder() {
        const flash = new THREE.PointLight(0xffffff, 10, 100);
        flash.position.set(this.player.mesh.position.x, 20, this.player.mesh.position.z);
        this.scene.add(flash);
        setTimeout(() => this.scene.remove(flash), 100);
        setTimeout(() => {
            const flash2 = new THREE.PointLight(0xffffff, 5, 100);
            flash2.position.set(this.player.mesh.position.x + 10, 20, this.player.mesh.position.z);
            this.scene.add(flash2);
            setTimeout(() => this.scene.remove(flash2), 50);
        }, 150);
    }

    updateScore(amount) {
        this.score += amount;
        document.getElementById('score').innerText = `SCORE: ${this.score}`;
    }

    showTutorialMessage(msg) {
        const div = document.createElement('div');
        div.style.cssText = "position:absolute; top:20%; left:50%; transform:translateX(-50%); color:cyan; font-size:24px; text-align:center; transition: opacity 1s;";
        div.innerText = msg;
        document.body.appendChild(div);
        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 1000);
        }, 4000);
    }

    startTimer(seconds) {
        this.timer = seconds;
        this.timerActive = true;
        document.getElementById('timer-container').style.display = 'block';
    }

    updateTimer(dt) {
        if (!this.timerActive) return;
        this.timer -= dt;
        if (this.timer <= 0) {
            this.timer = 0;
            this.timerActive = false;
            this.handleTimeout();
        }
        const mins = Math.floor(this.timer / 60);
        const secs = Math.floor(this.timer % 60);
        document.getElementById('timer-container').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    handleTimeout() {
        this.enemies.spawnShadowServants(2);
        this.showTutorialMessage("TIMER EXPIRED: SHADOWS APPROACH");
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    transitionToLevel2() {
        this.level = 2;
        this.state = 'STREET';
        this.showTutorialMessage("Level 2: The Haunted Street. Find the Clue Card.");
        this.clueWord = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
        this.worldBuilder.setupStreetLevel(this.clueWord, this.wordPool);
        this.player.mesh.position.set(0, 50, 0); // Fly from sky
        this.player.body.position.set(0, 50, 0);
    }

    transitionToLevel3() {
        this.level = 3;
        this.state = 'BASEMENT';
        this.updateScore(50);
        this.showTutorialMessage("Level 3: Basement. Stand on letters in order.");
        this.worldBuilder.setupBasementLevel(this.clueWord);
        this.player.body.position.set(100, 2, 0);
    }

    transitionToLevel4() {
        this.level = 4;
        this.state = 'ARENA';
        this.updateScore(100);
        this.showTutorialMessage("Final Level: Arena. Defeat the Shadows.");
        this.worldBuilder.setupArenaLevel();
        this.player.body.position.set(200, 2, 0);
        this.enemies.spawnArenaWave();
    }

    gameOver() {
        this.state = 'GAMEOVER';
        document.exitPointerLock();
        document.getElementById('game-over').style.display = 'flex';
        document.getElementById('final-score-lose').innerText = `Final Score: ${this.score}`;
    }

    victory() {
        this.state = 'VICTORY';
        this.updateScore(200);
        document.exitPointerLock();
        document.getElementById('victory').style.display = 'flex';
        document.getElementById('final-score-win').innerText = `Final Score: ${this.score}`;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = 1/60;
        
        if (this.state !== 'MENU' && this.state !== 'GAMEOVER' && this.state !== 'VICTORY') {
            this.world.step(this.physicsStep);
            this.player.update(dt);
            this.enemies.update(dt);
            this.worldBuilder.update(dt);
            this.updateTimer(dt);

            // Level Logic Triggers
            if (this.level === 1 && this.player.mesh.position.z < -20) this.transitionToLevel2();
            
            // Interaction Check (E Key)
            if (this.player.keys['KeyE']) {
                this.handleInteraction();
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    handleInteraction() {
        if (this.level === 2) {
            // Check Clue Card Nearby
            if (this.player.mesh.position.distanceTo(this.worldBuilder.clueCardPos) < 3) {
                document.getElementById('clue-popup').style.display = 'flex';
                document.getElementById('clue-word').innerText = this.clueWord;
                this.startTimer(60);
                this.player.isLocked = true;
                document.exitPointerLock();
            }
            // Check Houses
            this.worldBuilder.houses.forEach(h => {
                if (this.player.mesh.position.distanceTo(h.pos) < 5) {
                    if (h.word === this.clueWord) {
                        this.transitionToLevel3();
                    } else {
                        this.gameOver();
                    }
                }
            });
        }
        
        if (this.level === 3) {
            const letter = this.worldBuilder.checkLetterStanding(this.player.mesh.position);
            if (letter) {
                const success = this.worldBuilder.handleLetterInput(letter);
                if (!success) {
                    this.enemies.spawnShadowServants(1);
                    this.gameOver();
                } else if (this.worldBuilder.puzzleComplete) {
                    this.transitionToLevel4();
                }
            }
        }
        this.player.keys['KeyE'] = false; // Debounce
    }
}

new Game();
