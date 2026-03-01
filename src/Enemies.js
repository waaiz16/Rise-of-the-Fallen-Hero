import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { gsap } from 'gsap';

export class EnemyManager {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.enemies = [];
        this.boss = null;
    }

    spawnShadowServants(count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 5;
            const x = this.player.mesh.position.x + Math.cos(angle) * dist;
            const z = this.player.mesh.position.z + Math.sin(angle) * dist;
            this.createServant(x, z);
        }
    }

    createServant(x, z) {
        const servantGroup = new THREE.Group();
        servantGroup.isEnemy = true;
        servantGroup.hp = 50;

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 2, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xff0000, emissiveIntensity: 0.2 })
        );
        servantGroup.add(body);

        const eyes = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        eyes.position.set(0.2, 0.7, 0.4);
        const eyes2 = eyes.clone();
        eyes2.position.x = -0.2;
        servantGroup.add(eyes, eyes2);

        servantGroup.position.set(x, 1, z);
        servantGroup.takeDamage = (amt) => {
            servantGroup.hp -= amt;
            if (servantGroup.hp <= 0) this.removeEnemy(servantGroup);
        };

        this.scene.add(servantGroup);
        this.enemies.push(servantGroup);
    }

    spawnArenaWave() {
        // Clear old
        this.enemies.forEach(e => this.scene.remove(e));
        this.enemies = [];
        
        const locs = [[210, 0], [190, 0], [200, 10], [200, -10], [220, 5]];
        locs.forEach(l => this.createServant(l[0], l[1]));
    }

    spawnBoss() {
        const bossGroup = new THREE.Group();
        bossGroup.isEnemy = true;
        bossGroup.hp = 500;
        bossGroup.isBoss = true;

        const body = new THREE.Mesh(
            new THREE.DodecahedronGeometry(3),
            new THREE.MeshStandardMaterial({ color: 0x221111, emissive: 0x880000 })
        );
        bossGroup.add(body);

        const horns = new THREE.Mesh(
            new THREE.TorusGeometry(1.5, 0.2, 8, 16),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        horns.position.y = 2.5;
        horns.rotation.x = Math.PI/2;
        bossGroup.add(horns);

        bossGroup.position.set(240, 3, 0);
        bossGroup.takeDamage = (amt) => {
            bossGroup.hp -= amt;
            if (bossGroup.hp <= 0) {
                this.scene.remove(bossGroup);
                window.gameInstance.victory();
            }
        };

        this.boss = bossGroup;
        this.scene.add(bossGroup);
        this.enemies.push(bossGroup);
    }

    removeEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx > -1) {
            this.enemies.splice(idx, 1);
            this.scene.remove(enemy);
            window.gameInstance.updateScore(30);
            
            if (this.enemies.length === 0 && window.gameInstance.level === 4 && !this.boss) {
                this.spawnBoss();
            }
        }
    }

    update(dt) {
        this.enemies.forEach(e => {
            const dir = new THREE.Vector3().subVectors(this.player.mesh.position, e.position).normalize();
            const speed = e.isBoss ? 2 : 4;
            e.position.addScaledVector(dir, speed * dt);
            e.lookAt(this.player.mesh.position);

            if (e.position.distanceTo(this.player.mesh.position) < (e.isBoss ? 4 : 1.5)) {
                this.player.takeDamage(e.isBoss ? 0.5 : 0.2);
            }

            if (e.isBoss) {
                this.updateBossAttacks(e, dt);
            }
        });
    }

    updateBossAttacks(boss, dt) {
        if (!boss.lastAttack) boss.lastAttack = 0;
        boss.lastAttack += dt;

        if (boss.lastAttack > 3) {
            boss.lastAttack = 0;
            // Teleport
            gsap.to(boss.position, {
                x: this.player.mesh.position.x + (Math.random() - 0.5) * 10,
                z: this.player.mesh.position.z + (Math.random() - 0.5) * 10,
                duration: 0.5,
                ease: "power2.inOut"
            });
            // Fireball effect
            const fireball = new THREE.Mesh(
                new THREE.SphereGeometry(0.5),
                new THREE.MeshBasicMaterial({ color: 0xff4400 })
            );
            fireball.position.copy(boss.position).add(new THREE.Vector3(0, 2, 0));
            this.scene.add(fireball);
            const fbDir = new THREE.Vector3().subVectors(this.player.mesh.position, fireball.position).normalize();
            
            const fbInterval = setInterval(() => {
                fireball.position.addScaledVector(fbDir, 0.5);
                if (fireball.position.distanceTo(this.player.mesh.position) < 1.5) {
                    this.player.takeDamage(20);
                    this.scene.remove(fireball);
                    clearInterval(fbInterval);
                }
            }, 20);
            setTimeout(() => { 
                this.scene.remove(fireball); 
                clearInterval(fbInterval);
            }, 3000);
        }
    }
}
