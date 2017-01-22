//-------------------------------------------------class
function Item(x, y, speed, logoImgPath, type) {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.alive = false;
    this.logoImgWidth = 25;
    this.logoImgHeight = 25;
    this.logoImg = new Image();
    this.setPosition(x, y, speed, logoImgPath);
    this.type = type;
}

Item.prototype.setPosition = function (x, y, speed, logoImgPath){
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.alive = true;
    this.logoImg.src = logoImgPath;
}

Item.prototype.move = function (){
    this.y += this.speed;
}


//----------------------------------
// function Item( logoPath ){
//   this.logoImg = new Image();
//   this.logoImgWidth = 25;
//   this.logoImgHeight = 25;
//   this.logoImg.src = logoPath;
// }
