// ========================= 倉庫 ・ 收藏（頁簽圖鑑）v9.6 =========================
// v6.1 武器/防具/道具/貴重 獨立頁簽；v9.6 新增「物件」「怪物」說明頁簽（純圖鑑解說，不計收藏）
class WarehouseHall extends Phaser.Scene {
  constructor(){ super('WarehouseHall'); }
  create(){
    if(!RUN) initRun();
    syncDiscovered();
    const W=this.scale.width;
    sceneBg(this,{glow:0xf2c14e});
    sceneHeader(this,'圖 鑑 ・ 收 藏','',{accent:'gold'});
    button(this, 70, 20, 120, 28, '返回大廳', ()=>this.scene.start('GuildHall'), {variant:'info', size:12, icon:'home', iconSize:13});

    const byLv=(a,b)=>(a.lvReq||1)-(b.lvReq||1);   // 圖鑑依需求等級排序（同級維持目錄順序）
    this.cats=[
      {label:'武器', accent:'teal', items:WEAPONS.slice().sort(byLv), kind:'武器'},
      {label:'防具', accent:'blue', items:ARMORS.slice().sort(byLv), kind:'防具'},
      {label:'道具', accent:'green', items:LOOT.consum.map(n=>({name:n})), kind:'道具'},
      {label:'貴重', accent:'gold', items:LOOT.valuable.map(n=>({name:n})), kind:'貴重物品'},
      {label:'物件', accent:'ember', info:'obj'},
      {label:'怪物', accent:'red', info:'mon'},
    ];
    let total=0, got=0;
    this.cats.forEach(c=>{ if(!c.items) return; c.items.forEach(it=>{ total++; if(this.lit(c.kind,it.name)) got++; }); });
    const pc=chip(this, 0, 20, {label:'收藏 '+got+' / '+total, accent:'gold', icon:'bag', size:12, h:26}); pc.setX(W-14-pc.w);

    // 詳細面板（常駐，不隨頁簽重建）
    this.det=panel(this, W/2, 462, 866, 138, {accent:'gold', title:'物品資訊', icon:'bag', titleSize:14});
    this._det=[];
    this.tab=0;
    this._wheelHooked=false;   // v9.7.1 場景重入時 input 監聽已被清除，旗標必須重置
    this._mons=null;           // 怪物目錄快取一併重建（保險）
    this.render();
  }
  render(){
    const W=this.scale.width;
    if(this._objs) this._objs.forEach(o=>o.destroy());
    this._objs=[];
    // 頁簽列：收藏類附進度、說明類（物件/怪物）純標籤
    const tw=130, tg=10, tx=W/2-(6*tw+5*tg)/2+tw/2;
    this.cats.forEach((c,i)=>{ const on=i===this.tab;
      const label=c.items ? (c.label+'　'+c.items.filter(it=>this.lit(c.kind,it.name)).length+' / '+c.items.length) : c.label;
      this._objs.push(button(this, tx+i*(tw+tg), 80, tw, 32, label,
        ()=>{ if(this.tab!==i){ this.tab=i; this.render(); } },
        {accent:on?c.accent:'slate', size:12}));
    });
    const c=this.cats[this.tab];
    if(c.info==='obj') this.renderObjects();
    else if(c.info==='mon') this.renderMonsters();
    else {
      const sz=44, pitch=56, cols=14, x0=35+sz/2, y0=138, rowH=62;
      c.items.forEach((it,i)=>{ const col=i%cols, row=Math.floor(i/cols);
        this.slot(x0+col*pitch, y0+row*rowH, sz, it, c.kind); });
    }
    this.showDetail(null,null,false);
  }
  lit(kind,name){ return (kind==='武器'||kind==='防具')? gearOwned(name) : itemDiscovered(name); }
  // ---- v9.6 物件說明頁：全物件目錄（像素圖＋觸發說明；一律顯示，不做收集判定）----
  renderObjects(){
    const keys=Object.keys(BATTLE_OBJECTS);
    const sz=48, pitch=60, cols=14, x0=35+sz/2, y0=142, rowH=68;
    keys.forEach((k,i)=>{ const def=BATTLE_OBJECTS[k]; if(!def) return;
      const col=i%cols, row=Math.floor(i/cols), x=x0+col*pitch, y=y0+row*rowH;
      this.infoSlot(x, y, sz, def.sprite, 2.2, ()=>this.showObjDetail(k));
      this._objs.push(txt(this, x, y+sz/2+9, def.name, 8.5, UI.dim));
    });
  }
  // ---- v9.6 怪物說明頁：自怪物組資料自動建目錄（基礎數值；同名去重、依地城分區）----
  monsterDex(){
    if(this._mons) return this._mons;
    const out=[], seen={};
    (MONSTER_GROUPS||[]).forEach(g=>{ (g.waves||[]).forEach(w=>{ (w||[]).forEach(e=>{
      if(!e || !e.sprite || !e.name || seen[e.name]) return; seen[e.name]=1;
      out.push({sprite:e.sprite, name:e.name, hp:e.hp, atkSeq:e.atkSeq||[], def:e.def||0, interval:e.interval||1200,
        ranged:!!e.ranged, healer:!!e.healer, boss:!!e.boss, skills:(e.skills||[]).map(s=>s.name), region:g.region});
    }); }); });
    if(typeof ENV_PARASITE!=='undefined' && !seen[ENV_PARASITE.name])
      out.push({...ENV_PARASITE, atkSeq:ENV_PARASITE.atkSeq||[], def:ENV_PARASITE.def||0, ranged:false, healer:false, boss:false, skills:[], region:5});
    out.sort((a,b)=>(a.region-b.region)||(a.boss?1:0)-(b.boss?1:0)||a.hp-b.hp);
    this._mons=out; return out;
  }
  renderMonsters(){
    // v9.7 捲軸：全部怪物列入，滾輪/▲▼ 捲動（與隊形/料理清單同風格：8px 軌道＋金色滑塊 min34）
    const list=this.monsterDex();
    const sz=36, pitch=47, cols=17, x0=32+sz/2, y0=132, rowH=48, vis=5;
    const rows=Math.ceil(list.length/cols), maxOff=Math.max(0, rows-vis);
    if(this._monScroll==null) this._monScroll=0;
    this._monScroll=Math.max(0, Math.min(maxOff, this._monScroll));
    const off=this._monScroll;
    list.slice(off*cols, (off+vis)*cols).forEach((m,i)=>{ const col=i%cols, row=Math.floor(i/cols);
      this.infoSlot(x0+col*pitch, y0+row*rowH, sz, m.sprite, 1.9, ()=>this.showMonDetail(m), m.boss);
    });
    // v9.7.1 滾輪改掛場景層級（覆蓋式感應區會因 topOnly 擋掉格子的 hover 詳情）
    const top=y0-rowH/2, bot=y0+(vis-1)*rowH+rowH/2;
    this._monMaxOff=maxOff;
    if(!this._wheelHooked){ this._wheelHooked=true;
      this.input.on('wheel', (p,objs,dx,dy)=>{
        const cur=this.cats[this.tab]; if(!cur || cur.info!=='mon') return;
        const d=dy>0?1:-1, n=Math.max(0, Math.min(this._monMaxOff||0, this._monScroll+d));
        if(n!==this._monScroll){ this._monScroll=n; this.render(); } });
    }
    if(maxOff>0){
      // 軌道＋滑塊
      const tx=876, tTop=top+16, tH=(bot-top)-32;
      const g=this.add.graphics(); this._objs.push(g);
      g.fillStyle(0x000000,0.45); g.fillRoundedRect(tx-4, tTop, 8, tH, 4);
      const thH=Math.max(34, tH*vis/rows), thY=tTop+(tH-thH)*(off/maxOff);
      g.fillStyle(0xf2c14e,0.9); g.fillRoundedRect(tx-4, thY, 8, thH, 4);
      // ▲▼ 按鈕
      const arrow=(y,sym,d)=>{ const t=txt(this, tx, y, sym, 13, off+(d>0?1:-1)>=0&&off+d<=maxOff?UI.gold:UI.faint).setInteractive({useHandCursor:true});
        t.on('pointerdown',()=>{ const n=Math.max(0, Math.min(maxOff, this._monScroll+d)); if(n!==this._monScroll){ this._monScroll=n; this.render(); } });
        this._objs.push(t); };
      arrow(tTop-10,'▲',-1); arrow(tTop+tH+10,'▼',1);
      this._objs.push(txt(this, tx, tTop+tH+26, (off+1)+'-'+Math.min(rows,off+vis)+'/'+rows+'列', 8.5, UI.dim));
    }
  }
  // 說明頁通用格位：像素圖直接入格，懸停看詳情
  infoSlot(x,y,sz,sprite,scl,onOver,boss){
    const g=this.add.graphics(); this._objs.push(g);
    g.fillStyle(0x000000,0.3); g.fillRoundedRect(x-sz/2,y-sz/2+3,sz,sz,8);
    g.fillStyle(UI.raisedN,1); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz,8);
    g.lineStyle(1.5, boss?0xff6f7a:UI.lineN, 0.8); g.strokeRoundedRect(x-sz/2,y-sz/2,sz,sz,8);
    if(this.textures.exists(sprite)){ const img=this.add.image(x,y,sprite).setScale(scl); this._objs.push(img); }
    else { this._objs.push(txt(this, x, y, '?', sz*0.4, UI.faint)); }
    const hit=this.add.rectangle(x,y,sz,sz,0xffffff,0.001).setInteractive({useHandCursor:true}); this._objs.push(hit);
    hit.on('pointerover', onOver);
  }
  showObjDetail(k){
    const def=BATTLE_OBJECTS[k]; if(!def) return;
    if(this._det) this._det.forEach(o=>o.destroy()); this._det=[];
    const p=this.det, add=o=>{this._det.push(o);return o;};
    const ix=p.left+50, tx=p.left+96, ty=p.bodyTop+2;
    add(this.add.graphics().fillStyle(0x2a2238,0.7).fillRoundedRect(ix-30,p.bodyTop+8,60,60,10));
    if(this.textures.exists(def.sprite)) add(this.add.image(ix, p.bodyTop+38, def.sprite).setScale(3));
    add(txt(this, tx, ty+10, def.icon+' '+def.name, 18, accent('ember').hex, 0));
    const durTxt = def.dur>0 ? ('觸發耐久 '+def.dur+' 格（被利用才消耗，不承受攻擊）') : '地形・恆存（不可耗盡）';
    add(txt(this, tx, ty+38, '戰場物件 ・ '+durTxt+(def.aura?('　|　光環：'+({burn:'週期灼燒',poison:'週期疊毒',zap:'週期電擊',sting:'週期螫刺',hastePulse:'週期加速'}[def.aura]||def.aura)):''), 12, UI.text, 0));
    add(txt(this, tx, ty+62, WarehouseHall.OBJ_DEX[k]||'戰場環境物件。', 11.5, UI.gold, 0).setWordWrapWidth(p.right-tx-30));
  }
  showMonDetail(m){
    if(this._det) this._det.forEach(o=>o.destroy()); this._det=[];
    const p=this.det, add=o=>{this._det.push(o);return o;};
    const ix=p.left+50, tx=p.left+96, ty=p.bodyTop+2;
    add(this.add.graphics().fillStyle(0x3a2230,0.7).fillRoundedRect(ix-30,p.bodyTop+8,60,60,10));
    if(this.textures.exists(m.sprite)) add(this.add.image(ix, p.bodyTop+38, m.sprite).setScale(3));
    const d=DESTINATIONS[m.region];
    add(txt(this, tx, ty+10, (m.boss?'👑 ':'')+m.name, 18, m.boss?UI.red:accent('red').hex, 0));
    add(txt(this, tx, ty+38, '產地：'+(d?d.name:'?')+'　|　HP '+m.hp+'　|　ATK '+m.atkSeq.join('/')+'　|　DEF '+m.def+'　|　出手 '+(m.interval/1000).toFixed(1)+'s（基礎值，實戰依難度縮放）', 11.5, UI.text, 0));
    const traits=[m.boss?'首領':null, m.ranged?'遠程':'近戰', m.healer?'治療':null].filter(Boolean);
    add(txt(this, tx, ty+62, '特性：'+traits.join('・')+(m.skills.length?('　|　技能：'+m.skills.join('、')):''), 11.5, UI.gold, 0).setWordWrapWidth(p.right-tx-30));
  }
  slot(x,y,sz,item,kind){
    const disc=this.lit(kind,item.name), v=disc?itemVisual(item.name):null, ac=disc?accent(v.accent):accent('slate');
    const g=this.add.graphics(); this._objs.push(g);
    g.fillStyle(0x000000,0.3); g.fillRoundedRect(x-sz/2,y-sz/2+3,sz,sz,9);
    g.fillStyle(disc?UI.raisedN:UI.panelN, disc?1:0.55); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz,9);
    if(disc){ g.fillStyle(ac.deep,0.4); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz*0.5,9); }
    g.lineStyle(2, disc?ac.num:UI.lineN, disc?0.9:0.35); g.strokeRoundedRect(x-sz/2,y-sz/2,sz,sz,9);
    if(disc){ this._objs.push(icon(this, x, y-2, v.icon, sz*0.52, ac.num)); }
    else { this._objs.push(txt(this, x, y, '?', sz*0.42, UI.faint)); }
    const hit=this.add.rectangle(x,y,sz,sz,0xffffff,0.001).setInteractive({useHandCursor:true}); this._objs.push(hit);
    hit.on('pointerover',()=>this.showDetail(item,kind,disc));
  }
  showDetail(item,kind,disc){
    if(this._det) this._det.forEach(o=>o.destroy());
    this._det=[]; const p=this.det, add=o=>{this._det.push(o);return o;};
    const ix=p.left+50, tx=p.left+96, ty=p.bodyTop+2;
    if(!item){ add(txt(this, p.cx, p.bodyTop+34, '把游標移到格子上，查看詳細資訊', 13, UI.dim)); return; }
    if(!disc){
      add(icon(this, ix, p.bodyTop+34, 'box', 40, UI.lineN));
      add(txt(this, tx, ty+8, '？？？（尚未取得）', 16, UI.faint, 0));
      add(txt(this, tx, ty+34, '繼續探險地城，取得後就會在此解鎖並顯示完整資訊。', 12, UI.dim, 0));
      return;
    }
    const v=itemVisual(item.name), ac=accent(v.accent);
    add(this.add.graphics().fillStyle(ac.deep,0.5).fillRoundedRect(ix-30,p.bodyTop+8,60,60,10));
    add(icon(this, ix, p.bodyTop+38, v.icon, 42, ac.num));
    add(txt(this, tx, ty+10, item.name, 18, ac.hex, 0));
    if(kind==='武器'){
      add(txt(this, tx, ty+38, '武器 ・ '+weaponClassLabel(item)+'　|　傷害 '+item.atkSeq.join(' / ')+(item.heal?'　|　治療 '+item.heal:'')+'　|　階'+item.lvReq+'・'+gearRarity(item).name, 12, UI.text, 0));
      if(item.traitDesc) add(txt(this, tx, ty+62, '特效：'+item.traitDesc, 12, UI.gold, 0));
    } else if(kind==='防具'){
      add(txt(this, tx, ty+38, '防具 ・ '+armorClassLabel(item)+'　|　防禦 '+item.def+'　|　護盾 +'+item.shield+'　|　階'+item.lvReq+'・'+gearRarity(item).name, 12, UI.text, 0));
      if(item.traitDesc) add(txt(this, tx, ty+62, '特效：'+item.traitDesc, 12, UI.gold, 0));
    } else if(kind==='貴重物品'){
      add(txt(this, tx, ty+38, '貴重物品 ・ 探險中可在地城商店變賣為 💰（每趟）', 12, UI.text, 0));
      add(txt(this, tx, ty+62, '越深的地城、階級越高的貴重物品越值錢', 12, UI.gold, 0));
    } else {
      add(txt(this, tx, ty+38, '道具 ・ 探險中使用', 12, UI.text, 0));
      add(txt(this, tx, ty+62, (CONSUM_INFO[item.name]||''), 12, UI.green, 0));
    }
    if(kind==='武器'||kind==='防具'){ add(txt(this, p.right-20, ty+10, '已擁有', 12, UI.green, 1)); }
    else { add(txt(this, p.right-20, ty+10, disc?'已發現':'未發現', 12, disc?UI.green:UI.dim, 1)); }
  }
}
// v9.6 物件觸發說明（圖鑑用；機制以戰鬥實作為準）
WarehouseHall.OBJ_DEX = {
  campfire:'火系技能可引燃連鎖轟炸全敵；波次清空後全隊圍火小憩回血；受傷的紮營敵人會狗急跳牆踢翻它。',
  tree:'熊人變身可連根拔起投擲敵陣；盜賊受擊瞬間與樹移形換位（樹代承這一擊）。',
  fence:'掩體：盜賊可藉其掩護背刺，每次消耗 1 耐久。',
  statue:'神聖掩體：牧師祈禱可共鳴升階神蹟；遺物守護靈會前來受祝福（攻擊 ×1.5）；幽魂常聚集於此。',
  altar:'王房限定的神聖物件：祈禱升階神蹟、守護靈受祝福，與石像共用「神聖」判定。',
  pool:'水源共鳴：雨系親和技能可借水強化（替代雨天）；低血野獸會跑來喝水；水澤生物由此湧出。',
  rift:'空間系魔法（靈魂震爆/隕石術）靠近可增幅；虛空生物由此竄出。',
  roast:'受傷的紮營敵人會跑來大快朵頤回血——是敵方的補血資源，先搶先贏。',
  lava:'地形光環：週期灼燒前排隨機單位；火系法師反而能吸收火勢獲得攻擊強化。',
  pit:'遊俠回風可把瀕死雜兵吹落坑中即死；骸骨死後可能沉入坑底、數秒後半血爬回。',
  bog:'地形光環：週期對隨機單位疊毒（敵我皆然）。',
  hive:'中立騷擾：週期螫刺隨機單位（敵我皆然，小傷＋中毒一層），螫完耐久墜落。',
  keg:'受傷的紮營敵人會跑來灌酒：回血但爛醉降速——回血給敵人、節奏還給你。',
  carcass:'胡狼死後留下；受傷的禿鷹撲食後回滿血——盡快清屍或速戰速決。',
  marshcarcass:'澤馬／澤鱷死後留下；落地即開始孵化，每秒 1 隻寄生蟲、共 3 隻。',
  bonepile:'沙漠棲地巢穴：胡狼自遺骨堆中竄出。',
  deadtree:'沙漠棲地巢穴：禿鷹自枯樹頂撲下；兼掩體可供背刺。',
  sandpit:'沙漠棲地巢穴：沙蟲沙蠍破沙而出；兼具地坑功能（回風可吹落）。',
  rackW:'我方行動時順手抄起利刃：該員本場 ATK +5（每架限 2 人份、每人一次）。',
  rackA:'我方行動時披上備用甲：該員本場 DEF +4、護盾 +12（每架限 2 人份）。',
  cyanfire:'魔力幽焰：引燃連鎖傷害 ×1.5；波次小憩改為給全隊護盾。',
  gong:'戰士戰吼震響銅鑼：全敵出手延遲（震聾）。試煉招牌／補給架可選。',
  lantern:'盜賊吹燈滅火：全場入暗數秒，暗中暴擊率大增。試煉招牌／補給架可選。',
  candles:'每次治療點亮一燭；三燭俱燃降下小神蹟（全隊回復＋解除暈眩）後重燃。試煉招牌／補給架可選。',
  crystal:'奧術水晶塔：週期電擊隨機敵人（每擊耗 1 耐久）。試煉招牌／補給架可選。',
  totem:'獵風圖騰：週期順風脈衝，我方全體短暫加速。試煉招牌／補給架可選。',
};
