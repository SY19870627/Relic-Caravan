// ========================= 全域狀態 =========================
let RUN = null;

// 職業槽索引（對應 HERO_BASE 順序）：戰士0 遊俠1 牧師2 法師3 盜賊4
const SPRITE_INDEX = {}; HERO_BASE.forEach((h,i)=>{ SPRITE_INDEX[h.sprite]=i; });
const CLASS_ORDER = HERO_BASE.map(h=>h.sprite);   // ['warrior','ranger','priest','mage','rogue']

// ---- v0.9 職業裝備限制 → v2.4 改由 data.js 裝備定義的 cls 欄位衍生（單一資料來源，新增裝備只改 data.js）----
const WEAPON_CLASS = {}; WEAPONS.forEach(w=>{ if(w.cls) WEAPON_CLASS[w.name]=w.cls; });
const ARMOR_CLASSES = {}; ARMORS.forEach(a=>{ if(a.cls) ARMOR_CLASSES[a.name]=a.cls; });
const CLASS_LABEL = { warrior:'戰士', ranger:'遊俠', priest:'牧師', mage:'法師', rogue:'盜賊' };
function weaponClassOK(sprite,w){ if(!w) return true; const c=WEAPON_CLASS[w.name]; return !c || c===sprite; }
function armorClassOK(sprite,a){ if(!a) return true; const cs=ARMOR_CLASSES[a.name]; return !cs || cs.includes(sprite); }
function gearClassOK(sprite,item){ if(!item) return true; const g=item.gear||item;
  if(item.kind==='武器'|| (g&&g.atkSeq)) return weaponClassOK(sprite,g);
  if(item.kind==='防具'|| (g&&g.def!==undefined&&!g.atkSeq)) return armorClassOK(sprite,g);
  return true; }
function weaponClassLabel(w){ const c=WEAPON_CLASS[w.name]; return c?CLASS_LABEL[c]:'通用'; }
function armorClassLabel(a){ const cs=ARMOR_CLASSES[a.name]; return (!cs||cs.length>=5)?'通用':cs.map(x=>CLASS_LABEL[x]).join('/'); }

// 跨輪保存的公會狀態
function defaultGuild(){ return {
  settings:{ autoSipFrac:0.30, autoEquip:true },   // autoSipFrac：自動喝水門檻；autoEquip：自動換最佳裝備
  relics:[], reputation:0, repEarned:0, partySize:1,   // reputation 可花費、repEarned 累計門檻；partySize 1→5
  formation:0,
  formationsUnlocked:{},        // 已用聲望解鎖的隊形索引（基礎三角 cost0 永遠可用）
  horse:0,                       // 馬匹：純貨格（後勤）：0均衡6(預設)/1耐力9/2力量12
  horsesUnlocked:{},            // 已用聲望解鎖的馬匹索引（普通馬／均衡馬 cost0 永遠可用）
  materials:{},                 // 素材（工坊強化用，跨趟保留）
  ingredients:{},               // 食材（料理用，跨趟持久庫存，不佔貨格）
  staff:{ craftsman:0, leader:0 },// 後勤：工匠階級0-3、領隊0/1
  upgrades:{},                   // 項目化強化已解鎖項目 {id:true}
  discovered:{},                 // 收藏圖鑑：曾取得過的物品名稱
  owned:{},                      // 已擁有的武器/防具（唯一，不計數量）
  questKills:{}, questStage:{}, titles:{},   // v2.1 任務累計擊殺 / 已領取階數 / 已解鎖稱號（全開生效）
  classPoints:{},   // 職業規劃器：各職業點數上限 {warrior:Number,...}（活著回來累計）
  classPlans:{},    // 職業規劃器：各職業配置 {warrior:{slots:[{act,skill},...長度20]}}
}; }
let GUILD = defaultGuild();

// 五個職業槽：unlocked＝是否已加入出戰、tier＝占位者階級（決定等級上限）、level/xp、weapon/armor、skills（隨機雙技能，Phase D）
function newRosterSlot(unlocked){ return {unlocked:!!unlocked, tier:0, level:1, xp:0, weapon:null, armor:null, skills:null}; }
function defaultRoster(){ return [ newRosterSlot(true), newRosterSlot(true), newRosterSlot(true), newRosterSlot(true), newRosterSlot(true) ]; }   // v0.9：五職業固定皆可用，由 partySize 決定帶幾個
let ROSTER = defaultRoster();   // 開局只有戰士；其餘於招募所解鎖
function ensureRoster(){ while(ROSTER.length<CLASS_ORDER.length) ROSTER.push(newRosterSlot(false));
  ROSTER.forEach((r,i)=>{ if(r.unlocked==null)r.unlocked=false; if(r.tier==null)r.tier=0; if(r.level==null)r.level=1; if(r.xp==null)r.xp=0;
    if(r.unlocked && !Array.isArray(r.skills)) r.skills=[]; }); }
function activeRoster(){
  if(typeof RUN!=='undefined' && RUN && RUN.trial) return [RUN.trial.idx];   // v4.1 試煉：強制單人（無視隊伍格與解鎖）
  const out=[]; ROSTER.forEach((r,i)=>{ if(r.unlocked) out.push(i); }); const list=out.length?out:[0]; return list.slice(0, Math.max(1, GUILD.partySize||1)); }

let BATTLE_SPEED = 1;   // 戰鬥速度倍率（1/2/4），跨場記住
let TARGET_ORDER = ['lowHp','healer','back','front','lowDef','status'];   // 我方鎖定優先序（由上到下），跨場記住

// ---- 存檔持久化（localStorage）。SAVE_KEY 升 v2：舊檔不遷移、直接以新結構重置 ----
const SAVE_KEY = 'relicCaravanSave_v4';   // v0.9 roguelike：只持久化公會資產；隊伍免洗、跑地城不存檔
// 只持久化「公會資產」。ROSTER 僅存永久部分（解鎖、起始裝階 tier）；本趟 level/xp/裝備/技能不存。
function saveGuild(){ try{
  const slim = ROSTER.map(r=>({unlocked:!!r.unlocked, tier:r.tier||0}));
  localStorage.setItem(SAVE_KEY, JSON.stringify({GUILD, ROSTER:slim}));
}catch(e){} }
function loadGuild(){ try{
  const s=JSON.parse(localStorage.getItem(SAVE_KEY));
  if(s&&s.GUILD){
    GUILD=Object.assign(defaultGuild(), s.GUILD);    if(!GUILD.materials) GUILD.materials={};    if(!GUILD.ingredients) GUILD.ingredients={};    if(!GUILD.staff) GUILD.staff={craftsman:0,leader:0};
    if(!GUILD.upgrades) GUILD.upgrades={};
    for(const k in GUILD.upgrades){ if(GUILD.upgrades[k]===true) GUILD.upgrades[k]=1; }   // v9.0 遷移：一次性 → 等級制
    if(!GUILD.discovered) GUILD.discovered={};
    if(!GUILD.owned) GUILD.owned={};
    if(!GUILD.titles) GUILD.titles={}; if(!GUILD.questKills) GUILD.questKills={}; if(!GUILD.questStage) GUILD.questStage={};   // v2.1
    if(!GUILD.classPoints) GUILD.classPoints={}; if(!GUILD.classPlans) GUILD.classPlans={};   // 職業規劃器（舊存檔相容）
    if(typeof QUEST_LINES!=='undefined') QUEST_LINES.forEach(l=>{ const s1=l.stages[0].title.id;   // 遷移舊存檔：沿用擊殺數、依已解鎖稱號推回階數
      if(GUILD.questKills[l.id]==null) GUILD.questKills[l.id]=(GUILD.quests&&GUILD.quests[s1])||0;
      if(GUILD.questStage[l.id]==null){ let n=0; for(const st of l.stages){ if(GUILD.titles[st.title.id]) n++; else break; } GUILD.questStage[l.id]=n; } });
    if(!GUILD.formationsUnlocked) GUILD.formationsUnlocked={};
    if(!GUILD.horsesUnlocked) GUILD.horsesUnlocked={};
    if(!Array.isArray(GUILD.wagonRelics)) GUILD.wagonRelics=[];   // v8.0 遺物龕（馬車上生效的遺物）
    if(!Array.isArray(GUILD.supplyPicks)) GUILD.supplyPicks=['gong'];   // v8.3 補給架選件（預設戰士銅鑼）
    if(!GUILD.settings) GUILD.settings={autoSipFrac:0.30};
    if(GUILD.horse==null||GUILD.horse>=HORSES.length) GUILD.horse=0;    if(GUILD.partySize==null) GUILD.partySize=1;
    if(GUILD.reputation==null) GUILD.reputation=0;
    if(GUILD.repEarned==null) GUILD.repEarned=GUILD.reputation||0;    if(GUILD.formation==null||GUILD.formation>=FORMATIONS.length) GUILD.formation=0;
    if(Array.isArray(s.ROSTER)&&s.ROSTER.length>=1){
      ROSTER = s.ROSTER.map(r=>{ const slot=newRosterSlot(!!r.unlocked); slot.tier=(r&&r.tier)||0; return slot; });
      ensureRoster();
    }
  }
}catch(e){} }
function resetSave(){ try{ ['relicCaravanSave_v4','relicCaravanSave_v3','relicCaravanSave_v2','relicCaravanSave_v1'].forEach(k=>localStorage.removeItem(k)); }catch(e){}
  GUILD=defaultGuild(); ROSTER=defaultRoster(); ensureRoster(); }
loadGuild(); ensureRoster();

// ---- 素材 / 食材 資源存取（名稱→數量）----
function addMaterial(name,n){ GUILD.materials[name]=(GUILD.materials[name]||0)+(n||1); }
function matCount(name){ return GUILD.materials[name]||0; }
// 素材掉落→立即入庫（持久、不佔貨格、全滅也不失），對應目的地素材
function gainMaterial(di){ const m=MATERIAL_BY_DEST[di]; if(m){ addMaterial(m.id); saveGuild(); } return m; }
// 食材：持久公會庫存（像素材），不佔貨格
function addIngredient(id,n){ GUILD.ingredients[id]=(GUILD.ingredients[id]||0)+(n||1); }
function ingCount(id){ return GUILD.ingredients[id]||0; }
function ingTotal(){ return Object.values(GUILD.ingredients||{}).reduce((a,b)=>a+b,0); }
// ===== v4.0 職業階級（GUILD.classRanks，0-4；晉階由單人試煉發放）=====
function classRankOf(sprite){ return (GUILD.classRanks&&GUILD.classRanks[sprite])||0; }
function classRankName(sprite){ return (CFG.ranks&&CFG.ranks.names&&CFG.ranks.names[classRankOf(sprite)])||'見習'; }
function setClassRank(sprite, r){ if(!GUILD.classRanks) GUILD.classRanks={}; GUILD.classRanks[sprite]=Math.max(classRankOf(sprite), Math.min(4, r|0)); saveGuild(); }
// 技能是否已解鎖：enforce 關閉時全開（試煉上線前的過渡）；開啟時依 rank 欄位 vs 職業階級
function skillUnlocked(sprite, sk){ if(!sk) return false; if(!(CFG.ranks&&CFG.ranks.enforce)) return true; return (sk.rank||0)<=classRankOf(sprite); }
// 階級 HP 福利（heroStat 讀取）
function rankHpBonus(sprite){ const arr=(CFG.ranks&&CFG.ranks.perks&&CFG.ranks.perks.hp)||[]; let s=0; for(let i=1;i<=classRankOf(sprite);i++) s+=arr[i]||0; return s; }

// ===== v4.6 世界難度與遺物品階 =====
function worldDiff(){ const s=GUILD.settings||{}; return (s.worldDiff!=null)? s.worldDiff : 0; }   // 預設普通
function setWorldDiff(d){ if(!GUILD.settings) GUILD.settings={}; GUILD.settings.worldDiff=Math.max(0,Math.min(2,d|0)); saveGuild(); return GUILD.settings.worldDiff; }
function relicGradeOf(id){ return (GUILD.relicGrades&&GUILD.relicGrades[id]!=null)? GUILD.relicGrades[id] : 1; }   // 舊存檔預設「完好」
// v4.9 地城通關紀錄（依難度取最高）：-1＝未通關；舊存檔以「該地遺物品階」回推
function destClearLevel(di){
  let lv=(GUILD.destClears&&GUILD.destClears[di]!=null)? GUILD.destClears[di] : -1;
  const r=(RELICS_BY_DEST[di]||[])[0];
  if(r && (GUILD.relics||[]).includes(r.id)) lv=Math.max(lv, relicGradeOf(r.id));
  return lv;
}
function recordDestClear(di, diff){ if(!GUILD.destClears) GUILD.destClears={};
  const cur=GUILD.destClears[di]; if(cur==null || diff>cur) GUILD.destClears[di]=diff; }
// 遺物入庫（三個結算點共用）：新遺物 push；品階取歷史最高（高難度重打＝升級）。回傳是否為新遺物
function bankRelic(it){ if(!it||!it.relicId) return false;
  if(!GUILD.relicGrades) GUILD.relicGrades={};
  const g=(it.grade!=null)?it.grade:1;
  const had=(GUILD.relics||[]).includes(it.relicId);
  const cur=(GUILD.relicGrades[it.relicId]!=null)? GUILD.relicGrades[it.relicId] : (had?1:-1);
  if(!had) GUILD.relics.push(it.relicId);
  GUILD.relicGrades[it.relicId]=Math.max(cur, g);
  return !had; }

// ===== v4.1 試煉紀錄與啟動 =====
function trialKey(sp,st){ return sp+'_'+st; }
function trialCleared(sp,st){ return !!(GUILD.trialClears&&GUILD.trialClears[trialKey(sp,st)]); }
function initTrialRun(sprite, stage){
  const idx=CLASS_ORDER.indexOf(sprite), def=TRIAL_DEFS[sprite], sd=def.stages[stage-1];
  RUN={ trial:{sprite, stage, idx}, wagon:null, heroes:[], cargo:[], slots:6,
    gold:60, isBoss:false, gotGear:{}, itemLog:[],
    cookShield:0, reviveCharge:0, cookFirstCrit:false, pendingLevelups:[], _lvChoices:null, _lvReplace:null,
    deckExpanded:false, combatMs:0,
    destTier:1, destName:def.name+'・關卡'+stage, destIndex:def.dest,
    trialWeather:sd.weather, trialObjs:sd.objs, trialHint:(stage===1? sd.hint : null), trialFight:0 };   // v4.4：戰鬥計數（依序取用 fights 波次）
  ROSTER[idx].level=1; ROSTER[idx].xp=0; ROSTER[idx].skills=[]; ROSTER[idx].skillPlus={};
  grantPlannedSkill(idx, 1);
  const weapon=startKitWeapon(idx), armor=startKitArmor(idx);
  ROSTER[idx].weapon=weapon.name; ROSTER[idx].armor=armor.name;
  const hobj={...HERO_BASE[idx], idx, weapon, armor, hp:0};
  hobj.hp=heroStat(hobj).maxHp;   // 試煉直接滿血出發（不經整備）
  RUN.heroes=[hobj];
  RUN.exped={ pct:0, plan:sd.plan.slice(), i:0 };
}

// v3.4 清晰節奏模式（行動節拍器＋大招定格＋視覺降噪）：預設開，可於暫停選單切換
function pacingOn(){ const s=GUILD.settings||{}; return s.pacing!==false; }
function togglePacing(){ if(!GUILD.settings) GUILD.settings={}; GUILD.settings.pacing=!pacingOn(); saveGuild(); return GUILD.settings.pacing; }
// 自動喝水：門檻 0.30/0.50/1.00（低於就喝），0＝關；單一按鈕循環切換（含舊存檔相容）
function autoSipFrac(){ const s=GUILD.settings||{}; return (s.autoSipFrac!==undefined)? s.autoSipFrac : (s.autoSip===false?0:0.30); }
function autoSipLabel(){ const f=autoSipFrac(); return f<=0?'關':('<'+Math.round(f*100)+'%'); }
function cycleAutoSip(){ if(!GUILD.settings) GUILD.settings={}; const order=[0.30,0.50,1.00,0], cur=autoSipFrac(); let i=order.indexOf(cur); if(i<0)i=0; GUILD.settings.autoSipFrac=order[(i+1)%order.length]; saveGuild(); return GUILD.settings.autoSipFrac; }

// ---- 馬匹（單馬車＋選馬）＋ 工匠項目化強化：最終食物/貨格 ----
function upgradeEffectTotal(){ let slots=0; UPGRADES.forEach(u=>{ const lv=upgradeLv(u.id); if(!lv) return;
  slots+=(u.effect&&u.effect.slotsPerLv||0)*lv + (u.effect&&u.effect.slots||0); }); return {slots}; }
function wagonStats(){ const h=HORSES[GUILD.horse]||HORSES[0]; const up=upgradeEffectTotal();
  return { name:'探險馬車', horse:h.name, horseDesc:h.desc, slots:h.slots+up.slots, upSlots:up.slots }; }
// v9.0 等級化：upgradeLv 取當前等級（相容舊存檔 true=1）；素材成本 ×目標等級、聲望隨等級 +1
function upgradeLv(id){ const v=GUILD.upgrades&&GUILD.upgrades[id]; return v===true?1:(v||0); }
function upgradeOwned(id){ return upgradeLv(id)>0; }
function upgradeMaxed(u){ return upgradeLv(u.id)>=(u.maxLv||1); }
function upgradeRepCost(u){ return CFG.repCost.upgradeBase + CFG.repCost.upgradePerCraft*(u.craftReq||0) + upgradeLv(u.id); }
function canBuyUpgrade(u){ if(upgradeMaxed(u)) return false; if(craftsmanTier()<u.craftReq) return false; if(!canSpendRep(upgradeRepCost(u))) return false;
  const nl=upgradeLv(u.id)+1, m=u.cost.mats||{}; for(const k in m){ if(matCount(k)<m[k]*nl) return false; } return true; }
function buyUpgrade(u){ if(!canBuyUpgrade(u)) return false; spendRep(upgradeRepCost(u));
  const nl=upgradeLv(u.id)+1, m=u.cost.mats||{}; for(const k in m){ GUILD.materials[k]=(GUILD.materials[k]||0)-m[k]*nl; }
  GUILD.upgrades[u.id]=nl; saveGuild(); return true; }
function upgradeCostText(u){ const nl=upgradeLv(u.id)+1, parts=['⭐'+upgradeRepCost(u)]; const m=u.cost.mats||{}; for(const k in m){ const md=MATERIAL_BY_ID[k]; parts.push(`${md?md.icon:''}${md?md.name:k}×${m[k]*nl}`); } return parts.join(' '); }
// v9.0 等級化強化效果（集中取值，戰鬥/商店/事件端讀這裡）
function badEventMul(){ return Math.max(0, 1-0.10*upgradeLv('bell')); }
function valuableSellMul(){ return 1+0.04*upgradeLv('spring'); }
function shopPriceMul(){ return 1-0.02*upgradeLv('flag'); }
function spiritIntervalMul(){ return 1-0.03*upgradeLv('gild'); }
function spiritDmgMul(n){ let m=1+0.06*upgradeLv('holy'); if((n||0)>=2) m*=1+0.03*upgradeLv('reso'); return m; }
function supplyDurBonus(){ return upgradeLv('arm'); }
// 掉落物件（探險中入貨車）。素材：結算自動入庫；食材：每趟隨身、料理消耗、不入庫；全滅則失
function makeMaterialItem(di){ const m=MATERIAL_BY_DEST[di]; if(!m) return null; return {kind:'素材', matId:m.id, name:m.name, icon:m.icon, value:20}; }
function forageIngredient(di,n){ const g=INGREDIENT_BY_DEST[di]; if(g){ addIngredient(g.id,n||1); saveGuild(); } return g; }

// ---- 領隊・料理：消耗食材（公會庫存）產生補血／本趟增益 ----
function recipeNeedText(r){ return Object.keys(r.need).map(k=>{ const g=INGREDIENT_BY_ID[k]; return `${g?g.icon:''}${g?g.name:k}×${r.need[k]}`; }).join(' '); }
// 可料理：有領隊，或工匠強化「隨車鍋」(campstove) 解鎖後也能煮
function canCook(r){ for(const k in r.need){ if(ingCount(k)<r.need[k]) return false; } return true; }
function cook(r){ if(!canCook(r)) return null; for(const k in r.need){ GUILD.ingredients[k]=(GUILD.ingredients[k]||0)-r.need[k]; } saveGuild();
  let msg='料理「'+r.name+'」：';
  if(r.heal && RUN){ let n=0; RUN.heroes.forEach(h=>{ if(h.hp>0){ const mx=heroStat(h).maxHp; const b=h.hp; h.hp=Math.min(mx,h.hp+Math.round(mx*r.heal)); if(h.hp>b)n++; } }); msg+=`回復 ${n} 人 `; }
  // v0.8：buff 從數值改成一次性功能（下一場戰鬥生效）
  if(r.grant && RUN){
    if(r.grant==='shield'){ RUN.cookShield=(RUN.cookShield||0)+(r.amt||20); msg+=`下場開場護盾 +${r.amt||20}`; }
    else if(r.grant==='revive'){ RUN.reviveCharge=(RUN.reviveCharge||0)+1; msg+='下場 +1 次陣亡復活'; }
    else if(r.grant==='firstCrit'){ RUN.cookFirstCrit=true; msg+='下場全隊首擊必暴'; }
  }
  return msg; }

// ---- 遺物效果：已收集的遺物即時、永久生效（取代神殿供奉）----
// 數值加成累加；規則型旗標 OR 起來。供 heroStat / 戰鬥 / 地圖讀取。
function relicEffects(){
  const e={atk:0,def:0,hp:0,heal:0,drop:0,extraLoot:0, firstHitCrit:false, reviveOnce:false, fullHealAfterBattle:false,
    // v0.8 規則型旗標
    splash:false, startShield:0, regen:0, killCrit:false, healToShield:false, lastStand:false, firstDeathHeal:0, firstStrikeAoe:false, soloBoost:false, lifesteal:0, firstHitBlock:false};
  // v8.0 遺物龕：只有「搬上馬車」的遺物生效（收藏不再全域疊加——遺物化身召喚獸隨車出戰）
  wagonLoadedRelics().forEach(id=>{ const r=RELIC_BY_ID[id]; if(!r) return; const ef=r.effect||{};
    const gm=((CFG.diff&&CFG.diff.relicMuls)||[0.7,1,1.4])[relicGradeOf(id)]||1;   // v4.6 品階乘數（數值效果）
    for(const k in ef){ if(typeof ef[k]==='boolean'){ e[k]=e[k]||ef[k]; }
      else { const v=ef[k]*gm; e[k]=(e[k]||0)+(Number.isInteger(ef[k])? Math.round(v) : v); } } });
  return e;
}
// v8.0 遺物龕：容量依馬車（均衡馬 0＝無法喚出遺物守護靈、耐力馬 1、力量馬 2）；上/卸即存檔
function wagonRelicCap(){ const h=GUILD.horse||0; return h>=2?2:(h>=1?1:0); }
function wagonLoadedRelics(){ if(!Array.isArray(GUILD.wagonRelics)) GUILD.wagonRelics=[];
  GUILD.wagonRelics=GUILD.wagonRelics.filter(id=>(GUILD.relics||[]).includes(id)).slice(0, wagonRelicCap());
  return GUILD.wagonRelics; }
function toggleWagonRelic(id){ if(!(GUILD.relics||[]).includes(id)) return false;
  const l=wagonLoadedRelics(), i=l.indexOf(id);
  if(i>=0){ l.splice(i,1); saveGuild(); return true; }
  if(l.length>=wagonRelicCap()) return false;
  l.push(id); saveGuild(); return true; }
// v8.3 商隊補給架：玩家挑選「職業代表物件」每波自篷車拋出——預設可帶 1 件；工坊「補給架擴充」後可帶 2 件
const SUPPLY_OBJECTS=[{type:'gong',cls:'warrior'},{type:'totem',cls:'ranger'},{type:'candles',cls:'priest'},{type:'crystal',cls:'mage'},{type:'lantern',cls:'rogue'}];
function supplyCap(){ return upgradeOwned('supply') ? 2 : 1; }
function supplyPicks(){ if(!Array.isArray(GUILD.supplyPicks)) GUILD.supplyPicks=['gong'];
  GUILD.supplyPicks=GUILD.supplyPicks.filter(t=>SUPPLY_OBJECTS.some(s=>s.type===t)).slice(0, supplyCap());
  if(!GUILD.supplyPicks.length) GUILD.supplyPicks=['gong'];
  return GUILD.supplyPicks; }
function toggleSupplyPick(t){ if(!SUPPLY_OBJECTS.some(s=>s.type===t)) return false;
  const l=supplyPicks(), i=l.indexOf(t);
  if(i>=0){ if(l.length<=1) return false;   // 至少保留 1 件（預設配給）
    l.splice(i,1); saveGuild(); return true; }
  if(l.length>=supplyCap()) l.shift();   // 架滿→自動替換最舊的一件（容量 1 也能直接換選）
  l.push(t); saveGuild(); return true; }
// 遺物效果摘要（數值＋規則名稱），給大廳/整備顯示
function relicCollected(id){ return (GUILD.relics||[]).includes(id); }
function relicTotalCount(){ return RELIC_CATALOG.length; }
// 本趟目的地尚未收集的遺物（排除已入庫＋本趟貨車已撿到的，避免重複）
function uncollectedRelicsForDest(di){
  const inCargo=new Set(((RUN&&RUN.cargo)||[]).filter(it=>it.kind==='遺物').map(it=>it.relicId));
  const d=(typeof RUN!=='undefined'&&RUN&&RUN.diff!=null)? RUN.diff : 1;
  return (RELICS_BY_DEST[di]||[]).filter(r=>{
    if(inCargo.has(r.id)) return false;
    if(!(GUILD.relics||[]).includes(r.id)) return true;
    return relicGradeOf(r.id) < d;   // v4.6：已擁有但品階較低 → 更高難度可重打升級
  });
}
function makeRelicItem(r){ return {kind:'遺物', relicId:r.id, name:r.name, icon:r.icon, desc:r.desc,
  grade:((typeof RUN!=='undefined'&&RUN&&RUN.diff!=null)?RUN.diff:1),   // v4.6 品階＝取得時的難度
  value:CFG.loot.relicValueBase+(r.dest+1)*CFG.loot.relicValuePerTier}; }
function rollRelicForDest(di){ const pool=uncollectedRelicsForDest(di); if(!pool.length) return null; return makeRelicItem(Phaser.Utils.Array.GetRandom(pool)); }

// ---- v2.1 任務/懸賞（分階段任務鏈）+ 稱號（全開：解鎖即生效、同線取最高階、跨線相加）----
function questMatch(m,e){ m=m||{}; if(!e) return false;
  if(m.any) return true;
  if(m.boss) return !!e.boss;
  if(m.sprites) return m.sprites.indexOf(e.sprite)>=0;
  return false; }
function lineKills(id){ return (GUILD.questKills&&GUILD.questKills[id])||0; }
function lineStageIdx(id){ return (GUILD.questStage&&GUILD.questStage[id])||0; }   // 已領取階數＝目前進行中的階段索引
function lineCurrentStage(line){ const i=lineStageIdx(line.id); return (line && i<line.stages.length)? line.stages[i] : null; }
function lineStageClaimable(line){ const st=lineCurrentStage(line); return !!st && lineKills(line.id)>=st.target; }
function lineAllDone(line){ return line? lineStageIdx(line.id)>=line.stages.length : false; }
function lineActiveTitle(line){ const c=lineStageIdx(line.id); return (line && c>0)? line.stages[c-1].title : null; }   // 該線「最高已領階段」的稱號（生效中）
// 敵人死亡 → 為每條任務線累計擊殺（持久、跨趟、跨階保留；上限為該線最後一階目標）
function creditEnemyKill(e){ if(!e || typeof GUILD==='undefined' || !GUILD || typeof QUEST_LINES==='undefined') return;
  QUEST_LINES.forEach(l=>{ if(!questMatch(l.match,e)) return; const cap=l.stages[l.stages.length-1].target, cur=lineKills(l.id);
    if(cur>=cap) return; if(!GUILD.questKills) GUILD.questKills={}; GUILD.questKills[l.id]=cur+1; });
}   // v2.4：不再每殺必寫 localStorage；由戰後 clearStep / 全滅 finish 批次 saveGuild()
// 領取目前階段：達標 → +聲望、解鎖(即生效)該階稱號、推進下一階；回傳剛領到的階段(供提示)
function claimLineStage(id){ const l=(typeof QLINE_BY_ID!=='undefined')?QLINE_BY_ID[id]:null; if(!l || !lineStageClaimable(l)) return null;
  const st=lineCurrentStage(l);
  if(!GUILD.titles) GUILD.titles={}; if(st.title) GUILD.titles[st.title.id]=true;
  if(!GUILD.questStage) GUILD.questStage={}; GUILD.questStage[id]=lineStageIdx(id)+1;
  addRep(st.rep||1); saveGuild(); return st; }
function titleUnlocked(tid){ return !!(GUILD.titles&&GUILD.titles[tid]); }
// 稱號效果（全開）：每條線只取「最高已領階段」的稱號；數值跨線相加，震懾/增傷彙整成清單(戰鬥再依敵人取最高)
function titleEffects(){ const e={atk:0,def:0,hp:0,spawnStuns:[],dmgVsList:[]};
  if(typeof QUEST_LINES==='undefined') return e;
  QUEST_LINES.forEach(l=>{ const t=lineActiveTitle(l); if(!t) return; const ef=t.effect||{};
    e.atk+=ef.atk||0; e.def+=ef.def||0; e.hp+=ef.hp||0;
    if(ef.spawnStun) e.spawnStuns.push(ef.spawnStun); if(ef.dmgVs) e.dmgVsList.push(ef.dmgVs); });
  return e; }
function titleSpawnStunFor(sprite,te){ let best=0; ((te&&te.spawnStuns)||[]).forEach(s=>{ if(s.sprites.indexOf(sprite)>=0 && s.dur>best) best=s.dur; }); return best; }
function titleDmgVsFor(sprite,te){ let best=0; ((te&&te.dmgVsList)||[]).forEach(s=>{ if(s.sprites.indexOf(sprite)>=0 && s.pct>best) best=s.pct; }); return best; }

// ---- 聲望與贊助：聲望 = 神殿遺物數，分級發放開局物資 ----
// v0.9 雙軌經濟：⭐聲望＝可花費的公會升級貨幣（reputation 餘額）；repEarned＝歷史累計（門檻判定，不被花掉）
function reputation(){ return GUILD.reputation||0; }
function repEarned(){ return GUILD.repEarned||0; }
function addRep(n){ n=n||0; GUILD.reputation=(GUILD.reputation||0)+n; GUILD.repEarned=(GUILD.repEarned||0)+n; }
function spendRep(n){ n=n||0; if((GUILD.reputation||0)<n) return false; GUILD.reputation-=n; return true; }
function canSpendRep(n){ return (GUILD.reputation||0)>=(n||0); }
function reputationTier(){ const r=repEarned(), th=CFG.reputation.thresholds; return r>=th[0]?3:(r>=th[1]?2:(r>=th[2]?1:0)); }
function addGold(n){ if(typeof RUN!=='undefined'&&RUN) RUN.gold=(RUN.gold||0)+(n||0); }
function spendGold(n){ if(typeof RUN==='undefined'||!RUN||(RUN.gold||0)<(n||0)) return false; RUN.gold-=(n||0); return true; }
function partySizeCap(){ return GUILD.partySize||1; }
function partySlotCost(){ const arr=CFG.repCost.partySlot||[]; const cur=GUILD.partySize||1; return arr[cur-1]; }
function canUnlockPartySlot(){ const cur=GUILD.partySize||1; if(cur>=5) return false; const c=partySlotCost(); return c!=null && canSpendRep(c); }
function unlockPartySlot(){ if(!canUnlockPartySlot()) return false; spendRep(partySlotCost()); GUILD.partySize=(GUILD.partySize||1)+1; saveGuild(); return true; }
// ---- 隊形解鎖（除基礎三角 cost0 外，其餘用聲望買斷）----
function formationCost(i){ const f=FORMATIONS[i]; return (f&&f.cost)||0; }
// v5.1 隊形改「由上到下依序解鎖」：只有第一個天生可用，其餘必須先解鎖上一個才能買下一個
function formationUnlocked(i){ if(i===0) return true; return !!(GUILD.formationsUnlocked&&GUILD.formationsUnlocked[i]); }
function canUnlockFormation(i){ return i>0 && !formationUnlocked(i) && formationUnlocked(i-1) && canSpendRep(formationCost(i)); }
function unlockFormation(i){ if(!canUnlockFormation(i)) return false; spendRep(formationCost(i)); if(!GUILD.formationsUnlocked) GUILD.formationsUnlocked={}; GUILD.formationsUnlocked[i]=true; saveGuild(); return true; }
// ---- 馬匹解鎖（普通馬／均衡馬 cost0 免費，耐力/力量用聲望買斷）----
function horseCost(i){ const h=HORSES[i]; return (h&&h.cost)||0; }
// v5.5 馬車改「漸進式解鎖」：只有第一輛天生可用，必須依序購入、不能跳買最好的
function horseUnlocked(i){ if(i===0) return true; return !!(GUILD.horsesUnlocked&&GUILD.horsesUnlocked[i]); }
function canUnlockHorse(i){ return i>0 && !horseUnlocked(i) && horseUnlocked(i-1) && canSpendRep(horseCost(i)); }
function unlockHorse(i){ if(!canUnlockHorse(i)) return false; spendRep(horseCost(i)); if(!GUILD.horsesUnlocked) GUILD.horsesUnlocked={}; GUILD.horsesUnlocked[i]=true; saveGuild(); return true; }

// 某羈絆觸發（healInvuln/stunMark/killCdCut）是否生效：兩名成員都在出戰名單
function bondTriggerActive(trigger){ const act=new Set(activeRoster().map(i=>CLASS_ORDER[i]));
  return BONDS.some(b=>b.trigger===trigger && b.members.every(m=>act.has(m))); }

// ---- v0.8 馬匹專屬功能 ----
// ---- v0.8 工匠功能解鎖（項目化強化中 effect.feature 型）----
function hasUpgradeFeature(f){ return UPGRADES.some(u=>u.effect&&u.effect.feature===f&&upgradeOwned(u.id)); }
function hasCampstove(){ return hasUpgradeFeature('campstove'); }
function hasDeck2(){ return hasUpgradeFeature('deck2'); }
// ---- v0.8 升級 perk（依等級自動獲得功能，取代純堆血）----
const PERKS = { 3:{id:'swift',label:'疾行：出手速度 +12%'}, 5:{id:'startShield',label:'護身：每場開場護盾 +12'}, 7:{id:'extraUse',label:'熟練：技能每場多 1 次使用'} };
function perkAtLevel(lv){ return PERKS[lv]||null; }
function heroPerks(i){ const lv=(ROSTER[i]&&ROSTER[i].level)||1; const out={intervalMul:1, startShield:0, useBonus:0};
  Object.keys(PERKS).forEach(k=>{ if(lv>=+k){ const p=PERKS[k]; if(p.id==='swift')out.intervalMul*=0.88; if(p.id==='startShield')out.startShield+=12; if(p.id==='extraUse')out.useBonus+=1; } });
  return out; }

// ---- 隊形：站位（座標＋row）與站位加減成（取代固定羈絆）----
function currentFormation(){ return FORMATIONS[GUILD.formation||0] || FORMATIONS[0]; }
// 站位按「目前出戰人數」動態排列：每個職業的 row（前/中/後）決定 X，同排成員依人數平均分配 Y。
// 這樣 1~5 人都能排得好看，並修掉舊版「多人共用一套站位、多餘 slot 被忽略」的問題。
let _formLayoutCache={key:null,val:null};   // v2.4：站位結果快取（formationSlot 每次呼叫都會用到）
function formationLayout(){
  const _key=(GUILD.formation||0)+'|'+(GUILD.partySize||1)+'|'+activeRoster().join(',');
  if(_formLayoutCache.key===_key) return _formLayoutCache.val;
  const f=currentFormation();
  const present=activeRoster().map(i=>HERO_BASE[i].sprite).filter(sp=>f.slots&&f.slots[sp]);
  const out={};
  let custom=(f.cost||0)>=6;
  present.forEach(sp=>{ const s=f.slots[sp]||{}; if(typeof s.x!=='number'||typeof s.y!=='number') custom=false; });
  if(custom){ present.forEach(sp=>{ const s=f.slots[sp]; out[sp]={x:s.x, y:s.y, row:s.row||'back'}; }); _formLayoutCache={key:_key,val:out}; return out; }
  const rowX={front:335, mid:250, back:165};
  const byRow={front:[],mid:[],back:[]};
  present.forEach(sp=>{ const r=(f.slots[sp].row)||'back'; (byRow[r]=byRow[r]||[]).push(sp); });
  ['front','mid','back'].forEach(row=>{ const arr=byRow[row]||[]; const n=arr.length;
    arr.forEach((sp,k)=>{ const y = n<=1?360 : Math.round(248 + k*(224/(n-1)));
      out[sp]={x:rowX[row]||200, y, row}; }); });
  _formLayoutCache={key:_key,val:out};
  return out;
}
function formationSlot(sprite){ const f=currentFormation(); const base=(f.slots&&f.slots[sprite])||{row:'back'};
  const pos=formationLayout()[sprite];
  return Object.assign({x:200,y:360,row:base.row||'back'}, base, pos||{}); }
function formationMod(sprite){ const s=(currentFormation().slots||{})[sprite]||{}; return {atk:s.atk||0, def:s.def||0, hp:s.hp||0, heal:s.heal||0}; }


// ---- 後勤：工匠（階級0-3）與領隊 ----
function craftsmanTier(){ return GUILD.staff.craftsman||0; }
function craftsmanNextDef(){ const t=craftsmanTier(); return CFG.staff.craftsman[t]; }   // t=0→學徒…
function canUpgradeCraftsman(){ const d=craftsmanNextDef(); if(!d) return false; const c=(CFG.repCost.craftsman||[])[craftsmanTier()]; return c!=null && canSpendRep(c); }
function upgradeCraftsman(){ const d=craftsmanNextDef(); if(!d) return false; const c=(CFG.repCost.craftsman||[])[craftsmanTier()]; if(c==null||!spendRep(c)) return false; GUILD.staff.craftsman=craftsmanTier()+1; saveGuild(); return true; }
function hasLeader(){ return (GUILD.staff.leader||0)>0; }
// v5.2 領隊三級制：Lv1 沿途採集＋行前情報（天氣/地物預報）｜Lv2 隨行物件（每波佈置一件）｜Lv3 全滅斷後（戰利品不損失）
function leaderTier(){ return (GUILD.staff&&GUILD.staff.leader)||0; }
function leaderNextCost(){ const arr=(CFG.repCost.leaderTiers)||[3,5,8]; return arr[leaderTier()]; }
function canUpgradeLeader(){ const c=leaderNextCost(); return leaderTier()<3 && c!=null && canSpendRep(c); }
function upgradeLeader(){ if(leaderTier()>=3) return false; const c=leaderNextCost(); if(c==null||!spendRep(c)) return false; GUILD.staff.leader=leaderTier()+1; saveGuild(); return true; }
function leaderObjType(){ return (GUILD.leaderObj&&typeof BATTLE_OBJECTS!=='undefined'&&BATTLE_OBJECTS[GUILD.leaderObj])? GUILD.leaderObj : 'campfire'; }
function setLeaderObj(k){ GUILD.leaderObj=k; saveGuild(); }
// 相容舊呼叫
function canHireLeader(){ if(hasLeader()) return false; return canSpendRep(CFG.repCost.leader); }
function hireLeader(){ if(hasLeader()) return false; if(!spendRep(CFG.repCost.leader)) return false; GUILD.staff.leader=1; saveGuild(); return true; }

function xpNeed(lv){ return CFG.xp.base + lv*CFG.xp.perLevel; }
function gainXP(amount){
  const ups=[];
  if(RUN && !Array.isArray(RUN.pendingLevelups)) RUN.pendingLevelups=[];
  activeRoster().forEach(i=>{ const r=ROSTER[i]; r.xp+=amount;   // v1.0：等級無上限
    while(r.xp>=xpNeed(r.level)){ r.xp-=xpNeed(r.level); r.level++; ups.push(`${HERO_BASE[i].name} → Lv${r.level}`);
      if(RUN){ const sm=grantPlannedSkill(i, r.level); if(sm) ups.push('🎓 '+sm); }   // 大改版：依職業規劃表自動發放/升級，不再戰後三選一
      const pk=perkAtLevel(r.level); if(pk) ups.push(`✨ ${HERO_BASE[i].name} ${pk.label}`); }
  });
  return ups;
}
// ---- 大改版・職業規劃器：點數成本 / 驗證 / 升級自動發放 ----
function skillByName(sprite, name){ return (SKILLS[sprite]||[]).find(s=>s.name===name)||null; }
function skillLearnCost(sprite, name){ const s=skillByName(sprite,name); return s? (s.tier||1) : 0; }   // 習得：T1/2/3 = 1/2/3 點
function upgradeStepCost(nth, role){ return role==='ultimate' ? 10 : nth; }   // 大招升級固定 10 點；主動/被動第 n 次花 n 點
// 累計某職業配置表已花的點數（習得＋各次升級遞增）
function planSpent(sprite){ const plan=GUILD.classPlans&&GUILD.classPlans[sprite]; if(!plan||!plan.slots) return 0;
  let total=0; const ups={};
  plan.slots.forEach(s=>{ if(!s||!s.skill) return;
    if(s.act==='learn'){ total+=skillLearnCost(sprite,s.skill); }
    else if(s.act==='upgrade'){ ups[s.skill]=(ups[s.skill]||0)+1; total+=upgradeStepCost(ups[s.skill], (skillByName(sprite,s.skill)||{}).role); } });
  return total; }
const CLASS_POINT_BASE = 3;   // 起始基底點數（讓新玩家就能配最小 build）；其餘靠活著回來累加
function classPointCap(sprite){ return CLASS_POINT_BASE + ((GUILD.classPoints&&GUILD.classPoints[sprite])||0); }
// 配置合法性：總花費 ≤ 上限，且 大招 ≤1、主動小招 ≤3（被動不限）
function planValid(sprite){ const plan=GUILD.classPlans&&GUILD.classPlans[sprite]; if(!plan||!plan.slots) return true;
  if(planSpent(sprite)>classPointCap(sprite)) return false;
  const cnt={ultimate:0,active:0,passive:0}, seen={};
  for(const s of plan.slots){ if(!s||!s.skill||s.act!=='learn'||seen[s.skill]) continue; seen[s.skill]=true;
    const sk=skillByName(sprite,s.skill); const role=(sk&&sk.role)||'active';
    if(sk && !skillUnlocked(sprite,sk)) return false;   // v4.0：未達職業階級的技能不可配置（enforce 開啟時生效）
    cnt[role]=(cnt[role]||0)+1; }
  return cnt.ultimate<=1 && cnt.active<=3; }
// 升級到 lv（含 Lv1）時，依配置表 slots[lv-1] 靜默發放/升級該技能；回傳提示字串(或 null)
function grantPlannedSkill(idx, lv){ if(!ROSTER[idx]) return null; const sprite=HERO_BASE[idx].sprite;
  const plan=GUILD.classPlans&&GUILD.classPlans[sprite]; if(!plan||!plan.slots) return null;
  const slot=plan.slots[lv-1]; if(!slot||!slot.skill) return null;
  const _sk=skillByName(sprite, slot.skill); if(!_sk) return null;   // 被砍除的技能自動略過（＝自動退點）
  if(!skillUnlocked(sprite,_sk)) return null;   // v4.0：階級未達不發放
  if(!Array.isArray(ROSTER[idx].skills)) ROSTER[idx].skills=[];
  if(!ROSTER[idx].skillPlus) ROSTER[idx].skillPlus={};
  if(slot.act==='upgrade'){
    if(!ROSTER[idx].skills.includes(slot.skill)) return null;   // 尚未習得→不能升（合法配置不會發生）
    ROSTER[idx].skillPlus[slot.skill]=(ROSTER[idx].skillPlus[slot.skill]||0)+1;
    return `${HERO_BASE[idx].name} ${slot.skill} +${ROSTER[idx].skillPlus[slot.skill]}`;
  }
  if(ROSTER[idx].skills.includes(slot.skill)) return null;   // 已習得→略過
  ROSTER[idx].skills.push(slot.skill);
  return `${HERO_BASE[idx].name} 習得 ${slot.skill}`;
}
// 活著回來：依各出戰職業當趟最終等級，累加職業點數上限（規劃器預算成長；於 result 結算呼叫）
function classPointAwards(){ if(typeof RUN==='undefined'||!RUN||!RUN.heroes) return [];
  return RUN.heroes.map(h=>{
    const lv=(ROSTER[h.idx]&&ROSTER[h.idx].level)||1;
    return {sprite:h.sprite, name:h.name, points:lv};
  });
}
function awardClassPoints(){ const awards=classPointAwards();
  if(!GUILD.classPoints) GUILD.classPoints={};
  awards.forEach(a=>{ GUILD.classPoints[a.sprite]=(GUILD.classPoints[a.sprite]||0)+a.points; });
  return awards;
}
// 依「目前配置表＋目前等級」重建該職業本趟技能（idempotent）。修正：配置常在 initRun 之後才改，故每場開戰前重套。
function syncPlannedSkills(idx){ if(!ROSTER[idx]) return; const lv=ROSTER[idx].level||1;
  ROSTER[idx].skills=[]; ROSTER[idx].skillPlus={};
  for(let L=1; L<=lv; L++) grantPlannedSkill(idx, L); }
// ---- v0.9 升級三選一（已停用，保留供參考）：技能取得/強化 ----
function skillWithPlus(base, plus){ if(!plus) return base; const s=Object.assign({}, base);
  if(s.cd!==undefined){ s.uses=(s.uses||1)+plus; s.cd=Math.max(800, Math.round(s.cd*Math.pow(0.85,plus))); }
  if(s.mult!==undefined) s.mult=+(s.mult+0.2*plus).toFixed(2);
  if(s.frac!==undefined) s.frac=+(s.frac+0.1*plus).toFixed(2);
  if(s.amt!==undefined) s.amt=s.amt+4*plus;
  if(s.dur!==undefined) s.dur=s.dur+200*plus;
  s.plus=plus; return s; }
// v6.2 升級效益說明：依技能實際欄位＋戰鬥端專屬加成，算出「每 +1 級」的具體收益文字（職業規劃器顯示用）
function upgradeGain(s){
  if(!s) return '';
  const parts=[];
  if(s.cd!==undefined) parts.push('每場可施放次數 +1、冷卻 −15%');
  if(s.mult!==undefined) parts.push('傷害倍率 +'+((s.type==='stunAll'?0.4:0.2)).toFixed(1));   // 隕石術類：通用+0.2 再疊戰鬥端+0.2
  let fr=0; if(s.frac!==undefined) fr+=10;
  if(s.type==='reviveAlly') fr+=10;
  if(s.type==='mark') fr+=5;
  if(fr) parts.push((s.type==='mark'?'集火增傷':(s.type==='reviveAlly'?'復活血量':'效果比例'))+' +'+fr+'%');
  let amt=0; if(s.amt!==undefined) amt+=4;
  if(s.type==='teamBuff'||s.type==='debuffAll') amt+=3;
  if(s.type==='overload') amt+=4;
  if(amt) parts.push('效果數值 +'+amt);
  let dms=0; if(s.dur!==undefined) dms+=200;
  if(s.type==='overload') dms+=1200;
  if(s.type==='mark') dms+=1500;
  if(s.type==='berserk') dms+=1500;
  if(s.type==='gale') dms+=800;
  if(dms) parts.push('持續 +'+(dms/1000)+' 秒');
  if(s.type==='rageShout') parts.push('血怒攻擊上限 +4');
  if(s.type==='devotionWall') parts.push('護心堆疊上限 +2');
  if(s.type==='summon') parts.push('精靈體型提升');
  if(s.type==='transform') parts.push('變身體型提升');
  return parts.join('、') || '效果提升';
}
function equippedSkills(idx){ return Array.isArray(ROSTER[idx]&&ROSTER[idx].skills)?ROSTER[idx].skills:[]; }
// 回傳本次升級的 3 個選項：2 個新技能 ＋ 1 個強化已裝（無已裝則補第 3 個新技能）
function rollLevelChoices(idx){
  const sprite=HERO_BASE[idx].sprite, pool=(SKILLS[sprite]||[]);
  const eq=equippedSkills(idx);
  const avail=pool.filter(s=>!eq.includes(s.name)).slice();
  for(let i=avail.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=avail[i]; avail[i]=avail[j]; avail[j]=t; }
  const choices=[];
  avail.slice(0,2).forEach(s=>choices.push({type:'newSkill', name:s.name, label:'習得：'+s.name, desc:s.desc||''}));
  if(eq.length){ const up=eq[Math.floor(Math.random()*eq.length)]; choices.push({type:'upgrade', name:up, label:'強化：'+up, desc:'多 1 次使用 / 縮短冷卻 / 加強效果'}); }
  else if(avail[2]){ const s=avail[2]; choices.push({type:'newSkill', name:s.name, label:'習得：'+s.name, desc:s.desc||''}); }
  return choices;
}
// 套用一個升級選項；newSkill 滿 2 格時用 replaceName 指定替換（預設替換第 1 個）
function applyLevelChoice(idx, choice, replaceName){
  if(!choice||!ROSTER[idx]) return false;
  if(!Array.isArray(ROSTER[idx].skills)) ROSTER[idx].skills=[];
  if(!ROSTER[idx].skillPlus) ROSTER[idx].skillPlus={};
  if(choice.type==='upgrade'){ ROSTER[idx].skillPlus[choice.name]=(ROSTER[idx].skillPlus[choice.name]||0)+1; return true; }
  if(choice.type==='newSkill'){ const sk=ROSTER[idx].skills;
    if(sk.includes(choice.name)) return false;
    if(sk.length<2){ sk.push(choice.name); return true; }
    let ri = replaceName? sk.indexOf(replaceName) : 0; if(ri<0) ri=0; sk[ri]=choice.name; return true; }
  return false;
}
// ---- v1.0 遠征：單一戰鬥畫面，依「探險 %」推進的線性遭遇序列 ----
// Stage 2：戰鬥／精英／寶箱／營火／商人／事件，尾端接遺物守衛者（王）。
function initExpedition(){
  const t=(RUN&&RUN.destTier)||1;
  const pace=Math.min(4,t);   // v2.2：探險長度節奏封頂 4（第二世界 tier 5-8 沿用 4 的關卡量，難度交由敵人縮放，不讓路線過長）
  const plan=[]; const add=(type,n)=>{ for(let i=0;i<n;i++) plan.push(type); };
  add('battle', 4+pace); add('elite', Math.max(0,pace-1));
  add('chest', 1+Math.floor(pace/2)); add('event', 1+Math.floor(pace/2));
  // 洗牌（不含營火/商店；商店已併入營火）
  for(let i=plan.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const tmp=plan[i]; plan[i]=plan[j]; plan[j]=tmp; }
  if(plan[0]!=='battle'){ const bi=plan.indexOf('battle'); if(bi>0){ const tmp=plan[0]; plan[0]=plan[bi]; plan[bi]=tmp; } }  // 開場保證戰鬥
  // 營火固定：50% 處一個、王戰前一個（王在 plan 之後觸發；商店改在營火內用選的）
  plan.splice(Math.floor(plan.length/2)+1, 0, 'camp');   // 插入後再 push 王前營火 → 此營火恰在總長一半(≈50%)
  plan.push('camp');
  RUN.exped={ pct:0, plan, i:0 };
}
function initRun(){
  RUN=null;   // v4.5.1 修正：先清空再建構——否則 activeRoster() 在建構過程讀到舊試煉 RUN 的 trial 旗標，隊伍會被建成單人
  RUN = {
    diff:(typeof worldDiff==='function'? worldDiff() : 1),   // v4.6 本趟世界難度
    wagon: null,
    heroes: activeRoster().map(idx=>{ const h=HERO_BASE[idx];
      // 免洗隊伍：每趟重置為 Lv1、職業起始裝、技能清空（技能改由地城升級取得，P2）
      ROSTER[idx].level=1; ROSTER[idx].xp=0; ROSTER[idx].skills=[]; ROSTER[idx].skillPlus={};
      grantPlannedSkill(idx, 1);   // Lv1 配置格立即發放（每趟免洗起手）
      const weapon = startKitWeapon(idx);
      const armor  = startKitArmor(idx);
      ROSTER[idx].weapon=weapon.name; ROSTER[idx].armor=armor.name;
      return {...h, idx, weapon, armor, hp:0};
    }),
    cargo: [], slots: 0, gold: (CFG.gold? CFG.gold.stipendBase + (Math.max(1,(GUILD.partySize||1))-1)*CFG.gold.stipendPerParty : 0),
    isBoss:false, gotGear:{},   // v1.8：本趟已取得的裝備名稱（掉落去重用；每趟重置、不看永久收藏）
    itemLog:[],   // 物品異動紀錄（本趟；獲得／使用／捨棄／遺失），於物品欄檢視

    // v0.8 本趟一次性旗標（料理／馬匹／工匠功能）
    cookShield:0, reviveCharge:0, cookFirstCrit:false, pendingLevelups:[], _lvChoices:null, _lvReplace:null,
    deckExpanded:false,
    combatMs:0,   // DPS 分母：本趟累計交戰遊戲毫秒（每員 dmgDealt 隨新 heroes 物件自動歸零）
  };
}
// 物品異動紀錄：act = gain/use/discard/lost；item 可為物品物件或名稱字串；reason 為來源說明
function logItem(act, item, reason){
  if(typeof RUN==='undefined' || !RUN) return;
  if(!RUN.itemLog) RUN.itemLog=[];
  const isObj = item && typeof item==='object';
  const name = isObj ? (item.name||'') : (item||'');
  if(!name) return;
  const kind = isObj ? (item.kind||'') : '';
  const icon = (isObj && item.icon) || ({'武器':'⚔','防具':'🛡','道具':'🧪','遺物':'🏺','素材':'🧱','貴重物品':'💎'}[kind] || '📦');
  RUN.itemLog.push({ act, name, kind, icon, reason: reason||'', n: (RUN.itemLog.length+1) });
  if(RUN.itemLog.length>150) RUN.itemLog.shift();   // 上限，避免無限增長
}
// 起始裝：免洗隊每趟出發的基礎武防（P4 將依該職業 tier 升級）
function startKitWeapon(idx){ const h=HERO_BASE[idx]; return WEAPONS[h.defWeapon]; }
function startKitArmor(idx){ const h=HERO_BASE[idx]; return ARMORS[h.defArmor]; }
function heroStat(h){
  const lv=ROSTER[h.idx].level;
  // v0.9：技能＝本趟由升級三選一取得（最多 2 個，存 ROSTER.skills 名稱）；skillPlus 為強化次數
  const equipped = Array.isArray(ROSTER[h.idx].skills)? ROSTER[h.idx].skills : [];
  const plusMap = ROSTER[h.idx].skillPlus || {};
  let sk = equipped.map(name=>{ const base=(SKILLS[h.sprite]||[]).find(s=>s.name===name); return base? skillWithPlus(base, plusMap[name]||0) : null; }).filter(Boolean);
  let pdef=0, healB=0, patk=0, phpB=0;
  (sk||[]).forEach(s=>{ if(s.type==='atkBonus') patk+=s.amt||0; if(s.type==='defBonus') pdef+=s.amt||0; if(s.type==='hpBonus') phpB+=s.amt||0; });   // 大改版：被動數值技能（蠻力等）生效
  const bl=relicEffects();   // 遺物即時效果（數值部分；規則部分由戰鬥讀取）
  const tl=titleEffects();   // v2.0 稱號數值加成（atk/def/hp）
  const bo=formationMod(h.sprite); // 隊形站位加減成（取代固定羈絆）
  // 遺物・神王冠冕（寡兵越強）：每空一個出戰席位，全隊 ATK/DEF +3、HP +20
  let soloA=0,soloD=0,soloH=0;
  if(bl.soloBoost){ const empty=Math.max(0, CLASS_ORDER.length - activeRoster().length); soloA=3*empty; soloD=3*empty; soloH=20*empty; }
  const baseHp=HERO_BASE[h.idx].hp;   // 基礎血量取自職業設定（h.hp 是「當前血量」會變動，不能拿來算上限）
  // 攻防來源：武器/防具 ＋ 被動技能 ＋ 遺物 ＋ 寡兵；角色本身無基礎攻防，純等級只給 HP
  return {
    level:  lv,
    maxHp:  baseHp + h.growthHp*(lv-1) + bl.hp + bo.hp + phpB + soloH + tl.hp + (typeof rankHpBonus==='function'?rankHpBonus(h.sprite):0),   // 防具不再加血量（改給護盾）；v4.0 職業階級 HP 福利
    atkSeq: h.weapon.atkSeq.map(a=>a+bl.atk+bo.atk+patk+soloA+tl.atk+(h.growthAtk||0)*(lv-1)),
    def:    h.armor.def + pdef + bl.def + bo.def + soloD + tl.def,
    heal:   (h.weapon.heal? h.weapon.heal + healB + bo.heal + bl.heal : 0),
    skills: sk,
    armorShield: h.armor.shield||0,   // 回歸基本：防具＝防禦＋護盾
    weaponTrait: null, armorTrait: null,   // 裝備特殊效果已移除
  };
}


// ---- v0.9 物品圖鑑：每件物品的圖示與色彩、發現追蹤 ----
const ITEM_ICON = {
  // 道具
  '治療藥水':['potion','red'], '解毒劑':['potion','green'], '聖水':['potion','blue'], '回復卷軸':['scroll','gold'], '復活之種':['seed','violet'],
  // 貴重物品
  '碎銀錢袋':['coin','slate'], '古青銅幣':['coin','teal'], '寶石原石':['gem','blue'], '黃金聖盃':['coin','gold'], '失落王冠':['gem','gold'],
};
// v2.4：武器/防具圖示改由 data.js 的 vis 欄位衍生（單一資料來源）
WEAPONS.concat(ARMORS).forEach(g=>{ if(g.vis) ITEM_ICON[g.name]=g.vis; });
// v7.0 稀有度單一來源：依 lvReq 分帶（圖鑑/角色卡/商店/整裝 統一取色）
const GEAR_BY_NAME={}; WEAPONS.concat(ARMORS).forEach(g=>{ GEAR_BY_NAME[g.name]=g; });
function gearRarity(g){ const lv=(g&&g.lvReq)||1;
  return lv>=20?{name:'神話',accent:'red'} : lv>=14?{name:'傳說',accent:'gold'} : lv>=9?{name:'史詩',accent:'violet'} : lv>=5?{name:'稀有',accent:'blue'} : lv>=3?{name:'精良',accent:'green'} : {name:'普通',accent:'slate'}; }
// ---- 技能圖示：依機制給專屬 icon、依類型上色 ----
const SKILL_ICON = {
  '敲暈':'stun','震懾箭':'stun','割喉':'stun',
  '強擊':'smash','弱點射擊':'target','鷹眼':'eye','炎爆':'fireball','偷襲':'dagger','致命':'skull',
  '連射':'arrows','連刺':'dagger','連環施法':'sparkle',
  '群體治療':'heal','聖療':'heal','聖盾':'shield','神恩':'sparkle',
  '堅守':'reflect','鐵骨':'fortify','護體罩':'ward','奧術精通':'sparkle',
};
function skillVisual(s){ const name=(typeof s==='string')?s:(s&&s.name), type=(s&&s.type)||'';
  const icon = (s&&s.icon) || SKILL_ICON[name] || ({stun:'stun',crit:'smash',doubleHit:'arrows',groupHeal:'heal'}[type]) || 'sparkle';   // 技能自帶 icon 優先
  let acc='violet';
  if(type==='stun'||type==='stunAll') acc='gold';
  else if(type==='crit'||type==='critVsFull'||type==='critVsStunned'||type==='nuke') acc='red';
  else if(type==='doubleHit') acc='blue';
  else if(type==='transform'||type==='taunt'||type==='atkBuff') acc='ember';
  else if(type==='groupHeal'||type==='critHealLow'||type==='shieldOnHeal'||type==='cleanseOnHeal'||type==='lifesteal') acc='green';
  else if(type==='reflect'||type==='lowHpDef'||type==='deathSave'||type==='pierce'||type==='atkBonus') acc='blue';
  return {icon, accent:acc};
}
function itemVisual(name){ const v=ITEM_ICON[name]; if(!v) return {icon:'box', accent:'slate'};
  const g=GEAR_BY_NAME[name]; return g? {icon:v[0], accent:gearRarity(g).accent} : {icon:v[0], accent:v[1]}; }   // v7.0 裝備配色一律走稀有度分帶
const CONSUM_INFO = {
  '治療藥水':'回復全隊 30% HP', '解毒劑':'回復全隊 20% HP', '聖水':'回復全隊 50% HP',
  '回復卷軸':'回復全隊 60% HP', '復活之種':'復活陣亡成員（50% HP）',
};
// ---- 圖鑑：發現追蹤 ----
function discover(name){ if(!name) return; if(!GUILD.discovered) GUILD.discovered={}; if(!GUILD.discovered[name]){ GUILD.discovered[name]=true; saveGuild(); } }
// ---- 武器/防具唯一擁有：起手裝備永遠擁有；掉落取得後永久可裝；重複只能賣出 ----
function gearOwned(name){ const w=WEAPONS.find(x=>x.name===name); if(w&&w.starter) return true; const a=ARMORS.find(x=>x.name===name); if(a&&a.starter) return true; return !!(GUILD.owned&&GUILD.owned[name]); }
function ownGear(name){ if(!GUILD.owned) GUILD.owned={}; GUILD.owned[name]=true; discover(name); saveGuild();
  if(typeof RUN!=='undefined' && RUN){ if(!RUN.gotGear) RUN.gotGear={}; RUN.gotGear[name]=true; } }   // v1.8：另記「本趟已取得」供掉落去重
// v1.8 掉落去重改用「本趟冒險」範圍：不看永久收藏(GUILD.owned)，只看本趟已取得／持有／裝備中的裝備
function gearGotThisRun(name){ if(typeof RUN==='undefined'||!RUN) return false;
  if(RUN.gotGear && RUN.gotGear[name]) return true;
  if((RUN.cargo||[]).some(it=>it&&it.name===name)) return true;
  if((RUN.heroes||[]).some(h=>(h.weapon&&h.weapon.name===name)||(h.armor&&h.armor.name===name))) return true;
  return false; }
function syncEquippedGearCargo(){ if(typeof RUN==='undefined'||!RUN||!Array.isArray(RUN.cargo)||!Array.isArray(RUN.heroes)) return;
  const equipped={};
  RUN.heroes.forEach(h=>{
    if(h&&h.weapon&&h.weapon.name) equipped['武器|'+h.weapon.name]=true;
    if(h&&h.armor&&h.armor.name) equipped['防具|'+h.armor.name]=true;
  });
  RUN.cargo=RUN.cargo.filter(it=>{
    if(!(it&&(it.kind==='武器'||it.kind==='防具')&&equipped[it.kind+'|'+it.name])) return true;
    const gear=it.gear || (it.kind==='武器'?WEAPONS:ARMORS).find(g=>g.name===it.name);
    return !!(gear && gear.starter);
  });
}
// v7.0 掉落改「階梯制」：隨機選一名活著的隊員，固定給他「當前該部位裝備的下一階」（不跳級、不重複）
// 「當前」＝身上穿的與貨車裡他可用的取最高階，避免同一場連掉兩件同階；全員到頂 → 回 null（改給貴重物品）
function nextGearFor(sprite, kind, curLv){
  if(typeof RUN!=='undefined' && RUN && RUN.trial) return null;   // v9.2 試煉不掉/不賣裝備——難度以起始裝為準（掉落自動改給貴重物品、商店退回藥水商）
  const pool=(kind==='武器')?WEAPONS:ARMORS;
  const ok=g=> kind==='武器'? weaponClassOK(sprite,g) : armorClassOK(sprite,g);
  const ups=pool.filter(g=>ok(g) && (g.lvReq||1)>curLv).sort((a,b)=>(a.lvReq||1)-(b.lvReq||1));
  if(!ups.length) return null;
  const lv=ups[0].lvReq||1, same=ups.filter(g=>(g.lvReq||1)===lv);
  return same[Math.floor(Math.random()*same.length)];   // 同階多件（如重盔/板甲）隨機一件
}
function rollGear(kind){
  if(typeof RUN==='undefined' || !RUN || !RUN.heroes || !RUN.heroes.length) return null;
  const alive=RUN.heroes.filter(h=>h && h.hp>0);
  const cands=(alive.length?alive:RUN.heroes).slice().sort(()=>Math.random()-0.5);
  for(const h of cands){
    const cur=(kind==='武器'? h.weapon : h.armor);
    const okC=g=> kind==='武器'? weaponClassOK(h.sprite,g) : armorClassOK(h.sprite,g);
    const cargoLv=Math.max(0, ...((RUN.cargo||[]).filter(it=>it&&it.kind===kind&&it.gear&&okC(it.gear)).map(it=>it.gear.lvReq||1)), 0);
    const curLv=Math.max((cur&&cur.lvReq)||1, cargoLv);
    const g=nextGearFor(h.sprite, kind, curLv);
    if(g) return g;
  }
  return null;
}
// ---- 自動裝備：依職業＋等級，從『起始裝＋本趟撿到的』選最佳（v1.8 改為只看本趟）；開關 GUILD.settings.autoEquip（預設開）----
function autoEquipOn(){ const s=GUILD.settings||{}; return s.autoEquip!==false; }
function toggleAutoEquip(){ if(!GUILD.settings) GUILD.settings={}; GUILD.settings.autoEquip=!autoEquipOn(); saveGuild(); return GUILD.settings.autoEquip; }
function gearScore(kind,g){ return kind==='武器' ? (g.atkSeq.reduce((a,b)=>a+b,0)+(g.heal||0)) : ((g.def||0)*3+(g.shield||0)); }
function bestGear(sprite, kind, level, extras, fallback){
  const pool=(fallback?[fallback]:[]).concat(extras||[]), seen={};
  let best=null;
  pool.forEach(g=>{ if(!g || seen[g.name]) return; seen[g.name]=true;
    // v7.0 取消角色等級穿著限制：裝備等級純粹是階梯標示，掉到就能穿（掉落節奏由階梯制控管）
    if(!(kind==='武器'?weaponClassOK(sprite,g):armorClassOK(sprite,g))) return;
    if(!best || g.lvReq>best.lvReq || (g.lvReq===best.lvReq && gearScore(kind,g)>gearScore(kind,best))) best=g;   // 等級最高優先，同級比數值
  });
  return best;
}
function autoEquipRun(){ if(!autoEquipOn() || typeof RUN==='undefined' || !RUN || !RUN.heroes) return;
  if(!RUN.cargo) RUN.cargo=[];
  syncEquippedGearCargo();
  const autoPool=RUN.cargo.filter(it=>it&&(it.kind==='武器'||it.kind==='防具')&&it.gear);
  const takeCargo=(kind,name)=>{ const i=autoPool.findIndex(it=>it&&it.kind===kind&&it.name===name); if(i<0) return null;
    const it=autoPool[i]; autoPool.splice(i,1);
    const ci=RUN.cargo.indexOf(it); if(ci>=0) RUN.cargo.splice(ci,1);
    return it; };
  const putCargo=(kind,gear,icon,reason)=>{ if(!gear) return null; const it={kind, name:gear.name, icon, value:25, gear}; RUN.cargo.push(it); if(reason) logItem('unequip', it, reason); return it; };
  const cargoGears=(kind)=>autoPool.filter(it=>it&&it.kind===kind&&it.gear).map(it=>it.gear);
  const swap=(h,kind,slot,icon)=>{
    const cur=h[slot], level=(ROSTER[h.idx]&&ROSTER[h.idx].level)||1;
    const extras=(cur?[cur]:[]).concat(cargoGears(kind));
    const fallback=kind==='武器' ? startKitWeapon(h.idx) : startKitArmor(h.idx);
    const best=bestGear(h.sprite,kind,level,extras,fallback);
    if(best && (!cur || best.name!==cur.name)){
      const picked=best.starter ? {gear:best} : takeCargo(kind,best.name);
      if(picked && picked.gear){
        const old=cur; h[slot]=picked.gear;
        logItem('equip', {kind, name:picked.gear.name, icon, gear:picked.gear}, '自動裝備：'+h.name);
        if(old) putCargo(kind,old,icon,'換下：'+h.name);
      }
    }
  };
  RUN.heroes.forEach(h=>{ const oldMax=heroStat(h).maxHp;
    swap(h,'武器','weapon','⚔'); swap(h,'防具','armor','🛡');
    if(h.hp>0){ const newMax=heroStat(h).maxHp; if(newMax!==oldMax) h.hp=Math.max(1,Math.min(newMax, h.hp+(newMax-oldMax))); }   // 換裝時 HP 上限變動同步
  });
  syncEquippedGearCargo();
}
function itemDiscovered(name){ if(GUILD.discovered && GUILD.discovered[name]) return true;
  const w=WEAPONS.find(x=>x.name===name); if(w&&w.starter) return true; const a=ARMORS.find(x=>x.name===name); if(a&&a.starter) return true; return false; }
// 把目前持有／裝備中／貨車內的物品補登為已發現（回溯既有存檔）
function syncDiscovered(){ if(!GUILD.discovered) GUILD.discovered={}; if(!GUILD.owned) GUILD.owned={};
  const own=(n)=>{ if(!n) return; GUILD.owned[n]=true; GUILD.discovered[n]=true; };
  (ROSTER||[]).forEach(r=>{ own(r&&r.weapon); own(r&&r.armor); });
  if(typeof RUN!=='undefined' && RUN){ (RUN.cargo||[]).forEach(it=>{ if(it&&it.name) GUILD.discovered[it.name]=true; });
    (RUN.heroes||[]).forEach(h=>{ if(h.weapon) own(h.weapon.name); if(h.armor) own(h.armor.name); }); }
  saveGuild();
}
