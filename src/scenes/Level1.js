export default class Level1 extends Phaser.Scene {
    constructor() {
        super("Level1");
    }

    create() {
        // =========================
        // 1) CONFIGURAR "MUNDO" (MAPA)
        // =========================
        // Tamaño del mundo (más ancho que la pantalla)
        this.worldWidth = 4000;
        this.worldHeight = 540;

        // Límites del mundo para físicas y cámara
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // =========================
        // 2) PLATAFORMAS ESTÁTICAS
        // =========================
        this.platforms = this.physics.add.staticGroup();

        // Piso: debe cubrir TODO el mundo (ancho = worldWidth)
        // OJO: el rectángulo se posiciona por su CENTRO, por eso x = worldWidth/2
        const ground = this.add.rectangle(
            this.worldWidth / 2, // centro
            520,
            this.worldWidth,     // mismo ancho que el mundo
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
        // 3) JUGADOR (RECTÁNGULO)
        // =========================
        this.player = this.add.rectangle(100, 450, 40, 60, 0xff0000);
        this.physics.add.existing(this.player);

        // Ajustes del body (colisión)
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(32, 48);

        // Colisión con plataformas
        this.physics.add.collider(this.player, this.platforms);

        // =========================
        // 4) TECLADO
        // =========================
        this.cursors = this.input.keyboard.createCursorKeys();

        // =========================
        // 5) CÁMARA TIPO MARIO (SOLO AVANZA)
        // =========================
        // Guardamos el máximo scrollX alcanzado (para que no retroceda)
        this.maxCamX = 0;

        // (Opcional) offset para que el jugador no esté EXACTO al centro
        // Ej: que esté un poco más a la izquierda como Mario.
        this.cameraOffsetX = 140;
    }

    update() {
        const body = this.player.body;

        // =========================
        // 1) MOVIMIENTO HORIZONTAL
        // =========================
        const speed = 220;

        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
        } else {
            body.setVelocityX(0);
        }

        // =========================
        // 2) SALTO (SOLO SI ESTÁ EN PISO)
        // =========================
        const onGround = body.blocked.down || body.touching.down;
        if (this.cursors.up.isDown && onGround) {
            body.setVelocityY(-520);
        }

        // =========================
        // 3) CÁMARA SOLO HACIA ADELANTE (NO RETROCEDE)
        // =========================
        const cam = this.cameras.main;

        // Queremos que la cámara "siga" al jugador, pero:
        // - solo avanzando (nunca hacia atrás)
        // - con un offset para que no esté centrado exacto
        const desiredScrollX = (this.player.x - this.cameraOffsetX);

        // maxCamX = el mayor valor alcanzado, así no puede bajar
        this.maxCamX = Math.max(this.maxCamX, desiredScrollX);

        // límite máximo para que la cámara no salga del mundo
        const maxScroll = this.worldWidth - cam.width;

        // Aplicar scrollX con clamp (0 a maxScroll)
        cam.scrollX = Phaser.Math.Clamp(this.maxCamX, 0, maxScroll);

        // =========================
        // 4) EVITAR QUE EL JUGADOR SE PIERDA POR IZQUIERDA
        // =========================
        // La cámara está fija adelante, así que no dejamos que el jugador
        // se salga por el borde izquierdo visible.
        const minPlayerX = cam.scrollX + 20; // margen

        if (this.player.x < minPlayerX) {
            this.player.x = minPlayerX;
            if (body.velocity.x < 0) body.setVelocityX(0);
        }
    }
}
