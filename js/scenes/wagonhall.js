// ========================= 馬車強化所（選用 + 升級貨車） =========================
class WagonHall extends Phaser.Scene {
  constructor(){ super('WagonHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,26,'馬 車 強 化 所',24,TH.gold);
    txt(this,W/2,48,'選用馬車（食物＝能去多遠・貨格＝收穫上限），可花資金升級',12,TH.dim);
    button(this, 96, 26, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy());
    this._ui=[];
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    add(txt(this,W/2,78,`公會資金 ＄${GUILD.funds}　（整備所加成已計入）`,13,TH.gold));
    WAGONS.forEach((wg,i)=>{
      const cx=180+i*270, cy=300, sel=(GUILD.wagon||0)===i, ws=wagonStats(i);
      const c=this.add.container(cx,cy); add(c);
      c.add(this.add.rectangle(0,0,250,212,TH.panel,1).setStrokeStyle(sel?3:2, sel?0xe7c14a:0x5a8cd0));
      c.add(txt(this,0,-86,wg.name,17,TH.gold));
      c.add(txt(this,0,-58,`🍖 食物 ${ws.food} 天`,13,TH.text));
      c.add(txt(this,0,-38,`📦 貨格 ${ws.slots}`,13,TH.text));
      c.add(txt(this,0,-16,`強化 Lv${ws.up}`,12,TH.cyan));
      c.add(txt(this,0,8,wg.desc,11,TH.dim));
      if(sel) c.add(txt(this,0,36,'✓ 目前選用',13,'#5ad06a'));
      else c.add(button(this,0,36,130,28,'選用此車',()=>{ GUILD.wagon=i; saveGuild(); this.render(); },{size:13,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c}));
      const cost=wagonUpCost(i), ok=GUILD.funds>=cost;
      c.add(button(this,0,78,210,32,`升級 ＄${cost}（食物+1・貨格+1）`,()=>{
        if(GUILD.funds<cost){ this.flash('資金不足'); return; }
        GUILD.funds-=cost; GUILD.wagonUp[i]=(GUILD.wagonUp[i]||0)+1; saveGuild(); this.render();
      },{size:11, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}));
    });
  }
  flash(msg){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,120,msg,14,TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:800,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
