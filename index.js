const WIDTH = 400;
const HEIGHT = 400;

const EARTH_TOP = 300;
const G = 0.2 / 1000;

class Earth{
    constructor(left, width = 30){
        this.left = left;
        this.top = EARTH_TOP;

        this.width = width;

        this.height = 20;
    }

    // left, width
    // dx dy代表实际的坐标原点的差值
    draw(ctx, time, dx, dy){
        ctx.fillRect(this.left - dx, this.top - dy, this.width, this.height);
    }
}

class Layer{
    constructor(zIndex){
        this.sprites = [];

        this.dx = 0;
        this.dy = 0;
    }

    add(sprite){
        this.sprites.push(sprite);
    }

    draw(ctx, time){
        this.sprites.map((item) => item.draw(ctx, time, this.dx, this.dy));
    }

    move(dx){
        this.dx = dx;
    }

    start(){
        this.sprites.map(item => item.start && item.start());
    }
}

class BackStage extends Layer{
    constructor(zIndex){
        super(zIndex);
    }
}

class Actor{
    constructor(left = 20){
        this.lastTime = 0;

        this.left = left;
        this.r = 20;
        this.top = EARTH_TOP - this.r;

        // Y方向的当前速度
        this.v0Y = 0;
        this.aY = 0;

        this.frameActions = {};

        this.bindMoveEvent();
    }

   

    draw(ctx, time, dx, dy){

        let dtime = time - this.lastTime;

        this.lastTime = time;

        var frameActionsArr = [];
        for(let i in this.frameActions){
            let item = this.frameActions[i];

            if(this.frameActions.hasOwnProperty(i) && typeof item === 'function'){

                frameActionsArr.push({
                    func: item,
                    order: typeof item.order === 'undefined' ? 1 : item.order
                });
            }
        }

        frameActionsArr.sort((a, b) => {
            return a - b;
        }).map(item => {
            item.func(dtime, time);
        });

        ctx.beginPath();

        ctx.arc(this.left - dx, this.top - dy, this.r, 0, Math.PI * 2);

        ctx.fill();
    }

    checkCollision(layer){
        let {sprites} = layer;

        let inAera = (a, min, max) => (max - a) * (a - min) >= 0;

        let insideRectInYAsis = (item, rect) => inAera(item.top, rect.top, rect.top + rect.height);

        let insideRectInXAsis = (item, rect) => inAera(item.left, rect.left, rect.left + rect.width);

        let checker = () => {
            let currCollisionInfo = [];

            sprites.map(item => {
                if(item !== this){
                    if(item instanceof Earth){
                        if(inAera(item.left, this.left, this.left + this.r) && insideRectInYAsis(this, item)){
                            currCollisionInfo.push({
                                pos: 'rightSide',
                                item: item,
                                type: 'earth'
                            });
                        }

                        if(inAera(item.left + item.width, this.left - this.r,  this.left) && insideRectInYAsis(this, item)){
                            currCollisionInfo.push({
                                pos: 'leftSide',
                                item: item,
                                type: 'earth'
                            });
                        }

                        if(inAera(item.top,  this.top, this.top + this.r) && insideRectInXAsis(this, item)){
                            currCollisionInfo.push({
                                pos: 'bottomSide',
                                item: item,
                                type: 'earth'
                            });

                        }
                    }
                }
            });

            this.currCollisionInfo = currCollisionInfo;
        };

        this.checkCollisionChecker = checker;


        //this.frameActions.checkCollision = checker;
        //this.frameActions.checkCollision.order = 2;
    }

    // 
    moveForward(v){
        //this.left += v;

        // 一次按v的速进行 0.5s 
        this.frameActions.move = (() => {
            let time = 200;
            let speed = v;
            let startTime;

            return (dtime, currTime) => {
                if(! startTime){
                    startTime = currTime;
                }

                if(currTime - startTime > time){
                    return;
                }

                var dLen = dtime * speed;

                this.left += dLen;
            };
        })();
    }

    contineMoveForward(v){
        this.frameActions.move = (dtime) => {
            this.left += v * dtime;
        };
    }

    stopMoveForward(){
        delete this.frameActions.move;
    }

    start(){
        var forwardSpeed = 40 / 1000;

        this.moveUp();
        this.contineMoveForward(forwardSpeed);
    }

    moveUp(v0){
        this.frameActions.moveUp = (dtime, currTime) => {
                // v0 * t + 1/2 a t * t
                this.v0Y = this.v0Y + this.aY * dtime;

                this.top += this.v0Y * dtime;

                //if(this.top >= originTop){

                // 这个时候再进行碰撞检测
                this.checkCollisionChecker();

                let hasBottomSideCollision = false;
                let currCollisionInfo = this.currCollisionInfo;

                currCollisionInfo.map(item => {
                    if(item.pos === 'bottomSide'){
                      //  this.stopMoveUp();
                        this.v0Y = 0;
                        this.aY = 0;

                        // 修正位置
                        this.top = item.item.top - this.r;

                        hasBottomSideCollision = true;
                    }
                });

                if(! hasBottomSideCollision){
                    this.aY = G;
                }
                //}

        };
       
    }

    stopMoveUp(){
        this.isMovingUp = false;
    }

    doUp(value){
        console.log(value, 'do');
        if(this.aY === 0){
            this.v0Y = - value / 1000;
        }
    }


    bindMoveEvent(){
        window.addEventListener('keydown', e => {
            let keyCode = e.keyCode;

            var forwardSpeed = 40 / 1000;
            
            if(keyCode === 39){
               // this.contineMoveForward(forwardSpeed);
            }else if(keyCode === 37){
               // this.contineMoveForward(-forwardSpeed);
            }else if(keyCode === 38){
                this.doUp(- 200 / 1000);
            }


        });

        window.addEventListener('keyup', e => {
            let keyCode = e.keyCode;

            if(keyCode === 39 || keyCode === 37){
               // this.stopMoveForward();
            }
        });
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
        this.layers.push(sprite);
    }

    addFrameAction(func){
        this.frameActions.push(func);
    }

    constructor({width, height}){
        this.canvas = new Canvas({width: width, height: height});
        this.width = width;
        this.height = height;

        this.layers= [];
        this.frameActions = [];

        this.timer = null;

        this.stopped = true;
    }

    start(){
        let _step = () => {
            if(this.stopped){
                return;
            }

            this.draw();
            this.frameActions.map(item => {
                item();
            });

            window.requestAnimationFrame(_step);
        };

        this.startTime = + new Date();
        this.stopped = false;

        _step();

        this.layers.map(item => item.start && item.start());

    }

    stop(){
        this.stopped = true;
    }

    draw(){
        this.canvas.clearRect(0, 0, this.width, this.height);

        var currTime = + new Date() - this.startTime;
        this.layers.map((item) => item.draw(this.canvas, currTime));
    }
}

class Camera{
    constructor(stage){
        this.left = 0;

        this.cameraWidth = WIDTH;

        this.stage = stage;
    }

    //追踪
    focus(actor){
        var checker = () => {
            var dLen = 100;
            if(actor.left < this.left + dLen){
                this.move(actor.left - dLen);
            }else if(actor.left > this.left + this.cameraWidth - dLen){
                this.move(actor.left - this.cameraWidth + dLen);
            }
        };

        this.stage.addFrameAction(checker);
    }

    move(left){
        let {stage} = this;
        
        let {layers} = stage;

        layers.map(item => {
            item.move(left);
        });

        this.left = left;


    }
}

let p = new Stage({width: WIDTH, height: HEIGHT});


let backStage = new BackStage(10);

backStage.add(new Earth(20, 200));
backStage.add(new Earth(240, 100));
backStage.add(new Earth(380, 100));
backStage.add(new Earth(500, 100));
backStage.add(new Earth(620, 100));

let actor = new Actor();
backStage.add(actor);

actor.checkCollision(backStage);

p.add(backStage);

let camera = new Camera(p);

camera.focus(actor);

var audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // define audio context


var voiceCanvasWidth = 400;
var voiceCanvasHeight = 200;
var voiceCanvas = new Canvas({width: voiceCanvasWidth, height: voiceCanvasHeight});

navigator.getUserMedia({audio: true}, (s) => {
    console.log('aa' + Math.random());
    let source = audioCtx.createMediaStreamSource(s);
    var analyser = audioCtx.createAnalyser();


    source.connect(analyser);
    //analyser.connect(audioCtx.destination);

    analyser.fftSize = 256;

    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    var startTime;
    var allSum = 0;;
    var muteStartTime;
    var muted = false;
    var startCheck = false;
    setInterval(function(){
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        var width = voiceCanvasWidth / dataArray.length * 2.5;

        voiceCanvas.clearRect(0, 0, voiceCanvasWidth, voiceCanvasHeight);

        dataArray.map((item, index) => {
            sum += item * index;
            var x = index * width;

            voiceCanvas.fillRect(x, 0, width, item);
        }); 

        var averageFreq = sum /dataArray.length;

        var dtime = + new Date - startTime;

        allSum += averageFreq;

        var newLoop  = function(){
            startTime = + new Date();
            allSum = 0;

            muteStartTime = null;
        };

        if(averageFreq < 100){

            if(! muted){
                muteStartTime = + new Date();
            }

            muted = true;

            var muteLen = + new Date() - muteStartTime;
            //console.log(dtime, muteLen);

            if(muteLen > 30 && startCheck){
                var averFreq = allSum / (dtime - muteLen);
                console.log(averFreq);

                actor.doUp(averFreq);

                startCheck = false;

            }else{
            }


        }else{
            muted = false;
            startCheck = true;
            newLoop();
        }

    }, 1/ 60);
}, e => {
    console.log('error', e);
});

/*
window.addEventListener('keydown', function(e){
    let {keyCode} = e;

    if(keyCode === 38){
        camera.move(10);
    }

});
*/

p.start();


