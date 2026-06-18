// ========================= Boot =========================
class Boot extends Phaser.Scene {
  constructor(){ super('Boot'); }
  create(){
    buildTextures(this); initRun();
    // 字型暖機：先用目標字型量一次 CJK，再等字型就緒才進大廳，避免晶片/按鈕文字因量測過窄而溢出
    const start=()=>{ if(this._started) return; this._started=true; this.scene.start('GuildHall'); };
    try{
      const probe=this.add.text(-9999,-9999,'遺物商隊額外掉落首擊必暴復活0123456789＄',{fontFamily:'"Noto Sans TC","Microsoft JhengHei",sans-serif',fontSize:'16px'});
      probe.setStroke('#000',2); probe.width; probe.destroy();
      if(document.fonts && document.fonts.ready){ document.fonts.ready.then(()=>this.time.delayedCall(50,start)); }
      this.time.delayedCall(550, start);   // 後援：無論字型 API 是否回應都會啟動
    }catch(e){ start(); }
  }
}
