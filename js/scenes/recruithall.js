// ========================= 招募所（雙分頁：戰鬥成員 ／ 後勤） =========================
class RecruitHall extends Phaser.Scene {
  constructor(){ super('RecruitHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.42).setOrigin(0);
    txt(this,W/2,26,'招 募 所',24,TH.gold);
    txt(this,W/2,48,'解鎖出戰隊員（最多 5 人）／ 聘僱後勤（工匠・領隊）',12,TH.dim);
    button(this, 96, 26, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    this.tab = this.tab||'battle';
    // 分頁切換
    this.tabBtns = [
      button(this, W/2-90, 80, 170, 30, '⚔ 戰鬥成員', ()=>{ this.tab='battle'; this.render(); }, {size:13,fill:0x4a3f63,stroke:0x9a7fd0,hover:0x6a5d8a}),
      button(this, W/2+90, 80, 170, 30, '🛠 後勤', ()=>{ this.tab='logistics'; this.render(); }, {size:13,fill:0x4a3f63,stroke:0x9a7fd0,hover:0x6a5d8a}),
    ];
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    // 分頁高亮
    this.tabBtns[0].bg.setStrokeStyle(this.tab==='battle'?3:2, this.tab==='battle'?0xe7c14a:0x9a7fd0);
    this.tabBtns[1].bg.setStrokeStyle(this.tab==='logistics'?3:2, this.tab==='logistics'?0xe7c14a:0x9a7fd0);
    add(txt(this,W/2,118,`⭐ 聲望 ${reputation()}（可花費）　·　隊伍 ${partySizeCap()}/5 人`,13,TH.gold));
    if(this.tab==='battle') this.renderBattle(); else this.renderLogistics();
  }
  renderBattle(){
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    add(txt(this,W/2,140,'解鎖隊員以擴充出戰隊伍（最多 5 人，依職業順序加入）',11,TH.dim));
    const n=CLASS_ORDER.length, cw=165, gap=8, total=n*cw+(n-1)*gap, x0=(W-total)/2;
    const cap=partySizeCap();
    CLASS_ORDER.forEach((sp,i)=>{
      const cx=x0+cw/2+i*(cw+gap), cy=320, r=ROSTER[i];
      const inParty = i<cap, isNext = i===cap;
      const c=this.add.container(cx,cy); add(c);
      c.add(this.add.rectangle(0,0,cw,300,TH.panel, inParty?1:0.6).setStrokeStyle(2, inParty?0x5ad06a:(isNext?0xe7c14a:0x4a4658)));
      c.add(this.add.image(0,-96,sp).setScale(4));
      c.add(txt(this,0,-40,HERO_BASE[i].name,16, inParty?TH.gold:TH.dim));
      const roleTxt = {warrior:'前排坦克',ranger:'後排遠程',priest:'後排治療',mage:'後排範圍',rogue:'高速近戰'}[sp]||'';
      c.add(txt(this,0,-18,roleTxt,11,TH.cyan));
      if(inParty){
        c.add(txt(this,0,12,'✓ 已在出戰隊伍',14,'#5ad06a'));
        c.add(txt(this,0,40,'探險中由升級三選一成長',10,TH.dim).setWordWrapWidth(cw-16));
      } else if(isNext){
        const cost=partySlotCost(), ok=canUnlockPartySlot();
        c.add(txt(this,0,10,'解鎖後加入出戰隊伍',11,TH.text).setWordWrapWidth(cw-16));
        c.add(button(this,0,112,cw-20,46,`解鎖隊員\n⭐${cost}`,()=>{
          if(!canUnlockPartySlot()){ this.flash(`聲望不足，需 ⭐${cost}`); return; }
          unlockPartySlot(); initRun(); this.flash(`${HERO_BASE[i].name} 加入隊伍！`,TH.green); this.render();
        },{size:13, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}));
        if(!ok) c.add(txt(this,0,150,`🔒 需聲望 ⭐${cost}`,10,TH.red));
      } else {
        c.add(txt(this,0,12,'🔒 尚未解鎖',12,TH.dim));
        c.add(txt(this,0,32,'需先解鎖前一位隊員',10,TH.dim).setWordWrapWidth(cw-16));
      }
    });
    add(txt(this,W/2,500,`目前出戰 ${activeRoster().length} / 5 人`,13,TH.cyan));
  }
  renderLogistics(){
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    add(txt(this,W/2,140,'後勤成員不佔出戰名額：工匠負責項目化強化、領隊負責途中料理',11,TH.dim));
    // 工匠
    add(this.add.rectangle(W/2-225,330,400,330,TH.panel).setStrokeStyle(2,0xd0b05a));
    add(txt(this,W/2-225,190,'🛠 工 匠 師 傅',18,'#ffd24a'));
    const ct=craftsmanTier(), cnames=['（尚未聘僱）','學徒','師傅','大師'];
    add(txt(this,W/2-225,222,`目前階級：${cnames[ct]}`,14, ct?TH.green:TH.dim));
    add(txt(this,W/2-225,250,'解鎖馬車與整備所的項目化強化',11,TH.dim));
    add(txt(this,W/2-225,272,'階級越高 → 可解鎖越進階的強化項目',11,TH.dim));
    const cd=craftsmanNextDef();
    if(cd){ const cCost=(CFG.repCost.craftsman||[])[ct]||0, ok=canUpgradeCraftsman();
      add(button(this,W/2-225,420,300,46,`${ct?'升階為':'聘僱'} ${cd.name} ⭐${cCost}`,()=>{
        if(!canUpgradeCraftsman()){ this.flash(`聲望不足，需 ⭐${cCost}`); return; }
        upgradeCraftsman(); this.flash(`工匠 → ${cnames[craftsmanTier()]}`,TH.green); this.render();
      },{size:14, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}));
      if(!ok) add(txt(this,W/2-225,456,`🔒 需聲望 ⭐${cCost}`,11,TH.red));
    } else add(txt(this,W/2-225,425,'★ 已是大師工匠',15,'#5ad06a'));
    // 領隊
    add(this.add.rectangle(W/2+225,330,400,330,TH.panel).setStrokeStyle(2,0x6fae6f));
    add(txt(this,W/2+225,190,'🧭 領 隊',18,'#9fe8a0'));
    add(txt(this,W/2+225,222, hasLeader()?'狀態：已聘僱':'狀態：尚未聘僱',14, hasLeader()?TH.green:TH.dim));
    add(txt(this,W/2+225,250,'料理：在營火休息時消耗食材補血／強化',11,TH.dim));
    add(txt(this,W/2+225,272,'料理：用食材煮出補血／增益（探險中使用）',11,TH.dim));
    const lCost=CFG.repCost.leader||0;
    if(!hasLeader()){ const ok=canHireLeader();
      add(button(this,W/2+225,420,300,46,`聘僱領隊 ⭐${lCost}`,()=>{
        if(!canHireLeader()){ this.flash(`聲望不足，需 ⭐${lCost}`); return; }
        hireLeader(); this.flash('領隊已加入後勤！',TH.green); this.render();
      },{size:14, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}));
      if(!ok) add(txt(this,W/2+225,456,`🔒 需聲望 ⭐${lCost}`,11,TH.red));
    } else add(txt(this,W/2+225,425,'✓ 領隊已就位',15,'#5ad06a'));
  }
  flash(msg,col){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,524,msg,15,col||TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:1000,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
