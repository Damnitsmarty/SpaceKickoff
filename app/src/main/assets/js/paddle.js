/**
 * @fileoverview Defines the Paddle class used for reading player input and controlling the player object
 * @author Martin Kolev
 */

/**
 * @constructor
 * @classdesc Controls and renders the player's paddle
 *
 * @property {Paddle.Status} status - The status of the paddle
 * @property {object} pos           - The position of the Paddle
 *      @property {external:Victor} start        - The canvas coordinate of the start of the Paddle
 *      @property {external:Victor} end          - The canvas coordinate of the end of the Paddle
 * @property {number} minLength     - The minimum length, below which a paddle would not be considered drawn
 * @property {number} maxLength     - The maximum length of the paddle
 * @property {number} lineWidth     - The width of the Paddle
 * @property {string} colour        - The colour of the paddle (when active)
 *
 *
 * @returns {Paddle}
 */
function Paddle(){

    this.status = Paddle.Status.NOPADDLE;
    //--Dimensions--//
    this.pos = {
        start: new Victor(0,0),
        end: new Victor(0,0)
    };

    this.maxLength = 300;
    this.minLength = 30;
    //--Styling--//
    this.lineWidth = 15;
    this.colour = game.Colours.yellow;

}


/**
 * The context for the game canvas
 * @static
 */
Paddle.ctx = document.getElementById('game').getContext('2d');


/**
 * Enum for paddle status
 * @static
 * @enum {number}
 */
Paddle.Status = {
    /** No paddle is drawn */
    NOPADDLE:0,
    /** Mouse is down, the paddle is being drawn */
    DRAWING:1,
    /** Paddle is drawn, but has been hit by the ball */
    INACTIVE:2,
    /** Paddle is drawn and is NOT hit by the ball */
    ACTIVE:3,
};




/**
 * Get the length from the start of the paddle to its end.
 *
 * @returns {number}    The length of the paddle line segment in canvas units
 */
Paddle.prototype.length = function(){ //used when calculating new end vector
    return this.pos.start.distance(this.pos.end);
}



/**
 * Returns a projection of the vector onto the paddle's line
 *
 * @param  {external:Victor} v   - The vector to project
 * @returns {external:Victor}      A new vector representing the coordinates of the projection
 * @example
 * //get the projection of (50,50) onto the X-axis
 * paddle.pos = {
 *  start:new Victor(0,0),
 *  end:new Victor(1,0)
 * }
 * console.log(paddle.projectionOf(new Victor(50,50)))
 * //:> Victor {x:50,y:0}
 */
Paddle.prototype.projectionOf = function(v){
    // clone v and offset by Paddle's start position
    // this represents a vector from the Paddle start position to v's coordinates
    var vActual = v.clone().subtract(this.pos.start);
    // translate the paddle's end position to the origin
    // this represents the paddle line going through the (0,0) origin
    var endActual = this.pos.end.clone().subtract(this.pos.start);

    //get the projection of v
    vActual.projectOnto(endActual);

    //translate the projection back by the Paddle's start position
    vActual.add(this.pos.start);
    return vActual;
}



/**
 * Clamps the Paddle's length, translating it if above the maxLength
 */
Paddle.prototype.clamp = function(){
    //check if the length is above maximum
    if(this.length() > this.maxLength){
        //translate to origin
        var tStart = this.pos.start.clone().subtract(this.pos.end);

        //multiply by maxLength / length
        var fact = this.maxLength / this.length();
        tStart.multiply(new Victor(fact,fact));
        //translate back
        tStart.add(this.pos.end);

        //update
        this.pos.start = tStart;
    }
}



/**
 * Draws elements needed for debugging purposes
 */
Paddle.prototype.debugDraw = function(){
    var bcent = window.ball.centre();
    var proj = this.projectionOf(bcent);
    var canCollide = proj.distance(this.pos.start)+proj.distance(this.pos.end) - this.pos.start.distance(this.pos.end) <= window.ball.diameter/2;
    var isColliding = proj.distance(bcent) <= window.ball.diameter/2;

    // begin draw
    Paddle.ctx.save();
    Paddle.ctx.lineWidth = 7;

    // Paddle.ctx.beginPath();
     Paddle.ctx.strokeStyle = game.Colours.green;

    // draw ball centre to projection
    Paddle.ctx.beginPath();
    if(canCollide){
        // modify style to depict collision status
        Paddle.ctx.strokeStyle = game.Colours.orange;
        if(isColliding) Paddle.ctx.strokeStyle = game.Colours.red;
    }
    Paddle.ctx.moveTo(bcent.x,bcent.y);
    Paddle.ctx.lineTo(proj.x,proj.y);
    Paddle.ctx.closePath();
    Paddle.ctx.stroke();


    // draw paddle line
    Paddle.ctx.strokeStyle = game.Colours.yellow;
    var planeStart = this.pos.end.clone().subtract(this.pos.start).multiply(Victor(-10,-10)).add(this.pos.start);
    var planeEnd = this.pos.end.clone().subtract(this.pos.start).multiply(Victor(10,10)).add(this.pos.start);
    Paddle.ctx.beginPath();
    Paddle.ctx.lineWidth = 3;
    Paddle.ctx.moveTo(planeStart.x,planeStart.y);
    Paddle.ctx.lineTo(planeEnd.x,planeEnd.y);

    Paddle.ctx.closePath();
    Paddle.ctx.stroke();

    Paddle.ctx.restore();
}



/**
 * Draws the paddle line segment
 */
Paddle.prototype.draw = function(){
    // check the position types
    if(!(this.pos.start instanceof Victor && this.pos.end instanceof Victor)) return false;
    // do not draw if there is no paddle
    if(this.status < Paddle.Status.DRAWING) return false;

    // clamp paddle before drawing
    this.clamp();

    // save canvas state
    Paddle.ctx.save();
    // modify style
    Paddle.ctx.lineWidth = this.lineWidth;
    if(this.status == Paddle.Status.ACTIVE) Paddle.ctx.strokeStyle = this.colour;
    else if(this.status == Paddle.Status.INACTIVE) Paddle.ctx.strokeStyle = game.Colours.transparent(game.Colours.red);
    else Paddle.ctx.strokeStyle = game.Colours.transparent(this.colour);

    // draw paddle line segment
    Paddle.ctx.beginPath();
    Paddle.ctx.moveTo(this.pos.start.x,this.pos.start.y);
    Paddle.ctx.lineTo(this.pos.end.x,this.pos.end.y);
    Paddle.ctx.closePath();
    Paddle.ctx.stroke();
    // restore canvas state
    Paddle.ctx.restore();

}



/**
 * Get the touch position in screen coordinates
 *
 * @param  {TouchEvent} e   - The event containing touch coordinates
 * @returns {object}          The modified touch coordinates
 */
Paddle.prototype.getTouchPos = function(e){

    var tCoords = new Victor(e.touches[0].clientX, e.touches[0].clientY);
    tCoords.multiplyScalar(window.devicePixelRatio);
    var bbox = Paddle.ctx.canvas.getBoundingClientRect();
    // translate the original coordinates by the bounding box top-left point
    // then back by the canvas context's top-left point
    return {
        x: tCoords.x - bbox.left + Paddle.ctx.topLeft.x,
        y: tCoords.y - bbox.top + Paddle.ctx.topLeft.y
    }
}



/**
 * The Paddle's touchstart event handler
 *
 * @param  {TouchEvent} e   - The touch event transmitted by the event listener
 */
Paddle.prototype.onTouchStart = function(e){
    // set the paddle's status
    this.status = Paddle.Status.DRAWING;
    //get the touch coordinates
    var touch = this.getTouchPos(e);
    //set the start and end positions of the paddle to the touch coordinate
    this.pos.start.x = this.pos.end.x = touch.x;
    this.pos.start.y = this.pos.end.y = touch.y;
}



/**
 * The Paddle's touchmove event handler
 *
 * @param  {TouchEvent} e   - The touch event transmitted by the event listener
 */
Paddle.prototype.onTouchMove = function(e){
    // get the touch coordinates
    var touch = this.getTouchPos(e);
    // modify the paddle's end position
    this.pos.end.x = touch.x;
    this.pos.end.y = touch.y;
}



/**
 * The Paddle's touchend event handler
 *
 * @param  {TouchEvent} e       - The touch event transmitted by the event listener
 * @returns {Paddle.Status}       The new state of the paddle
 */
Paddle.prototype.onTouchEnd = function(e){
    // if the paddle length is below the mininmum length
    // reset the paddle
    if(this.pos.start.clone().subtract(this.pos.end).magnitude() <= this.minLength) {
        this.pos.start.multiply(new Victor(0,0));
        this.pos.end.multiply(new Victor(0,0));
        this.status = Paddle.Status.NOPADDLE;
        return this.status;
    }
    //otherwise activate the paddle
    this.status = Paddle.Status.ACTIVE;

    return this.status;
}
