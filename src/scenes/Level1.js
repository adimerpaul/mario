export default class Level1 extends Phaser.Scene {
    constructor() {
        super('Level1');
    }
    // preload() {
    // }
    create() {
        // grupo de plataformas estaticas
        this.platforms = this.physics.add.staticGroup();

        // piso
        const ground = this.add.rectangle(480, 520,2000, 60, 0x3b7a2a);
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);

        // plataformae extra
        const plat = this.add.rectangle(530, 380, 200, 30, 0x2f5f1f);
        this.physics.add.existing(plat, true);
        this.platforms.add(plat);

        this.player = this.add.rectangle(100, 450, 40, 60, 0xff0000);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(32, 48);

        this.physics.add.collider(this.player, this.platforms);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.world.setBounds(0, 0, 4000, 540);
        this.cameras.main.setBounds(0, 0, 4000, 540);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.maxCamX = 0;
    }
    update() {
        const body = this.player.body;

        if (this.cursors.left.isDown) {
            body.setVelocityX(-220);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(220);
        }
        else {
            body.setVelocityX(0);
        }

        const onGround = body.blocked.down || body.touching.down;
        if (this.cursors.up.isDown && onGround) {
            body.setVelocityY(-520);
        }

        const cam = this.cameras.main;
        this.maxCamX = Math.max(this.maxCamX, cam.scrollX);
        cam.scrollX = this.maxCamX;
        const camLeft = cam.scrollX;
        const minX = camLeft + 20;

        if (this.player.x < minX) {
            this.player.x = minX;
            if (body.velocity.x < 0) {
                body.setVelocityX(0);
            }
        }
    }
}