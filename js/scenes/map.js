// ========================= 地城地圖 =========================
// ========================= 程序生成長征地圖（v0.9，取代分層 genMap）=========================
// 依配額（隨 tier／人數分級）隨機生成連通節點圖；每條邊有食物花費；保證 home↔relic 連通。
function MAP_RECIPE(tier, partySize){
  const t=Math.max(1,tier||1), big=Math.max(1,partySize||1);
  return {
    battle: 2 + t + Math.floor(big/2),
    elite:  Math.max(0, t-1) + (big>=4?1:0),
    chest:  1 + Math.floor(t/2),
    event:  1 + Math.floor(t/2),
    camp:   1 + (big>=3?1:0),
    shopFood: 1, shopItem: 1,
    shopWeapon: t>=2?1:0, shopArmor: t>=2?1:0,
    temple: t>=2?1:0,
  };
}
function edgeFood(map,a,b){ const e=(map&&map.edges||[]).find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a)); return e?e.food:1; }
function genWorld(tier, partySize){
  tier=Math.max(1,tier||1); partySize=Math.max(1,partySize||1);
  const rec=MAP_RECIPE(tier, partySize);
  const pool=[]; Object.keys(rec).forEach(k=>{ for(let i=0;i<rec[k];i++) pool.push(k); });
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const tmp=pool[i]; pool[i]=pool[j]; pool[j]=tmp; }
  const midLayers=Math.max(2, Math.round(pool.length/2));
  const layers=[['home']];
  const mids=[]; for(let l=0;l<midLayers;l++) mids.push([]);
  pool.forEach((tp,i)=>{ mids[i%midLayers].push(tp); });
  mids.forEach(l=>{ if(l.length) layers.push(l); });
  layers.push(['relic']);
  let id=0; const nodes=[];
  layers.forEach((layer,li)=>{ layer.forEach((type,k)=>{
    const node={ id:id++, layer:li, i:k, cnt:layer.length, type, done:false, adj:[], next:[],
      weather: li===0?'clear':Phaser.Utils.Array.GetRandom(WEATHERS).id, food:0 };
    if(type==='battle') node.risk=Math.min(3, 1+Math.floor(li/2));
    else if(type==='elite') node.risk=3;
    else if(type==='relic') node.risk=4;
    else node.risk=0;
    if(type==='chest'){ const lk=Math.random(); node.lootKind = lk<0.6?'武器':'防具'; }
    nodes.push(node);
  }); });
  const byLayer=li=>nodes.filter(n=>n.layer===li);
  const edges=[];
  function link(a,b){ if(!a||!b||a.adj.includes(b.id)) return; const food=1+Math.floor(Math.random()*3); a.adj.push(b.id); b.adj.push(a.id); a.next.push(b.id); edges.push({a:a.id,b:b.id,food}); }
  for(let li=0; li<layers.length-1; li++){
    const cur=byLayer(li), nxt=byLayer(li+1);
    cur.forEach((n,ci)=>{ const j=Math.min(nxt.length-1, Math.floor(ci*nxt.length/Math.max(1,cur.length))); link(n,nxt[j]);
      if(Math.random()<0.5 && nxt[j+1]) link(n,nxt[j+1]); });
    nxt.forEach((m,mi)=>{ if(!cur.some(n=>n.adj.includes(m.id))){ link(cur[Math.min(cur.length-1, Math.floor(mi*cur.length/Math.max(1,nxt.length)))], m); } });
  }
  const home=nodes.find(n=>n.type==='home'), relic=nodes.find(n=>n.type==='relic');
  return { nodes, edges, current:home.id, homeId:home.id, relicId:relic.id, started:false, tier };
}
// ---- 移動／食物／飢餓（可測試的純邏輯，MapScene 呼叫）----
function weatherTravelFood(wid){ const w=WEATHER_BY_ID[wid]; return (w&&w.travelFood)||0; }
function travelCost(map, fromId, toId){ const to=(map.nodes||[]).find(n=>n.id===toId); return edgeFood(map,fromId,toId) + weatherTravelFood(to&&to.weather); }
function starveTick(){ if(typeof RUN==='undefined'||!RUN) return; RUN.heroes.forEach(h=>{ if(h.hp>0) h.hp=Math.max(0, h.hp-Math.round(heroStat(h).maxHp*CFG.starve.damage)); }); }
// 沿邊移動到 toId：扣食物（含天氣；潮汐之冠免）；食物見底每步挨餓扣血、可致死。回傳 {died,cost,node,starved}
function doTravel(toId){
  const map=RUN.map; const free=relicEffects().noFoodDrain;
  const cost=free?0:travelCost(map, map.current, toId);
  RUN.food-=cost; let starved=false, died=false;
  if(RUN.food<0){ RUN.food=0; starveTick(); starved=true; if(RUN.heroes.every(h=>h.hp<=0)) died=true; }
  map.current=toId; if(!RUN.visited)RUN.visited={}; RUN.visited[toId]=true;
  const node=(map.nodes||[]).find(n=>n.id===toId); RUN.node=node;
  return {died, cost, node, starved};
}
class MapScene extends Phaser.Scene {
  constructor(){ super('Map'); }
  create(){
    const W=this.scale.width, H=this.scale.height;
    sceneBg(this,{glow:0xf0975a});
    sceneHeader(this,'地 城 路 線', RUN.destName? (RUN.destName+'　'+'★'.repeat(RUN.destTier||1)) : '', {accent:'ember'});

    this.drawHUD();
    this.nodePos={};
    const m=RUN.map;
    const layCount=Math.max(...m.nodes.map(n=>n.layer))+1;
    m.nodes.forEach(n=>{
      const x=80+n.layer*((W-160)/Math.max(1,(layCount-1)));
      const y=n.cnt===1?300:(180+n.i*(260/Math.max(1,(n.cnt-1))));
      this.nodePos[n.id]={x,y};
    });
    const cur=m.nodes.find(n=>n.id===m.current);
    const reachable=(cur.adj||cur.next||[]);
    // 連線（雙向）＋ 每段食物花費
    const gfx=this.add.graphics();
    const free=relicEffects().noFoodDrain;
    (m.edges||[]).forEach(e=>{ const a=this.nodePos[e.a], b=this.nodePos[e.b]; if(!a||!b) return;
      const onPath=(e.a===m.current||e.b===m.current);
      gfx.lineStyle(onPath?4:3, onPath?0x6a5a3a:0x33304a, 1).beginPath(); gfx.moveTo(a.x,a.y); gfx.lineTo(b.x,b.y); gfx.strokePath();
      txt(this,(a.x+b.x)/2,(a.y+b.y)/2-2, free?'🍖0':('🍖'+e.food), 10.5, onPath?'#ffcf9a':TH.dim).setDepth(5); });
    // 節點（current 的鄰居皆可前往；已清節點＝安全通過）
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
    button(this, 100, H-34, 150, 36, '🎒 角色／裝備', ()=>this.scene.start('CharacterHall',{from:'Map'}), {size:13,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    button(this, 268, H-34, 116, 36, '⚔ 隊形', ()=>this.scene.start('FormationHall',{from:'Map'}), {size:13,fill:0x4a3f63,stroke:0x9a7fd0,hover:0x6a5d8a});
    if(hasLeader()||hasCampstove()) button(this, 400, H-34, 116, 36, '🍳 料理', ()=>{ RUN.cookOpen=true; this.scene.restart(); }, {size:12,fill:0x6b5a3a,stroke:0xd0b05a,hover:0x8c7a4c});
    // 工匠・商隊帳房（ledger）：途中變賣貴重物品換 💰
    if(hasLedger()){ const nVal=RUN.cargo.filter(it=>it.kind==='貴重物品').length;
      button(this, 532, H-34, 140, 36, `💰 帳房變賣(${nVal})`, ()=>{ const v=RUN.cargo.filter(it=>it.kind==='貴重物品');
        if(!v.length){ RUN.itemToast='沒有可變賣的貴重物品'; this.scene.restart(); return; }
        let g=0; v.forEach(it=>{ g+=Math.round(it.value*CFG.merchant.sellRate); const i=RUN.cargo.indexOf(it); if(i>=0)RUN.cargo.splice(i,1); });
        addGold(g); RUN.itemToast=`帳房變賣 ${v.length} 件，得 💰${g}`; this.scene.restart(); },
        {size:11,fill:0x6b5a3a,stroke:0xd0b05a,hover:0x8c7a4c}); }
    if(!m.started){ m.started=true; }
    if(RUN.pendingReward){ const pr=RUN.pendingReward; RUN.pendingReward=null; this.showReward(pr); }
    else if(RUN.pendingLevelups && RUN.pendingLevelups.length){ this.openLevelup(); }
    if(RUN.equipOpen){ this.openEquip(RUN.equipSel); }
    if(RUN.cookOpen){ this.openCook(); }
  }
  // v0.9 升級三選一：2 新技能＋1 強化已裝；技能槽滿 2 時先選替換
  openLevelup(){
    const W=this.scale.width,H=this.scale.height;
    const idx=RUN.pendingLevelups[0];
    if(idx==null){ RUN.pendingLevelups.shift(); this.scene.restart(); return; }
    if(!RUN._lvChoices) RUN._lvChoices=rollLevelChoices(idx);
    const choices=RUN._lvChoices, hero=HERO_BASE[idx];
    this.add.rectangle(0,0,W,H,0x000000,0.72).setOrigin(0).setDepth(90).setInteractive();
    panel(this,W/2,H/2,560,380,{accent:'gold'}).setDepth(91);
    txt(this,W/2,H/2-162,'⬆ '+hero.name+' 升級！',22,TH.gold).setDepth(95);
    const cur=((ROSTER[idx]&&ROSTER[idx].skills)||[]).join('、')||'（尚無技能）';
    txt(this,W/2,H/2-134,'目前技能：'+cur+'（最多 2 個）',12,TH.cyan).setDepth(95);
    if(RUN._lvReplace){
      txt(this,W/2,H/2-100,'技能槽已滿，選擇替換掉哪一個：',14,'#ffd24a').setDepth(95);
      ((ROSTER[idx]&&ROSTER[idx].skills)||[]).forEach((nm,i)=>{
        button(this,W/2,H/2-50+i*60,420,46,'替換掉：'+nm,()=>{ applyLevelChoice(idx,RUN._lvReplace,nm); this._finishLevelup(); },
          {size:15,fill:0x6b3a3a,stroke:0xd05a5a,hover:0x8c4c4c}).setDepth(95);
      });
      button(this,W/2,H/2+130,150,34,'取消',()=>{ RUN._lvReplace=null; this.scene.restart(); },{size:13,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(95);
      return;
    }
    choices.forEach((c,i)=>{ const y=H/2-78+i*74;
      button(this,W/2,y,470,44,c.label,()=>{
        const eq=(ROSTER[idx]&&ROSTER[idx].skills)||[];
        if(c.type==='newSkill' && eq.length>=2 && !eq.includes(c.name)){ RUN._lvReplace=c; this.scene.restart(); return; }
        applyLevelChoice(idx,c); this._finishLevelup();
      },{size:15, fill:c.type==='upgrade'?0x4a3f63:0x3a5f3a, stroke:c.type==='upgrade'?0x9a7fd0:0x5ad06a, hover:c.type==='upgrade'?0x6a5d8a:0x4c8c4c}).setDepth(95);
      txt(this,W/2,y+26,c.desc||'',10.5,TH.dim).setDepth(96).setWordWrapWidth(440);
    });
    if(RUN.pendingLevelups.length>1) txt(this,W/2,H/2+150,'尚有 '+(RUN.pendingLevelups.length-1)+' 次升級待選',11,TH.dim).setDepth(95);
  }
  _finishLevelup(){ RUN.pendingLevelups.shift(); RUN._lvChoices=null; RUN._lvReplace=null; this.scene.restart(); }
  showReward(pr){
    const W=this.scale.width,H=this.scale.height;
    this.add.rectangle(0,0,W,H,0x000000,0.6).setOrigin(0).setDepth(90);
    panel(this,W/2,H/2,440,300,{accent:'green'}).setDepth(91);
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
      button(this,W/2+90,by,160,34,'🎒 立即裝備',()=>this.scene.start('CharacterHall',{from:'Map'}),{size:13,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c}).setDepth(92);
    } else {
      button(this,W/2,by,150,34,'收下',()=>this.scene.restart(),{size:14,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(92);
    }
  }
  openEquip(sel){
    const W=this.scale.width,H=this.scale.height;
    const cargoGear=RUN.cargo.filter(it=>it.kind==='武器'||it.kind==='防具');
    if(sel!=null && sel>=cargoGear.length) sel=null;
    this.add.rectangle(0,0,W,H,0x000000,0.7).setOrigin(0).setDepth(90).setInteractive();
    panel(this,W/2,H/2,780,470,{accent:'blue'}).setDepth(91);
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
        const item=cargoGear[sel], req=(item.gear&&item.gear.lvReq)||1, clsOK=gearClassOK(h.sprite,item), ok=s.level>=req&&clsOK;
        if(ok){
          cont.add(txt(this,0,54,`▶ 換上此${item.kind}`,13,'#5ad06a'));
          bg.setInteractive({useHandCursor:true}).on('pointerdown',()=>{ equipSwap(item,i); RUN.equipSel=null; this.scene.restart(); });
        } else {
          bg.setStrokeStyle(2,0x6b3a3a);
          cont.add(txt(this,0,54, clsOK?`職業等級不足，需 Lv${req}`:`${h.name} 無法裝備此${item.kind}`,12,TH.red));
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
    const g=this.add.graphics(); g.fillStyle(UI.panelN,0.92); g.fillRoundedRect(10,52,W-20,38,10); g.lineStyle(1.5,UI.lineN,0.7); g.strokeRoundedRect(10,52,W-20,38,10);
    chip(this,22,71,{label:'食物 '+RUN.food, accent: RUN.food<=1?'red':'green', icon:'flame', size:12, h:26});
    chip(this,128,71,{label:'貨格 '+RUN.cargo.length+'/'+RUN.slots, accent: RUN.cargo.length>=RUN.slots?'red':'teal', icon:'box', size:12, h:26});
    chip(this,238,71,{label:'💰 '+(RUN.gold||0), accent:'gold', icon:'coin', size:12, h:26});
    let x=336; const step=RUN.heroes.length>=5?112:140;
    RUN.heroes.forEach(h=>{ const s=heroStat(h); const dead=h.hp<=0;
      icon(this,x,71,'heart',13, dead?UI.redN:UI.greenN);
      txt(this,x+12,71,h.name+' '+Math.max(0,Math.round(h.hp))+'/'+s.maxHp,11, dead?UI.red:UI.text,0); x+=step; });
  }
  drawNode(n, reach, isCur){
    const p=this.nodePos[n.id], info=NODE_INFO[n.type]||{ch:'？',col:0x6a6a7a};
    const c=this.add.container(p.x,p.y);
    const circle=this.add.circle(0,0,22, info.col, n.done?0.3:(reach||isCur?1:0.45)).setStrokeStyle(isCur?4:2, isCur?0xffffff:0x140d18);
    c.add([circle, txt(this,0,0,info.ch,16,'#fff')]);
    if(n.type==='home'){ c.add(txt(this,0,-38,'🏠 基地',10.5,'#9fe8ff')); }
    if(n.type==='chest' && !n.done){ c.add(txt(this,0,-38,(KIND_ICON[n.lootKind]||'🎁')+' '+(n.lootKind||'寶箱'),10.5,'#ffe08a')); }
    if(n.type==='event' && !n.done){ c.add(txt(this,0,-38,'❓ 事件',10.5,'#9fe8a0')); }
    if(n.type==='camp' && !n.done){ c.add(txt(this,0,-38,'🔥 營火',10.5,'#ffcf9a')); }
    if(!n.done && (n.type==='battle'||n.type==='elite'||n.type==='relic')){
      const lv = n.type==='relic'?4:(n.type==='elite'?3:Math.max(1,n.risk));
      const words=['','低','中','高','極高'][lv], cols=['','#9adf6a','#ffd24a','#ff9a3a','#ff5a5a'][lv];
      const tag = n.type==='relic'?'👑 守衛戰':(n.type==='elite'?'☠ 精英':'⚔ 戰鬥');
      c.add(txt(this,0,-40,`${tag}・風險${words}`,10.5,cols).setAlpha(reach||isCur?1:0.5));
    }
    if(n.risk>0 && !n.done){ for(let k=0;k<n.risk;k++) c.add(this.add.star(-12+k*12,28,4,3,6,0xe7c14a)); }
    if(n.done&&!isCur){ c.add(txt(this,0,30,'已清',10,TH.dim)); }
    if(reach && !isCur){
      circle.setInteractive({useHandCursor:true})
        .on('pointerover',()=>this.tweens.add({targets:c,scale:1.15,duration:120}))
        .on('pointerout',()=>this.tweens.add({targets:c,scale:1,duration:120}))
        .on('pointerdown',()=>this.enterNode(n));
      this.tweens.add({targets:circle,alpha:{from:1,to:0.6},duration:600,yoyo:true,repeat:-1});
    }
  }
  enterNode(n){
    RUN.cookOpen=false;
    if(n.id===RUN.map.current) return;
    const res=doTravel(n.id);
    if(res.starved) RUN.itemToast='⚠ 斷糧！全隊挨餓 −'+Math.round(CFG.starve.damage*100)+'% HP';
    if(res.died){ RUN.wiped=true; this.scene.start('Result',{outcome:'wipe'}); return; }
    if(n.type==='home'){ this.scene.start('Result',{outcome:'retreat'}); return; }
    if(n.done){ this.scene.restart(); return; }   // 已清節點：安全通過
    if(n.type==='battle'||n.type==='elite'){ RUN.encounter=buildEncounter(n); RUN.isBoss=false; this.scene.start('Battle'); }
    else if(n.type==='relic'){ RUN.encounter=buildBoss(); RUN.isBoss=true; this.scene.start('Battle'); }
    else if(n.type==='event'){ n.done=true; this.openEvent(n); }
    else if(n.type==='chest'){ n.done=true; this.openChest(n); }
    else if(n.type==='camp'){ n.done=true; this.openCamp(n); }
    else if(n.type==='shopFood'||n.type==='shopItem'||n.type==='shopWeapon'||n.type==='shopArmor'){ this.openShop(n); }
    else if(n.type==='temple'){ this.openTemple(n); }
    else { n.done=true; this.scene.restart(); }
  }
  openCamp(n){
    RUN.heroes.forEach(h=>{ if(h.hp>0){ const mx=heroStat(h).maxHp; h.hp=Math.min(mx, h.hp+Math.round(mx*0.5)); } });
    RUN.itemToast='🔥 營火休息：存活成員回復 50% HP'; this.scene.restart();
  }
  openShop(n){
    const W=this.scale.width,H=this.scale.height;
    this.add.rectangle(0,0,W,H,0x000000,0.7).setOrigin(0).setDepth(90).setInteractive();
    panel(this,W/2,H/2,660,420,{accent:'gold'}).setDepth(91);
    const names={shopFood:'🥩 食物商',shopItem:'🧪 道具商',shopWeapon:'⚔ 武器商',shopArmor:'🛡 防具商'};
    txt(this,W/2,H/2-188,names[n.type]||'商店',20,TH.gold).setDepth(95);
    txt(this,W/2,H/2-162,'💰 '+RUN.gold+'　（賣出回收 ×'+CFG.gold.sellRate+'）',13,'#ffe08a').setDepth(95);
    let by=H/2-122;
    const buyBtn=(label,cost,fn)=>{ const ok=RUN.gold>=cost;
      button(this,W/2-160,by,300,40,label+'（💰'+cost+'）',()=>{ if(RUN.gold<cost){ RUN.itemToast='💰 不足'; this.scene.restart(); return; } spendGold(cost); fn(); this.scene.restart(); },
        {size:13,fill:ok?0x3a5f3a:0x33323a,stroke:ok?0x5ad06a:0x55555f,hover:ok?0x4c8c4c:0x33323a}).setDepth(95); by+=48; };
    if(n.type==='shopFood'){ buyBtn('補給食物 +3',18,()=>{ RUN.food+=3; }); buyBtn('補給食物 +6',32,()=>{ RUN.food+=6; }); }
    else if(n.type==='shopItem'){ buyBtn('治療藥水（回 30%）',20,()=>{ if(RUN.cargo.length<RUN.slots){ RUN.cargo.push({kind:'道具',name:'治療藥水',icon:'🧪',value:30}); discover('治療藥水'); } }); buyBtn('聖水（回 50%）',40,()=>{ if(RUN.cargo.length<RUN.slots){ RUN.cargo.push({kind:'道具',name:'聖水',icon:'🧪',value:60}); discover('聖水'); } }); }
    else { const isW=n.type==='shopWeapon'; const pool=(isW?WEAPONS:ARMORS).filter(x=>!x.starter);
      buyBtn('購入一件'+(isW?'武器':'防具'),45,()=>{ if(RUN.cargo.length<RUN.slots && pool.length){ const it=Phaser.Utils.Array.GetRandom(pool); RUN.cargo.push({kind:isW?'武器':'防具',name:it.name,icon:isW?'⚔':'🛡',value:60,gear:it}); discover(it.name); } }); }
    txt(this,W/2+180,H/2-128,'出售貨車物品換 💰',12,TH.cyan).setDepth(95);
    const sellable=RUN.cargo.filter(it=>it.kind==='貴重物品'||it.kind==='道具'||it.kind==='武器'||it.kind==='防具');
    if(!sellable.length) txt(this,W/2+180,H/2-94,'（無可賣物品）',11,TH.dim).setDepth(95);
    sellable.slice(0,7).forEach((it,i)=>{ const price=Math.max(1,Math.round((it.value||10)*CFG.gold.sellRate));
      button(this,W/2+180,H/2-96+i*38,280,32, '賣 '+(it.icon||'')+it.name+' +💰'+price, ()=>{ addGold(price); const idx=RUN.cargo.indexOf(it); if(idx>=0)RUN.cargo.splice(idx,1); this.scene.restart(); },
        {size:11,fill:0x6b5a3a,stroke:0xd0b05a,hover:0x8c7a4c}).setDepth(95); });
    button(this,W/2-160,H/2+182,150,36,'離開商店',()=>{ this.scene.restart(); },{size:14,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(95);
  }
  openTemple(n){
    const W=this.scale.width,H=this.scale.height;
    this.add.rectangle(0,0,W,H,0x000000,0.72).setOrigin(0).setDepth(90).setInteractive();
    panel(this,W/2,H/2,500,320,{accent:'violet'}).setDepth(91);
    txt(this,W/2,H/2-128,'⛪ 神殿',20,'#c9a0ff').setDepth(95);
    txt(this,W/2,H/2-102,'💰 '+RUN.gold,13,'#ffe08a').setDepth(95);
    const pray=(label,cost,fn)=>{ const ok=RUN.gold>=cost; button(this,W/2,this._py=(this._py||H/2-60),320,44,label+'（💰'+cost+'）',()=>{ if(RUN.gold<cost){ RUN.itemToast='💰 不足'; this.scene.restart(); return; } spendGold(cost); fn(); this.scene.restart(); },{size:14,fill:ok?0x4a3f63:0x33323a,stroke:ok?0x9a7fd0:0x55555f}).setDepth(95); this._py+=56; };
    this._py=H/2-60;
    pray('祈禱轉晴（全圖未訪天氣放晴）',30,()=>{ (RUN.map.nodes||[]).forEach(nd=>{ if(!nd.done) nd.weather='clear'; }); RUN.itemToast='⛪ 天氣放晴了'; });
    pray('祈福（存活成員回 25% HP）',25,()=>{ RUN.heroes.forEach(h=>{ if(h.hp>0){ const mx=heroStat(h).maxHp; h.hp=Math.min(mx,h.hp+Math.round(mx*0.25)); } }); RUN.itemToast='⛪ 神恩沐浴全隊'; });
    button(this,W/2,H/2+120,150,36,'離開',()=>{ this.scene.restart(); },{size:14,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(95);
  }
  starve(){
    RUN.heroes.forEach(h=>{ if(h.hp>0) h.hp=Math.max(0, h.hp - Math.round(heroStat(h).maxHp*CFG.starve.damage)); });
  }
  openChest(n){
    const item=rollItem(n.risk, n.lootKind);
    const W=this.scale.width,H=this.scale.height;
    this.add.rectangle(0,0,W,H,0x000000,0.6).setOrigin(0).setDepth(90);
    const box=this.add.container(W/2,H/2).setDepth(91);
    box.add(panel(this,0,0,420,200,{accent:'gold'}));
    box.add(txt(this,0,-70,'發現寶箱！',20,TH.gold));
    let msg, color=TH.text;
    if(RUN.cargo.length>=RUN.slots){ msg=`貨車已滿，只能忍痛放棄\n${item.icon} ${item.name}`; color=TH.red; }
    else { RUN.cargo.push(item); discover(item.name); if(item.gear) ownGear(item.name); msg=`獲得 ${item.icon} ${item.name}\n（${item.kind}・價值 ${item.value}）`; color= item.kind==='遺物'?TH.cyan:TH.green; }
    box.add(txt(this,0,-10,msg,16,color));
    const canEquip = item.gear && RUN.cargo.includes(item);
    if(canEquip){
      button(this,0,0,140,36,'收下',()=>this.scene.restart(),{size:15,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(92).setPosition(W/2-85,H/2+70);
      button(this,0,0,170,36,'🎒 立即裝備',()=>this.scene.start('CharacterHall',{from:'Map'}),{size:14,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c}).setDepth(92).setPosition(W/2+85,H/2+70);
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
      {title:'🧙 流浪商人', text:'花 💰80 購入 2 瓶治療藥水', btn:'購買（💰80）', cond:()=>(RUN.gold||0)>=80 && RUN.cargo.length<RUN.slots,
        act:()=>{ spendGold(80); let n2=0; for(let i=0;i<2;i++){ if(RUN.cargo.length<RUN.slots){ RUN.cargo.push({kind:'道具',name:'治療藥水',icon:'🧪',value:30}); discover('治療藥水'); n2++; } } return `購入治療藥水 ×${n2}`; } },
    ];
    const ev=Phaser.Utils.Array.GetRandom(pool.filter(e=>e.cond())) || pool[1];
    this.add.rectangle(0,0,W,H,0x000000,0.6).setOrigin(0).setDepth(90);
    const box=this.add.container(W/2,H/2).setDepth(91);
    box.add(panel(this,0,0,440,210,{accent:'green'}));
    box.add(txt(this,0,-72,ev.title,20,'#9fe8a0'));
    box.add(txt(this,0,-30,ev.text,14,TH.text));
    button(this,0,0,200,40,ev.btn,()=>{ RUN.itemToast=ev.act(); this.scene.restart(); },{size:15,fill:0x3a6b3a,stroke:0x5ad06a,hover:0x4c8c4c}).setDepth(92).setPosition(W/2-100,H/2+58);
    button(this,0,0,140,40,'離開',()=>{ this.scene.restart(); },{size:15,fill:0x4a3f63,stroke:0x7a6f93}).setDepth(92).setPosition(W/2+110,H/2+58);
  }
  openCook(){
    const W=this.scale.width,H=this.scale.height;
    this.add.rectangle(0,0,W,H,0x000000,0.7).setOrigin(0).setDepth(90).setInteractive();
    panel(this,W/2,H/2,560,430,{accent:'gold'}).setDepth(91);
    txt(this,W/2,H/2-190,'🍳 料理',20,'#ffd24a').setDepth(95);
    txt(this,W/2,H/2-165,'消耗食材換取補血或一次性功能（下一場戰鬥生效）',12,TH.dim).setDepth(95);
    const ing=INGREDIENTS.filter(g=>cargoIngCount(g.id)>0).map(g=>`${g.icon}${g.name}×${cargoIngCount(g.id)}`).join('　')||'（貨車無食材）';
    txt(this,W/2,H/2-140,'隨身食材：'+ing,12,TH.cyan).setDepth(95);
    const pend=[]; if(RUN.cookShield)pend.push('開場護盾+'+RUN.cookShield); if(RUN.reviveCharge)pend.push('復活充能×'+RUN.reviveCharge); if(RUN.cookFirstCrit)pend.push('首擊必暴');
    if(pend.length) txt(this,W/2,H/2-120,'下場待生效：'+pend.join('　'),11,'#9fe8a0').setDepth(95);
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
  discover(item.name); const i=RUN.cargo.indexOf(item); if(i>=0) RUN.cargo.splice(i,1);
  return `使用 ${item.name}：`+(revived?`復活 ${revived} 人、`:'')+`回復 ${healed} 人`;
}
function rollItem(risk, kind){
  const tier=Math.min(4, Math.max(1,risk) + ((RUN.destTier||1)-1));  // 目的地階級越高，掉落階級越高
  const L=CFG.loot;
  const wantRelic = kind==='遺物' || (!kind && Math.random()<L.relicChanceBase+risk*L.relicChancePerRisk+(relicEffects().drop||0));
  if(wantRelic){ const it=rollRelicForDest(RUN.destIndex||0); if(it) return it; }   // 已收齊則改掉其他戰利品
  if(!kind || kind==='道具' || kind==='貴重物品'){ const rr=Math.random();   // 素材／食材也可從一般戰/菁英掉，供強化與料理
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
  if(!gearClassOK(h.sprite,item)) return;
  const oldMax=heroStat(h).maxHp;
  h[slot]=item.gear; ownGear(item.name); discover(old.name);
  const newMax=heroStat(h).maxHp;
  h.hp=Math.max(1, Math.min(newMax, (h.hp||newMax)+(newMax-oldMax)));
  const ci=RUN.cargo.indexOf(item); if(ci>=0) RUN.cargo.splice(ci,1);
  RUN.cargo.push({kind: slot==='weapon'?'武器':'防具', name:old.name, icon: slot==='weapon'?'⚔':'🛡', value:25, gear:old});}
// 回傳「波次陣列」：每個元素是一波敵人；清完一波才進下一波
function buildEncounter(n){
  const t=RUN.destTier||1;
  const p=Math.max(1, activeRoster().length);
  const partyMul=0.5+0.13*p;   // v0.9：敵人強度隨出戰人數縮放（solo≈0.63、5人≈1.15），讓 1 人開局可玩
  const scale=(1+n.layer*CFG.enemy.layerScale)*(1+(t-1)*CFG.enemy.tierScale)*partyMul;
  const mk=(sprite,name,hp,atkSeq,def,interval,ranged,extra)=>Object.assign(
    {sprite,name,hp:Math.round(hp*scale),atkSeq:atkSeq.map(a=>Math.round(a*scale)),def,interval,ranged,healer:false,heal:0}, extra||{});
  const normalWave=()=>{ const r=Math.random();
    if(r<0.34) return [mk('goblin','哥布林',62,[11,16],2,1400,false), mk('goblinArcher','哥布林弓手',50,[16,20],1,1150,true)];
    if(r<0.67) return [mk('goblin','哥布林',62,[10,14],2,1400,false), mk('goblin','哥布林',62,[10,14],2,1450,false)];
    return [mk('goblin','哥布林斥候',54,[12,16],1,1200,false,{skills:[{name:'偷襲',type:'crit',cd:7000,uses:2,mult:2}]}), mk('goblinArcher','哥布林薩滿',56,[10,12],1,1500,true,{healer:true,heal:10,skills:[{name:'治療波',type:'groupHeal',cd:9000,uses:2}]})];
  };
  const eliteWave=()=>{ const pool=[
      [mk('goblin','哥布林兵',68,[12,16],3,1300,false), mk('goblin','哥布林兵',68,[12,16],3,1350,false), mk('goblinArcher','哥布林弓手',55,[20,24],1,1100,true)],
      [mk('goblin','哥布林狂戰士',86,[15,20],2,1100,false,{skills:[{name:'狂亂',type:'doubleHit',cd:5000,uses:3}]}), mk('goblinArcher','哥布林薩滿',60,[10,12],1,1500,true,{healer:true,heal:12,skills:[{name:'治療波',type:'groupHeal',cd:9000,uses:2}]})],
      [mk('guardian','殘缺石衛',124,[16,21],4,1500,false,{skills:[{name:'重擊',type:'stun',cd:6000,uses:2,dur:1200}]}), mk('goblinArcher','哥布林弓手',55,[20,24],1,1100,true)],
    ]; return Phaser.Utils.Array.GetRandom(pool); };
  if(n.type==='elite'){
    const w=(p<=2?1:2)+(t>=3?1:0); const waves=[]; for(let i=0;i<w;i++) waves.push(eliteWave()); return waves;   // 小隊伍少一波
  }
  const w=(p<=2?1:2)+(t>=4?1:0); const waves=[]; for(let i=0;i<w;i++) waves.push(normalWave()); return waves;        // 小隊伍少一波
}
function buildBoss(){
  const t=RUN.destTier||1, p=Math.max(1, activeRoster().length), s=(1+(t-1)*CFG.enemy.bossTierScale)*(0.55+0.12*p);   // 王戰也隨人數縮放
  const bosses=[
    [{sprite:'guardian',name:'遺跡守護者',hp:360,atkSeq:[30,18,42],def:6,interval:1350,ranged:false,healer:false,heal:0,boss:true,skills:[{name:'震地',type:'stun',cd:6000,uses:3,dur:1400}]},
     {sprite:'goblinArcher',name:'哥布林弓手',hp:64,atkSeq:[16,18],def:1,interval:1100,ranged:true,healer:false,heal:0}],
    [{sprite:'guardian',name:'墮落守護者',hp:410,atkSeq:[26,32,38],def:7,interval:1300,ranged:false,healer:false,heal:0,boss:true,skills:[{name:'碎地連擊',type:'doubleHit',cd:4500,uses:4},{name:'震地',type:'stun',cd:7000,uses:2,dur:1200}]},
     {sprite:'goblinArcher',name:'哥布林薩滿',hp:80,atkSeq:[12,14],def:2,interval:1400,ranged:true,healer:true,heal:16,skills:[{name:'治療波',type:'groupHeal',cd:8000,uses:3}]}],
  ];
  const boss=Phaser.Utils.Array.GetRandom(bosses).map(e=>Object.assign({},e,{hp:Math.round(e.hp*s), atkSeq:e.atkSeq.map(a=>Math.round(a*s))}));
  const mk=(sprite,name,hp,atkSeq,def,interval,ranged)=>({sprite,name,hp:Math.round(hp*s),atkSeq:atkSeq.map(a=>Math.round(a*s)),def,interval,ranged,healer:false,heal:0});
  const minions=[mk('goblin','遺跡守衛',90,[16,20],3,1250,false), mk('goblinArcher','遺跡哨兵',64,[18,20],1,1100,true)];
  return [minions, boss];   // 第一波小兵 → 第二波王本體
}
