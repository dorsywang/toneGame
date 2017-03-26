'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WIDTH = 400;
var HEIGHT = 400;

var EARTH_TOP = 300;
var G = 0.2 / 1000;

var Earth = function () {
    function Earth(left) {
        var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 30;

        _classCallCheck(this, Earth);

        this.left = left;
        this.top = EARTH_TOP;

        this.width = width;

        this.height = 20;
    }

    // left, width
    // dx dy代表实际的坐标原点的差值


    _createClass(Earth, [{
        key: 'draw',
        value: function draw(ctx, time, dx, dy) {
            ctx.fillRect(this.left - dx, this.top - dy, this.width, this.height);
        }
    }]);

    return Earth;
}();

var Layer = function () {
    function Layer(zIndex) {
        _classCallCheck(this, Layer);

        this.sprites = [];

        this.dx = 0;
        this.dy = 0;
    }

    _createClass(Layer, [{
        key: 'add',
        value: function add(sprite) {
            this.sprites.push(sprite);
        }
    }, {
        key: 'draw',
        value: function draw(ctx, time) {
            var _this = this;

            this.sprites.map(function (item) {
                return item.draw(ctx, time, _this.dx, _this.dy);
            });
        }
    }, {
        key: 'move',
        value: function move(dx) {
            this.dx = dx;
        }
    }, {
        key: 'start',
        value: function start() {
            this.sprites.map(function (item) {
                return item.start && item.start();
            });
        }
    }]);

    return Layer;
}();

var BackStage = function (_Layer) {
    _inherits(BackStage, _Layer);

    function BackStage(zIndex) {
        _classCallCheck(this, BackStage);

        return _possibleConstructorReturn(this, (BackStage.__proto__ || Object.getPrototypeOf(BackStage)).call(this, zIndex));
    }

    return BackStage;
}(Layer);

var Actor = function () {
    function Actor() {
        var left = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 20;

        _classCallCheck(this, Actor);

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

    _createClass(Actor, [{
        key: 'draw',
        value: function draw(ctx, time, dx, dy) {

            var dtime = time - this.lastTime;

            this.lastTime = time;

            var frameActionsArr = [];
            for (var i in this.frameActions) {
                var item = this.frameActions[i];

                if (this.frameActions.hasOwnProperty(i) && typeof item === 'function') {

                    frameActionsArr.push({
                        func: item,
                        order: typeof item.order === 'undefined' ? 1 : item.order
                    });
                }
            }

            frameActionsArr.sort(function (a, b) {
                return a - b;
            }).map(function (item) {
                item.func(dtime, time);
            });

            ctx.beginPath();

            ctx.arc(this.left - dx, this.top - dy, this.r, 0, Math.PI * 2);

            ctx.fill();
        }
    }, {
        key: 'checkCollision',
        value: function checkCollision(layer) {
            var _this3 = this;

            var sprites = layer.sprites;


            var inAera = function inAera(a, min, max) {
                return (max - a) * (a - min) >= 0;
            };

            var insideRectInYAsis = function insideRectInYAsis(item, rect) {
                return inAera(item.top, rect.top, rect.top + rect.height);
            };

            var insideRectInXAsis = function insideRectInXAsis(item, rect) {
                return inAera(item.left, rect.left, rect.left + rect.width);
            };

            var checker = function checker() {
                var currCollisionInfo = [];

                sprites.map(function (item) {
                    if (item !== _this3) {
                        if (item instanceof Earth) {
                            if (inAera(item.left, _this3.left, _this3.left + _this3.r) && insideRectInYAsis(_this3, item)) {
                                currCollisionInfo.push({
                                    pos: 'rightSide',
                                    item: item,
                                    type: 'earth'
                                });
                            }

                            if (inAera(item.left + item.width, _this3.left - _this3.r, _this3.left) && insideRectInYAsis(_this3, item)) {
                                currCollisionInfo.push({
                                    pos: 'leftSide',
                                    item: item,
                                    type: 'earth'
                                });
                            }

                            if (inAera(item.top, _this3.top, _this3.top + _this3.r) && insideRectInXAsis(_this3, item)) {
                                currCollisionInfo.push({
                                    pos: 'bottomSide',
                                    item: item,
                                    type: 'earth'
                                });
                            }
                        }
                    }
                });

                _this3.currCollisionInfo = currCollisionInfo;
            };

            this.checkCollisionChecker = checker;

            //this.frameActions.checkCollision = checker;
            //this.frameActions.checkCollision.order = 2;
        }

        // 

    }, {
        key: 'moveForward',
        value: function moveForward(v) {
            var _this4 = this;

            //this.left += v;

            // 一次按v的速进行 0.5s 
            this.frameActions.move = function () {
                var time = 200;
                var speed = v;
                var startTime = void 0;

                return function (dtime, currTime) {
                    if (!startTime) {
                        startTime = currTime;
                    }

                    if (currTime - startTime > time) {
                        return;
                    }

                    var dLen = dtime * speed;

                    _this4.left += dLen;
                };
            }();
        }
    }, {
        key: 'contineMoveForward',
        value: function contineMoveForward(v) {
            var _this5 = this;

            this.frameActions.move = function (dtime) {
                _this5.left += v * dtime;
            };
        }
    }, {
        key: 'stopMoveForward',
        value: function stopMoveForward() {
            delete this.frameActions.move;
        }
    }, {
        key: 'start',
        value: function start() {
            var forwardSpeed = 40 / 1000;

            this.moveUp();
            this.contineMoveForward(forwardSpeed);
        }
    }, {
        key: 'moveUp',
        value: function moveUp(v0) {
            var _this6 = this;

            this.frameActions.moveUp = function (dtime, currTime) {
                // v0 * t + 1/2 a t * t
                _this6.v0Y = _this6.v0Y + _this6.aY * dtime;

                _this6.top += _this6.v0Y * dtime;

                //if(this.top >= originTop){

                // 这个时候再进行碰撞检测
                _this6.checkCollisionChecker();

                var hasBottomSideCollision = false;
                var currCollisionInfo = _this6.currCollisionInfo;

                currCollisionInfo.map(function (item) {
                    if (item.pos === 'bottomSide') {
                        //  this.stopMoveUp();
                        _this6.v0Y = 0;
                        _this6.aY = 0;

                        // 修正位置
                        _this6.top = item.item.top - _this6.r;

                        hasBottomSideCollision = true;
                    }
                });

                if (!hasBottomSideCollision) {
                    _this6.aY = G;
                }
                //}
            };
        }
    }, {
        key: 'stopMoveUp',
        value: function stopMoveUp() {
            this.isMovingUp = false;
        }
    }, {
        key: 'doUp',
        value: function doUp(value) {
            console.log(value, 'do');
            if (this.aY === 0) {
                this.v0Y = -value / 1000;
            }
        }
    }, {
        key: 'bindMoveEvent',
        value: function bindMoveEvent() {
            var _this7 = this;

            window.addEventListener('keydown', function (e) {
                var keyCode = e.keyCode;

                var forwardSpeed = 40 / 1000;

                if (keyCode === 39) {
                    // this.contineMoveForward(forwardSpeed);
                } else if (keyCode === 37) {
                    // this.contineMoveForward(-forwardSpeed);
                } else if (keyCode === 38) {
                    _this7.doUp(-200 / 1000);
                }
            });

            window.addEventListener('keyup', function (e) {
                var keyCode = e.keyCode;

                if (keyCode === 39 || keyCode === 37) {
                    // this.stopMoveForward();
                }
            });
        }
    }]);

    return Actor;
}();

var Canvas = function Canvas(_ref) {
    var width = _ref.width,
        height = _ref.height;

    _classCallCheck(this, Canvas);

    var canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    document.body.appendChild(canvas);

    this.canvas = canvas;

    return this.canvas.getContext('2d');
};

var Stage = function () {
    _createClass(Stage, [{
        key: 'add',
        value: function add(sprite) {
            this.layers.push(sprite);
        }
    }, {
        key: 'addFrameAction',
        value: function addFrameAction(func) {
            this.frameActions.push(func);
        }
    }]);

    function Stage(_ref2) {
        var width = _ref2.width,
            height = _ref2.height;

        _classCallCheck(this, Stage);

        this.canvas = new Canvas({ width: width, height: height });
        this.width = width;
        this.height = height;

        this.layers = [];
        this.frameActions = [];

        this.timer = null;

        this.stopped = true;
    }

    _createClass(Stage, [{
        key: 'start',
        value: function start() {
            var _this8 = this;

            var _step = function _step() {
                if (_this8.stopped) {
                    return;
                }

                _this8.draw();
                _this8.frameActions.map(function (item) {
                    item();
                });

                window.requestAnimationFrame(_step);
            };

            this.startTime = +new Date();
            this.stopped = false;

            _step();

            this.layers.map(function (item) {
                return item.start && item.start();
            });
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.stopped = true;
        }
    }, {
        key: 'draw',
        value: function draw() {
            var _this9 = this;

            this.canvas.clearRect(0, 0, this.width, this.height);

            var currTime = +new Date() - this.startTime;
            this.layers.map(function (item) {
                return item.draw(_this9.canvas, currTime);
            });
        }
    }]);

    return Stage;
}();

var Camera = function () {
    function Camera(stage) {
        _classCallCheck(this, Camera);

        this.left = 0;

        this.cameraWidth = WIDTH;

        this.stage = stage;
    }

    //追踪


    _createClass(Camera, [{
        key: 'focus',
        value: function focus(actor) {
            var _this10 = this;

            var checker = function checker() {
                var dLen = 100;
                if (actor.left < _this10.left + dLen) {
                    _this10.move(actor.left - dLen);
                } else if (actor.left > _this10.left + _this10.cameraWidth - dLen) {
                    _this10.move(actor.left - _this10.cameraWidth + dLen);
                }
            };

            this.stage.addFrameAction(checker);
        }
    }, {
        key: 'move',
        value: function move(left) {
            var stage = this.stage;
            var layers = stage.layers;


            layers.map(function (item) {
                item.move(left);
            });

            this.left = left;
        }
    }]);

    return Camera;
}();

var p = new Stage({ width: WIDTH, height: HEIGHT });

var backStage = new BackStage(10);

backStage.add(new Earth(20, 200));
backStage.add(new Earth(240, 100));
backStage.add(new Earth(380, 100));
backStage.add(new Earth(500, 100));
backStage.add(new Earth(620, 100));

var actor = new Actor();
backStage.add(actor);

actor.checkCollision(backStage);

p.add(backStage);

var camera = new Camera(p);

camera.focus(actor);

var audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // define audio context


var voiceCanvasWidth = 400;
var voiceCanvasHeight = 200;
var voiceCanvas = new Canvas({ width: voiceCanvasWidth, height: voiceCanvasHeight });

navigator.getUserMedia({ audio: true }, function (s) {
    console.log('aa' + Math.random());
    var source = audioCtx.createMediaStreamSource(s);
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
    setInterval(function () {
        analyser.getByteFrequencyData(dataArray);

        var sum = 0;
        var width = voiceCanvasWidth / dataArray.length * 2.5;

        voiceCanvas.clearRect(0, 0, voiceCanvasWidth, voiceCanvasHeight);

        dataArray.map(function (item, index) {
            sum += item * index;
            var x = index * width;

            voiceCanvas.fillRect(x, 0, width, item);
        });

        var averageFreq = sum / dataArray.length;

        var dtime = +new Date() - startTime;

        allSum += averageFreq;

        var newLoop = function newLoop() {
            startTime = +new Date();
            allSum = 0;

            muteStartTime = null;
        };

        if (averageFreq < 100) {

            if (!muted) {
                muteStartTime = +new Date();
            }

            muted = true;

            var muteLen = +new Date() - muteStartTime;
            //console.log(dtime, muteLen);

            if (muteLen > 30 && startCheck) {
                var averFreq = allSum / (dtime - muteLen);
                console.log(averFreq);

                actor.doUp(averFreq);

                startCheck = false;
            } else {}
        } else {
            muted = false;
            startCheck = true;
            newLoop();
        }
    }, 1 / 60);
}, function (e) {
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
