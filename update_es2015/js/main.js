(() => {
    'use strict';

    // Canvas未サポートの場合は処理をしない
    if (!window.HTMLCanvasElement) return;

    //----------------------------------------------------------------定数ブロック
    //ブロックを描画する際に使用する定数
    const NO_BLOCK = 0; //ブロックがない
    const EXIST_BLOCK = 1; //ブロックがある
    const BLOCK_WITH_GREEN_ITEM = 2; //ブロックがあり、緑のアイテムが入っている
    const BLOCK_WITH_PINK_ITEM = 3; //ブロックがあり、ピンクのアイテムが入っている

    //効果中のアイテムを表す定数
    const NO_ITEM = 0; //アイテム効果中でないことを示す
    const GREEN_ITEM = 1; //greenのアイテム効果中であることを示す
    const PINK_ITEM = 2; //pinkのアイテム効果中であることを示す

    //自機の幅
    const NORMAL_WIDTH = 100; //自機の標準時の幅
    const SHORT_WIDTH = 60; //緑のアイテムを取った際の自機の幅
    const LONG_WIDTH = 140; //ピンクのアイテムを取った際の自機の幅

    //画像パス
    const PATH_ARY = {
        LOGO_BLUE: './images/gsacLogoBlue50x50.png',
        LOGO_GREEN: './images/gsacLogoGreen50x50.png',
        LOGO_PINK: './images/gsacLogoPink50x50.png'
    };

    //カラー
    const COLOR_ARY = {
        WHITE: '#ffffff',
        GREEN: '#229944',
        PINK: '#ff4488',
        BLUE: '#4444ff',
        SKYBLUE: '#add8e6',
        DODGERBLUE: '#0088dd',
        PURPLE: '#C48793'
    };

    // canvas要素を取得
    const canvas = document.getElementById('canvas'); //canvasタグを変数へ格納

    // コンテキストを定数へ格納
    const ctx = canvas.getContext('2d');


    //----------------------------------------------------------------変数ブロック
    let itemsAry = []; //アイテムを格納する配列
    let bl; // ブロックの情報をまとめたオブジェクト。blocksの略でbl
    let gs; //ゲームのステータスをまとめたオブジェクト。gameStatusの略でgs
    let ba; //ballの情報をまとめたオブジェクト。ballの略
    let p; //自機の情報をまとめたオブジェクト。playerの略
    let sf = {}; //soundをまとめたオブジェクト。soundFilesの略
    let util; //ユーティリティ関数をまとめたオブジェクト。

    //----------------------------------------ゲームステータスオブジェクト
    gs = { //gameStatusの略でgs
        ready: false, //アニメーションフレームのカウンター
        frameCount: 0, //アニメーションフレームのカウンター
        isGameStarted: false, //ゲーム中かどうかのフラグ
        startTime: 0, //ゲームをスタートした時点の現在の日時ミリ秒
        countTime: 0, //ゲームをスタートしてから経過した秒数
        bestTime: null, //今までの最短時間
        gameOverDisplayTime: 0, //ゲームをクリアした際に画面上に「ゲームクリア」の文字を表示させる時間
        gameClearDisplayTime: 0 //ゲームをクリアした際に画面上に「ゲームクリア」の文字を表示させる時間
    };

    //----------------------------------------ballオブジェクト
    ba = { //ballの略
        speed: 6, //ボールのスピード
        speedX: 0, //ボールのx方向のスピード
        speedY: 0, //ボールのy方向のスピード
        posX: 0, //ボールのx座標
        posY: 0, //ボールのy座標
        diameter: 25, //ボールの直径
        radius: 12.5, //ボールの半径
        imgPath: (() => { //ba.imgPathプロパティへボール画像を設定
            let image = new Image(); //imgタグを生成
            image.src = PATH_ARY.LOGO_BLUE; //imgタグにパスを指定
            return image; //return でimgタグを返す
        })(),
        move: () => { //ballを動かすメソッド
            ba.posX += ba.speedX; //x座標をspeedX分移動する
            ba.posY += ba.speedY; //y座標をspeedY分移動する
        },
        calcSpeedX: () => {
            ba.speedX = Math.sqrt(Math.pow(ba.speed, 2) - Math.pow(ba.speedY, 2));
        },
        calcSpeedY: () => {
            ba.speedY = Math.sqrt(Math.pow(ba.speed, 2) - Math.pow(ba.speedX, 2));
        },
    };

    //----------------------------------------自機オブジェクト
    p = { //playerの略
        speedX: 8, //移動速度
        SpeedY: 0, //移動速度
        posX: 0, //X軸の位置
        posY: ctx.canvas.height - 60, //画面下からのポジションを指定
        width: 100, //自機の幅
        height: 10, //自機の高さ
        moveLeft: false, //自機を左へ動かすフラグ
        moveRight: false, //自機を右へ動かすフラグ
        color: COLOR_ARY.BLUE, //自機の色
        itemTime: 0, //itemの効力の残り時間
        workingItem: NO_ITEM, //今効いているアイテムのタイプ
        changeColorFn: () => { //色をかえるメソッド
            if (p.workingItem === GREEN_ITEM) { //もし効果中のアイテムが緑なら
                p.color = COLOR_ARY.GREEN;
            } else if (p.workingItem === PINK_ITEM) { //もし効果中のアイテムがピンクなら
                p.color = COLOR_ARY.PINK;
            } else { //もしアイテム効果中で無ければ
                p.color = COLOR_ARY.BLUE;
            }
        },
        move: () => { //自機の変数の値を変化させるメソッド
            if (p.moveLeft) { //もし左キーが押されていたら
                p.posX -= p.speedX; //x座標をspeedX分減算
            }
            if (p.moveRight) { //もし右キーが押されていたら
                p.posX += p.speedX; //x座標をspeedX分足す
            }
            if (p.posX < 0) { //自機が左端なら
                p.posX = 0; //自機のx座標を0に戻す
            } else if ((p.posX + p.width) - ctx.canvas.width > 0) { //自機が右端以上なら
                p.posX = ctx.canvas.width - p.width; //右端に戻す
            }
        }
    };


    //------------------------------------------------------ブロックオブジェクト
    bl = { //blocksの略
        cols: 4, //行数
        rows: 8, //列数
        map: [],
        //完成図は下記のような感じになる
        // map: [
        //   [1, 1, 1, 1, 1, 1, 1, 1],
        //   [1, 1, 1, 1, 1, 1, 1, 1],
        //   [1, 1, 1, 1, 1, 1, 1, 1],
        //   [1, 1, 1, 1, 1, 1, 1, 1]
        // ],
        colorMap: [], //色情報を格納しておく
        height: 20, //ブロックの高さ
        BLOCK_MARGIN_TOP: 60, //ブロックとcanvas天井部分との間隔
        width: null,// 初期値はnull。initMapメソッドを実行し、設定する。
        initMap: () => { // blockのmapを設定するメソッド
            bl.width = ctx.canvas.width / bl.rows; //canvas要素の幅をrow数で割ったものを幅として設定
            for (let i = 0; i < bl.cols; i++) { //アイテムをランダムに配置
                bl.map[i] = []; //配列内に配列を作成
                for (let j = 0; j < bl.rows; j++) {
                    let num = util.rand(4); //0から4の乱数を生成
                    bl.map[i][j] = num; //マップに数字を格納
                }
            }
            bl.initblocksColor(); //ブロックのカラーを初期化する
        },
        initblocksColor: () => {
            for (let i = 0; i < bl.cols; i++) { //二次元配列をfor文で回す
                bl.colorMap[i] = []; //配列を作成
                for (let j = 0; j < bl.rows; j++) {
                    let r = util.rand(255); //カラーの赤の成分をランダムに設定する。
                    let g = util.rand(255); //カラーの緑の成分をランダムに設定する。
                    let b = util.rand(255); //カラーの青の成分をランダムに設定する。
                    bl.colorMap[i][j] = [r, g, b]; //配列に格納。
                }
            }
        },
        //ブロックを描画する関数
        blockDrow: () => {
            for (let i = 0; i < bl.cols; i++) {
                for (let j = 0; j < bl.rows; j++) {
                    if (!bl.map.length || !bl.map[i][j])  continue;//map配列にデータなしorブロックがなければ処理を飛ばす
                    util.drawRect( //ブロックを描画
                        bl.width * j, //x座標を指定
                        bl.height * i + bl.BLOCK_MARGIN_TOP, //y座標を指定
                        bl.width, //ブロックの幅
                        bl.height, //ブロックの高さ
                        `rgb(${bl.colorMap[i][j][0]}, ${bl.colorMap[i][j][1]}, ${bl.colorMap[i][j][2]})` //ブロックの色を指定
                    );
                }
            }
        }
    };


    //------------------------------------------------------------Item class
    class Item {
        constructor(x, y, speed, logoImgPath, type){
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.acceleration = 1.02;
            this.alive = true;
            this.diameter = 25;
            this.radius = this.diameter / 2;
            this.width = this.diameter;
            this.height = this.diameter;
            this.logoImg = new Image();
            this.logoImg.src = logoImgPath;
            this.type = type;
            this.GREEN_ITEM = 1;//greenのアイテム効果中であることを示す
            this.PINK_ITEM = 2;//pinkのアイテム効果中であることを示す
        }
        move(){
            if(this.type === this.PINK_ITEM) this.speed *= this.acceleration;
            this.y += this.speed;
        }
    }


    //--------------------------------------------------------------------sound
    //音源の登録
    // LoadQueueクラスのインスタンスを作成
    // 引数のtrueは、LoadQueueインスタンスがロード時、XMLHttpRequestを用いるか、
    // HTMLタグによるのかを示すブール値。デフォルト値はtrue。
    let queue = new createjs.LoadQueue(true);

    // manifest配列に読み込む音源を格納
    const MANIFEST = [{
        src: './sound/ballHitPr.mp3',
        id: 'ballHitPr'
    }, {
        src: './sound/ballHitKabe.mp3',
        id: 'ballHitKabe'
    }, {
        src: './sound/ballHitBlock.mp3',
        id: 'ballHitBlock'
    }, {
        src: './sound/destruction.mp3',
        id: 'destruction'
    }, {
        src: './sound/bgmCool.mp3',
        id: 'bgm'
    }, {
        src: './sound/fanfare.mp3',
        id: 'fanfare'
    }, {
        src: './sound/itemGet.mp3',
        id: 'itemGet'
    }, {
        src: './sound/wearOff.mp3',
        id: 'wearOff'
    }];
    // LoadQueueクラスを用いた外部サウンドファイルの読込む場合、Soundクラスの参照を渡して、プラグインを登録する
    queue.installPlugin(createjs.Sound);
    queue.loadManifest(MANIFEST, true); //manifest配列内の音源を読み込む
    queue.on('complete', handleComplete); // 音源読み込み完了後、handleCompleteを実行


    //----------------------------アニメーション関数
    window.requestAnimationFrame =
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        (callback => {
            window.setTimeout(callback, 1000 / 60);
        });

    function handleComplete() {
        //sfオブジェクトへ各音源を格納
        sf.ballHitPr = createjs.Sound.createInstance('ballHitPr');
        sf.ballHitKabe = createjs.Sound.createInstance('ballHitKabe');
        sf.ballHitBlock = createjs.Sound.createInstance('ballHitBlock');
        sf.destruction = createjs.Sound.createInstance('destruction');
        sf.bgm = createjs.Sound.createInstance('bgm');
        sf.fanfare = createjs.Sound.createInstance('fanfare');
        sf.itemGet = createjs.Sound.createInstance('itemGet');
        sf.wearOff = createjs.Sound.createInstance('wearOff');

        //音源ごとにボリュームを調整
        sf.bgm.volume = 0.3;
        sf.ballHitKabe.volume = 0.6;
        sf.ballHitPr.volume = 0.6;
        sf.ballHitBlock.volume = 1;
        sf.itemGet.volume = 0.3;
        sf.destruction.volume = 0.1;

        //サウンドが登録完了したら、gs.readyをtrueにして、init関数を実行
        gs.ready = true; //ゲーム開始準備完了状態にする
        init();//初期化処理
    }


    // ユーティリティオブジェクトに関数をまとめる
    util = {
        //整数の乱数を生成する関数
        rand: (x = 1) => {
            return Math.floor(Math.random() * x);
        },
        displayText: (textObj, x = 0, y = 0) => {
            // || の後ろにデフォルト値を設定
            let text = textObj.text;
            ctx.font = textObj.font || `14px 'ＭＳ Ｐゴシック'`;
            ctx.textAlign = textObj.position || 'center';
            ctx.fillStyle = textObj.color || COLOR_ARY.WHITE; //
            ctx.fillText(textObj.text, x, y); //テキストを描画
        },
        //四角を描画する関数
        drawRect: (x = 0, y = 0, width, height, color = COLOR_ARY.WHITE) => { //canvasに描画する処理をまとめたもの
            ctx.beginPath(); //現在のパスをリセット
            ctx.fillStyle = color; //塗りつぶしの色を設定
            ctx.fillRect(x, y, width, height); //塗りつぶし四角形を描画
        }
    };


    //-----------------------------関数
    //初期化関数
    function init() {
        gs.isGameStarted = false; //ゲーム中のフラグを下す
        sf.bgm.stop(); //bgmを止める
        gs.frameCount = 0; //フレームカウントを初期化
        p.moveLeft = false; //移動フラグを下す
        p.moveRight = false; //移動フラグを下す
        p.workingItem = NO_ITEM; //効果中アイテムを初期化
        p.color = COLOR_ARY.BLUE; //自機の色を初期化
        //----------------------------------------ボールのプロパティを変更
        ba.speedY = -2.0; //移動速度
        ba.calcSpeedX(); // y方向の速度からx方向の速度を算出
        p.posX = ctx.canvas.width / 2 - p.width / 2; //自機の位置をcanvas要素の中央へ配置
        bl.initMap(); //ブロックを配置

        itemsAry = []; //アイテムをリセット
        p.itemTime = 0; //アイテム効果中の時間を初期化
        p.width = NORMAL_WIDTH; //自機の幅を指定
    }

    function gameStart() { //ゲームをスタートさせる関数
        //ゲーム中orゲームクリアメッセージ表示中orゲームオーバーメッセージ表示中の場合、関数を実行させない
        if (!gs.ready || gs.isGameStarted || gs.gameClearDisplayTime || gs.gameOverDisplayTime) return;
        gs.startTime = new Date(); //ゲーム開始時間を格納
        if (gs.isGameStarted) return; //もしゲーム中でなければ
        gs.isGameStarted = true; //ゲーム中フラグを立てる
        gs.frameCount = 0; //フレーム数カウントをリセット
        p.moveLeft = false; //左移動フラグを下す
        p.moveRight = false; //右移動フラグを下す
        p.workingItem = NO_ITEM; //効果中のアイテムを消去
        p.color = COLOR_ARY.BLUE; //自機の色を戻す
        bl.initMap(); //ブロックを配置
        itemsAry = []; //アイテム格納配列を初期化
        p.itemTime = 0; //アイテム効果時間を初期化
        p.width = NORMAL_WIDTH; //自機の幅を初期化

        //----------------------------------------ボールのプロパティ
        ba.speedY = -(Math.random() * 2 + 3); //縦方向の速度初期化
        ba.calcSpeedX(); // y方向の速度からx方向の速度を算出
        if (Math.random() > 0.5) ba.speedX *= -1; //速度のx方向成分をランダムに決定

        //BGMスタート
        sf.bgm.play({ loop: -1 }); //loopさせる
    }

    //ゲーム中の時はゲームを終了、そうでない時はスタートする関数
    function startStop() {
        if (gs.isGameStarted) { //もしゲーム中であれば
            init(); //ゲーム停止
        } else { //ゲーム中でなければ
            gameStart(); //ゲームをスタートする
        }
    }

    function gameOver() { //ボールが最下部に来た際にゲームを終了させる関数
        ba.speedX = 0; //移動速度
        ba.speedY = 0; //移動速度
        sf.destruction.stop(); //爆発音を鳴らす
        sf.destruction.play(); //爆発音を鳴らす
        sf.bgm.stop(); //bgmを止める
        gs.isGameStarted = false; //ゲーム中フラグを下す
        itemsAry = []; //アイテム配列を初期化
        p.itemTime = 0; //アイテム効果中時間を初期化
        p.width = NORMAL_WIDTH; //自機の長さを戻す
        p.posX = ctx.canvas.width / 2 - p.width / 2; //X軸の位置
        p.workingItem = NO_ITEM; //効果適用中のアイテムをリセット
        p.color = COLOR_ARY.BLUE; //色を戻す
        gs.gameOverDisplayTime = 180; //10秒間game clearの文字を表示
        util.displayText({ //画面に「game over」の文字を表示
            font: `40px 'ＭＳ Ｐゴシック'`,
            color: COLOR_ARY.PURPLE, //色を紫に。
            text: 'game over' //テキストを渡す
        }, canvas.width / 2, 250); //第二引数に表示位置を設定
    }

    function gameClearFunc() {
        if (!gs.isGameStarted) return; //もしゲーム中でなければ処理しない
        gs.isGameStarted = false; //ゲーム中のフラグを下す
        sf.bgm.stop(); //bgmを止める
        sf.fanfare.play(); //ファンファーレを鳴らす
        gs.gameClearDisplayTime = 600; //10秒間game clearの文字を表示
        if (!gs.bestTime || gs.countTime < gs.bestTime) { //もしbestTimeがない or countTimeがbestTimeより小さい場合
            gs.bestTime = gs.countTime; //ベストタイムを更新
            localStorage.setItem('bestTime', gs.bestTime); //ローカルストレージにベストタイムを登録
        }
    }

    function ballHitsBlocks() {
        let countBlock = 0; //現在のブロック個数をカウントする変数
        let hit = false; //当たったかどうかのフラグ
        for (let i = 0; i < bl.map.length; i++) {
            for (let j = 0; j < bl.map[i].length; j++) {
                if (!bl.map[i][j]) continue; //もしブロックがなければ処理を飛ばす
                countBlock++; //現在のブロック個数をカウントアップ
                let ballTop = ba.posY - ba.radius; //ボール上部
                let ballBottom = ba.posY + ba.radius; //ボール下部
                let ballLeft = ba.posX - ba.radius; //ボールの左部
                let ballRight = ba.posX + ba.radius; //ボールの右部
                //
                let blockTop = (bl.height * i) + bl.BLOCK_MARGIN_TOP; //ブロック上辺
                let blockBottom = (bl.height * (i + 1)) + bl.BLOCK_MARGIN_TOP; //ブロック下辺
                let blockLeft = bl.width * j; //ブロック左辺
                let blockRight = bl.width * (j + 1); //ブロック右辺

                //ブロック下辺との当たり判定
                if (ballTop < blockBottom && //ボール最上部がブロックの位置より下にある
                    ballTop > blockTop && //ボールの最上部がブロックの底辺より上にある場合
                    ba.speedY < 0) { //ボールが上に移動している場合
                    if (blockLeft < ba.posX && ba.posX < blockRight) { //ブロック幅よりボール中心のx座標が内側にあるかどうか
                        ba.speedY *= -1; //y方向のスピードを反転させる
                        hit = true; //当たりフラグをtrueにする
                    }
                }
                //ブロック上辺との当たり判定
                if (blockTop < ballBottom && //ブロック上辺のy座標位置より、ballの最下部が下にある場合
                    blockBottom > ballBottom && //ブロック上辺のy座標位置より、ballの最下部が上ににある場合
                    0 < ba.speedY) { //ボールが下向きに移動している場合
                    if (blockLeft < ba.posX && ba.posX < blockRight) { //ブロック幅よりボール中心のx座標が内側にあるかどうか
                        ba.speedY *= -1; //y方向のスピードを反転させる
                        hit = true; //当たりフラグをtrueにする
                    }
                }
                //ブロック左辺との当たり判定
                if (blockTop < ba.posY && //ブロックの上辺よりボール中心のy座標がが下にあるかどうか
                    ba.posY < blockBottom) { //ブロックの下辺よりボール中心のx座標が上にあるかどうか
                    if (blockLeft < ballRight && //ブロック左辺よりボールの右側が右にある場合
                        blockRight > ballRight && //ブロック右辺よりボールの右側が左にある場合
                        ba.speedX > 0) { //ボールが右に動いている場合
                        ba.speedX *= -1; //x方向のスピードを反転させる
                        hit = true;
                    }
                }
                // ブロック右辺との当たり判定
                if (blockTop < ba.posY && //ボールの中心点が下にあるブロック上辺より下にある
                    ba.posY < blockBottom) { //ボールの中心点がブロック下辺より上にある
                    if (ballLeft < blockRight && //ブロック右辺よりボール左部が左側にある
                        ballLeft > blockLeft && //ボール左部がブロック左辺より右側にある
                        ba.speedX < 0) { //ボールが左に動いてる
                        ba.speedX *= -1; //x方向のスピードを反転させる
                        hit = true;
                    }
                }
                if (!hit) continue; //もし当たってなければ処理を飛ばす
                //もし当たっていたら
                //アイテムを表示させる
                let posX = blockLeft + bl.width / 2; //アイテムを描画させるx座標の中心を設定
                let posY = bl.height * i + bl.height / 2 + bl.BLOCK_MARGIN_TOP; //アイテムを描画させるy座標の中心を設定
                if (bl.map[i][j] === BLOCK_WITH_GREEN_ITEM) { //2が入ってたらitemを降らせる
                    itemsAry.push(new Item(posX, posY, 1, PATH_ARY.LOGO_GREEN, GREEN_ITEM)); //itemsAry配列に緑のアイテムのインスタンスを格納
                } else if (bl.map[i][j] === BLOCK_WITH_PINK_ITEM) { //2が入ってたらitemを降らせる
                    itemsAry.push(new Item(posX, posY, 1, PATH_ARY.LOGO_PINK, PINK_ITEM)); //itemsAry配列にピンクのアイテムのインスタンスを格納
                }
                bl.map[i][j] = NO_BLOCK; //ブロックを非表示にする
                sf.ballHitBlock.stop(); //
                sf.ballHitBlock.play(); //ballとブロック
                hit = false; //フラグを下す
            }
        }
        if (!countBlock && gs.isGameStarted) gameClearFunc(); //現在のブロックが0個の場合,ゲームクリア処理
    }

    function ballHitsWalls() { //ボールが壁に当たった際に反射させる関数
        let ballTop = ba.posY - ba.radius; //ボール上部
        let ballBottom = ba.posY + ba.radius; //ボール下部
        let ballLeft = ba.posX - ba.radius; //ボールの左部
        let ballRight = ba.posX + ba.radius; //ボールの右部

        // 円を描画
        let hitWall = false; //壁に当たったかどうかのフラグ
        if (ballLeft <= 0 && ba.speedX < 0) { //ボールが左に移動しているandボールの左側が、左の壁に接触している場合
            ba.speedX *= -1; //ボールのx方向の速度を反転させる
            hitWall = true; //当たりフラグを立てる
        }
        if (ctx.canvas.width <= ballRight && ba.speedX > 0) { //ボールが右へ移動しているandボールの右側が右の壁に接触している場合
            ba.speedX *= -1; //ボールのx方向の速度を反転させる
            hitWall = true; //当たりフラグを立てる
        }
        if (ballTop <= 0) { //もしボールの上部が画面最上部に達していたら
            ba.speedY *= -1; //ボールのx方向の速度を反転させる
            hitWall = true; //当たりフラグを立てる
        }
        if (!hitWall) return; //もし壁にボールが当たってなければ処理を飛ばす。
        sf.ballHitKabe.stop();
        sf.ballHitKabe.play(); //ボールが壁に当たったサウンドを鳴らす
    }

    function itemTimeCheck() { //アイテムの効力時間を監視する関数
        if (!p.itemTime) return; //アイテム効力中でない場合は処理しない
        p.itemTime--; //アイテム効果持続時間を1減らす
        if (p.itemTime !== 0) return;//アイテム効力中なら処理しない
        //アイテム効力が切れた場合、元に戻す処理を以下に記述
        p.width = NORMAL_WIDTH; //自機の幅を元に戻す
        if (p.workingItem === GREEN_ITEM) { //緑のアイテムが効果中であった場合
            p.posX += 20; //40px短くなるので、20px右にずらす
        } else if (p.workingItem === PINK_ITEM) { //ピンクのアイテムが効果中の場合
            p.posX -= 20; //40px長くなるので、20px左にずらす
        }
        p.workingItem = NO_ITEM; //効果中のアイテムを消去
        sf.wearOff.stop(); //サウンドを鳴らす
        sf.wearOff.play(); //サウンドを鳴らす
    }

    function itemMove() { //itemを動かすand自機との当たり判定
        if (!itemsAry.length) return; //itemsAryにアイテムが無い場合処理しない
        for (let i = 0; i < itemsAry.length; i++) { //itemsAry数をfor文で回す
            let it = itemsAry[i]; //コードを見易くするため、短い変数名へ代入
            let itemTop = it.y - it.radius; //アイテムの下部
            let itemBottom = it.y + it.radius; //アイテムの下部
            let itemLeft = it.x - it.radius; //アイテムの左部
            let itemRight = it.x + it.radius; //アイテムの右部
            if (!it.alive) continue; //アイテムのaliveフラグがfalseなら処理しない
            it.move(); //アイテムを動かす
            ctx.drawImage( //イメージを描画する
                it.logoImg, //描画する画像を渡す
                itemLeft, //イメージを描画するx座標のポイント
                itemTop, //イメージを描画するy座標のポイント
                it.diameter, //イメージの幅
                it.diameter //イメージの高さ
            );
            //自機とアイテムとの当たり判定
            if (p.posY < itemBottom && p.posY + p.height > itemTop) { //自機の上辺よりアイテムの下側が下にあるand自機の下辺よりアイテムの上側が上にある場合
                if (itemRight > p.posX && itemLeft < p.posX + p.width) { //自機の左辺よりアイテムの右側が右にあるand自機の右辺よりアイテムの左側が左にある場合
                    //当たったとみなし、衝突時の処理を以下に記述
                    it.alive = false; //アイテムのaliveフラフを下す
                    p.itemTime = 800; //アイテム持続時間を800にする
                    sf.itemGet.stop(); //
                    sf.itemGet.play(); //アイテムを取ったら音を鳴らす
                    if (it.type === GREEN_ITEM && p.workingItem !== GREEN_ITEM) { //緑のアイテムの場合and緑アイテムが効果中でない場合
                        p.width = LONG_WIDTH; //自機の幅をロングにする
                        if (!p.workingItem) { //アイテム効果中でない場合
                            p.posX -= 20; //自機の幅が40伸びるので、20左にずらす
                        } else if (p.workingItem === PINK_ITEM) { //ピンクのアイテムが効果中の場合
                            p.posX -= 40; //自機の幅が80伸びるので、40左にずらす
                        }
                        p.workingItem = GREEN_ITEM; //緑のアイテムを効果中にする
                    } else if (it.type === PINK_ITEM && p.workingItem !== PINK_ITEM) { //ピンクのアイテムの場合andピンクアイテムが効果中でない場合
                        p.width = SHORT_WIDTH; //自機の幅をショートにする
                        if (!p.workingItem) { //アイテム効果中でない場合
                            p.posX += 20; //自機の幅が40縮むので、20右ににずらす
                        } else if (p.workingItem === GREEN_ITEM) { //緑のアイテムが効果中の場合
                            p.posX += 40; //自機の幅が80縮むので、40右にずらす
                        }
                        p.workingItem = PINK_ITEM; //ピンクのアイテムを効果中にする
                    }
                }
            } else if (itemTop > ctx.canvas.height) { //画面外に出た場合、配列から削除する
                it.alive = false; //アイテムのaliveフラグを下ろし、画面から消去する
            }
        }
    }

    function ballHitsPlayer() { //自機とボールとの当たり判定関数
        let ballTop = ba.posY - ba.radius; //ボール上部
        let ballBottom = ba.posY + ba.radius; //ボール下部
        let ballLeft = ba.posX - ba.radius; //ボールの左部
        let ballRight = ba.posX + ba.radius; //ボールの右部

        let pTop = p.posY; //自機の上辺
        let pBottom = p.posY + p.height; //自機の下辺
        let pLeft = p.posX; //自機の左辺
        let pRight = p.posX + p.width; //自機の右辺

        let hit = false; //hit変数を初期化
        if (pTop > ballBottom || //自機の上辺よりボールの下側が上にあるor
            pBottom <= ballTop || //自機の下辺よりボールの上側が下にあるor
            ba.speedY < 0) return; //ボールが上向きに動いている場合は、処理しない
        if (ba.posX >= pLeft && ba.posX <= pRight) { //ボールの中心点が、自機の左辺より
            if (p.moveLeft) { //もしmoveLeftプロパティがtrueなら
                ba.speedX -= 1; //ボールのx方向のスピードを左方向へ加速
            } else if (p.moveRight) {
                ba.speedX += 1; //ボールのx方向のスピードを右方向へ加速
            }
            if (ba.speedX >= 6) { //x方向のスピードが6を超えたら
                ba.speedX = 5.4; //x方向のスピードをmax5.4にする
            } else if (ba.speedX <= -6) { //x方向のスピードが-6を下回ったら
                ba.speedX = -5.4; //x方向のスピードをmax5.4にする
            }
            hit = true; //当たりフラグを立てる
        } else if (ba.posX < pLeft && ballRight > pLeft) { //自機の左角に当たっった場合
            ba.speedX = -5.4; //左方向へスピードを振り切る
            hit = true;
        } else if (ba.posX > pRight && ballLeft < pRight) { //自機の右角に当たった場合
            ba.speedX = 5.4; //左方向へスピードを振り切る
            hit = true;
        }
        if (!hit) return; //当たってなければ処理しない
        ba.calcSpeedY(); //スピードの絶対値が一定になるようy方向のスピードを決定
        ba.speedY *= -1; //y方向スピードを反転
        sf.ballHitPr.stop();
        sf.ballHitPr.play(); //自機とボール
    }

    function keyDown(event) { //キーダウンイベントを設定
        switch (event.keyCode) { //eventのkeycodeプロパティで条件分岐
            case 37: // ←キー
            case 65: // Aキー
                p.moveLeft = true; //時期を左に動かすためのフラグをtrueにする
                break;
            case 39: // →キー
            case 68: // Dキー
                p.moveRight = true; //時期を右に動かすためのフラグをtrueにする
                break;
            case 13: // enterキー
            case 32: // spaceキー
                startStop(); //スタートストップの関数を実行
                break;
            default:
                break;
        }
    }

    function keyUp(event) {
        switch (event.keyCode) { //eventのkeycodeプロパティで条件分岐
            case 37: // ←キー
            case 65: // Aキー
                p.moveLeft = false; //時期を左に動かすためのフラグをfalseにする
                break;
            case 39: // →キー
            case 68: // Dキー
                p.moveRight = false; //時期を右に動かすためのフラグをfalseにする
                break;
            default:
                break;
        }
    }


    // --------------------------------------------------------------------------------------------------ループ関数
    //この関数内で色々な値をupdateさせて、アニメーションさせる
    function loop() {
        gs.frameCount++; //フレーム数をインクリメント

        ctx.clearRect(0, 0, canvas.width, canvas.height); //canvasをクリア
        ctx.beginPath(); //pathを初期化する
        ctx.fillStyle = 'rgba(0,0,0,.5)'; //白色を設定
        ctx.fillRect(0, 0, canvas.width, canvas.height); //canvas全面を塗り潰す

        //画面最下部のテキストを1秒間隔で点滅させる
        if(Math.floor(gs.frameCount / 60) % 2 === 0) {
            util.displayText({ //テキストを描画する
                text: 'スマホの場合は、端末を左右に傾けて操作してね', //描画するテキストを文字列で渡す
                color: COLOR_ARY.SKYBLUE
            }, canvas.width / 2, (canvas.height - 20)); //ポジションを指定する
        }

        bl.blockDrow(); //ブロックを描画

        //---------------------update
        if (gs.isGameStarted) { //もしゲーム中なら
            gs.countTime = Math.floor((new Date() - gs.startTime) / 1000); //現在の時間からゲームスタート時間を差し引いたものを経過時間としてcountTimeプロパティへ格納
        }

        if (gs.isGameStarted && !gs.gameClearDisplayTime && !gs.gameOverDisplayTime) { //ゲーム中 and gameClearを表示中でない and game overテキストを表示中でない場合
            // gs.frameCount++; //フレーム数をインクリメント
            ba.move(); //ボールを移動させる
            itemTimeCheck(); //item効力時間チェック
            ballHitsWalls(); //ball壁反射
            ballHitsBlocks(); //ボールがブロックに当たった際の関数

            //ボールが最下部に到達してしまった場合にゲームを終了させる
            if (ba.posY > ctx.canvas.height) { //もしボールの中心位置が、canvasの底辺の位置まで来たら
                gameOver(); //ゲームを終了する
            }
            itemMove(); //itemを動かすand自機との当たり判定
            ballHitsPlayer(); //ボールと自機との当たり判定
        } else { //ゲーム中でない時
            ba.posX = p.posX + p.width / 2; //ボールのx位置を、自機の中央へ
            ba.posY = p.posY - ba.radius; //ボールの下側が自機の上辺へ接触するように位置を指定
            if (!gs.gameClearDisplayTime && !gs.gameOverDisplayTime) { //gameClearを表示中でない and game overテキストを表示中でない場合
                if(gs.ready){
                    util.displayText({ //'click or enter!'のテキストを画面へ描画する
                        font: `40px 'ＭＳ Ｐゴシック'`, //フォント、文字サイズを指定
                        color: COLOR_ARY.DODGERBLUE, //文字色を指定
                        text: 'Click' //表示テキストを指定
                    }, canvas.width / 2, canvas.height / 2 - 40); //テキスト表示位置を指定
                    util.displayText({ //'click or enter!'のテキストを画面へ描画する
                        font: `30px 'ＭＳ Ｐゴシック'`, //フォント、文字サイズを指定
                        color: COLOR_ARY.DODGERBLUE, //文字色を指定
                        text: 'or' //表示テキストを指定
                    }, canvas.width / 2, canvas.height / 2); //テキスト表示位置を指定
                    util.displayText({ //'click or enter!'のテキストを画面へ描画する
                        font: `40px 'ＭＳ Ｐゴシック'`, //フォント、文字サイズを指定
                        color: COLOR_ARY.DODGERBLUE, //文字色を指定
                        text: 'Press Enter!' //表示テキストを指定
                    }, canvas.width / 2, canvas.height / 2 + 40); //テキスト表示位置を指定
                }

            }
        }

        p.move();
        p.changeColorFn(); //自機の色を変更

        //テキストを描画
        util.displayText({ //'G's Academy ブロック崩し'の文字を画面上へ表示させる関数
            font: `22px 'ＭＳ Ｐゴシック'`, //文字サイズとフォントスタイルを指定
            text: `ブロック崩しゲーム` //表示させるテキスト
        }, canvas.width / 2, 30); //表示座標を指定
        util.displayText({ //経過時間を表示させる
            position: 'left', //positionを指定
            text: `Time : ${gs.countTime}`
        }, 20, 50);
        util.displayText({ //ベストタイムを表示させる
            position: 'right', //positionを指定
            text: `BestTime : ${gs.bestTime}` //表示テキストを指定
        }, canvas.width - 20, 50); //表示座標を指定
        if (gs.gameClearDisplayTime) { //gameClearDisplayTimeが0以外の場合
            util.displayText({ //gameclearテキストを表示させる処理を記述
                font: `50px 'ＭＳ Ｐゴシック'`,
                color: `rgb(${util.rand(255)},${util.rand(255)},${util.rand(255)})`,
                text: 'game clear!!'
            }, canvas.width / 2, canvas.height / 2); //game clear!の文字を画面に表示
            gs.gameClearDisplayTime--; //gameClearDisplayTimeをデクリメントし、0になるまではgameclearを表示
        } else if (gs.gameOverDisplayTime) { //gameOverDisplayTimeが0以外の場合
            util.displayText({ //gameOverテキストを表示させる処理を記述
                font: `40px 'ＭＳ Ｐゴシック'`,
                color: COLOR_ARY.PURPLE,
                text: 'Game Over...'
            }, canvas.width / 2, canvas.height / 2); //game clear!の文字を画面に表示
            gs.gameOverDisplayTime--; //gameOverDisplayTimeをデクリメントし、0になるまではgameclearを表示
        }
        if(gs.ready){
            util.drawRect(p.posX, p.posY, p.width, p.height, p.color); //自機を描画する
        }

        //理解しやすくする為に、変数を用意
        let ballX = ba.posX - ba.radius; //ボールを描画する為の基準x座標
        let ballY = ba.posY - ba.radius; //ボールを描画する為の基準y座標
        let ballW = ba.diameter; //ボール画像幅
        let ballH = ba.diameter; //ボール画像高さ
        if(gs.ready){
            ctx.drawImage(ba.imgPath, ballX, ballY, ballW, ballH); //ボールを描画
        }
        requestAnimationFrame(loop);
    }
    loop();



    //------------------------------------------------------------------------------------各種イベントの設定
    document.addEventListener('keydown', keyDown); //キーを押した時、呼び出される関数を指定
    document.addEventListener('keyup', keyUp); //キーを離した時、呼び出される関数を指定
    canvas.addEventListener('click', startStop); //canvas要素をクリックした際に、startStop関数が実行されるようにする。
    window.addEventListener('deviceorientation', event => { // deviceorientationイベントで、デバイスの回転を継続的に取得
        // 回転軸
        // event.alpha; // 使用せず
        // event.beta; // 使用せず
        let gamma = event.gamma; //
        if (gamma < -5) { //gammaの値が−5以下になった際に
            p.moveLeft = true; //自機を左に動かす
        } else if (gamma > 5) { //gammaの値が5以上になった際に
            p.moveRight = true; //自機を右に動かす
        } else {
            p.moveLeft = false; //gammaの値が−5〜5の場合は
            p.moveRight = false; //自機を停止させる
        }
    });
    document.addEventListener('DOMContentLoaded', () => { //DOM要素の読み込みが完了したら
        if(gs.bestTime = localStorage.getItem('bestTime')) return; //gsオブジェクトの.bestTimeプロパティへ、ローカルストレージに保存されているbestTimeの値を格納
        gs.bestTime = ''; //gs.bestTimeがなければ空の文字列を格納する
    });
})();
