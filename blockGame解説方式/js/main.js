(function() {
  'use strict';

  // Canvas未サポートは実行しない
  if (!window.HTMLCanvasElement) return;

  //----------------------------------------------------------------------定数
  var LOGO_BLUE_PATH = "./images/gsacLogoBlue50x50.png";
  var LOGO_GREEN_PATH = "./images/gsacLogoGreen50x50.png";
  var LOGO_PINK_PATH = "./images/gsacLogoPink50x50.png";
  var BG_IMG_PATH = "./images/gsacademylogo.jpg";

  //----------------------------------------------------------------------変数
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  //初期設定部分。ここで使用する変数や関数、イベントなどを定義しておく。
  var _animationID; //タイマーID

  //----------------------------------------ゲームステータスオブジェクト
  var gs = {//gameStatusの略でgs
    frameCount: 0,//アニメーションフレームのカウンター
    isGameStarted: false,//ゲーム中かどうかのフラグ
    startTime: 0,//ゲームをスタートした時点の現在の日時ミリ秒
    countTime: 0,//ゲームをスタートしてから経過した秒数
    bestTime: null,//今までの最短時間
    gameClearDisplayTime: 0//ゲームをクリアした際に画面上に「ゲームクリア」の文字を表示させる時間
  };

  //----------------------------------------ballオブジェクト
  var ba = {//ballArcの略
    speed: 6,//ボールのスピード
    speedX: 0,//ボールのx方向のスピード
    speedY: 0,//ボールのy方向のスピード
    posX: 0,//ボールのx座標
    posY: 0,//ボールのy座標
    width: 25,//ボール画像の幅
    height: 25,//ボール画像の高さ
    imgPath: (function(){
      var image = new Image();
      image.src = LOGO_BLUE_PATH;
      return image;
    })(),
    move: function(){//ballを動かすメソッド
      this.posX += this.speedX;
      this.posY += this.speedY;
    }
  };

  //----------------------------------------自機オブジェクト
  var pr = {//playerRectの略
    speedX: 8, //移動速度
    SpeedY: 0, //移動速度
    posX: 0, //X軸の位置
    posY: ctx.canvas.height - 60,
    width: 100,//自機の幅
    height: 10,//自機の高さ
    moveLeft: false, //自機を左へ動かすフラグ
    moveRight: false, //自機を右へ動かすフラグ
    color: "#44f",//自機の色
    itemTime: 0,//itemの効力の残り時間
    workingItem: 0,//今効いているアイテムのタイプ
    changeColorFn: function (){//色をかえるメソッド
      if (this.workingItem === 2) {
        this.color = "#294";
      } else if (this.workingItem === 3){
        this.color = "#f48";
      } else {
        this.color = "#44f";
      }
    },
    move: function(){//自機の変数の値を変化させるメソッド
      if (this.moveLeft) { //もし左キーが押されていたら
        this.posX -= this.speedX;//x座標をspeedX分減算
      }
      if (this.moveRight) { //もし右キーが押されていたら
        this.posX += this.speedX;//x座標をspeedX分足す
      }
      if (this.posX < 0) {//自機が左端なら
        this.posX = 0;//自機のx座標を0に戻す
      } else if ((this.posX + this.width) - ctx.canvas.width > 0) {//自機が右端以上なら
        this.posX = ctx.canvas.width - this.width;//右端に戻す
      }
    }
  };

  var itemsAry = []; //アイテムを格納する配列

  //背景画像素材オブジェクト
  var bgImg = {
    img: new Image(),
    width: 510,
    height: 510,
  };
  bgImg.img.src = BG_IMG_PATH;

  //------------------------------------------------------------soundオブジェクト
  var sf = {//soundFilesの略
    select06: document.getElementById('select06'),
    button04a: document.getElementById('button04a'),
    destruction1: document.getElementById('destruction1'),
    button05: document.getElementById('button05'),
    bgm: document.getElementById('bgm'),
    fanfare: document.getElementById('fanfare'),
    itemGet: document.getElementById('itemGet'),
    powpowpow: document.getElementById('powpowpow'),
    play: function(soundElem){//音を再生するメソッド
      soundElem.pause();
      soundElem.currentTime = 0;
      soundElem.play();
    },
    stop: function(soundElem){//音を停止するメソッド
      soundElem.pause();
      soundElem.currentTime = 0;
    }
  };

  //------------------------------------------------------ブロックオブジェクト
  var br = {//blocksRectの略
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ],
    colorMap: [],//色情報を格納しておく
    height: 20,
    BLOCK_MARGIN_TOP: 60,//ブロックと最上部との隙間の間隔
    width: function() {//ブロックの幅を返すメソッド
      return ctx.canvas.width / this.map[0].length;
    },
    initMap: function (){
      for(var i = 0; i < this.map.length; i++){//アイテムをランダムに配置
        for(var j = 0; j < this.map[i].length; j++){
          var num = Math.floor( Math.random() * 4 );
          this.map[i][j] = num;
        }
      }
      this.initblocksColor();
    },
    initblocksColor: function() {
      for (var i = 0; i < this.map.length; i++) {
        this.colorMap[i] = [];
        for (var j = 0; j < this.map[i].length; j++) {
          var r = Math.floor(Math.random() * 255);
          var g = Math.floor(Math.random() * 255);
          var b = Math.floor(Math.random() * 255);
          this.colorMap[i][j] = [r, g, b];
        }
      }
    }
  };

  //-----------------------------関数
  function init() {
    gs.isGameStarted = false; //ゲーム中のフラグを下す
    sf.stop(sf.bgm);//bgmを止める
    gs.frameCount = 0;//フレームカウントを初期化
    pr.moveLeft = false;//移動フラグを下す
    pr.moveRight = false;//移動フラグを下す
    pr.workingItem = 0;//効果中アイテムを初期化
    pr.color = "#44f";//自機の色を初期化
    //----------------------------------------ボールのプロパティを変更
    ba.speedY = -2.0; //移動速度
    ba.speedX = Math.sqrt(Math.pow(ba.speed, 2) - Math.pow(ba.speedY, 2));
    //----------------------------------------自機の位置を中心に戻す
    pr.posX = ctx.canvas.width / 2 - pr.width / 2;
    br.initMap();//ブロックを配置

    itemsAry = [];
    pr.itemTime = 0;
    pr.width = 100;
  }
  init();//実行し初期設定する

  function startStop(){//ゲーム中の時はゲームを終了、そうでない時はスタートする関数
    if(!gs.isGameStarted){
      gameStart();
    }else{
      init();
    }
  }
  //初期化関数
  function gameStart() {
    if(gs.isGameStarted) return;
    gs.startTime = new Date();
    if (!gs.isGameStarted) {
      gs.isGameStarted = true;
      gs.frameCount = 0;
      pr.moveLeft = false;
      pr.moveRight = false;
      pr.workingItem = 0;
      pr.color = "#44f";
      br.initMap();//ブロックを配置
      itemsAry = [];
      pr.itemTime = 0;
      pr.width = 100;
      //----------------------------------------ボールのプロパティ
      ba.speedY = -(Math.random() * 2 + 3); //移動速度
      ba.speedX = Math.sqrt(Math.pow(ba.speed, 2) - Math.pow(ba.speedY, 2));
      if (Math.random() > 0.5) {
        ba.speedX = -ba.speedX;
      }
      //BGMスタート
      sf.play(sf.bgm);
    }
  }

  function gameClearFunc() {
    if (gs.isGameStarted) {//もしゲーム中なら
      gs.isGameStarted = false; //ゲーム中のフラグを下す
      sf.stop(sf.bgm);//bgmを止める
      sf.play(sf.fanfare);//ファンファーレを鳴らす
      gs.gameClearDisplayTime = 600; //10秒間game clearの文字を表示
      if (!gs.bestTime || gs.countTime < gs.bestTime) {//もしbestTimeの登録がないorcountTimeがbestTimeより小さい場合
        gs.bestTime = gs.countTime;
        localStorage.setItem('bestTime', gs.bestTime);
      }
    }
  }
  //四角を描画する関数
  function drawRect(x, y, width, height, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.fill();
  }
  //ブロックを描画する関数
  function blockDrow() {
    for (var i = 0; i < br.map.length; i++) {
      for (var j = 0; j < br.map[i].length; j++) {
        if (br.map[i][j]) {
          drawRect(
            br.width() * j, br.height * i + br.BLOCK_MARGIN_TOP,
            br.width(),
            br.height,
            'rgb(' + br.colorMap[i][j][0] + ', ' + br.colorMap[i][j][1] + ', ' + br.colorMap[i][j][2] + ')'
          );
        }
      }
    }
  }

  //ballとブロックとの当たり判定関数
  function ballHitsBlocks() {
    var countBlock = 0; //現在のブロック個数をカウントする変数
    for (var i = 0; i < br.map.length; i++) {
      for (var j = 0; j < br.map[i].length; j++) {
        if (br.map[i][j]) {
          countBlock++; //現在のブロック個数をカウントアップ
          var hit = false; //当たったかどうかのフラグ
          //下辺との当たり判定
          if ((ba.posY - ba.height / 2) - (br.height * (i + 1) + br.BLOCK_MARGIN_TOP) < 0 && //ボールがブロックの位置より下にある
            (ba.posY - ba.height / 2) - (br.height * i + br.BLOCK_MARGIN_TOP) > 0 &&
            ba.speedY < 0) {//ボールが上に移動している場合
            if (br.width() * j < ba.posX && ba.posX < br.width() * (j + 1)) {
              ba.speedY = -ba.speedY;
              hit = true;
            }
          }
          //上辺との当たり判定
          if (((br.height * i) + br.BLOCK_MARGIN_TOP) - (ba.posY + ba.height / 2) < 0 &&
            (br.height * (i + 1) + br.BLOCK_MARGIN_TOP) - (ba.posY + ba.height / 2) > 0 &&
            0 < ba.speedY) {
            if ((br.width() * j) - ba.posX < 0 && ba.posX -(br.width() * (j + 1)) < 0) {
              ba.speedY = -ba.speedY;
              hit = true;
            }
          }
          //左辺との当たり判定
          if ((br.height * i) + br.BLOCK_MARGIN_TOP < ba.posY && ba.posY < br.height * i + br.height + br.BLOCK_MARGIN_TOP) {
            if ((br.width() * j) - ba.posX < ba.width / 2 &&
              br.width() * (j + 1) - ba.posX > ba.width / 2 &&
              ba.speedX > 0) {
              ba.speedX = -ba.speedX;
              hit = true;
            }
          }
          // //右辺との当たり判定
          if ((br.height * i) + br.BLOCK_MARGIN_TOP < ba.posY && ba.posY < br.height * (i + 1) + br.BLOCK_MARGIN_TOP) {
            if (ba.posX - br.width() * (j + 1) < ba.width / 2 &&
              ba.posX - br.width() * j > ba.width / 2 &&
              ba.speedX < 0) {
              ba.speedX = -ba.speedX;
              hit = true;
            }
          }
          if (hit) { //もし当たってたら音を鳴らす
            if (br.map[i][j] === 2) { //2が入ってたらitemを降らせる
              var width = br.width() * j + br.width() / 2;
              var height = br.height * i + br.height / 2 + br.BLOCK_MARGIN_TOP;
              itemsAry.push(new Item(width, height, 1, LOGO_GREEN_PATH, 2));
            }else if (br.map[i][j] === 3) { //2が入ってたらitemを降らせる
              var width = br.width() * j + br.width() / 2;
              var height = br.height * i + br.height / 2 + br.BLOCK_MARGIN_TOP;
              itemsAry.push(new Item(width, height, 2, LOGO_PINK_PATH, 3));
            }
            br.map[i][j] = 0;
            sf.play(sf.button05);
            hit = false;
          }
        }
      }
    }
    if (!countBlock && gs.isGameStarted) { //現在のブロックが0個の場合
      gameClearFunc();//ゲームクリア処理
    }
  }

  //アニメーション関数
  window.requestAnimFrame = (function() {
    return
     window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();
  var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

  // function animationStop() {
  //   cancelAnimationFrame(_animationID);
  // }

  //テキストを描画する関数

  function displayText(textObj, x, y ){
    var text = textObj.text || "";
    ctx.font = textObj.font || "";
    ctx.textAlign = textObj.position || 'center';
    ctx.fillStyle = textObj.color || '#000';
    ctx.fillText(textObj.text, x, y);
  }
  // function displayText(font, position, color, text, x, y ){
  //   ctx.font = font;
  //   ctx.textAlign = position;
  //   ctx.fillStyle = color;
  //   ctx.fillText(text, x, y);
  // }

  function ballHitsWalls(){//ボールが壁に当たった際に反射させる関数
    // 円を描画
    var hitWall = false;
    if (ba.posX < ba.width / 2 && ba.speedX < 0) {
      ba.speedX = -ba.speedX;
      hitWall = true;
    }
    if (ctx.canvas.width - ba.posX < ba.width / 2 && ba.speedX > 0) {
      ba.speedX = -ba.speedX;
      hitWall = true;
    }
    if (ba.posY < ba.height / 5) {
      ba.speedY = -ba.speedY;
      hitWall = true;
    }
    if (hitWall) {
      sf.play(sf.button04a);
    }
  }

  function itemTimeCheck(){//アイテムの効力時間を監視する関数
    if (pr.itemTime) { //アイテム効力中の場合
      pr.itemTime--;
      if (pr.itemTime === 0) {//アイテム効力が切れた場合
        //元に戻す
        pr.width = 100;
        if( pr.workingItem === 2 ){
          pr.posX += 20;
        } else if( pr.workingItem === 3){
          pr.posX -= 20;
        }
        pr.workingItem = 0;
        sf.play(sf.powpowpow);//サウンドを鳴らす
      }
    }
  }

  function gameOver(){//ボールが最下部に来た際にゲームを終了させる関数
    ba.speedX = 0; //移動速度
    ba.speedY = 0; //移動速度
    sf.play(sf.destruction1);//爆発音を鳴らす
    sf.stop(sf.bgm);//bgmを止める
    gs.isGameStarted = false;//ゲーム中フラグを下す
    itemsAry = [];//アイテム配列を初期化
    pr.itemTime = 0;//アイテム効果中時間を初期化
    pr.width = 100;//自機の長さを戻す
    pr.posX = ctx.canvas.width / 2 - pr.width / 2; //X軸の位置
    pr.workingItem = 0; //
    pr.color = "#44f"; //
    var textOjb = {
      font: "40px 'ＭＳ Ｐゴシック'",
      position: "center",
      color: "#0066bb",
      text: "game over"
    };
    displayText( textOjb, canvas.width / 2, 250);
    // displayText( "40px 'ＭＳ Ｐゴシック'", "center", "#0066bb", "game over", canvas.width / 2, 250);
  }
  function itemMove(){//itemを動かすand自機との当たり判定
    if (itemsAry.length) {
      for (var i = 0; i < itemsAry.length; i++) {
        if (itemsAry[i].alive) {
          itemsAry[i].move();
          ctx.drawImage(itemsAry[i].logoImg, itemsAry[i].x-itemsAry[i].logoImgWidth/2 , itemsAry[i].y-itemsAry[i].logoImgHeight/2 , itemsAry[i].logoImgWidth, itemsAry[i].logoImgHeight);
          //自機とアイテムとの当たり判定
          if (pr.posY - (itemsAry[i].y + 25 / 2) < 0 &&
            (pr.posY + pr.height) - (itemsAry[i].y - 25 / 2) > 0) {
            if (itemsAry[i].x + 25 / 2 > pr.posX && itemsAry[i].x - 25 / 2 < (pr.posX + pr.width)) {
              itemsAry[i].alive = false;
              if(itemsAry[i].type === 2){
                if ( pr.workingItem !== 2 ) {
                  pr.itemTime = 300;
                  pr.width = 140;
                  if(!pr.workingItem){
                    pr.posX -= 20;
                  } else if(pr.workingItem === 3){
                    pr.posX -= 40;
                  }
                  pr.workingItem = 2;
                } else if (pr.workingItem === 2){
                  pr.itemTime = 300;
                }
                sf.play(sf.itemGet);//アイテムを取ったら音を鳴らす
              }else if(itemsAry[i].type === 3){
                if ( pr.workingItem !== 3) {
                  pr.itemTime = 300;
                  pr.width = 60;
                  // pr.posX += 20;
                  if(!pr.workingItem){
                    pr.posX += 20;
                  } else if(pr.workingItem === 2){
                    pr.posX += 40;
                  }
                  pr.workingItem = 3;
                } else if (pr.workingItem === 3){
                  pr.itemTime = 300;
                }
                sf.play(sf.itemGet);
              }
            }
          } else if (itemsAry[i].y > ctx.canvas.height + 25 / 2) { //画面外に出た場合、配列から削除する
            itemsAry[i].alive = false;
          }
        }
      }
    }
  }

  function ballHitsPlayer(){//自機とボールとの当たり判定関数
    var hit = false;
    if (pr.posY - (ba.posY + ba.height / 2) < 0 &&
      (pr.posY + pr.height) - (ba.posY - ba.height / 2) > 0 &&
      ba.speedY > 0) {
      if (ba.posX >= pr.posX && ba.posX <= (pr.posX + pr.width)) {
        if (pr.moveLeft) {
          ba.speedX = ba.speedX - 1;
        } else if (pr.moveRight) {
          ba.speedX = ba.speedX + 1;
        }
        if (ba.speedX >= 6) {
          ba.speedX = 5.4;
        } else if (ba.speedX <= -6) {
          ba.speedX = -5.4;
        }
        hit = true;
      } else if (ba.posX < pr.posX) {
        if (ba.posX + ba.width / 2 > pr.posX) {
          ba.speedX = -5.4;
          hit = true;
        }
      } else if (ba.posX > (pr.posX + pr.width)) {
        if (ba.posX - ba.width / 2 < (pr.posX + pr.width)) {
          ba.speedX = 5.4;
          hit = true;
        }
      }
      if (hit) { //当たってたら
        ba.speedY = Math.sqrt(Math.pow(ba.speed, 2) - Math.pow(ba.speedX, 2));
        ba.speedY = -ba.speedY;
        sf.play(sf.select06);
      }
    }
  }

  function KeyDown(e) {
    switch (e.keyCode) {
      case 37: // ←キー
      case 65: // Aキー
        pr.moveLeft = true;
        break;
      case 39: // →キー
      case 68: // Dキー
        pr.moveRight = true;
        break;
      case 13: // enterキー
      case 32: // spaceキー
        startStop();
        break;
      default:
        break;
    }
  }

  function KeyUp(e) {
    switch (e.keyCode) {
      case 37: // ←キー
      case 65: // Aキー
        pr.moveLeft = false;
        break;
      case 39: // →キー
      case 68: // Dキー
        pr.moveRight = false;
        break;
      default:
        break;
    }
  }

  //----------------------------------------イベントの設定
  window.addEventListener('keydown', KeyDown, true); //キーを押した時、呼び出される関数を指定
  window.addEventListener('keyup', KeyUp, true); //キーを離した時、呼び出される関数を指定
  canvas.addEventListener('click', startStop, true);

  window.ondeviceorientation = function(event) {  // deviceorientationイベントで、デバイスの回転を継続的に取得
    // 回転軸
    // var alpha = event.alpha; // z-axis
    // var beta = event.beta; // x-axis
    var gamma = event.gamma; // y-axis
    if (gamma < -5) {
      pr.moveLeft = true;
    } else if (gamma > 5) {
      pr.moveRight = true;
    } else {
      pr.moveLeft = false;
      pr.moveRight = false;
    }
  };

  window.onload = function(){
    //----------------------------------------bestTimeをlocalstrageから読み込み
    if (localStorage.getItem('bestTime')) {
      gs.bestTime = localStorage.getItem('bestTime');
    } else {
      gs.bestTime = '';
    }
  };

  // -----------------------------------------------------------ループ関数
  //この関数内でいろんな値をupdateさせて、アニメーションさせる
  function loop() {
    _animationID = requestAnimFrame(loop);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); //canvasをクリア
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); //canvasを白く塗る
    ctx.drawImage(bgImg.img, (ctx.canvas.width - bgImg.width) / 2, (ctx.canvas.height - bgImg.height) / 2, bgImg.width, bgImg.height);
    blockDrow(); //ブロックを描画

    //---------------------update
    if(gs.isGameStarted){
      gs.countTime = Math.floor( ( new Date() - gs.startTime) / 1000 );
    }

    if (gs.isGameStarted && !gs.gameClearDisplayTime) {
      gs.frameCount++;
      ba.move();//ボールを移動させる
      itemTimeCheck();//item効力時間チェック
      ballHitsWalls();//ball壁反射
      ballHitsBlocks();//ボールがブロックに当たった際の関数
      //ボールが最下部に到達してしまった場合にゲームを終了させる
      if (ba.posY > ctx.canvas.height) {
        gameOver();
      }
      itemMove();//itemを動かすand自機との当たり判定
      ballHitsPlayer();//ボールと自機との当たり判定
    } else { //ゲーム中でない時
      ba.posX = pr.posX + pr.width / 2;
      ba.posY = pr.posY - ba.height / 2;
      if (!gs.gameClearDisplayTime) {
        displayText( "40px 'ＭＳ Ｐゴシック'", "center", "#0066bb", "click or enter!", canvas.width / 2, canvas.height / 2 );
      }
    }

    pr.move();
    pr.changeColorFn();//自機の色を変更

    //テキストを描画
    displayText( "20px 'ＭＳ Ｐゴシック'", "center", "#000", "G's Academy ブロック崩し", canvas.width/2, 20 );
    displayText( "14px 'ＭＳ Ｐゴシック'", "left", "#000", 'TIME : ' + gs.countTime, 20, 40 );
    displayText( "14px 'ＭＳ Ｐゴシック'", "right", "#000", 'BESTTIME : ' + gs.bestTime, canvas.width - 20, 40 );
    displayText( "14px 'ＭＳ Ｐゴシック'", "center", "#000", "スマホを左右に傾けて操作してね", canvas.width / 2, (canvas.height - 20) );
    if (gs.gameClearDisplayTime) {
      displayText( "40px 'ＭＳ Ｐゴシック'", "center", "#CC66bb", "game clear!!", canvas.width / 2, canvas.height / 2);//game clear!の文字を画面に表示
      gs.gameClearDisplayTime--;
    }
    drawRect(pr.posX, pr.posY, pr.width, pr.height, pr.color); //自機を描画する
    ctx.drawImage(ba.imgPath, ba.posX - (ba.width / 2), ba.posY - (ba.height / 2), ba.width, ba.height);//ボールを描画

  }
  loop();

})();
