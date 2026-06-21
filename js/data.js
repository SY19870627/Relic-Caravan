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
  // ===== v2.2 第二世界主題色（沙漠／綠洲／叢林／深雨林，色調偏亮）=====
  a:'#f0d9a0', D:'#caa05a', m:'#8a6b3c', J:'#5e3f22',   // 亮沙 / 駝沙 / 泥褐 / 深樹皮
  y:'#a8da4e', L:'#2f7a3c', Q:'#244e22', E:'#37c08a',   // 亮葉綠 / 叢林綠 / 暗甲綠 / 翡翠
  Z:'#46ccc6', p:'#ff86b4', O:'#e08a2a', N:'#283038',   // 亮水青 / 豔粉 / 琥珀橙 / 暗殼
  I:'#c8eeff', X:'#b24de0',                              // 晶光 / 異變紫
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
  // ===================== v2.2 第二世界・異種動物敵人 =====================
  // region 4 燔流沙漠：沙蝎蟲群（sandScorpion/hornViper/antlionLord）＋沙漠掠獸（jackal/vulture/sandWyrm）
  sandScorpion:["...........A","..........A.",".DD......DAD","D..D....D.D.",".DD..DDDDD..","...DDDDDDD..","DD.DDDDDDD..","D..DDDDDDD..",".DDD.DD.DDD.","..D.D..D.D..","............","............","............","............","............","............"],
  hornViper:["............","....aa......","...aDDa.....","..aDADa.....","...aDDaa....","....aaDDa...","......aDDa..",".......aDDa.","......aDDa..",".....aDDa...","....aDDa....","...aDDa.....","..aDDa......","..aaa.......","............","............"],
  antlionLord:[".N........N.","..N......N..","..ND.DD.DN..","...NDDDDN...","..DDXDDXDD..","..DDDDDDDD..",".DDDDDDDDDD.","DD.DDDDDD.DD",".DDDDDDDDDD.",".D.DDDDDD.D.",".DDDDDDDDDD.","..DD.DD.DD..","...N....N...","............","............","............"],
  jackal:["............","............","..D......D..","..DD....DD..","..DDDDDDDD..","..DOADDAOD..","..DDDDDDDD..","..OOOOOOOO..","..OmOOOOmO..","..mOOOOOOm..","..OOOOOOOO..",".OOOOOOOOOO.",".OO.OO.OO.O.",".m..m.m..m..","............","............"],
  vulture:["............",".....OO.....","....ODDO....","....DAAD....",".....DD.....","....NNNN....","...NNNNNN...","..NN.NN.NN..",".NNN.NN.NNN.","..N.NNNN.N..","....NNNN....",".....NN.....",".....DD.....","....D..D....","............","............"],
  sandWyrm:["....MMMM....","...MDDDDM...","..MD.XX.DM..","..MDXXXXDM..","..MD.XX.DM..","...MDDDDM...","....DDDD....","...DDDDDD...","...DmDDmD...","...DDDDDD...","....DDDD....","...DDDDDD...","....DDDD....","....DmmD....",".....DD.....","............"],
  // region 5 綠洲水澤：澤畔爬蟲（crocodile/cobra/swampHydra）＋澤蟲走獸（dragonfly/marshHippo/bogBehemoth）
  crocodile:["............","............","yy..........","yyyyyy......","LMLMLMy.....","LLLLLLLLLy..","LyAyLLLLLLy.","LLLLLLLLLLLy","LLLLLLLLLLy.",".LyLyLyLyL..","LL.LL.LL.L..",".m..m..m....","............","............","............","............"],
  cobra:["............","....EEE.....","...EEEEE....","..EE.E.EE...","..EEEEEEE...","...EAEAE....","...EEEEE....","....EEE.....",".....EE.....","....EE......","...EE.......","..EEE.......","..EEEm......","...mm.......","............","............"],
  swampHydra:[".E...E...E..","EEE.EEE.EEE.","EXE.EXE.EXE.",".E...E...E..",".E...E...E..","..E.E.E.E...","...EEEEE....","..EEEEEEE...","..ELLLLLE...","..ELLLLLE...","..EEEEEEE...","...EEEEE....","..mm...mm...",".m.......m..","............","............"],
  dragonfly:["............","...I....I...","..II.EE.II..",".III.EE.III.","..II.EE.II..","...IEEEEI...","....EAE.....","....EEE.....",".....E......",".....E......",".....E......",".....y......",".....y......",".....y......",".....E......","............"],
  marshHippo:["............","............","...wwwwww...","..wwwwwwww..","..wAwwwwAw..","wwwwwwwwwwww","wwwMwwwwMww.","wwwwwwwwwww.","wwwwwwwwww..",".wwwwwwww...",".ww.ww.ww...",".w..w..w....","............","............","............","............"],
  bogBehemoth:["..M......M..","..ML.LL.LM..","..LLLLLLLL..",".LLXLLLLXLL.",".LLLLLLLLLL.","LLLLLLLLLLLL","LLLmLLLLmLLL","LLLLLLLLLLLL",".LLLLLLLLLL.",".LLLLLLLLLL.",".LL.LL.LL.L.",".m..mm.mm.m.","............","............","............","............"],
  // region 6 翠冠叢林：林冠猛獸（jaguar/jungleApe/canopyTyrant）＋毒林群蟲（dartFrog/mantis/bloomColossus）
  jaguar:["............",".O......O...",".OO....OO...",".OOOOOOOO...",".OKOYYOKO...",".OOOOOOOO...","..OOOOOO....",".OOOFOOOOO..",".OKOOOOKOOF.",".OOOOKOOOOO.",".OOOOOOOFOO.","OOOOOOOOOOOO","O.OO.OO.OO.O",".m.m..m..m..","............","............"],
  jungleApe:["...mmmm.....","..mmmmmm....","..mSSSSm....","..mSAASm....","..mSMMSm....","..mmmmmm....",".mmmmmmmm...","mmJmmmmJmm..","mJ.mmmm.Jm..","m..mmmm..m..","...mmmm.....","..mmmmmm....","..mm..mm....",".mm....mm...","............","............"],
  canopyTyrant:["....OO.OO...","...OOOOOOO..","..OOXOOXOO..","..OOMMMMOO..","..OOOOOOOO..",".OOOOOOOOOO.","OOLOOOOOOLO.","OOOOOOOOOOOO","OOLOOOOOOLOO",".OOOOOOOOOO.",".OO.OOOO.OO.",".O...OO...O.","..m..mm..m..","............","............","............"],
  dartFrog:["............","............","...y...y....","..yYy.yYy...","..yyyyyyy...",".ypyyyyypy..",".yyyppyyyy..",".pyyyyyyyp..",".yyyyyyyyy..","..yy...yy...",".yy.....yy..","y..y...y..y.","............","............","............","............"],
  mantis:["....y.......",".....y.y....","....yLLy....","....LAAL....",".....LL.....","y...LLLL....","yy.LLLLLL...",".yyLLLLLL...","...yLLLLy...","....LLLL....","....LLLL....","...y.LL.y...","..y..LL..y..",".y...yy...y.","............","............"],
  bloomColossus:["...p.p.p....","..pXpXpXp...","...pLLLp....","....LLL.....","...LLLLL....","..LLLLLLL...",".LLLyLLyLL..",".LLLLLLLLL..",".LLyLLLLyL..",".LLLLLLLLL..","..LL.LL.LL..",".LL..LL..LL.",".m...mm...m.","............","............","............"],
  // region 7 蝕心雨林（異變）：異變巨獸（chimeraBeast/crystalStalker/heartOfRot）＋蝕林群孽（sporeHound/leechWyrm/worldEater）
  chimeraBeast:["...X....X...","..XL....LX..","..LLLLLLLL..",".LXLAAALXL..",".LLLMMMLLLL.",".LLLLLLLLLL.","XLLLLLLLLLLX","XLLLyLLyLLLX",".LLLLLLLLLL.",".LLLLLLLLLL.",".LL.LLLL.LL.",".LL.LLLL.LL.",".m...mm...m.","..X......X..","............","............"],
  crystalStalker:[".....I......","....III.....","...IIXII....","..IIXXXII...","..IIXAXII...","..IIXXXII...","...IIXII....","...XIIIX....","..X.III.X...",".X..III..X..","....III.....","...XI.IX....","..X.....X...",".X.......X..","............","............"],
  sporeHound:["............","..L......X..","..LL...XLX..","..LLLLLLLL..","..LXALLAXL..","..LLLLLLLL..","...LLLLLL...","..QLLLLLLQ..","..LXLLLLXL..","..QLLLLLLQ..","..LLLLLLLL..",".LLLLLLLLLL.",".LL.LL.LL.L.",".m..m.m..m..","............","............"],
  leechWyrm:["....cccc....","...cXXXXc...","..cX.XX.Xc..","..cXXXXXXc..","..cX.XX.Xc..","...cXXXXc...","....cccc....","...cccccc...","...cXccXc...","...cccccc...","....cccc....","...cccccc...","....cccc....","....cXXc....",".....cc.....","............"],
  heartOfRot:["....X.X.X...","...XLXLXLX..","..XLLLLLLLX.",".XLLLcccLLLX","XLLcccXcccLL","XLLcXAAAXcLL","XLLcccXcccLL",".XLLLcccLLLX","..XLLLLLLLX.","...XLLLLLX..","....XLLLX...","...X.LLL.X..","..X..LLL..X.",".X...X.X...X","............","............"],
  worldEater:[".N........N.",".NX......XN.",".NXLLLLLLXN.",".NLLXLLXLLN.",".NLLLLLLLLN.",".NLLMMMMLLN.","NLLLLLLLLLLN","NLcLLLLLLcLN",".NLLLLLLLLN.",".NLLLLLLLLN.",".NLL.LL.LLN.",".N.L.LL.L.N.","..N..NN..N..",".X........X.","............","............"],
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
  // v1.9 遊俠/盜賊專屬輕甲（補足這兩職的非起始防具，用既有特性 startShield/thorns）
  {name:'遊獵皮衣', def:4, hp:16, lvReq:2, trait:{startShield:14}, traitDesc:'每場開場護盾 +14'},
  {name:'影襲夜衣', def:6, hp:22, lvReq:3, trait:{startShield:18}, traitDesc:'每場開場護盾 +18'},
  {name:'疾風革鎧', def:8, hp:28, lvReq:4, trait:{thorns:0.18}, traitDesc:'反甲：反彈 18% 受到的傷害'},
];
// 世界地圖目的地：tier＝危險/遺物階級、repReq＝解鎖所需聲望（遺物種類數）
// world：每 4 關為一個世界（0=遺跡地城・偏暗，1=沙漠雨林・偏亮）。地城索引 0-3＝第一世界、4-7＝第二世界。
const DESTINATIONS = [
  // ===== 第一世界：遺跡與地城（tier 1-4）=====
  {name:'近郊遺跡', tier:1, repReq:0, world:0, desc:'最近的失落神殿，新手起點。'},
  {name:'枯骨峽谷', tier:2, repReq:2, world:0, desc:'更深的古文明遺跡，怪物更兇、寶物更好。'},
  {name:'沉沒神城', tier:3, repReq:5, world:0, desc:'水下失落都城，遺物階級高，路途遙遠。'},
  {name:'虛空裂隙', tier:4, repReq:9, world:0, desc:'舊神沉眠之地，極兇極富，唯強者可歸。'},
  // ===== 第二世界：沙漠與雨林（tier 5-8，異種野獸橫行）=====
  {name:'燔流沙漠', tier:5, repReq:14, world:1, desc:'烈陽炙烤的無垠沙海，巨蠍與掠獸潛伏沙丘。'},
  {name:'綠洲水澤', tier:6, repReq:19, world:1, desc:'沙海中央的生機綠洲，澤畔巨鱷與蟲群成患。'},
  {name:'翠冠叢林', tier:7, repReq:25, world:1, desc:'藤蔓糾纏的蓊鬱密林，猛獸與毒蟲盤踞林冠。'},
  {name:'蝕心雨林', tier:8, repReq:32, world:1, desc:'深處被異變侵蝕的雨林心臟，異獸滋生、極兇極富。'},
];
const WORLD_COUNT = Math.ceil(DESTINATIONS.length/4);
function worldOfDest(di){ return Math.floor((di||0)/4); }              // 地城 → 世界索引
function destsOfWorld(w){ return DESTINATIONS.map((d,i)=>i).filter(i=>worldOfDest(i)===w); }  // 世界 → 該世界的地城索引
const WORLD_META = [
  {name:'第一世界', sub:'遺跡與地城', accent:'gold'},
  {name:'第二世界', sub:'沙漠與雨林', accent:'ember'},
];
// ===== 遺物目錄（每關固定清單、收齊為止、已得不再掉）=====
// v0.8 去數據化：每件遺物 = 一條「規則」。原本的純數值一律改成改變戰鬥/探索規則的功能。
// 規則旗標：firstHitCrit 首擊必暴｜reviveOnce 每場復活一次｜fullHealAfterBattle 戰後全回
//   splash 每3擊濺射全體｜startShield 開場護盾(數值)｜regen 行動回復(比例)｜killCrit 擊殺後下一擊必暴
//   healToShield 治療溢出轉護盾｜lastStand 低血DEF翻倍+免暈｜firstDeathHeal 首位陣亡全隊回援(比例)
//   firstStrikeAoe 首次攻擊打全體｜soloBoost 寡兵越強｜lifesteal 吸血(比例)
// v2.3：每個地城固定 1 件「首領遺物」，只在擊敗該地城首領時取得（不再從菁英/事件/寶箱掉落）。
//        想換成同地城其他效果，直接改該列的 effect/desc 即可。
const RELIC_CATALOG = [
  // 第一世界
  {id:'idol',      name:'破碎神像', icon:'🗿', dest:0, desc:'近郊遺跡首領的遺物。每位成員每第 3 次攻擊，對全部敵人造成濺射傷害。', effect:{splash:true}},
  {id:'candle',    name:'永燃聖燭', icon:'🔥', dest:1, desc:'枯骨峽谷首領的遺物。每位成員本場「首次攻擊必定暴擊」。', effect:{firstHitCrit:true}},
  {id:'glass',     name:'時之沙漏', icon:'⏳', dest:2, desc:'沉沒神城首領的遺物。每場戰鬥首位陣亡的我方「復活一次」（半血）。', effect:{reviveOnce:true}},
  {id:'wheel',     name:'永恆之輪', icon:'♾', dest:3, desc:'虛空裂隙首領的遺物。每場戰鬥勝利後「全隊完全回復」。', effect:{fullHealAfterBattle:true}},
  // 第二世界
  {id:'venomfang', name:'毒牙圖騰', icon:'🦂', dest:4, desc:'燔流沙漠首領的遺物。成員造成傷害時，回復其中 20% 為自身生命。', effect:{lifesteal:0.20}},
  {id:'croccrown', name:'鱷王之冠', icon:'🐊', dest:5, desc:'綠洲水澤首領的遺物。成員生命低於 25% 時，DEF 翻倍且免疫暈眩。', effect:{lastStand:true}},
  {id:'apexfang',  name:'王獸獠牙', icon:'🐆', dest:6, desc:'翠冠叢林首領的遺物。擊殺敵人後該成員下一擊必定暴擊，且全隊 ATK +3。', effect:{killCrit:true, atk:3}},
  {id:'chimeragene',name:'異變基因', icon:'🧬', dest:7, desc:'蝕心雨林首領的遺物。全隊 ATK +4、DEF +4、HP +30。', effect:{atk:4, def:4, hp:30}},
];
const RELIC_BY_ID={}; RELIC_CATALOG.forEach(r=>{ RELIC_BY_ID[r.id]=r; });
const RELICS_BY_DEST=[]; RELIC_CATALOG.forEach(r=>{ (RELICS_BY_DEST[r.dest]=RELICS_BY_DEST[r.dest]||[]).push(r); });   // 動態：支援任意數量地城

// ===== v2.1 任務 / 懸賞（分階段任務鏈）＋ 稱號（全開）=====
// 每條任務線有 4 階；同一線共用一個「累計擊殺」計數（跨階保留），達標即可領取下一階。
// 領取 → +rep 聲望、解鎖該階稱號（解鎖即生效，可全部疊加）。
//   match：{sprites:[...]} 比對敵人 sprite｜{boss:true} 任意王｜{any:true} 任意敵人
//   稱號 effect：atk/def/hp＝全隊數值（跨線相加）；spawnStun＝開場震懾族群(dur)；dmgVs＝對族群增傷(pct)
//   同一線只生效「最高已領階段」的稱號（震懾秒數/增傷取最高，不疊加）
const Q_GOBLIN=['goblin','goblinArcher','gobShaman','gobChief'];
const Q_CONSTRUCT=['guardian','stoneHound','runeSentinel'];
const Q_BONE=['skeleton','skeletonArcher','boneBrute','boneKnight','boneHound'];
const Q_UNDEAD=['necromancer','wraith','banshee','lich'];
const Q_SEA=['drowned','drownedArcher','coralGolem','tidePriest','drownedBrute','drownedKing','seaSerpent','anglerLurker','reefCrab'];
const Q_VOID=['voidling','voidArcher','voidColossus','voidSeer','voidApostle','eyeStalker','gnawer','riftWyrm','nullStar'];
// v2.2 第二世界任務族群（每條線涵蓋該地城的兩個族群）
const Q_DESERT=['sandScorpion','hornViper','antlionLord','jackal','vulture','sandWyrm'];
const Q_OASIS=['crocodile','cobra','swampHydra','dragonfly','marshHippo','bogBehemoth'];
const Q_JUNGLE2=['jaguar','jungleApe','canopyTyrant','dartFrog','mantis','bloomColossus'];
const Q_ROT=['chimeraBeast','crystalStalker','heartOfRot','sporeHound','leechWyrm','worldEater'];
const QUEST_LINES = (function(){
  // 三種任務線 builder：每階 = [累計目標, 聲望, 稱號id, 稱號名, 數值]
  const stunLine=(id,name,icon,fac,sprites,arr)=>({id,name,icon,match:{sprites},
    stages:arr.map(a=>({target:a[0],rep:a[1],title:{id:a[2],name:a[3],icon,desc:'戰鬥開始時，'+fac+'被震懾 '+(a[4]/1000)+' 秒',effect:{spawnStun:{sprites,dur:a[4]}}}}))});
  const dmgLine=(id,name,icon,fac,sprites,arr)=>({id,name,icon,match:{sprites},
    stages:arr.map(a=>({target:a[0],rep:a[1],title:{id:a[2],name:a[3],icon,desc:'對'+fac+'造成的傷害 +'+Math.round(a[4]*100)+'%',effect:{dmgVs:{sprites,pct:a[4]}}}}))});
  const statLine=(id,name,icon,match,arr)=>({id,name,icon,match,
    stages:arr.map(a=>({target:a[0],rep:a[1],title:{id:a[2],name:a[3],icon,desc:'全隊 '+a[4],effect:a[5]}}))});
  return [
    stunLine('goblin','討伐哥布林','⚔','哥布林',Q_GOBLIN,[
      [10,1,'goblin_slayer','哥布林殺手',2000],[50,2,'goblin_butcher','哥布林屠夫',3000],
      [150,3,'goblin_bane','哥布林剋星',4000],[400,4,'goblin_exterminator','哥布林滅絕者',5000]]),
    stunLine('bone','肅清枯骨','💀','枯骨類',Q_BONE,[
      [12,1,'bonecrusher','碎骨者',1500],[60,2,'bone_grinder','骸骨碾碎者',2500],
      [180,3,'bone_render','亡骨粉碎者',3500],[480,4,'bone_ender','枯骨終結者',4500]]),
    stunLine('void','狩獵虛空','🌀','虛空魔物',Q_VOID,[
      [10,1,'void_hunter','虛空獵人',1500],[50,2,'void_conqueror','虛空征服者',2500],
      [150,3,'void_sovereign','虛空主宰',3500],[400,4,'void_ender','虛空終結者',4500]]),
    dmgLine('construct','破壞遺跡造物','🗿','遺跡造物',Q_CONSTRUCT,[
      [8,1,'ruin_breaker','遺跡破壞者',0.25],[40,2,'ruin_shatterer','遺跡粉碎者',0.40],
      [120,3,'ruin_ender','遺跡終結者',0.55],[320,4,'ruin_destroyer','遺跡毀滅者',0.70]]),
    dmgLine('undead','超渡亡靈','👻','亡靈',Q_UNDEAD,[
      [8,1,'wraith_bane','滅靈者',0.25],[40,2,'soul_warden','鎮魂者',0.40],
      [120,3,'exorcist','驅魔者',0.55],[320,4,'undead_ender','亡靈終結者',0.70]]),
    dmgLine('sea','征討海族','🌊','海族',Q_SEA,[
      [10,1,'tide_breaker','怒海克星',0.25],[50,2,'tide_sovereign','鎮海者',0.40],
      [150,3,'sea_master','馭海者',0.55],[400,4,'abyss_ender','深淵終結者',0.70]]),
    // ===== 第二世界任務線（沙漠→綠洲→叢林→深雨林）=====
    dmgLine('w2_desert','沙漠獵殺','🏜','沙漠野獸',Q_DESERT,[
      [10,2,'dune_hunter','沙漠獵手',0.25],[50,3,'dune_stalker','沙漠追獵者',0.40],
      [150,4,'dune_reaver','沙漠掠奪者',0.55],[400,5,'dune_warlord','沙漠霸主',0.70]]),
    stunLine('w2_oasis','澤畔肅清','🐊','澤畔生物',Q_OASIS,[
      [10,2,'marsh_breaker','澤畔破壞者',2000],[50,3,'marsh_tamer','澤畔馴獸者',3000],
      [150,4,'marsh_warden','澤畔守望者',4000],[400,5,'marsh_sovereign','澤畔主宰',5000]]),
    dmgLine('w2_jungle','叢林征伐','🐆','叢林猛獸',Q_JUNGLE2,[
      [10,2,'jungle_hunter','叢林獵手',0.25],[50,3,'jungle_slayer','叢林屠戮者',0.40],
      [150,4,'jungle_bane','叢林剋星',0.55],[400,5,'jungle_king','叢林之王',0.70]]),
    stunLine('w2_rot','蝕林淨化','🧬','異變生物',Q_ROT,[
      [10,2,'rot_purger','蝕林淨化者',2000],[50,3,'rot_breaker','異變破壞者',3000],
      [150,4,'rot_warden','蝕林守望者',4000],[400,5,'rot_ender','異變終結者',5000]]),
    statLine('veteran','身經百戰','🎖',{any:true},[
      [100,2,'veteran','百戰老兵','ATK +2、DEF +2',{atk:2,def:2}],[500,3,'warlord','千戰宿將','ATK +4、DEF +4',{atk:4,def:4}],
      [1500,4,'grand_marshal','萬戰統帥','ATK +6、DEF +6',{atk:6,def:6}],[4000,5,'war_god','不朽戰神','ATK +9、DEF +9',{atk:9,def:9}]]),
    statLine('king','弒王之路','👑',{boss:true},[
      [5,2,'king_slayer','屠王者','ATK +3、HP +20',{atk:3,hp:20}],[20,3,'god_slayer','弒神者','ATK +5、HP +40',{atk:5,hp:40}],
      [60,4,'king_ender','諸王終結者','ATK +7、HP +70',{atk:7,hp:70}],[150,5,'eternal_lord','永恆霸主','ATK +10、HP +110',{atk:10,hp:110}]]),
  ];
})();
const QLINE_BY_ID={}; QUEST_LINES.forEach(l=>{ QLINE_BY_ID[l.id]=l; });
const TITLE_BY_ID={}; QUEST_LINES.forEach(l=>l.stages.forEach(s=>{ if(s.title) TITLE_BY_ID[s.title.id]=s.title; }));

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
  // 第二世界素材
  {id:'flint',     name:'燧砂石', icon:'🪨', dest:4},
  {id:'amber',     name:'琥珀',   icon:'🟡', dest:5},
  {id:'vine',      name:'翠藤',   icon:'🍃', dest:6},
  {id:'rotcrystal',name:'蝕晶',   icon:'🟪', dest:7},
];
const MATERIAL_BY_ID={}; MATERIALS.forEach(m=>{ MATERIAL_BY_ID[m.id]=m; });
const MATERIAL_BY_DEST={}; MATERIALS.forEach(m=>{ MATERIAL_BY_DEST[m.dest]=m; });
// ===== 食材（料理用）：特定關出特定食材 =====
const INGREDIENTS = [
  {id:'herb',  name:'野菜',   icon:'🌿', dest:0},
  {id:'meat',  name:'獸肉',   icon:'🍖', dest:1},
  {id:'fish',  name:'深海魚', icon:'🐟', dest:2},
  {id:'spice', name:'異香料', icon:'🌶', dest:3},
  // 第二世界食材
  {id:'cactus',    name:'仙人掌果', icon:'🌵', dest:4},
  {id:'lotusroot', name:'蓮藕',     icon:'🪷', dest:5},
  {id:'banana',    name:'叢林野果', icon:'🍌', dest:6},
  {id:'rotfungus', name:'蝕心菇',   icon:'🍄', dest:7},
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
// ===== 料理：食材→補血／增益（營火即可料理；食材靠營火採集，領隊／隨車鍋增加採集量）=====
// v0.8：料理 buff 從純 ATK/DEF 數值，改成「一次性功能」(grant)，保留補血。
// grant：shield 下場開場護盾(amt)｜revive 下場一次陣亡復活充能｜firstCrit 下場全隊首擊必暴
const RECIPES = [
  {id:'soup',  name:'野菜湯',     need:{herb:1},          desc:'全隊立即回復 30% HP',                     heal:0.30},
  {id:'bbq',   name:'獸肉燒烤',   need:{meat:1},          desc:'下一場戰鬥全隊開場獲得 20 點護盾',         grant:'shield', amt:20},
  {id:'fish',  name:'深海魚料理', need:{fish:1},          desc:'全隊回復 50% HP，並獲得一次「陣亡復活」充能', heal:0.50, grant:'revive'},
  {id:'feast', name:'異香料盛宴', need:{spice:2},          desc:'全隊回復 40% HP，下一場戰鬥全隊首擊必暴',   heal:0.40, grant:'firstCrit'},
  // 第二世界料理
  {id:'cactusjuice',name:'仙人掌汁',  need:{cactus:1},      desc:'全隊立即回復 35% HP',                       heal:0.35},
  {id:'lotusstew',  name:'蓮藕燉湯',  need:{lotusroot:1},   desc:'下一場戰鬥全隊開場獲得 25 點護盾',          grant:'shield', amt:25},
  {id:'junglefeast',name:'叢林野果盤',need:{banana:1},      desc:'全隊回復 55% HP，並獲得一次「陣亡復活」充能', heal:0.55, grant:'revive'},
  {id:'rotbanquet', name:'蝕菇盛宴',  need:{rotfungus:2},   desc:'全隊回復 45% HP，下一場戰鬥全隊首擊必暴',   heal:0.45, grant:'firstCrit'},
];
// ===== 工坊強化（工匠解鎖，一次性，全部屬後勤）：craftReq 工匠階級門檻 =====
// feature：deck2 清掉精英戰後 +3 貨格｜campstove 每次營火多採集 1 份食材
const UPGRADES = [
  {id:'rack1',    name:'加固貨架',   craftReq:1, effect:{slots:2},            cost:{mats:{wood:2}},           desc:'貨格 +2'},
  {id:'deck2',    name:'貨車第二層', craftReq:2, effect:{feature:'deck2'},    cost:{mats:{iron:2}},           desc:'清掉精英戰後開啟，貨格 +3（高風險，全滅照噴）'},
  {id:'campstove',name:'隨車鍋',     craftReq:2, effect:{feature:'campstove'},cost:{mats:{iron:1,crystal:1}}, desc:'每次營火多採集 1 份食材'},
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
  // 階級 1-8（第二世界 tier 5-8 沿用後段更高階名稱與價值）
  valuable:['碎銀錢袋','古青銅幣','寶石原石','黃金聖盃','失落王冠','龍血紅玉','星辰寶石','創世遺金'],
  consum:['治療藥水','解毒劑','聖水','回復卷軸','復活之種','鳳凰藥劑','神聖甘露','不死靈藥'],
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
  // v2.2 第二世界・異種動物
  sandScorpion:'盤踞沙丘的巨蠍，毒尾一擊致命、雙螯夾碎獵物。', hornViper:'頭生雙角的沙蝰，疾速突咬、難以捉摸。', antlionLord:'沙海之下的異變蟻獅，巨顎開闔、捲沙吞敵。',
  jackal:'成群獵食的沙漠胡狼，迅猛而貪婪。', vulture:'盤旋沙空的兀鷲，俯衝撕咬、遠程襲擊。', sandWyrm:'鑽行沙海的異變巨蟲，環口利齒能吞噬整隊。',
  crocodile:'澤畔潛伏的巨鱷，血盆大口一咬定生死。', cobra:'昂首吐信的眼鏡蛇，遠距噴射毒液。', swampHydra:'澤心異變的多頭巨蛇，斬一首而生兩首。',
  dragonfly:'掠水疾飛的巨蜻蜓，複眼鎖定、撕咬迅捷。', marshHippo:'澤畔巨河馬，龐然厚實、衝撞如錘。', bogBehemoth:'泥沼孕育的異變巨獸，蠻力踏碎一切。',
  jaguar:'林冠潛行的斑紋獵手，撲咬致命。', jungleApe:'捶胸怒吼的叢林巨猿，重拳震懾全場。', canopyTyrant:'統御密林的異變霸獸，連擊與重壓交織。',
  dartFrog:'色彩豔麗的箭毒蛙，遠距噴吐劇毒。', mantis:'揮舞雙刃的巨螳，疾斬連擊。', bloomColossus:'花冠異變的植物巨像，藤蔓纏絞、孢粉惑敵。',
  chimeraBeast:'拼湊多種血脈的異變獸，狂亂難測。', crystalStalker:'被晶化侵蝕的獸體，射出尖銳晶刺。', sporeHound:'渾身孢囊的異變獵犬，撲咬散毒。',
  leechWyrm:'吸附血肉的巨蛭，環口緊咬不放。', heartOfRot:'雨林心臟的異變母體，凝視奪魂、孕育群孽。', worldEater:'自裂縫降臨的噬世巨獸，吞噬一切血肉。',
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
      G('gob_warhost',0,'goblins','elite',3, [at(bers(),548,332,'front'), at(wolf(),596,200,'front'), at(wolf(),566,472,'front'), at(sol(),686,152,'mid'), at(archS(),716,300,'mid')]),
      G('gob_boss_chief',0,'goblins','boss',2,
        [at(sol(),555,262,'front'), at(wolf(),592,420,'front'), at(archS(),712,330,'mid')],
        [at(E('gobChief','哥布林酋長',340,[26,18,34],5,1300,0,{boss:true,skills:[quake]}),700,330,'front'), at(sham(),550,236,'mid'), at(arch(),562,430,'mid')]),
      // 遺跡造物
      G('con_patrol',0,'construct','normal',1, [at(shound(),560,330,'front'), at(rune(),678,232,'mid')]),
      G('con_pack',0,'construct','normal',2, [at(shound(),545,258,'front'), at(shound(),580,422,'front'), at(rune(),700,320,'mid')]),
      G('con_guard',0,'construct','elite',2, [at(stone(),548,332,'front'), at(shound(),582,205,'front'), at(rune(),702,250,'mid'), at(rune(),712,452,'mid')]),
      G('con_phalanx',0,'construct','elite',3, [at(stone(),548,332,'front'), at(shound(),596,200,'front'), at(shound(),566,472,'front'), at(rune(),700,250,'mid'), at(rune(),700,420,'mid')]),
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
      G('bone_legion',1,'bone','elite',3, [at(bguard(),542,322,'front'), at(knight(),584,182,'front'), at(bhound(),562,472,'front'), at(bwar(),678,152,'mid'), at(barchS(),708,300,'mid')]),
      G('bone_boss_king',1,'bone','boss',2,
        [at(bwar(),555,262,'front'), at(knight(),592,420,'front'), at(barchS(),712,330,'mid')],
        [at(E('boneBrute','枯骨之王',380,[32,20,44],5,1300,0,{boss:true,skills:[quake]}),700,330,'front'), at(barchS(),550,330,'mid')]),
      // 亡靈
      G('spirit_haunt',1,'spirit','normal',1, [at(wraith(),560,330,'front'), at(banshee(),678,232,'mid')]),
      G('spirit_coven',1,'spirit','normal',2, [at(wraith(),535,250,'front'), at(wraith(),575,422,'front'), at(banshee(),702,210,'mid'), at(necro(),700,400,'mid')]),
      G('spirit_dirge',1,'spirit','elite',3, [at(wraith(),520,272,'front'), at(wraith(),560,452,'front'), at(wraith(),592,170,'front'), at(banshee(),690,300,'mid'), at(necro(),666,460,'mid')]),
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
      G('drowned_legion',2,'drowned','elite',3, [at(dbrute(),542,322,'front'), at(dguard(),584,184,'front'), at(dguard(),562,472,'front'), at(dsol(),678,154,'mid'), at(darchS(),708,300,'mid')]),
      G('drowned_boss_king',2,'drowned','boss',2,
        [at(dguard(),555,262,'front'), at(dbrute(),592,420,'front'), at(darchS(),712,330,'mid')],
        [at(E('drownedKing','溺亡君王',460,[28,20,36],8,1380,0,{boss:true,skills:[quake,combo]}),700,330,'front'), at(tpr(),550,236,'mid'), at(darchS(),562,430,'mid')]),
      // 深海生物
      G('sea_reef',2,'seabeast','normal',1, [at(serpent(),560,330,'front'), at(angler(),678,232,'mid')]),
      G('sea_pod',2,'seabeast','normal',2, [at(serpent(),545,258,'front'), at(serpent(),580,422,'front'), at(angler(),700,320,'mid')]),
      G('sea_shoal',2,'seabeast','elite',2, [at(coral(),548,332,'front'), at(serpent(),582,205,'front'), at(angler(),702,250,'mid'), at(angler(),712,452,'mid')]),
      G('sea_deepswarm',2,'seabeast','elite',3, [at(reef(),542,322,'front'), at(serpent(),586,184,'front'), at(serpent(),562,472,'front'), at(coral(),678,160,'mid'), at(angler(),708,310,'mid')]),
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
      G('void_swarm',3,'voidcult','elite',3, [at(vfren(),506,234,'front'), at(vhunt(),546,372,'front'), at(vl(),586,492,'front'), at(vcol(),650,166,'mid'), at(vfren(),694,302,'mid'), at(vcast(),660,452,'mid')]),
      G('void_boss_titan',3,'voidcult','boss',2,
        [at(vfren(),555,262,'front'), at(vhunt(),592,420,'front'), at(vcastS(),712,330,'mid')],
        [at(E('voidColossus','虛空泰坦',500,[34,22,46],6,1300,0,{boss:true,skills:[quake,combo]}),700,330,'front'), at(apostle(),550,236,'mid'), at(vcastS(),562,430,'mid')]),
      // 裂隙異獸
      G('aberr_pair',3,'aberration','normal',1, [at(gnaw(),560,330,'front'), at(eye(),678,232,'mid')]),
      G('aberr_brood',3,'aberration','normal',2, [at(gnaw(),535,250,'front'), at(gnaw(),575,422,'front'), at(eye(),702,210,'mid'), at(eye(),700,400,'mid')]),
      G('aberr_horror',3,'aberration','elite',3, [at(wyrm(),520,300,'front'), at(gnaw(),566,170,'front'), at(gnaw(),562,470,'front'), at(eye(),690,250,'mid'), at(wyrm(),812,330,'back')]),
      G('aberr_boss_nullstar',3,'aberration','boss',2,
        [at(gnaw(),555,262,'front'), at(wyrm(),592,420,'front'), at(eye(),712,330,'mid')],
        [at(E('nullStar','虛無之星',520,[30,36,24],6,1300,1,{boss:true,skills:[combo,power,quake]}),700,330,'front'), at(eye(),550,236,'mid'), at(eye(),562,430,'mid')])
    );
  })();
  // ---------- region 4：燔流沙漠（沙蝎蟲群 / 沙漠掠獸）----------
  (function(){
    // 沙蝎蟲群
    const scorp=()=>E('sandScorpion','沙蠍',96,[16,21],4,1350,0,{skills:[smash]}), scorpBig=()=>E('sandScorpion','巨甲沙蠍',130,[18,23],5,1450,0,{skills:[smash]});
    const viper=()=>E('hornViper','角蝰',64,[18,22],1,1000,0,{skills:[sneak]}), viperS=()=>E('hornViper','劇毒角蝰',70,[22,26],1,950,0,{skills:[sneak]});
    // 沙漠掠獸
    const jackal=()=>E('jackal','胡狼',70,[16,20],2,950,0,{skills:[frenzy]}), jackalA=()=>E('jackal','狂暴胡狼',80,[18,22],2,900,0,{skills:[frenzy]});
    const vult=()=>E('vulture','兀鷲',60,[20,24],1,1100,1,{skills:[power]}), vultS=()=>E('vulture','嗜血兀鷲',66,[22,26],1,1050,1,{skills:[power]});
    out.push(
      // 沙蝎蟲群
      G('sand_scorp_patrol',4,'sandkin','normal',1, [at(scorp(),560,330,'front'), at(viper(),678,232,'mid')]),
      G('sand_scorp_nest',4,'sandkin','normal',2, [at(scorpBig(),535,250,'front'), at(viper(),575,422,'front'), at(viperS(),702,182,'mid'), at(viper(),690,360,'mid')]),
      G('sand_scorp_swarm',4,'sandkin','elite',3, [at(scorpBig(),542,322,'front'), at(scorp(),584,182,'front'), at(viper(),562,472,'front'), at(viperS(),678,152,'mid'), at(viperS(),708,300,'mid')]),
      G('sand_boss_antlion',4,'sandkin','boss',2,
        [at(scorp(),555,262,'front'), at(viper(),592,420,'front'), at(viperS(),712,330,'mid')],
        [at(E('antlionLord','蟻獅領主',420,[28,18,38],6,1300,0,{boss:true,skills:[quake,combo]}),700,330,'front'), at(scorpBig(),550,236,'mid'), at(viperS(),562,430,'mid')]),
      // 沙漠掠獸
      G('dune_pack',4,'dunebeast','normal',1, [at(jackal(),560,330,'front'), at(vult(),678,232,'mid')]),
      G('dune_hunt',4,'dunebeast','normal',2, [at(jackal(),545,258,'front'), at(jackalA(),580,422,'front'), at(vult(),700,320,'mid')]),
      G('dune_frenzy',4,'dunebeast','elite',3, [at(jackalA(),542,322,'front'), at(jackalA(),584,182,'front'), at(jackal(),562,472,'front'), at(vultS(),678,152,'mid'), at(vultS(),708,300,'mid')]),
      G('dune_boss_wyrm',4,'dunebeast','boss',2,
        [at(jackal(),555,262,'front'), at(jackalA(),592,420,'front'), at(vult(),712,330,'mid')],
        [at(E('sandWyrm','沙蟲王',460,[30,20,40],6,1350,0,{boss:true,skills:[quake2,smash]}),700,330,'front'), at(vultS(),550,330,'mid')])
    );
  })();
  // ---------- region 5：綠洲水澤（澤畔爬蟲 / 澤蟲走獸）----------
  (function(){
    // 澤畔爬蟲
    const croc=()=>E('crocodile','澤鱷',150,[18,23],5,1450,0,{skills:[smash]}), crocBig=()=>E('crocodile','巨顎澤鱷',180,[20,26],6,1500,0,{skills:[smash]});
    const cobra=()=>E('cobra','眼鏡蛇',74,[20,24],2,1100,1,{skills:[power]}), cobraS=()=>E('cobra','劇毒眼鏡蛇',80,[24,28],2,1050,1,{skills:[power]});
    // 澤蟲走獸
    const fly=()=>E('dragonfly','巨蜻蜓',76,[22,26],1,1000,1,{skills:[frenzy]}), flyS=()=>E('dragonfly','掠水蜻蜓',84,[24,28],1,950,1,{skills:[frenzy]});
    const hippo=()=>E('marshHippo','澤馬',160,[18,22],5,1450,0,{skills:[smash]}), hippoA=()=>E('marshHippo','暴怒澤馬',190,[20,26],5,1400,0,{skills:[smash]});
    out.push(
      // 澤畔爬蟲
      G('marsh_croc_bask',5,'reptile','normal',1, [at(croc(),560,330,'front'), at(cobra(),678,232,'mid')]),
      G('marsh_croc_den',5,'reptile','normal',2, [at(crocBig(),535,250,'front'), at(croc(),575,422,'front'), at(cobra(),702,182,'mid'), at(cobraS(),690,360,'mid')]),
      G('marsh_croc_ambush',5,'reptile','elite',3, [at(crocBig(),542,322,'front'), at(croc(),584,182,'front'), at(cobraS(),678,152,'mid'), at(cobraS(),708,300,'mid')]),
      G('marsh_boss_hydra',5,'reptile','boss',2,
        [at(croc(),555,262,'front'), at(cobra(),592,420,'front'), at(cobraS(),712,330,'mid')],
        [at(E('swampHydra','沼澤海德拉',520,[26,20,34],7,1350,0,{boss:true,healer:true,heal:16,skills:[gheal,combo]}),700,330,'front'), at(cobraS(),550,236,'mid'), at(croc(),562,430,'mid')]),
      // 澤蟲走獸
      G('mire_swarm',5,'mire','normal',1, [at(hippo(),560,330,'front'), at(fly(),678,232,'mid')]),
      G('mire_drift',5,'mire','normal',2, [at(hippo(),545,258,'front'), at(flyS(),700,200,'mid'), at(fly(),700,360,'mid')]),
      G('mire_storm',5,'mire','elite',3, [at(hippoA(),542,322,'front'), at(hippo(),584,182,'front'), at(flyS(),678,152,'mid'), at(flyS(),708,300,'mid'), at(fly(),812,330,'back')]),
      G('mire_boss_behemoth',5,'mire','boss',2,
        [at(hippo(),555,262,'front'), at(fly(),592,420,'front'), at(flyS(),712,330,'mid')],
        [at(E('bogBehemoth','沼澤巨獸',560,[32,22,42],8,1400,0,{boss:true,skills:[quake,smash]}),700,330,'front'), at(flyS(),550,330,'mid')])
    );
  })();
  // ---------- region 6：翠冠叢林（林冠猛獸 / 毒林群蟲）----------
  (function(){
    // 林冠猛獸
    const jag=()=>E('jaguar','美洲豹',96,[24,28],3,900,0,{skills:[sneak]}), jagS=()=>E('jaguar','嗜血美洲豹',106,[26,32],3,850,0,{skills:[sneak]});
    const ape=()=>E('jungleApe','叢林巨猿',170,[22,28],5,1350,0,{skills:[smash]}), apeA=()=>E('jungleApe','銀背巨猿',200,[24,30],6,1300,0,{skills:[frenzy,smash]});
    // 毒林群蟲
    const frog=()=>E('dartFrog','箭毒蛙',80,[24,28],2,1050,1,{skills:[power]}), frogS=()=>E('dartFrog','劇毒箭蛙',88,[28,32],2,1000,1,{skills:[power]});
    const mant=()=>E('mantis','巨螳',92,[24,30],3,900,0,{skills:[frenzy]}), mantS=()=>E('mantis','刃翅巨螳',100,[28,34],3,850,0,{skills:[frenzy]});
    out.push(
      // 林冠猛獸
      G('jungle_prowl',6,'junglebeast','normal',1, [at(ape(),560,330,'front'), at(jag(),678,232,'mid')]),
      G('jungle_troop',6,'junglebeast','normal',2, [at(ape(),535,250,'front'), at(jag(),575,422,'front'), at(jag(),702,182,'mid'), at(jagS(),690,360,'mid')]),
      G('jungle_warband',6,'junglebeast','elite',3, [at(apeA(),542,322,'front'), at(jagS(),584,182,'front'), at(jag(),562,472,'front'), at(jagS(),678,152,'mid'), at(jag(),708,300,'mid')]),
      G('jungle_boss_tyrant',6,'junglebeast','boss',2,
        [at(ape(),555,262,'front'), at(jag(),592,420,'front'), at(jagS(),712,330,'mid')],
        [at(E('canopyTyrant','林冠霸主',600,[34,22,44],7,1300,0,{boss:true,skills:[quake,combo]}),700,330,'front'), at(apeA(),550,236,'mid'), at(jagS(),562,430,'mid')]),
      // 毒林群蟲
      G('venom_creep',6,'venomkin','normal',1, [at(mant(),560,330,'front'), at(frog(),678,232,'mid')]),
      G('venom_brood',6,'venomkin','normal',2, [at(mant(),535,250,'front'), at(mantS(),575,422,'front'), at(frog(),702,182,'mid'), at(frogS(),690,360,'mid')]),
      G('venom_swarm',6,'venomkin','elite',3, [at(mantS(),542,322,'front'), at(mant(),584,182,'front'), at(frogS(),678,152,'mid'), at(frogS(),708,300,'mid'), at(frog(),812,330,'back')]),
      G('venom_boss_bloom',6,'venomkin','boss',2,
        [at(mant(),555,262,'front'), at(frog(),592,420,'front'), at(frogS(),712,330,'mid')],
        [at(E('bloomColossus','繁花巨像',580,[28,20,36],8,1350,0,{boss:true,healer:true,heal:18,skills:[gheal,power]}),700,330,'front'), at(frogS(),550,236,'mid'), at(mantS(),562,430,'mid')])
    );
  })();
  // ---------- region 7：蝕心雨林（異變巨獸 / 蝕林群孽）----------
  (function(){
    // 異變巨獸
    const chim=()=>E('chimeraBeast','異獸',120,[26,32],4,1050,0,{skills:[frenzy]}), chimS=()=>E('chimeraBeast','狂亂異獸',136,[30,36],4,1000,0,{skills:[frenzy,sneak]});
    const cry=()=>E('crystalStalker','晶蝕者',92,[26,30],2,1050,1,{skills:[power,smash]}), cryS=()=>E('crystalStalker','晶爆者',100,[30,34],2,1000,1,{skills:[power]});
    // 蝕林群孽
    const spore=()=>E('sporeHound','孢獸',100,[26,30],2,920,0,{skills:[frenzy]}), sporeS=()=>E('sporeHound','劇毒孢獸',112,[28,34],2,880,0,{skills:[frenzy,sneak]});
    const leech=()=>E('leechWyrm','蝕蛭',180,[24,28],5,1400,0,{skills:[smash]}), leechS=()=>E('leechWyrm','巨蝕蛭',210,[26,32],6,1380,0,{skills:[smash]});
    out.push(
      // 異變巨獸
      G('aberr2_pair',7,'aberrant','normal',1, [at(chim(),560,330,'front'), at(cry(),678,232,'mid')]),
      G('aberr2_pack',7,'aberrant','normal',2, [at(chim(),535,250,'front'), at(chimS(),575,422,'front'), at(cry(),702,182,'mid'), at(cryS(),690,360,'mid')]),
      G('aberr2_horror',7,'aberrant','elite',3, [at(chimS(),506,234,'front'), at(chim(),546,372,'front'), at(cry(),586,492,'front'), at(cryS(),678,152,'mid'), at(cryS(),708,300,'mid')]),
      G('aberr2_boss_heart',7,'aberrant','boss',2,
        [at(chim(),555,262,'front'), at(cry(),592,420,'front'), at(cryS(),712,330,'mid')],
        [at(E('heartOfRot','蝕心母獸',640,[30,20,40],7,1300,1,{boss:true,healer:true,heal:20,skills:[gheal,combo,power]}),700,330,'front'), at(chimS(),550,236,'mid'), at(cryS(),562,430,'mid')]),
      // 蝕林群孽
      G('rot_crawl',7,'rotkin','normal',1, [at(leech(),560,330,'front'), at(spore(),678,232,'mid')]),
      G('rot_brood',7,'rotkin','normal',2, [at(leech(),545,258,'front'), at(spore(),580,422,'front'), at(sporeS(),700,320,'mid')]),
      G('rot_blight',7,'rotkin','elite',3, [at(leechS(),542,322,'front'), at(spore(),584,182,'front'), at(spore(),562,472,'front'), at(sporeS(),678,152,'mid'), at(sporeS(),708,300,'mid')]),
      G('rot_boss_eater',7,'rotkin','boss',2,
        [at(leech(),555,262,'front'), at(spore(),592,420,'front'), at(sporeS(),712,330,'mid')],
        [at(E('worldEater','噬世者',720,[36,24,48],8,1350,0,{boss:true,skills:[quake,combo,smash]}),700,330,'front'), at(leechS(),550,330,'mid')])
    );
  })();
  return out;
})();
