// ========================= v3.1 戰場環境系統 · 戰鬥邏輯（擴充 Battle.prototype） =========================
// v3.1 修訂（依定案）：
//   ① 物件與「怪物波」綁定：每波生成、依該波敵人實際站位挑具體位置（怪物組可用 objs 欄位手動指定）。
//   ② 物件不承受攻擊：條上顯示的是「耐久度」——每被技能利用一次消耗 1 格，歸零碎裂消失。
//   ③ 物件定位＝技能的強化條件；每種觸發配專屬動畫（引燃爆燃/拔樹/影襲背刺/墜坑/神像光柱/水源漣漪…）。
// 計時一律以 gnow 遊戲時鐘為準。全自動、無掉落、天氣不可改變。
Object.assign(Battle.prototype, {
  // ---- 查詢：場上是否有帶某 tag 的有效物件（耐久型需 dur>0；地形恆有效）----
  objectWithTag(tag){
    return (this.envObjs||[]).find(o=> o && !o.dead && o.tags.indexOf(tag)>=0 && (o.def.dur>0 ? o.dur>0 : true)) || null;
  }
,
  clearEnvObjects(anim){
    (this.envObjs||[]).forEach(o=>{ if(!o||!o.container) return;
      if(anim && !o.dead){ this.tweens.add({targets:o.container, alpha:0, y:o.y+10, duration:260, ease:'Quad.in',
        onComplete:()=>{ if(o.container) o.container.destroy(); }}); }
      else o.container.destroy(); });
    this.envObjs=[];
  }
,
  // ---- v3.2 場景編排（vignette）：物件＝遭遇現場的敘事。由該波敵人組成決定演出，並接管進場動畫。
  // 哥布林圍營火被驚動／骷髏自地坑爬出／幽魂繞石像盤旋／巨木穿插兩軍之間。由 spawnWave 呼叫。
  stageWave(fresh, wi){
    this.clearEnvObjects(true);   // 舊波物件隨波次更替退場
    // v5.2 資深領隊（Lv2+）：每波在我方側佈置一件隨行物件（試煉除外——試煉有招牌物件）
    if(!(RUN&&RUN.trial) && typeof leaderTier==='function' && leaderTier()>=2){
      const lk=(typeof leaderObjType==='function')? leaderObjType() : 'campfire';
      this.time.delayedCall(80, ()=>{ if(!this.over) this.makeEnvObject(lk, 348, 238); });
    }
    // v8.3 商隊補給架（預設配備）：每波自篷車拋出「玩家所選的職業代表物件」（1 件；擴充後 2 件）
    if(!(RUN&&RUN.trial) && this._wagon)
      this.time.delayedCall(620, ()=>{ if(!this.over) this.wagonThrow(); });
    const V=CFG.env.vig, stype=(RUN&&RUN.node&&RUN.node.type)||'battle', di=(RUN&&RUN.destIndex)||0;
    const sprites=(fresh||[]).map(e=>e.sprite);
    const share=(list)=> sprites.length? sprites.filter(s=>list.indexOf(s)>=0).length/sprites.length : 0;
    // 手動指定（怪物組 objs 欄位）→ 照表生成＋預設走入進場
    if(RUN && RUN.nodeObjs && Array.isArray(RUN.nodeObjs[wi])){
      RUN.nodeObjs[wi].forEach((p,i)=> this.time.delayedCall(120+i*140,()=>{ if(!this.over) this.makeEnvObject(p.type,p.x,p.y); }));
      this._stageType='walk'; this.enterWalk(fresh); return;
    }
    if(stype==='boss'){   // 王戰：祭壇固定現身、王照常走入
      if(wi===this.totalWaves-1) this.makeEnvObject('altar', 468, 224);
      this._stageType='walk'; this.enterWalk(fresh); return;
    }
    // v5.6 沙漠棲地湧現（dest 4 專屬，最優先）：胡狼出遺骨、禿鷹出枯樹、沙蟲/沙蠍出沙坑
    const _DSRC={ jackal:'bonepile', vulture:'deadtree', sandWyrm:'sandpit', sandScorpion:'sandpit' };
    if(((RUN&&RUN.destIndex)||0)===4 && !RUN.trial && (fresh||[]).some(e=>_DSRC[e.sprite])){
      this._stageType='desert'; this.stageDesert(fresh, _DSRC); return; }
    // v6.0 水澤棲地湧現（dest 5 專屬）：澤鱷/澤馬自水坑破面、眼鏡蛇/沼澤九頭/沼澤巨獸自沼澤竄出（蜻蜓照常飛入）
    const _OSRC={ crocodile:'pool', marshHippo:'pool', cobra:'bog', swampHydra:'bog', bogBehemoth:'bog' };
    if(((RUN&&RUN.destIndex)||0)===5 && !RUN.trial && (fresh||[]).some(e=>_OSRC[e.sprite])){
      this._stageType='oasis'; this.stageOasis(fresh, _OSRC); return; }
    // 依敵人組成挑演出（骸骨爬坑 > 水坑湧出 > 裂縫竄出 > 圍火紮營 > 幽魂聚像 > 林間穿插 > 一般配置）
    if(share(ENV_BONES)>=0.5 && Math.random()<V.pitChance){ this._stageType='pit'; this.stagePit(fresh); return; }
    if(share(ENV_SEA)>=0.5 && Math.random()<V.poolChance){ this._stageType='pool'; this.stagePool(fresh); return; }
    if(share(ENV_VOID)>=0.5 && Math.random()<V.riftChance){ this._stageType='rift'; this.stageRift(fresh); return; }
    if(share(ENV_CAMPERS)>=0.5 && Math.random()<V.campChance){ this._stageType='camp'; this.stageCamp(fresh); return; }
    if(share(ENV_GHOSTS)>0 && Math.random()<V.shrineChance){ this._stageType='shrine'; this.stageShrine(fresh); return; }
    if(ENV_GROVE_DESTS.indexOf(di)>=0 && Math.random()<V.groveChance){ this._stageType='grove'; this.stageGrove(fresh); this.enterWalk(fresh); return; }
    this._stageType='walk';
    this.rollScatterObjects(fresh);   // 一般配置：0–2 個目的地物件（依站位避讓）
    this.enterWalk(fresh);
  }
,
  // ---- v8.3 商隊補給架：拋出「玩家挑選的職業代表物件」（銅鑼/圖騰/燭台/水晶/燈籠；場上已有同款則略過）----
  wagonThrow(){
    if(this.over || (RUN&&RUN.trial) || !this._wagon) return;
    const picks=(typeof supplyPicks==='function' ? supplyPicks() : [])
      .filter(t=> BATTLE_OBJECTS[t] && !(this.envObjs||[]).some(o=>o&&!o.dead&&o.type===t));
    if(!picks.length) return;
    const spots=[{x:252,y:214},{x:214,y:462},{x:334,y:448},{x:428,y:238},{x:452,y:430},{x:308,y:318}];
    const occ=(this.heroes||[]).map(h=>({x:h.baseX,y:h.baseY}));
    const free=p=> occ.every(q=> Math.abs(p.x-q.x)>62 || Math.abs(p.y-q.y)>56)
      && (this.envObjs||[]).every(o=>!o||o.dead||Math.abs(o.x-p.x)>70||Math.abs(o.y-p.y)>60);
    const wx=this._wagon.x+8, wy=this._wagon.y-30;
    picks.forEach((t,i)=>{
      const cand=spots.filter(free); if(!cand.length) return;
      const p=cand[Math.floor(Math.random()*cand.length)]; occ.push(p);
      this.time.delayedCall(120+i*280, ()=>{ if(this.over) return;
        const def=BATTLE_OBJECTS[t]; if(!def || !this.textures.exists(def.sprite)) return;
        const fly=this.add.image(wx,wy,def.sprite).setScale(2.2).setDepth(80).setAngle(-18);
        const mx=(wx+p.x)/2, my=Math.min(wy,p.y)-92;
        this.tweens.add({targets:fly, x:mx, y:my, angle:150, duration:250, ease:'Quad.out',
          onComplete:()=>this.tweens.add({targets:fly, x:p.x, y:p.y, angle:335, duration:250, ease:'Quad.in',
            onComplete:()=>{ fly.destroy(); if(this.over) return;
              this.fxDust(p.x,p.y+6); this.makeEnvObject(t,p.x,p.y);
              this.floatLabel(wx,wy-18,'商隊補給!','#ffd27a'); }})});
      });
    });
  }
,
  // 預設進場：自畫面右側走入（原行為）
  enterWalk(fresh){
    const W=this.scale.width;
    (fresh||[]).forEach((c,idx)=>{ c.container.x=W+80+idx*70;
      this.tweens.add({targets:c.container, x:c.baseX, duration:640, ease:'Quad.out', delay:idx*90}); });
    this.time.delayedCall(700+(Math.max(1,(fresh||[]).length)-1)*90, ()=>{ this.entering=false; });
  }
,
  // 場景①圍火紮營：營火設在敵群中心，敵人重新圈坐營火四周；開戰被驚動（跳起＋驚嘆＋首擊延遲＝我方先手窗口）
  stageCamp(fresh){
    const V=CFG.env.vig;
    let cx=fresh.reduce((a,b)=>a+b.baseX,0)/fresh.length, cy=fresh.reduce((a,b)=>a+b.baseY,0)/fresh.length;
    cx=Phaser.Math.Clamp(cx,575,760); cy=Phaser.Math.Clamp(cy,255,420);
    const fire=this.makeEnvObject('campfire', cx, cy);
    // v4.7：營地隨機擺烤肉或酒桶（吃肉回血／灌酒回血但爛醉）
    this.makeEnvObject(Math.random()<0.55?'roast':'keg', Phaser.Math.Clamp(cx+48,540,860), Phaser.Math.Clamp(cy+18,200,500));
    const n=fresh.length, r=V.campRadius;
    fresh.forEach((c,i)=>{ const ang=(-0.5+ i/Math.max(1,n-1))*Math.PI*1.5 - Math.PI/2;   // 繞火半圈偏右
      let px=Phaser.Math.Clamp(Math.round(cx+Math.cos(ang)*r), 505, 856);
      let py=Phaser.Math.Clamp(Math.round(cy+Math.sin(ang)*r*0.8), 185, 500);
      c.baseX=px; c.baseY=py;
      c.container.setPosition(px,py).setDepth(py/200).setAlpha(0);
      if(c.spr) c.spr.setScale((c.baseScale||SCALE)*1.02,(c.baseScale||SCALE)*0.92);   // 坐姿微壓
      this.tweens.add({targets:c.container, alpha:1, duration:260, delay:i*60});
    });
    // 被驚動：跳起＋❗＋火堆竄光；首次出手延後 startleMs（此期間仍會被打）
    this.time.delayedCall(620, ()=>{ this.entering=false;
      if(fire&&fire.spr){ const s=fire.def.scl||4; this.tweens.add({targets:fire.spr, scaleY:s*1.4, scaleX:s*1.1, yoyo:true, duration:160}); }
      this.shake(140,0.006);
      fresh.forEach((c,i)=>{ if(!c.alive) return;
        c.lastAttack=(this.gnow||0)+CFG.env.vig.startleMs;   // 驚慌：延遲首擊
        if(c.spr) this.tweens.add({targets:c.spr, scaleX:c.baseScale||SCALE, scaleY:c.baseScale||SCALE, duration:120});
        this.tweens.add({targets:c.container, y:c.baseY-14, yoyo:true, duration:130, delay:i*50, ease:'Quad.out'});
        this.time.delayedCall(i*50, ()=>{ const t=txt(this,c.container.x,c.baseY-64,'❗',16,'#ffd24a').setDepth(82).setStroke('#000',4);
          this.tweens.add({targets:t, y:t.y-18, alpha:0, duration:700, ease:'Quad.out', onComplete:()=>t.destroy()}); });
      });
    });
  }
,
  // 場景②骸骨爬坑：地坑設在敵群前緣，骷髏自坑中「由下而上」逐一爬出，再爬行至定位
  stagePit(fresh){
    let cx=fresh.reduce((a,b)=>a+b.baseX,0)/fresh.length;
    const pit=this.makeEnvObject('pit', Phaser.Math.Clamp(Math.round(cx)-70,470,700), 452);
    const px=pit?pit.x:560, py=pit?pit.y:452;
    fresh.forEach((c,i)=>{
      c.container.setPosition(px, py+6).setAlpha(0).setScale(0.2);
      this.time.delayedCall(200+i*170, ()=>{ if(!c.container) return;
        this.fxDust(px, py);
        this.tweens.add({targets:c.container, y:py-26, alpha:1, scaleX:1, scaleY:1, duration:300, ease:'Back.out',
          onComplete:()=>{ this.tweens.add({targets:c.container, x:c.baseX, y:c.baseY, duration:340, ease:'Quad.out',
            onComplete:()=>{ if(c.container) c.container.setDepth(c.baseY/200); }}); }});
      });
    });
    this.time.delayedCall(200+fresh.length*170+660, ()=>{ this.entering=false; });
  }
,
  // v5.6 場景・沙漠棲地：各物種從自己的巢穴現身（胡狼掘骨而出、禿鷹自枯樹撲下、沙蟲沙蠍破沙而出）；其餘照常走入
  stageDesert(fresh, SRC){
    const spots={ bonepile:{x:585,y:212}, deadtree:{x:706,y:248}, sandpit:{x:620,y:452} };
    const need={}; (fresh||[]).forEach(e=>{ const k=SRC[e.sprite]; if(k) need[k]=true; });
    const objs={};
    Object.keys(need).forEach(k=>{ objs[k]=this.makeEnvObject(k, spots[k].x, spots[k].y); });
    const W=this.scale.width;
    (fresh||[]).forEach((c,i)=>{
      const k=SRC[c.sprite], o=k?objs[k]:null;
      if(!o){   // 非棲地物種照常走入
        c.container.x=W+80+i*70;
        this.tweens.add({targets:c.container, x:c.baseX, duration:640, ease:'Quad.out', delay:i*90});
        return; }
      const fly=(k==='deadtree');
      c.container.setPosition(o.x, fly? o.y-48 : o.y+4).setAlpha(0).setScale(fly?0.6:0.25);
      this.time.delayedCall(240+i*170, ()=>{ if(!c.container) return;
        if(fly){   // 禿鷹：自樹頂現身 → 俯衝滑翔到定位
          this.tweens.add({targets:c.container, alpha:1, scaleX:1, scaleY:1, duration:220, ease:'Quad.out',
            onComplete:()=>{ this.tweens.add({targets:c.container, x:c.baseX, y:c.baseY, duration:420, ease:'Sine.in',
              onComplete:()=>{ if(c.container) c.container.setDepth(c.baseY/200); }}); }});
        } else {   // 掘土/破沙而出 → 爬行到定位
          this.fxDust(o.x, o.y+6);
          this.tweens.add({targets:c.container, y:o.y-26, alpha:1, scaleX:1, scaleY:1, duration:300, ease:'Back.out',
            onComplete:()=>{ this.tweens.add({targets:c.container, x:c.baseX, y:c.baseY, duration:340, ease:'Sine.out',
              onComplete:()=>{ if(c.container) c.container.setDepth(c.baseY/200); }}); }});
        } });
    });
    this.time.delayedCall(240+(fresh||[]).length*170+720, ()=>{ this.entering=false; });
  }
,
  // v6.0 場景・水澤棲地：各物種從水坑/沼澤現身（水花破面/泥泡竄出）；其餘（蜻蜓等）照常走入
  stageOasis(fresh, SRC){
    const spots={ pool:{x:585,y:445}, bog:{x:700,y:418} };
    const need={}; (fresh||[]).forEach(e=>{ const k=SRC[e.sprite]; if(k) need[k]=true; });
    const objs={};
    Object.keys(need).forEach(k=>{ objs[k]=this.makeEnvObject(k, spots[k].x, spots[k].y); });
    const W=this.scale.width;
    (fresh||[]).forEach((c,i)=>{
      const k=SRC[c.sprite], o=k?objs[k]:null;
      if(!o){ c.container.x=W+80+i*70;
        this.tweens.add({targets:c.container, x:c.baseX, duration:640, ease:'Quad.out', delay:i*90});
        return; }
      c.container.setPosition(o.x, o.y+6).setAlpha(0).setScale(0.25);
      this.time.delayedCall(240+i*170, ()=>{ if(!c.container) return;
        if(k==='pool'){ this.fxSplash(o.x, o.y); this.fxRipple(o.x, o.y); } else this.fxBubbles(o.x, o.y-4);
        this.tweens.add({targets:c.container, y:o.y-28, alpha:1, scaleX:1, scaleY:1, duration:300, ease:'Back.out',
          onComplete:()=>{ this.tweens.add({targets:c.container, x:c.baseX, y:c.baseY, duration:340, ease:'Sine.out',
            onComplete:()=>{ if(c.container) c.container.setDepth(c.baseY/200); }}); }});
      });
    });
    this.time.delayedCall(240+(fresh||[]).length*170+720, ()=>{ this.entering=false; });
  }
,
  // 場景②b 水坑湧出：水坑設在敵群前緣，深水族自水中破面而出（水花＋漣漪），再游行至定位
  stagePool(fresh){
    let cx=fresh.reduce((a,b)=>a+b.baseX,0)/fresh.length;
    const pool=this.makeEnvObject('pool', Phaser.Math.Clamp(Math.round(cx)-64,470,700), 448);
    const px=pool?pool.x:560, py=pool?pool.y:448;
    fresh.forEach((c,i)=>{
      c.container.setPosition(px, py+8).setAlpha(0).setScale(0.25);
      this.time.delayedCall(200+i*170, ()=>{ if(!c.container) return;
        this.fxSplash(px, py); this.fxRipple(px, py);
        this.tweens.add({targets:c.container, y:py-24, alpha:1, scaleX:1, scaleY:1, duration:300, ease:'Back.out',
          onComplete:()=>{ this.tweens.add({targets:c.container, x:c.baseX, y:c.baseY, duration:340, ease:'Sine.out',
            onComplete:()=>{ if(c.container) c.container.setDepth(c.baseY/200); }}); }});
      });
    });
    this.time.delayedCall(200+fresh.length*170+660, ()=>{ this.entering=false; });
  }
,
  // 場景②c 裂縫竄出：空間裂縫懸浮於敵群中心，虛空族自裂縫扭曲現形（紫閃＋旋入），再飄至定位
  stageRift(fresh){
    let cx=fresh.reduce((a,b)=>a+b.baseX,0)/fresh.length, cy=fresh.reduce((a,b)=>a+b.baseY,0)/fresh.length;
    const rift=this.makeEnvObject('rift', Phaser.Math.Clamp(Math.round(cx),560,760), Phaser.Math.Clamp(Math.round(cy)-30,220,400));
    const rx=rift?rift.x:640, ry=rift?rift.y:300;
    fresh.forEach((c,i)=>{
      c.container.setPosition(rx, ry).setAlpha(0).setScale(0.1).setAngle(180);
      this.time.delayedCall(220+i*160, ()=>{ if(!c.container) return;
        this.screenFlash(0xc46bff, 0.10, 160);
        const ring=this.add.circle(rx,ry,10,0xc46bff,0.5).setDepth(72);
        this.tweens.add({targets:ring, radius:44, alpha:0, duration:300, onComplete:()=>ring.destroy()});
        this.tweens.add({targets:c.container, alpha:1, scaleX:1, scaleY:1, angle:0, duration:300, ease:'Back.out',
          onComplete:()=>{ this.tweens.add({targets:c.container, x:c.baseX, y:c.baseY, duration:340, ease:'Sine.out',
            onComplete:()=>{ if(c.container) c.container.setDepth(c.baseY/200); }}); }});
      });
    });
    this.time.delayedCall(220+fresh.length*160+660, ()=>{ this.entering=false; });
  }
,
  // 場景③幽魂聚像：石像立於敵群中心，幽魂在其周圍淡入盤旋（無腳步、飄移進場）＋靈息升騰
  stageShrine(fresh){
    let cx=fresh.reduce((a,b)=>a+b.baseX,0)/fresh.length, cy=fresh.reduce((a,b)=>a+b.baseY,0)/fresh.length;
    const st=this.makeEnvObject('statue', Phaser.Math.Clamp(Math.round(cx),560,760), Phaser.Math.Clamp(Math.round(cy),240,430));
    if(st) this.fxWisp(st.x, st.y-10);
    fresh.forEach((c,i)=>{
      c.container.setPosition(c.baseX+(Math.random()-0.5)*30, c.baseY-24).setAlpha(0);
      this.time.delayedCall(150+i*130, ()=>{ if(!c.container) return;
        this.tweens.add({targets:c.container, x:c.baseX, y:c.baseY, alpha:1, duration:520, ease:'Sine.out'});
        this.fxWisp(c.baseX, c.baseY-8);
      });
    });
    this.time.delayedCall(150+fresh.length*130+560, ()=>{ this.entering=false; });
  }
,
  // 場景④林間穿插：2–3 棵巨木散佈在兩軍「之間與隊列縫隙」，敵人照常走入
  stageGrove(fresh){
    const V=CFG.env.vig;
    const cands=[{x:298,y:246},{x:312,y:462},{x:428,y:206},{x:446,y:452},{x:506,y:330},{x:610,y:212},{x:598,y:472},{x:452,y:318}];
    const occ=(fresh||[]).map(e=>({x:e.baseX,y:e.baseY})).concat((this.heroes||[]).map(h=>({x:h.baseX,y:h.baseY})));
    const free=(p)=> occ.every(q=> Math.abs(p.x-q.x)>66 || Math.abs(p.y-q.y)>58);
    Phaser.Utils.Array.Shuffle(cands);
    let n=2+Math.floor(Math.random()*Math.max(1,(V.groveMax||3)-1)), placed=[];
    for(const p of cands){ if(placed.length>=n) break;
      if(free(p) && placed.every(o=>Math.abs(o.x-p.x)>84||Math.abs(o.y-p.y)>72)){ placed.push(p);
        this.time.delayedCall(100+placed.length*120, ()=>{ if(!this.over) this.makeEnvObject('tree', p.x, p.y); }); } }
  }
,
  // 一般配置（無演出時的後備）：0–2 個目的地物件，依該波站位避讓
  rollScatterObjects(fresh){
    const E=CFG.env, r=Math.random(); const n=r<E.spawnNone?0:(r<E.spawnNone+E.spawnOne?1:2);
    if(!n) return;
    const di=(RUN&&RUN.destIndex)||0;
    const pool=(OBJECTS_BY_DEST[di]||[]).slice(); Phaser.Utils.Array.Shuffle(pool);
    const picked=[]; for(const k of pool){ if(picked.indexOf(k)<0) picked.push(k); if(picked.length>=n) break; }
    const standC=[{x:252,y:205},{x:206,y:472},{x:455,y:243},{x:450,y:455},{x:634,y:193},{x:736,y:472},{x:522,y:346}];
    const groundC=[{x:330,y:462},{x:452,y:400},{x:562,y:438},{x:452,y:478},{x:622,y:470}];
    const occ=(fresh||[]).map(e=>({x:e.baseX,y:e.baseY})).concat((this.heroes||[]).map(h=>({x:h.baseX,y:h.baseY})));
    const free=(p)=> occ.every(q=> Math.abs(p.x-q.x)>72 || Math.abs(p.y-q.y)>62);
    const out=[];
    picked.forEach(k=>{ const def=BATTLE_OBJECTS[k]; if(!def) return;
      const cands=(def.ground?groundC:standC).filter(p=> free(p) && !out.some(o=> Math.abs(o.x-p.x)<84 && Math.abs(o.y-p.y)<70));
      if(cands.length){ const p=cands[Math.floor(Math.random()*cands.length)]; out.push(p);
        this.time.delayedCall(120+out.length*140, ()=>{ if(!this.over) this.makeEnvObject(k, p.x, p.y); }); } });
  }
,
  // 水花：藍色水珠濺起（水坑湧出）
  fxSplash(x,y){ for(let i=0;i<7;i++){ const a=-Math.PI*0.15-Math.random()*Math.PI*0.7, d=16+Math.random()*22;
    const p=this.add.circle(x+(Math.random()-0.5)*20, y, 2.5, 0x6fd0e0, 0.8).setDepth(70);
    this.tweens.add({targets:p, x:p.x+Math.cos(a)*d, y:p.y+Math.sin(a)*d, alpha:0, duration:360+Math.random()*180, ease:'Quad.out', onComplete:()=>p.destroy()}); } }
,
  // 幽魂靈息：紫色光點自地面盤旋升起
  fxWisp(x,y){ for(let i=0;i<5;i++){ const p=this.add.circle(x+(Math.random()-0.5)*30, y+10, 2.5, 0xa98bff, 0.7).setDepth(70);
    this.tweens.add({targets:p, y:y-46-Math.random()*20, x:p.x+(Math.random()-0.5)*24, alpha:0, duration:700+Math.random()*400, delay:i*90, ease:'Sine.out', onComplete:()=>p.destroy()}); } }
,
  makeEnvObject(typeKey, x, y){
    const def=BATTLE_OBJECTS[typeKey]; if(!def || !this.textures.exists(def.sprite)) return null;
    if(!this.envObjs) this.envObjs=[];
    const cont=this.add.container(x,y).setDepth(def.ground? 0.6 : y/200);   // 地形貼地、站立物件進 Y-sort
    const spr=this.add.image(0,0,def.sprite).setScale(def.scl||4);
    if(!def.ground) cont.add(this.add.ellipse(0,spr.displayHeight/2-6,spr.displayWidth*0.8,12,0x000000,0.35));
    cont.add(spr);
    cont.add(txt(this,0,def.ground? spr.displayHeight/2+10 : spr.displayHeight/2+12, def.name, 10, UI.dim).setStroke('#000',3));
    const o={ type:typeKey, def, tags:def.tags, dur:def.dur||0, maxDur:def.dur||0, x, y, container:cont, spr, dead:false,
      _nextAura:(this.gnow||0)+(def.aura==='burn'?CFG.env.lavaEveryMs:CFG.env.bogEveryMs) };
    if(def.dur>0){ o.pipG=this.add.graphics(); cont.add(o.pipG); o.pipY=-spr.displayHeight/2-10; this.drawDurPips(o); }   // 耐久格（非血條：被利用才消耗）
    if(def.aura==='burn'){ const glow=this.add.circle(0,0,spr.displayWidth*0.5,0xff9a3a,0.10); cont.addAt(glow,0);
      this.tweens.add({targets:glow,alpha:0.22,duration:700,yoyo:true,repeat:-1,ease:'Sine.inOut'}); }
    if(def.float){ this.tweens.add({targets:spr, y:-5, duration:900, yoyo:true, repeat:-1, ease:'Sine.inOut'});   // 空間裂縫：懸浮明滅
      const halo=this.add.circle(0,0,spr.displayWidth*0.6,0xc46bff,0.10); cont.addAt(halo,0);
      this.tweens.add({targets:halo, alpha:0.24, duration:800, yoyo:true, repeat:-1, ease:'Sine.inOut'}); }
    if(typeKey==='campfire'){ const glow=this.add.circle(0,-8,34,0xffb347,0.14); cont.addAt(glow,0);
      this.tweens.add({targets:glow,alpha:0.05,duration:260,yoyo:true,repeat:-1}); }
    this.envObjs.push(o);
    // 進場動畫：從地面升起＋落定揚塵
    cont.setAlpha(0); cont.y=y+16; if(!def.ground) cont.setScale(0.7);
    this.tweens.add({targets:cont, alpha:1, y, scaleX:1, scaleY:1, duration:320, ease:'Back.out',
      onComplete:()=>this.fxDust(x, y+(def.ground?6:spr.displayHeight/2))});
    return o;
  }
,
  // 耐久格：菱形點點（亮＝剩餘、暗＝已耗），被利用時整排閃一下
  drawDurPips(o){
    if(!o.pipG) return; const g=o.pipG; g.clear();
    const n=o.maxDur, gap=11, x0=-((n-1)*gap)/2, y=o.pipY;
    for(let i=0;i<n;i++){ const on=i<o.dur, col=on?0xffd27a:0x3a3150;
      g.fillStyle(0x07060f,0.8); g.fillCircle(x0+i*gap, y, 4.6);
      g.fillStyle(col, on?1:0.8);
      g.beginPath(); g.moveTo(x0+i*gap,y-3.6); g.lineTo(x0+i*gap+3.6,y); g.lineTo(x0+i*gap,y+3.6); g.lineTo(x0+i*gap-3.6,y); g.closePath(); g.fillPath();
    }
  }
,
  // ---- 物件被「利用」：消耗耐久＋擠壓脈動＋金光；歸零 → 碎裂消失 ----
  useObject(o, n, label){
    if(!o || o.dead || !(o.def.dur>0)) return;
    o.dur=Math.max(0, o.dur-(n||1));
    this.drawDurPips(o);
    const s=o.def.scl||4;
    if(o.spr){ this.tweens.add({targets:o.spr, scaleX:s*1.16, scaleY:s*0.88, yoyo:true, duration:110, ease:'Quad.out'}); }
    if(o.pipG){ this.tweens.add({targets:o.pipG, alpha:0.2, yoyo:true, duration:90, repeat:1 }); }
    if(label) this.floatLabel(o.x, o.y-52, label, '#ffd27a');
    this.spark(o.x, o.y-10, 0xffd27a);
    if(o.dur<=0){
      // v4.5 可再生物件（祈願燭台）：耗盡＝儀式完成 → 觸發效果後重燃，不碎裂
      if(o.def.renew==='candle'){ this.candleMiracle(o); o.dur=o.maxDur; this.drawDurPips(o); return; }
      this.crumbleObject(o);
    }
  }
,
  // v4.5 祈願燭台・小神蹟：三燭點滿 → 全隊回復 12% 並解除暈眩，燭台重燃
  candleMiracle(o){
    this.floatLabel(o.x, o.y-58, '三燭俱燃・小神蹟!', '#ffe27a');
    this.screenFlash(0xffe27a, 0.16, 260); this.holyLight({container:o.container, baseY:o.y}, 0xffe27a);
    (this.heroes||[]).forEach(h=>{ if(!h.alive) return;
      const amt=Math.max(2,Math.round(h.maxHp*0.12)); h.hp=Math.min(h.maxHp,h.hp+amt); this.bar(h);
      pixelNum(this,h.container.x,h.container.y-34,'+'+amt,0x7dff9a);
      if(h.stunned){ h.stunUntil=0; h.stunned=false; if(h.stunStar){h.stunStar.destroy(); h.stunStar=null;} if(h.stunLabel){h.stunLabel.destroy(); h.stunLabel=null;} if(h.spr) h.spr.clearTint(); } });
  }
,
  // v4.5 盜賊・吹燈：滅掉石燈籠 → 全場入暗數秒，暗中暴擊率大增（damage() 讀 _darkUntil）
  snuffLantern(c, o){
    this.useObject(o, 1, '吹燈');
    this._darkUntil=(this.gnow||0)+6000;
    if(this._darkFx){ this._darkFx.destroy(); }
    const W=this.scale.width, H=this.scale.height;
    const d=this.add.rectangle(0,0,W,H,0x060410,0).setOrigin(0).setDepth(44); this._darkFx=d;
    this.tweens.add({targets:d, fillAlpha:0.34, duration:400});
    this.tweens.add({targets:d, fillAlpha:0, delay:5400, duration:800, onComplete:()=>{ if(this._darkFx===d){ this._darkFx=null; } d.destroy(); }});
    this.floatLabel(c.baseX, c.baseY-58, '燈滅・影襲時刻!', '#a98bff');
  }
,
  crumbleObject(o){
    if(!o || o.dead) return; o.dead=true;
    this.floatLabel(o.x, o.y-46, o.def.name+'耗盡', '#b0a890');
    if(o.spr) o.spr.setTintFill(0xffffff);
    this.burst(o.x, o.y, 0xb0a890);
    this.fxDust(o.x, o.y+10);
    this.time.delayedCall(90, ()=>{ if(o.spr) o.spr.clearTint();
      this.tweens.add({targets:o.container, alpha:0, y:o.y+14, scaleY:0.72, angle:o.def.ground?0:8, duration:420, ease:'Quad.in',
        onComplete:()=>{ if(o.container) o.container.destroy(); }}); });
  }
,
  // ---- 招牌互動①：火系技能 × 火源 → 引燃連鎖。動畫：火源爆燃 → 餘燼弧線飛向每個敵人 ----
  fireChain(c){
    const src=this.objectWithTag('fire'); if(!src) return;
    const E=CFG.env.campfireChain, t=(RUN&&RUN.destTier)||1;
    let dmg=E.base + E.perTier*t;
    if(src.type==='cyanfire') dmg=Math.round(dmg*1.5);   // v5.0 幽焰營火：魔力之火，引燃連鎖更猛
    if(this._wxId==='rain') dmg=Math.max(1, Math.round(dmg*E.rainMul));
    // 爆燃：本體竄高＋光柱＋擴張火環＋閃光
    if(src.spr){ const s=src.def.scl||4; this.tweens.add({targets:src.spr, scaleY:s*1.45, scaleX:s*1.1, yoyo:true, duration:150, ease:'Quad.out'}); }
    const pillar=this.add.rectangle(src.x, src.y-24, 26, 86, 0xff9a3a, 0.35).setDepth(70);
    this.tweens.add({targets:pillar, alpha:0, scaleY:1.5, duration:460, ease:'Quad.out', onComplete:()=>pillar.destroy()});
    const ring=this.add.circle(src.x, src.y-6, 14, 0xff9a3a, 0.5).setDepth(70);
    this.tweens.add({targets:ring, radius:70, alpha:0, duration:380, ease:'Quad.out', onComplete:()=>ring.destroy()});
    this.screenFlash(0xff9a3a, 0.16, 220);
    this.floatLabel(src.x, src.y-56, '引燃連鎖!', '#ff9a3a');
    const foes=this.aliveOf(c.side==='hero'?'enemy':'hero');
    foes.forEach((f,i)=> this.fxEmberArc(src.x, src.y-10, f, ()=>{ if(!f.alive) return;
      this.rawHit(f, dmg, 0xff9a3a); this.fxFirePuff(f.container.x, f.container.y); if(f.hp<=0) this.die(f); }, i*70));
    if(src.def.dur>0) this.useObject(src, 1);   // 火源耐久 −1（岩漿屬地形，恆存）
  }
,
  // ---- 招牌互動②：變身戰士 × 巨木 → 拔樹投擲（v3.4.1 重演出）----
  // ① 熊人衝向巨木 → ② 連根拔起舉過頭（落葉揚塵）→ ③ 自樹旁掄擲拋向敵陣（震波）→ ④ 跑回原位
  treeThrow(c, tr){
    tr.dead=true;   // 先佔用，避免同幀重複取用
    const retX=c.baseX, retY=c.baseY;
    const gx=tr.x-34, gy=tr.y+4;   // 樹旁站位（我方在左，站樹的左側）
    this.floatLabel(c.baseX, c.baseY-58, '拔樹投擲!', '#ffb347');
    // ① 衝向巨木
    this.tweens.add({targets:c.container, x:gx, y:gy, duration:320, ease:'Quad.in',
      onComplete:()=>{
        if(this.over || !c.alive){ tr.dead=false; return; }   // 中途陣亡/收場 → 放回樹
        // ② 連根拔起：樹脫離原位、舉到熊人頭頂
        const spr=this.add.image(tr.x, tr.y, 'tree').setScale(4).setDepth(80);
        tr.container.destroy();
        this.fxLeaves(tr.x, tr.y-10); this.fxDust(tr.x, tr.y+22); this.shake(140,0.007);
        this.tweens.add({targets:spr, x:gx, y:gy-52, angle:-12, duration:220, ease:'Quad.out',
          onComplete:()=>{
            if(this.over){ spr.destroy(); return; }
            // ③ 掄擲：自樹旁拋物線飛向敵陣中心
            this.tweens.add({targets:c.container, x:gx-10, duration:110, yoyo:true, ease:'Quad.out'});   // 擲出後座力
            this.tweens.add({targets:spr, x:660, y:322, angle:340, duration:360, ease:'Quad.in',
              onComplete:()=>{ spr.destroy();
                if(this.over) return;
                this.shake(300,0.016); this.screenFlash(0xffb347,0.22,260);
                const sw=this.add.circle(660,330,18,0xffb347,0.45).setDepth(70);
                this.tweens.add({targets:sw, radius:130, alpha:0, duration:420, ease:'Quad.out', onComplete:()=>sw.destroy()});
                this.fxDust(660,352); this.fxLeaves(660,318); this.burst(660,330,0xffb347);
                this.aliveOf(c.side==='hero'?'enemy':'hero').forEach(f=>{ if(f.alive) this.damage(c,f,{aoeHit:true, envMult:CFG.env.treeThrowMult}); });
              }});
            // ④ 擲出後跑回原位
            this.tweens.add({targets:c.container, x:retX, y:retY, duration:360, delay:200, ease:'Quad.out',
              onComplete:()=>{ if(c.container) c.container.setDepth(retY/200); }});
          }});
      }});
  }
,
  // ---- 招牌互動⑥：波次清空且營火有耐久 → 小憩回血（利用一次、耐久 −1）。動畫：暖光擴散到每人 ----
  campfireRest(){
    const cf=(this.envObjs||[]).find(o=>o&&!o.dead&&(o.type==='campfire'||o.type==='cyanfire')&&o.dur>0); if(!cf) return;
    const cyan=(cf.type==='cyanfire'), col=cyan?0x46ccc6:0xffb347;
    let n=0;
    (this.heroes||[]).forEach(h=>{ if(!h.alive||h.hp<=0) return;
      if(cyan){ const amt=Math.max(4,Math.round(h.maxHp*0.10));   // v5.0 幽焰：小憩改給「護盾」
        h.shield=(h.shield||0)+amt; h.maxShield=Math.max(h.maxShield||0,h.shield); this.bar(h); n++;
        const warm=this.add.circle(cf.x, cf.y-8, 8, col, 0.5).setDepth(69);
        this.tweens.add({targets:warm, x:h.container.x, y:h.container.y, duration:340, ease:'Quad.out',
          onComplete:()=>{ warm.destroy(); pixelNum(this,h.container.x,h.container.y-34,'🛡+'+amt,0x9fd0ff); this.holyLight(h,col); }});
      } else { if(h.hp>=h.maxHp) return;
        const amt=Math.max(2,Math.round(h.maxHp*CFG.env.campfireRestFrac));
        h.hp=Math.min(h.maxHp,h.hp+amt); this.bar(h); n++;
        const warm=this.add.circle(cf.x, cf.y-8, 8, col, 0.5).setDepth(69);
        this.tweens.add({targets:warm, x:h.container.x, y:h.container.y, duration:340, ease:'Quad.out',
          onComplete:()=>{ warm.destroy(); pixelNum(this,h.container.x,h.container.y-34,'+'+amt,0x7dff9a); this.holyLight(h,col); }}); }
    });
    if(n){ this.floatLabel(cf.x, cf.y-56, cyan?'幽焰凝盾':'營火小憩', cyan?'#46ccc6':'#f0975a'); this.useObject(cf, 1); }
  }
,
  // ---- 招牌互動④：遊俠・回風 → 全敵降速；瀕死雜兵吹入地坑（地坑耐久 −1/人）。動畫：風幕橫掃＋墜坑漩渦 ----
  doGale(c, sk){
    const E=CFG.env, dur=(sk.dur||E.galeSlowMs)+((sk.plus||0)*800);
    this.floatLabel(c.baseX, c.baseY-58, (sk.name||'回風')+'!', '#9fe8ff');
    this.screenFlash(0x9fe8ff, 0.12, 220);
    for(let i=0;i<8;i++){ const y=170+Math.random()*320, r=this.add.rectangle(360, y, 30, 2.5, 0xd8f0ff, 0.5).setDepth(70);
      this.tweens.add({targets:r, x:880, alpha:0, duration:360+Math.random()*220, delay:i*40, ease:'Quad.in', onComplete:()=>r.destroy()}); }
    const pit=this.objectWithTag('pit');
    this.aliveOf('enemy').forEach(f=>{
      f.slowUntil=(this.gnow||0)+dur; f.slowMul=E.galeSlowMul;
      this.tweens.add({targets:f.container, x:f.container.x+24, duration:170, yoyo:true, ease:'Quad.out'});
      this.floatLabel(f.container.x, f.baseY-52, '降速', '#9fe8ff');
      if(pit && pit.dur>0 && !f.boss && !f.isSummon && f.maxHp>0 && f.hp/f.maxHp < E.pitHpFrac) this.pitFall(f, pit);
    });
  }
,
  pitFall(f, pit){
    if(!f.alive || !pit || pit.dead || pit.dur<=0) return;
    this.useObject(pit, 1);
    this.floatLabel(f.container.x, f.baseY-64, '墜坑!', '#ffd24a');
    this.fxDust(pit.x, pit.y);
    this.tweens.add({targets:f.container, x:pit.x, y:pit.y, angle:540, scaleX:0.15, scaleY:0.15, alpha:0.3, duration:340, ease:'Quad.in',
      onComplete:()=>{ if(f.alive){ f.hp=0; this.die(f); } }});
  }
,
  // ---- 招牌互動⑤：牧師・祈禱 → 依天氣降神蹟；神聖物件在場 → 升階並消耗其耐久 1。動畫：天光柱＋符文升騰 ----
  doPray(c, sk){
    const wx=this._wxId||'clear', deity=WEATHER_DEITY[wx]||WEATHER_DEITY.clear, P=CFG.env.pray;
    const shrine=this.objectWithTag('sacred'), up=!!shrine, mul=up?P.upMul:1;
    this.holyLight(c, 0xffe27a); this.screenFlash(0xffe27a, 0.18, 300);
    if(shrine){   // 神像/祭壇共鳴：天光直落＋眼部金光＋符文粒子，耐久 −1
      const beam=this.add.rectangle(shrine.x, shrine.y-110, 30, 220, 0xffe27a, 0.30).setDepth(69).setScale(1,0);
      beam.setOrigin(0.5,0);
      this.tweens.add({targets:beam, scaleY:1, duration:260, ease:'Quad.out',
        onComplete:()=>this.tweens.add({targets:beam, alpha:0, duration:520, delay:300, onComplete:()=>beam.destroy()})});
      if(shrine.spr){ shrine.spr.setTint(0xffe8a0); this.time.delayedCall(700,()=>{ if(shrine.spr&&!shrine.dead) shrine.spr.clearTint(); }); }
      for(let i=0;i<7;i++){ const px=shrine.x+(Math.random()-0.5)*40; const p=this.add.rectangle(px, shrine.y+8, 3, 3, 0xffe27a).setDepth(70);
        this.tweens.add({targets:p, y:shrine.y-70-Math.random()*30, alpha:0, duration:640+Math.random()*260, ease:'Quad.out', onComplete:()=>p.destroy()}); }
      this.useObject(shrine, 1, '神像共鳴');
    }
    this.floatLabel(this.scale.width/2, 150, '神蹟・'+deity.miracle+(up?'（升階）':''), '#ffe27a');
    this.floatLabel(c.baseX, c.baseY-58, deity.name, '#ffe27a');
    const heroes=this.aliveOf('hero');
    if(wx==='rain'){ heroes.forEach(h=>{ const amt=Math.round(h.maxHp*P.healFrac*mul); h.hp=Math.min(h.maxHp,h.hp+amt); this.bar(h); pixelNum(this,h.container.x,h.container.y-34,'+'+amt,0x7dff9a); this.holyLight(h,0x7dff9a); }); }
    else if(wx==='clear'){ const amt=Math.round(P.atkAmt*mul), dur=P.atkDur*(up?1.4:1);
      heroes.forEach(h=>{ h.atkBuffUntil=(this.gnow||0)+dur; h.atkBuffAmt=Math.max(h.atkBuffAmt||0, amt); this.holyLight(h,0xffe27a); }); }
    else if(wx==='fog'){ const ch=Math.round(P.dodgeCharges*(up?2:1));
      heroes.forEach(h=>{ h._prayDodge=(h._prayDodge||0)+ch; this.holyLight(h,0x9fe8ff); this.floatLabel(h.container.x,h.baseY-52,'神隱×'+ch,'#9fe8ff'); }); }
    else if(wx==='wind'){ const dur=P.hasteMs*(up?1.4:1);
      heroes.forEach(h=>{ h.hasteUntil=(this.gnow||0)+dur; h.hasteMul=up?0.72:P.hasteMul; this.holyLight(h,0x9fe8ff); this.floatLabel(h.container.x,h.baseY-52,'加速','#9fe8ff'); }); }
    else if(wx==='snow'){ const dur=P.slowMs*(up?1.4:1);
      this.aliveOf('enemy').forEach(f=>{ f.slowUntil=(this.gnow||0)+dur; f.slowMul=up?1.5:1.35; this.holyLight(f,0x9fd0ff); this.floatLabel(f.container.x,f.baseY-52,'凍結遲滯','#9fd0ff'); }); }
  }
,
  // ---- v3.3 烤肉 AI：受傷的紮營敵人這次行動改為「跑去吃烤肉」——回血、烤肉耐久 −1、大快朵頤動畫 ----
  tryEatRoast(c){
    if(!c || c.side!=='enemy' || c.isSummon || !c.alive) return false;
    const E=CFG.env;
    if(c.maxHp<=0 || c.hp/c.maxHp >= E.roastHpFrac) return false;
    if(this.gnow < (c._eatCd||0)) return false;
    const ro=(this.envObjs||[]).find(o=>o&&!o.dead&&o.type==='roast'&&o.dur>0); if(!ro) return false;
    c._eatCd=this.gnow+E.roastCdMs;
    const bx=c.container.x, by=c.container.y;
    this.floatLabel(bx, c.baseY-58, '跑去吃烤肉!', '#f0975a');
    this.tweens.add({targets:c.container, x:ro.x-26, y:ro.y-6, duration:300, ease:'Quad.out',
      onComplete:()=>{ if(!c.alive){ return; }
        // 大快朵頤：連續兩口（壓縮脈動）＋回血＋烤肉耐久 −1
        this.tweens.add({targets:c.spr, scaleY:(c.baseScale||SCALE)*0.82, yoyo:true, duration:120, repeat:2});
        this.time.delayedCall(320, ()=>{ if(!c.alive) return;
          const amt=Math.round(c.maxHp*CFG.env.roastHealFrac);
          c.hp=Math.min(c.maxHp, c.hp+amt); this.bar(c);
          pixelNum(this, c.container.x, c.container.y-34, '+'+amt, 0x7dff9a);
          this.useObject(ro, 1, '被吃掉一份');
          this.tweens.add({targets:c.container, x:bx, y:by, duration:300, ease:'Quad.in',
            onComplete:()=>{ if(c.container) c.container.setDepth(c.baseY/200); }});
        });
      }});
    return true;
  }
,
  // ---- v5.0 武器架/防具架：我方行動時順手取用（不耗行動、每架 2 人份、每人各限一次）----
  tryTakeRack(c){
    if(!c || c.side!=='hero' || c.isSummon || !c.alive) return;
    if(!c._tookW){ const rw=(this.envObjs||[]).find(o=>o&&!o.dead&&o.type==='rackW'&&o.dur>0);
      if(rw){ c._tookW=true; this.useObject(rw,1);
        c.atkSeq=(c.atkSeq||[1]).map(a=>a+5);
        this.floatLabel(c.container.x, c.baseY-58, '抄起利刃 ATK+5!', '#f2c14e');
        this.spark(c.container.x, c.container.y-10, 0xf2c14e); return; } }
    if(!c._tookA){ const ra=(this.envObjs||[]).find(o=>o&&!o.dead&&o.type==='rackA'&&o.dur>0);
      if(ra){ c._tookA=true; this.useObject(ra,1);
        c.def=(c.def||0)+4; c.shield=(c.shield||0)+12; c.maxShield=Math.max(c.maxShield||0,c.shield); this.bar(c);
        this.floatLabel(c.container.x, c.baseY-58, '披上備甲 DEF+4 盾+12!', '#6aa6f0');
        this.spark(c.container.x, c.container.y-10, 0x6aa6f0); return; } }
  }
,
  // ---- v5.7/v6.0 屍體系統：胡狼→胡狼屍體（禿鷹食腐）；澤馬/澤鱷→澤獸屍體（數秒後寄生蟲破體而出）----
  dropCarcass(c){
    const M={ jackal:'carcass', marshHippo:'marshcarcass', crocodile:'marshcarcass' };
    const k=c? M[c.sprite] : null;
    if(!k || (RUN&&RUN.trial)) return;
    const x=Phaser.Math.Clamp(Math.round(c.container? c.container.x : c.baseX), 120, 860);
    const y=Phaser.Math.Clamp(Math.round(c.baseY+14), 190, 500);
    this.time.delayedCall(430, ()=>{ if(this.over) return;
      const o=this.makeEnvObject(k, x, y);
      if(o && k==='marshcarcass') this.hatchParasites(o);   // 屍體落地即開始孵化（每秒 1 隻）
    });
  }
,
  // v6.0 寄生蟲破體：澤獸屍體落地即孵化，每秒 1 隻寄生蟲加入敵方（每隻耗屍體耐久 1，耐久 3 耗盡即止）
  hatchParasites(o){
    if(this.over || !o || o.dead || o.dur<=0) return;
    const dm=((CFG.diff&&CFG.diff.muls)||[0.8,1,1.2])[(RUN&&RUN.diff!=null)?RUN.diff:1]||1;
    if(!o._hatched){ o._hatched=true; this.floatLabel(o.x, o.y-50, '寄生蟲破體而出!', '#9adf6a'); this.shake(110,0.005); }
    this.fxBubbles(o.x, o.y-4);
    const i=(o._hatchN=(o._hatchN||0)+1)-1;
    const e=scaleEnemy(ENV_PARASITE, dm, dm);
    const c=this.makeCombatant({sprite:e.sprite,name:e.name,maxHp:e.hp,hp:e.hp,atkSeq:e.atkSeq,def:e.def,heal:0,interval:e.interval,ranged:false,healer:false,row:e.row}, 'enemy', o.x+(i%2?18:-10), o.y-6, SCALE);
    c.baseX=Phaser.Math.Clamp(o.x-44+(i%3)*54, 470, 850);
    c.baseY=Phaser.Math.Clamp(o.y-26+(i%2)*44, 190, 500);
    c.container.setAlpha(0).setScale(0.2);
    this.enemies.push(c); this.all.push(c);
    this.tweens.add({targets:c.container, alpha:1, scaleX:1, scaleY:1, duration:280, ease:'Back.out',
      onComplete:()=>{ this.tweens.add({targets:c.container, x:c.baseX, y:c.baseY, duration:300, ease:'Sine.out',
        onComplete:()=>{ if(c.container) c.container.setDepth(c.baseY/200); }}); }});
    this.useObject(o, 1);   // 每孵一隻啃穿一分耐久
    if(!o.dead && o.dur>0) this.time.delayedCall(1000, ()=>this.hatchParasites(o));   // 1 秒後孵下一隻
  }
,
  // ---- v5.7 禿鷹食腐：受傷的禿鷹撲向屍體大快朵頤 → 回滿血、屍體消失 ----
  tryEatCarrion(c){
    if(!c || c.side!=='enemy' || c.sprite!=='vulture' || !c.alive) return false;
    if(c.maxHp<=0 || c.hp>=c.maxHp) return false;
    const ca=(this.envObjs||[]).find(o=>o&&!o.dead&&o.type==='carcass'&&o.dur>0); if(!ca) return false;
    this.floatLabel(c.container.x, c.baseY-58, '撲向屍體!', '#ff8a3a');
    this.enemyGoUse(c, ca, ()=>{
      if(c.spr) this.tweens.add({targets:c.spr, scaleY:(c.baseScale||SCALE)*0.78, yoyo:true, duration:110, repeat:3});   // 啄食
      const amt=c.maxHp-c.hp; c.hp=c.maxHp; this.bar(c);
      pixelNum(this, c.container.x, c.container.y-34, '+'+amt, 0x7dff9a);
      this.floatLabel(c.container.x, c.baseY-70, '飽餐一頓!', '#ff8a3a');
      this.useObject(ca, 1); });
    return true;
  }
,
  // ---- v4.7 敵人用物件通用骨架：跑過去 → onArrive 演出 → 跑回原位（消耗一次行動）----
  enemyGoUse(c, o, onArrive){
    const bx=c.container.x, by=c.container.y;
    this.tweens.add({targets:c.container, x:o.x-26, y:o.y-4, duration:300, ease:'Quad.out',
      onComplete:()=>{ if(!c.alive) return;
        onArrive();
        this.time.delayedCall(360, ()=>{ if(!c.alive) return;
          this.tweens.add({targets:c.container, x:bx, y:by, duration:300, ease:'Quad.in',
            onComplete:()=>{ if(c.container) c.container.setDepth(c.baseY/200); }}); }); }});
  }
,
  // v4.7 野獸喝水坑：低血野獸跑去埋頭喝水（回血 15%、水坑耐久 −1）——跟法師的水源共鳴搶同一池水
  tryDrinkPool(c){
    if(!c || c.side!=='enemy' || c.isSummon || !c.alive || c.boss) return false;
    if(typeof ENV_BEASTS==='undefined' || ENV_BEASTS.indexOf(c.sprite)<0) return false;
    if(c.maxHp<=0 || c.hp/c.maxHp>=0.5 || this.gnow<(c._drinkCd||0)) return false;
    const po=(this.envObjs||[]).find(o=>o&&!o.dead&&o.type==='pool'&&o.dur>0); if(!po) return false;
    c._drinkCd=this.gnow+7000;
    this.floatLabel(c.container.x, c.baseY-58, '跑去喝水!', '#6fd0e0');
    this.enemyGoUse(c, po, ()=>{
      if(c.spr) this.tweens.add({targets:c.spr, scaleY:(c.baseScale||SCALE)*0.78, yoyo:true, duration:150, repeat:2});   // 埋頭牛飲
      this.fxSplash(po.x, po.y); this.fxRipple(po.x, po.y);
      const amt=Math.round(c.maxHp*0.15); c.hp=Math.min(c.maxHp, c.hp+amt); this.bar(c);
      pixelNum(this, c.container.x, c.container.y-34, '+'+amt, 0x7dff9a);
      this.useObject(po, 1, '被喝了一口'); });
    return true;
  }
,
  // v4.7 哥布林踢營火：受傷的紮營敵人一腳踢翻火堆——火星飛向隨機隊員（小傷＋灼燒），營火耐久 −1
  tryKickFire(c){
    if(!c || c.side!=='enemy' || c.isSummon || !c.alive || c.boss) return false;
    if(typeof ENV_CAMPERS==='undefined' || ENV_CAMPERS.indexOf(c.sprite)<0) return false;
    if(c.maxHp<=0 || c.hp/c.maxHp>=0.6 || c._kicked) return false;
    const cf=(this.envObjs||[]).find(o=>o&&!o.dead&&o.type==='campfire'&&o.dur>0); if(!cf) return false;
    c._kicked=true;
    this.floatLabel(c.container.x, c.baseY-58, '狗急跳牆!', '#ff9a3a');
    this.enemyGoUse(c, cf, ()=>{
      if(c.spr) this.tweens.add({targets:c.spr, angle:-24, yoyo:true, duration:130});   // 起腳
      if(cf.spr){ const s=cf.def.scl||4; this.tweens.add({targets:cf.spr, angle:30, scaleY:s*0.8, yoyo:true, duration:200}); }
      this.shake(120,0.006);
      const hs=this.aliveOf('hero');
      if(hs.length){ const h=hs[Math.floor(Math.random()*hs.length)];
        this.fxEmberArc(cf.x, cf.y-8, h, ()=>{ if(!h.alive) return;
          this.rawHit(h, 6, 0xff9a3a); if(this.addPoison) this.addPoison(h, 1, 'burn'); if(h.hp<=0) this.die(h); }, 0); }
      this.useObject(cf, 1, '被踢翻'); });
    return true;
  }
,
  // v4.7 紮營敵人暢飲酒桶：回血 10% 但爛醉（降速 4 秒）——回血給敵人、節奏還給你
  tryDrinkKeg(c){
    if(!c || c.side!=='enemy' || c.isSummon || !c.alive || c.boss) return false;
    if(typeof ENV_CAMPERS==='undefined' || ENV_CAMPERS.indexOf(c.sprite)<0) return false;
    if(c.maxHp<=0 || c.hp/c.maxHp>=0.55 || this.gnow<(c._kegCd||0)) return false;
    const kg=(this.envObjs||[]).find(o=>o&&!o.dead&&o.type==='keg'&&o.dur>0); if(!kg) return false;
    c._kegCd=this.gnow+8000;
    this.floatLabel(c.container.x, c.baseY-58, '跑去灌酒!', '#ffd27a');
    this.enemyGoUse(c, kg, ()=>{
      if(c.spr) this.tweens.add({targets:c.spr, angle:14, yoyo:true, duration:200, repeat:1});   // 仰頭灌
      const amt=Math.round(c.maxHp*0.10); c.hp=Math.min(c.maxHp, c.hp+amt); this.bar(c);
      pixelNum(this, c.container.x, c.container.y-34, '+'+amt, 0x7dff9a);
      c.slowUntil=this.gnow+4000; c.slowMul=1.5;   // 爛醉：出手大幅變慢
      this.floatLabel(c.container.x, c.baseY-70, '爛醉…', '#c9a86a');
      if(c.spr){ c.spr.setTint(0xd0a0ff); this.time.delayedCall(4000, ()=>{ if(c.alive&&c.spr&&!c.stunned) c.spr.clearTint(); }); }
      this.useObject(kg, 1, '被灌了一輪'); });
    return true;
  }
,
  // v4.7 骸骨地坑重生：骸骨死亡且地坑有耐久 → 沉入地面，3 秒後自坑中半血爬回（每坑限耐久次數）
  // 回傳 true＝接管死亡流程（die() 不再走一般結算；勝負判定以 _pendingRebirth 防止提早結束）
  pitRebirth(c){
    if(!c || c.side!=='enemy' || c.boss || c.isSummon || c._reborn) return false;
    if(typeof ENV_BONES==='undefined' || ENV_BONES.indexOf(c.sprite)<0) return false;
    const pit=(this.envObjs||[]).find(o=>o&&!o.dead&&o.type==='pit'&&o.dur>0); if(!pit) return false;
    c._reborn=true; c.alive=false; c.hp=0;
    this._pendingRebirth=(this._pendingRebirth||0)+1;
    this.useObject(pit, 1, '骸骨再起…');
    if(c.stunStar){ c.stunStar.destroy(); c.stunStar=null; }
    if(c.stunLabel){ c.stunLabel.destroy(); c.stunLabel=null; }
    this.floatLabel(c.container.x, c.baseY-58, '沉入地底…', '#b0a890');
    this.tweens.add({targets:c.container, x:pit.x, y:pit.y, scaleX:0.2, scaleY:0.2, alpha:0.25, duration:420, ease:'Quad.in'});
    this.time.delayedCall(3000, ()=>{
      this._pendingRebirth=Math.max(0,(this._pendingRebirth||0)-1);
      if(this.over || !c.container){ return; }
      c.alive=true; c.hp=Math.max(1,Math.round(c.maxHp*0.5)); c.lastAttack=(this.gnow||0)+600;
      this.fxDust(pit.x, pit.y);
      this.floatLabel(pit.x, pit.y-56, '骸骨再起!', '#ffd24a');
      this.tweens.add({targets:c.container, y:pit.y-26, scaleX:1, scaleY:1, alpha:1, duration:320, ease:'Back.out',
        onComplete:()=>{ this.tweens.add({targets:c.container, x:c.baseX, y:c.baseY, duration:340, ease:'Quad.out',
          onComplete:()=>{ if(c.container) c.container.setDepth(c.baseY/200); }}); }});
      this.bar(c);
    });
    return true;
  }
,
  // ---- v3.3 盜賊・移形換位：受擊瞬間與巨木換位（MISS）；巨木代承這一擊、耐久 −1（樹耐久 1 ＝ 一棵樹擋一次）----
  swapWithTree(rogue, tr){
    const rx=rogue.baseX, ry=rogue.baseY, tx=tr.x, ty=tr.y;
    // 殘影：原地留下淡出的盜賊剪影
    const ghost=this.add.image(rogue.container.x, rogue.container.y, rogue.sprite).setScale(rogue.baseScale||SCALE).setAlpha(0.45).setTint(0x9a9ad0).setDepth(70);
    this.tweens.add({targets:ghost, alpha:0, duration:260, onComplete:()=>ghost.destroy()});
    // 位置對調（座標與 Y-sort 一併交換）
    rogue.baseX=tx; rogue.baseY=ty;
    rogue.container.setPosition(tx,ty).setDepth(ty/200);
    tr.x=rx; tr.y=ry;
    tr.container.setPosition(rx,ry).setDepth(tr.def.ground?0.6:ry/200);
    this.floatLabel(rx, ry-52, 'MISS', '#9fe8ff');
    this.floatLabel(tx, ty-58, '移形換位!', '#9fe8ff');
    this.spark(tx, ty-10, 0x9fe8ff);
    this.shake(80,0.004);
    // 巨木代承這一擊：稍後應聲碎裂（耐久 1 → 直接耗盡）
    this.time.delayedCall(140, ()=>this.useObject(tr, 1));
  }
,
  // ---- v3.3 空間裂縫增幅：空間魔法（affinity 'void'）在裂縫旁施放 → 增幅並消耗裂縫耐久 1 ----
  voidAmp(c, sk){
    if(!sk || !sk.affinity || sk.affinity.indexOf('void')<0) return false;
    const rf=this.objectWithTag('void'); if(!rf) return false;
    this.useObject(rf, 1, '空間增幅');
    this.screenFlash(0xc46bff, 0.14, 200);
    const ring=this.add.circle(rf.x, rf.y, 12, 0xc46bff, 0.5).setDepth(72);
    this.tweens.add({targets:ring, radius:80, alpha:0, duration:360, ease:'Quad.out', onComplete:()=>ring.destroy()});
    if(c) this.envLabel(c, '空間增幅!', '#c46bff', 500);
    return true;
  }
,
  // ---- 環境強化條件判定：天氣匹配（每場每技能一次）或 水源物件替代雨天（消耗耐久，可重複至耗盡）----
  weatherBoost(c, sk){
    if(!sk || !sk.weatherAffinity) return false;
    if(sk.weatherAffinity===this._wxId){
      if(!c._wxUsed) c._wxUsed={};
      if(!c._wxUsed[sk.name]){ c._wxUsed[sk.name]=true; return true; }
      return false;
    }
    if(sk.weatherAffinity==='rain'){   // 小溪等水源＝雨天條件的替代品
      const w=this.objectWithTag('water');
      if(w && w.def.dur>0 && w.dur>0){ this.useObject(w, 1, '水源共鳴'); this.fxRipple(w.x, w.y); return true; }
    }
    return false;
  }
,
  // ---- 毒 DoT（毒沼／未來盜賊毒共用堆疊）----
  addPoison(u, n, kind){
    if(!u || !u.alive) return;
    if(!u._poison) u._poison={s:0, next:(this.gnow||0)+CFG.env.poisonTickMs};
    u._poison.s=Math.min(CFG.env.poisonMaxStacks, u._poison.s+(n||1));
    const burn=(kind==='burn');   // v4.3 灼燒（炎爆）：與毒共用堆疊，僅視覺/文字不同
    if(burn) this.fxFirePuff(u.container.x, u.container.y+10); else this.fxBubbles(u.container.x, u.container.y+16);
    this.floatLabel(u.container.x, u.baseY-52, (burn?'灼燒×':'中毒×')+u._poison.s, burn?'#ff9a3a':'#9adf6a');
  }
,
  // ---- 環境 tick：地形光環（岩漿灼燒/毒沼疊毒，屬地形不耗耐久）＋毒 DoT ----
  envTick(){
    const g=this.gnow||0, E=CFG.env;
    (this.envObjs||[]).forEach(o=>{
      if(!o || o.dead || !o.def.aura || g < o._nextAura) return;
      if(o.def.aura==='burn'){ o._nextAura=g+E.lavaEveryMs;
        const pool=this.all.filter(u=>u.alive && !u.isSummon && u.row==='front');
        if(pool.length){ const u=pool[Math.floor(Math.random()*pool.length)];
          this.fxEmberArc(o.x, o.y, u, null, 0);
          const isFireMage = u.side==='hero' && u.sprite==='mage' && (u.skills||[]).some(s=>s.affinity&&s.affinity.indexOf('fire')>=0);
          if(isFireMage){ u.atkBuffUntil=g+4000; u.atkBuffAmt=Math.max(u.atkBuffAmt||0, E.lavaAbsorbAtk); this.floatLabel(u.container.x,u.baseY-52,'吸收火勢 ATK+'+E.lavaAbsorbAtk,'#ff9a3a'); }
          else { const amt=E.lavaBurnBase+E.lavaBurnPerTier*((RUN&&RUN.destTier)||1); this.rawHit(u, amt, 0xff9a3a); this.fxFirePuff(u.container.x,u.container.y); this.floatLabel(u.container.x,u.baseY-52,'灼燒','#ff9a3a'); if(u.hp<=0) this.die(u); } } }
      else if(o.def.aura==='poison'){ o._nextAura=g+E.bogEveryMs;
        this.fxBubbles(o.x+(Math.random()-0.5)*40, o.y-4);
        const pool=this.all.filter(u=>u.alive && !u.isSummon);
        if(pool.length) this.addPoison(pool[Math.floor(Math.random()*pool.length)], 1); }
      // v4.5 奧術水晶塔：週期電擊隨機敵人（每擊耗 1 耐久）
      else if(o.def.aura==='zap'){ o._nextAura=g+5000;
        if(o.dur>0){ const foes=this.aliveOf('enemy');
          if(foes.length){ const f=foes[Math.floor(Math.random()*foes.length)];
            this.fxEmberArc(o.x, o.y-20, f, ()=>{ if(!f.alive) return; this.rawHit(f, 9, 0xa98bff); this.spark(f.container.x,f.container.y,0xa98bff); if(f.hp<=0) this.die(f); }, 0);
            this.floatLabel(o.x, o.y-52, '魔力協奏', '#a98bff');
            this.useObject(o, 1); } } }
      // v4.7 蜂巢：中立騷擾——週期螫刺隨機單位（敵我皆然，小傷＋中毒 1 層），螫完耐久墜落
      else if(o.def.aura==='sting'){ o._nextAura=g+6000;
        if(o.dur>0){ const pool=this.all.filter(u=>u.alive && !u.isSummon);
          if(pool.length){ const u=pool[Math.floor(Math.random()*pool.length)];
            if(o.spr){ const s=o.def.scl||4; this.tweens.add({targets:o.spr, angle:14, yoyo:true, duration:120, repeat:2}); }
            this.floatLabel(o.x, o.y-40, '蜂群出動!', '#ffd24a');
            this.fxEmberArc(o.x, o.y, u, ()=>{ if(!u.alive) return;
              this.rawHit(u, 3, 0xffd24a); if(this.addPoison) this.addPoison(u, 1); if(u.hp<=0) this.die(u); }, 0);
            this.useObject(o, 1); } } }
      // v4.5 獵風圖騰：週期順風脈衝——我方全體（含精靈）短暫加速（每次耗 1 耐久）
      else if(o.def.aura==='hastePulse'){ o._nextAura=g+4200;
        if(o.dur>0){ let n=0;
          (this.all||[]).forEach(u=>{ if(u.alive && u.side==='hero'){ u.hasteUntil=g+2200; u.hasteMul=0.8; n++; } });
          if(n){ this.fxRipple(o.x, o.y+6); this.floatLabel(o.x, o.y-52, '順風!', '#9fe8ff'); this.useObject(o, 1); } } }
    });
    for(const u of (this.all||[])){
      // v4.4 燃燒狂徒：自燃維持 3 層（永遠在燒，考驗對手能不能撐過去）
      if(u.selfBurn && u.alive){ if(!u._poison) u._poison={s:3, next:g+E.poisonTickMs}; else if(u._poison.s<3) u._poison.s=3; }
      const p=u._poison; if(!u.alive || !p || p.s<=0 || g<p.next) continue;
      p.next=g+E.poisonTickMs;
      this.rawHit(u, p.s*E.poisonDmgPerStack, u.selfBurn?0xff9a3a:0x9adf6a);
      if(u.selfBurn) this.fxFirePuff(u.container.x, u.container.y+6); else this.fxBubbles(u.container.x, u.container.y+10);
      p.s--; if(u.hp<=0) this.die(u);
    }
  }
,
  // ---- 出手間隔（環境影響）：雪＝全場變慢；降速/加速以 gnow 判定 ----
  effInterval(c){
    let iv=c.interval;
    if(this._wxId==='snow') iv*=CFG.env.snowIntervalMul;
    if(c.slowUntil && this.gnow<c.slowUntil) iv*=(c.slowMul||1.3);
    if(c.hasteUntil && this.gnow<c.hasteUntil) iv*=(c.hasteMul||0.85);
    // v4.0 遊俠・精靈羈絆：召喚精靈在場時出手加速 15%
    if(c.side==='hero' && (c.skills||[]).some(s=>s.type==='spiritBond') && (this.summons||[]).some(sp=>sp && !sp._removed)) iv*=0.85;
    return iv;
  }
,
  // ---- 天氣氛圍：雨絲/霧氣/風痕/落雪（tween 驅動，暫停凍結；每場重建）----
  buildWeatherFX(){
    if(this._wxFX){ this._wxFX.destroy(); this._wxFX=null; }
    const wx=this._wxId; if(!wx || wx==='clear') return;
    const W=this.scale.width, H=this.scale.height;
    const fx=this.add.container(0,0).setDepth(45); this._wxFX=fx;
    if(wx==='rain'){
      for(let i=0;i<16;i++){ const r=this.add.rectangle(Math.random()*W, Math.random()*H, 2, 14, 0x9fd0ff, 0.35); r.rotation=0.12; fx.add(r);
        this.tweens.add({targets:r, y:H+20, duration:620+Math.random()*320, repeat:-1, delay:Math.random()*600,
          onRepeat:()=>{ r.y=-20; r.x=Math.random()*W; }}); }
    } else if(wx==='fog'){
      fx.add(this.add.rectangle(0,0,W,H,0xb8c0d0,0.08).setOrigin(0));
      for(let i=0;i<4;i++){ const e=this.add.ellipse(Math.random()*W, 140+Math.random()*300, 340, 90, 0xc8d0e0, 0.10); fx.add(e);
        this.tweens.add({targets:e, x:e.x+120+Math.random()*80, duration:5200+Math.random()*2400, yoyo:true, repeat:-1, ease:'Sine.inOut'}); }
    } else if(wx==='wind'){
      for(let i=0;i<10;i++){ const r=this.add.rectangle(Math.random()*W, 120+Math.random()*360, 26, 2, 0xd8e8e0, 0.30); fx.add(r);
        this.tweens.add({targets:r, x:W+40, duration:520+Math.random()*380, repeat:-1, delay:Math.random()*500,
          onRepeat:()=>{ r.x=-40; r.y=120+Math.random()*360; }}); }
    } else if(wx==='snow'){
      for(let i=0;i<14;i++){ const p=this.add.circle(Math.random()*W, Math.random()*H, 2.2, 0xffffff, 0.55); fx.add(p);
        this.tweens.add({targets:p, y:H+12, duration:2600+Math.random()*1600, repeat:-1, delay:Math.random()*1500,
          onRepeat:()=>{ p.y=-12; p.x=Math.random()*W; }});
        this.tweens.add({targets:p, x:p.x+26, duration:900+Math.random()*500, yoyo:true, repeat:-1, ease:'Sine.inOut'}); }
    }
  }
,
  // ---- 共用小動畫 ----
  fxDust(x,y){ for(let i=0;i<6;i++){ const a=Math.PI+Math.random()*Math.PI, d=12+Math.random()*18;
    const p=this.add.circle(x,y,2.4,0xb0a890,0.6).setDepth(66);
    this.tweens.add({targets:p, x:x+Math.cos(a)*d, y:y-Math.abs(Math.sin(a))*10, alpha:0, duration:340+Math.random()*160, ease:'Quad.out', onComplete:()=>p.destroy()}); } }
,
  fxLeaves(x,y){ for(let i=0;i<8;i++){ const p=this.add.rectangle(x+(Math.random()-0.5)*26, y, 4, 3, i%2?0x83b154:0x5a7d33).setDepth(78);
    this.tweens.add({targets:p, x:p.x+(Math.random()-0.5)*60, y:y+30+Math.random()*34, angle:Math.random()*360, alpha:0, duration:520+Math.random()*300, ease:'Sine.in', onComplete:()=>p.destroy()}); } }
,
  fxFirePuff(x,y){ for(let i=0;i<4;i++){ const p=this.add.circle(x+(Math.random()-0.5)*16, y, 3, 0xff9a3a, 0.8).setDepth(72);
    this.tweens.add({targets:p, y:y-18-Math.random()*10, alpha:0, scale:0.4, duration:300+Math.random()*140, ease:'Quad.out', onComplete:()=>p.destroy()}); } }
,
  fxBubbles(x,y){ for(let i=0;i<3;i++){ const p=this.add.circle(x+(Math.random()-0.5)*18, y, 2+Math.random()*2, 0x9adf6a, 0.55).setDepth(66);
    this.tweens.add({targets:p, y:y-14-Math.random()*10, alpha:0, duration:420+Math.random()*200, ease:'Sine.out', onComplete:()=>p.destroy()}); } }
,
  fxRipple(x,y){ for(let i=0;i<3;i++){ const ring=this.add.ellipse(x,y,20,8,0x46ccc6,0).setDepth(66).setStrokeStyle(2,0x46ccc6,0.6);
    this.tweens.add({targets:ring, scaleX:2.6, scaleY:2.6, alpha:0, duration:520, delay:i*130, ease:'Quad.out', onComplete:()=>ring.destroy()}); } }
,
  // 餘燼弧線：火點以拋物線飛向目標（先揚後落），到點觸發 cb
  fxEmberArc(x,y,target,cb,delay){
    const p=this.add.circle(x,y,4,0xff9a3a,0.95).setDepth(72).setStrokeStyle(1.5,0xffe08a,0.8);
    const tx=target.container?target.container.x:target.x, ty=target.container?target.container.y:target.y;
    const mx=(x+tx)/2, my=Math.min(y,ty)-60-Math.random()*30;
    this.tweens.add({targets:p, x:mx, y:my, duration:170, delay:delay||0, ease:'Quad.out',
      onComplete:()=>this.tweens.add({targets:p, x:tx, y:ty, duration:170, ease:'Quad.in',
        onComplete:()=>{ p.destroy(); if(cb) cb(); }})});
  }
,
  // 環境提示浮字（節流防洗版）
  envLabel(c, text, color, throttleMs){
    const now=this.gnow||0; if(!c._envLb) c._envLb={};
    if(now-(c._envLb[text]||-1e9) < (throttleMs||1500)) return;
    c._envLb[text]=now;
    this.floatLabel(c.container? c.container.x : c.baseX, c.baseY-58, text, color||'#9fe8ff');
  }
});
