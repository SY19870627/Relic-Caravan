// ========================= 啟動 =========================
window.__GAME = new Phaser.Game({
  type:Phaser.AUTO, width:900, height:560, parent:'game',
  backgroundColor:'#0e0a14', pixelArt:true, roundPixels:true,
  scale:{ mode:Phaser.Scale.FIT, autoCenter:Phaser.Scale.CENTER_BOTH },   // 隨視窗等比縮放置中
  scene:[Boot,GuildHall,CharacterHall,WagonHall,WarehouseHall,FormationHall,RecruitHall,Outfit,WorldMap,MapScene,Battle,Result],
});
