// ========================= 出發整備（v0.9 重塑）=========================
class Outfit extends Phaser.Scene {
  constructor(){ super('Outfit'); }
  create(){
    if(!RUN) initRun();
    const W=this.scale.width;
    sceneBg(this,{glow:0x6ee29a});
    sceneHeader(this,'出 發 整 備','',{accent:'green'});
    button(this, 70, 20, 120, 28, '返回大廳', ()=>this.scene.start('GuildHall'), {variant:'info', size:12, icon:'home', iconSize:13});

    const specs=[
      {label:'遺物 '+GUILD.relics.length+'/'+relicTotalCount(), accent:'violet', icon:'relic', size:12, h:25},
    ];
    const chips=specs.map(s=>chip(this,0,0,s)); let tot=chips.reduce((a,c)=>a+c.w,0)+10*(chips.length-1); let cx=W/2-tot/2; chips.forEach(c=>{c.setX(cx);c.setY(60);cx+=c.w+10;});

    let hp=0,atk=0,def=0,heal=0; RUN.heroes.forEach(h=>{const s=heroStat(h);hp+=s.maxHp;atk+=s.atkSeq[0];def+=s.def;heal+=s.heal;});
    const power=Math.round(hp*0.5+atk*6+def*8+heal*4);
    const pc=chip(this,0,90,{label:'隊伍戰力 '+power+'　·　總HP '+hp+'　·　前段ATK '+atk+'　·　總DEF '+def+(heal?'　·　治療 '+heal:''), accent:'gold', size:12, h:24}); pc.setX(W/2-pc.w/2);

    const n=RUN.heroes.length, cw=Math.min(206, Math.floor((864-(n-1)*14)/n)), ch=180, total=n*cw+(n-1)*14, x0=(W-total)/2+cw/2;
    RUN.heroes.forEach((h,i)=>this.heroCard(h, x0+i*(cw+14), 208, cw, ch));

    const ws=wagonStats();
    const p=panel(this, W/2, 376, 540, 96, {accent:'ember', title:'本趟商隊', icon:'wagon', titleSize:14});
    const c1=chip(this, 0, p.bodyTop+12, {label:'馬匹 · '+ws.horse, accent:'ember', icon:'wagon', size:12, h:26});
    const c3=chip(this, 0, p.bodyTop+12, {label:'貨格 '+ws.slots, accent:'teal', icon:'box', size:12, h:26});
    let cw2=c1.w+c3.w+12, sx=W/2-cw2/2; c1.setX(sx); c3.setX(sx+c1.w+12);
    txt(this, W/2, p.bodyTop+40, '在「商隊工坊」可換馬與項目強化', 10.5, UI.dim);

    button(this, W/2, 484, 300, 46, '出 發 探 險', ()=>this.depart(), {variant:'go', size:18, icon:'play', iconSize:18});
  }
  heroCard(h,x,y,w,hh){
    const s=heroStat(h), i=h.idx, top=y-hh/2, L=x-w/2;
    const g=this.add.graphics();
    g.fillStyle(0x000000,0.36); g.fillRoundedRect(L,top+4,w,hh,12);
    g.fillStyle(UI.raisedN,1); g.fillRoundedRect(L,top,w,hh,12);
    g.fillStyle(UI.panelHiN,0.5); g.fillRoundedRect(L,top,w,hh*0.30,12);
    g.lineStyle(2, UI.tealN, 0.65); g.strokeRoundedRect(L,top,w,hh,12);
    g.fillStyle(UI.inkN,0.55); g.fillCircle(x, top+34, 25); g.lineStyle(2, UI.tealN,0.4); g.strokeCircle(x, top+34, 25);
    this.add.image(x, top+36, h.sprite).setScale(2.8);
    txt(this, x, top+68, h.name+'　Lv'+s.level, 14, UI.gold);
    const armorHp=h.armor.hp||0, rowL=L+15;
    let ry=top+90;
    icon(this,rowL+6,ry,'heart',13,UI.greenN); txt(this,rowL+18,ry,'HP '+(s.maxHp-armorHp)+(armorHp?'  盾'+armorHp:''),11,UI.text,0);
    ry+=19; icon(this,rowL+6,ry,'sword',13,UI.goldN); txt(this,rowL+18,ry,'ATK '+s.atkSeq.join('/'),11,UI.text,0);
    ry+=19; icon(this,rowL+6,ry,'shield',13,UI.blueN); txt(this,rowL+18,ry,'DEF '+s.def+(s.heal?'　治療 '+s.heal:''),11,UI.text,0);
    ry+=20; txt(this,rowL,ry,h.weapon.name+'　·　'+h.armor.name,10.5,UI.teal,0);
    txt(this, L+14, top+hh-21, 'EXP', 9, UI.dim, 0);
    statBar(this, L+44, top+hh-18, w-58, 7, ROSTER[i].xp, xpNeed(s.level), {accent:'violet'});
  }
  depart(){
    const ws=wagonStats();
    RUN.slots = ws.slots;
    RUN.cargo=[];
    RUN.heroes.forEach(h=>{ h.hp=heroStat(h).maxHp; });
    this.scene.start('WorldMap');
  }
}
