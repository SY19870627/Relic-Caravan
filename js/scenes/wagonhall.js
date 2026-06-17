// ========================= 馬車工坊（選馬 + 項目化強化，工匠負責） =========================
class WagonHall extends Phaser.Scene {
  constructor(){ super('WagonHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,24,'馬 車 工 坊',22,TH.gold);
    txt(this,W/2,46,'選馬（食物⇄貨格取捨）＋ 工匠項目化強化（需素材與資金）',12,TH.dim);
    button(this, 96, 24, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    const ct=craftsmanTier(), cnames=['未聘工匠','學徒','師傅','大師'];
    const ws=wagonStats();
    // 資源列
    const matStr=MATERIALS.map(m=>`${m.icon}${m.name} ${matCount(m.id)}`).join('　');
    add(txt(this,W/2,72,`公會資金 ＄${GUILD.funds}　🛠 工匠：${cnames[ct]}　馬車：🍖${ws.food} 📦${ws.slots}`,13,TH.gold));
    add(txt(this,W/2,92,`素材：${matStr}`,11,TH.cyan));

    // 選馬
    add(txt(this,W/2,114,'── 選擇馬匹 ──',12,TH.gold));
    HORSES.forEach((h,i)=>{
      const cx=180+i*270, cy=176, sel=(GUILD.horse||0)===i;
      const c=this.add.container(cx,cy); add(c);
      c.add(this.add.rectangle(0,0,250,96,TH.panel,1).setStrokeStyle(sel?3:2, sel?0xe7c14a:0x5a8cd0));
      c.add(txt(this,0,-32,h.name,16,TH.gold));
      c.add(txt(this,0,-10,`🍖 食物 ${h.food}　📦 貨格 ${h.slots}`,13,TH.text));
      c.add(txt(this,0,16,h.desc,10,TH.dim).setWordWrapWidth(238));
      if(sel) c.add(txt(this,0,34,'✓ 目前選用',12,'#5ad06a'));
      else c.add(button(this,0,34,120,24,'選用',()=>{ GUILD.horse=i; saveGuild(); this.render(); },{size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c}));
    });

    // 項目化強化
    add(txt(this,W/2,238,'── 項目化強化（工匠解鎖，一次性）──',12,TH.gold));
    if(ct===0) add(txt(this,W/2,256,'尚未聘僱工匠 → 請至招募所「後勤」聘僱學徒工匠',11,TH.red));
    const cats=[['wagon','🛞 馬車強化',192],['outfit','📦 整備所強化',W-192]];
    cats.forEach(([cat,label,cx])=>{
      add(txt(this,cx,272,label,13,TH.cyan));
      const list=UPGRADES.filter(u=>u.cat===cat);
      list.forEach((u,j)=>{
        const y=300+j*46; const owned=upgradeOwned(u.id), ok=canBuyUpgrade(u);
        const c=this.add.container(cx,y); add(c);
        c.add(this.add.rectangle(0,0,356,42, TH.panel, owned?0.5:1).setStrokeStyle(2, owned?0x5ad06a:(ct>=u.craftReq?0x55476b:0x6b3a3a)));
        c.add(txt(this,-166,-9,`${u.name}`,13, owned?'#5ad06a':TH.text,0));
        c.add(txt(this,-166,9,`${u.desc}　[${u.craftReq===1?'學徒':u.craftReq===2?'師傅':'大師'}]`,10,TH.dim,0));
        if(owned){ c.add(txt(this,112,0,'✓ 已強化',13,'#5ad06a')); }
        else {
          c.add(button(this,108,0,140,34, upgradeCostText(u), ()=>{
            if(craftsmanTier()<u.craftReq){ this.flash(`需 ${u.craftReq===1?'學徒':u.craftReq===2?'師傅':'大師'} 工匠`); return; }
            if(GUILD.funds<u.cost.funds){ this.flash('資金不足'); return; }
            const m=u.cost.mats||{}; for(const k in m){ if(matCount(k)<m[k]){ this.flash(`素材不足：${MATERIAL_BY_ID[k].name}`); return; } }
            buyUpgrade(u); this.flash(`完成強化：${u.name}`,TH.green); this.render();
          },{size:10, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}));
        }
      });
    });
  }
  flash(msg,col){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,540,msg,14,col||TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:1000,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
