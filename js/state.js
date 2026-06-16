// ========================= 全域狀態 =========================
let RUN = null;
// 跨輪保存：資金、倉庫、神殿遺物、設施等級
let GUILD = { funds:0, stash:[], relics:[], facilities:{ temple:1, outfit:1 }, wagon:0, wagonUp:[0,0,0], formation:0, mageHired:false };
let ROSTER = [{level:1,xp:0},{level:1,xp:0},{level:1,xp:0},{level:1,xp:0}];  // 跨輪保存：職業等級與經驗（含法師）
function activeRoster(){ return GUILD.mageHired ? [0,1,2,3] : [0,1,2]; }   // 招募法師後變 4 人
let BATTLE_SPEED = 1;   // 戰鬥速度倍率（1/2/4），跨場記住

// ---- 存檔持久化（localStorage，重整不歸零）----
const SAVE_KEY = 'relicCaravanSave_v1';
function saveGuild(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify({GUILD,ROSTER})); }catch(e){} }
function loadGuild(){ try{
  const s=JSON.parse(localStorage.getItem(SAVE_KEY));
  if(s&&s.GUILD){
    GUILD=Object.assign({funds:0,stash:[],relics:[],facilities:{temple:1,outfit:1}}, s.GUILD);
    if(!GUILD.facilities) GUILD.facilities={temple:1,outfit:1};
    if(GUILD.wagon==null) GUILD.wagon=0;
    if(!Array.isArray(GUILD.wagonUp)) GUILD.wagonUp=[0,0,0];
    if(GUILD.formation==null||GUILD.formation>=FORMATIONS.length) GUILD.formation=0;
    if(Array.isArray(s.ROSTER)&&s.ROSTER.length>=3) ROSTER=s.ROSTER;
    while(ROSTER.length<4) ROSTER.push({level:1,xp:0});   // 舊存檔補上法師欄位
    if(GUILD.mageHired==null) GUILD.mageHired=false;
  }
}catch(e){} }
loadGuild();

// ---- 設施：神殿（遺物槽＋祝福）、整備所（補給/貨格上限）----
function templeSlots(){ return 1 + GUILD.facilities.temple; }     // Lv1 = 2 槽
function outfitFoodBonus(){ return GUILD.facilities.outfit - 1; } // 每級 +1 食物
function outfitSlotBonus(){ return GUILD.facilities.outfit - 1; } // 每級 +1 貨格
function templeCost(){ return CFG.cost.temple.base + (GUILD.facilities.temple-1)*CFG.cost.temple.step; }
function outfitCost(){ return CFG.cost.outfit.base + (GUILD.facilities.outfit-1)*CFG.cost.outfit.step; }

// ---- 馬車：選用 + 各車升級（食物/貨格）----
function wagonStats(i){ i=(i==null?(GUILD.wagon||0):i); const wg=WAGONS[i]; const up=(GUILD.wagonUp&&GUILD.wagonUp[i])||0;
  return { idx:i, name:wg.name, desc:wg.desc, up, food: wg.food+outfitFoodBonus()+up, slots: wg.slots+outfitSlotBonus()+up }; }
function wagonUpCost(i){ const up=(GUILD.wagonUp&&GUILD.wagonUp[i])||0; return CFG.cost.wagonUp.base + up*CFG.cost.wagonUp.step; }

// ---- 神殿祝福：供奉價值最高的遺物（數量 = 遺物槽），給全隊場外加成 ----
function enshrinedRelics(){ return [...GUILD.relics].sort((a,b)=>(b.value||0)-(a.value||0)).slice(0, templeSlots()); }
function relicBoonType(r){ return RELIC_BOON[r.name] || 'all'; }
function guildBlessing(){
  const b={atk:0,def:0,hp:0,heal:0,drop:0,food:0};
  const B=CFG.blessing;
  enshrinedRelics().forEach(r=>{ const t=1+Math.floor((r.value||200)/B.valuePerTier); const k=relicBoonType(r);
    if(k==='atk') b.atk+=B.atk*t;
    else if(k==='def') b.def+=B.def*t;
    else if(k==='hp') b.hp+=B.hp*t;
    else if(k==='heal') b.heal+=B.heal*t;
    else if(k==='drop') b.drop+=B.drop*t;
    else if(k==='food') b.food+=B.food*t;
    else { b.atk+=B.allAtk*t; b.def+=B.allDef*t; b.hp+=B.allHp*t; }   // all：通用（原本行為）
  });
  return b;
}
// 神殿祝福摘要字串（只列非零項）
function blessingSummary(bl){
  bl=bl||guildBlessing(); const p=[];
  if(bl.atk)p.push('ATK+'+bl.atk); if(bl.def)p.push('DEF+'+bl.def); if(bl.hp)p.push('HP+'+bl.hp);
  if(bl.heal)p.push('治療+'+bl.heal); if(bl.drop)p.push('遺物率+'+Math.round(bl.drop*100)+'%'); if(bl.food)p.push('食物+'+bl.food);
  return p.length?p.join('　'):'（尚無）';
}

// ---- 聲望與贊助：聲望 = 神殿遺物數，分級發放開局物資 ----
function reputation(){ return GUILD.relics.length; }
function reputationTier(){ const r=reputation(), th=CFG.reputation.thresholds; return r>=th[0]?3:(r>=th[1]?2:(r>=th[2]?1:0)); }
function sponsorship(){ return CFG.reputation.sponsorship[reputationTier()]; }

// ---- 隊員羈絆：成員皆在隊時生效（固定班底恆成立），回傳該 sprite 的加成 ----
function bondBonus(sprite){
  const present = s => HERO_BASE.some(h=>h.sprite===s);
  let atk=0,def=0,hp=0,heal=0;
  BONDS.forEach(b=>{ if(b.members.includes(sprite) && b.members.every(present)){
    atk+=b.atk||0; def+=b.def||0; hp+=b.hp||0; heal+=b.heal||0; } });
  return {atk,def,hp,heal};
}
function activeBonds(){ const present=s=>HERO_BASE.some(h=>h.sprite===s); return BONDS.filter(b=>b.members.every(present)); }

// ---- 隊形：站位（座標＋row）與站位加減成（取代固定羈絆）----
function currentFormation(){ return FORMATIONS[GUILD.formation||0] || FORMATIONS[0]; }
function formationSlot(sprite){ const f=currentFormation(); return (f.slots&&f.slots[sprite]) || {x:200,y:360,row:'back'}; }
function formationMod(sprite){ const s=formationSlot(sprite); return {atk:s.atk||0, def:s.def||0, hp:s.hp||0, heal:s.heal||0}; }

function xpNeed(lv){ return CFG.xp.base + lv*CFG.xp.perLevel; }
function gainXP(amount){
  const ups=[];
  activeRoster().forEach(i=>{ const r=ROSTER[i]; r.xp+=amount; while(r.xp>=xpNeed(r.level)){ r.xp-=xpNeed(r.level); r.level++; ups.push(`${HERO_BASE[i].name} → Lv${r.level}`);
    (SKILLS[HERO_BASE[i].sprite]||[]).filter(s=>s.lv===r.level).forEach(s=>ups.push(`🎓 ${HERO_BASE[i].name} 習得「${s.name}」`)); } });
  return ups;
}
function initRun(){
  RUN = {
    wagon: null,
    heroes: activeRoster().map(idx=>{ const h=HERO_BASE[idx];
      // 還原上次的配裝（跨輪保存）；找不到才用預設起手裝
      const wName=ROSTER[idx]&&ROSTER[idx].weapon, aName=ROSTER[idx]&&ROSTER[idx].armor;
      const weapon = WEAPONS.find(w=>w.name===wName) || WEAPONS[h.defWeapon];
      const armor  = ARMORS.find(a=>a.name===aName) || ARMORS[h.defArmor];
      return {...h, idx, weapon, armor, hp:0};
    }),
    cargo: [], food: 0, slots: 0,
    map: null, encounter:null, isBoss:false,
  };
}
// 保存目前配裝（武器/防具名稱）到 ROSTER，跨輪不重置
function persistLoadout(){ if(!RUN) return; RUN.heroes.forEach(h=>{ if(ROSTER[h.idx]){ ROSTER[h.idx].weapon=h.weapon.name; ROSTER[h.idx].armor=h.armor.name; } }); saveGuild(); }
function heroStat(h){
  const lv=ROSTER[h.idx].level;
  const sk=(SKILLS[h.sprite]||[]).filter(s=>lv>=s.lv);
  let pdef=0, healB=0, patk=0, phpB=0;
  sk.forEach(s=>{ if(s.type==='passiveDef') pdef+=s.def; if(s.type==='healBoost') healB+=s.amt;
    if(s.type==='passiveAtk') patk+=(s.atk||0); if(s.type==='passiveHp') phpB+=(s.hp||0); });
  const bl=guildBlessing();   // 神殿祝福（場外加成）
  const bo=formationMod(h.sprite); // 隊形站位加減成（取代固定羈絆）
  const baseHp=HERO_BASE[h.idx].hp;   // 基礎血量取自職業設定（h.hp 是「當前血量」會變動，不能拿來算上限）
  // 攻防來源：武器/防具 ＋ 被動技能 ＋ 遺物祝福 ＋ 羈絆；角色本身無基礎攻防，純等級只給 HP
  return {
    level:  lv,
    maxHp:  baseHp + h.growthHp*(lv-1) + h.armor.hp + bl.hp + bo.hp + phpB,
    atkSeq: h.weapon.atkSeq.map(a=>a+bl.atk+bo.atk+patk),
    def:    h.armor.def + pdef + bl.def + bo.def,
    heal:   (h.weapon.heal? h.weapon.heal + healB + bo.heal + bl.heal : 0),
    skills: sk,
  };
}
