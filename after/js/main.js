(function() {
  'use strict';

  // Canvas未サポートは実行しない
  if (!window.HTMLCanvasElement) return;

  //----------------------------------------------------------------------定数
  var LOGO_BLUE_PATH = "./images/gsacLogoBlue50x50.png";
  var LOGO_GREEN_PATH = "./images/gsacLogoGreen50x50.png";
  var LOGO_PINK_PATH = "./images/gsacLogoPink50x50.png";
  var BG_IMG_PATH = "./images/gsacademylogo.jpg";
  //ブロック
  var BLOCK_MARGIN_TOP = 60;//ブロックと最上部との隙間の間隔

  //----------------------------------------------------------------------変数
  var canvas = document.querySelector('#canvas');
  var ctx = canvas.getContext('2d');

  //初期設定部分。ここで使用する変数や関数、イベントなどを定義しておく。
  var _animationID; //タイマーID

  //----------------------------------------ゲームステータスオブジェクト
  var gameStatusObj = {
    frameCount: 0,//アニメーションフレームのカウンター
    isGameStarted: false,//ゲーム中かどうかのフラグ
    startTime: 0,//ゲームをスタートした時点の現在の日時ミリ秒
    countTime: 0,//ゲームをスタートしてから経過した秒数
    bestTime: null,//今までの最短時間
    gameClearDisplayTime: 0//ゲームをクリアした際に画面上に「ゲームクリア」の文字を表示させる時間
  };

  //----------------------------------------ballオブジェクト
  var ballObj = {
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
    })()
  };

  //----------------------------------------自機オブジェクト
  var playerRect = {
    speedX: 0, //移動速度
    SpeedY: 0, //移動速度
    posX: 0, //X軸の位置
    posY: 0, //y軸の位置
    width: 100,
    height: 10,
    moveLeft: false, //自機を動かす
    moveRight: false, //自機を動かす
    color: "#44f",//
    itemTime: 0,
    workingItem: 0,
    changeColorFn: function (){
      if (this.workingItem === 2) {
        this.color = "#294";
      } else if (this.workingItem === 3){
        this.color = "#f48";
      } else {
        this.color = "#44f";
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
  var soundObj = {
    select06: document.querySelector('#select06'),
    button04a: document.querySelector('#button04a'),
    destruction1: document.querySelector('#destruction1'),
    button05: document.querySelector('#button05'),
    bgm: document.querySelector('#bgm'),
    fanfare: document.querySelector('#fanfare'),
    itemGet: document.querySelector('#itemGet'),
    powpowpow: document.querySelector('#powpowpow'),
    play: function(soundElem){
      soundElem.pause();
      soundElem.currentTime = 0;
      soundElem.play();
    },
    stop: function(soundElem){
      soundElem.pause();
      soundElem.currentTime = 0;
    }
  };

  //------------------------------------------------------ブロックオブジェクト
  var blocksObj = {
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ],
    colorMap: [],//色情報を格納しておく
    height: 20,
    width: function() {
      return ctx.canvas.width / this.map[0].length;
    },
    width2: function() {
      console.log(this);
      return ctx.canvas.width / this.map[0].length;
    },
    test: (function(){
      console.log(this);
    })()
  };

  //--------------------------------------------ブロックの色を格納する配列
  function initblocksColor() {
    var r = [];
    var g = [];
    var b = [];
    for (var i = 0; i < blocksObj.map.length; i++) {
      r[i] = [];
      g[i] = [];
      b[i] = [];
      for (var j = 0; j < blocksObj.map[i].length; j++) {
        r[i][j] = Math.floor(Math.random() * 255);
        g[i][j] = Math.floor(Math.random() * 255);
        b[i][j] = Math.floor(Math.random() * 255);
      }
    }
    blocksObj.colorMap[0] = r;
    blocksObj.colorMap[1] = g;
    blocksObj.colorMap[2] = b;
  }
  initblocksColor();




  //----------------------------------------イベントの設定
  window.addEventListener('keydown', KeyDown, true); //キーを押した時、呼び出される関数を指定
  window.addEventListener('keyup', KeyUp, true); //キーを離した時、呼び出される関数を指定
  document.querySelector('canvas').addEventListener('click', gameStartFunc, true);
  //canvasをclickすると、loop関数がスタートする

  //----------------------------------イベント関数
  function KeyDown(e) {
    switch (e.keyCode) {
      case 37: // ←キー
        playerRect.moveLeft = true;
        break;
      case 39: // →キー
        playerRect.moveRight = true;
        break;
      case 65: // Aキー
        playerRect.moveLeft = true;
        break;
      case 68: // Dキー
        playerRect.moveRight = true;
        break;
      case 13: // enterキー
        // if (gameStatusObj.isGameStarted) return;
        gameStartFunc();
        break;
      case 32: // spaceキー
        // if (gameStatusObj.isGameStarted) break;
        gameStartFunc();
        break;
      default:
        break;
    }
  }

  function KeyUp(e) {
    switch (e.keyCode) {
      case 37: // ←キー
        playerRect.moveLeft = false;
        break;
      case 39: // →キー
        playerRect.moveRight = false;
        break;
      case 65: // Aキー
        playerRect.moveLeft = false;
        break;
      case 68: // Dキー
        playerRect.moveRight = false;
        break;
      default:
        break;
    }
  }

  // deviceorientationイベントで、デバイスの回転を継続的に取得できます。
  window.ondeviceorientation = function(event) {
    // 回転軸
    // var alpha = event.alpha; // z-axis
    // var beta = event.beta; // x-axis
    var gamma = event.gamma; // y-axis
    if (gamma < -5) {
      playerRect.moveLeft = true;
    } else if (gamma > 5) {
      playerRect.moveRight = true;
    } else {
      playerRect.moveLeft = false;
      playerRect.moveRight = false;
    }
  };

  //-----------------------------関数
  function init() {
    // gameStatusObj.bestTime = localStorage.getItem();
    //----------------------------------------bestTimeをlocalstrageから読み込み
    if (localStorage.getItem('bestTime')) {
      gameStatusObj.bestTime = localStorage.getItem('bestTime');
    } else {
      gameStatusObj.bestTime = null;
    }

    //----------------------------------------ボールのプロパティを変更
    ballObj.speedY = -4.0; //移動速度
    ballObj.speedX = Math.sqrt(Math.pow(ballObj.speed, 2) - Math.pow(ballObj.speedY, 2));

    //----------------------------------------自機のプロパティを変更
    playerRect.speedX = 8; //移動速度
    playerRect.posX = ctx.canvas.width / 2 - playerRect.width / 2;
    playerRect.posY = ctx.canvas.height - 60;
  }
  init();//実行し初期設定する

  //ブロックを描画する関数
  function blockDrow() {
    for (var i = 0; i < blocksObj.map.length; i++) {
      for (var j = 0; j < blocksObj.map[i].length; j++) {
        if (blocksObj.map[i][j]) {
          ctx.beginPath();
          ctx.rect(blocksObj.width() * j, blocksObj.height * i + BLOCK_MARGIN_TOP, blocksObj.width(), blocksObj.height);
          ctx.fillStyle = 'rgb(' + blocksObj.colorMap[0][i][j] + ', ' + blocksObj.colorMap[1][i][j] + ', ' + blocksObj.colorMap[2][i][j] + ')'; //色をランダムに設定
          ctx.fill();
        }
      }
    }
  }

  //ballとブロックとの当たり判定関数
  function ballHitsBlocks() {
    var countBlock = 0; //現在のブロック個数をカウントする変数
    for (var i = 0; i < blocksObj.map.length; i++) {
      for (var j = 0; j < blocksObj.map[i].length; j++) {
        if (blocksObj.map[i][j]) {
          countBlock++; //現在のブロック個数をカウントアップ
          var hit = false; //当たったかどうかのフラグ
          //下辺との当たり判定
          if ((ballObj.posY - ballObj.height / 2) - (blocksObj.height * (i + 1) + BLOCK_MARGIN_TOP) < 0 && //ボールがブロックの位置より下にある
            (ballObj.posY - ballObj.height / 2) - (blocksObj.height * i + BLOCK_MARGIN_TOP) > 0 &&
            ballObj.speedY < 0) {//ボールが上に移動している場合
            if (blocksObj.width() * j < ballObj.posX && ballObj.posX < blocksObj.width() * (j + 1)) {
              ballObj.speedY = -ballObj.speedY;
              hit = true;
            }
          }
          //上辺との当たり判定
          if (((blocksObj.height * i) + BLOCK_MARGIN_TOP) - (ballObj.posY + ballObj.height / 2) < 0 &&
            (blocksObj.height * (i + 1) + BLOCK_MARGIN_TOP) - (ballObj.posY + ballObj.height / 2) > 0 &&
            0 < ballObj.speedY) {
            if ((blocksObj.width() * j) - ballObj.posX < 0 && ballObj.posX -(blocksObj.width() * (j + 1)) < 0) {
              ballObj.speedY = -ballObj.speedY;
              hit = true;
            }
          }
          //左辺との当たり判定
          if ((blocksObj.height * i) + BLOCK_MARGIN_TOP < ballObj.posY && ballObj.posY < blocksObj.height * i + blocksObj.height + BLOCK_MARGIN_TOP) {
            if ((blocksObj.width() * j) - ballObj.posX < ballObj.width / 2 &&
              blocksObj.width() * (j + 1) - ballObj.posX > ballObj.width / 2 &&
              ballObj.speedX > 0) {
              ballObj.speedX = -ballObj.speedX;
              hit = true;
            }
          }
          // //右辺との当たり判定
          if ((blocksObj.height * i) + BLOCK_MARGIN_TOP < ballObj.posY && ballObj.posY < blocksObj.height * (i + 1) + BLOCK_MARGIN_TOP) {
            if (ballObj.posX - blocksObj.width() * (j + 1) < ballObj.width / 2 &&
              ballObj.posX - blocksObj.width() * j > ballObj.width / 2 &&
              ballObj.speedX < 0) {
              ballObj.speedX = -ballObj.speedX;
              hit = true;
            }
          }
          if (hit) { //もし当たってたら音を鳴らす
            if (blocksObj.map[i][j] === 2) { //2が入ってたらitemを降らせる
              var width = blocksObj.width() * j + blocksObj.width() / 2;
              var height = blocksObj.height * i + blocksObj.height / 2 + BLOCK_MARGIN_TOP;
              itemsAry.push(new Item(width, height, 1, LOGO_GREEN_PATH, 2));
            }else if (blocksObj.map[i][j] === 3) { //2が入ってたらitemを降らせる
              var width = blocksObj.width() * j + blocksObj.width() / 2;
              var height = blocksObj.height * i + blocksObj.height / 2 + BLOCK_MARGIN_TOP;
              itemsAry.push(new Item(width, height, 2, LOGO_PINK_PATH, 3));
            }
            blocksObj.map[i][j] = 0;
            soundObj.play(soundObj.button05);
            hit = false;
          }
        }
      }
    }
    if (!countBlock && gameStatusObj.isGameStarted) { //現在のブロックが0個の場合
      gameClearFunc();
    }
  }

  function gameClearFunc() {
    gameStatusObj.gameClearDisplayTime = 600; //10秒間game clearの文字を表示
    if (gameStatusObj.isGameStarted) {
      gameStatusObj.isGameStarted = false; //ゲーム中のフラグを下す
      soundObj.stop(soundObj.bgm);
      soundObj.play(soundObj.fanfare);
      if (!gameStatusObj.bestTime || gameStatusObj.countTime < gameStatusObj.bestTime) {
        gameStatusObj.bestTime = gameStatusObj.countTime;
        localStorage.setItem('bestTime', gameStatusObj.bestTime);
      }
    }
  }

  //初期化関数
  function gameStartFunc() {
    if(gameStatusObj.isGameStarted) return;
    gameStatusObj.startTime = new Date();
    console.log(gameStatusObj.startTime);
    if (!gameStatusObj.isGameStarted) {
      gameStatusObj.isGameStarted = true;
      gameStatusObj.frameCount = 0;
      playerRect.moveLeft = false;
      playerRect.moveRight = false;
      playerRect.workingItem = 0;
      playerRect.color = "#44f";
      //値が1の場合ブロックを配置、2の場合ブロックとアイテムを配置
      // blocksObj.map = [
      //   [2, 2, 1, 1, 2, 1, 1, 2],
      //   [1, 1, 2, 1, 1, 2, 1, 2],
      //   [2, 1, 2, 1, 1, 2, 2, 1],
      //   [3, 3, 3, 3, 2, 2, 2, 2]
      // ];
      //アイテムをランダムに配置
      for(var i = 0; i < blocksObj.map.length; i++){
        for(var j = 0; j < blocksObj.map[i].length; j++){
          var num = Math.floor( Math.random() * 4 );
          blocksObj.map[i][j] = num;
        }
      }
      itemsAry = [];
      playerRect.itemTime = 0;
      playerRect.width = 100;
      playerRect.height = 10;
      //----------------------------------------ボールの変数
      ballObj.speedY = -(Math.random() * 2 + 3); //移動速度
      ballObj.speedX = Math.sqrt(Math.pow(ballObj.speed, 2) - Math.pow(ballObj.speedY, 2));
      if (Math.random() > 0.5) {
        ballObj.speedX = -ballObj.speedX;
      }
      //BGMスタート
      soundObj.play(soundObj.bgm);
    }
  }

  function drawRect(x, y, width, height, color) {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fill();
  }

  //背景を描画する
  function drawBgImg() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); //canvasをクリア
    ctx.drawImage(bgImg.img, (ctx.canvas.width - bgImg.width) / 2, (ctx.canvas.height - bgImg.height) / 2, bgImg.width, bgImg.height);
  }

  //アニメーション関数
  window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
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
  function alwaysDisplayerText(font, position, color, text, x, y ){
    ctx.font = font;
    ctx.textAlign = position;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  // -----------------------------------------------------------ループ関数
  //この関数内でいろんな値をupdateさせて、アニメーションさせる
  function loop() {
    _animationID = requestAnimFrame(loop);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); //canvasをクリア
    //---------------------update
    drawBgImg(); //背景
    blockDrow(); //ブロックを描画
    // countTime = Math.floor(frameCount / 60);

    if(gameStatusObj.isGameStarted){
      gameStatusObj.countTime = Math.floor( ( new Date() - gameStatusObj.startTime) / 1000 );
    }


    //テキストを描画
    alwaysDisplayerText( "20px 'ＭＳ Ｐゴシック'", "center", "#000", "G's Academy ブロック崩し", canvas.width/2, 20 );
    alwaysDisplayerText( "20px 'ＭＳ Ｐゴシック'", "center", "#000", "G's Academy ブロック崩し", canvas.width/2, 20 );
    alwaysDisplayerText( "14px 'ＭＳ Ｐゴシック'", "left", "#000", 'TIME : ' + gameStatusObj.countTime, 20, 40 );
    alwaysDisplayerText( "14px 'ＭＳ Ｐゴシック'", "right", "#000", 'BESTTIME : ' + gameStatusObj.bestTime, canvas.width - 20, 40 );
    alwaysDisplayerText( "14px 'ＭＳ Ｐゴシック'", "center", "#000", "スマホを左右に傾けて操作してね", canvas.width / 2, (canvas.height - 10) );

    if (gameStatusObj.gameClearDisplayTime) {
      //game clear!の文字を画面に表示
      alwaysDisplayerText( "40px 'ＭＳ Ｐゴシック'", "center", "#CC66bb", "game clear!!", canvas.width / 2, 250);
      gameStatusObj.gameClearDisplayTime--;
    }

    if (gameStatusObj.isGameStarted && !gameStatusObj.gameClearDisplayTime) {
      gameStatusObj.frameCount++;
      // ループ毎にxを加算し、ボールを１コマ毎に移動させる
      ballObj.posX += ballObj.speedX;
      ballObj.posY += ballObj.speedY;

      if (playerRect.itemTime) { //アイテム効力中の場合
        playerRect.itemTime--;
        if (playerRect.itemTime === 0) {//アイテム効力が切れた場合
          //元に戻す
          playerRect.width = 100;
          // playerRect.posX += 20;
          if( playerRect.workingItem === 2 ){
            playerRect.posX += 20;
          } else if( playerRect.workingItem === 3){
            playerRect.posX -= 20;
          }
          playerRect.workingItem = 0;

          soundObj.play(soundObj.powpowpow);
        }
      }

      // 円を描画
      // 変数xの値を変化させる
      var hitWall = false;
      if (ballObj.posX < ballObj.width / 2 && ballObj.speedX < 0) {
        ballObj.speedX = -ballObj.speedX;
        hitWall = true;
      }
      if (ctx.canvas.width - ballObj.posX < ballObj.width / 2 && ballObj.speedX > 0) {
        ballObj.speedX = -ballObj.speedX;
        hitWall = true;
      }
      // 変数yの値を変化させる
      if (ballObj.posY < ballObj.height / 5) {
        ballObj.speedY = -ballObj.speedY;
        hitWall = true;
      }
      if (hitWall) {
        soundObj.play(soundObj.button04a);
      }

      //ボールが最下部に到達してしまった場合にゲームを終了させる
      if (ballObj.posY > ctx.canvas.height) {
        ballObj.speedX = 0; //移動速度
        ballObj.speedY = 0; //移動速度
        soundObj.play(soundObj.destruction1);
        alwaysDisplayerText( "40px 'ＭＳ Ｐゴシック'", "center", "#0066bb", "game over", canvas.width / 2, 250);

        soundObj.stop(soundObj.bgm);//bgmを止める
        gameStatusObj.isGameStarted = false;
        itemsAry = [];
        playerRect.itemTime = 0;
        playerRect.width = 100;
        playerRect.height = 10;
        playerRect.posX = ctx.canvas.width / 2 - playerRect.width / 2; //X軸の位置
        playerRect.workingItem = 0; //
        playerRect.color = "#44f"; //

      }
      //----------------------------------------------------------item
      if (itemsAry.length) {
        for (var i = 0; i < itemsAry.length; i++) {
          if (itemsAry[i].alive) {
            itemsAry[i].move();
            ctx.drawImage(itemsAry[i].logoImg, itemsAry[i].x-itemsAry[i].logoImgWidth/2 , itemsAry[i].y-itemsAry[i].logoImgHeight/2 , itemsAry[i].logoImgWidth, itemsAry[i].logoImgHeight);

            //自機とアイテムとの当たり判定
            if (playerRect.posY - (itemsAry[i].y + 25 / 2) < 0 &&
              (playerRect.posY + playerRect.height) - (itemsAry[i].y - 25 / 2) > 0) {
              if (itemsAry[i].x + 25 / 2 > playerRect.posX && itemsAry[i].x - 25 / 2 < (playerRect.posX + playerRect.width)) {
                itemsAry[i].alive = false;
                if(itemsAry[i].type === 2){
                  if ( playerRect.workingItem !== 2 ) {
                    playerRect.itemTime = 300;
                    playerRect.width = 140;
                    if(!playerRect.workingItem){
                      playerRect.posX -= 20;
                    } else if(playerRect.workingItem === 3){
                      playerRect.posX -= 40;
                    }
                    playerRect.workingItem = 2;
                  } else if (playerRect.workingItem === 2){
                    playerRect.itemTime = 300;
                  }
                  soundObj.play(soundObj.itemGet);//アイテムを取ったら音を鳴らす
                }else if(itemsAry[i].type === 3){
                  if ( playerRect.workingItem !== 3) {
                    playerRect.itemTime = 300;
                    playerRect.width = 60;
                    // playerRect.posX += 20;
                    if(!playerRect.workingItem){
                      playerRect.posX += 20;
                    } else if(playerRect.workingItem === 2){
                      playerRect.posX += 40;
                    }
                    playerRect.workingItem = 3;
                  } else if (playerRect.workingItem === 3){
                    playerRect.itemTime = 300;

                  }
                  soundObj.play(soundObj.itemGet);
                }

              }
            } else if (itemsAry[i].y > ctx.canvas.height + 25 / 2) { //画面外に出た場合、配列から削除する
              itemsAry[i].alive = false;
            }

          }
        }
      }

      //自機との当たり判定
      var hit = false;
      if (playerRect.posY - (ballObj.posY + ballObj.height / 2) < 0 &&
        (playerRect.posY + playerRect.height) - (ballObj.posY - ballObj.height / 2) > 0 &&
        ballObj.speedY > 0) {
        if (ballObj.posX >= playerRect.posX && ballObj.posX <= (playerRect.posX + playerRect.width)) {
          if (playerRect.moveLeft) {
            ballObj.speedX = ballObj.speedX - 1;
          } else if (playerRect.moveRight) {
            ballObj.speedX = ballObj.speedX + 1;
          }
          if (ballObj.speedX >= 6) {
            ballObj.speedX = 5.4;
          } else if (ballObj.speedX <= -6) {
            ballObj.speedX = -5.4;
          }
          hit = true;
        } else if (ballObj.posX < playerRect.posX) {
          if (ballObj.posX + ballObj.width / 2 > playerRect.posX) {
            ballObj.speedX = -5.4;
            hit = true;
          }
        } else if (ballObj.posX > (playerRect.posX + playerRect.width)) {
          if (ballObj.posX - ballObj.width / 2 < (playerRect.posX + playerRect.width)) {
            ballObj.speedX = 5.4;
            hit = true;
          }
        }
        if (hit) { //当たってたら
          ballObj.speedY = Math.sqrt(Math.pow(ballObj.speed, 2) - Math.pow(ballObj.speedX, 2));
          ballObj.speedY = -ballObj.speedY;

          soundObj.play(soundObj.select06);
        }
      }
    } else { //ゲーム中でない時
      ballObj.posX = playerRect.posX + playerRect.width / 2;
      ballObj.posY = playerRect.posY - ballObj.height / 2;
      if (!gameStatusObj.gameClearDisplayTime) {
        alwaysDisplayerText( "40px 'ＭＳ Ｐゴシック'", "center", "#0066bb", "click or enter!", canvas.width / 2, 250);

      }
    }
    ctx.drawImage(ballObj.imgPath, ballObj.posX - (ballObj.width / 2), ballObj.posY - (ballObj.height / 2), ballObj.width, ballObj.height);//ボールを描画

    //自機の変数の値を変化させる
    if (playerRect.moveLeft) { //もし左キーが押されていたら
      playerRect.posX -= playerRect.speedX;//x座標をspeedX分減算
    }
    if (playerRect.moveRight) { //もし右キーが押されていたら
      playerRect.posX += playerRect.speedX;//x座標をspeedX分足す
    }
    if (playerRect.posX < 0) {//自機が左端なら
      playerRect.posX = 0;//自機のx座標を0に戻す
    } else if ((playerRect.posX + playerRect.width) - ctx.canvas.width > 0) {//自機が右端以上なら
      playerRect.posX = ctx.canvas.width - playerRect.width;//右端に戻す
    }

    playerRect.changeColorFn();//自機の色を変更

    drawRect(playerRect.posX, playerRect.posY, playerRect.width, playerRect.height, playerRect.color); //自機を描画する

    ballHitsBlocks();

  }
  loop();

})();
