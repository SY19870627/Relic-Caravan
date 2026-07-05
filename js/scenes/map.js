// ========================= 遠征輔助函式（戰鬥場景共用：掉落 / 換裝 / 消耗品 / 遭遇生成）=========================
function useConsumable(item){
  const pct={'治療藥水':0.3,'解毒劑':0.2,'聖水':0.5,'回復卷軸':0.6,'復活之種':0.5}[item.name]||0.3;
  let revived=0, healed=0;
  RUN.heroes.forEach(h=>{ const mx=heroStat(h).maxHp;
    if(h.hp<=0){ if(item.name==='復活之種'){ h.hp=Math.round(mx*0.5); revived++; } }
    else { const before=h.hp; h.hp=Math.min(mx, h.hp+Math.round(mx*pct)); if(h.hp>before) healed++; }
  });
  discover(item.name); const i=RUN.cargo.indexOf(item); if(i>=0) RUN.cargo.splice(i,1);
  logItem('use', item, '使用');
  return `使用 ${item.name}：`+(revived?`復活 ${revived} 人、`:'')+`回復 ${healed} 人`;
}
function resourceGainNotice(res,n){ return res ? {t:(res.icon||'')+' '+res.name+' ×'+(n||1), c:'#9fd0ff'} : null; }
function queueResourceGain(res,n){
  const notice=resourceGainNotice(res,n);
  if(notice && RUN && RUN._pendingResourceGains) RUN._pendingResourceGains.push(notice);
  return notice;
}
function rollItem(risk, kind){
  const tier=Math.min(LOOT.consum.length, Math.max(1,risk) + ((RUN.destTier||1)-1));  // 目的地階級越高，掉落階級越高（v2.2 上限隨 LOOT 表擴到 8 階）
  const L=CFG.loot;
  // v2.3：遺物改為「只有擊敗首領才取得」，一般/菁英戰利品與寶箱不再隨機出遺物
  if(!kind || kind==='道具' || kind==='貴重物品'){
    if(Math.random()<0.14) queueResourceGain(gainMaterial(RUN.destIndex||0),1);   // 素材立即入庫（不佔貨格、全滅也不失），再正常給一件戰利品
  }
  const pick = (kind && kind!=='遺物') ? kind : (function(){ const r=Math.random();
    const pv=(L.pickValuable!=null?L.pickValuable:0.32), pa=(L.pickArmor!=null?L.pickArmor:0.28), pw=(L.pickWeapon!=null?L.pickWeapon:0.28);
    return r<pv?'貴重物品':(r<pv+pa?'防具':(r<pv+pa+pw?'武器':'道具')); })();
  if(pick==='貴重物品') return {kind:'貴重物品', name:LOOT.valuable[tier-1]||'寶物', icon:'💎', value:L.valuableBase+tier*L.valuablePerTier};
  if(pick==='防具'){ const a=rollGear('防具'); if(a) return {kind:'防具', name:a.name, icon:'🛡', value:L.gearBase+tier*L.gearPerTier, gear:a};
    return {kind:'貴重物品', name:LOOT.valuable[tier-1]||'寶物', icon:'💎', value:L.valuableBase+tier*L.valuablePerTier}; }
  if(pick==='武器'){ const w=rollGear('武器'); if(w) return {kind:'武器', name:w.name, icon:'⚔', value:L.gearBase+tier*L.gearPerTier, gear:w};
    return {kind:'貴重物品', name:LOOT.valuable[tier-1]||'寶物', icon:'💎', value:L.valuableBase+tier*L.valuablePerTier}; }
  return {kind:'道具', name:LOOT.consum[tier-1]||'藥水', icon:'🧪', value:L.consumBase+tier*L.consumPerTier};
}
function equipSwap(item, heroIndex){
  const h=RUN.heroes[heroIndex], slot=item.kind==='武器'?'weapon':'armor', old=h[slot];
  if(!gearClassOK(h.sprite,item)) return;
  if(old && old.name===item.name){
    const same=RUN.cargo.indexOf(item); if(same>=0) RUN.cargo.splice(same,1);
    if(typeof syncEquippedGearCargo==='function') syncEquippedGearCargo();
    return;
  }
  const oldMax=heroStat(h).maxHp;
  h[slot]=item.gear; ownGear(item.name); discover(old.name);
  const newMax=heroStat(h).maxHp;
  h.hp=Math.max(1, Math.min(newMax, (h.hp||newMax)+(newMax-oldMax)));
  const ci=RUN.cargo.indexOf(item); if(ci>=0) RUN.cargo.splice(ci,1);
  RUN.cargo.push({kind: slot==='weapon'?'武器':'防具', name:old.name, icon: slot==='weapon'?'⚔':'🛡', value:25, gear:old});
  if(typeof syncEquippedGearCargo==='function') syncEquippedGearCargo();}
// 回傳「波次陣列」：每個元素是一波敵人；清完一波才進下一波
// v1.2：敵人改由「怪物組」MONSTER_GROUPS 提供。一場戰鬥＝挑一組（可多波，王戰＝小兵波＋王波），
// 每隻怪的站位固定寫在資料裡；此處只負責「依標籤＋深度挑組」與「數值縮放」。
function scaleEnemy(e, scale, defMul){
  return {sprite:e.sprite, name:e.name, hp:Math.round(e.hp*scale),
    atkSeq:e.atkSeq.map(a=>Math.round(a*scale)), def:Math.round(e.def*(defMul||1)), interval:e.interval,
    ranged:!!e.ranged, healer:!!e.healer, heal:e.heal||0, boss:!!e.boss, skills:e.skills,
    charge:!!e.charge, selfBurn:!!e.selfBurn,   // v4.4 試煉傀儡機制旗標（蓄能/自燃）
    x:e.x, y:e.y, row:e.row};
}
// 探險深度等級（1~3）：越深開放越大的怪物組（淺層只出小組）；高階目的地（神城/虛空）提早一級。
function expedDepthLevel(){
  const ex=RUN.exped; const prog=(ex&&ex.plan&&ex.plan.length)? Math.min(1, ex.i/ex.plan.length) : 0;
  const base = prog<0.34?1 : (prog<0.67?2 : 3);
  return Math.min(3, base + (((RUN.destTier||1)>=3)?1:0));
}
// 依「地城標籤 region＋種類 kind＋等級標籤 tier(≤當前深度)」過濾後隨機挑一組怪物組
function pickGroup(kind){
  const region=RUN.destIndex||0, dl=expedDepthLevel();
  let pool=MONSTER_GROUPS.filter(g=>g.region===region && g.kind===kind && g.tier<=dl);
  if(!pool.length) pool=MONSTER_GROUPS.filter(g=>g.region===region && g.kind===kind);   // 後備：忽略深度
  if(!pool.length) pool=MONSTER_GROUPS.filter(g=>g.kind===kind);                          // 後備：忽略地城
  return pool.length ? Phaser.Utils.Array.GetRandom(pool) : null;
}
function buildEncounter(n){
  const t=RUN.destTier||1, p=Math.max(1, activeRoster().length), partyMul=0.5+0.13*p;   // 敵人強度隨出戰人數縮放
  const prog=(RUN.exped&&RUN.exped.plan&&RUN.exped.plan.length)? Math.min(1, RUN.exped.i/RUN.exped.plan.length) : 0;
  // v4.4 試煉：改用 TRIAL_MOBS 手工波次（不再借用主線怪物組），每職業獨立縮放
  if(RUN&&RUN.trial){
    const sd=TRIAL_DEFS[RUN.trial.sprite].stages[RUN.trial.stage-1];
    const fi=Math.min(RUN.trialFight||0, sd.fights.length-1);
    RUN.trialFight=(RUN.trialFight||0)+1;
    RUN.nodeObjs=sd.objs||null;
    return sd.fights[fi].map(w=>w.map(id=>scaleEnemy(TRIAL_MOBS[id], sd.mul||0.8)));
  }
  // v10.0 模擬實驗室：木樁 or 指定地城怪組（原始基礎值 dm=1，不做深度/人數縮放——與圖鑑數值一致）
  if(RUN&&RUN.sim){
    RUN.nodeObjs=RUN.simObjs||null;
    const s=RUN.sim;
    if(s.foe!=='group'){
      const D={ soft:   {sprite:'dummySpr',    name:'草靶木樁', hp:6000, atkSeq:[1], def:0,  interval:9e9},
                armored:{sprite:'dummyIronSpr',name:'鐵甲木樁', hp:6000, atkSeq:[1], def:30, interval:9e9},
                regen:  {sprite:'dummyHealSpr',name:'回復木樁', hp:6000, atkSeq:[1], def:8,  interval:2200, healer:true, heal:45} }[s.dummy||'soft'];
      return [[Object.assign({ranged:false, heal:0, boss:false, skills:null, x:660, y:330, row:'front'}, D)]];
    }
    const pool=MONSTER_GROUPS.filter(g=>g.region===(s.region||0) && g.kind===(s.kind||'normal'));
    const g=pool.length? Phaser.Utils.Array.GetRandom(pool) : null;
    if(g && g.objs && !RUN.simObjs) RUN.nodeObjs=g.objs;
    return g ? g.waves.map(w=>w.map(e=>scaleEnemy(e,1,1))) : [];
  }
  const dm=((CFG.diff&&CFG.diff.muls)||[0.8,1,1.2])[(RUN.diff!=null)?RUN.diff:1]||1;   // v4.6 世界難度：血/攻/防 全乘
  const scale=(1+prog*CFG.enemy.depthScale)*(1+(t-1)*CFG.enemy.tierScale)*partyMul*dm;
  const g=pickGroup(n.type==='elite'?'elite':'normal');
  RUN.nodeObjs=(g&&g.objs)||null;   // v3.1 怪物組 objs
  return g ? g.waves.map(w=>w.map(e=>scaleEnemy(e,scale,dm))) : [];
}
function buildBoss(){
  const t=RUN.destTier||1, p=Math.max(1, activeRoster().length);
  // v4.4 試煉關主：TRIAL_DEFS 手工波次
  if(RUN&&RUN.trial){
    const sd=TRIAL_DEFS[RUN.trial.sprite].stages[RUN.trial.stage-1];
    RUN.nodeObjs=sd.objs||null;
    return sd.boss.map(w=>w.map(id=>scaleEnemy(TRIAL_MOBS[id], (sd.mul||0.8)*CFG.trial.bossMul)));
  }
  const dm=((CFG.diff&&CFG.diff.muls)||[0.8,1,1.2])[(RUN.diff!=null)?RUN.diff:1]||1;   // v4.6 世界難度
  const s=(1+CFG.enemy.depthScale)*(1+(t-1)*CFG.enemy.bossTierScale)*(0.62+0.13*p)*dm;   // 王＝末段：補上深度縮放，成為真正的最強戰
  const g=pickGroup('boss');
  RUN.nodeObjs=(g&&g.objs)||null;
  return g ? g.waves.map(w=>w.map(e=>scaleEnemy(e,s,dm))) : [];   // 該組自含波次（小兵波→王波）
}
