// ========================= 啟動 =========================
window.__GAME = new Phaser.Game({
  type:Phaser.AUTO, width:900, height:560, parent:'game',
  backgroundColor:'#0e0a14', pixelArt:false, roundPixels:false,
  scale:{ mode:Phaser.Scale.FIT, autoCenter:Phaser.Scale.CENTER_BOTH },   // 隨視窗等比縮放置中
  scene:[Boot,GuildHall,WagonHall,WarehouseHall,QuestHall,FormationHall,RecruitHall,SkillTreeHall,TrialHall,SimLab,Outfit,WorldMap,Battle,Result],
});
// 新手教學：場景建立後檢查要不要播（tutorial.js）
window.__GAME.events.once('ready', ()=>{ if(typeof Tutorial!=='undefined') Tutorial.attach(window.__GAME); });
