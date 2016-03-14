window.onload = function() {
    // Canvas未サポートは実行しない
    if (!window.HTMLCanvasElement) return;
    var canvas = document.querySelector('#canvas');
    var ctx = canvas.getContext('2d');

    //初期設定部分。ここで使用する変数や関数、イベントなどを定義しておく。
    var count = 0;
    var isGameStarted = false; //bool値
    var moveLeft; //bool値
    var moveRight; //bool値
    // var _isRunning;
    var _animationID;
    //----------------------------------------ボールの変数
    var speedX; //移動速度x成分
    var speedY; //移動速度y成分
    var speed = 6; //移動速度

    var BallX; //X軸の位置
    var BallY; //y軸の位置

    //----------------------------------------自機の変数
    var rectSpeedX; //移動速度
    var rectSpeedY; //移動速度
    var rectX; //X軸の位置
    var rectY; //y軸の位置
    var rectWidth = 100; //y軸の位置
    var rectHeight = 10; //y軸の位置
    //ブロック
    var blocksMarginTop = 60;

    var countTime;
    var bestTime;

    var itemsAry = [];

    if(localStorage.getItem('bestTime')){
        bestTime = localStorage.getItem('bestTime');
    } else {
        bestTime = 0;
    }
    // console.log(bestTime);

    moveLeft = false;
    moveRight = false;
    // _isRunning = false;
    //----------------------------------------ボールの変数
    // speedX = 4; //移動速度
    speedY = -4.0; //移動速度
    speedX = Math.sqrt(Math.pow(speed,2) - Math.pow(speedY,2));
    // BallX = 50; //X軸の位置
    // BallY = 350; //y軸の位置

    //----------------------------------------実機の変数
    rectSpeedX = 8; //移動速度
    rectSpeedY = 1.3; //移動速度
    rectX = 0; //X軸の位置
    rectY = 450; //y軸の位置


    //----------------------sound
    select06 =      document.querySelector('#select06');
    button04a =     document.querySelector('#button04a');
    destruction1 =  document.querySelector('#destruction1');
    button05 =      document.querySelector('#button05');
    bgm =           document.querySelector('#bgm');
    fanfare =       document.querySelector('#fanfare');

    //----------------------------------------イベントの設定
    window.addEventListener('keydown', KeyDown, true); //キーを押した時、呼び出される関数を指定
    window.addEventListener('keyup', KeyUp, true); //キーを離した時、呼び出される関数を指定
    // document.querySelector('canvas').addEventListener('click', loop, true); //canvasをclickすると、loop関数がスタートする
    document.querySelector('canvas').addEventListener('click', function(){
        if(!isGameStarted){
            isGameStarted = true;
            gameStartFunc();
        }
    }, true); //canvasをclickすると、loop関数がスタートする
    // fanfare.play();
    function KeyDown(e) {
        switch (e.keyCode) {
            case 37: // ←キー
                moveLeft = true;
                break;
            case 39: // →キー
                moveRight = true;
                break;
            case 65: // Aキー
        			moveLeft = true;
        		break;
        	case 68: // Dキー
        			moveRight = true;
        		break;
            default:
                break;
        }
    }

    function KeyUp(e) {
        switch (e.keyCode) {
            case 37: // ←キー
                moveLeft = false;
                break;
            case 39: // →キー
                moveRight = false;
                break;
            case 65: // Aキー
        			moveLeft = false;
        		break;
        	case 68: // Dキー
        			moveRight = false;
        		break;
            default:
                break;
        }
    }




    /* フォントスタイルを定義 */
    ctx.font = "40px 'ＭＳ Ｐゴシック'";
    ctx.textAlign = "center";
    ctx.fillStyle = "#0066bb";
    ctx.fillText("click!", canvas.width / 2, 250);

    //ブロックを配置
    var blockAry = [
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [2,2,2,2,2,2,2,2]
    ];
    var blockPosition = 40;
    var blockHeight = 20;
    var blockWidth = ctx.canvas.width / blockAry[0].length;

    //ブロックの色を格納する配列
    var r = [];
    var g = [];
    var b = [];
    function initblocksColor(){
        for(var i = 0; i < blockAry.length; i++){
            r[i] = [];
            g[i] = [];
            b[i] = [];
            for(var j = 0; j < blockAry[i].length; j++){
                r[i][j] = Math.floor( Math.random() * 255 );
                g[i][j] = Math.floor( Math.random() * 255 );
                b[i][j] = Math.floor( Math.random() * 255 );
            }
        }
    }
    initblocksColor();

    var blocksObjAry = [];
    function createBlocksObjAry(){
        for(var i = 0; i < blockAry.length; i++){
            blocksObjAry[i] = [];
            for(var j = 0; j < blockAry[i].length; j++){
                blocksObjAry[i][j] = {};
                if( blockAry[i][j] ){
                    blocksObjAry[i][j].isExist = true;
                    blocksObjAry[i][j].hasItem = false;
                    blocksObjAry[i][j].color = [];
                    blocksObjAry[i][j].color.r = r[i][j];
                    blocksObjAry[i][j].color.g = g[i][j];
                    blocksObjAry[i][j].color.b = b[i][j];
                    if(blockAry[i][j] === 2){
                        blocksObjAry[i][j].hasItem = true;
                        blocksObjAry[i][j].item = new Item();
                        // blocksObjAry[i][j].item = new Item;
                    }
                }
            }
        }
    }
    createBlocksObjAry();
    console.log(blocksObjAry);

    //ブロックを描画する関数
    // function blockDrow(){
    //     for(var i = 0; i < blockAry.length; i++){
    //         for(var j = 0; j < blockAry[i].length; j++){
    //             if(blockAry[i][j]){
    //                 ctx.beginPath();
    //                 ctx.rect(blockWidth * j, blockHeight * i + blocksMarginTop, blockWidth, blockHeight);
    //                 ctx.fillStyle = 'rgb(' + r[i][j] + ', ' + g[i][j] + ', ' + b[i][j] + ')';//色をランダムに設定
    //                 ctx.fill();
    //             }
    //         }
    //     }
    // }
    function blockDrow(){
        for(var i = 0; i < blocksObjAry.length; i++){
            for(var j = 0; j < blocksObjAry[i].length; j++){
                if(blocksObjAry[i][j].isExist){
                    ctx.beginPath();
                    ctx.rect(blockWidth * j, blockHeight * i + blocksMarginTop, blockWidth, blockHeight);
                    ctx.fillStyle = 'rgb(' + blocksObjAry[i][j].color.r + ', ' + blocksObjAry[i][j].color.g + ', ' + blocksObjAry[i][j].color.b + ')';//色をランダムに設定
                    ctx.fill();
                }
            }
        }
    }
    // function itemFall(x) {
    //     alert(x);
    // }
    function Item() {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.alive = false;
        this.isFalling = false;
        // this.setPosition(x, y, speed);
    }
    Item.prototype.setPosition = function (x, y){
        this.x = x;
        this.y = y;
        this.speed = 1;
        this.alive = true;
        // this.isFalling = true;
    }
    Item.prototype.move = function (){
        this.y += this.speed;
    }
    Item.prototype.kill = function (){
        this.alive = false;
    }
    //ブロックとの当たり判定関数
    function blockHitJudgement(){
        var countBlock = 0;//現在のブロック個数をカウントする変数
        for(var i = 0; i < blocksObjAry.length; i++){
            for(var j = 0; j < blocksObjAry[i].length; j++){
                // if(blockAry[i][j]){
                if(blocksObjAry[i][j].isExist){
                    countBlock++;//現在のブロック個数をカウントアップ
                    var hit = false;//当たったかどうかのフラグ
                    //下辺との当たり判定
                    if( BallY - ( blockHeight * ( i + 1 ) + blocksMarginTop ) < logoHeight/2 &&
                    BallY - ( blockHeight * i + blocksMarginTop ) > logoHeight/2 &&
                     speedY < 0){
                        if( blockWidth * j < BallX && BallX < blockWidth * ( j + 1 ) ){
                            // blockAry[i][j] = 0;
                            speedY = -speedY;
                            hit = true;
                        }
                    }
                    //上辺との当たり判定
                    if( ((blockHeight * i) + blocksMarginTop) - BallY  < logoHeight/2 &&
                    (blockHeight * ( i + 1 ) + blocksMarginTop) - BallY > logoHeight/2 &&
                     0 < speedY ){
                        if( blockWidth * j < BallX && BallX < blockWidth * ( j + 1 )){
                            // blockAry[i][j] = 0;
                            speedY = -speedY;
                            hit = true;
                        }
                    }
                    //左辺との当たり判定
                    if( (blockHeight * i) + blocksMarginTop < BallY && BallY < blockHeight * i + blockHeight + blocksMarginTop ){
                        if((blockWidth * j) - BallX < logoWidth/2 &&
                        blockWidth * (j+1) - BallX > logoWidth/2 &&
                         speedX > 0 ){
                            // blockAry[i][j] = 0;
                            speedX = -speedX;
                            hit = true;
                        }
                    }
                    // //右辺との当たり判定
                    if( (blockHeight * i) + blocksMarginTop < BallY && BallY < blockHeight * (i+1) + blocksMarginTop ){
                        if( BallX - blockWidth * (j + 1) < logoWidth/2 &&
                        BallX - blockWidth * j > logoWidth/2 &&
                         speedX < 0 ){
                            // blockAry[i][j] = 0;
                            speedX = -speedX;
                            hit = true;
                        }
                    }
                    if( hit ) {//もし当たってたら音を鳴らす
                        if( blocksObjAry[i][j].hasItem ){
                            var width = blockWidth * j + blockWidth/2;
                            var height = blockHeight * i + blockHeight/2 + blocksMarginTop;
                            // tempItem.setPosition(width, height, 1);
                            itemsAry.push(new Item(width, height, 1));
                            // console.log(itemsAry);
                            blocksObjAry[i][j].item.alive = true;
                            blocksObjAry[i][j].item.isFalling = true;
                        }
                        // blockAry[i][j] = 0;
                        blocksObjAry[i][j].isExist = false;
                        button05.pause();
                        button05.currentTime = 0;
                        button05.play();
                        hit = false;
                    }
                }
            }
        }
        if(!countBlock){//現在のブロックが0個の場合
            //game clear!の文字を画面に表示
            ctx.font = "40px 'ＭＳ Ｐゴシック'";
            ctx.textAlign = "center";
            ctx.fillStyle = "#CC66bb";
            ctx.fillText("game clear!!", canvas.width / 2, 250);
            if(isGameStarted){
                isGameStarted = false;//ゲーム中のフラグを下す
                // bgm.pause();//BGMを停止
                // bgm.currentTime = 0;//BGM再生タイムを先頭へ
                fanfare.pause();
                fanfare.currentTime = 0;
                fanfare.play();
                if(countTime < bestTime){
                    bestTime = countTime;
                    localStorage.setItem('bestTime', bestTime);
                }
                // animationStop();
            }
        }
    }

    //関数群
    //初期化関数
    function gameStartFunc() {
        count = 0;
        moveLeft = false;
        moveRight = false;
        createBlocksObjAry();
        // blockAry = [
        //     [1,1,1,1,1,1,1,1],
        //     [1,1,1,1,1,1,1,1],
        //     [1,1,1,1,1,1,1,1],
        //     [2,2,2,2,2,2,2,2]
        // ];
        //----------------------------------------ボールの変数
        // speedY = -4.0; //移動速度
        speedY = -(Math.floor(Math.random() * 2.0) + 2 ); //移動速度
        speedX = Math.sqrt(Math.pow(speed,2) - Math.pow(speedY,2));
        if(Math.random() > 0.5){
            speedX = -speedX;
        }
        //BGMスタート
        // bgm.pause();
        // bgm.currentTime = 0;
        // bgm.play();
    }
    // init(); //一旦値を初期化する

    // function drawCircle(x, y, scale, color) {
    //     ctx.beginPath();
    //     ctx.arc(x, y, scale, 0, 2 * Math.PI, false);
    //     ctx.fillStyle = color;
    //     ctx.fill();
    // }

    function drawRect(x, y, width, height, color) {
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.fillStyle = color;
        ctx.fill();
    }

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
    function animationStop() {
        // _isRunning = false;
        cancelAnimationFrame(_animationID);
    }

    // loop();



    // img.onload = function() {
    //     ctx.drawImage(img, 50, 50);
    //     // ctx.drawImage(img, 0, 0, 50, 50);
    // };
    var img = new Image();
    var logoWidth = 25;
    var logoHeight = 25;
    img.src = "./images/gsacLogoBlue50x50.png";


    // -----------------------------------------------------------ループ関数
    //この関数内でいろんな値をupdateさせて、アニメーションさせる
    function loop() {
        _animationID = requestAnimFrame(loop);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);//canvasをクリア
        blockDrow();//ブロックを描画

        if(isGameStarted){
            count++;
            // ループ毎にxを加算し、ボールを１コマ毎に移動させる
            BallX += speedX;
            BallY += speedY;
            // 円を描画
            // 変数xの値を変化させる
            if (BallX < logoWidth/2 && speedX < 0) {
                speedX = -speedX;
                button04a.pause();
                button04a.currentTime = 0;
                button04a.play();
            }
            if (ctx.canvas.width - BallX < logoWidth/2 && speedX > 0) {
                speedX = -speedX;
                button04a.pause();
                button04a.currentTime = 0;
                button04a.play();
            }
            // 変数yの値を変化させる
            if (BallY < 5) {
                speedY = -speedY;
                button04a.pause();
                button04a.currentTime = 0;
                button04a.play();
            }

            //ボールが最下部に到達してしまった場合にゲームを終了させる
            if (BallY > 495) {
                speedX = 0; //移動速度
                speedY = 0; //移動速度
                destruction1.pause();
                destruction1.currentTime = 0;
                destruction1.play();
                /* フォントスタイルを定義 */
                ctx.font = "40px 'ＭＳ Ｐゴシック'";
                ctx.fillStyle = "#0066bb";
                ctx.textAlign = "center";
                ctx.fillText("game over", canvas.width / 2, 250);
                // bgm.pause();
                // bgm.currentTime = 0;
                isGameStarted = false;
                // animationStop(_animationID);
            }
            //----------------------------------------------------------item
            // if(itemsAry.length) {
            //     for(var i = 0; i < itemsAry.length; i++){
            //         itemsAry[i].move();
            //
            //         // console.log('itemAry %d, %d', i, itemsAry[i].y);
            //
            //         ctx.drawImage(img, itemsAry[i].x - 25/2, itemsAry[i].y - 25/2, 25, 25);
            //         //自機との当たり判定
            //         if (rectY - (itemsAry[i].y + 25/2) < 0 &&
            //             (rectY + rectHeight) - (itemsAry[i].y + 25/2) > 0 ) {
            //             if (itemsAry[i].x > rectX && itemsAry[i].x < (rectX + rectWidth)) {
            //                 itemsAry.splice(i, 1);
            //                 rectWidth += 40;
            //                 rectX -= 20;
            //                 // animationStop();
            //                 // select06.pause();
            //                 // select06.currentTime = 0;
            //                 // select06.play();
            //             }
            //         }else if(itemsAry[i].y > ctx.canvas.height + 25/2){//画面外に出た場合、配列から削除する
            //             itemsAry.splice(i, 1);
            //         }
            //     }
            // }
            for(var i = 0; i < blocksObjAry.length; i++){
                for(var j = 0; j < blocksObjAry[0].length; j++){
                    // console.log(blocksObjAry[i][j]);
                    // if( blocksObjAry[i][j].hasItem && blocksObjAry[i][j].item.alive ){
                    if( blocksObjAry[i][j].item && blocksObjAry[i][j].item.alive ){
                        blocksObjAry[i][j].item.move();
                        console.log(blocksObjAry[i][j]);

                    }
                }
            }

            //自機との当たり判定
            // if (BallY + logoHeight/2 > rectY && BallY < rectY + rectHeight && speedY > 0) {
            if (rectY - BallY < logoHeight/2 &&
                (rectY + rectHeight) - BallY > logoHeight/2 &&
                speedY > 0) {
                if (BallX > rectX && BallX < (rectX + rectWidth)) {
                    if(moveLeft){
                        speedX = speedX - 1;
                    } else if (moveRight) {
                        speedX = speedX + 1;
                    }
                    if(speedX >= 6){
                        speedX = 5.9;
                    }else if(speedX <= -6){
                        speedX = -5.9;
                    }
                    speedY = Math.sqrt(Math.pow(speed,2) - Math.pow(speedX,2));
                    speedY = -speedY;
                    select06.pause();
                    select06.currentTime = 0;
                    select06.play();
                }
            }
        } else {//ゲーム中で
            BallX = rectX + rectWidth/2;
            BallY = rectY - logoHeight/2;
        }
        ctx.drawImage(img, BallX - logoWidth / 2, BallY - logoHeight / 2, 25, 25);


        // drawCircle(BallX, BallY, 6, '#60A869'); //関数を実行し、変化した変数を引数に渡して円を描画する

        //自機の変数の値を変化させる
        if (moveLeft) {//もし左キーが押されていたら
            rectX -= rectSpeedX;
        }
        if (moveRight) {//もし右キーが押されていたら
            rectX += rectSpeedX;
        }
        if (rectX < 0) {
            rectX = 0;
        } else if ((rectX + rectWidth) - ctx.canvas.width  > 0) {
            rectX = ctx.canvas.width - rectWidth;
        }

        // lastPosition = rectX;

        drawRect(rectX, rectY, rectWidth, rectHeight, "#294");//自機を描画する

        blockHitJudgement();
        countTime = Math.floor(count / 60);
        document.getElementById("count").innerHTML = 'TIME : ' + countTime;
        document.getElementById("bestTime").innerHTML = 'BEST TIME : ' + bestTime;

    }
    loop();
};
