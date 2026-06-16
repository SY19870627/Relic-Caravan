// ========================= 全域狀態 =========================
let RUN = null;

// 職業槽索引（對應 HERO_BASE 順序）：戰士0 遊俠1 牧師2 法師3 盜賊4
const SPRITE_INDEX = {}; HERO_BASE.forEach((h,i)=>{ SPRITE_INDEX[h.sprite]=i; });
const CLASS_ORDER = HERO_BASE.map(h=>h.sprite);   // ['warrior','ranger','priest','mage','rogue']

// 跨輪保存的公會狀態
function defaultGuild(){ return {
  funds:0, stash:[], relics:[],
  facilities:{ temple:1, outfit:1 },
  wagon:0, wagonUp:[0,0,0], formation:0,
  horse:1,                       // 馬匹：0力量/1均衡/2耐力（預設均衡）
  materials:{}, ingredients:{},  // 新資源：素材（強化）、食材（料理）
  staff:{ craftsman:0, leader:0 },// 後勤：工匠階級0-3、領隊0/1
  upgrades:{},                   // 項目化強化已解鎖項目 {id:true}
}; }
let GUILD = defaultGuild();

// 五個職業槽：unlocked＝是否已加入出戰、tier＝占位者階級（決定等級上限）、level/xp、weapon/armor、skills（隨機雙技能，Phase D）
function newRosterSlot(unlocked){ return {unlocked:!!unlocked, tier:0, level:1, xp:0, weapon:null, armor:null, skills:null}; }
function defaultRoster(){ return [ newRosterSlot(true), newRosterSlot(false), newRosterSlot(false), newRosterSlot(false), newRosterSlot(false) ]; }
let ROSTER = defaultRoster();   // 開局只有戰士；其餘於招募所解鎖
function ensureRoster(){ while(ROSTER.length<CLASS_ORDER.length) ROSTER.push(newRosterSlot(false));
  ROSTER.forEach((r,i)=>{ if(r.unlocked==null)r.unlocked=false; if(r.tier==null)r.tier=0; if(r.level==null)r.level=1; if(r.xp==null)r.xp=0;
    if(r.unlocked && !Array.isArray(r.skills)) rollRecruitSkills(i); }); }
function activeRoster(){ const out=[]; ROSTER.forEach((r,i)=>{ if(r.unlocked) out.push(i); }); return out.length?out:[0]; }

let BATTLE_SPEED = 1;   // 戰鬥速度倍率（1/2/4），跨場記住

// ---- 存檔持久化（localStorage）。SAVE_KEY 升 v2：舊檔不遷移、直接以新結構重置 ----
const SAVE_KEY = 'relicCaravanSave_v2';
function saveGuild(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify({GUILD,ROSTER})); }catch(e){} }
function loadGuild(){ try{
  const s=JSON.parse(localStorage.getItem(SAVE_KEY));
  if(s&&s.GUILD){
    GUILD=Object.assign(defaultGuild(), s.GUILD);
    if(!GUILD.facilities) GUILD.facilities={temple:1,outfit:1};
    if(!GUILD.materials) GUILD.materials={};
    if(!GUILD.ingredients) GUILD.ingredients={};
    if(!GUILD.staff) GUILD.staff={craftsman:0,leader:0};
    if(!GUILD.upgrades) GUILD.upgrades={};
    if(GUILD.horse==null) GUILD.horse=1;
    if(GUILD.wagon==null) GUILD.wagon=0;
    if(!Array.isArray(GUILD.wagonUp)) GUILD.wagonUp=[0,0,0];
    if(GUILD.formation==null||GUILD.formation>=FORMATIONS.length) GUILD.formation=0;
    if(Array.isArray(s.ROSTER)&&s.ROSTER.length>=1){ ROSTER=s.ROSTER; ensureRoster(); }
  }
}catch(e){} }
function resetSave(){ try{ localStorage.removeItem(SAVE_KEY); localStorage.removeItem('relicCaravanSave_v1'); }catch(e){}
  GUILD=defaultGuild(); ROSTER=defaultRoster(); ensureRoster(); }
loadGuild(); ensureRoster();

// ---- 素材 / 食材 資源存取（名稱→數量）----
function addMaterial(name,n){ GUILD.materials[name]=(GUILD.materials[name]||0)+(n||1); }
function addIngredient(name,n){ GUILD.ingredients[name]=(GUILD.ingredients[name]||0)+(n||1); }
function matCount(name){ return GUILD.materials[name]||0; }
function ingCount(name){ return GUILD.ingredients[name]||0; }

// ---- 設施：神殿（遺物槽＋祝福）、整備所（補給/貨格上限）----
function templeSlots(){ return 1 + GUILD.facilities.temple; }     // Lv1 = 2 槽
// ---- 馬匹（單馬車＋選馬）＋ 工匠項目化強化：最終食物/貨格 ----
function upgradeEffectTotal(){ let food=0,slots=0; UPGRADES.forEach(u=>{ if(GUILD.upgrades&&GUILD.upgrades[u.id]){ food+=u.effect.food||0; slots+=u.effect.slots||0; } }); return {food,slots}; }
function wagonStats(){ const h=HORSES[GUILD.horse]||HORSES[1]; const up=upgradeEffectTotal();
  return { name:'探險馬車', horse:h.name, horseDesc:h.desc, food:h.food+up.food, slots:h.slots+up.slots, upFood:up.food, upSlots:up.slots }; }
function upgradeOwned(id){ return !!(GUILD.upgrades&&GUILD.upgrades[id]); }
function canBuyUpgrade(u){ if(upgradeOwned(u.id)) return false; if(craftsmanTier()<u.craftReq) return false; if(GUILD.funds<u.cost.funds) return false;
  const m=u.cost.mats||{}; for(const k in m){ if(matCount(k)<m[k]) return false; } return true; }
function buyUpgrade(u){ if(!canBuyUpgrade(u)) return false; GUILD.funds-=u.cost.funds; const m=u.cost.mats||{}; for(const k in m){ GUILD.materials[k]=(GUILD.materials[k]||0)-m[k]; } GUILD.upgrades[u.id]=true; saveGuild(); return true; }
function upgradeCostText(u){ const parts=['＄'+u.cost.funds]; const m=u.cost.mats||{}; for(const k in m){ const md=MATERIAL_BY_ID[k]; parts.push(`${md?md.icon:''}${md?md.name:k}×${m[k]}`); } return parts.join(' '); }
// 素材／食材 掉落物件（探險中入貨車，結算自動入庫；全滅則失）
function makeMaterialItem(di){ const m=MATERIAL_BY_DEST[di]; if(!m) return null; return {kind:'素材', matId:m.id, name:m.name, icon:m.icon, value:20}; }
function makeIngredientItem(di){ const g=INGREDIENT_BY_DEST[di]; if(!g) return null; return {kind:'食材', ingId:g.id, name:g.name, icon:g.icon, value:12}; }

// ---- 領隊・料理：消耗食材（公會庫存）產生補血／本趟增益 ----
function recipeNeedText(r){ return Object.keys(r.need).map(k=>{ const g=INGREDIENT_BY_ID[k]; return `${g?g.icon:''}${g?g.name:k}×${r.need[k]}`; }).join(' '); }
function canCook(r){ if(!hasLeader()) return false; for(const k in r.need){ if(ingCount(k)<r.need[k]) return false; } return true; }
function cook(r){ if(!canCook(r)) return null; for(const k in r.need){ GUILD.ingredients[k]-=r.need[k]; } saveGuild();
  let msg='料理「'+r.name+'」：';
  if(r.heal && RUN){ let n=0; RUN.heroes.forEach(h=>{ if(h.hp>0){ const mx=heroStat(h).maxHp; const b=h.hp; h.hp=Math.min(mx,h.hp+Math.round(mx*r.heal)); if(h.hp>b)n++; } }); msg+=`回復 ${n} 人 `; }
  if(r.buff && RUN){ RUN.cookBuff=RUN.cookBuff||{atk:0,def:0}; RUN.cookBuff.atk+=r.buff.atk||0; RUN.cookBuff.def+=r.buff.def||0;
    const p=[]; if(r.buff.atk)p.push('ATK+'+r.buff.atk); if(r.buff.def)p.push('DEF+'+r.buff.def); msg+='本趟 '+p.join(' '); }
  return msg; }

// ---- 遺物效果：已收集的遺物即時、永久生效（取代神殿供奉）----
// 數值加成累加；規則型旗標 OR 起來。供 heroStat / 戰鬥 / 地圖讀取。
function relicEffects(){
  const e={atk:0,def:0,hp:0,heal:0,drop:0,food:0,extraLoot:0, firstHitCrit:false, reviveOnce:false, noFoodDrain:false, fullHealAfterBattle:false};
  (GUILD.relics||[]).forEach(id=>{ const r=RELIC_BY_ID[id]; if(!r) return; const ef=r.effect||{};
    for(const k in ef){ if(typeof ef[k]==='boolean'){ e[k]=e[k]||ef[k]; } else { e[k]=(e[k]||0)+ef[k]; } } });
  return e;
}
// 遺物效果摘要（數值＋規則名稱），給大廳/整備顯示
function relicSummary(e){
  e=e||relicEffects(); const p=[];
  if(e.atk)p.push('ATK+'+e.atk); if(e.def)p.push('DEF+'+e.def); if(e.hp)p.push('HP+'+e.hp);
  if(e.heal)p.push('治療+'+e.heal); if(e.drop)p.push('遺物率+'+Math.round(e.drop*100)+'%'); if(e.extraLoot)p.push('額外掉落+'+e.extraLoot);
  if(e.firstHitCrit)p.push('首擊必暴'); if(e.reviveOnce)p.push('復活一次'); if(e.noFoodDrain)p.push('不耗食物'); if(e.fullHealAfterBattle)p.push('戰後全回');
  return p.length?p.join('　'):'（尚無）';
}
// 相容別名：舊呼叫點仍可用（內容已改為遺物即時效果）
function guildBlessing(){ return relicEffects(); }
function blessingSummary(e){ return relicSummary(e); }
function relicCollected(id){ return (GUILD.relics||[]).includes(id); }
function relicTotalCount(){ return RELIC_CATALOG.length; }
// 本趟目的地尚未收集的遺物（排除已入庫＋本趟貨車已撿到的，避免重複）
function uncollectedRelicsForDest(di){
  const banked=new Set(GUILD.relics||[]);
  const inCargo=new Set(((RUN&&RUN.cargo)||[]).filter(it=>it.kind==='遺物').map(it=>it.relicId));
  return (RELICS_BY_DEST[di]||[]).filter(r=>!banked.has(r.id)&&!inCargo.has(r.id));
}
function makeRelicItem(r){ return {kind:'遺物', relicId:r.id, name:r.name, icon:r.icon, desc:r.desc, value:CFG.loot.relicValueBase+(r.dest+1)*CFG.loot.relicValuePerTier}; }
function rollRelicForDest(di){ const pool=uncollectedRelicsForDest(di); if(!pool.length) return null; return makeRelicItem(Phaser.Utils.Array.GetRandom(pool)); }

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
// 站位按「目前出戰人數」動態排列：每個職業的 row（前/中/後）決定 X，同排成員依人數平均分配 Y。
// 這樣 1~5 人都能排得好看，並修掉舊版「多人共用一套站位、多餘 slot 被忽略」的問題。
function formationLayout(){
  const f=currentFormation();
  const present=activeRoster().map(i=>HERO_BASE[i].sprite).filter(sp=>f.slots&&f.slots[sp]);
  const rowX={front:335, mid:250, back:165};
  const byRow={front:[],mid:[],back:[]};
  present.forEach(sp=>{ const r=(f.slots[sp].row)||'back'; (byRow[r]=byRow[r]||[]).push(sp); });
  const out={};
  ['front','mid','back'].forEach(row=>{ const arr=byRow[row]||[]; const n=arr.length;
    arr.forEach((sp,k)=>{ const y = n<=1?360 : Math.round(248 + k*(224/(n-1)));
      out[sp]={x:rowX[row]||200, y, row}; }); });
  return out;
}
function formationSlot(sprite){ const f=currentFormation(); const base=(f.slots&&f.slots[sprite])||{row:'back'};
  const pos=formationLayout()[sprite];
  return Object.assign({x:200,y:360,row:base.row||'back'}, base, pos||{}); }
function formationMod(sprite){ const s=(currentFormation().slots||{})[sprite]||{}; return {atk:s.atk||0, def:s.def||0, hp:s.hp||0, heal:s.heal||0}; }

// ---- 戰鬥成員：職業槽招募／升階／等級上限 ----
function classDef(i){ return CFG.recruit.classes[CLASS_ORDER[i]]; }   // warrior 無此設定(=null)
function classCap(i){ const caps=CFG.recruit.tierCaps; return caps[Math.min(ROSTER[i].tier||0, caps.length-1)]; }
function canRecruitClass(i){ const d=classDef(i); if(!d||ROSTER[i].unlocked) return false; return GUILD.funds>=d.cost && reputation()>=d.repReq; }
function recruitClass(i){ const d=classDef(i); if(!d||ROSTER[i].unlocked) return false;
  if(GUILD.funds<d.cost||reputation()<d.repReq) return false;
  GUILD.funds-=d.cost; ROSTER[i].unlocked=true; ROSTER[i].tier=0; ROSTER[i].level=1; ROSTER[i].xp=0;
  rollRecruitSkills(i); saveGuild(); return true; }
function tierUpDef(i){ const t=ROSTER[i].tier||0; return CFG.recruit.tierUp[t]; }   // t=0→升tier1、t=1→升tier2
function canTierUp(i){ if(!ROSTER[i].unlocked) return false; const d=tierUpDef(i); if(!d) return false;
  return GUILD.funds>=d.cost && reputation()>=d.repReq; }
function tierUpClass(i){ const d=tierUpDef(i); if(!d) return false; if(GUILD.funds<d.cost||reputation()<d.repReq) return false;
  GUILD.funds-=d.cost; ROSTER[i].tier=(ROSTER[i].tier||0)+1; saveGuild(); return true; }
// 隨機雙技能（Phase D 用；此處先建立資料：從該職業技能池抽 2 個）
function rollRecruitSkills(i){ const pool=(SKILLS[CLASS_ORDER[i]]||[]).slice();
  if(pool.length<=2){ ROSTER[i].skills=pool.map(s=>s.name); return; }
  const pick=[]; const copy=pool.slice();
  for(let k=0;k<2 && copy.length;k++){ const idx=Math.floor(Math.random()*copy.length); pick.push(copy.splice(idx,1)[0].name); }
  ROSTER[i].skills=pick; }

// ---- 後勤：工匠（階級0-3）與領隊 ----
function craftsmanTier(){ return GUILD.staff.craftsman||0; }
function craftsmanNextDef(){ const t=craftsmanTier(); return CFG.staff.craftsman[t]; }   // t=0→學徒…
function canUpgradeCraftsman(){ const d=craftsmanNextDef(); if(!d) return false; return GUILD.funds>=d.cost && reputation()>=d.repReq; }
function upgradeCraftsman(){ const d=craftsmanNextDef(); if(!d) return false; if(GUILD.funds<d.cost||reputation()<d.repReq) return false;
  GUILD.funds-=d.cost; GUILD.staff.craftsman=craftsmanTier()+1; saveGuild(); return true; }
function hasLeader(){ return (GUILD.staff.leader||0)>0; }
function canHireLeader(){ if(hasLeader()) return false; const d=CFG.staff.leader; return GUILD.funds>=d.cost && reputation()>=d.repReq; }
function hireLeader(){ if(hasLeader()) return false; const d=CFG.staff.leader; if(GUILD.funds<d.cost||reputation()<d.repReq) return false;
  GUILD.funds-=d.cost; GUILD.staff.leader=1; saveGuild(); return true; }

function xpNeed(lv){ return CFG.xp.base + lv*CFG.xp.perLevel; }
function gainXP(amount){
  const ups=[];
  activeRoster().forEach(i=>{ const r=ROSTER[i], cap=classCap(i); r.xp+=amount;
    while(r.level<cap && r.xp>=xpNeed(r.level)){ r.xp-=xpNeed(r.level); r.level++; ups.push(`${HERO_BASE[i].name} → Lv${r.level}`);
      (SKILLS[HERO_BASE[i].sprite]||[]).filter(s=>s.lv===r.level).forEach(s=>ups.push(`🎓 ${HERO_BASE[i].name} 習得「${s.name}」`)); }
    if(r.level>=cap){ r.xp=Math.min(r.xp, xpNeed(r.level)-1); }   // 達上限：經驗封頂、不再升
  });
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
    cookBuff:{atk:0,def:0},
  };
}
// 保存目前配裝（武器/防具名稱）到 ROSTER，跨輪不重置
function persistLoadout(){ if(!RUN) return; RUN.heroes.forEach(h=>{ if(ROSTER[h.idx]){ ROSTER[h.idx].weapon=h.weapon.name; ROSTER[h.idx].armor=h.armor.name; } }); saveGuild(); }
function heroStat(h){
  const lv=ROSTER[h.idx].level;
  const rolled=ROSTER[h.idx].skills;   // 招募預抽的雙技能（名稱陣列）；達等級才生效
  let sk=(SKILLS[h.sprite]||[]).filter(s=>lv>=s.lv);
  if(Array.isArray(rolled)) sk=sk.filter(s=>rolled.includes(s.name));
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
