// ========================= 資料 =========================
const PAL = {
  '.':null, K:'#140d18',
  S:'#e6b48c', s:'#c98f6a', W:'#c9cfda', M:'#eef1f6', n:'#474e5e',
  G:'#e7c14a', C:'#c23b3b', c:'#822626', B:'#6e4a2a', b:'#4d3019',
  g:'#83b154', e:'#5a7d33', R:'#e9dca6', r:'#c7b577',
  o:'#9c6b34', i:'#d9d2b0', q:'#6fd0e0', H:'#2f7d46', h:'#1f5631',
  A:'#ff5a4a', t:'#8a8f9c', T:'#5b606e',
  u:'#8a6fd0', U:'#4f3a8f',
  F:'#ff9a3a', Y:'#ffe27a', P:'#caa6ff',
  // v1.1 地區主題色：沉沒神城（teal）／虛空裂隙（magenta-void）／骨／珊瑚
  v:'#2f9aa6', V:'#1c5f6b',   // 深海皮膚（亮/暗 teal）
  x:'#c46bff', z:'#2a1640',   // 虛空亮紫 / 虛空暗紫黑
  j:'#aab2c4',                // 骨頭陰影灰
  f:'#ff8f6a',                // 珊瑚橘
  l:'#a8f0c0', w:'#46566e', d:'#d2603a',   // v1.4：幽靈綠 / 鋼藍灰 / 蟹殼紅
};
const SPRITES = {
  warrior:["...KKKKK....","..KWWWWWK...","..KWnnnWK...","..KSSSSSK...","..KSKSKSK...","..KSSSSSK...","...KSSSK....",".GCCCCCG.M..","WKCCCCCK.M..","WKCCCCCK.M..","WKBBBBBK.M..",".KcccccK....",".KccKccK....",".KnnKnnK....",".KK..KK.....","............"],
  ranger:["...HHHHH....","..HHHHHHH...","..HhSSShH...","..HSSSSSH...","..HSKSKSH...","..HhSSShH...","...hSSSh....","..HHHHHHo...",".KHHHHHKoi..",".KHhhhHKoi..",".KBhhhBKoi..",".KhhhhhK.o..",".KhhKhhK....",".KnnKnnK....",".KK..KK.....","............"],
  priest:["...GGGGG....","..GRRRRRG...","..GRSSSRG...","..RSSSSSR...","..RSKSKSR...","..RrSSSrR...","...RSSSR.q..","..GRRRRRGo..",".KRRRRRKo...",".KRrrrRKo...",".KRrrrRKo...",".KrrrrrKo...",".KrrKrrK....",".KnnKnnK....",".KK..KK.....","............"],
  goblin:["............","...ggggg....","..gggggggg..","..geggggeg..","..gAgggAgg..","..gggggggg..","...geeeg....","..gggggg.M..",".KggggggKM..",".KgeggegK...",".KBBBBBBK...",".KbbKbbK....",".KeeKeeK....",".KKK.KKK....","............","............"],
  goblinArcher:["............","...ggggg....","..gggggggg..","..geggggeg..","..gAgggAgg..","..gggggggg..","...geeeg....","..ggggggo...",".KggggggKoi.",".KgeggegKoi.",".KBBBBBBK.o.",".KbbKbbK....",".KeeKeeK....",".KKK.KKK....","............","............"],
  guardian:["............",".TTTTTTTTTT.",".TttttttttT.",".TtAttttAtT.",".TttttttttT.",".TtTTTTTTtT.",".TttttttttT.",".TttttttttT.","TTTttttttTTT","TTTttttttTTT",".TttttttttT.",".TttttttttT.",".TttttttttT.",".TTT..TTT...",".KKK..KKK...","............"],
  mage:[".....K......","....KuK.....","...KuuuK....","..KuuuuuK...","...KSSSK....","...SKSKS....","...KSSSK.q..","..KuuuuuKo..",".KuUUUUuKo..",".KuUUUUuKo..",".KuUUUUuK...",".KuuuuuuK...",".KuuuKuuK...",".KnnKKnnK...",".KK....KK...","............"],
  rogue:["............","...nnnnn....","..nnTTTnn...","..nTtttTn...","..nTSSSTn...","..nSASASn...","...nSSSn....","..eehhheeM..",".KehhhhheKM.",".KehhhhheK..",".KhhhhhhhK..",".KhhhbhhhK..",".KhhhKhhhK..",".KnnK.KnnK..",".KK....KK...","............"],
  chest:["............","............","...KKKKKK...","..KGGGGGGK..",".KGYYYYYYGK.",".KGBBBBBBGK.",".KKKKKKKKKK.",".KBBBKKBBBK.",".KBBBKiKBBK.",".KBBBKKBBBK.",".KGYYYYYYGK.","..KGGGGGGK..","...KKKKKK...","............"],
  campfire:["............","......Y.....",".....YFY....",".....FAF....","....YFAFY...","....FFAFF...","...YFFAFFY..","...FFFFFFF..","....FFFFF...","..K......K..",".bBBBBBBBBb.","..bBBBBBBb..","...KK..KK...","............"],
  merchant:["...KKKK.....","..KuuuuK....",".KuUUUUuK...",".KuSSSSuK...",".KuSKKSuK...",".KuSSSSuK...","..KuSSuK....",".KUUUUUUK.G.","KUUUUUUUUKGY","KUUbbbUUUKG.","KUUUUUUUUK..",".KUUUUUUK...",".KUU..UUK...",".KK....KK...","............"],
  mystery:["......M.....","....M.q.....",".....KqK....","....KquqK...","...KquUqK...","...quUPUq...","...KqUPqK...","....KquK....",".....KqK....",".....KuK....","...tTTTTt...","..tTTTTTTt..","...tTTTTt...","............"],
  // ===== v1.1 地區主題敵人 =====
  // 枯骨峽谷（dest 1）：不死骸骨，脆皮高攻
  skeleton:["............","...MMMMM....","..MMMMMMMM..","..MjMMMMjM..","..MKMMMKMM..","..MMMMMMMM..","...MjjjM....","..MMMMMM.W..",".KMMMMMMKW..",".KMjMMjMK...",".KiiiiiiK...",".KiiKiiK....",".KjjKjjK....",".KKK.KKK....","............","............"],
  skeletonArcher:["............","...MMMMM....","..MMMMMMMM..","..MjMMMMjM..","..MKMMMKMM..","..MMMMMMMM..","...MjjjM....","..MMMMMMo...",".KMMMMMMKoi.",".KMjMMjMKoi.",".KiiiiiiK.o.",".KiiKiiK....",".KjjKjjK....",".KKK.KKK....","............","............"],
  boneBrute:["............",".jjjjjjjjjj.",".jMMMMMMMMj.",".jMAMMMMAMj.",".jMMMMMMMMj.",".jMjjjjjjMj.",".jMMMMMMMMj.",".jMMMMMMMMj.","jjMMMMMMMMjj","jjMMMMMMMMjj",".jMMMMMMMMj.",".jMMMMMMMMj.",".jMMMMMMMMj.",".jjj..jjj...",".KKK..KKK...","............"],
  necromancer:["...nnnnn....","..nnnnnnn...","..nMMMMMn...","..nMKMKMn...","..nMMMMMn...","..nMKKKMn...","...nMMMn.u..","..nnnnnnu...",".KnnnnnnKu..",".KnUUUUnK...",".KnUUUUnK...",".KnUUUUnK...",".KnnUnnK....",".KnnKnnK....",".KK..KK.....","............"],
  // 沉沒神城（dest 2）：溺亡與海怪，厚血強補
  drowned:["............","...vvvvv....","..vvvvvvvv..","..vVvvvvVv..","..vqvvvqvv..","..vvvvvvvv..","...vVVVv....","..vvvvvv.q..",".KvvvvvvKq..",".KvVvvVvK...",".KVVVVVVK...",".KVVKVVK....",".KqqKqqK....",".KKK.KKK....","............","............"],
  drownedArcher:["............","...vvvvv....","..vvvvvvvv..","..vVvvvvVv..","..vqvvvqvv..","..vvvvvvvv..","...vVVVv....","..vvvvvvo...",".KvvvvvvKoi.",".KvVvvVvKoi.",".KVVVVVVK.o.",".KVVKVVK....",".KqqKqqK....",".KKK.KKK....","............","............"],
  coralGolem:["............",".TTTTTTTTTT.",".TttttttttT.",".TtqttttqtT.",".TttttttttT.",".TtfTTTTftT.",".TttfttfttT.",".TttttttttT.","TTTttttttTTT","TTTtfttftTTT",".TttttttttT.",".TtfttttftT.",".TttttttttT.",".TTT..TTT...",".KKK..KKK...","............"],
  tidePriest:["...VVVVV....","..VVVVVVV...","..VvvvvvV...","..VvqvqvV...","..VvvvvvV...","..VvVVVvV...","...VvvvV.q..","..VVVVVVq...",".KVVVVVVKq..",".KVqqqqVK...",".KVqqqqVK...",".KVqqqqVK...",".KVVqVVK....",".KVVKVVK....",".KK..KK.....","............"],
  // 虛空裂隙（dest 3）：虛空魔物，爆發多技
  voidling:["............","...uuuuu....","..uuuuuuuu..","..uUuuuuUu..","..uAuuuAuu..","..uuuuuuuu..","...uUUUu....","..uuuuuu.x..",".KuuuuuuKx..",".KuUuuUuK...",".KUUUUUUK...",".KUUKUUK....",".KUUKUUK....",".KKK.KKK....","............","............"],
  voidArcher:["............","...uuuuu....","..uuuuuuuu..","..uUuuuuUu..","..uAuuuAuu..","..uuuuuuuu..","...uUUUu....","..uuuuuu.x..",".KuuuuuuKxx.",".KuUuuUuK.x.",".KUUUUUUK...",".KUUKUUK....",".KUUKUUK....",".KKK.KKK....","............","............"],
  voidColossus:["............",".UUUUUUUUUU.",".UuuuuuuuuU.",".UuAuuuuAuU.",".UuuuuuuuuU.",".UuxUUUUxuU.",".UuuxuuxuuU.",".UuuuuuuuuU.","UUUuuuuuuUUU","UUUuxuuxuUUU",".UuuuuuuuuU.",".UuxuuuuxuU.",".UuuuuuuuuU.",".UUU..UUU...",".KKK..KKK...","............"],
  voidSeer:["...zzzzz....","..zzzzzzz...","..zPPPPPz...","..zPAPAPz...","..zPPPPPz...","..zPxxxPz...","...zPPPz.x..","..zzzzzzx...",".KzzzzzzKx..",".KzxxxxzK...",".KzxxxxzK...",".KzxxxxzK...",".KzzxzzK....",".KzzKzzK....",".KK..KK.....","............"],
  // ===== v1.4 各地城新增敵人（每地城 5 種，分屬族群）=====
  // 近郊遺跡：哥布林部族（gobShaman/gobWolf/gobChief）＋遺跡造物（stoneHound/runeSentinel）
  gobShaman:["............","...e.e.e....","..eeeeeee...","..eggggge.q.","..gAgggAg.o.","..ggggggg.o.","...geeeg..o.","..eeeeeeeM..",".KeggggeK...",".KeggggeK...",".KeeeeeeK...",".KeeeeeeK...",".KeeKeeK....",".KKK.KKK....","............","............"],
  gobWolf:["............","............","..t......t..","..tt....tt..","..tttttttt..","..tTAttATt..","..tttttttt..","..MMMMMMMM..","..MnMMMMnM..","..BMMMMMMB..","..tttttttt..",".tttttttttt.",".tt.tt.tt.t.",".K..K.K..K..","............","............"],
  gobChief:["...G.G.G....","..GGGGGGG...","..gggggggg..","..gAgCgAgg..","..gggggggg..","...gCCCg....","..gggggggM..",".KgggggggKM.",".KgBBBBBgK..",".KgBBBBBgK..",".KggggggK...",".KggKKggK...",".KbbKKbbK...",".KKK..KKK...","............","............"],
  stoneHound:["............","............","..T......T..","..TT....TT..","..TTTTTTTT..","..TtqTTqtT..","..TTTTTTTT..","..WWWWWWWW..","..WnWWWWnW..","..TWWWWWWT..","..TTTTTTTT..",".TTTTTTTTTT.",".TT.TT.TT.T.",".K..K.K..K..","............","............"],
  runeSentinel:["............","............","....KKKK....","..KKTTTTKK..",".KTtqqqqtTK.",".KTqGGGGqTK.",".KTqGGGGqTK.",".KTtqqqqtTK.","..KKTTTTKK..","....KKKK....","......o.....","....q.o.q...","...q..o..q..","......o.....","............","............"],
  // 枯骨峽谷：枯骨軍團（boneKnight/boneHound）＋亡靈（wraith/banshee/lich）
  boneKnight:["............","...wwww.....","..wWWWWw....","..wMMMMw....","..wKMMKw....","..wMMMMw.W..",".WWWWWWWWW..",".WKiMMiKW.W.",".WKiMMiKW.W.",".WKWWWWKW.W.",".WKWWWWKW...",".KWiiiiWK...",".KWWKWWK....",".KKK.KKK....","............","............"],
  boneHound:["............","............","..M......M..","..MM....MM..","..MMMMMMMM..","..MKMMMKMM..","..MMMMMMMM..","..MMMMMMMM..","..MnMMMMnM..","..iMMMMMMi..","..MMMMMMMM..",".MMMMMMMMMM.",".MM.MM.MM.M.",".K..K.K..K..","............","............"],
  wraith:["............","...lllll....","..lllllll...","..lllllll...","..lKlllKl...","..lllllll...","..llKKKll...","..lllllll...",".llllllll...",".llllllll...","..llllll....","..l.ll.l....","...l.l.l....","..l..l..l...","....l.l.....","............"],
  banshee:["............","...lllll....","..lllllll...","..lll.lll...","..lAlllAl...","..lllllll...","..llKKKll...","l..llllll..l",".l.llllll.l.","..l.lllll...","...lllll....","..ll.l.ll...","..l..l..l...","...l.l.l....","..l...l.....","............"],
  lich:["...G.G.G....","..GGGGGGG...","..MMMMMMM...","..MKMMKMM...","..MMMMMMM...","..MnnnnMM...","..MMMMM.l...","..UUUUUUl...",".KUuuuuUKl..",".KUuuuuUK...",".KUllllUK...",".KUuuuuUK...",".KUUKUUK....",".KKK.KKK....","............","............"],
  // 沉沒神城：溺亡者（drownedBrute/drownedKing）＋深海生物（seaSerpent/anglerLurker/reefCrab）
  drownedBrute:["............",".vv....vv...",".vVv..vVv...","..vvvvvvv...","..vVvvvVv...","..vvqvqvv...","..vvvvvvv...","..vVVVVVv...","vvVVVVVVvv..","vKVVVVVVKv..","vKVqqqqVKv..",".KVVVVVVK...",".KVVKKVVK...",".KvvK.Kvv...","..KK..KK....","............"],
  drownedKing:["..G.G.G.....","..GGGGG.G...","..vvvvv.G...","..vqvqv.G...","..vvvvv.G...","...vVv..G...","..vvvvvvG...",".KvvvvvvK.G.",".KvVVVVvK...",".KvVqqVvK...",".KvVVVVvK...",".KvvvvvvK...",".KvvKvvK....",".KKK.KKK....","............","............"],
  seaSerpent:["............",".....HHHH...","....HhhhhH..","....HhqhhH..","....Hhhhh...","...Hhhh.....","..Hhhh......","..vhhh......","..vvhhh.....","...vvhhh....","....vvhhh...",".....vvhh...","...M..vvh...","..MM...vv...","..M.........","............"],
  anglerLurker:["......Y.....","......o.....","......o.....","...VVVVV....","..VVVVVVV...",".VVqVVVVV...",".VVVVVVVVV..",".VMMMMMMMMV.",".VMnMnMnMnV.",".VMMMMMMMMV.",".VVVVVVVVV..","..VVVVVVV...","...VVfVV....","....f.f.....","............","............"],
  reefCrab:["............","..d......d..",".dd......dd.","d..d....d..d","....dddd....","..ddddddddd.",".ddffffffdd.",".dfAffffAfd.",".ddffffffdd.","..ddddddddd.","..d.d..d.d..",".d..d..d..d.","............","............","............","............"],
  // 虛空裂隙：虛空教團（voidApostle）＋裂隙異獸（eyeStalker/gnawer/riftWyrm/nullStar）
  voidApostle:["............","...uuuuu....","..uuuuuuu...","..uPPPPPu...","..uPxPxPu...","..uPPPPPu...","..uuxxxuu.x.",".KuuuuuuKx..",".KuxxxxuK.x.",".KuxUUxuK...",".KuUUUUuK...",".KuuuuuuK...",".KuuKuuK....",".KKK.KKK....","............","............"],
  eyeStalker:["............","....x..x....","...x.UU.x...","..x.UUUU.x..","..xUUUUUUx..",".xUUYYYYUUx.",".xUYAAAAYUx.",".xUYAAAAYUx.",".xUUYYYYUUx.","..xUUUUUUx..","..x.UUUU.x..","...U.UU.U...","..U..xx..U..",".U...xx...U.","U....xx....U","............"],
  gnawer:["............","...UUUUUU...","..UUUUUUUU..",".UUUAUUAUUU.","UUUUUUUUUUUU","UMMMMMMMMMMU","UMnMnMnMnMU.","UMMMMMMMMMU.","UMnMnMnMnMU.","UMMMMMMMMMU.",".UUUUUUUUUu.","..UUUUUUUu..","...UUUUUu...","....x..x....","............","............"],
  riftWyrm:["............","....MMMM....","...MnnnnM...","..MnUUUUnM..","..MUUUUUUM..","...xUUUUx...","....UUUU....","....xUUx....","....UUUU....","...xUUUUx...","....UUUU....","....xUUx....","....UUUU....","....x..x....","............","............"],
  nullStar:["....z.z.z...","...zxxxxxz..","..zxUUUUxz..",".zxUUUUUUxz.","zxUUAUUAUUxz","xUUUUUUUUUUx","zxUUAUUAUUxz",".zxUUUUUUxz.","..zxUUUUxz..","...zxxxxxz..","....z.z.z...","...x.z.z.x..","..x..z.z..x.",".x...z.z...x","............","............"],
};
const GLYPH = {
  '0':["111","101","101","101","111"],'1':["010","110","010","010","111"],'2':["111","001","111","100","111"],'3':["111","001","111","001","111"],'4':["101","101","111","001","001"],'5':["111","100","111","001","111"],'6':["111","100","111","101","111"],'7':["111","001","010","010","010"],'8':["111","101","111","101","111"],'9':["111","101","111","001","111"],'-':["000","000","111","000","000"],'+':["000","010","111","010","000"],
};
// 裝備目錄（不限量）
// 武器：atkSeq = 傷害表，依序循環輸出固定 ATK（第三次回到第一個）
const WEAPONS = [
  // starter:true 才會出現在整備目錄；其餘為地城掉落專屬
  {name:'鐵劍', atkSeq:[14,18], heal:0, lvReq:1, starter:true},
  {name:'雙手斧', atkSeq:[20,28], heal:0, lvReq:3, starter:true},
  {name:'獵弓', atkSeq:[18,20,22], heal:0, lvReq:2, starter:true},
  {name:'短弓', atkSeq:[16,18,20], heal:0, lvReq:1, starter:true},
  {name:'橡木杖', atkSeq:[10,12], heal:8, lvReq:1, starter:true},
  {name:'聖光杖', atkSeq:[14,16], heal:14, lvReq:3, starter:true},
  {name:'火花杖', atkSeq:[9,11], heal:0, lvReq:1, starter:true, magic:true},   // 法師起手（範圍魔法）
  {name:'短刃', atkSeq:[10,12,14], heal:0, lvReq:1, starter:true},   // 盜賊起手（快速三段）
  // 掉落專屬（靠探險取得，整備目錄看不到）；v0.8：給「特性」trait 而非只是更大的數字，換裝＝換打法
  {name:'匕首', atkSeq:[12,13,14,16], heal:0, lvReq:2, trait:{lifesteal:0.15}, traitDesc:'吸血 15%'},
  {name:'雙刃劍', atkSeq:[18,22,26], heal:0, lvReq:3, trait:{pierce:0.4}, traitDesc:'破甲：無視 40% 防禦'},
  {name:'巨劍', atkSeq:[26,34], heal:0, lvReq:4, trait:{pierce:0.5}, traitDesc:'破甲：無視 50% 防禦'},
  {name:'戰弓', atkSeq:[22,24,26,28], heal:0, lvReq:4, trait:{stunCycle:4}, traitDesc:'每第 4 擊暈眩 0.8 秒'},
  {name:'神息法杖', atkSeq:[18,20], heal:20, lvReq:4, trait:{lifesteal:0.10}, traitDesc:'吸血 10%'},
  {name:'烈焰法杖', atkSeq:[14,18], heal:0, lvReq:3, magic:true, trait:{pierce:0.3}, traitDesc:'破甲：無視 30% 防禦'},
];
// 防具：固定 DEF
const ARMORS = [
  {name:'布衣', def:1, hp:8, lvReq:1, starter:true}, {name:'皮甲', def:3, hp:12, lvReq:1, starter:true},
  {name:'鎖子甲', def:6, hp:22, lvReq:3, starter:true}, {name:'法袍', def:2, hp:16, lvReq:2, starter:true},
  // 掉落專屬；v0.8：給「特性」trait
  {name:'精鋼板甲', def:9, hp:30, lvReq:4, trait:{startShield:20}, traitDesc:'每場開場護盾 +20'},
  {name:'守護重盔', def:7, hp:26, lvReq:3, trait:{thorns:0.15}, traitDesc:'反甲：反彈 15% 受到的傷害'},
  {name:'法師長袍', def:3, hp:20, lvReq:2, trait:{startShield:12}, traitDesc:'每場開場護盾 +12'},
  {name:'龍鱗甲', def:11, hp:36, lvReq:5, trait:{thorns:0.25}, traitDesc:'反甲：反彈 25% 受到的傷害'},
];
// 世界地圖目的地：tier＝危險/遺物階級、repReq＝解鎖所需聲望（遺物種類數）
const DESTINATIONS = [
  {name:'近郊遺跡', tier:1, repReq:0, desc:'最近的失落神殿，新手起點。'},
  {name:'枯骨峽谷', tier:2, repReq:2, desc:'更深的古文明遺跡，怪物更兇、寶物更好。'},
  {name:'沉沒神城', tier:3, repReq:5, desc:'水下失落都城，遺物階級高，路途遙遠。'},
  {name:'虛空裂隙', tier:4, repReq:9, desc:'舊神沉眠之地，極兇極富，唯強者可歸。'},
];
// ===== 遺物目錄（每關固定清單、收齊為止、已得不再掉）=====
// v0.8 去數據化：每件遺物 = 一條「規則」。原本的純數值一律改成改變戰鬥/探索規則的功能。
// 規則旗標：firstHitCrit 首擊必暴｜reviveOnce 每場復活一次｜fullHealAfterBattle 戰後全回
//   splash 每3擊濺射全體｜startShield 開場護盾(數值)｜regen 行動回復(比例)｜killCrit 擊殺後下一擊必暴
//   healToShield 治療溢出轉護盾｜lastStand 低血DEF翻倍+免暈｜firstDeathHeal 首位陣亡全隊回援(比例)
//   firstStrikeAoe 首次攻擊打全體｜soloBoost 寡兵越強｜lifesteal 吸血(比例)
const RELIC_CATALOG = [
  // 近郊遺跡（dest 0）
  {id:'idol',  name:'破碎神像', icon:'🗿', dest:0, desc:'碎裂的舊神石像，殘留戰意。每位成員每第 3 次攻擊，對全部敵人造成濺射傷害。', effect:{splash:true}},
  {id:'plate', name:'鏽蝕神牌', icon:'🛡', dest:0, desc:'斑駁的護身神牌。每場戰鬥開始，全隊獲得可吸收 18 點傷害的護盾。', effect:{startShield:18}},
  {id:'charm', name:'殘缺護符', icon:'🧿', dest:0, desc:'半枚護符，護佑生機。非治療成員每次行動回復 4% 最大生命。', effect:{regen:0.04}},
  {id:'eye',   name:'古神之眼', icon:'👁', dest:0, desc:'舊神之眼窺破來襲。每位成員本場第一次受到的攻擊無效（格擋）。', effect:{firstHitBlock:true}},
  // 枯骨峽谷（dest 1）
  {id:'tablet',name:'低語石板', icon:'⚔', dest:1, desc:'低語著殺意的石板。擊殺敵人後，該成員下一次攻擊必定暴擊。', effect:{killCrit:true}},
  {id:'bell',  name:'遺忘之鈴', icon:'🔔', dest:1, desc:'清音安撫傷者。治療超過生命上限的部分轉為護盾。', effect:{healToShield:true}},
  {id:'candle',name:'永燃聖燭', icon:'🔥', dest:1, desc:'聖火灼敵。每位成員本場「首次攻擊必定暴擊」。', effect:{firstHitCrit:true}},
  {id:'bonecrest',name:'枯骨王徽', icon:'💀', dest:1, desc:'枯骨之王的徽記。成員生命低於 25% 時，DEF 翻倍且免疫暈眩。', effect:{lastStand:true}},
  // 沉沒神城（dest 2）
  {id:'emblem',name:'失落聖徽', icon:'🎖', dest:2, desc:'失落教團的聖徽。每場戰鬥首位成員陣亡時，全隊立即回復 30% 生命。', effect:{firstDeathHeal:0.30}},
  {id:'core',  name:'星辰碎核', icon:'☄', dest:2, desc:'墜星的碎核。每位成員本場第一次攻擊，改為打擊全部敵人。', effect:{firstStrikeAoe:true}},
  {id:'crown', name:'潮汐之冠', icon:'🌊', dest:2, desc:'海神的冠冕。每場戰鬥開場，全隊獲得可吸收 25 點傷害的護盾。', effect:{startShield:25}},
  {id:'glass', name:'時之沙漏', icon:'⏳', dest:2, desc:'逆轉須臾。每場戰鬥首位陣亡的我方「復活一次」（半血）。', effect:{reviveOnce:true}},
  // 虛空裂隙（dest 3）
  {id:'diadem',name:'神王冠冕', icon:'👑', dest:3, desc:'神王的冠冕。出戰人數越少越強：每空一個出戰席位，全隊 ATK/DEF +3、HP +20。', effect:{soloBoost:true}},
  {id:'page',  name:'創世殘頁', icon:'📜', dest:3, desc:'創世之書的殘頁。遺物掉落率 +10%、每場額外掉落 1 件。', effect:{drop:0.10, extraLoot:1}},
  {id:'heart', name:'虛空之心', icon:'💜', dest:3, desc:'跳動的虛空之心。成員造成傷害時，回復其中 25% 為自身生命。', effect:{lifesteal:0.25}},
  {id:'wheel', name:'永恆之輪', icon:'♾', dest:3, desc:'生生不息。每場戰鬥勝利後「全隊完全回復」。', effect:{fullHealAfterBattle:true}},
];
const RELIC_BY_ID={}; RELIC_CATALOG.forEach(r=>{ RELIC_BY_ID[r.id]=r; });
const RELICS_BY_DEST=[[],[],[],[]]; RELIC_CATALOG.forEach(r=>{ (RELICS_BY_DEST[r.dest]=RELICS_BY_DEST[r.dest]||[]).push(r); });

// 隊員羈絆（v0.8）：從「恆成立的隱形加值」改成「戰鬥中行為觸發」的功能，兩名成員都在出戰名單時生效。
// trigger：healInvuln 牧師治療戰士→短暫無敵｜stunMark 戰士暈敵→遊俠對該敵必暴｜killCdCut 遊俠擊殺→減牧師CD
const BONDS = [
  {name:'以信護盾', members:['warrior','priest'], trigger:'healInvuln', desc:'牧師治療戰士時，戰士獲得 1 秒無敵'},
  {name:'掩護射擊', members:['warrior','ranger'], trigger:'stunMark',   desc:'戰士暈眩敵人後，遊俠對該敵的下一擊必定暴擊'},
  {name:'神諭指引', members:['priest','ranger'], trigger:'killCdCut',  desc:'遊俠擊殺敵人時，牧師所有技能冷卻 -1.5 秒'},
];

// 隊形（取代固定羈絆）：每隊形固定站位（像素座標）＋每站位加減成；row 決定被鎖定權重
const FORMATIONS = [
  { name:'基礎三角', desc:'攻守均衡的基本站位，戰士在前扛傷（初始免費）', cost:0, slots:{
     warrior:{x:330,y:360,row:'front', def:3},
     ranger :{x:200,y:255,row:'back',  atk:4},
     priest :{x:200,y:440,row:'back',  heal:5, hp:8}, mage:{x:130,y:360,row:'back', atk:3}, rogue:{x:265,y:255,row:'mid', atk:3} } },
  { name:'護駕', desc:'戰士遊俠雙前排護住後方牧師，火力全開但前排吃傷（解鎖 ⭐2）', cost:2, slots:{
     warrior:{x:340,y:300,row:'front', atk:4},
     ranger :{x:340,y:420,row:'front', atk:8, def:-2},
     priest :{x:190,y:360,row:'back',  heal:6}, mage:{x:150,y:280,row:'back', atk:5}, rogue:{x:300,y:240,row:'mid', atk:6, def:-1} } },
  { name:'警戒前行', desc:'謹慎推進、重防禦，輸出較低（解鎖 ⭐2）', cost:2, slots:{
     warrior:{x:300,y:360,row:'front', def:6},
     ranger :{x:170,y:260,row:'back',  def:3, atk:-2},
     priest :{x:170,y:460,row:'back',  heal:4, def:3}, mage:{x:150,y:360,row:'back', def:2, atk:2}, rogue:{x:235,y:255,row:'mid', def:2, atk:1} } },
  { name:'急行軍', desc:'全員拉開散開，傷害被均攤（解鎖 ⭐2）', cost:2, slots:{
     warrior:{x:280,y:360,row:'mid',  def:2},
     ranger :{x:160,y:300,row:'back', atk:6},
     priest :{x:160,y:420,row:'back', heal:5}, mage:{x:130,y:360,row:'back', atk:5}, rogue:{x:235,y:300,row:'mid', atk:5} } },
  { name:'守護方陣', desc:'極致防禦，戰士死守前方（解鎖 ⭐3）', cost:3, slots:{
     warrior:{x:320,y:360,row:'front', def:9},
     ranger :{x:185,y:265,row:'back',  def:3},
     priest :{x:185,y:455,row:'back',  heal:5, hp:12, def:3}, mage:{x:150,y:360,row:'back', def:3, hp:8}, rogue:{x:240,y:255,row:'mid', def:3, hp:6} } },
  { name:'突擊縱列', desc:'全員壓上猛攻，極高輸出但極脆（解鎖 ⭐5）', cost:5, slots:{
     warrior:{x:345,y:300,row:'front', atk:6},
     ranger :{x:360,y:360,row:'front', atk:12, def:-3},
     priest :{x:330,y:420,row:'front', heal:5, def:-2}, mage:{x:355,y:475,row:'front', atk:8, def:-3}, rogue:{x:380,y:240,row:'front', atk:11, def:-3} } },
];
const ROW_WEIGHT = { front:3.2, mid:1.6, back:1 };   // 敵人選目標的權重：前排越容易被集火
// ===== 馬匹（單一馬車＋選馬）=====
// 馬匹只決定「貨格」（後勤容量），不影響戰鬥。cost＝解鎖所需聲望（0＝免費）；index 0 為初始預設馬
const HORSES = [
  {name:'均衡馬', slots:6,  cost:0, desc:'標準商隊馬，貨格 6（初始預設）'},
  {name:'耐力馬', slots:9,  cost:3, desc:'耐久善負重，貨格 9（解鎖 ⭐3）'},
  {name:'力量馬', slots:12, cost:4, desc:'力大能拉重載，貨格 12（解鎖 ⭐4）'},
];
// ===== 素材（強化用）：特定關出特定素材 =====
const MATERIALS = [
  {id:'wood',    name:'堅木',   icon:'🪵', dest:0},
  {id:'iron',    name:'精鐵',   icon:'⛓', dest:1},
  {id:'crystal', name:'海晶',   icon:'🔷', dest:2},
  {id:'voidore', name:'虛空礦', icon:'🟣', dest:3},
];
const MATERIAL_BY_ID={}; MATERIALS.forEach(m=>{ MATERIAL_BY_ID[m.id]=m; });
const MATERIAL_BY_DEST={}; MATERIALS.forEach(m=>{ MATERIAL_BY_DEST[m.dest]=m; });
// ===== 食材（料理用）：特定關出特定食材 =====
const INGREDIENTS = [
  {id:'herb',  name:'野菜',   icon:'🌿', dest:0},
  {id:'meat',  name:'獸肉',   icon:'🍖', dest:1},
  {id:'fish',  name:'深海魚', icon:'🐟', dest:2},
  {id:'spice', name:'異香料', icon:'🌶', dest:3},
];
const INGREDIENT_BY_ID={}; INGREDIENTS.forEach(m=>{ INGREDIENT_BY_ID[m.id]=m; });
const INGREDIENT_BY_DEST={}; INGREDIENTS.forEach(m=>{ INGREDIENT_BY_DEST[m.dest]=m; });
// ===== 節點天氣（影響移動成本與戰鬥；可在地城神殿祈禱轉晴）=====
const WEATHERS = [
  {id:'clear', name:'晴',  icon:'☀'},
  {id:'rain',  name:'雨',  icon:'🌧', eff:{allAtk:-2}, note:'雨：雙方 ATK -2'},
  {id:'fog',   name:'霧',  icon:'🌫', eff:{enemyDef:2}, note:'霧：敵方 DEF +2'},
];
const WEATHER_BY_ID={}; WEATHERS.forEach(w=>{ WEATHER_BY_ID[w.id]=w; });
// ===== 料理：食材→補血／增益（營火休息時；需領隊或工匠強化「隨車鍋」）=====
// v0.8：料理 buff 從純 ATK/DEF 數值，改成「一次性功能」(grant)，保留補血。
// grant：shield 下場開場護盾(amt)｜revive 下場一次陣亡復活充能｜firstCrit 下場全隊首擊必暴
const RECIPES = [
  {id:'soup',  name:'野菜湯',     need:{herb:1},          desc:'全隊立即回復 30% HP',                     heal:0.30},
  {id:'bbq',   name:'獸肉燒烤',   need:{meat:1},          desc:'下一場戰鬥全隊開場獲得 20 點護盾',         grant:'shield', amt:20},
  {id:'fish',  name:'深海魚料理', need:{fish:1},          desc:'全隊回復 50% HP，並獲得一次「陣亡復活」充能', heal:0.50, grant:'revive'},
  {id:'feast', name:'異香料盛宴', need:{spice:1,meat:1},  desc:'全隊回復 40% HP，下一場戰鬥全隊首擊必暴',   heal:0.40, grant:'firstCrit'},
];
// ===== 工坊強化（工匠解鎖，一次性，全部屬後勤）：craftReq 工匠階級門檻 =====
// feature：deck2 清掉精英戰後 +3 貨格｜campstove 無領隊也能在營火料理
const UPGRADES = [
  {id:'rack1',    name:'加固貨架',   craftReq:1, effect:{slots:2},            cost:{mats:{wood:2}},           desc:'貨格 +2'},
  {id:'deck2',    name:'貨車第二層', craftReq:2, effect:{feature:'deck2'},    cost:{mats:{iron:2}},           desc:'清掉精英戰後開啟，貨格 +3（高風險，全滅照噴）'},
  {id:'campstove',name:'隨車鍋',     craftReq:2, effect:{feature:'campstove'},cost:{mats:{iron:1,crystal:1}}, desc:'無領隊也能在途中烹煮料理'},
];
// 職業：等級決定血量（growthHp/級）與可穿戴裝備；ATK 來自武器、DEF 來自防具
// 每級：growthHp 加血、growthAtk 加攻擊（升級兼顧生存與輸出）；另由升級 perk（state.js heroPerks）給功能。
const HERO_BASE = [
  {sprite:'warrior', name:'戰士', hp:95, interval:1300, ranged:false, healer:false, defWeapon:0, defArmor:1, growthHp:10, growthAtk:3},
  {sprite:'ranger',  name:'遊俠', hp:58, interval:1000, ranged:true,  healer:false, defWeapon:3, defArmor:1, growthHp:6, growthAtk:2},
  {sprite:'priest',  name:'牧師', hp:62, interval:1500, ranged:true,  healer:true,  defWeapon:4, defArmor:0, growthHp:7, growthAtk:2},
  {sprite:'mage',    name:'法師', hp:54, interval:1700, ranged:true,  healer:false, defWeapon:6, defArmor:0, growthHp:6, aoe:true, growthAtk:3},
  {sprite:'rogue',   name:'盜賊', hp:60, interval:900,  ranged:false, healer:false, defWeapon:7, defArmor:1, growthHp:6, growthAtk:2},
];
// 寶箱物品池（依風險階級 1-4）
const LOOT = {
  valuable:['碎銀錢袋','古青銅幣','寶石原石','黃金聖盃','失落王冠'],
  consum:['治療藥水','解毒劑','聖水','回復卷軸','復活之種'],
};
const SCALE = 4;
const TH = { bg:'#0e0a14', panel:0x1d1528, panel2:0x2a2038, gold:'#e7c14a', goldN:0xe7c14a, cyan:'#6fd0e0', red:'#ff6b6b', green:'#7dff9a', text:'#d8cdb8', dim:'#8a7f9a' };

// 角色簡介
const BIO = {
  warrior:'教團護衛，前排扛傷護隊。', ranger:'山野嚮導，後排高速集火。', priest:'唯一聽見神諭者，後排治療續航。',
  goblin:'成群行動的綠皮掠奪者，數量是威脅。', goblinArcher:'躲後排放冷箭，脆弱但傷害高。',
  guardian:'古文明留下的石像守衛，堅硬沉重、傷害驚人。',
  mage:'教團法師，後排施放範圍魔法，一次掃蕩成群敵人。',
  rogue:'教團暗影，高速近戰，靠偷襲與連刺見血、割喉收割。',
  // 枯骨峽谷
  skeleton:'被詛咒喚醒的骸骨兵，防禦薄弱卻揮砍兇狠。', skeletonArcher:'枯骨弓手，從遠處放出帶寒氣的骨箭。',
  boneBrute:'由無數骸骨堆疊成的巨魔，重壓與粉碎皆致命。', necromancer:'操縱亡者的死靈術士，邊治療同伴邊低語咒術。',
  // 沉沒神城
  drowned:'沉入海底的亡魂，皮厚水重、緩慢而難纏。', drownedArcher:'深海射手，以骨叉與尖刺遠程襲擊。',
  coralGolem:'珊瑚與礁岩凝成的守衛，堅硬如石、一擊震懾。', tidePriest:'潮汐祭司，引海潮為同伴回復、源源不絕。',
  // 虛空裂隙
  voidling:'從裂隙爬出的虛空爬行者，速度與爆發兼具。', voidArcher:'虛空術士，擲出扭曲現實的紫焰。',
  voidColossus:'吞噬空間的虛空巨像，連擊與重擊交織。', voidSeer:'窺見舊神的先知，治療與詛咒並施。',
  // v1.4 新增敵人
  gobShaman:'哥布林祭司，揮骨杖為同族補血、施放詛咒。', gobWolf:'哥布林馴養的座狼，撲咬迅猛、成群獵殺。', gobChief:'哥布林酋長，戴冠的部族首領，兇悍又帶起全軍。',
  stoneHound:'遺跡造物・石獵犬，符文驅動的石獸，撲擊沉重。', runeSentinel:'遺跡造物・符文哨衛，懸浮法陣眼，遠距射出符文。',
  boneKnight:'生前戰士的骸骨，披甲持劍，前排死守。', boneHound:'骸骨拼成的獵犬，無懼無痛、咬住不放。',
  wraith:'枉死者的怨靈，飄忽難擊、掠奪生氣。', banshee:'哀嚎女妖，淒厲尖嘯撕裂遠方目標。', lich:'巫妖，操弄死靈的不朽法師，亡靈之首。',
  drownedBrute:'深淵巨漢，腫脹的溺亡者，揮拳如鐵錘。', drownedKing:'溺亡君王，戴冠執叉的海底亡君，號令溺者。',
  seaSerpent:'盤踞神城的海蛇，纏繞突咬、滑不溜手。', anglerLurker:'鮟鱇潛伏者，以誘光引獵物、巨口生噬。', reefCrab:'礁岩巨蟹，硬殼難破、雙螯夾擊。',
  voidApostle:'虛空教團使徒，誦念異言、扭曲戰場。', eyeStalker:'凝視者，懸浮巨眼，射出虛空光束。',
  gnawer:'噬咬者，滿口利齒的虛空血盆大口。', riftWyrm:'裂隙噬蟲，自裂縫鑽出的環節巨蟲。', nullStar:'虛無之星，舊神墜落的眼狀核體，眾目睥睨。',
};
// 技能：依職業等級解鎖，戰鬥中自動觸發
// 主動技能：cd（毫秒冷卻）+ uses（每場次數上限）；冷卻好且還有次數時，下一次行動自動觸發
// v0.8：原本純 +stat 的被動，全部改成「條件觸發」的被動（一樣自動、不用操作，但改變打法）。
// 條件型被動 type：reflect 反傷｜lowHpDef 低血DEF翻倍｜critVsFull 對滿血必暴｜critHealLow 對半血以下治療翻倍
//   shieldOnHeal 被治療者得護盾｜cleanseOnHeal 治療解暈｜deathSave 每場免死一次｜aoeBonus 多目標追加全體｜critVsStunned 對暈必暴
const SKILLS = {
  warrior:[ {lv:2,name:'敲暈',type:'stun',cd:5000,uses:2,dur:1500,desc:'CD 5 秒・每場 2 次：擊暈敵人 1.5 秒'},
            {lv:4,name:'堅守',type:'reflect',frac:0.25,desc:'被動：被攻擊時，反彈 25% 傷害給攻擊者'},
            {lv:6,name:'強擊',type:'crit',cd:7000,uses:2,mult:1.8,desc:'CD 7 秒・每場 2 次：重擊（傷害 ×1.8）'},
            {lv:8,name:'鐵骨',type:'lowHpDef',desc:'被動：生命低於 30% 時，DEF 翻倍'} ],
  ranger:[  {lv:2,name:'連射',type:'doubleHit',cd:4000,uses:3,desc:'CD 4 秒・每場 3 次：追加一擊'},
            {lv:4,name:'弱點射擊',type:'crit',cd:6000,uses:2,mult:2,desc:'CD 6 秒・每場 2 次：暴擊傷害×2'},
            {lv:6,name:'鷹眼',type:'critVsFull',desc:'被動：攻擊滿血敵人時必定暴擊'},
            {lv:8,name:'震懾箭',type:'stun',cd:6000,uses:2,dur:1000,desc:'CD 6 秒・每場 2 次：擊暈敵人 1 秒'} ],
  priest:[  {lv:2,name:'群體治療',type:'groupHeal',cd:8000,uses:2,desc:'CD 8 秒・每場 2 次：改為全隊治療'},
            {lv:4,name:'聖療',type:'critHealLow',desc:'被動：治療生命低於半血的對象時，治療量翻倍'},
            {lv:6,name:'聖盾',type:'shieldOnHeal',amt:12,desc:'被動：被治療的對象獲得 12 點護盾'},
            {lv:8,name:'神恩',type:'cleanseOnHeal',desc:'被動：治療的同時解除對象的暈眩'} ],
  mage:[    {lv:2,name:'炎爆',type:'crit',cd:5000,uses:2,mult:1.8,desc:'CD 5 秒・每場 2 次：法術暴擊 ×1.8'},
            {lv:4,name:'護體罩',type:'deathSave',desc:'被動：每場第一次受致命傷免死，殘留 1 HP'},
            {lv:6,name:'奧術精通',type:'aoeBonus',desc:'被動：範圍法術命中 2 個以上敵人時，追加一輪全體傷害'},
            {lv:8,name:'連環施法',type:'doubleHit',cd:5000,uses:2,desc:'CD 5 秒・每場 2 次：追加一次施法'} ],
  rogue:[   {lv:2,name:'偷襲',type:'crit',cd:4500,uses:3,mult:1.9,desc:'CD 4.5 秒・每場 3 次：偷襲暴擊 ×1.9'},
            {lv:4,name:'連刺',type:'doubleHit',cd:4000,uses:3,desc:'CD 4 秒・每場 3 次：追加一擊'},
            {lv:6,name:'致命',type:'critVsStunned',desc:'被動：攻擊被暈眩的敵人時必定暴擊'},
            {lv:8,name:'割喉',type:'stun',cd:6000,uses:2,dur:1200,desc:'CD 6 秒・每場 2 次：割喉擊暈 1.2 秒'} ],
};
// ===== v1.4 怪物組系統（站位＝自由像素座標、分族群）=====
// 一個「怪物組」＝一場戰鬥的完整內容：含 1 或多波（王戰＝小兵波＋王波）。
// 每隻怪用 at(怪, x, y, row) 擺在任意像素座標。每組標 faction（族群）：同一組只會有同族群的怪，
//   不會把哥布林與遺跡造物、骷髏與亡靈、溺亡者與海生獸、虛空教團與裂隙異獸混在一起。
//   敵方活動區 x≈500~840、y≈150~510（我方在左 x≈130~380）；一般怪約 48×64px、王約 72×96px。
//   row：front 前排最易挨打 / mid / back（省略預設 mid）。
// 標籤：region 地城(0-3)、faction 族群、kind(normal/elite/boss)、tier 等級(1-3；依探險深度開放)。
// 數值為未縮放基準，由 map.js 依目的地階級／探險深度／出戰人數縮放。單波最多 9 隻。
const MONSTER_GROUPS = (function(){
  const sneak ={name:'偷襲',  type:'crit',     cd:7000,uses:2,mult:2};
  const frenzy={name:'狂亂',  type:'doubleHit',cd:5000,uses:3};
  const smash ={name:'重擊',  type:'stun',     cd:6000,uses:2,dur:1200};
  const gheal ={name:'治療波',type:'groupHeal',cd:9000,uses:2};
  const quake ={name:'震地',  type:'stun',     cd:6000,uses:3,dur:1400};
  const combo ={name:'碎地連擊',type:'doubleHit',cd:4500,uses:4};
  const quake2={name:'震地',  type:'stun',     cd:7000,uses:2,dur:1200};
  const power ={name:'強擊',  type:'crit',     cd:7000,uses:2,mult:1.8};
  const E=(sprite,name,hp,atk,def,intv,ranged,extra)=>Object.assign(
    {sprite,name,hp,atkSeq:atk,def,interval:intv,ranged:!!ranged,healer:false,heal:0}, extra||{});
  const heal=(h)=>({healer:true,heal:h,skills:[gheal]});
  const at=(e,x,y,row)=>Object.assign({},e,{x,y,row:row||'mid'});
  // 每組標 faction：同一組只能有同族群的怪
  const G=(id,region,faction,kind,tier,...waves)=>({id,region,faction,kind,tier,waves});
  const out=[];
  // ---------- region 0：近郊遺跡（哥布林部族 / 遺跡造物）----------
  (function(){
    // 哥布林部族
    const grunt=()=>E('goblin','哥布林',62,[11,16],2,1400,0), arch=()=>E('goblinArcher','哥布林弓手',50,[16,20],1,1150,1);
    const archS=()=>E('goblinArcher','哥布林弓手',55,[20,24],1,1100,1), scout=()=>E('goblin','哥布林斥候',54,[12,16],1,1200,0,{skills:[sneak]});
    const sham=()=>E('gobShaman','哥布林祭司',56,[10,12],1,1500,1,heal(12)), sol=()=>E('goblin','哥布林兵',68,[12,16],3,1300,0);
    const bers=()=>E('goblin','哥布林狂戰士',86,[15,20],2,1100,0,{skills:[frenzy]}), wolf=()=>E('gobWolf','座狼',58,[14,18],1,950,0,{skills:[frenzy]});
    // 遺跡造物
    const stone=()=>E('guardian','殘缺石衛',124,[16,21],4,1500,0,{skills:[smash]});
    const shound=()=>E('stoneHound','石獵犬',96,[15,19],4,1300,0,{skills:[smash]}), rune=()=>E('runeSentinel','符文哨衛',64,[18,22],2,1300,1,{skills:[power]});
    out.push(
      // 哥布林部族
      G('gob_scouts',0,'goblins','normal',1, [at(grunt(),560,330,'front'), at(arch(),678,232,'mid')]),
      G('gob_pack',0,'goblins','normal',2, [at(sol(),535,250,'front'), at(wolf(),575,422,'front'), at(archS(),702,182,'mid'), at(scout(),690,360,'mid')]),
      G('gob_warhost',0,'goblins','elite',3, [at(bers(),548,332,'front'), at(wolf(),596,200,'front'), at(wolf(),566,472,'front'), at(sol(),686,152,'mid'), at(archS(),716,300,'mid'), at(archS(),680,456,'mid'), at(sham(),815,360,'back')]),
      G('gob_boss_chief',0,'goblins','boss',2,
        [at(sol(),555,262,'front'), at(wolf(),592,420,'front'), at(archS(),712,330,'mid')],
        [at(E('gobChief','哥布林酋長',340,[26,18,34],5,1300,0,{boss:true,skills:[quake]}),700,330,'front'), at(sham(),550,236,'mid'), at(arch(),562,430,'mid')]),
      // 遺跡造物
      G('con_patrol',0,'construct','normal',1, [at(shound(),560,330,'front'), at(rune(),678,232,'mid')]),
      G('con_pack',0,'construct','normal',2, [at(shound(),545,258,'front'), at(shound(),580,422,'front'), at(rune(),700,320,'mid')]),
      G('con_guard',0,'construct','elite',2, [at(stone(),548,332,'front'), at(shound(),582,205,'front'), at(rune(),702,250,'mid'), at(rune(),712,452,'mid')]),
      G('con_phalanx',0,'construct','elite',3, [at(stone(),548,332,'front'), at(shound(),596,200,'front'), at(shound(),566,472,'front'), at(rune(),700,250,'mid'), at(rune(),700,420,'mid'), at(stone(),815,330,'back')]),
      G('con_boss_guardian',0,'construct','boss',2,
        [at(shound(),555,262,'front'), at(shound(),592,420,'front'), at(rune(),712,330,'mid')],
        [at(E('guardian','遺跡守護者',360,[30,18,42],6,1350,0,{boss:true,skills:[quake]}),700,330,'front'), at(rune(),548,330,'mid')]),
      G('con_boss_fallen',0,'construct','boss',2,
        [at(shound(),545,250,'front'), at(shound(),582,416,'front'), at(rune(),702,196,'mid'), at(rune(),706,360,'mid')],
        [at(E('guardian','墮落守護者',410,[26,32,38],7,1300,0,{boss:true,skills:[combo,quake2]}),705,330,'front'), at(shound(),550,236,'mid'), at(rune(),562,430,'mid')])
    );
  })();
  // ---------- region 1：枯骨峽谷（枯骨軍團 / 亡靈）----------
  (function(){
    // 枯骨軍團
    const bone=()=>E('skeleton','骷髏兵',60,[13,18],1,1300,0), barch=()=>E('skeletonArcher','骷髏弓手',48,[18,22],1,1100,1);
    const barchS=()=>E('skeletonArcher','骷髏弓手',54,[22,26],1,1050,1), bwar=()=>E('skeleton','骸骨戰士',72,[14,19],2,1250,0);
    const knight=()=>E('boneKnight','骸骨騎士',84,[15,19],4,1300,0,{skills:[smash]}), bhound=()=>E('boneHound','骸骨獵犬',54,[15,19],1,950,0,{skills:[frenzy]});
    const brute=()=>E('boneBrute','巨骨魔',96,[17,23],2,1100,0,{skills:[frenzy]}), bguard=()=>E('boneBrute','骨甲衛',130,[18,23],5,1500,0,{skills:[smash]});
    // 亡靈
    const necro=()=>E('necromancer','死靈術士',58,[11,14],1,1500,1,heal(12)), wraith=()=>E('wraith','怨靈',50,[16,20],2,1100,0,{skills:[sneak]});
    const banshee=()=>E('banshee','哀嚎女妖',52,[18,22],1,1200,1,{skills:[smash]});
    out.push(
      // 枯骨軍團
      G('bone_patrol',1,'bone','normal',1, [at(bone(),560,330,'front'), at(barch(),678,232,'mid')]),
      G('bone_band',1,'bone','normal',2, [at(bone(),535,250,'front'), at(knight(),575,422,'front'), at(barch(),702,182,'mid'), at(bhound(),690,360,'mid')]),
      G('bone_legion',1,'bone','elite',3, [at(bguard(),542,322,'front'), at(knight(),584,182,'front'), at(bhound(),562,472,'front'), at(bwar(),678,152,'mid'), at(barchS(),708,300,'mid'), at(barchS(),672,452,'mid'), at(bhound(),812,242,'back'), at(bwar(),822,412,'back')]),
      G('bone_boss_king',1,'bone','boss',2,
        [at(bwar(),555,262,'front'), at(knight(),592,420,'front'), at(barchS(),712,330,'mid')],
        [at(E('boneBrute','枯骨之王',380,[32,20,44],5,1300,0,{boss:true,skills:[quake]}),700,330,'front'), at(barchS(),550,330,'mid')]),
      // 亡靈
      G('spirit_haunt',1,'spirit','normal',1, [at(wraith(),560,330,'front'), at(banshee(),678,232,'mid')]),
      G('spirit_coven',1,'spirit','normal',2, [at(wraith(),535,250,'front'), at(wraith(),575,422,'front'), at(banshee(),702,210,'mid'), at(necro(),700,400,'mid')]),
      G('spirit_dirge',1,'spirit','elite',3, [at(wraith(),520,272,'front'), at(wraith(),560,452,'front'), at(wraith(),592,170,'front'), at(banshee(),690,300,'mid'), at(banshee(),700,160,'mid'), at(necro(),666,460,'mid'), at(banshee(),815,330,'back')]),
      G('spirit_boss_lich',1,'spirit','boss',2,
        [at(wraith(),555,262,'front'), at(wraith(),592,420,'front'), at(banshee(),712,330,'mid')],
        [at(E('lich','巫妖',360,[24,20,28],4,1300,1,{boss:true,healer:true,heal:14,skills:[combo,power]}),700,330,'front'), at(necro(),550,236,'mid'), at(banshee(),562,430,'mid')])
    );
  })();
  // ---------- region 2：沉沒神城（溺亡者 / 深海生物）----------
  (function(){
    // 溺亡者
    const drn=()=>E('drowned','溺亡者',78,[12,16],3,1450,0), darch=()=>E('drownedArcher','深海射手',58,[16,20],2,1200,1);
    const darchS=()=>E('drownedArcher','深海射手',64,[20,24],2,1150,1), dsol=()=>E('drowned','溺亡兵',70,[13,17],3,1300,0,{skills:[sneak]});
    const tpr=()=>E('tidePriest','潮汐祭司',66,[11,13],2,1500,1,heal(16)), dguard=()=>E('drowned','深淵守卒',90,[14,18],4,1350,0);
    const dbrute=()=>E('drownedBrute','深淵巨漢',130,[16,21],5,1450,0,{skills:[smash]});
    // 深海生物
    const coral=()=>E('coralGolem','珊瑚石像',120,[16,20],5,1300,0,{skills:[smash]}), reef=()=>E('reefCrab','礁岩巨蟹',150,[16,20],7,1500,0,{skills:[smash]});
    const serpent=()=>E('seaSerpent','海蛇',96,[15,19],3,1150,0,{skills:[sneak]}), angler=()=>E('anglerLurker','鮟鱇潛伏者',84,[20,24],3,1250,1,{skills:[power]});
    out.push(
      // 溺亡者
      G('drowned_patrol',2,'drowned','normal',1, [at(drn(),560,330,'front'), at(darch(),678,232,'mid')]),
      G('drowned_band',2,'drowned','normal',2, [at(dguard(),535,250,'front'), at(dbrute(),575,432,'front'), at(darch(),702,186,'mid'), at(dsol(),696,360,'mid')]),
      G('drowned_legion',2,'drowned','elite',3, [at(dbrute(),542,322,'front'), at(dguard(),584,184,'front'), at(dguard(),562,472,'front'), at(dsol(),678,154,'mid'), at(darchS(),708,300,'mid'), at(darchS(),672,452,'mid'), at(tpr(),822,360,'back')]),
      G('drowned_boss_king',2,'drowned','boss',2,
        [at(dguard(),555,262,'front'), at(dbrute(),592,420,'front'), at(darchS(),712,330,'mid')],
        [at(E('drownedKing','溺亡君王',460,[28,20,36],8,1380,0,{boss:true,skills:[quake,combo]}),700,330,'front'), at(tpr(),550,236,'mid'), at(darchS(),562,430,'mid')]),
      // 深海生物
      G('sea_reef',2,'seabeast','normal',1, [at(serpent(),560,330,'front'), at(angler(),678,232,'mid')]),
      G('sea_pod',2,'seabeast','normal',2, [at(serpent(),545,258,'front'), at(serpent(),580,422,'front'), at(angler(),700,320,'mid')]),
      G('sea_shoal',2,'seabeast','elite',2, [at(coral(),548,332,'front'), at(serpent(),582,205,'front'), at(angler(),702,250,'mid'), at(angler(),712,452,'mid')]),
      G('sea_deepswarm',2,'seabeast','elite',3, [at(reef(),542,322,'front'), at(serpent(),586,184,'front'), at(serpent(),562,472,'front'), at(coral(),678,160,'mid'), at(angler(),708,310,'mid'), at(angler(),672,460,'mid'), at(angler(),815,330,'back')]),
      G('sea_boss_leviathan',2,'seabeast','boss',2,
        [at(serpent(),555,262,'front'), at(reef(),592,420,'front'), at(angler(),712,330,'mid')],
        [at(E('coralGolem','深海巨像',440,[30,20,42],8,1400,0,{boss:true,skills:[quake]}),700,330,'front'), at(angler(),550,330,'mid')])
    );
  })();
  // ---------- region 3：虛空裂隙（虛空教團 / 裂隙異獸）----------
  (function(){
    // 虛空教團
    const vl=()=>E('voidling','虛空爬行者',70,[15,20],1,1200,0), vcast=()=>E('voidArcher','虛空術士',56,[20,24],1,1050,1);
    const vcastS=()=>E('voidArcher','虛空術士',60,[22,26],1,1000,1), vhunt=()=>E('voidling','虛空獵手',66,[16,20],2,1150,0,{skills:[sneak]});
    const vfren=()=>E('voidling','虛空狂徒',62,[16,21],1,1100,0,{skills:[frenzy]}), vseer=()=>E('voidSeer','虛空先知',60,[13,16],1,1450,1,heal(14));
    const vcol=()=>E('voidColossus','虛空巨像',110,[18,24],3,1250,0,{skills:[smash]}), apostle=()=>E('voidApostle','虛空使徒',70,[16,20],1,1450,1,{healer:true,heal:16,skills:[gheal,power]});
    // 裂隙異獸
    const eye=()=>E('eyeStalker','凝視者',76,[22,26],1,1150,1,{skills:[power,smash]}), gnaw=()=>E('gnawer','噬咬者',84,[18,24],2,1050,0,{skills:[frenzy]});
    const wyrm=()=>E('riftWyrm','裂隙噬蟲',150,[20,26],4,1300,0,{skills:[combo,smash]});
    out.push(
      // 虛空教團
      G('void_pair',3,'voidcult','normal',1, [at(vl(),560,330,'front'), at(vcast(),678,232,'mid')]),
      G('void_band',3,'voidcult','normal',2, [at(vfren(),535,250,'front'), at(vhunt(),575,422,'front'), at(vcast(),702,186,'mid'), at(apostle(),700,380,'mid')]),
      G('void_swarm',3,'voidcult','elite',3, [at(vfren(),506,234,'front'), at(vhunt(),546,372,'front'), at(vl(),586,492,'front'), at(vcol(),650,166,'mid'), at(vfren(),694,302,'mid'), at(vcast(),660,452,'mid'), at(vcastS(),800,216,'back'), at(apostle(),828,356,'back'), at(vl(),794,486,'back')]),
      G('void_boss_titan',3,'voidcult','boss',2,
        [at(vfren(),555,262,'front'), at(vhunt(),592,420,'front'), at(vcastS(),712,330,'mid')],
        [at(E('voidColossus','虛空泰坦',500,[34,22,46],6,1300,0,{boss:true,skills:[quake,combo]}),700,330,'front'), at(apostle(),550,236,'mid'), at(vcastS(),562,430,'mid')]),
      // 裂隙異獸
      G('aberr_pair',3,'aberration','normal',1, [at(gnaw(),560,330,'front'), at(eye(),678,232,'mid')]),
      G('aberr_brood',3,'aberration','normal',2, [at(gnaw(),535,250,'front'), at(gnaw(),575,422,'front'), at(eye(),702,210,'mid'), at(eye(),700,400,'mid')]),
      G('aberr_horror',3,'aberration','elite',3, [at(wyrm(),520,300,'front'), at(gnaw(),566,170,'front'), at(gnaw(),562,470,'front'), at(eye(),690,250,'mid'), at(eye(),700,430,'mid'), at(wyrm(),812,330,'back')]),
      G('aberr_boss_nullstar',3,'aberration','boss',2,
        [at(gnaw(),555,262,'front'), at(wyrm(),592,420,'front'), at(eye(),712,330,'mid')],
        [at(E('nullStar','虛無之星',520,[30,36,24],6,1300,1,{boss:true,skills:[combo,power,quake]}),700,330,'front'), at(eye(),550,236,'mid'), at(eye(),562,430,'mid')])
    );
  })();
  return out;
})();
