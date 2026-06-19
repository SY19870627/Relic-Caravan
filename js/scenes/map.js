// ========================= 遠征輔助函式（戰鬥場景共用：掉落 / 換裝 / 消耗品 / 遭遇生成）=========================
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
  const prog=(RUN.exped&&RUN.exped.plan&&RUN.exped.plan.length)? Math.min(1, RUN.exped.i/RUN.exped.plan.length) : 0;
  const scale=(1+prog*CFG.enemy.depthScale)*(1+(t-1)*CFG.enemy.tierScale)*partyMul;
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
