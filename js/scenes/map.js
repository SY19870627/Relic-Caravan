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
// v1.2：敵人改由「怪物組」MONSTER_GROUPS 提供。一場戰鬥＝挑一組（可多波，王戰＝小兵波＋王波），
// 每隻怪的站位固定寫在資料裡；此處只負責「依標籤＋深度挑組」與「數值縮放」。
function scaleEnemy(e, scale){
  return {sprite:e.sprite, name:e.name, hp:Math.round(e.hp*scale),
    atkSeq:e.atkSeq.map(a=>Math.round(a*scale)), def:e.def, interval:e.interval,
    ranged:!!e.ranged, healer:!!e.healer, heal:e.heal||0, boss:!!e.boss, skills:e.skills,
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
  const scale=(1+prog*CFG.enemy.depthScale)*(1+(t-1)*CFG.enemy.tierScale)*partyMul;
  const g=pickGroup(n.type==='elite'?'elite':'normal');
  return g ? g.waves.map(w=>w.map(e=>scaleEnemy(e,scale))) : [];
}
function buildBoss(){
  const t=RUN.destTier||1, p=Math.max(1, activeRoster().length), s=(1+(t-1)*CFG.enemy.bossTierScale)*(0.55+0.12*p);   // 王戰也隨人數縮放
  const g=pickGroup('boss');
  return g ? g.waves.map(w=>w.map(e=>scaleEnemy(e,s))) : [];   // 該組自含波次（小兵波→王波）
}
