// ========================= 地城地圖 =========================
function genMap(){
  const layout=[1,2,3,2,2,1]; let nodes=[], id=0;
  layout.forEach((cnt,layer)=>{
    for(let i=0;i<cnt;i++){
      let type,risk;
      if(layer===0){ type='start'; risk=0; }
      else if(layer===layout.length-1){ type='relic'; risk=4; }
      else { const roll=Math.random(); type=roll<CFG.map.battleRoll?'battle':(roll<CFG.map.eventRoll?'event':(roll<CFG.map.chestRoll?'chest':'elite')); risk=Math.min(3,layer); if(type==='elite')risk=3; if(type==='event')risk=0; }
      const food = layer===0?0 : 1 + (layer>=3?1:0) + (Math.random()<0.25?1:0); // 越深越耗糧，銳化「跑遠 vs 滿載」
      let lootKind=null;
      if(type==='chest'){ const lk=Math.random(); lootKind = lk<0.34?'貴重物品':(lk<0.6?'防具':(lk<0.8?'武器':(lk<0.92?'道具':'遺物'))); }
      // 領隊探路屬性：天氣／地形／陷阱
      const weather = layer===0?'clear':Phaser.Utils.Array.GetRandom(WEATHERS).id;
      const terrain = layer===0?'plain':Phaser.Utils.Array.GetRandom(TERRAINS).id;
      const trap = (layer>0 && type!=='relic' && Math.random()<0.22) ? 0.12 : 0;
      nodes.push({id:id++,layer,i,cnt,type,risk,food,lootKind,weather,terrain,trap,next:[],done:false});
    }
  });
  const byLayer=l=>nodes.filter(n=>n.layer===l);
  for(let l=0;l<layout.length-1;l++){
    const cur=byLayer(l), nxt=byLayer(l+1);
    cur.forEach((n,ci)=>{
      const ratio=nxt.length/cur.length; let j=Math.min(nxt.length-1,Math.floor(ci*ratio));
      n.next.push(nxt[j].id);
      if(Math.random()<0.6){ const j2=Math.min(nxt.length-1,j+1); if(j2!==j) n.next.push(nxt[j2].id); }
      if(Math.random()<0.3 && j>0) n.next.push(nxt[j-1].id);
    });
    nxt.forEach((m,mi)=>{ if(!cur.some(n=>n.next.includes(m.id))){ const src=cur[Math.min(cur.length-1,Math.round(mi*cur.length/nxt.length))]; src.next.push(m.id);} });
  }
  return {nodes, current: nodes[0].id, started:false};
}
class MapScene extends Phaser.Scene {
  constructor(){ super('Map'); }
  create(){
    const W=this.scale.width, H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.45);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,24,'地 城 路 線'+(RUN.destName?` — ${RUN.destName}　${'★'.repeat(RUN.destTier||1)}`:''),20,TH.gold);

    this.drawHUD();
    this.nodePos={};
    const m=RUN.map;
    const layCount=Math.max(...m.nodes.map(n=>n.layer))+1;
    m.nodes.forEach(n=>{
      const x=80+n.layer*((W-160)/(layCount-1));
      const y=n.cnt===1?300:(180+n.i*(260/(n.cnt-1)));
      this.nodePos[n.id]={x,y};
    });
    // 連線
    const gfx=this.add.graphics();
    m.nodes.forEach(n=>n.next.forEach(nid=>{
      const a=this.nodePos[n.id], bsel=this.nodePos[nid];
      gfx.lineStyle(3, 0x3a3150, 1).beginPath(); gfx.moveTo(a.x,a.y); gfx.lineTo(bsel.x,bsel.y); gfx.strokePath();
    }));
    // 節點
    const cur=m.nodes.find(n=>n.id===m.current);
    const reachable = m.started ? cur.next : cur.next; // start 也是往下一層
    m.nodes.forEach(n=>this.drawNode(n, reachable.includes(n.id), n.id===m.current));

    // 道具列（task4：消耗品可在地圖上使用，回復/復活隊伍）
    const items=RUN.cargo.filter(it=>it.kind==='道具');
    if(items.length){
      txt(this,W/2,90,'🧪 道具（點擊使用 → 回復隊伍）',11,'#9fd0ff');
      items.slice(0,7).forEach((it,i)=>{
        button(this, 110+(i%7)*108, 110, 100, 24, `${it.icon}${it.name}`, ()=>{ const msg=useConsumable(it); RUN.itemToast=msg; this.scene.restart(); }, {size:11,fill:0x33486b,stroke:0x5a8cd0,hover:0x466a9c});
      });
    }
    if(RUN.itemToast){ const t=txt(this,W/2,140,RUN.itemToast,13,TH.green).setDepth(95); RUN.itemToast=null;
      this.tweens.add({targets:t,alpha:0,delay:1100,duration:600,onComplete:()=>t.destroy()}); }

    button(this, W-90, H-34, 150, 36, '⮌ 撤退收工', ()=>this.retreat(), {size:14,fill:0x6b3a3a,stroke:0xd05a5a,hover:0x8c4c4c});
    button(this, 100, H-34, 150, 36, '🎒 整理裝備', ()=>{ RUN.equipOpen=true; RUN.equipSel=null; this.scene.restart(); }, {size:13,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    button(this, 268, H-34, 116, 36, '⚔ 隊形', ()=>this.scene.start('FormationHall',{from:'Map'}), {size:13,fill:0x4a3f63,stroke:0x9a7fd0,hover:0x6a5d8a});
    if(hasLeader()) button(this, 400, H-34, 116, 36, '🍳 領隊料理', ()=>{ RUN.cookOpen=true; this.scene.restart(); }, {size:12,fill:0x6b5a3a,stroke:0xd0b05a,hover:0x8c7a4c});
    if(!m.started){ m.started=true; }
    if(RUN.pendingReward){ const pr=RUN.pendingReward; RUN.pendingReward=null; this.showReward(pr); }
    if(RUN.equipOpen){ this.openEquip(RUN.equipSel); }
    if(RUN.cookOpen){ this.openCook(); }
  }
  showReward(pr){
    const W=this.scale.width,H=this.scale.height;
    this.add.rectangle(0,0,W,H,0x000000,0.6).setOrigin(0).setDepth(90);
    this.add.rectangle(W/2,H/2,440,300,TH.panel).setStrokeStyle(3,0x5ad06a).setDepth(91);
    txt(this,W/2,H/2-118,'戰鬥勝利！戰利品',18,TH.green).setDepth(92);
    let y=H/2-86;
    if(!pr.got.length && !pr.full.length){ txt(this,W/2,y,'這次沒有掉落',14,TH.dim).setDepth(92); y+=26; }
    pr.got.forEach(it=>{ txt(this,W/2,y,`${it.icon} ${it.name}（${it.kind}・價值 ${it.value}）`,14, it.kind==='遺物'?TH.cyan:TH.text).setDepth(92); y+=24; });
    pr.full.forEach(it=>{ txt(this,W/2,y,`貨車已滿，放棄 ${it.icon} ${it.name}`,13,TH.red).setDepth(92); y+=22; });
    if(pr.xp){ txt(this,W/2,y,`全隊獲得經驗 +${pr.xp}`,13,'#cdeecd').setDepth(92); y+=22; }
    (pr.levelups||[]).forEach(s=>{ txt(this,W/2,y,'⬆ 升級！ '+s,15,TH.gold).setDepth(92); y+=24; });
    const by=H/2+120;
    const hasGear = pr.got.some(it=>it.gear);
    if(hasGear){
      button(this,W/2-90,by,140,34,'收下',()=>this.scene.restart(),{size:14,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(92);
      button(this,W/2+90,by,160,34,'🎒 立即裝備',()=>{ RUN.equipOpen=true; RUN.equipSel=null; this.scene.restart(); },{size:13,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c}).setDepth(92);
    } else {
      button(this,W/2,by,150,34,'收下',()=>this.scene.restart(),{size:14,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(92);
    }
  }
  openEquip(sel){
    const W=this.scale.width,H=this.scale.height;
    const cargoGear=RUN.cargo.filter(it=>it.kind==='武器'||it.kind==='防具');
    if(sel!=null && sel>=cargoGear.length) sel=null;
    this.add.rectangle(0,0,W,H,0x000000,0.7).setOrigin(0).setDepth(90).setInteractive();
    this.add.rectangle(W/2,H/2,780,470,TH.panel).setStrokeStyle(3,0x5a8cd0).setDepth(91);
    txt(this,W/2,H/2-205,'🎒 整理裝備',20,'#9fd0ff').setDepth(95);
    txt(this,W/2,H/2-182, sel!=null?'選擇要裝上的隊員（換下的會放回貨車）':'穿在身上的裝備全滅時不會遺失；貨車裡的會。把好裝備換上身。',12, sel!=null?'#5ad06a':TH.dim).setDepth(95);
    RUN.heroes.forEach((h,i)=>{
      const x=W/2-250+i*250, y=H/2-110, canRecv=sel!=null;
      const cont=this.add.container(x,y).setDepth(95);
      const bg=this.add.rectangle(0,0,224,150,0x241a30).setStrokeStyle(2, canRecv?0x5ad06a:0x3a3150);
      const spr=this.add.image(-80,-4,h.sprite).setScale(2.6);
      const s=heroStat(h);
      cont.add([bg,spr,
        txt(this,-42,-52,`${h.name} Lv${s.level}`,15,TH.gold,0),
        txt(this,-42,-30,'武器 '+h.weapon.name,11,'#9fe8ff',0),
        txt(this,-42,-12,'防具 '+h.armor.name,11,'#9fd0a0',0),
        txt(this,-42,12,`HP ${s.maxHp} ATK ${s.atkSeq.join('/')} DEF ${s.def}`,11,TH.text,0)]);
      if(canRecv){
        const item=cargoGear[sel], req=(item.gear&&item.gear.lvReq)||1, ok=s.level>=req;
        if(ok){
          cont.add(txt(this,0,54,`▶ 換上此${item.kind}`,13,'#5ad06a'));
          bg.setInteractive({useHandCursor:true}).on('pointerdown',()=>{ equipSwap(item,i); RUN.equipSel=null; this.scene.restart(); });
        } else {
          bg.setStrokeStyle(2,0x6b3a3a);
          cont.add(txt(this,0,54,`職業等級不足，需 Lv${req}`,12,TH.red));
        }
      }
    });
    txt(this,W/2,H/2+56,'貨車裡的武器/防具（點選 → 再點隊員換上；Lv = 等級需求）',12,TH.gold).setDepth(95);
    if(!cargoGear.length) txt(this,W/2,H/2+92,'目前沒有可替換的武器或防具',13,TH.dim).setDepth(95);
    cargoGear.forEach((it,j)=>{
      button(this, W/2-280+(j%5)*145, H/2+96+Math.floor(j/5)*40, 135,32, `${it.icon}${it.name} Lv${(it.gear&&it.gear.lvReq)||1}`, ()=>{ RUN.equipSel=j; this.scene.restart(); },
        {size:12, fill:j===sel?0x3a6b3a:0x33283f, stroke:j===sel?0x5ad06a:0x55476b}).setDepth(95);
    });
    button(this, W/2, H/2+206, 140,34, '關閉', ()=>{ RUN.equipOpen=false; RUN.equipSel=null; this.scene.restart(); }, {size:14,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(95);
  }
  drawHUD(){
    const W=this.scale.width;
    this.add.rectangle(0,46,W,34,0x000000,0.5).setOrigin(0);
    txt(this,16,63,`🍖 食物 ${RUN.food}`,15, RUN.food<=1?TH.red:TH.text,0);
    txt(this,150,63,`📦 貨格 ${RUN.cargo.length}/${RUN.slots}`,15, RUN.cargo.length>=RUN.slots?TH.red:TH.text,0);
    // 隊伍 HP
    let x=300; const step=RUN.heroes.length>=5?116:150;
    RUN.heroes.forEach(h=>{ const s=heroStat(h);
      txt(this,x,63,`${h.name} ${Math.max(0,h.hp)}/${s.maxHp}`,11, h.hp<=0?TH.red:'#9fd0a0',0); x+=step; });
  }
  drawNode(n, reach, isCur){
    const p=this.nodePos[n.id], info=NODE_INFO[n.type];
    const c=this.add.container(p.x,p.y);
    const circle=this.add.circle(0,0,24, info.col, n.done?0.25:(reach||isCur?1:0.4)).setStrokeStyle(isCur?4:2, isCur?0xffffff:0x140d18);
    const ch=txt(this,0,0,info.ch,18,'#fff');
    c.add([circle,ch]);
    // 寶箱類型先標示
    if(n.type==='chest' && !n.done){ c.add(txt(this,0,-40,(KIND_ICON[n.lootKind]||'')+' '+n.lootKind,11,'#ffe08a')); }
    if(n.type==='event' && !n.done){ c.add(txt(this,0,-40,'❓ 事件',11,'#9fe8a0')); }
    // 斥候情報：抉擇點風險可視化（遊俠探路，戰鬥/精英/王戰標出風險等級與敵情）
    if(!n.done && (n.type==='battle'||n.type==='elite'||n.type==='relic')){
      const lv = n.type==='relic'?4:(n.type==='elite'?3:Math.max(1,n.risk));
      const words=['','低','中','高','極高'][lv], cols=['','#9adf6a','#ffd24a','#ff9a3a','#ff5a5a'][lv];
      const tag = n.type==='relic'?'👑 首領':(n.type==='elite'?'⚔ 精英(2掉落)':'⚔ 戰鬥');
      c.add(txt(this,0,-42,`${tag}・風險${words}`,11,cols).setAlpha(reach||isCur?1:0.45));
    }
    // 領隊探路：揭露天氣／地形／陷阱（無領隊只見 ❓）
    if(!n.done && n.layer>0){
      if(hasLeader()){ const w=WEATHER_BY_ID[n.weather], t=TERRAIN_BY_ID[n.terrain];
        c.add(txt(this,0,-60,`${w?w.icon:''}${t?t.icon:''}${n.trap?'⚠':''}`,12, n.trap?'#ff9a3a':'#9fd0ff')); }
      else { c.add(txt(this,0,-60,'❓',11,TH.dim)); }
    }
    if(n.risk>0 && !n.done){ for(let k=0;k<n.risk;k++) c.add(this.add.star(-12+k*12,30,4,3,6,0xe7c14a)); }
    // 路程：前往此格的食物消耗（潮汐之冠時不耗）
    if(reach && !isCur){ const free=relicEffects().noFoodDrain, short = !free && RUN.food-n.food<0;
      c.add(txt(this,0,46, free?`路程 ${n.food} 天　🍖−0`:`路程 ${n.food} 天　🍖−${n.food}`, 11, short?TH.red:'#cdeecd')); }
    if(reach && !isCur){
      circle.setInteractive({useHandCursor:true})
        .on('pointerover',()=>this.tweens.add({targets:c,scale:1.15,duration:120}))
        .on('pointerout',()=>this.tweens.add({targets:c,scale:1,duration:120}))
        .on('pointerdown',()=>this.enterNode(n));
      this.tweens.add({targets:circle,alpha:{from:1,to:0.6},duration:600,yoyo:true,repeat:-1});
    }
  }
  enterNode(n){
    RUN.map.current=n.id; RUN.node=n; RUN.cookOpen=false;
    if(!relicEffects().noFoodDrain){ RUN.food-=n.food;   // 潮汐之冠：探索不耗食物
      const tx=TERRAIN_BY_ID[n.terrain]; if(tx&&tx.eff&&tx.eff.foodPlus) RUN.food-=tx.eff.foodPlus; }  // 水域：多耗糧
    if(RUN.food<0){ this.starve(); if(RUN.heroes.every(h=>h.hp<=0)){ RUN.wiped=true; this.scene.start('Result',{outcome:'wipe'}); return; } }
    // 陷阱：有領隊拆除、無則觸發扣血
    if(n.trap){ if(hasLeader()){ RUN.itemToast='🧭 領隊拆除了陷阱'; }
      else { RUN.heroes.forEach(h=>{ if(h.hp>0) h.hp=Math.max(0, h.hp-Math.round(heroStat(h).maxHp*n.trap)); });
        if(RUN.heroes.every(h=>h.hp<=0)){ RUN.wiped=true; this.scene.start('Result',{outcome:'wipe'}); return; }
        RUN.itemToast='⚠ 觸發陷阱！全隊受創'; } }
    if(n.type==='battle'||n.type==='elite'){
      RUN.encounter=buildEncounter(n); RUN.isBoss=false; this.scene.start('Battle');
    } else if(n.type==='relic'){
      RUN.encounter=buildBoss(); RUN.isBoss=true; this.scene.start('Battle');
    } else if(n.type==='event'){
      n.done=true; this.openEvent(n);
    } else if(n.type==='chest'){
      n.done=true; this.openChest(n);
    }
  }
  starve(){
    RUN.heroes.forEach(h=>{ if(h.hp>0) h.hp=Math.max(0, h.hp - Math.round(heroStat(h).maxHp*CFG.starve.damage)); });
  }
  openChest(n){
    const item=rollItem(n.risk, n.lootKind);
    const W=this.scale.width,H=this.scale.height;
    this.add.rectangle(0,0,W,H,0x000000,0.6).setOrigin(0).setDepth(90);
    const box=this.add.container(W/2,H/2).setDepth(91);
    box.add(this.add.rectangle(0,0,420,200,TH.panel).setStrokeStyle(3,0xe7c14a));
    box.add(txt(this,0,-70,'發現寶箱！',20,TH.gold));
    let msg, color=TH.text;
    if(RUN.cargo.length>=RUN.slots){ msg=`貨車已滿，只能忍痛放棄\n${item.icon} ${item.name}`; color=TH.red; }
    else { RUN.cargo.push(item); msg=`獲得 ${item.icon} ${item.name}\n（${item.kind}・價值 ${item.value}）`; color= item.kind==='遺物'?TH.cyan:TH.green; }
    box.add(txt(this,0,-10,msg,16,color));
    const canEquip = item.gear && RUN.cargo.includes(item);
    if(canEquip){
      button(this,0,0,140,36,'收下',()=>this.scene.restart(),{size:15,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(92).setPosition(W/2-85,H/2+70);
      button(this,0,0,170,36,'🎒 立即裝備',()=>{ RUN.equipOpen=true; RUN.equipSel=null; this.scene.restart(); },{size:14,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c}).setDepth(92).setPosition(W/2+85,H/2+70);
    } else {
      button(this,0,0,160,36,'收下，繼續',()=>this.scene.restart(),{size:15,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(92).setPosition(W/2,H/2+70);
    }
  }
  openEvent(n){
    const W=this.scale.width,H=this.scale.height, t=RUN.destTier||1;
    const pool=[
      {title:'🏛 古老祭壇', text:'獻上 2 天份食物，換得本關一件未收集的遺物', btn:'獻祭（-2 糧）',
        cond:()=>RUN.food>2 && RUN.cargo.length<RUN.slots && uncollectedRelicsForDest(RUN.destIndex||0).length>0,
        act:()=>{ RUN.food-=2; const it=rollRelicForDest(RUN.destIndex||0); if(!it) return '祭壇沉寂，無物可得'; RUN.cargo.push(it); return `獻祭成功，獲得 ${it.icon} ${it.name}`; } },
      {title:'⛲ 治療之泉', text:'飲下清泉，全隊回復 40% 體力', btn:'飲用', cond:()=>true,
        act:()=>{ RUN.heroes.forEach(h=>{ if(h.hp>0){ const mx=heroStat(h).maxHp; h.hp=Math.min(mx,h.hp+Math.round(mx*0.4)); } }); return '清泉沁入，全隊回復了體力'; } },
      {title:'🧙 流浪商人', text:'花 ＄80 購入 2 瓶治療藥水', btn:'購買（＄80）', cond:()=>GUILD.funds>=80 && RUN.cargo.length<RUN.slots,
        act:()=>{ GUILD.funds-=80; saveGuild(); let n2=0; for(let i=0;i<2;i++){ if(RUN.cargo.length<RUN.slots){ RUN.cargo.push({kind:'道具',name:'治療藥水',icon:'🧪',value:30}); n2++; } } return `購入治療藥水 ×${n2}`; } },
    ];
    const ev=Phaser.Utils.Array.GetRandom(pool.filter(e=>e.cond())) || pool[1];
    this.add.rectangle(0,0,W,H,0x000000,0.6).setOrigin(0).setDepth(90);
    const box=this.add.container(W/2,H/2).setDepth(91);
    box.add(this.add.rectangle(0,0,440,210,TH.panel).setStrokeStyle(3,0x6fae6f));
    box.add(txt(this,0,-72,ev.title,20,'#9fe8a0'));
    box.add(txt(this,0,-30,ev.text,14,TH.text));
    button(this,0,0,200,40,ev.btn,()=>{ RUN.itemToast=ev.act(); this.scene.restart(); },{size:15,fill:0x3a6b3a,stroke:0x5ad06a,hover:0x4c8c4c}).setDepth(92).setPosition(W/2-100,H/2+58);
    button(this,0,0,140,40,'離開',()=>{ this.scene.restart(); },{size:15,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(92).setPosition(W/2+110,H/2+58);
  }
  openCook(){
    const W=this.scale.width,H=this.scale.height;
    this.add.rectangle(0,0,W,H,0x000000,0.7).setOrigin(0).setDepth(90).setInteractive();
    this.add.rectangle(W/2,H/2,560,430,TH.panel).setStrokeStyle(3,0xd0b05a).setDepth(91);
    txt(this,W/2,H/2-190,'🍳 領隊料理',20,'#ffd24a').setDepth(95);
    txt(this,W/2,H/2-165,'消耗食材換取補血／本趟增益（buff 持續整趟）',12,TH.dim).setDepth(95);
    const ing=INGREDIENTS.filter(g=>ingCount(g.id)>0).map(g=>`${g.icon}${g.name}×${ingCount(g.id)}`).join('　')||'（庫存無食材）';
    txt(this,W/2,H/2-140,'食材庫存：'+ing,12,TH.cyan).setDepth(95);
    const cb=RUN.cookBuff||{atk:0,def:0};
    if(cb.atk||cb.def) txt(this,W/2,H/2-120,`本趟料理加成：ATK+${cb.atk}　DEF+${cb.def}`,11,'#9fe8a0').setDepth(95);
    RECIPES.forEach((r,i)=>{ const y=H/2-90+i*58; const ok=canCook(r);
      this.add.rectangle(W/2,y,520,50,0x241a30).setStrokeStyle(2, ok?0x5ad06a:0x55476b).setDepth(94);
      txt(this,W/2-245,y-10,r.name,15, ok?TH.gold:TH.dim,0).setDepth(95);
      txt(this,W/2-245,y+10,r.desc,11,TH.text,0).setDepth(95);
      button(this,W/2+175,y,150,38, recipeNeedText(r), ()=>{ if(!canCook(r)){ RUN.itemToast='食材不足'; this.scene.restart(); return; } RUN.itemToast=cook(r); this.scene.restart(); },
        {size:11, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}).setDepth(95);
    });
    button(this,W/2,H/2+185,140,36,'關閉',()=>{ RUN.cookOpen=false; this.scene.restart(); },{size:14,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(95);
  }
  retreat(){ this.scene.start('Result',{outcome:'retreat'}); }
}
// 使用消耗品：回復或復活隊伍，並從貨車移除；回傳提示訊息
function useConsumable(item){
  const pct={'治療藥水':0.3,'解毒劑':0.2,'聖水':0.5,'回復卷軸':0.6,'復活之種':0.5}[item.name]||0.3;
  let revived=0, healed=0;
  RUN.heroes.forEach(h=>{ const mx=heroStat(h).maxHp;
    if(h.hp<=0){ if(item.name==='復活之種'){ h.hp=Math.round(mx*0.5); revived++; } }
    else { const before=h.hp; h.hp=Math.min(mx, h.hp+Math.round(mx*pct)); if(h.hp>before) healed++; }
  });
  const i=RUN.cargo.indexOf(item); if(i>=0) RUN.cargo.splice(i,1);
  return `使用 ${item.name}：`+(revived?`復活 ${revived} 人、`:'')+`回復 ${healed} 人`;
}
function rollItem(risk, kind){
  const tier=Math.min(4, Math.max(1,risk) + ((RUN.destTier||1)-1));  // 目的地階級越高，掉落階級越高
  const L=CFG.loot;
  const wantRelic = kind==='遺物' || (!kind && Math.random()<L.relicChanceBase+risk*L.relicChancePerRisk+(relicEffects().drop||0));
  if(wantRelic){ const it=rollRelicForDest(RUN.destIndex||0); if(it) return it; }   // 已收齊則改掉其他戰利品
  if(!kind){ const rr=Math.random();   // 素材／食材：特定關掉特定資源
    if(rr<0.14){ const m=makeMaterialItem(RUN.destIndex||0); if(m) return m; }
    else if(rr<0.24){ const g=makeIngredientItem(RUN.destIndex||0); if(g) return g; }
  }
  const pick = (kind && kind!=='遺物') ? kind : (function(){ const r=Math.random(); return r<0.5?'貴重物品':(r<0.72?'防具':(r<0.88?'武器':'道具')); })();
  if(pick==='貴重物品') return {kind:'貴重物品', name:LOOT.valuable[tier-1]||'寶物', icon:'💎', value:L.valuableBase+tier*L.valuablePerTier};
  if(pick==='防具'){ const a=Phaser.Utils.Array.GetRandom(ARMORS); return {kind:'防具', name:a.name, icon:'🛡', value:L.gearBase+tier*L.gearPerTier, gear:a}; }
  if(pick==='武器'){ const w=Phaser.Utils.Array.GetRandom(WEAPONS); return {kind:'武器', name:w.name, icon:'⚔', value:L.gearBase+tier*L.gearPerTier, gear:w}; }
  return {kind:'道具', name:LOOT.consum[tier-1]||'藥水', icon:'🧪', value:L.consumBase+tier*L.consumPerTier};
}
function equipSwap(item, heroIndex){
  const h=RUN.heroes[heroIndex], slot=item.kind==='武器'?'weapon':'armor', old=h[slot];
  const oldMax=heroStat(h).maxHp;
  h[slot]=item.gear;
  const newMax=heroStat(h).maxHp;
  h.hp=Math.max(1, Math.min(newMax, (h.hp||newMax)+(newMax-oldMax)));
  const ci=RUN.cargo.indexOf(item); if(ci>=0) RUN.cargo.splice(ci,1);
  RUN.cargo.push({kind: slot==='weapon'?'武器':'防具', name:old.name, icon: slot==='weapon'?'⚔':'🛡', value:25, gear:old});
  persistLoadout();   // 途中換裝也跨輪保存
}
// 回傳「波次陣列」：每個元素是一波敵人；清完一波才進下一波
function buildEncounter(n){
  const t=RUN.destTier||1;
  const scale=(1+n.layer*CFG.enemy.layerScale)*(1+(t-1)*CFG.enemy.tierScale);   // 越深、目的地階級越高 → 敵人越強
  const mk=(sprite,name,hp,atkSeq,def,interval,ranged,extra)=>Object.assign(
    {sprite,name,hp:Math.round(hp*scale),atkSeq:atkSeq.map(a=>Math.round(a*scale)),def,interval,ranged,healer:false,heal:0}, extra||{});
  const normalWave=()=>{ const r=Math.random();
    if(r<0.34) return [mk('goblin','哥布林',62,[11,16],2,1400,false), mk('goblinArcher','哥布林弓手',50,[18,22],1,1150,true)];
    if(r<0.67) return [mk('goblin','哥布林',62,[10,14],2,1400,false), mk('goblin','哥布林',62,[10,14],2,1450,false)];
    return [mk('goblin','哥布林斥候',54,[12,16],1,1200,false,{skills:[{name:'偷襲',type:'crit',cd:7000,uses:2,mult:2}]}), mk('goblinArcher','哥布林薩滿',56,[10,12],1,1500,true,{healer:true,heal:10,skills:[{name:'治療波',type:'groupHeal',cd:9000,uses:2}]})];
  };
  const eliteWave=()=>{ const pool=[
      [mk('goblin','哥布林兵',75,[12,16],3,1300,false), mk('goblin','哥布林兵',75,[12,16],3,1350,false), mk('goblinArcher','哥布林弓手',55,[20,24],1,1100,true)],
      [mk('goblin','哥布林狂戰士',95,[16,22],2,1100,false,{skills:[{name:'狂亂',type:'doubleHit',cd:5000,uses:3}]}), mk('goblinArcher','哥布林薩滿',60,[10,12],1,1500,true,{healer:true,heal:12,skills:[{name:'治療波',type:'groupHeal',cd:9000,uses:2}]})],
      [mk('guardian','殘缺石衛',150,[18,24],5,1500,false,{skills:[{name:'重擊',type:'stun',cd:6000,uses:2,dur:1200}]}), mk('goblinArcher','哥布林弓手',55,[20,24],1,1100,true)],
    ]; return Phaser.Utils.Array.GetRandom(pool); };
  if(n.type==='elite'){
    const w=2+(t>=3?1:0); const waves=[]; for(let i=0;i<w;i++) waves.push(eliteWave()); return waves;   // 2-3 波精英
  }
  const w=2+(t>=4?1:0); const waves=[]; for(let i=0;i<w;i++) waves.push(normalWave()); return waves;        // 2-3 波
}
function buildBoss(){
  const t=RUN.destTier||1, s=1+(t-1)*CFG.enemy.bossTierScale;   // 目的地階級越高，王戰越強
  const bosses=[
    [{sprite:'guardian',name:'遺跡守護者',hp:260,atkSeq:[24,14,34],def:6,interval:1500,ranged:false,healer:false,heal:0,boss:true,skills:[{name:'震地',type:'stun',cd:6000,uses:3,dur:1400}]},
     {sprite:'goblinArcher',name:'哥布林弓手',hp:55,atkSeq:[16,18],def:1,interval:1100,ranged:true,healer:false,heal:0}],
    [{sprite:'guardian',name:'墮落守護者',hp:300,atkSeq:[20,26,30],def:7,interval:1400,ranged:false,healer:false,heal:0,boss:true,skills:[{name:'碎地連擊',type:'doubleHit',cd:4500,uses:4},{name:'震地',type:'stun',cd:7000,uses:2,dur:1200}]},
     {sprite:'goblinArcher',name:'哥布林薩滿',hp:70,atkSeq:[12,14],def:2,interval:1400,ranged:true,healer:true,heal:16,skills:[{name:'治療波',type:'groupHeal',cd:8000,uses:3}]}],
  ];
  const boss=Phaser.Utils.Array.GetRandom(bosses).map(e=>Object.assign({},e,{hp:Math.round(e.hp*s), atkSeq:e.atkSeq.map(a=>Math.round(a*s))}));
  const mk=(sprite,name,hp,atkSeq,def,interval,ranged)=>({sprite,name,hp:Math.round(hp*s),atkSeq:atkSeq.map(a=>Math.round(a*s)),def,interval,ranged,healer:false,heal:0});
  const minions=[mk('goblin','遺跡守衛',72,[14,18],3,1250,false), mk('goblinArcher','遺跡哨兵',56,[18,20],1,1100,true)];
  return [minions, boss];   // 第一波小兵 → 第二波王本體
}
