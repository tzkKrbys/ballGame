//-------------------------------------------------class
function Item(x, y, speed, logoImgPath, type) {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.alive = false;
    this.width = 25;
    this.height = 25;
    this.diameter = 25;
    this.radius = 12.5;
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
//   this.width = 25;
//   this.height = 25;
//   this.logoImg.src = logoPath;
// }
