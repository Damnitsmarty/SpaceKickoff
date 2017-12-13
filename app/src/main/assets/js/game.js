/**
 * The main game namespace.
 * Contains all objects related to the game
 * @namespace
 */
var game = {
    /**
     * Enum of game states
     * @namespace
     * @property {number} NOTSTARTED    Game is not started
     * @property {number} GAMEOVER      GameOver screen is displayed
     * @property {number} PAUSED        Game is started, but paused
     * @property {number} PLAYING       Game is started and currently played
     */
    PlayState: {
        NOTSTARTED:0,
        GAMEOVER:1,
        PAUSED:2,
        PLAYING:3,
    },
    /**
    * A palette of the game's colours
    * @namespace
    * @property {string} black    #333333
    * @property {string} white    #eeeeee
    * @property {string} red      #fe4365
    * @property {string} orange   #fc9d9a
    * @property {string} yellow   #f9cdad
    * @property {string} lgreen   #c8c8a9
    * @property {string} green    #83af9b
    */
    Colours: {
        black:'#333333',
        white:'#eeeeee',
        red:'#fe4365',
        orange:'#fc9d9a',
        yellow: '#f9cdad',
        lgreen: '#c8c8a9',
        green: '#83af9b',

        /** Generates a transparent version of the given colour
         * @param {string} c Colour to make transparent
         * @returns {string}
         */
        transparent: function(c){
         return c;// + '73';
        }
    },

    //--Properties--//
    // non-initializable
    /**
     * Indicates whether the game is in debugging mode and debug draws should be called
     * @type {boolean}
     */
    debug:      false,
    /**
     * The animation frame ID for the game's render
     * @type {number}
     */
    frameId:    null,

    // initialized in init()
    /**
     * The current PlayState of the game
     * @type {game.PlayState}
     */
    playstate:  null,

    /**
     * The Canvas context associated with the game
     * @type {CanvasContext2D}
     */
    ctx:        null,

    /**
     * The Background Drawable
     * @type {Drawable}
     */
    bcg:        null,
    /**
     * The field Drawable, positioned at the bottom of the canvas
     * at the start of the game
     * @type {Drawable}
     */
    bcgField:   null,

    // initialized in initGame()
    /**
     * The Ball object
     * @type {Ball}
     */
    ball:       null,
    /**
     * The Paddle object
     * @type {Paddle}
     */
    paddle:     null,

    //--Methods--//


    /**
     * Acts as the constructor of the object,
     * initializing all object variables used throughout the session
     */
    init: function(){
        //define canvas context
        game.ctx = document.getElementById("game").getContext('2d');

        //override canvas context methods for manipulating the top-left coordinate
        game.ctx.topLeft = {x:0,y:0};
        game.ctx.translate = function(x,y){
            Object.getPrototypeOf(game.ctx).translate.call(game.ctx,x,y);
            game.ctx.topLeft.x -=x;
            game.ctx.topLeft.y -=y;
        }
        game.ctx.setTopLeft = function(x,y){
            game.ctx.translate(x + game.ctx.topLeft.x, y + game.ctx.topLeft.y);
        }

        //initialize the playstate
        game.playstate = game.PlayState.NOTSTARTED;

        //load audio assets
        sfx.load('start','sound/whistle-start-a.wav',0.1);
        sfx.load('gameover','sound/whistle-end-a.wav',0.1);
        sfx.load('bounce','sound/261267__musita182__soccer-kick.wav');
        sfx.load('music','sound/365361__4barrelcarb__island-dance.mp3', 0.5, true, true); //looping, singleton
        sfx.load('audienceBcg','sound/234903__ikbenraar__soccer-audience.wav', 0.1, true, true); //looping, singleton
        //load image assets
        game.bcg =      new Drawable('img/bcg.png').setSize(game.ctx.canvas.width,100000).setPos(0,-100000 + game.ctx.canvas.height);
        game.bcgField = new Drawable('img/field.png').setSize(game.ctx.canvas.width,355).setPos(0,game.ctx.canvas.height-355);
    },


    /**
     * Renders one frame of the game onto the associated canvas.
     * Serves as the main game loop
     */
    renderFrame: function(){
        //clear the canvas
        game.ctx.clearRect(game.ctx.topLeft.x,game.ctx.topLeft.y,game.ctx.canvas.width,game.ctx.canvas.height);

        // Update the ball's velocity
        // and check for collisions with the paddle
        game.ball.update();
        game.ball.checkForCollisions();
        // Paddle updates via Touch Events and should not be updated here

        // Draw Order:
        // Background
        // Football Field
        // UI-Left ruler
        // Ball
        // Paddle
        // UI-Bottom Information
        // Debug
        game.bcg.draw();
        game.bcgField.draw();
        game.drawLeftUI();
        game.ball.draw();
        game.paddle.draw();
        game.drawBottomUI();
        if(game.debug){
            game.paddle.debugDraw();
            game.ctx.beginPath()
            game.ctx.moveTo(0,-30);
            game.ctx.lineTo(0,30);
            game.ctx.moveTo(-30,0);
            game.ctx.lineTo(30,0);
            game.ctx.closePath();
            game.ctx.stroke();
        }
        //continue animation only if PLAYING (stops initial render from updating physics)
        if(game.playstate >= game.PlayState.PLAYING) game.frameId = window.requestAnimationFrame(game.renderFrame);
    },

    /**
     * Draws the left part of the UI (the ruler)
     */
    drawLeftUI: function(){
        // save the canvas state
        game.ctx.save();
        // modify style
        game.ctx.lineWidth = 8;
        game.ctx.fillStyle = game.ctx.strokeStyle = game.Colours.black;
        game.ctx.font = "50px Barlow";
        game.ctx.textBaseline = 'middle'

        // start drawing
        game.ctx.beginPath();
        //vertical line
        game.ctx.moveTo(game.ctx.topLeft.x + 20, game.ctx.topLeft.y + 50);
        game.ctx.lineTo(game.ctx.topLeft.x + 20, game.ctx.topLeft.y + game.ctx.canvas.height - 200);

        //horizontal markers
        game.drawHeightMarkers(500,60,true);
        game.drawHeightMarkers(100,30);
        game.ctx.closePath();

        //draw path
        game.ctx.stroke();
        //restore state
        game.ctx.restore();
    },


    /**
     * Draws the height markers for the left UI
     *
     * @param  {number} dy                  The distance between markers
     * @param  {number} length              The horizontal length of each marker
     * @param  {boolean} [drawText=false]   Should the marker height be drawn?
     */
    drawHeightMarkers: function(dy,length,drawText){
        //0m marker coord (the ruler starts 200 units from the bottom of the canvas)
        var y0 = game.ctx.canvas.height - 200;
        // ruler bottom coord
        var ybtm = game.ctx.topLeft.y + game.ctx.canvas.height - 200;

        // Y-coordinate for the first marker above the start of the ruler
        var y1 = ybtm - (ybtm % dy) + (y0 % dy);

        // loop until at the end of the ruler (50 units offset from start)
        for(y = y1; y >= game.ctx.topLeft.y + 50; y-=dy){
            //make sure y1 is above the start of the ruler
            if(y <= game.ctx.topLeft.y + game.ctx.canvas.height - 200){
                // draw the marker
                // beginPath is not needed as this method should only be called by drawLeftUI
                game.ctx.moveTo(game.ctx.topLeft.x + 20, y);
                game.ctx.lineTo(game.ctx.topLeft.x + 20 + length, y);
                // draw text?
                if(drawText) game.ctx.fillText(game.canvasToWorldHeight(y) + ' m', game.ctx.topLeft.x + length + 30, y);
            }
        }
    },

    /**
     * Draws the bottom part of the UI
     */
    drawBottomUI: function(){
        // save the canvas state
        game.ctx.save();
        // modify style
        game.ctx.fillStyle = game.Colours.transparent(game.Colours.black);
        game.ctx.font = "75px Barlow";
        game.ctx.textBaseline = 'middle';

        game.ctx.fillRect(game.ctx.topLeft.x, game.ctx.topLeft.y + game.ctx.canvas.height - 150, game.ctx.canvas.width, 150 );

        // text should be drawn in white
        game.ctx.fillStyle = game.Colours.white;
        // align text left
        game.ctx.textAlign = 'left';
        // draw left part (score)
        game.ctx.fillText(game.ball.score + 'm',game.ctx.topLeft.x + 25, game.ctx.topLeft.y + game.ctx.canvas.height - 75);

        // align text right
        game.ctx.textAlign = 'right';
        // draw right part (lives)
        game.ctx.fillText(game.ball.lives + ' lives', game.ctx.topLeft.x + game.ctx.canvas.width - 25, game.ctx.topLeft.y + game.ctx.canvas.height - 75);

        // restore canvas state
        game.ctx.restore();
    },

    /**
     * Transformes a screen coordinate to a world coordinate on the Y axis
     * @param {number} y The screen coordinate to transform
     * @returns {number}
     */
    canvasToWorldHeight: function(y){
        var y0 = game.ctx.canvas.height - 200; //0m
        return -(y-y0);
    },

    /**
     * Called when ball has no more lives. Ends the game.
     */
    gameOver: function(){
        //play sound effect
        sfx.play('gameover');
        //pause the rendering
        game.pause();
        //update the end game screen score
        document.getElementById('finalScore').textContent = game.ball.score + 'm';
        //show end game screen
        document.getElementById('gameOverScreen').style.display = "";
    },

    /**
     * Reloads the game into its initial settings
     */
    restartGame: function(){
        //hide html elements
        document.getElementById('mainMenu').style.display = "none";
        document.getElementById('gameOverScreen').style.display = "none";

        //reset canvas translation
        game.ctx.setTopLeft(0,0);

        //reset game objects
        game.ball = new Ball();
        game.paddle = new Paddle();

        //add Event Handlers
        game.ctx.canvas.addEventListener('touchstart',  game.paddle.onTouchStart.bind(game.paddle));
        game.ctx.canvas.addEventListener('touchmove',   game.paddle.onTouchMove.bind(game.paddle));
        game.ctx.canvas.addEventListener('touchend',    game.paddle.onTouchEnd.bind(game.paddle));


        game.resume();
    },

    /**
     * Pauses the game loop
     */
    pause: function(){
        game.playstate = game.PlayState.PAUSED;
        window.cancelAnimationFrame(game.frameId);
        game.frameId = null;
    },

    /**
     * Resumes the game loop after a 3-second delay
     * Timer element is shown while this executes.
     */
    resume: function(){
        // render one frame of the game
        game.renderFrame();

        // play background music
        sfx.play('music');
        sfx.play('audienceBcg');

        // define document timer element
        var timer = document.getElementById('timer');
        //set 3 second countdown
        timer.textContent = 3;
        //show timer
        timer.style.display = "";
        //update the timer every second
        var timerAnim = setInterval(function(){
            timer.textContent --;
            if(timer.textContent == 0) {
                //stop interval
                clearInterval(timerAnim);
                //hide timer
                timer.style.display = "none";
                //actual resume
                sfx.play('start');
                game.playstate = game.PlayState.PLAYING;
                game.frameId = window.requestAnimationFrame(game.renderFrame);
            }
        },1000);
    },

}

var c = document.getElementById('game');

function resizeCanvas(){
    var minWidth = 360, minHeight = 640;
    c.width = Math.max(minWidth,window.innerWidth) * window.devicePixelRatio;
    c.height = Math.max(minHeight,window.innerHeight) * window.devicePixelRatio;
}
//--ONLOAD--//



/**
 * OnLoad function
 *
 * @returns {type}  description
 */
window.onload = function() {
    resizeCanvas();
    //page-related listeners
    document.getElementById('btnStart').addEventListener('touchend',game.restartGame);
    document.getElementById('btnRetry').addEventListener('touchend',game.restartGame);
    window.addEventListener('resize',resizeCanvas);

    //initialize game
    game.init();
}
