// ========================= 招募所（招募第四職業：法師） =========================
class RecruitHall extends Phaser.Scene {
  constructor(){ super('RecruitHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,26,'招 募 所',24,TH.gold);
    txt(this,W/2,48,'招募新成員加入探險隊（隊伍將擴充至四人）',12,TH.dim);
    button(this, 96, 26, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    add(txt(this,W/2,82,`公會資金 ＄${GUILD.funds}`,13,TH.gold));
    add(this.add.rectangle(W/2,312,540,376,TH.panel).setStrokeStyle(2,0x9a7fd0));
    add(this.add.image(320,250,'mage').setScale(5));
    add(txt(this,415,168,'法 師',22,'#c9a0ff',0));
    add(txt(this,415,202,'後排 ・ 範圍魔法輸出',13,TH.cyan,0));
    add(txt(this,415,230,BIO.mage||'',12,TH.dim,0).setWordWrapWidth(360));
    add(txt(this,415,272,'起手：火花杖（範圍魔法 9/11）・布衣',12,TH.text,0));
    const sk=(SKILLS.mage||[]).map(s=>`Lv${s.lv} ${s.name}`).join('・');
    add(txt(this,415,298,'技能：'+sk,11,'#ffd24a',0).setWordWrapWidth(380));
    const cost=CFG.recruit.mage;
    if(GUILD.mageHired){ add(txt(this,W/2,432,'✓ 法師已加入隊伍',16,'#5ad06a')); }
    else {
      const ok=GUILD.funds>=cost;
      add(button(this,W/2,432,260,46,`招募法師 ＄${cost}`,()=>{ if(GUILD.funds<cost){ this.flash('資金不足'); return; }
          GUILD.funds-=cost; GUILD.mageHired=true; saveGuild(); initRun(); this.render(); },
        {size:16, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}));
    }
  }
  flash(msg){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,482,msg,14,TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:800,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
