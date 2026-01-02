// Level1.js
export default class Level1 extends Phaser.Scene {
    constructor() {
        super("Level1");
    }

    preload() {
        // Sprites (PNG completos)
        this.load.image("marioSheet", "assets/sprites/mario.png");
        this.load.image("enemySheet", "assets/sprites/enemies.png");

        // (Opcional) fondo bonito tipo Mario
        // Si no tienes este archivo, comenta esta línea
        this.load.image("bg", "assets/sprites/bg-1-1.png");
    }

    create() {
        // =========================
        // 0) CONFIG BÁSICA
        // =========================
        this.SCALE = 3;

        // IMPORTANTE:
        // Si tu Mario “por defecto” está mirando a la DERECHA, deja true.
        // Si tu Mario “por defecto” está mirando a la IZQUIERDA, cambia a false.
        this.MARIO_DEFAULT_FACES_RIGHT = true;

        // =========================
        // 1) FRAMES (RECORTES) DEL PNG
        // =========================
        const marioTex = this.textures.get("marioSheet");
        // Evitar duplicar frames si reinicias la escena
        if (!marioTex.has("mario_idle")) {
            // Small Mario (ajustados a tu sheet)
            marioTex.add("mario_jump", 0, 29, 0, 17, 16);
            marioTex.add("mario_run1", 0, 60, 0, 14, 16);
            marioTex.add("mario_run2", 0, 89, 0, 16, 16);
            marioTex.add("mario_idle", 0, 181, 0, 13, 16);
        }

        const enemyTex = this.textures.get("enemySheet");
        if (!enemyTex.has("goomba_1")) {
            enemyTex.add("goomba_1", 0, 0, 4, 16, 16);
            enemyTex.add("goomba_2", 0, 30, 4, 16, 16);
        }

        // =========================
        // 2) ANIMACIONES (con guard)
        // =========================
        if (!this.anims.exists("player-idle")) {
            this.anims.create({
                key: "player-idle",
                frames: [{ key: "marioSheet", frame: "mario_idle" }],
                frameRate: 1,
                repeat: -1,
            });
        }

        if (!this.anims.exists("player-run")) {
            this.anims.create({
                key: "player-run",
                frames: [
                    { key: "marioSheet", frame: "mario_run1" },
                    { key: "marioSheet", frame: "mario_run2" },
                ],
                frameRate: 20,
                repeat: -1,
            });
        }

        if (!this.anims.exists("player-jump")) {
            this.anims.create({
                key: "player-jump",
                frames: [{ key: "marioSheet", frame: "mario_jump" }],
                frameRate: 1,
            });
        }

        if (!this.anims.exists("goomba-walk")) {
            this.anims.create({
                key: "goomba-walk",
                frames: [
                    { key: "enemySheet", frame: "goomba_1" },
                    { key: "enemySheet", frame: "goomba_2" },
                ],
                frameRate: 6,
                repeat: -1,
            });
        }

        // =========================
        // 3) MUNDO + GRAVEDAD
        // =========================
        this.worldWidth = 4000;
        this.worldHeight = 540;

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // Si en tu main.js ya tienes gravity, puedes borrar esto
        this.physics.world.gravity.y = 1200;

        // =========================
        // 4) FONDO (OPCIONAL)
        // =========================
        if (this.textures.exists("bg")) {
            // tileSprite para que el fondo se “repita” y se vea largo
            this.bg = this.add
                .tileSprite(0, 0, this.worldWidth, this.worldHeight, "bg")
                .setOrigin(0, 0)
                .setScrollFactor(0.3); // parallax
            // Escala entera para pixel art
            this.bg.setScale(2);
        }

        // =========================
        // 5) PLATAFORMAS (rectángulos con física estática)
        // =========================
        this.platforms = this.physics.add.staticGroup();

        const ground = this.add.rectangle(
            this.worldWidth / 2,
            520,
            this.worldWidth,
            60,
            0x3b7a2a
        );
        ground.isPlatform = true; // marca para detectar bordes
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);

        const plat = this.add.rectangle(530, 380, 200, 30, 0x2f5f1f);
        plat.isPlatform = true;
        this.physics.add.existing(plat, true);
        this.platforms.add(plat);

        // =========================
        // 6) PLAYER (SPRITE + FÍSICA)
        // =========================
        this.player = this.physics.add.sprite(100, 450, "marioSheet", "mario_idle");
        this.player.setScale(this.SCALE);
        this.player.setCollideWorldBounds(true);

        // Body (en pixeles del frame)
        this.player.body.setSize(14, 16);
        this.player.body.setOffset(1, 0);

        // Face inicial (quieto)
        this.setPlayerFacing("right");

        this.physics.add.collider(this.player, this.platforms);

        // =========================
        // 7) TECLADO
        // =========================
        this.cursors = this.input.keyboard.createCursorKeys();

        // =========================
        // 8) CÁMARA TIPO MARIO (solo avanza)
        // =========================
        this.maxCamX = 0;
        this.cameraOffsetX = 140;

        // =========================
        // 9) ENEMIGOS (GOOMBAS)
        // =========================
        this.enemies = this.physics.add.group();

        this.spawnGoomba(600, 450);
        this.spawnGoomba(1000, 450);
        this.spawnGoomba(1400, 450);

        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.overlap(this.player, this.enemies, this.onPlayerHitEnemy, null, this);

        // =========================
        // 10) SCORE
        // =========================
        this.score = 0;
        this.scoreText = this.add
            .text(16, 16, "SCORE: 000000", {
                fontSize: "20px",
                color: "#000",
                fontFamily: "monospace",
            })
            .setScrollFactor(0);
    }

    // ==========================================
    // UTIL: orientar mario según dirección
    // ==========================================
    setPlayerFacing(dir) {
        // Queremos: dir="right" => mira a la derecha
        //          dir="left"  => mira a la izquierda
        //
        // Si el sprite “por defecto” mira a la derecha:
        //   right => flipX=false, left => flipX=true
        //
        // Si “por defecto” mira a la izquierda:
        //   right => flipX=true,  left => flipX=false
        if (this.MARIO_DEFAULT_FACES_RIGHT) {
            this.player.setFlipX(dir === "left");
        } else {
            this.player.setFlipX(dir === "right");
        }
    }

    // =========================
    // CREAR GOOMBA
    // =========================
    spawnGoomba(x, y) {
        const g = this.physics.add.sprite(x, y, "enemySheet", "goomba_1");
        g.setScale(this.SCALE);

        g.body.setSize(16, 16);
        g.body.setOffset(0, 0);

        g.dir = -1; // -1 izq, +1 der
        g.speed = 60;

        g.play("goomba-walk");

        this.enemies.add(g);
        return g;
    }

    // =========================
    // PLAYER TOCA ENEMIGO
    // =========================
    onPlayerHitEnemy(player, enemy) {
        const pBody = player.body;
        const eBody = enemy.body;

        const playerFalling = pBody.velocity.y > 0;
        const playerAbove = pBody.bottom <= eBody.top + 10;

        if (playerFalling && playerAbove) {
            enemy.destroy();
            pBody.setVelocityY(-350);

            this.addScore(100);
            this.showFloatingText(enemy.x, enemy.y - 10, "+100");
        } else {
            this.scene.restart();
        }
    }

    addScore(points) {
        this.score += points;
        const scoreStr = this.score.toString().padStart(6, "0");
        this.scoreText.setText(`SCORE: ${scoreStr}`);
    }

    showFloatingText(x, y, text) {
        const t = this.add.text(x, y, text, {
            fontSize: "16px",
            color: "#000",
            fontFamily: "monospace",
        });

        this.tweens.add({
            targets: t,
            y: y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => t.destroy(),
        });
    }

    update() {
        const body = this.player.body;
        const onGround = body.blocked.down || body.touching.down;

        // =========================
        // 1) MOVIMIENTO + ANIM PLAYER
        // =========================
        const speed = 220;

        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);

            // ✅ Ahora SIEMPRE mira hacia donde se mueve
            this.setPlayerFacing("left");

            if (onGround) this.player.play("player-run", true);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);

            // ✅ Ahora SIEMPRE mira hacia donde se mueve
            this.setPlayerFacing("right");

            if (onGround) this.player.play("player-run", true);
        } else {
            body.setVelocityX(0);
            if (onGround) this.player.play("player-idle", true);
        }

        // salto
        if (this.cursors.up.isDown && onGround) {
            body.setVelocityY(-520);
            this.player.play("player-jump", true);
        }

        // si está en el aire, mantener salto
        if (!onGround) this.player.play("player-jump", true);

        // =========================
        // 2) CÁMARA SOLO ADELANTE
        // =========================
        const cam = this.cameras.main;
        const desiredScrollX = this.player.x - this.cameraOffsetX;

        this.maxCamX = Math.max(this.maxCamX, desiredScrollX);
        const maxScroll = this.worldWidth - cam.width;
        cam.scrollX = Phaser.Math.Clamp(this.maxCamX, 0, maxScroll);

        // No dejar que el player se pierda por la izquierda visible
        const minPlayerX = cam.scrollX + 20;
        if (this.player.x < minPlayerX) {
            this.player.x = minPlayerX;
            if (body.velocity.x < 0) body.setVelocityX(0);
        }

        // =========================
        // 3) MOVIMIENTO GOOMBAS
        // =========================
        this.enemies.children.iterate((g) => {
            if (!g) return;

            g.body.setVelocityX(g.speed * g.dir);

            // girar si choca con algo
            if (g.body.blocked.left || g.body.blocked.right) g.dir *= -1;

            // Anti-caída (solo mira si hay PLATAFORMA adelante)
            const aheadX = g.x + g.dir * (10 * this.SCALE);
            const aheadY = g.y + (10 * this.SCALE);

            const bodiesAhead = this.physics.overlapRect(aheadX, aheadY, 2, 2, true, true);
            const hasPlatformAhead = bodiesAhead.some(
                (b) => b.gameObject && b.gameObject.isPlatform
            );

            if (!hasPlatformAhead && g.body.blocked.down) g.dir *= -1;
        });
    }
}
