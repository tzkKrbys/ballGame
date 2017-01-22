(function() {
  'use strict';

  // Canvas未サポートは実行しない
  if (!window.HTMLCanvasElement) return;//即時return

  //----------------------------------------------------------------------定数
  //画像パス
  var LOGO_BLUE_PATH = "./images/gsacLogoBlue50x50.png";
  var LOGO_GREEN_PATH = "./images/gsacLogoGreen50x50.png";
  var LOGO_PINK_PATH = "./images/gsacLogoPink50x50.png";
  var BG_IMG_PATH = "./images/gsacademylogo.jpg";

  //自機のカラー
  var COLOR_GREEN = "#294";
  var COLOR_PINK = "#f48";
  var COLOR_BLUE = "#44f";


  //ブロックを描画する際に使用する定数
  var NO_BLOCK = 0;//ブロックがない
  var EXIST_BLOCK = 1;//ブロックがある
  var BLOCK_WITH_GREEN_ITEM = 2;//ブロックがあり、緑のアイテムが入っている
  var BLOCK_WITH_PINK_ITEM = 3;//ブロックがあり、ピンクのアイテムが入っている

  //効果中のアイテムを表す定数
  var NO_ITEM = 0;//アイテム効果中でないことを示す
  var GREEN_ITEM = 1;//greenのアイテム効果中であることを示す
  var PINK_ITEM = 2;//pinkのアイテム効果中であることを示す

  //自機の幅
  var NORMAL_WIDTH = 100;//自機の標準時の幅
  var SHORT_WIDTH = 60;//緑のアイテムを取った際の自機の幅
  var LONG_WIDTH = 140;//ピンクのアイテムを取った際の自機の幅


  //----------------------------------------------------------------------変数
  var canvas = document.getElementById('canvas');//canvasタグを変数へ格納
  var ctx = canvas.getContext('2d');//コンテキストを変数へ格納

  //アイテムを格納する配列
  var itemsAry = [];//アイテムを表示させるために使用する配列

  //背景用
  var bgImg = new Image(510,510);//imgタグを生成
  bgImg.src = BG_IMG_PATH;//画像パスを指定

  //初期設定部分。ここで使用する変数や関数、イベントなどを定義しておく。
  var _animationID; //タイマーID

  //----------------------------------------ゲームステータスオブジェクト
  var gs = { //gameStatusの略でgs
    frameCount: 0, //アニメーションフレームのカウンター
    isGameStarted: false, //ゲーム中かどうかのフラグ
    startTime: 0, //ゲームをスタートした時点の現在の日時ミリ秒
    countTime: 0, //ゲームをスタートしてから経過した秒数
    bestTime: null, //今までの最短時間
    gameOverDisplayTime: 0, //ゲームをクリアした際に画面上に「ゲームクリア」の文字を表示させる時間
    gameClearDisplayTime: 0 //ゲームをクリアした際に画面上に「ゲームクリア」の文字を表示させる時間
  };

  //----------------------------------------ballオブジェクト
  var ba = { //ballの略
    speed: 6, //ボールのスピード
    speedX: 0, //ボールのx方向のスピード
    speedY: 0, //ボールのy方向のスピード
    posX: 0, //ボールのx座標
    posY: 0, //ボールのy座標
    diameter: 25, //ボールの直径
    radius: 12.5, //ボールの半径
    imgPath: null,//一旦空で定義
    move: function() { //ballを動かすメソッド
      this.posX += this.speedX;//x座標をspeedX分移動する
      this.posY += this.speedY;//y座標をspeedY分移動する
    }
  };
  ba.imgPath = (function() {//ba.imgPathプロパティへボール画像を設定
    var image = new Image();//imgタグを生成
    image.src = LOGO_BLUE_PATH;//imgタグにパスを指定
    return image;//return でimgタグを返す
  })();

  //----------------------------------------自機オブジェクト
  var p = { //playerの略
    speedX: 8, //移動速度
    SpeedY: 0, //移動速度
    posX: 0, //X軸の位置
    posY: ctx.canvas.height - 60,//画面下からのポジションを指定
    width: 100, //自機の幅
    height: 10, //自機の高さ
    moveLeft: false, //自機を左へ動かすフラグ
    moveRight: false, //自機を右へ動かすフラグ
    color: COLOR_BLUE, //自機の色
    itemTime: 0, //itemの効力の残り時間
    workingItem: NO_ITEM, //今効いているアイテムのタイプ
    changeColorFn: function() { //色をかえるメソッド
      if (this.workingItem === GREEN_ITEM) {//もし効果中のアイテムが緑なら
        this.color = COLOR_GREEN;
      } else if (this.workingItem === PINK_ITEM) {//もし効果中のアイテムがピンクなら
        this.color = COLOR_PINK;
      } else {//もしアイテム効果中で無ければ
        this.color = COLOR_BLUE;
      }
    },
    move: function() { //自機の変数の値を変化させるメソッド
      if (this.moveLeft) { //もし左キーが押されていたら
        this.posX -= this.speedX; //x座標をspeedX分減算
      }
      if (this.moveRight) { //もし右キーが押されていたら
        this.posX += this.speedX; //x座標をspeedX分足す
      }
      if (this.posX < 0) { //自機が左端なら
        this.posX = 0; //自機のx座標を0に戻す
      } else if ((this.posX + this.width) - ctx.canvas.width > 0) { //自機が右端以上なら
        this.posX = ctx.canvas.width - this.width; //右端に戻す
      }
    }
  };



  //------------------------------------------------------------soundオブジェクト

  //音源の登録
  createjs.Sound.registerSound("./sound/ballHitPr.mp3", 'ballHitPr');//自機とボール
  createjs.Sound.registerSound("./sound/kabe.mp3", 'kabe');//ボールが壁に当たった
  createjs.Sound.registerSound("./sound/destruction1.mp3", 'destruction1');
  createjs.Sound.registerSound("./sound/hitBlock.mp3", 'hitBlock');//ballとブロック
  createjs.Sound.registerSound("./sound/bgmCool.mp3", 'bgm');
  createjs.Sound.registerSound("./sound/fanfare.mp3", 'fanfare');
  createjs.Sound.registerSound("./sound/itemGet.mp3", 'itemGet');
  createjs.Sound.registerSound("./sound/powpowpow.mp3", 'powpowpow');

  createjs.Sound.addEventListener("fileload", handleFileLoad);

  var sf = {}; //soundFilesの略
  function handleFileLoad(event){
      sf.ballHitPr = createjs.Sound.createInstance('ballHitPr');
      sf.kabe = createjs.Sound.createInstance('kabe');
      sf.destruction1 = createjs.Sound.createInstance('destruction1');
      sf.hitBlock = createjs.Sound.createInstance('hitBlock');
      sf.bgm = createjs.Sound.createInstance('bgm');
      sf.fanfare = createjs.Sound.createInstance('fanfare');
      sf.itemGet = createjs.Sound.createInstance('itemGet');
      sf.powpowpow = createjs.Sound.createInstance('powpowpow');

      //ボリューム調整
      sf.bgm.volume = 0.3;
      sf.kabe.volume = 0.6;
      sf.ballHitPr.volume = 0.6;
      sf.itemGet.volume = 0.3;
      sf.destruction1.volume = 0.1;
      sf.hitBlock.volume = 1;

      //サウンドが登録完了したらinit関数を実行
      init();
    }

  //------------------------------------------------------ブロックオブジェクト
  var bl = { //blocksの略
    map: [],
    //完成系は下記のような感じ
    // map: [
    //   [1, 1, 1, 1, 1, 1, 1, 1],
    //   [1, 1, 1, 1, 1, 1, 1, 1],
    //   [1, 1, 1, 1, 1, 1, 1, 1],
    //   [1, 1, 1, 1, 1, 1, 1, 1]
    // ],
    cols: 4,//行数
    rows: 8,//列数
    colorMap: [], //色情報を格納しておく
    height: 20,//ブロックの高さ
    BLOCK_MARGIN_TOP: 60, //ブロックと最上部との隙間の間隔
    width: null,
    // width: function() { //ブロックの幅を返すメソッド
    //   return ctx.canvas.width / this.map[0].length;
    // },
    initMap: function() {
      for (var i = 0; i < this.cols; i++) { //アイテムをランダムに配置
        this.map[i] = [];//配列内に配列を作成
        for (var j = 0; j < this.rows; j++) {
          var num = util.rand(4);//0から4の乱数を生成
          this.map[i][j] = num;//マップに数字を格納
        }
      }
      this.initblocksColor();//ブロックのカラーを初期化する
    },
    initblocksColor: function() {
      for (var i = 0; i < this.cols; i++) {//二次元配列をfor文で回す
        this.colorMap[i] = [];//配列を作成
        for (var j = 0; j < this.rows; j++) {
          var r = util.rand(255);//カラーの赤の成分をランダムに設定する。
          var g = util.rand(255);//カラーの緑の成分をランダムに設定する。
          var b = util.rand(255);//カラーの青の成分をランダムに設定する。
          this.colorMap[i][j] = [r, g, b];//配列に格納。
        }
      }
    }
  };
  bl.width = ctx.canvas.width / bl.rows;//canvas要素の幅をrow数で割ったものを幅として設定

  // ユーティリティオブジェクトに関数をまとめる
  var util = {
    //整数の乱数を生成する関数
    rand: function(x) {
      return Math.floor(Math.random() * x);
    },//0〜x−1までの整数を生成
    displayText: function(textObj, x, y) {
      // || の後ろにデフォルト値を設定
      var text = textObj.text;
      ctx.font = textObj.font || "14px 'ＭＳ Ｐゴシック'";
      ctx.textAlign = textObj.position || 'center';
      ctx.fillStyle = textObj.color || '#fff';//
      ctx.fillText(textObj.text, x, y);//テキストを描画
    },
    //四角を描画する関数
    drawRect: function(x, y, width, height, color) {//canvasに描画する処理をまとめたもの
      ctx.beginPath();//現在のパスをリセット
      ctx.fillStyle = color;//塗りつぶしの色を設定
      ctx.fillRect(x, y, width, height);//塗りつぶし四角形を描画
    },
    //ブロックを描画する関数
    blockDrow: function() {
      for (var i = 0; i < bl.cols; i++) {
        for (var j = 0; j < bl.rows; j++) {
          if (bl.map.length && bl.map[i][j]) {//map配列にデータがあれば and ブロックがあれば
            util.drawRect(//ブロックを描画
              bl.width * j,//x座標を指定
              bl.height * i + bl.BLOCK_MARGIN_TOP,//y座標を指定
              bl.width,//ブロックの幅
              bl.height,//ブロックの高さ
              'rgb(' + bl.colorMap[i][j][0] + ', ' + bl.colorMap[i][j][1] + ', ' + bl.colorMap[i][j][2] + ')'//ブロックの色を指定
            );
          }
        }
      }
    }
  }//utilオブジェクト終了


  //-----------------------------関数
  //初期化関数
  function init() {
    gs.isGameStarted = false; //ゲーム中のフラグを下す
    sf.bgm.stop(); //bgmを止める
    gs.frameCount = 0; //フレームカウントを初期化
    p.moveLeft = false; //移動フラグを下す
    p.moveRight = false; //移動フラグを下す
    p.workingItem = NO_ITEM; //効果中アイテムを初期化
    p.color = COLOR_BLUE; //自機の色を初期化
    //----------------------------------------ボールのプロパティを変更
    ba.speedY = -2.0; //移動速度
    ba.speedX = Math.sqrt(Math.pow(ba.speed, 2) - Math.pow(ba.speedY, 2));
    p.posX = ctx.canvas.width / 2 - p.width / 2;//自機の位置をcanvas要素の中央へ配置
    bl.initMap(); //ブロックを配置

    itemsAry = []; //アイテムをリセット
    p.itemTime = 0;//アイテム効果中の時間を初期化
    p.width = NORMAL_WIDTH;//自機の幅を指定
  }
  // init(); //実行し初期設定する

  function gameStart() {//ゲームをスタートさせる関数
    //ゲーム中orゲームクリアメッセージ表示中orゲームオーバーメッセージ表示中の場合、関数を実行させない
    if (gs.isGameStarted || gs.gameClearDisplayTime || gs.gameOverDisplayTime) return;
    gs.startTime = new Date();//ゲーム開始時間を格納
    if (!gs.isGameStarted) {//もしゲーム中でなければ
      gs.isGameStarted = true;//ゲーム中フラグを立てる
      gs.frameCount = 0;//フレーム数カウントをリセット
      p.moveLeft = false;//左移動フラグを下す
      p.moveRight = false;//右移動フラグを下す
      p.workingItem = NO_ITEM;//効果中のアイテムを消去
      p.color = COLOR_BLUE;//自機の色を戻す
      bl.initMap(); //ブロックを配置
      itemsAry = [];//アイテム格納配列を初期化
      p.itemTime = 0;//アイテム効果時間を初期化
      p.width = NORMAL_WIDTH;//自機の幅を初期化
      //----------------------------------------ボールのプロパティ
      ba.speedY = -(Math.random() * 2 + 3); //縦方向の速度初期化
      ba.speedX = Math.sqrt(Math.pow(ba.speed, 2) - Math.pow(ba.speedY, 2));//一旦x方向のスピードを決める
      if (Math.random() > 0.5) {
        ba.speedX = -ba.speedX;//速度のx方向成分をランダムに決定
      }
      //BGMスタート
      sf.bgm.play({loop:-1});//loopさせる
    }
  }

  //ゲーム中の時はゲームを終了、そうでない時はスタートする関数
  function startStop() {
    if (gs.isGameStarted) {//もしゲーム中であれば
      init();//ゲーム停止
    } else {//ゲーム中でなければ
      gameStart();//ゲームをスタートする
    }
  }



  function gameOver() { //ボールが最下部に来た際にゲームを終了させる関数
    ba.speedX = 0; //移動速度
    ba.speedY = 0; //移動速度
    sf.destruction1.stop(); //爆発音を鳴らす
    sf.destruction1.play(); //爆発音を鳴らす
    sf.bgm.stop(); //bgmを止める
    gs.isGameStarted = false; //ゲーム中フラグを下す
    itemsAry = []; //アイテム配列を初期化
    p.itemTime = 0; //アイテム効果中時間を初期化
    p.width = NORMAL_WIDTH; //自機の長さを戻す
    p.posX = ctx.canvas.width / 2 - p.width / 2; //X軸の位置
    p.workingItem = NO_ITEM; //効果適用中のアイテムをリセット
    p.color = COLOR_BLUE; //色を戻す
    gs.gameOverDisplayTime = 180; //10秒間game clearの文字を表示
    util.displayText({//画面に「game over」の文字を表示
      font: "40px 'ＭＳ Ｐゴシック'",
      color: "#0066bb",//色を紫に。
      text: "game over"//テキストを渡す
    }, canvas.width / 2, 250);//第二引数に表示位置を設定
  }

  function gameClearFunc() {
    if (gs.isGameStarted) { //もしゲーム中なら
      gs.isGameStarted = false; //ゲーム中のフラグを下す
      sf.bgm.stop(); //bgmを止める
      sf.fanfare.play(); //ファンファーレを鳴らす
      gs.gameClearDisplayTime = 600; //10秒間game clearの文字を表示
      if (!gs.bestTime || gs.countTime < gs.bestTime) { //もしbestTimeの登録がないorcountTimeがbestTimeより小さい場合…ベストタイムが出たら
        gs.bestTime = gs.countTime;//ベストタイムを更新
        localStorage.setItem('bestTime', gs.bestTime);//ローカルストレージにベストタイムを登録
      }
    }
  }





  function ballHitsBlocks() {
    var countBlock = 0; //現在のブロック個数をカウントする変数
    var hit = false; //当たったかどうかのフラグ
    for (var i = 0; i < bl.map.length; i++) {
      for (var j = 0; j < bl.map[i].length; j++) {
        if (bl.map[i][j]) {//もしブロックがあれば
          countBlock++; //現在のブロック個数をカウントアップ
          var ballTop = ba.posY - ba.radius;//ボール上部
          var ballBottom = ba.posY + ba.radius;//ボール下部
          var ballLeft = ba.posX - ba.radius;//ボールの左部
          var ballRight = ba.posX + ba.radius;//ボールの右部
         //
          var blockTop = (bl.height * i) + bl.BLOCK_MARGIN_TOP;//ブロック上辺
          var blockBottom = (bl.height * (i + 1)) + bl.BLOCK_MARGIN_TOP;//ブロック下辺
          var blockLeft = bl.width * j;//ブロック左辺
          var blockRight = bl.width * (j + 1);//ブロック右辺

          //ブロック下辺との当たり判定
          if (ballTop < blockBottom && //ボール最上部がブロックの位置より下にある
            ballTop > blockTop &&//ボールの最上部がブロックの底辺より上にある場合
            ba.speedY < 0) { //ボールが上に移動している場合
            if (blockLeft < ba.posX && ba.posX < blockRight) {//ブロック幅よりボール中心のx座標が内側にあるかどうか
              ba.speedY = -ba.speedY;//y方向のスピードを反転させる
              hit = true;//当たりフラグをtrueにする
            }
          }
          //ブロック上辺との当たり判定
          if (blockTop < ballBottom &&//ブロック上辺のy座標位置より、ballの最下部が下にある場合
            blockBottom > ballBottom &&//ブロック上辺のy座標位置より、ballの最下部が上ににある場合
            0 < ba.speedY) {//ボールが下向きに移動している場合
            if (blockLeft < ba.posX && ba.posX < blockRight) {//ブロック幅よりボール中心のx座標が内側にあるかどうか
              ba.speedY = -ba.speedY;//y方向のスピードを反転させる
              hit = true;//当たりフラグをtrueにする
            }
          }
          //ブロック左辺との当たり判定
          if (blockTop < ba.posY &&//ブロックの上辺よりボール中心のy座標がが下にあるかどうか
           ba.posY < blockBottom) {//ブロックの下辺よりボール中心のx座標が上にあるかどうか
            if (blockLeft < ballRight &&//ブロック左辺よりボールの右側が右にある場合
              blockRight > ballRight &&//ブロック右辺よりボールの右側が左にある場合
              ba.speedX > 0) {//ボールが右に動いている場合
              ba.speedX = -ba.speedX;//x方向のスピードを反転させる
              hit = true;
            }
          }
          // ブロック右辺との当たり判定
          if (blockTop < ba.posY &&//ボールの中心点が下にあるブロック上辺より下にある
            ba.posY < blockBottom) {//ボールの中心点がブロック下辺より上にある
            if (ballLeft < blockRight &&//ブロック右辺よりボール左部が左側にある
              ballLeft > blockLeft &&//ボール左部がブロック左辺より右側にある
              ba.speedX < 0) {//ボールが左に動いてる
              ba.speedX = -ba.speedX;//x方向のスピードを反転させる
              hit = true;
            }
          }
          if (hit) { //もし当たってたら音を鳴らす
            //アイテムを表示させる
            var posX = blockLeft + bl.width / 2;//アイテムを描画させるx座標の中心を設定
            var posY = bl.height * i + bl.height / 2 + bl.BLOCK_MARGIN_TOP;//アイテムを描画させるy座標の中心を設定
            if (bl.map[i][j] === BLOCK_WITH_GREEN_ITEM) { //2が入ってたらitemを降らせる
              itemsAry.push(new Item(posX, posY, 1, LOGO_GREEN_PATH, GREEN_ITEM));//itemsAry配列に緑のアイテムのインスタンスを格納
            } else if (bl.map[i][j] === BLOCK_WITH_PINK_ITEM) { //2が入ってたらitemを降らせる
              itemsAry.push(new Item(posX, posY, 2, LOGO_PINK_PATH, PINK_ITEM));//itemsAry配列にピンクのアイテムのインスタンスを格納
            }
            bl.map[i][j] = NO_BLOCK;//ブロックを非表示にする
            sf.hitBlock.stop();//
            sf.hitBlock.play();//ballとブロック
            hit = false;//フラグを下す
          }
        }
      }
    }
    if (!countBlock && gs.isGameStarted) { //現在のブロックが0個の場合
      gameClearFunc(); //ゲームクリア処理
    }
  }

  function ballHitsWalls() { //ボールが壁に当たった際に反射させる関数
    var ballTop = ba.posY - ba.radius;//ボール上部
    var ballBottom = ba.posY + ba.radius;//ボール下部
    var ballLeft = ba.posX - ba.radius;//ボールの左部
    var ballRight = ba.posX + ba.radius;//ボールの右部

    // 円を描画
    var hitWall = false;//壁に当たったかどうかのフラグ
    if (ballLeft <= 0 && ba.speedX < 0) {//ボールが左に移動しているandボールの左側が、左の壁に接触している場合
      ba.speedX = -ba.speedX;//ボールのx方向の速度を反転させる
      hitWall = true;//当たりフラグを立てる
    }
    if (ctx.canvas.width <= ballRight && ba.speedX > 0) {//ボールが右へ移動しているandボールの右側が右の壁に接触している場合
      ba.speedX = -ba.speedX;//ボールのx方向の速度を反転させる
      hitWall = true;//当たりフラグを立てる
    }
    if (ballTop <= 0) {//もしボールの上部が画面最上部に達していたら
      ba.speedY = -ba.speedY;//ボールのx方向の速度を反転させる
      hitWall = true;//当たりフラグを立てる
    }
    if (hitWall) {//もし壁にボールが当たってたら、サウンドを鳴らす
      sf.kabe.stop();
      sf.kabe.play();//ボールが壁に当たった
    }
  }

  function itemTimeCheck() { //アイテムの効力時間を監視する関数
    if (p.itemTime) { //アイテム効力中の場合
      p.itemTime--;//アイテム効果持続時間を1減らす
      if (p.itemTime === 0) { //アイテム効力が切れた場合
        //元に戻す処理を以下に記述
        p.width = NORMAL_WIDTH;//自機の幅を元に戻す
        if (p.workingItem === GREEN_ITEM) {//緑のアイテムが効果中であった場合
          p.posX += 20;//40px短くなるので、20px右にずらす
        } else if(p.workingItem === PINK_ITEM) {//ピンクのアイテムが効果中の場合
          p.posX -= 20;//40px長くなるので、20px左にずらす
        }
        p.workingItem = NO_ITEM;//効果中のアイテムを消去
        sf.powpowpow.stop(); //サウンドを鳴らす
        sf.powpowpow.play(); //サウンドを鳴らす
      }
    }
  }

  function itemMove() { //itemを動かすand自機との当たり判定
    if (itemsAry.length) {//itemsAryにアイテムが格納されている場合
      for (var i = 0; i < itemsAry.length; i++) {//itemsAry数をfor文で回す
        var it = itemsAry[i]; //コードを見易くするため、短い変数名へ代入
        var itemTop = it.y - it.radius;//アイテムの下部
        var itemBottom = it.y + it.radius;//アイテムの下部
        var itemLeft = it.x - it.radius;//アイテムの左部
        var itemRight = it.x + it.radius;//アイテムの右部
        if (it.alive) {//アイテムのaliveフラグが立っている場合
          it.move();//アイテムを動かす
          ctx.drawImage(//イメージを描画する
            it.logoImg,//描画する画像を渡す
            itemLeft,//イメージを描画するx座標のポイント
            itemTop,//イメージを描画するy座標のポイント
            it.diameter,//イメージの幅
            it.diameter//イメージの高さ
          );
          //自機とアイテムとの当たり判定
          if (p.posY < itemBottom && p.posY + p.height > itemTop) {//自機の上辺よりアイテムの下側が下にあるand自機の下辺よりアイテムの上側が上にある場合
            if (itemRight > p.posX && itemLeft < p.posX + p.width) {//自機の左辺よりアイテムの右側が右にあるand自機の右辺よりアイテムの左側が左にある場合
              //当たったとみなし、衝突時の処理を以下に記述
              it.alive = false;//アイテムのaliveフラフを下す
              p.itemTime = 300;//アイテム持続時間を300にする
              sf.itemGet.stop(); //
              sf.itemGet.play(); //アイテムを取ったら音を鳴らす
              if (it.type === GREEN_ITEM && p.workingItem !== GREEN_ITEM) {//緑のアイテムの場合and緑アイテムが効果中でない場合
                p.width = LONG_WIDTH;//自機の幅をロングにする
                if (!p.workingItem) {//アイテム効果中でない場合
                  p.posX -= 20;//自機の幅が40伸びるので、20左にずらす
                } else if (p.workingItem === PINK_ITEM) {//ピンクのアイテムが効果中の場合
                  p.posX -= 40;//自機の幅が80伸びるので、40左にずらす
                }
                p.workingItem = GREEN_ITEM;//緑のアイテムを効果中にする
              } else if (it.type === PINK_ITEM && p.workingItem !== PINK_ITEM) {//ピンクのアイテムの場合andピンクアイテムが効果中でない場合
                p.width = SHORT_WIDTH;//自機の幅をショートにする
                if (!p.workingItem) {//アイテム効果中でない場合
                  p.posX += 20;//自機の幅が40縮むので、20右ににずらす
                } else if (p.workingItem === GREEN_ITEM) {//緑のアイテムが効果中の場合
                  p.posX += 40;//自機の幅が80縮むので、40右にずらす
                }
                p.workingItem = PINK_ITEM;//ピンクのアイテムを効果中にする
              }
            }
          } else if (itemTop > ctx.canvas.height) { //画面外に出た場合、配列から削除する
            it.alive = false;//アイテムのaliveフラグを下ろし、画面から消去する
          }
        }
      }
    }
  }

  function ballHitsPlayer() { //自機とボールとの当たり判定関数
    var ballTop = ba.posY - ba.radius;//ボール上部
    var ballBottom = ba.posY + ba.radius;//ボール下部
    var ballLeft = ba.posX - ba.radius;//ボールの左部
    var ballRight = ba.posX + ba.radius;//ボールの右部

    var pTop = p.posY;//自機の上辺
    var pBottom = p.posY + p.height;//自機の下辺
    var pLeft = p.posX;//自機の左辺
    var pRight = p.posX + p.width;//自機の右辺


    var hit = false;//hit変数を初期化
    if (pTop < ballBottom &&//自機の上辺より
      pBottom > ballTop &&//自機の下辺よりボールの上側が上にある
      ba.speedY > 0) {//ボールが下向きに動いている
      if (ba.posX >= pLeft && ba.posX <= pRight) {//ボールの中心点が、自機の左辺より
        if (p.moveLeft) {//もしmoveLeftプロパティがtrueなら
         //  ba.speedX = ba.speedX - 1;
          ba.speedX -= 1;//ボールのx方向のスピードを左方向へ加速
        } else if (p.moveRight){
         //  ba.speedX = ba.speedX + 1;
          ba.speedX += 1;//ボールのx方向のスピードを右方向へ加速
        }
        if (ba.speedX >= 6) {//x方向のスピードが6を超えたら
          ba.speedX = 5.4;//x方向のスピードをmax5.4にする
        } else if (ba.speedX <= -6) {//x方向のスピードが-6を下回ったら
          ba.speedX = -5.4;//x方向のスピードをmax5.4にする
        }
        hit = true;//当たりフラグを立てる
      } else if (ba.posX < pLeft && ballRight > pLeft) {//自機の左角に当たっった場合
          ba.speedX = -5.4;//左方向へスピードを振り切る
          hit = true;
      } else if (ba.posX > pRight && ballLeft < pRight) {//自機の右角に当たった場合
          ba.speedX = 5.4;//左方向へスピードを振り切る
          hit = true;
      }
      if (hit) { //当たってたら
        ba.speedY = Math.sqrt(Math.pow(ba.speed, 2) - Math.pow(ba.speedX, 2));//スピードの絶対値が一定になるようy方向のスピードを決定
        ba.speedY = -ba.speedY;//y方向スピードを反転
        sf.ballHitPr.stop();
        sf.ballHitPr.play();//自機とボール
      }
    }
  }


  //----------------------------アニメーション関数。引数にコールバックを渡すと、その関数がリピートされる
  window.requestAnimFrame = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

  //-----------------------------------タイマー停止関数。今回は使用しない
  // function animationStop() {
  //   cancelAnimationFrame(_animationID);
  // }

  //テキストを描画する関数


  function keyDown(event) {//キーダウンイベントを設定
    switch (event.keyCode) {//eventのkeycodeプロパティで条件分岐
      case 37: // ←キー
      case 65: // Aキー
        p.moveLeft = true;//時期を左に動かすためのフラグをtrueにする
        break;
      case 39: // →キー
      case 68: // Dキー
        p.moveRight = true;//時期を右に動かすためのフラグをtrueにする
        break;
      case 13: // enterキー
      case 32: // spaceキー
        startStop();//スタートストップの関数を実行
        break;
      default:
        break;
    }
  }

  function keyUp(event) {
    switch (event.keyCode) {//eventのkeycodeプロパティで条件分岐
      case 37: // ←キー
      case 65: // Aキー
        p.moveLeft = false;//時期を左に動かすためのフラグをfalseにする
        break;
      case 39: // →キー
      case 68: // Dキー
        p.moveRight = false;//時期を右に動かすためのフラグをfalseにする
        break;
      default:
        break;
    }
  }


  // --------------------------------------------------------------------------------------------------ループ関数
  //この関数内でいろんな値をupdateさせて、アニメーションさせる
  function loop() {
    _animationID = requestAnimFrame(loop);//今回は使用しないが、一応タイマーIDを変数に格納しておく
    ctx.clearRect(0, 0, canvas.width, canvas.height); //canvasをクリア
    ctx.beginPath();//pathを初期化する
    // ctx.fillStyle = "#fff";//白色を設定
    ctx.fillStyle = "rgba(0,0,0,.5)";//白色を設定
    ctx.fillRect(0, 0, canvas.width, canvas.height); //canvas全面を塗り潰す
    //以下は分かりやすくするために変数を用意した
    var fromX = (canvas.width - bgImg.width) / 2;//「g」の画像を貼り付けるx座標を設定
    var fromY = (canvas.height - bgImg.height) / 2;//「g」の画像を貼り付けるy座標を設定
    var width = bgImg.width;//画像の幅を設定
    var height = bgImg.height;//画像の高さを設定
    // ctx.drawImage(bgImg, fromX, fromY, width, height);//用意した変数を渡して画像をcanvasへ貼り付け
    util.displayText({//テキストを描画する
      text: "スマホの場合は、左右に傾けて操作してね"//描画するテキストを文字列で渡す
    }, canvas.width / 2, (canvas.height - 20));//ポジションを指定する
    util.blockDrow(); //ブロックを描画

    //---------------------update
    if (gs.isGameStarted) {//もしゲーム中なら
      gs.countTime = Math.floor((new Date() - gs.startTime) / 1000);//現在の時間からゲームスタート時間を差し引いたものを経過時間としてcountTimeプロパティへ格納
    }

    if (gs.isGameStarted && !gs.gameClearDisplayTime && !gs.gameOverDisplayTime) {//ゲーム中 and gameClearを表示中でない and game overテキストを表示中でない場合
      gs.frameCount++;//フレーム数をインクリメント
      ba.move(); //ボールを移動させる
      itemTimeCheck(); //item効力時間チェック
      ballHitsWalls(); //ball壁反射
      ballHitsBlocks(); //ボールがブロックに当たった際の関数
      //ボールが最下部に到達してしまった場合にゲームを終了させる
      if (ba.posY > ctx.canvas.height) {//もしボールの中心位置が、canvasの底辺の位置まで来たら
        gameOver();//ゲームを終了する
      }
      itemMove(); //itemを動かすand自機との当たり判定
      ballHitsPlayer(); //ボールと自機との当たり判定
    } else { //ゲーム中でない時
      ba.posX = p.posX + p.width / 2;//ボールのx位置を、自機の中央へ
      ba.posY = p.posY - ba.radius;//ボールの下側が自機の上辺へ接触するように位置を指定
      if (!gs.gameClearDisplayTime && !gs.gameOverDisplayTime) {//gameClearを表示中でない and game overテキストを表示中でない場合
        util.displayText({//"click or enter!"のテキストを画面へ描画する
          font: "40px 'ＭＳ Ｐゴシック'",//フォント、文字サイズを指定
          color: "#0088dd",//文字色を姉弟
          text: "click or enter!"//表示テキストを指定
        }, canvas.width / 2, canvas.height / 2);//テキスト表示位置を指定
      }
    }

    p.move();
    p.changeColorFn(); //自機の色を変更

    //テキストを描画
    util.displayText({//"G's Academy ブロック崩し"の文字を画面上へ表示させる関数
      font: "20px 'ＭＳ Ｐゴシック'",//文字サイズとフォントスタイルを指定
      text: "G's Academy ブロック崩し"//表示させるテキスト
    }, canvas.width / 2, 20);//表示座標を指定
    util.displayText({//経過時間を表示させる
      position: 'left',//positionを指定
      text: 'TIME : ' + gs.countTime
    }, 20, 40);
    util.displayText({//ベストタイムを表示させる
      position: 'right',//positionを指定
      text: 'BESTTIME : ' + gs.bestTime//表示テキストを指定
    }, canvas.width - 20, 40);//表示座標を指定
    if (gs.gameClearDisplayTime) {//gameClearDisplayTimeが0以外の場合
      util.displayText({//gameclearテキストを表示させる処理を記述
        font: "50px 'ＭＳ Ｐゴシック'",
        color: 'rgb(' + util.rand(255) + ',' + util.rand(255) + ',' + util.rand(255) + ')',
        text: "game clear!!"
      }, canvas.width / 2, canvas.height / 2); //game clear!の文字を画面に表示
      gs.gameClearDisplayTime--;//gameClearDisplayTimeをデクリメントし、0になるまではgameclearを表示
    } else if (gs.gameOverDisplayTime) {//gameOverDisplayTimeが0以外の場合
      util.displayText({//gameOverテキストを表示させる処理を記述
        font: "40px 'ＭＳ Ｐゴシック'",
        color: "#772277",
        text: "game Over..."
      }, canvas.width / 2, canvas.height / 2); //game clear!の文字を画面に表示
      gs.gameOverDisplayTime--;//gameOverDisplayTimeをデクリメントし、0になるまではgameclearを表示
    }
    util.drawRect(p.posX, p.posY, p.width, p.height, p.color); //自機を描画する
    //理解しやすくする為に、変数を用意
    var ballX = ba.posX - ba.radius;//ボールを描画する為の基準x座標
    var ballY = ba.posY - ba.radius;//ボールを描画する為の基準y座標
    var ballW = ba.diameter;//ボール画像幅
    var ballH = ba.diameter;//ボール画像高さ
    ctx.drawImage(ba.imgPath, ballX, ballY, ballW, ballH); //ボールを描画
  }
  loop();//loop関数を再帰呼び出し



  //----------------------------------------イベントの設定
  document.addEventListener('keydown', keyDown, true); //キーを押した時、呼び出される関数を指定
  document.addEventListener('keyup', keyUp, true); //キーを離した時、呼び出される関数を指定
  canvas.addEventListener('click', startStop, true);//canvas要素をクリックした際に、startStop関数が実行されるようにする。

  window.ondeviceorientation = function(event) { // deviceorientationイベントで、デバイスの回転を継続的に取得
    // 回転軸
    // var alpha = event.alpha; // z-axis
    // var beta = event.beta; // x-axis
    var gamma = event.gamma; // y-axis
    if (gamma < -5) {//gammaの値が−5以下になった際に
      p.moveLeft = true;//自機を左に動かす
    } else if(gamma > 5){//gammaの値が5以上になった際に
      p.moveRight = true;//自機を右に動かす
    }else{
      p.moveLeft = false;//gammaの値が−5〜5の場合は
      p.moveRight = false;//自機を停止させる
    }
  };

  document.addEventListener('DOMContentLoaded', function() {//DOM要素の読み込み準備ができたら
    //----------------------------------------bestTimeをlocalstrageから読み込み
    gs.bestTime = localStorage.getItem('bestTime');//gsオブジェクトの.bestTimeプロパティへ、ローカルストレージに保存されているbestTimeの値を格納
    if (!gs.bestTime) {//もしbestTimeがなければ
      gs.bestTime = '';//空の文字列を格納する
    }
  });



})();
