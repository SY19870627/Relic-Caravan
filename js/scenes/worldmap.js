// ========================= 世界地圖（選目的地） =========================
class WorldMap extends Phaser.Scene {
  constructor(){ super('WorldMap'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.42).setOrigin(0);
    txt(this,W/2,28,'世 界 地 圖',24,TH.gold);
    txt(this,W/2,50,'選擇目的地：越遠越危險、遺物階級越高；旅途會先消耗食物',12,TH.dim);
    txt(this,W/2,72,`🍖 本趟食物 ${RUN.food}　📦 貨格 ${RUN.slots}　⭐ 聲望 ${reputation()}`,13,TH.gold);

    const rep=reputation();
    DESTINATIONS.forEach((d,i)=>{
      const cy=122+i*98, cx=W/2;
      const lockedRep=rep<d.repReq, lockedFood=(RUN.food-d.travel)<1, ok=!lockedRep&&!lockedFood;
      const c=this.add.container(cx,cy);
      const bg=this.add.rectangle(0,0,720,84,TH.panel,ok?1:0.55).setStrokeStyle(2, ok?0x5a8cd0:0x3a3150);
      c.add(bg);
      c.add(txt(this,-340,-24,d.name,17, ok?TH.gold:TH.dim,0));
      c.add(txt(this,-340,0,d.desc,11,TH.dim,0));
      c.add(txt(this,-340,20,`🍖 旅途 -${d.travel} 天　抵達後剩 ${Math.max(0,RUN.food-d.travel)} 糧　危險/遺物 ${'★'.repeat(d.tier)}`,12, ok?'#cdeecd':TH.dim,0));
      if(ok){
        const b=button(this,250,0,150,40,'▶ 前往',()=>this.go(d),{size:15,fill:0x3a6b3a,stroke:0x5ad06a,hover:0x4c8c4c});
        c.add(b);
      } else {
        c.add(txt(this,250,0, lockedRep?`🔒 需聲望 ${d.repReq}`:'🍖 食物不足', 14, TH.red, 0.5));
      }
    });

    button(this, 120, H-32, 180, 36, '← 返回整備', ()=>this.scene.start('Outfit'), {size:14,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
  }
  go(d){
    const di = DESTINATIONS.indexOf(d);
    if(!relicEffects().noFoodDrain) RUN.food -= d.travel;   // 潮汐之冠：旅途不耗食物
    RUN.destTier = d.tier; RUN.destName = d.name; RUN.destIndex = di;
    RUN.map = genMap();
    this.scene.start('Map');
  }
}
