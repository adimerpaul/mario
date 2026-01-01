export default class Level1 extends Phaser.Scene {
    constructor() {
        super("Level1");
    }

    create() {
        // =========================
        // 1) CONFIGURAR MUNDO
        // =========================
        this.worldWidth = 4000;
        this.worldHeight = 540;

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // =========================
        // 2) PLATAFORMAS
        // =========================
        this.platforms = this.physics.add.staticGroup();

        // Piso largo (cubre todo el mundo)
        const ground = this.add.rectangle(
            this.worldWidth / 2,
            520,
            this.worldWidth,
            60,
            0x3b7a2a
        );
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);

        // Plataforma extra
        const plat = this.add.rectangle(530, 380, 200, 30, 0x2f5f1f);
        this.physics.add.existing(plat, true);
        this.platforms.add(plat);

        // =========================
        // 3) PLAYER
        // =========================
        this.player = this.add.rectangle(100, 450, 40, 60, 0xff0000);
        this.physics.add.existing(this.player);

        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(32, 48);

        this.physics.add.collider(this.player, this.platforms);

        // =========================
        // 4) TECLADO
        // =========================
        this.cursors = this.input.keyboard.createCursorKeys();

        // =========================
        // 5) CÁMARA TIPO MARIO (solo avanza)
        // =========================
        this.maxCamX = 0;
        this.cameraOffsetX = 140;

        // =========================
        // 6) ENEMIGOS (GOOMBAS)
        // =========================
        this.enemies = this.physics.add.group();

        this.spawnGoomba(600, 450);
        this.spawnGoomba(1000, 450);
        this.spawnGoomba(1400, 450);

        // Goombas chocan con plataformas
        this.physics.add.collider(this.enemies, this.platforms);

        // Player vs Goombas
        this.physics.add.overlap(this.player, this.enemies, this.onPlayerHitEnemy, null, this);
    }

    // =========================
    // CREAR GOOMBA
    // =========================
    spawnGoomba(x, y) {
        const goomba = this.add.rectangle(x, y, 34, 28, 0x8b4513);
        this.physics.add.existing(goomba);

        // Física
        goomba.body.setCollideWorldBounds(true);
        goomba.body.setSize(34, 28);

        // Dirección y velocidad (NUMÉRICO)
        // -1 = izquierda, +1 = derecha
        goomba.dir = -1;
        goomba.speed = 60;

        this.enemies.add(goomba);
        return goomba;
    }

    // =========================
    // PLAYER TOCA ENEMIGO
    // =========================
    onPlayerHitEnemy(player, enemy) {
        const pBody = this.player.body;
        const eBody = enemy.body;

        const playerFalling = pBody.velocity.y > 0;
        const playerAbove = pBody.bottom <= eBody.top + 10;

        if (playerFalling && playerAbove) {
            enemy.destroy();          // muere el goomba
            pBody.setVelocityY(-350); // rebote
        } else {
            this.scene.restart();     // pierdes
        }
    }

    update() {
        const body = this.player.body;

        // =========================
        // 1) MOVIMIENTO PLAYER
        // =========================
        const speed = 220;

        if (this.cursors.left.isDown) body.setVelocityX(-speed);
        else if (this.cursors.right.isDown) body.setVelocityX(speed);
        else body.setVelocityX(0);

        // salto
        const onGround = body.blocked.down || body.touching.down;
        if (this.cursors.up.isDown && onGround) body.setVelocityY(-520);

        // =========================
        // 2) CÁMARA SOLO ADELANTE
        // =========================
        const cam = this.cameras.main;
        const desiredScrollX = this.player.x - this.cameraOffsetX;

        this.maxCamX = Math.max(this.maxCamX, desiredScrollX);

        const maxScroll = this.worldWidth - cam.width;
        cam.scrollX = Phaser.Math.Clamp(this.maxCamX, 0, maxScroll);

        // No dejar que el player se vaya por la izquierda visible
        const minPlayerX = cam.scrollX + 20;
        if (this.player.x < minPlayerX) {
            this.player.x = minPlayerX;
            if (body.velocity.x < 0) body.setVelocityX(0);
        }

        // =========================
        // 3) MOVIMIENTO GOOMBAS (AQUÍ, NO EN CREATE)
        // =========================
        this.enemies.children.iterate(goomba => {
            if (!goomba) return;

            // mover
            goomba.body.setVelocityX(goomba.speed * goomba.dir);

            // si choca con pared/borde del mundo/plataforma, girar
            if (goomba.body.blocked.left || goomba.body.blocked.right) {
                goomba.dir *= -1;
            }

            // ---- detectar borde: si no hay piso adelante, girar ----
            const aheadX = goomba.x + goomba.dir * 18;
            const aheadY = goomba.y + 20;

            const bodiesAhead = this.physics.overlapRect(aheadX, aheadY, 2, 2, true, true);

            // Si no hay nada abajo y está parado en piso, gira
            if (bodiesAhead.length === 0 && goomba.body.blocked.down) {
                goomba.dir *= -1;
            }
        });
    }
}
