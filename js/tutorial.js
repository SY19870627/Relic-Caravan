// ========================= 新手教學 =========================
// 公會大廳高亮引導 → 出發整備 → 世界地圖 → 第一場戰鬥說明（暫停中）；各功能畫面第一次進入各跳一句提示。
// 進度另存一個 localStorage key（不併入公會存檔，舊存檔不受影響）：{hall:true, battle:true, RecruitHall:true, ...}
// 「略過教學」＝整套標成看過；「關於」視窗的「重看教學」與「重置存檔」都會把旗標清空。
const TUT_KEY = 'relicCaravanTutorial_v1';
const TUT_IDS = ['hall','outfit','worldmap','battle','return',
  'RecruitHall','FormationHall','QuestHall','TrialHall','WagonHall','SkillTreeHall','WarehouseHall','SimLab'];
// 各功能畫面第一次進入的一句提示（內容對照各畫面實際功能）
const TUT_TIPS = {
  RecruitHall:   {title:'招募所', accent:'teal', text:'花聲望解鎖新隊員，出戰隊伍最多 5 人。\n「後勤」分頁可以聘工匠和領隊，他們不佔出戰名額。'},
  FormationHall: {title:'隊形', accent:'violet', text:'選站位陣形，每個位置有攻防加減成；前排容易被集火，後排比較安全。\n新隊形要花聲望，由上往下依序解鎖。'},
  QuestHall:     {title:'任務 / 懸賞', accent:'gold', text:'探險時打倒的怪物會累計，達標就能來這裡領聲望和稱號。\n稱號一解鎖就生效，不用另外裝備。'},
  TrialHall:     {title:'試煉之間', accent:'red', text:'讓一名已招募的隊員單人挑戰關卡。\n通關可以晉升職業階級、解鎖新技能；失敗沒有懲罰。'},
  WagonHall:     {title:'商隊工坊', accent:'ember', text:'換馬車會改變貨格和遺物龕的格數；聘了工匠之後，可以用素材和聲望做強化。\n遺物要搬上遺物龕才會生效：在大廳點已收藏的遺物就能上車／卸下。'},
  SkillTreeHall: {title:'職業規劃', accent:'violet', text:'替每個職業排好技能表，探險中升級時會照表自動學技能。\n可用點數靠「活著回來」累積。'},
  WarehouseHall: {title:'圖鑑', accent:'blue', text:'拿到過的武器、防具、道具、貴重物品會登錄在這裡。\n「物件」「怪物」分頁可以查戰場物件和怪物的說明。'},
  SimLab:        {title:'模擬實驗室', accent:'teal', text:'自由選等級、天氣、物件和對手來試打。\n不給經驗和掉落、不存檔，全滅也沒有損失。'},
};

const Tutorial = {
  _s:null,
  _load(){
    if(this._s) return this._s;
    let s=null; try{ s=JSON.parse(localStorage.getItem(TUT_KEY)); }catch(e){}
    if(!s || typeof s!=='object'){
      s={};
      // 舊存檔相容：第一次載入本版時，已有進度（拿過聲望或遺物）的玩家視為老手，不自動播教學（仍可從「關於」重看）
      if(typeof GUILD!=='undefined' && GUILD && ((GUILD.repEarned||0)>0 || (GUILD.relics||[]).length>0)) TUT_IDS.forEach(k=>{ s[k]=true; });
      this._s=s; this._save();
    }
    this._s=s; return s;
  },
  _save(){ try{ localStorage.setItem(TUT_KEY, JSON.stringify(this._s||{})); }catch(e){} },
  seen(id){ return !!this._load()[id]; },
  mark(id){ this._load()[id]=true; this._save(); },
  skipAll(){ const s=this._load(); TUT_IDS.forEach(k=>{ s[k]=true; }); this._save(); },
  reset(){ this._s={}; this._save(); },   // 存成空物件（而非刪除 key），避免之後被誤判為老手

  // 「關於」視窗的「重看教學」：清旗標；在公會/功能畫面就直接回大廳重播，探險中則等回到大廳再播
  replay(msgEl){
    this.reset();
    const g=window.__GAME, sm=g&&g.scene;
    const busy=!sm || ['Boot','Battle','Result'].some(k=>sm.isActive(k));
    if(busy){ if(msgEl) msgEl.textContent='教學已重置，回到公會大廳時會重新播放。'; return; }
    if(msgEl) msgEl.textContent='';
    const dlg=document.getElementById('aboutDlg'); if(dlg) dlg.classList.remove('open');
    const cur=sm.getScenes(true)[0];
    if(cur && cur.scene.key==='GuildHall') cur.scene.restart();
    else if(cur) cur.scene.start('GuildHall');
  },

  // 由 main.js 在遊戲 ready 時掛上：各場景 create 完成後檢查要不要播
  attach(game){
    const hook=(key,fn)=>{ const sc=game.scene.getScene(key); if(!sc) return;
      sc.events.on('create',()=>{ try{ fn(sc); }catch(e){ if(window.console) console.warn('tutorial',e); } }); };
    hook('GuildHall', sc=>this.onHall(sc));
    hook('Outfit',    sc=>this.onOutfit(sc));
    hook('WorldMap',  sc=>this.onWorldMap(sc));
    hook('Battle',    sc=>this.onBattle(sc));
    Object.keys(TUT_TIPS).forEach(k=>hook(k, sc=>this.tip(sc,k)));
  },

  // ---------- 各畫面的教學內容 ----------
  onHall(sc){
    const R=sc._tutRef; if(!R) return;
    if(!this.seen('hall')){
      const re=(CFG.repEarn||{});
      this.tour(sc,'hall',[
        {targets:()=>[this.rBtn(R.go)], pass:true, title:'歡迎來到公會大廳',
         text:'第一趟不用管下面那些卡，直接按「前往整備出發」就好。\n出發前先花幾秒看完重點，按「下一步」。'},
        {targets:()=>[R.relic], title:'只有遺物會帶回公會',
         text:'探險撿到的裝備、道具、貴重物品，都不會帶回公會。\n打倒地城盡頭的守護者會掉遺物，平安回來就收進這裡。\n貨車滿了就裝不下遺物，記得留一格；全員倒下的話，這趟收穫全失。'},
        {targets:()=>[this.rChip(R.rep), this.rBtn(R.recruit)], title:'聲望與招募所',
         text:'平安回來會拿到聲望 ⭐（平安回來 +'+(re.perReturn||0)+'，每件新遺物再 +'+(re.perRelic||0)+'）。\n世界地圖上更遠的地城，要「累計拿到」的聲望夠多才會開放；之後就算把聲望花掉，已開放的地城也不會再鎖回去。\n到「招募所」花聲望，可以多帶一名隊員。'},
        {targets:()=>[this.rBtn(R.go)], pass:true, title:'準備出發', last:'知道了',
         text:'其他功能第一次打開時，會跳一句簡短說明。\n想重看教學，到「關於」（手機在右下角的 i）按「重看教學」。'},
      ]);
      return;
    }
    // 第一次帶著聲望回到大廳：提醒招募所與新地城（數字取自實際設定）
    if(!this.seen('return') && repEarned()>0){
      const parts=[];
      if((GUILD.partySize||1)<5 && partySlotCost()!=null) parts.push('到「招募所」花聲望可以多帶一名隊員（下一位要 ⭐'+partySlotCost()+'）。');
      const nx=DESTINATIONS.find(d=>d.repReq>repEarned());
      if(nx) parts.push('累積聲望到 ⭐'+nx.repReq+'，世界地圖會開放「'+nx.name+'」。');
      if(!parts.length){ this.mark('return'); return; }
      this.tour(sc,'return',[{targets:()=>[this.rChip(R.rep), this.rBtn(R.recruit)], title:'歡迎回來', last:'知道了', noSkip:true,
        text:'這趟的聲望已經入帳，目前 ⭐'+reputation()+'。\n'+parts.join('\n')}]);
    }
  },
  onOutfit(sc){
    if(this.seen('outfit') || !sc._tutGo) return;
    this.tour(sc,'outfit',[{targets:()=>[this.rBtn(sc._tutGo)], pass:true, title:'出發整備', last:'知道了',
      text:'每一趟隊伍都從 Lv1、職業起始裝備開始。\n這趟撿到的裝備、道具、貴重物品都不會帶回公會，只有遺物會。\n「本趟商隊」的貨格，就是貨車能裝幾件東西。確認好就按「出發探險」。'}]);
  },
  onWorldMap(sc){
    if(this.seen('worldmap') || !sc._tutNear) return;
    this.tour(sc,'worldmap',[{targets:()=>[this.rBtn(sc._tutNear)], pass:true, title:'選擇目的地', last:'知道了',
      text:'第一次先去「近郊遺跡」，按「前往」出發。\n越遠的地城越危險，要累積聲望才會開放。'}]);
  },
  onBattle(sc){
    if(this.seen('battle') || typeof RUN==='undefined' || !RUN || RUN.trial || RUN.sim) return;
    // 等敵人進場、畫面就緒後再暫停說明；玩家若已自行暫停/查看資訊，等關掉再播
    const tryShow=()=>{ if(!sc.sys.isActive() || this.seen('battle')) return;
      if(sc.over || sc._menuPaused || sc.infoUI || sc._targetUI){ sc.time.delayedCall(400, tryShow); return; }
      this._battleTour(sc); };
    sc.time.delayedCall(900, tryShow);
  },
  _battleTour(sc){
    // 與 showInfo 相同的暫停方式（邏輯＋tween＋計時器一起凍結）；佔住 infoUI 讓暫停鍵/鎖定選單在說明期間不會開啟
    if(sc._tutOn) return;
    const marker={destroy(){}};
    sc.paused=true; sc.tweens.pauseAll(); sc.time.paused=true; sc.infoUI=marker;
    // 「遭遇敵人！」等橫幅會從暗幕下透出、卡在說明框邊緣，說明期間先藏起來
    const bn=sc.banner, bnVis=!!(bn && bn.visible); if(bn) bn.setVisible(false);
    const resume=()=>{ if(bn && bn.active) bn.setVisible(bnVis); if(sc.infoUI!==marker) return; sc.infoUI=null;
      if(!sc._menuPaused){ sc.paused=false; sc.tweens.resumeAll(); sc.time.paused=false; } };
    const pb=sc._pctBox||{x:18,y:16,w:650,h:12};
    this.tour(sc,'battle',[
      {title:'戰鬥會自動進行',
       text:'隊員會自己出手、放技能，不用操作。\n點角色或敵人可以看數值和技能（看的時候戰鬥會暫停）。\n戰場上的巨木、營火等物件會影響戰鬥，作用可以到大廳的「圖鑑」→「物件」查。'},
      {targets:()=>[this.rBtn(sc.targetBtn)], title:'🎯 鎖定順序',
       text:'決定隊員優先打哪個敵人。按下去會暫停，用 ▲▼ 排順序：低血、治療者、後排、前排、低防、狀態。\n按鈕上顯示的是排第一的那一項。'},
      {targets:()=>[this.rBtn(sc.sipBtn)], title:'💧 自動喝水',
       text:'隊員血量低於門檻，就會自動從貨車喝一瓶補血藥水（先喝效果最弱的），只補那一個人。\n點一下切換門檻：<30% → <50% → <100% → 關。'},
      {targets:()=>[this.rBtn(sc.pauseBtn), this.rBtn(sc.speedBtn)], title:'暫停與速度',
       text:'⏸ 暫停可以調自動喝水、自動裝備、清晰節奏，也能開整裝和物品欄（鍵盤 Esc 或 P 也行）。\n速度可以切 x1 → x2 → x4。'},
      {targets:()=>[{x:pb.x-8, y:pb.y-8, w:pb.w+16, h:52}], title:'探險進度與貨格', last:'開始戰鬥',
       text:'探險 % 走到底會遇到守護者，打倒它才會掉遺物，而且只有遺物會帶回公會。\n💰 是這趟的金幣，🧪 是補血藥水數量，📦 是貨格（已用 / 上限）。\n路上的營火可以「撤退收工」，平安回公會。'},
    ], {onClose:resume});
  },

  // ---------- 位置工具 ----------
  rBtn(b){ if(!b||!b._hit) return null; const w=b._hit.width, h=b._hit.height; return {x:b.x-w/2, y:b.y-h/2, w, h}; },
  rChip(c){ if(!c) return null; return {x:c.x, y:c.y-c.h/2, w:c.w, h:c.h}; },
  _minHit(scene){ const ds=scene.scale.displayScale; const k=(ds&&ds.y)||1; return Math.min(72, Math.max(38, Math.ceil(44*k))); },   // 手機上至少約 44 CSS px
  // 說明框放大倍率：畫面縮得越小放得越大，讓內文至少約 13 CSS px（桌機 =1，外觀不變）
  _uiScale(scene){ const ds=scene.scale.displayScale; const k=(ds&&ds.y)||1; return Math.max(1, Math.min(1.6, k*13/14)); },
  // 中文逐字斷行（Phaser 內建換行只認空白）；避免標點落在行首
  _wrap(str,size,maxW){
    const c=this._ctx||(this._ctx=document.createElement('canvas').getContext('2d'));
    c.font=size+'px "Noto Sans TC","Microsoft JhengHei",sans-serif';
    const noStart='，。、！？；：）」』》…・%';
    return String(str).split('\n').map(par=>{ const out=[]; let line='';
      for(const ch of par){ if(line && c.measureText(line+ch).width>maxW && noStart.indexOf(ch)<0){ out.push(line); line=ch; } else line+=ch; }
      out.push(line); return out.join('\n'); }).join('\n');
  },
  // 說明框擺在高亮區的上下左右，必須整個在畫面內、且不蓋到任何高亮區
  _place(holes, bw, bh, W, H){
    const M=8, G=12, clampX=x=>Math.max(M, Math.min(W-M-bw, x)), clampY=y=>Math.max(M, Math.min(H-M-bh, y));
    if(!holes.length) return {x:(W-bw)/2, y:(H-bh)/2};
    const u={x:Math.min(...holes.map(h=>h.x)), y:Math.min(...holes.map(h=>h.y))};
    u.r=Math.max(...holes.map(h=>h.x+h.w)); u.b=Math.max(...holes.map(h=>h.y+h.h));
    const cands=[], add=(cx,y)=>cands.push({x:clampX(cx-bw/2), y});
    [{x:u.x,y:u.y,w:u.r-u.x,h:u.b-u.y}].concat(holes).forEach(h=>{ const cx=h.x+h.w/2;
      add(cx, h.y+h.h+G); add(cx, h.y-G-bh);
      cands.push({x:h.x+h.w+G, y:clampY(h.y+h.h/2-bh/2)}); cands.push({x:h.x-G-bw, y:clampY(h.y+h.h/2-bh/2)}); });
    cands.push({x:(W-bw)/2, y:(H-bh)/2});
    const hit=(c,h)=> c.x<h.x+h.w && c.x+bw>h.x && c.y<h.y+h.h && c.y+bh>h.y;
    for(const c of cands){ if(c.x<M-0.5||c.y<M-0.5||c.x+bw>W-M+0.5||c.y+bh>H-M+0.5) continue; if(holes.some(h=>hit(c,h))) continue; c.ok=true; return c; }
    return {x:(W-bw)/2, y:clampY(u.b+G), ok:false};
  },
  // 教學用按鈕：沿用 ui.js 的 button() 外觀，另加一層夠大的觸控區（手機 ≥ 約 44px）
  _btn(scene, x, y, w, h, label, cb, opt, hitH){
    const b=button(scene, x, y, w, h, label, null, opt);
    b._hit.disableInteractive();
    const z=scene.add.zone(0, 0, w+8, Math.max(h, hitH)).setInteractive({useHandCursor:true}); b.add(z);
    let down=false;
    z.on('pointerover',()=>b._hit.emit('pointerover')).on('pointerout',()=>{ down=false; b._hit.emit('pointerout'); });
    z.on('pointerdown',p=>{ down=true; scene.tweens.add({targets:b,scaleX:0.96,scaleY:0.96,duration:55,yoyo:true}); if(!_isTouchPtr(p)) cb(); });
    z.on('pointerup',p=>{ if(down && _isTouchPtr(p) && !_isTouchDrag(p)) cb(); down=false; });
    return b;
  },
  // 說明框（ui.js panel 樣式＋左側色條）：回傳尚未定位的 builder
  // o.full：框寬撐到畫面寬（擺不下時改用較矮的寬框）
  _box(scene, o){
    const s=this._uiScale(scene), W=scene.scale.width, R=v=>Math.round(v*s);
    const bw=o.full? W-16 : Math.min(W-16, R(o.w||470)), pad=Math.round(16*Math.min(s,1.25)), ac=accent(o.accent||'gold'), hitH=this._minHit(scene);
    const btnH=R(38), hasBtn=!!(o.buttons&&o.buttons.length), rowH=hasBtn? Math.max(40, btnH+2, hitH) : 0;
    const fs=R(14), title=txt(scene, 0, 0, o.title||'', R(17), ac.hex, 0, 0);
    const body=txt(scene, 0, 0, this._wrap(o.text||'', fs, bw-pad*2-12), fs, UI.text, 0, 0).setLineSpacing(R(5));
    const small=s>1? R(12) : 11;   // 頁碼／頁尾小字：手機上也要看得清楚
    const foot=o.foot? txt(scene, 0, 0, o.foot, small, UI.faint, 0.5, 0) : null;
    const bh=Math.round(pad+title.height+R(8)+body.height+(foot?R(10)+foot.height:0)+(hasBtn?R(12)+rowH:0)+pad-2);
    return { bw, bh, discard:()=>{ title.destroy(); body.destroy(); if(foot) foot.destroy(); }, build:(x,y,depth)=>{
      const c=scene.add.container(x+bw/2, y+bh/2).setDepth(depth);
      c.add(panel(scene, 0, 0, bw, bh, {accent:o.accent||'gold'}));
      const bar=scene.add.graphics(); bar.fillStyle(ac.num,1); bar.fillRoundedRect(-bw/2,-bh/2,5,bh,{tl:14,bl:14,tr:0,br:0}); c.add(bar);
      const left=-bw/2+pad+6; let yy=-bh/2+pad;
      title.setPosition(left, yy); c.add(title);
      if(o.step) c.add(txt(scene, bw/2-pad, yy+3, o.step, small, UI.faint, 1, 0));
      yy+=title.height+R(8); body.setPosition(left, yy); c.add(body); yy+=body.height;
      if(foot){ yy+=R(10); foot.setPosition(0, yy); c.add(foot); yy+=foot.height; }
      if(hasBtn){ const by=bh/2-pad+2-rowH/2;
        const btns=o.buttons, bwid=R(136), gap=12; let bx=bw/2-pad-bwid/2;
        for(let i=btns.length-1;i>=0;i--){ const d=btns[i], bo=Object.assign({}, d.opt||{}); bo.size=R(bo.size||15);
          c.add(this._btn(scene, d.alignLeft? (-bw/2+pad+6+bwid/2) : bx, by, bwid, btnH, d.label, d.cb, bo, hitH));
          if(!d.alignLeft) bx-=bwid+gap; } }
      return c; } };
  },

  // ---------- 多步高亮引導 ----------
  // steps[i]：{targets:()=>[rect...], pass:是否讓高亮區可直接點（例如「前往整備出發」）, title, text, last:最後一步按鈕字, noSkip}
  tour(scene, id, steps, opt){
    opt=opt||{}; if(scene._tutOn) return; scene._tutOn=true;
    const W=scene.scale.width, H=scene.scale.height, layer=[];
    let i=0, alive=true;
    const clear=()=>{ layer.forEach(o=>{ scene.tweens.killTweensOf(o); o.destroy(); }); layer.length=0; };
    const end=(skip)=>{ if(!alive) return; alive=false; clear(); scene._tutOn=false; scene.events.off('shutdown', onShut);
      if(skip) this.skipAll(); else this.mark(id); if(opt.onClose) opt.onClose(); };
    // 玩家直接點了高亮的按鈕（換場）→ 視為看完這段引導
    const onShut=()=>{ if(!alive) return; alive=false; scene._tutOn=false; layer.length=0; if(steps[i] && steps[i].pass) this.mark(id); };
    scene.events.once('shutdown', onShut);
    const show=()=>{
      clear(); const s=steps[i], P=6;
      const holes=((s.targets&&s.targets())||[]).filter(Boolean).map(r=>({x:r.x-P, y:r.y-P, w:r.w+P*2, h:r.h+P*2}));
      const inHole=(x,y)=>holes.some(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h);
      // 暗幕（挖洞）
      const rt=scene.add.renderTexture(0,0,W,H).setOrigin(0).setDepth(200); rt.fill(0x05040c, 0.68);
      if(holes.length){ const eg=scene.make.graphics({x:0,y:0}, false); eg.fillStyle(0xffffff,1); holes.forEach(h=>eg.fillRoundedRect(h.x,h.y,h.w,h.h,10)); rt.erase(eg); eg.destroy(); }
      layer.push(rt);
      // 擋住其他點擊；pass 步驟的高亮區例外（可直接點下面的按鈕）
      const blk=scene.add.rectangle(0,0,W,H,0x000000,0.001).setOrigin(0).setDepth(201);
      blk.setInteractive(new Phaser.Geom.Rectangle(0,0,W,H), (a,x,y)=> a.contains(x,y) && !(s.pass && inHole(x,y)));
      layer.push(blk);
      holes.forEach(h=>{ const g=scene.add.graphics().setDepth(202); g.lineStyle(3, UI.goldN, 1); g.strokeRoundedRect(h.x,h.y,h.w,h.h,10);
        g.lineStyle(8, UI.goldN, 0.18); g.strokeRoundedRect(h.x-3,h.y-3,h.w+6,h.h+6,12); layer.push(g);
        scene.tweens.add({targets:g, alpha:0.35, duration:650, yoyo:true, repeat:-1, ease:'Sine.inOut'}); });
      const last=i>=steps.length-1, buttons=[];
      if(!s.noSkip && !(last && steps.length>1)) buttons.push({label:'略過教學', alignLeft:true, cb:()=>end(true), opt:{size:13, fill:UI.lineSoftN, stroke:UI.lineN, color:UI.dim}});
      buttons.push({label:last?(s.last||'知道了'):'下一步', cb:()=>{ if(last) end(false); else { i++; show(); } }, opt:{variant:'go', size:14}});
      const bo={title:s.title, text:s.text, accent:s.accent, buttons, step:steps.length>1?((i+1)+' / '+steps.length):''};
      let box=this._box(scene, bo), pos=this._place(holes, box.bw, box.bh, W, H);
      // 一般寬度擺不進高亮區旁邊（手機字放大後常見）→ 改用撐滿畫面寬、行數較少的框再試一次
      if(!pos.ok){ const b2=this._box(scene, Object.assign({full:true}, bo)), p2=this._place(holes, b2.bw, b2.bh, W, H);
        if(p2.ok){ box.discard(); box=b2; pos=p2; } else b2.discard(); }
      layer.push(box.build(pos.x, pos.y, 203));
    };
    show();
  },

  // ---------- 功能畫面的一句提示（點任意處關閉） ----------
  tip(scene, id){
    const t=TUT_TIPS[id]; if(!t || this.seen(id) || scene._tutOn) return;
    if(id==='FormationHall' && partySizeCap()<5) return;   // 未滿編會被彈回大廳，不在這時播
    scene._tutOn=true; this.mark(id);
    const W=scene.scale.width, H=scene.scale.height, layer=[];
    const close=()=>{ layer.forEach(o=>o.destroy()); layer.length=0; scene._tutOn=false; };
    scene.events.once('shutdown', ()=>{ scene._tutOn=false; layer.length=0; });
    const blk=scene.add.rectangle(0,0,W,H,0x05040c,0.5).setOrigin(0).setDepth(200).setInteractive({useHandCursor:true}); layer.push(blk);
    // 進場那一下的放開（觸控的 pointerup）不算：必須在提示框出現後重新按下
    let down=false;
    blk.on('pointerdown',p=>{ down=true; if(!_isTouchPtr(p)) close(); });
    blk.on('pointerup',p=>{ if(down && _isTouchPtr(p)) close(); down=false; });
    const box=this._box(scene, {title:t.title, text:t.text, accent:t.accent, foot:'點一下任意處關閉', w:500});
    const c=box.build((W-box.bw)/2, (H-box.bh)/2, 201); layer.push(c);
    c.setAlpha(0); scene.tweens.add({targets:c, alpha:1, duration:160});
  },
};

// 「關於」視窗裡的「重看教學」
(function(){
  const b=document.getElementById('tutReplay'); if(!b) return;
  const msg=document.getElementById('tutMsg');
  b.addEventListener('click',()=>Tutorial.replay(msg));
  const dlg=document.getElementById('aboutDlg');
  if(dlg && msg) new MutationObserver(()=>{ if(!dlg.classList.contains('open')) msg.textContent=''; }).observe(dlg,{attributes:true,attributeFilter:['class']});
})();
