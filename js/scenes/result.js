// ========================= 結算（v0.9 重塑）=========================
class Result extends Phaser.Scene {
  constructor(){ super('Result'); }
  create(data){
    const W=this.scale.width,H=this.scale.height;
    const o=data.outcome;
    let title,acc,note,keep;
    if(o==='clear'){ title='完整通關！'; acc='gold'; note='擊敗守護者，僅將遺物帶回公會'; keep=true; }
    else if(o==='retreat'){ title='撤退收工'; acc='teal'; note='見好就收，僅將已取得遺物帶回公會'; keep=true; }
    else { title='全員倒下'; acc='red'; note='傳送卷軸啟動 — 平安歸來，但本趟收穫全失'; keep=false; }
    const A=accent(acc);
    sceneBg(this,{glow:A.num});
    const t=txt(this,W/2,72,title,38,A.hex).setStroke('#07060f',6).setShadow(0,3,'#000',8,false,true);
    txt(this,W/2,118,note,14,UI.text);

    if(!keep){
      const p=panel(this,W/2,300,560,150,{accent:'red',title:'貨車戰利品全失',icon:'skull',titleSize:15});
      txt(this,W/2,p.bodyTop+18,'貨車與身上裝備都留在了地城深處…',15,UI.red);
      txt(this,W/2,p.bodyTop+44,'本趟不帶回遺物。',12,UI.dim);
      txt(this,W/2,p.bodyTop+74,'全員倒下不獲得職業點數。',13,UI.text);
      button(this,W/2,470,240,46,'回公會大廳',()=>{ initRun(); this.scene.start('GuildHall'); },{variant:'go',size:17,icon:'home',iconSize:16});
      return;
    }
    if(o==='clear' || o==='retreat'){ this.renderClear(o, acc); return; }   // 完整通關／撤退：只看角色血量＋獲得遺物
    const relics=RUN.cargo.filter(i=>i.kind==='遺物');
    const resources=RUN.cargo.filter(i=>i.kind==='素材');
    // 武器/防具：唯一擁有——新裝備納入收藏、重複只能賣出
    const gear=RUN.cargo.filter(i=>i.kind==='武器'||i.kind==='防具');
    this.gearNew=gear.filter(it=>!gearOwned(it.name)); this.gearDup=gear.filter(it=>gearOwned(it.name));
    this.others=RUN.cargo.filter(i=>i.kind==='道具'||i.kind==='貴重物品').sort((a,b)=> (a.kind==='貴重物品'?1:0)-(b.kind==='貴重物品'?1:0) || b.value-a.value);
    this.others.forEach(it=>{ if(it._keep===undefined) it._keep=(it.kind==='道具'); });

    const pnl=panel(this,W/2,346,720,356,{accent:acc,title:'戰利品結算　·　遺物入收藏、素材入庫、雜物登錄圖鑑',icon:'chest',titleSize:15});
    this.bodyTop=pnl.bodyTop;
    let yy=pnl.bodyTop+4;
    if(relics.length){ const rc=chip(this,0,yy+8,{label:'遺物 ×'+relics.length+'　'+relics.map(r=>r.name).join('、')+'　→ 入收藏後每趟永久生效',accent:'violet',icon:'relic',size:11,h:24}); rc.setX(W/2-rc.w/2); }
    else txt(this,W/2,yy+8,'（本趟沒有帶回遺物）',12,UI.faint);
    yy+=30;
    if(resources.length){ const rcc={}; resources.forEach(r=>rcc[r.name]=(rcc[r.name]||0)+1);
      const rs=chip(this,0,yy+8,{label:'素材　'+Object.keys(rcc).map(k=>k+'×'+rcc[k]).join('  ')+'　→ 自動入庫',accent:'teal',size:11,h:22}); rs.setX(W/2-rs.w/2); yy+=26; }
    if(this.gearNew.length||this.gearDup.length){
      const parts=[]; if(this.gearNew.length)parts.push('新裝備 '+this.gearNew.map(g=>g.name).join('、')+' 納入收藏'); if(this.gearDup.length)parts.push('重複 ×'+this.gearDup.length+'（已收藏）');
      const gs=chip(this,0,yy+8,{label:'裝備　'+parts.join('　·　'),accent:'gold',icon:'sword',size:11,h:22}); gs.setX(W/2-gs.w/2); yy+=26; }

    button(this, W/2-180, yy+12, 160, 28, '全部保留', ()=>{ this.others.forEach(it=>it._keep=true); this.renderList(); }, {variant:'go',size:12});
    button(this, W/2+180, yy+12, 160, 28, '全部捨棄', ()=>{ this.others.forEach(it=>it._keep=false); this.renderList(); }, {variant:'gold',size:12});
    this.listTop=yy+40;
    this.listGroup=[];
    this.renderList();
    button(this,W/2,524,240,42,'帶回公會',()=>{
      let newRelics=0;
      RUN.cargo.forEach(it=>{
        if(it.kind==='遺物'){ if(it.relicId && !GUILD.relics.includes(it.relicId)){ GUILD.relics.push(it.relicId); newRelics++; } }
        else if(it.kind==='素材'){ addMaterial(it.matId); }
        else if(it.kind==='食材'){ /* 食材為每趟隨身消耗，不帶回公會 */ }
        else { discover(it.name); } });   // 其餘戰利品：本趟已可在地城商店變現為 💰，回會不再入庫
      addRep((CFG.repEarn.perRelic||0)*newRelics + (CFG.repEarn.perReturn||0));   // 新遺物＋平安折返 → 賺聲望
      saveGuild(); initRun(); this.scene.start('GuildHall');
    },{variant:'go',size:17,icon:'home',iconSize:16});
  }
  // 完整通關／撤退精簡結算：角色血量 + 獲得遺物 + 職業點數（裝備/道具不帶回）
  renderClear(outcome, acc){
    const W=this.scale.width,H=this.scale.height;
    const relics=RUN.cargo.filter(i=>i.kind==='遺物');
    const heroes=RUN.heroes||[];
    const awards=(typeof classPointAwards==='function')?classPointAwards():[];
    const pTitle=(outcome==='retreat'?'撤退收工':'凱旋歸來')+'　·　隊伍狀態、遺物與職業點數';
    const pnl=panel(this,W/2,308,760,316,{accent:acc||'gold',title:pTitle,icon:'star',titleSize:15});
    txt(this,W/2,pnl.bodyTop+6,'隊員血量',12,UI.dim);
    const n=Math.max(1,heroes.length), cw=Math.min(150,Math.floor(700/n)), x0=W/2-(n*cw)/2+cw/2, y=pnl.bodyTop+44;
    heroes.forEach((h,i)=>{ const s=heroStat(h), mx=s.maxHp, hp=Math.max(0,Math.round(h.hp||0)), alive=hp>0, cx=x0+i*cw;
      this.add.image(cx,y,h.sprite).setScale(2.4).setAlpha(alive?1:0.35);
      txt(this,cx,y+40,h.name,13, alive?UI.gold:UI.dim);
      statBar(this,cx-52,y+60,104,8,hp,mx,{accent:alive?'green':'red'});
      txt(this,cx,y+76,alive?(hp+' / '+mx):'倒下',11, alive?UI.green:UI.red);
    });
    const ry=pnl.bodyTop+176;
    if(relics.length){
      txt(this,W/2,ry,'獲得遺物 ×'+relics.length+'　→ 入收藏後每趟永久生效',13,UI.violet);
      txt(this,W/2,ry+24,relics.map(r=>(r.icon||'')+' '+r.name).join('　'),12,UI.text).setWordWrapWidth(700);
    } else txt(this,W/2,ry+8,'本趟未帶回遺物',12,UI.faint);
    const py=ry+62;
    if(awards.length){
      txt(this,W/2,py,'職業點數 +' + awards.reduce((a,b)=>a+b.points,0) + '　' + awards.map(a=>a.name+' +'+a.points).join('　'),12,UI.gold).setWordWrapWidth(700);
    }
    txt(this,W/2,478,'武器、防具、道具與貴重物品不帶回公會',11,UI.dim);
    // v1.5 連續遠征（4 地城接力）：通關後若仍有更深的地城，可選擇「繼續深入」接續下一地城（戰利品先入庫、全隊回滿、難度遞增）
    // v2.2：「繼續深入」僅限同一世界內（第一世界第 4 關不會接到第二世界；跨世界需回地圖用聲望解鎖）
    const di=(RUN.destIndex||0), hasNext=(outcome==='clear' && di+1<DESTINATIONS.length && worldOfDest(di+1)===worldOfDest(di));
    if(hasNext){
      const nx=DESTINATIONS[di+1];
      txt(this, W/2, 492, '繼續深入：遺物先送回公會，貨車物品只在本趟續征中保留；最終回會只帶回遺物（階級 '+nx.tier+'）', 11, UI.dim);
      button(this, W/2-150, 526, 280, 46, '繼續深入 · '+nx.name, ()=>this.continueToNext(di+1), {variant:'go', size:16, icon:'play', iconSize:16});
      button(this, W/2+150, 526, 280, 46, '帶回公會（結束）', ()=>this.bankAndReturn(), {variant:'gold', size:15, icon:'home', iconSize:15});
    } else {
      button(this,W/2,526,260,46,'帶回公會',()=>this.bankAndReturn(),{variant:'go',size:17,icon:'home',iconSize:16});
    }
  }
  bankAndReturn(){
    let newRelics=0;
    RUN.cargo.forEach(it=>{
      if(it.kind==='遺物'){ if(it.relicId && !GUILD.relics.includes(it.relicId)){ GUILD.relics.push(it.relicId); newRelics++; } }
    });
    addRep((CFG.repEarn.perRelic||0)*newRelics + (CFG.repEarn.perReturn||0));
    awardClassPoints();   // 大改版：活著回來 → 依各出戰職業當趟最終等級累加職業點數上限
    saveGuild(); initRun(); this.scene.start('GuildHall');
  }
  // 連續遠征：通關後接續下一地城。遺物先送回公會；其他貨車物品只在本趟續征中暫存，不會於最終回會帶回。
  continueToNext(nextIndex){
    let newRelics=0;
    // 續征：只把「遺物」先送回公會；裝備・道具・貴重物品暫留貨車供下一地城使用
    RUN.cargo.forEach(it=>{
      if(it.kind==='遺物'){ if(it.relicId && !GUILD.relics.includes(it.relicId)){ GUILD.relics.push(it.relicId); newRelics++; } if(typeof logItem==='function') logItem('bank', it, '送回公會'); }
    });
    addRep((CFG.repEarn.perRelic||0)*newRelics);   // 續征：先給新遺物聲望；平安折返獎勵留到最終帶回公會時再給
    RUN.cargo = RUN.cargo.filter(it=> it.kind!=='遺物' && it.kind!=='素材' && it.kind!=='食材');   // 遺物已送回公會；其他物品只供續征使用
    const nx=DESTINATIONS[nextIndex]||DESTINATIONS[DESTINATIONS.length-1];
    RUN.destIndex=nextIndex; RUN.destTier=nx.tier; RUN.destName=nx.name;   // 推進到更深、更高階的地城
    RUN.wiped=false;
    RUN.heroes.forEach(h=>{ h.hp=heroStat(h).maxHp; });   // 全隊回滿再出發
    initExpedition();                              // 依新階級重建遠征路線（重置探險 %）
    saveGuild();
    this.scene.start('Battle');
  }
  renderList(){
    const W=this.scale.width;
    if(this.listGroup) this.listGroup.forEach(o=>o.destroy());
    this.listGroup=[];
    let y=this.listTop; const cap=6;
    if(!this.others.length) this.listGroup.push(txt(this,W/2,y+6,'沒有其他雜物',13,UI.dim));
    this.others.slice(0,cap).forEach(it=>{
      const gear=(it.kind==='武器'||it.kind==='防具'), row=this.add.graphics();
      row.fillStyle(it._keep?0x1f2c22:UI.panelN, 0.9); row.fillRoundedRect(W/2-330,y-15,660,30,8);
      row.lineStyle(1.5, it._keep?UI.greenN:UI.lineN, 0.7); row.strokeRoundedRect(W/2-330,y-15,660,30,8);
      this.listGroup.push(row);
      this.listGroup.push(icon(this, W/2-312, y, gear?(it.kind==='武器'?'sword':'shield'):(it.kind==='貴重物品'?'coin':'flame'), 15, gear?UI.tealN:UI.goldN));
      this.listGroup.push(txt(this,W/2-296,y,it.name,13, gear?UI.teal:UI.text,0));
      this.listGroup.push(txt(this,W/2-120,y,it.kind,11,UI.dim,0));
      this.listGroup.push(txt(this,W/2-10,y,'價值 '+it.value,11,UI.green,0));
      this.listGroup.push(button(this, W/2+255, y, 120,26, it._keep?'保留':'捨棄', ()=>{ it._keep=!it._keep; this.renderList(); },
        {variant: it._keep?'go':'gold', size:12}));
      y+=36;
    });
    if(this.others.length>cap){ this.listGroup.push(txt(this,W/2,y,'…及其餘 '+(this.others.length-cap)+' 件（依目前設定處理）',11,UI.dim)); y+=22; }
    const kept=this.others.filter(i=>i._keep); const keptVal=kept.reduce((a,b)=>a+b.value,0);
    this.listGroup.push(txt(this,W/2, 488, '保留 '+kept.length+' 件（價值 '+keptVal+'）',13,UI.green));
  }
}
