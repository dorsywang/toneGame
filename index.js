const WIDTH = 400;
const HEIGHT = 400;

const EARTH_TOP = 300;

class Earth{
    constructor(left, width = 30){
        this.left = left;
        this.top = EARTH_TOP;

        this.width = width;

        this.height = 20;
    }

    draw(ctx, time){
        ctx.fillRect(this.left, this.top, this.width, this.height);
    }
}

class Layer{
    constructor(){
        this.sprites = [];
    }

    add(sprite){
        this.sprites.push(sprite);
    }

    draw(ctx, time){
        this.sprites.map((item) => item.draw(ctx, time));
    }

    move(dx){
    }
}

class BackStage extends Layer{
    constructor(){
        super();
    }
}

class Actor{
    constructor(left = 20){
        this.lastTime = 0;

        this.left = left;
        this.top = EARTH_TOP;
        this.r = 20;
    }

   

    draw(ctx, time){

        let dtime = time - this.lastTime;


        this.lastTime = time;

        ctx.beginPath();

        ctx.arc(this.left, this.top, this.r, 0, Math.PI * 2);

        ctx.fill();
    }

    moveForward(v){
    }
}

class Canvas{
    constructor({width, height}){
        let canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        document.body.appendChild(canvas);

        this.canvas = canvas;

        return this.canvas.getContext('2d');
    }
}

class Stage{
    add(sprite){
        this.sprites.push(sprite);
    }

    constructor({width, height}){
        this.canvas = new Canvas({width: width, height: height});
        this.width = width;
        this.height = height;

        this.sprites = [];

        this.timer = null;
    }

    start(){
        let _step = () => {
            this.draw();

            this.timer = setTimeout(_step, 1 / 60);
        };

        this.startTime = + new Date();

        this.timer = setTimeout(_step, 1 / 60);
    }

    stop(){
        clearTimeout(this.timer);
    }

    draw(){
        this.canvas.clearRect(0, 0, this.width, this.height);

        var currTime = + new Date() - this.startTime;
        this.sprites.map((item) => item.draw(this.canvas, currTime));
    }
}

let p = new Stage({width: WIDTH, height: HEIGHT});

p.add(new Actor());


let backStage = new BackStage();
backStage.add(new Earth(20, 10));
backStage.add(new Earth(40, 10));
backStage.add(new Earth(55, 10));

p.add(backStage);

p.start();

