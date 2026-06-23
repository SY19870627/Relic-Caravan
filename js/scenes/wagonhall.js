// ========================= 馬車工坊（選馬 + 項目化強化，工匠負責） =========================
class WagonHall extends Phaser.Scene {
  constructor(){ super('WagonHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(1.35,1.35).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,24,'馬 車 工 坊',22,TH.gold);
    txt(this,W/2,46,'選馬車（決定貨格容量）＋ 工匠強化（需素材與聲望）',12,TH.dim);
    button(this, 96, 24, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    const ct=craftsmanTier(), cnames=['未聘工匠','學徒','師傅','大師'];
    const ws=wagonStats();
    const matStr=MATERIALS.map(m=>`${m.icon}${m.name} ${matCount(m.id)}`).join('　');
    add(txt(this,W/2,72,`🛠 工匠：${cnames[ct]}　馬車貨格：📦${ws.slots}　⭐聲望 ${reputation()}`,13,TH.gold));
    add(txt(this,W/2,92,`素材：${matStr}`,11,TH.cyan));

    // 選馬車：純貨格（後勤），不影響戰鬥
    add(txt(this,W/2,116,'── 選擇馬車（決定貨格，🔒 需聲望解鎖）──',12,TH.gold));
    const pitch=222, x0=W/2-(HORSES.length-1)/2*pitch;
    HORSES.forEach((h,i)=>{
      const cx=x0+i*pitch, cy=192, sel=(GUILD.horse||0)===i, unlocked=horseUnlocked(i);
      const c=this.add.container(cx,cy); add(c);
      c.add(this.add.rectangle(0,0,210,120,TH.panel, unlocked?1:0.7).setStrokeStyle(sel?3:2, !unlocked?0x8a7a3a:(sel?0xe7c14a:0x5a8cd0)));
      c.add(txt(this,0,-44,unlocked?h.name:`🔒 ${h.name}`,15,TH.gold));
      c.add(txt(this,0,-18,`📦 貨格 ${h.slots}`,16,TH.text));
      c.add(txt(this,0,8,h.desc,10,TH.dim).setWordWrapWidth(192).setAlign('center'));
      if(!unlocked){ const ok=canUnlockHorse(i);
        c.add(button(this,0,45,154,26,`解鎖 ⭐${horseCost(i)}`,()=>{
          if(!canUnlockHorse(i)){ this.flash(`聲望不足，需 ⭐${horseCost(i)}`); return; }
          unlockHorse(i); this.flash(`已解鎖 ${h.name}`,TH.green); this.render();
        },{size:12, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}));
      } else if(sel) c.add(txt(this,0,46,'✓ 目前選用',12,'#5ad06a'));
      else c.add(button(this,0,45,120,24,'選用',()=>{ GUILD.horse=i; saveGuild(); this.render(); },{size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c}));
    });

    // 工坊強化（單欄，全部屬後勤）
    add(txt(this,W/2,264,'── 工坊強化（工匠解鎖，一次性）──',12,TH.gold));
    if(ct===0) add(txt(this,W/2,286,'尚未聘僱工匠 → 請至招募所「後勤」聘僱學徒工匠',11,TH.red));
    UPGRADES.forEach((u,j)=>{
      const y=312+j*54; const owned=upgradeOwned(u.id), ok=canBuyUpgrade(u);
      const tier=u.craftReq===1?'學徒':u.craftReq===2?'師傅':'大師';
      const c=this.add.container(W/2,y); add(c);
      c.add(this.add.rectangle(0,0,560,48, TH.panel, owned?0.5:1).setStrokeStyle(2, owned?0x5ad06a:(ct>=u.craftReq?0x55476b:0x6b3a3a)));
      c.add(txt(this,-264,-10,`${u.name}　[${tier}]`,14, owned?'#5ad06a':TH.text,0,0.5));
      c.add(txt(this,-264,10,`${u.desc}`,10,TH.dim,0,0.5).setWordWrapWidth(360));
      if(owned){ c.add(txt(this,190,0,'✓ 已強化',14,'#5ad06a')); }
      else {
        c.add(button(this,190,0,150,32, upgradeCostText(u), ()=>{
          if(craftsmanTier()<u.craftReq){ this.flash(`需 ${tier} 工匠`); return; }
          const m=u.cost.mats||{}; for(const k in m){ if(matCount(k)<m[k]){ this.flash(`素材不足：${MATERIAL_BY_ID[k].name}`); return; } }
          buyUpgrade(u); this.flash(`完成強化：${u.name}`,TH.green); this.render();
        },{size:11, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}));
      }
    });
  }
  flash(msg,col){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,540,msg,14,col||TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:1000,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
