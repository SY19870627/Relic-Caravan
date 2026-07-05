// ========================= v10.0 模擬實驗室 =========================
// 無後果試招沙盒：等級 1~20 可調（技能照規劃表發放、裝備自動配到該級最高階）、
// 天氣五選一、物件至多 3 件、對手＝三種木樁或任一地城怪物組（原始基礎值）。
// 不給經驗/掉落/聲望、不存檔、全滅不痛；戰後顯示各員總傷與 DPS。
class SimLab extends Phaser.Scene {
  constructor(){ super('SimLab'); }
  create(){
    if(!RUN || RUN.trial || RUN.sim) initRun();
    this.cfg = SimLab.last ? Object.assign({}, SimLab.last, {objs:SimLab.last.objs.slice()}) :
      {level:5, weather:'clear', objs:[], foe:'dummy', dummy:'soft', region:0, kind:'normal'};
    sceneBg(this,{glow:0x56d6c6});
    sceneHeader(this,'模 擬 實 驗 室','無後果試招：不給經驗與掉落、不存檔、全滅不痛',{accent:'teal'});
    button(this, 86, 30, 150, 30, '返回大廳', ()=>this.scene.start('GuildHall'), {variant:'info', size:13, icon:'home', iconSize:13});
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const add=o=>{this._ui.push(o);return o;}, W=this.scale.width, c=this.cfg;
    // ── 隊伍等級 ──
    add(txt(this, 60, 106, '隊伍等級', 13, UI.gold, 0, 0.5));
    [1,3,5,8,12,16,20].forEach((lv,i)=>{ const on=c.level===lv;
      add(button(this, 190+i*60, 106, 52, 26, 'Lv'+lv, ()=>{ c.level=lv; this.render(); }, {accent:on?'gold':'slate', size:11})); });
    add(button(this, 622, 106, 30, 26, '−', ()=>{ c.level=Math.max(1,c.level-1); this.render(); }, {accent:'slate', size:13}));
    add(txt(this, 668, 106, '現在 Lv'+c.level, 12.5, UI.white));
    add(button(this, 716, 106, 30, 26, '＋', ()=>{ c.level=Math.min(20,c.level+1); this.render(); }, {accent:'slate', size:13}));
    add(txt(this, 800, 106, '技能照規劃表發到該級', 9.5, UI.dim));
    // ── 天氣 ──
    add(txt(this, 60, 146, '天氣', 13, UI.gold, 0, 0.5));
    (WEATHERS||[]).forEach((w,i)=>{ const on=c.weather===w.id;
      add(button(this, 190+i*98, 146, 90, 26, w.icon+' '+w.name, ()=>{ c.weather=w.id; this.render(); }, {accent:on?'blue':'slate', size:11})); });
    // ── 物件（至多 3，超過自動汰舊）──
    add(txt(this, 60, 190, '物件', 13, UI.gold, 0, 0.5));
    add(txt(this, 60, 206, '至多 3 件', 9, UI.dim, 0, 0.5));
    const OBJS=['campfire','tree','statue','pool','rift','hive','gong','lantern','candles','crystal','totem','rackW'];
    OBJS.forEach((k,i)=>{ const def=BATTLE_OBJECTS[k]; if(!def) return;
      const on=c.objs.indexOf(k)>=0, col=i%6, row=Math.floor(i/6);
      add(button(this, 190+col*112, 190+row*32, 104, 26, (on?'✓':'')+def.icon+def.name, ()=>{
        const j=c.objs.indexOf(k);
        if(j>=0) c.objs.splice(j,1);
        else { if(c.objs.length>=3) c.objs.shift(); c.objs.push(k); }
        this.render();
      }, {accent:on?'ember':'slate', size:10})); });
    // ── 對手 ──
    add(txt(this, 60, 268, '對手', 13, UI.gold, 0, 0.5));
    const foes=[['soft','🎯 草靶木樁（無甲）'],['armored','🛡 鐵甲木樁（DEF30）'],['regen','💚 回復木樁（自癒）'],['group','⚔ 地城怪物組']];
    foes.forEach((f,i)=>{ const isGroup=f[0]==='group';
      const on=isGroup? c.foe==='group' : (c.foe!=='group' && c.dummy===f[0]);
      add(button(this, 250+i*172, 268, 164, 28, (on?'✓ ':'')+f[1], ()=>{
        if(isGroup){ c.foe='group'; } else { c.foe='dummy'; c.dummy=f[0]; }
        this.render();
      }, {accent:on?'red':'slate', size:11})); });
    // 真怪組細項：地城 ＋ 類型
    if(c.foe==='group'){
      add(txt(this, 60, 312, '地城', 12, UI.dim, 0, 0.5));
      DESTINATIONS.forEach((d,i)=>{ const on=(c.region||0)===i, col=i%4, row=Math.floor(i/4);
        add(button(this, 250+col*172, 312+row*32, 164, 26, (on?'✓ ':'')+d.name, ()=>{ c.region=i; this.render(); }, {accent:on?'violet':'slate', size:10.5})); });
      add(txt(this, 60, 386, '類型', 12, UI.dim, 0, 0.5));
      [['normal','一般'],['elite','精英'],['boss','首領']].forEach((kk,i)=>{ const on=(c.kind||'normal')===kk[0];
        add(button(this, 250+i*120, 386, 112, 26, (on?'✓ ':'')+kk[1], ()=>{ c.kind=kk[0]; this.render(); }, {accent:on?'red':'slate', size:11})); });
      add(txt(this, 620, 386, '每次隨機挑該區一組・原始基礎值', 9.5, UI.dim, 0, 0.5));
    }
    // ── 該等級技能預覽（v10.1：技能跟隨等級的即時檢視；未配置者紅字提醒）──
    const pv=activeRoster().map(idx=>{ const sp=HERO_BASE[idx].sprite, ls=this.planSkillsAt(sp, c.level);
      return HERO_BASE[idx].name+'：'+(ls.length? ls.join('、') : '未配置！'); });
    add(txt(this, 60, 424, 'Lv'+c.level+' 技能', 12, UI.gold, 0, 0.5));
    const pvT=add(txt(this, 190, 424, pv.join('　｜　'), 9.5, pv.some(s=>s.indexOf('未配置')>=0)?UI.red:UI.dim, 0, 0.5).setWordWrapWidth(660));
    if(pv.some(s=>s.indexOf('未配置')>=0)) add(txt(this, 190, 424+pvT.height+4, '↑ 有隊員規劃表沒配到技能——到「職業規劃」配置後再測', 9.5, UI.red, 0, 0));
    // ── 摘要＋開始 ──
    const objTxt=c.objs.length? c.objs.map(k=>BATTLE_OBJECTS[k]?BATTLE_OBJECTS[k].name:k).join('、') : '無';
    const foeTxt=c.foe==='group' ? ((DESTINATIONS[c.region||0]||{}).name+'・'+({normal:'一般',elite:'精英',boss:'首領'}[c.kind||'normal'])) :
      ({soft:'草靶木樁',armored:'鐵甲木樁',regen:'回復木樁'}[c.dummy||'soft']);
    add(txt(this, W/2, 462, ((WEATHER_BY_ID[c.weather]||{}).name||'晴')+'　·　物件：'+objTxt+'　·　對手：'+foeTxt, 11, UI.cyan));
    add(button(this, W/2, 502, 280, 50, '▶ 開始模擬', ()=>{
      SimLab.last=Object.assign({}, c, {objs:c.objs.slice()});
      initSimRun(SimLab.last);
      this.scene.start('Battle');
    }, {variant:'go', size:17, icon:'play', iconSize:16}));
  }
  // 依規劃表推算「該等級會擁有的技能」（+n＝升級次數）；與 grantPlannedSkill 同規則、不動 ROSTER
  planSkillsAt(sprite, lvl){
    const plan=GUILD.classPlans&&GUILD.classPlans[sprite]; if(!plan||!plan.slots) return [];
    const out=[], plus={};
    for(let L=1; L<=lvl; L++){ const s=plan.slots[L-1]; if(!s||!s.skill) continue;
      const sk=skillByName(sprite, s.skill); if(!sk || !skillUnlocked(sprite, sk)) continue;
      if(s.act==='upgrade'){ if(out.indexOf(s.skill)>=0) plus[s.skill]=(plus[s.skill]||0)+1; }
      else if(out.indexOf(s.skill)<0) out.push(s.skill); }
    return out.map(n=>n+(plus[n]?('+'+plus[n]):''));
  }
}
