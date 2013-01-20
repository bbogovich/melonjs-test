/*------------------- 
a player entity
-------------------------------- */
var PlayerEntity = me.ObjectEntity.extend({
 
    /* -----
 
    constructor
 
    ------ */
    forcedmovement:false,
    init: function(x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
 
        // set the walking & jumping speed
        this.setVelocity(3, 15);
 
        // adjust the bounding box
        this.updateColRect(8, 48, -1, 0);
 
        // set the display to follow our position on both axis
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
 
    },
 
    /* -----
 
    update the player pos
 
    ------ */
    update: function() {
    	   var $this=this;
    	if(!this.forcedmovement){
    		
		if (me.input.isKeyPressed('left')) {
		    // flip the sprite on horizontal axis
		    this.flipX(true);
		    // update the entity velocity
		    this.vel.x -= this.accel.x * me.timer.tick;
		} else if (me.input.isKeyPressed('right')) {
		    // unflip the sprite
		    this.flipX(false);
		    // update the entity velocity
		    this.vel.x += this.accel.x * me.timer.tick;
		} else {
		    this.vel.x = 0;
		}
		if (me.input.isKeyPressed('jump')) {
		    // make sure we are not already jumping or falling
		    if (!this.jumping && !this.falling) {
			// set current vel to the maximum defined value
			// gravity will then do the rest
			this.vel.y = -this.maxVel.y * me.timer.tick;
			// set the jumping flag
			this.jumping = true;
			me.audio.play("jump");
		    }
	 
		}
	}
	 // check for collision
	    var res = me.game.collide(this);
	 
	    if (res) {
	    	//console.log(res);
		// if we collide with an enemy
		if (res.obj.type == me.game.ENEMY_OBJECT && !this.forcedmovement) {
		    // check if we jumped on it
		    if ((res.y > 0) && ! this.jumping) {
			// bounce (force jump)
			this.falling = false;
			this.vel.y = -this.maxVel.y * me.timer.tick;
			// set the jumping flag
			this.jumping = true;
			me.audio.play("stomp");
	 
		    } else {
			// let's flicker in case we touched an enemy
			
			this.flicker(45);
			//console.log(this);
			//console.log(this.pos);
			//bounce player away from enemy
			this.forcedmovement=true;
			var x=this.pos.x;
			var dest = new me.Vector2d(res.x>0?(x-75):(x+75), this.pos.y-45);
			//console.log(dest);
			var moving = new me.Tween(this.pos).to({
				"x" : dest.x,
				"y" : dest.y
			}, 200);
			moving.onComplete(function(){
				$this.forcedmovement=false;
			});
			me.audio.play("stomp");
			moving.start();			
		    }
		}
	    }
	 
        // check & update player movement
        this.updateMovement();
 
        // update animation if necessary
        if (this.vel.x!=0 || this.vel.y!=0) {
            // update objet animation
            this.parent(this);
            return true;
        }
         
        // else inform the engine we did not perform
        // any update (e.g. position, animation)
        return false;
    }
 
});