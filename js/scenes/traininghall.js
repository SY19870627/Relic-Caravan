// ========================= 訓練所（花資金換取全隊經驗） =========================
class TrainingHall extends Phaser.Scene {
  constructor(){ super('TrainingHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,26,'訓 練 所',24,TH.gold);
    txt(this,W/2,48,'投入資金讓全隊進行特訓，直接累積經驗、提升等級',12,TH.dim);
    button(this, 96, 26, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    this.render();
  }
  train(cost,xp,label){
    if(GUILD.funds<cost){ this.flash('資金不足'); return; }
    GUILD.funds-=cost;
    const ups=gainXP(xp); saveGuild();
    if(ups.length){ this.flash(ups.join('　'),TH.green); } else { this.flash(`全隊 +${xp} 經驗`,TH.cyan); }
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    add(txt(this,W/2,82,`公會資金 ＄${GUILD.funds}　|　受訓人數 ${activeRoster().length} 人`,13,TH.gold));

    // 隊員等級面板
    add(this.add.rectangle(W/2,180,820,150,TH.panel).setStrokeStyle(2,0x3a3150));
    add(txt(this,W/2,124,'目前隊員',14,TH.cyan));
    const ar=activeRoster(); const step=ar.length>=5?165:190; let x=W/2-(ar.length-1)*step/2;
    ar.forEach(idx=>{ const r=ROSTER[idx], h=HERO_BASE[idx];
      add(this.add.image(x,170,h.sprite).setScale(2.6));
      add(txt(this,x,206,`${h.name} Lv${r.level}/${classCap(idx)}`,12,TH.text));
      add(txt(this,x,224,`經驗 ${r.xp}/${xpNeed(r.level)}`,10,TH.dim));
      x+=step;
    });

    // 特訓方案
    add(this.add.rectangle(W/2,400,820,200,TH.panel).setStrokeStyle(2,0x3a3150));
    add(txt(this,W/2,300,'特訓方案（經驗套用到每位隊員）',14,TH.gold));
    const plans=CFG.training.plans;
    let px=180;
    plans.forEach(([name,cost,xp,col])=>{
      add(txt(this,px,344,name,15,col));
      add(txt(this,px,368,`每人 +${xp} 經驗`,11,TH.text));
      const ok=GUILD.funds>=cost;
      add(button(this, px, 408, 180, 40, `特訓 ＄${cost}`, ()=>this.train(cost,xp,name),
        {size:14, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}));
      px+=270;
    });
    add(txt(this,W/2,476,'※ 升級提升 HP，並在達到等級時習得對應技能；攻防仍取決於武器與防具',11,TH.dim));
  }
  flash(msg,col){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,512,msg,14,col||TH.red).setDepth(99).setWordWrapWidth(820);
    this.tweens.add({targets:this._f,alpha:0,delay:1100,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
