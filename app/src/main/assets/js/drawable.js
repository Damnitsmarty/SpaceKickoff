/**
 * @fileoverview Defines the Drawable class used for drawing sprites.
 * @author Martin Kolev
 */

/**
 * @constructor
 * @classdesc Contains methods for drawing sprites onto the canvas
 * @requires external:Victor
 *
 * @param {string} path The path to the image file
 *
 *  @property {number} rotation     - The rotation of the sprite in radians (default:0)
 *  @property {external:Victor} pos - The position of the sprite (default:Victor(0,0))
 *  @property {object} size         - The size of the sprite
 *      @property {number} size.w       - The width of the sprite in canvas units (default:0)
 *      @property {number} size.h       - The height of the sprite in canvas units (default:0)
 *
 *  @returns {Drawable}
 */
function Drawable(path) {
    this.setImage(path);

    //--Dimensions--//
    this.rotation = 0;
    this.pos = new Victor(0,0);
    this.size = {
        w: 0,
        h: 0
    };
}


/**
 * The context for the game canvas
 * @memberof Drawable
 * @static
 */
Drawable.ctx = document.getElementById('game').getContext('2d');

//--Methods--//

/**
 * Assigns an image file to the sprite
 *
 * @param  {string} path    The path to the image file
 * @returns {Drawable}       Returns the Drawable
 */
Drawable.prototype.setImage = function(path) {
    this.img = new Image();
    this.img.src = path;
    return this;
}


/**
 * Sets the sprite's screen position (relative to the canvas top left point)
 *
 * @param  {number} x The new X position (screen coordinate)
 * @param  {number} y The new Y position (screen coordinate)
 * @param {boolean} [rel=true] Should the position be in Screen Space (relative)?
 * @returns {Drawable} Returns the Drawable
 *
 * @example
 * var sprite = new Drawable().setPos(0,0);
 */
Drawable.prototype.setPos = function(x, y, rel) {
    if (typeof(x) == "number" && typeof(y) == "number") {
        rel = rel || true;
        //set the new position according to parameters
        this.pos = new Victor(x,y);
        //add the canvas' top left point, making the coordinates relative
        if(rel) this.pos.add(Victor.fromObject(Drawable.ctx.topLeft));
    }
    //return the Drawable
    return this;
}


/**
 * Sets the sprite's size in canvas units
 *
 * @param  {number} w The new sprite Width
 * @param  {number} h The new sprite Height
 * @returns {Drawable}   Returns the Drawable
 *
 * @example
 * var sprite = new Drawable().setSize(200,100);
 * sprite.setSize(sprite.size.w/2, sprite.size.h/2);
 */
Drawable.prototype.setSize = function(w, h) {
    if (typeof(w) == "number" && typeof(h) == "number") {
        this.size.w = w;
        this.size.h = h;
    }
    return this;
}


/**
 * Sets the sprite's rotation in radians
 *
 * @param  {number} rot The new rotation value
 * @returns {Drawable}     Returns the Drawable
 */
Drawable.prototype.setRotation = function(rot){
    this.rotation = rot;
    return this;
}


/**
* Draws the sprite on the canvas
*
* @returns {bool}  A boolean value indicating the success of the draw operation
*/
Drawable.prototype.draw = function() {

    //check if the prototype.ctx is a context
    if (!Drawable.ctx instanceof CanvasRenderingContext2D) return false;

    //if it should be rotated
    if (this.rotation != 0) {
        Drawable.ctx.save();
        Drawable.ctx.translate(this.pos.x + this.size.w / 2, this.pos.y + this.size.h / 2);
        Drawable.ctx.rotate(this.rotation);
        Drawable.ctx.translate(-(this.pos.x + this.size.w / 2), -(this.pos.y + this.size.h / 2));
        //Draw image
        Drawable.ctx.drawImage(this.img, this.pos.x, this.pos.y, this.size.w, this.size.h);
        //Restore canvas
        Drawable.ctx.restore();
    } else {
        Drawable.ctx.drawImage(this.img, this.pos.x, this.pos.y, this.size.w, this.size.h);
    }
    return true;
}
