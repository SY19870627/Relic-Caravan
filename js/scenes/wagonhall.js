// ========================= 馬車工坊（選馬 + 項目化強化，工匠負責） =========================
// v159：漸進展開——先選馬；聘工匠後才顯示可做的強化；補給架首次進入解鎖；公會帳簿／旗幟改到委託板
class WagonHall extends Phaser.Scene {
  constructor(){ super('WagonHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(1.35,1.35).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,24,'馬 車 工 坊',22,TH.gold);
    txt(this,W/2,46,'選馬車決定貨格；強化與補給架會隨進度展開',12,TH.dim);
    button(this, 96, 24, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    this._supplyHit=null;
    this.render();
    // 首次進工坊：解鎖補給架＋挖洞說明（延遲等 render 座標就緒）
    this.time.delayedCall(180, ()=>this.maybeUnlockSupply());
  }
  maybeUnlockSupply(){
    const locked=(typeof supplyUnlocked==='function') ? !supplyUnlocked() : false;
    if(locked && typeof unlockSupplyRack==='function') unlockSupplyRack();
    this.render();
    if(typeof Tutorial==='undefined') return;
    if(Tutorial.seen('supplyRack')){
      if(locked) this.flash('補給架已裝上——每波戰鬥會自篷車拋出選中的物件', TH.green);
      return;
    }
    const start=()=>{
      if(this._tutOn){ this.time.delayedCall(250, start); return; }
      const hit=this._supplyHit || {x:this.scale.width/2-220, y:500, w:440, h:40};
      Tutorial.tour(this,'supplyRack',[
        {targets:()=>[this._supplyHit||hit], tap:true, title:'商隊補給架', last:'知道了',
         text:'工坊幫你裝上了補給架。\n每波戰鬥開始時，篷車會把選中的物件拋到場上（例如戰士銅鑼：戰吼時震聾敵人）。\n點下方按鈕可換其他職業的代表物件；不選就不拋。'}
      ],{onClose:()=>{ if(!Tutorial.seen('WagonHall')) Tutorial.tip(this,'WagonHall'); }});
    };
    this.time.delayedCall(120, start);
  }
  // 工坊強化清單：排除已搬到委託板的公會帳簿／旗幟；只顯示目前工匠階級做得到的
  wagonUpgrades(){
    const ct=craftsmanTier();
    return UPGRADES.filter(u=>u.id!=='spring' && u.id!=='flag' && ct>=(u.craftReq||1));
  }
  nextLockedUpgrade(){
    const ct=craftsmanTier();
    return UPGRADES.find(u=>u.id!=='spring' && u.id!=='flag' && (u.craftReq||1)===ct+1);
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    this._supplyHit=null;
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    const ct=craftsmanTier(), cnames=['未聘工匠','學徒','師傅','大師'];
    const ws=wagonStats();
    const matStr=MATERIALS.map(m=>`${m.icon}${m.name} ${matCount(m.id)}`).join('　');
    add(txt(this,W/2,72,`🛠 工匠：${cnames[ct]}　馬車貨格：📦${ws.slots}　⭐聲望 ${reputation()}`,13,TH.gold));
    add(txt(this,W/2,92,`素材：${matStr}`,11,TH.cyan));

    // —— 選馬車（永遠顯示）——
    add(txt(this,W/2,116,'── 選擇馬車（決定貨格，🔒 由左至右依序解鎖）──',12,TH.gold));
    const pitch=222, x0=W/2-(HORSES.length-1)/2*pitch;
    HORSES.forEach((h,i)=>{
      const cx=x0+i*pitch, cy=192, sel=(GUILD.horse||0)===i, unlocked=horseUnlocked(i);
      const isNext=!unlocked && horseUnlocked(i-1);
      const c=this.add.container(cx,cy); add(c);
      c.add(this.add.rectangle(0,0,210,120,TH.panel, unlocked?1:(isNext?0.7:0.45)).setStrokeStyle(sel?3:2, !unlocked?(isNext?0x8a7a3a:0x4a4658):(sel?0xe7c14a:0x5a8cd0)));
      c.add(txt(this,0,-44,unlocked?h.name:`🔒 ${h.name}`,15, (!unlocked&&!isNext)?TH.dim:TH.gold));
      c.add(txt(this,0,-18,`📦 貨格 ${h.slots}`,16, (!unlocked&&!isNext)?TH.dim:TH.text));
      c.add(txt(this,0,8,h.desc,10,TH.dim).setWordWrapWidth(192).setAlign('center'));
      if(!unlocked && !isNext){
        c.add(txt(this,0,45,'需先解鎖前一輛',11,TH.dim));
      } else if(!unlocked){ const ok=canUnlockHorse(i);
        c.add(button(this,0,45,154,26,`解鎖 ⭐${horseCost(i)}`,()=>{
          if(!canUnlockHorse(i)){ this.flash(`聲望不足，需 ⭐${horseCost(i)}`); return; }
          unlockHorse(i); this.flash(`已解鎖 ${h.name}`,TH.green); this.render();
        },{size:12, fill:ok?0x3a6b3a:0x33323a, stroke:ok?0x5ad06a:0x55555f, hover:ok?0x4c8c4c:0x33323a}));
      } else if(sel) c.add(txt(this,0,46,'✓ 目前選用',12,'#5ad06a'));
      else c.add(button(this,0,45,120,24,'選用',()=>{ GUILD.horse=i; saveGuild(); this.render(); },{size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c}));
    });

    // —— 工坊強化（漸進：未聘工匠只提示；有工匠只列目前階級可做的）——
    let yAfterHorses=266;
    add(txt(this,W/2,yAfterHorses,'── 工坊強化（隨工匠階級展開）──',12,TH.gold));
    if(ct===0){
      add(txt(this,W/2,yAfterHorses+28,'⚠ 尚未聘僱工匠 → 請至招募所「後勤」聘僱學徒，才能做強化',12,TH.red));
      add(txt(this,W/2,yAfterHorses+52,'公會帳簿、公會旗幟改在「公會委託」板升級',11,TH.dim));
      yAfterHorses+=80;
    } else {
      const list=this.wagonUpgrades();
      add(txt(this,W/2,yAfterHorses+18,'點擊升級・素材成本隨等級成長　·　帳簿／旗幟→委託板',10.5,TH.dim));
      list.forEach((u,j)=>{
        const col=j%2, row=(j-col)/2, cx=W/2+(col?226:-226), cy=yAfterHorses+48+row*40;
        const lv=upgradeLv(u.id), maxed=lv>=(u.maxLv||1), ok=canBuyUpgrade(u);
        const tier=u.craftReq===1?'學徒':u.craftReq===2?'師傅':'大師';
        const c=this.add.container(cx,cy); add(c);
        c.add(this.add.rectangle(0,0,440,36, TH.panel, maxed?0.55:1).setStrokeStyle(1.5, maxed?0x5ad06a:(ok?0x5ad06a:0x55476b)));
        c.add(txt(this,-208,-8,`${u.name} Lv${lv}/${u.maxLv||1}［${tier}］`,11.5, maxed?'#5ad06a':TH.text,0,0.5));
        c.add(txt(this,-208,9,u.desc,8.5,TH.dim,0,0.5).setWordWrapWidth(300));
        c.add(txt(this,208,0, maxed?'✓ 滿級':upgradeCostText(u), 9.5, maxed?'#5ad06a':(ok?TH.green:TH.dim),1,0.5));
        const hit=this.add.rectangle(cx,cy,440,36,0xffffff,0.001).setInteractive({useHandCursor:true}); add(hit);
        hit.on('pointerdown',()=>{
          if(maxed) return;
          if(craftsmanTier()<u.craftReq){ this.flash(`需 ${tier} 工匠`); return; }
          const nl=lv+1, m=u.cost.mats||{}; for(const k in m){ if(matCount(k)<matCostAt(m[k],nl)){ this.flash(`素材不足：${MATERIAL_BY_ID[k].name}×${matCostAt(m[k],nl)}`); return; } }
          if(!buyUpgrade(u)){ this.flash('聲望不足'); return; }
          this.flash(`${u.name} → Lv${nl}`,TH.green); this.render();
        });
      });
      const rows=Math.ceil(list.length/2);
      yAfterHorses += 48 + Math.max(1,rows)*40 + 8;
      const nx=this.nextLockedUpgrade();
      if(nx){
        const need=nx.craftReq===2?'師傅':'大師';
        add(txt(this,W/2,yAfterHorses,`🔒 升至${need}工匠後解鎖更多強化（下一項：${nx.name}）`,11,TH.dim));
        yAfterHorses+=22;
      }
    }

    // —— 補給架 ——
    const sy=Math.min(542, Math.max(yAfterHorses+16, 480));
    if(!supplyUnlocked()){
      const box={x:W/2-300, y:sy-16, w:600, h:36};
      add(this.add.rectangle(W/2, sy, 600, 36, 0x241a30, 0.85).setStrokeStyle(1.5, 0x55476b));
      add(txt(this,W/2,sy,'補給架（未裝）— 首次進入本工坊時由工匠裝上',12,TH.dim));
      this._supplyHit=box;
    } else {
      const sCap=supplyCap(), sPicks=supplyPicks();
      add(txt(this,96,sy,`補給架 ${sPicks.length}/${sCap}`,11.5,TH.gold,1,0.5).setOrigin(1,0.5));
      const SUP_LABEL={gong:'🔔 銅鑼・戰士', totem:'🌀 圖騰・遊俠', candles:'🕯 燭台・牧師', crystal:'🔮 水晶・法師', lantern:'🏮 燈籠・盜賊'};
      const spw=142, sx0=228;
      SUPPLY_OBJECTS.forEach((s,i)=>{ const on=sPicks.indexOf(s.type)>=0;
        add(button(this, sx0+i*spw, sy, 134, 26, (on?'✓ ':'')+SUP_LABEL[s.type], ()=>{
          if(!toggleSupplyPick(s.type)){ this.flash('補給架尚未解鎖'); return; }
          this.render();
        },{size:10, fill:on?0x3a6b3a:0x33323a, stroke:on?0x5ad06a:0x55555f, hover:on?0x4c8c4c:0x44424e}));
      });
      this._supplyHit={x:sx0-67, y:sy-16, w:spw*5-8, h:36};
      if(!sPicks.length) add(txt(this,W/2,sy+28,'目前未選物件——戰鬥中不會拋出補給',10.5,TH.dim));
    }
  }
  flash(msg,col){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,96,msg,14,col||TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:1000,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
