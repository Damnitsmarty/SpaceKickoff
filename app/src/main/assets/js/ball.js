/**
 * @fileoverview Defines the Ball class which is in charge of drawing and updating the Ball Game Object
 * @author Martin Kolev
 */



/**
 * @constructor
 * @classdesc Contains method for updating and rendering the Ball Game Object
 * @extends Drawable
 *
 * @param  {number} [x] The X coordinate of the object
 * @param  {number} [y] The Y coordinate of the object
 *
 * @property {number} lives             - The number of lives left
 * @property {number} score             - The player's score
 * @property {boolean} wasHit           - Shows if the ball has been in contact with the paddle
 *
 * @property {number} diameter          - The diameter of the ball sprite
 * @property {object} initialPos        - The initial position of the ball
 *  @property {number} initialPos.x         - The X initial coordinate in canvas units
 *  @property {number} initialPos.y         - The Y initial coordinate in canvas units
 *
 * @property {external:Victor} velocity          - The current velocity of the Ball
 * @property {external:Victor} velocityMax       - The maximum (terminal) velocity of the Ball
 * @property {number} gravity           - The gravity modifier
 * @property {number} bounceModifier    - Modifier applied to the velocity on each bounce off canvas boundaries
 *
 * @returns {Ball}
 */
function Ball(x,y){

    //--Call constructor--//
    Drawable.call(this,'img/ball.png');


    //--Game--//
    this.lives = 3;
    this.score = 0;
    this.wasHit = false;

    //--Dimensions--//
    this.diameter = 100;
    this.initialPos = {x: Drawable.ctx.canvas.width/2-this.diameter/2, y: 2*this.diameter};
    this.setPos(x || this.initialPos.x, y || this.initialPos.y);
    this.setSize(this.diameter,this.diameter);
    //Drawable.angle


    //--Physics--//
    this.velocity = new Victor(0,0);
    this.velocityMax = new Victor(30,60);
    this.gravity = 0.3;
    this.bounceModifier = 0.8;
}
//--Link inheritance--//
Ball.prototype = Drawable.prototype;
Ball.prototype.constructor = Ball;



/**
 * Get the centre of the Ball
 *
 * @returns {external:Victor}  A vector to the centre of the ball
 */
Ball.prototype.centre = function(){
    return this.pos.clone().add(new Victor(this.diameter/2,this.diameter/2));
}



/**
 * Checks if the Ball object is out of bounds
 *
 * @returns {object}  An object containing information about the out-of-bounds status for the ball
 */
Ball.prototype.isOutOfBounds = function(){
    var below = this.pos.y >= Drawable.ctx.topLeft.y + Drawable.ctx.canvas.height;
    var above = this.pos.y < Drawable.ctx.topLeft.y;
    var left = this.pos.x < Drawable.ctx.topLeft.x;
    var right = this.pos.x + this.diameter > Drawable.ctx.topLeft.x + Drawable.ctx.canvas.width;

    return {
        above:above,
        right:right,
        below:below,
        left:left,
        x:left || right,
        y:above || below
    }
}


/**
 * Updates the Ball's velocity, score and checks if it is out-of-bounds, applying the appropriate effect.
 * Also checks if the game is over and whether the canvas should be translated up
 */
Ball.prototype.update = function(){
    //apply gravity
    this.velocity.add(new Victor(0, this.gravity));

    this.velocity.y = Math.min(Math.max(this.velocity.y,-this.velocityMax.y),this.velocityMax.y);
    this.velocity.x = Math.min(Math.max(this.velocity.x,-this.velocityMax.x),this.velocityMax.x);
    //check if out of bounds
    var oob = this.isOutOfBounds();
    if(oob.below) {
        game.pause();
        this.lives--;
        if(this.lives <= 0) {
            game.gameOver();
            return;
        }
        this.setPos(this.initialPos.x,this.initialPos.y);
        this.velocity = new Victor(0,0);
        game.resume();
    }
    //check if outside of horizontal bounds
    if(oob.x){
        sfx.play('bounce', true);
        if(oob.left)    this.pos.x = Drawable.ctx.topLeft.x;
        if(oob.right)   this.pos.x = Drawable.ctx.topLeft.x + Drawable.ctx.canvas.width - this.diameter;
        this.velocity.multiply(new Victor(-this.bounceModifier,1));
    }
    //apply velocity
    this.pos.add(this.velocity);

    //update score
    if(this.wasHit) this.score = Math.max(this.score,Math.floor(game.canvasToWorldHeight(this.pos.y)));

    //scroll canvas if needed
    if(this.pos.y < Drawable.ctx.topLeft.y - this.diameter && this.velocity.y < 0){
        Drawable.ctx.setTopLeft(0,Math.floor(-this.pos.y - this.diameter));
    }
}


/**
 * Checks if the ball is colliding with the Paddle and applies appropriate effects
 *
 * @returns {boolean}         Whether a collision is occuring
 */
Ball.prototype.checkForCollisions = function(){

    //only continue if game.paddle is active
    if(game.paddle.status != Paddle.Status.ACTIVE) return false;

    // projection of the ball's centre onto the game.paddle
    var proj = game.paddle.projectionOf(this.centre());

    //only continue if projection is between game.paddle start & end
    var canCollide = proj.distance(game.paddle.pos.start) + proj.distance(game.paddle.pos.end) - game.paddle.length() <= this.diameter / 2;
    if(!canCollide) return false;

    // calculate collision based on the distance from the Ball centre to its projection
    var isColliding = proj.distance(this.centre()) <= this.diameter / 2;
    //continue only if isColliding
    if(!isColliding) return false;

    //the ball is hit:
    this.wasHit = true;

    //play bouncing sound
    sfx.play('bounce', true);

    //--New Ball Position--//

    // represents vector from projection to ball centre
    var tCentre = this.centre().subtract(proj);
    // multiply the translated vector so its magnitude is equal to the Ball's radius
    var coeff = (this.diameter / 2) / tCentre.magnitude();
    tCentre.multiplyScalar(coeff);
    // and translate it back
    tCentre.add(proj);
    //apply the new position
    this.pos = tCentre.subtract(new Victor(this.diameter/2, this.diameter/2));

    //--Mirror Velocity--//

    // represents the normal of the game.paddle line
    // which in this case is parallel to the vector from the Ball centre to its projection
    var normal = proj.subtract(this.centre());
    // project the velocity vector onto the normal
    var velProj = this.velocity.clone().projectOnto(normal);
    // and double
    velProj.multiplyScalar(2);

    // finally subtract the velocity projection from the actual velocity
    // and make sure the final velocity does not decay over time
    // by multiplying by 2*bounceModifier
    this.velocity.subtract(velProj).multiplyScalar(2*this.bounceModifier);

    // deactivate the game.paddle for future collisions
    game.paddle.status = Paddle.Status.INACTIVE;
    return true;
}
