// ========================= Boot =========================
class Boot extends Phaser.Scene {
  constructor(){ super('Boot'); }
  create(){ buildTextures(this); initRun(); this.scene.start('GuildHall'); }
}
