
class Point {
	constructor({
		x,
		y,
        sprite = { src: "./images/point.png", width: game.cellSize, height: game.cellSize },
        stackable = false,
        isActive = false
	}){
		this.x = x;
		this.y = y;
        this.sprite = sprite;
        this.stackable = stackable;
        this.startTicks = game.tickCount;
        this.isActive = isActive;
        if(!this.sprite.width){
            this.sprite.width = game.cellSize;
        }
        if(!this.sprite.height){
            this.sprite.height = game.cellSize;
        }
	}
	tick(){}
    handleKey(){}
    turn(){}
    ticksPassed(){
        return game.tickCount - this.startTicks;
    }
    destroy(){
        for(let i = 0; i < game.objects.length; i++){
            if(this != game.objects[i]) continue;
            game.objects.splice(i, 1);
            return;
        }
    }
}

class Humanoid extends Point {
    constructor({
		x,
		y,
		direction = { x: 0, y: 0 },
        sprite = { src: "./images/point.png" },
        hp = 1,
        weapon,
        stackable = false
	}){
		super({
            x,
            y,
            sprite,
            stackable
        });
        this.hp = hp;
        this.weapon = weapon;
        this.lastPosition = { x, y };
        this.direction = direction;
        this.attacking = false;
        this.moving = false;
    }
    turn(){}

    moveToDir(){
        this.lastPosition = { x: this.x, y: this.y };

        this.x += this.direction.x;
        this.y += this.direction.y;
        
        if(this.stackable) return;

        for(let i = 0; i < game.objects.length; i++){
            let curr = game.objects[i];

            if(curr === this || curr.stackable) continue;

            if(this.x === curr.x && this.y === curr.y){
                this.x = this.lastPosition.x;
                this.y = this.lastPosition.y;
                return;
            }
        }
    }

    takeDamage(damage){
        this.hp -= damage;
        if(this.hp > 0) return;

        this.destroy();
    }
}

class Player extends Humanoid{
    constructor({
        x = 0,
        y = 0,
        hp = 100
    }){
        super({
            x,
            y,
            weapon: null, 
            hp
        })
        //this.weapon = new Weapon(this, "bow");
        this.changeDirectionOrMove( { x: 1, y: 0 } );
        this.lastPosition = { x: this.x, y: this.y };
        this.inventory = [
            new Weapon( this, { type: "sword", damage: 2 } ),
            new Weapon( this, { type: "bow" } ),
            new Weapon( this, { type: "bow" } ),
        ]
        this.weapon = this.inventory[0];
    }

	handleKey(key){

		switch(key){
            case 'ArrowDown':
                this.changeDirectionOrMove( { x: 0, y: 1 } );
                break;
            
            case 'ArrowUp':
                this.changeDirectionOrMove( { x: 0, y: -1 } );
                break;
            
            case 'ArrowRight':
                this.changeDirectionOrMove( { x: 1, y: 0 } );
                break;
            
            case 'ArrowLeft':
                this.changeDirectionOrMove( { x: -1, y: 0 } );
                break;
            case ' ':
                this.moving = false;
                this.attacking = true;
                this.turn();
                break;
        }
    }

    changeDirectionOrMove(direction){
        if(this.direction.x == direction.x && this.direction.y == direction.y){
            if(!game.turnFlow) return;
            this.attacking = false;
            this.moving = true;
            this.turn();
        } else {
            this.direction = direction;
            this.updateSprite();
        }
    }

    attack(){
        this.weapon.attack();
    }

    updateSprite(){
        if  (this.direction.x == 1){
            this.sprite.src = "./images/right.png";
        } else if(this.direction.x == -1){
            this.sprite.src = "./images/left.png";
        } 
        // else if(this.direction.y == 1){
        //     this.sprite.src = "./images/down.png";
        // } else if(this.direction.y == -1){
        //     this.sprite.src = "./images/up.png";
        // }
    }
    
	turn(){
        if(!game.turnFlow || game.turnDelay) return;

        this.lastPosition = { x: this.x, y: this.y };

        if(this.moving) {
            this.moveToDir();
        }

        if(this.attacking){
            this.attack();
        }

        if(this.x < 0){
            this.x = 0;
        } else if(this.x >= game.map.width){
            this.x = game.map.width - 1;
        }

        if(this.y < 0){
            this.y = 0;
        } else if(this.y >= game.map.height){
            this.y = game.map.height - 1;
        }

        game.turn();
    }
}

class Enemy extends Humanoid {
    constructor({
        x = 0,
        y = 0,
        type = "sword",
        hp = 2,
    }){
        super({
            x,
            y,
            sprite: { src: "./images/enemy.png", offsetX: 0, offsetY: 0 },
            hp
        });
        //this.stackable = true;
        this.type = type;
        this.weapon = new Weapon( this, {type: this.type} );
    }

    turn(){
        let dx = (game.player.lastPosition.x) - this.x;
        let dy = (game.player.lastPosition.y) - this.y;

        this.direction = { x: 0, y: 0 };

        if(this.type === "bow"){
            if(game.player.lastPosition.x === this.x){
                this.direction.y = dy / Math.abs(dy);
                this.weapon.attack();
            } else if(game.player.lastPosition.y === this.y){
                this.direction.x = dx / Math.abs(dx);
                this.weapon.attack();
            }

            return;
        }

        if(dx){
            this.direction.x = dx / Math.abs(dx);
        } else if(dy) {
            this.direction.y = dy / Math.abs(dy);
        }

        if(Math.abs(dx) + Math.abs(dy) === 1){
            this.weapon.attack();
            return;
        }

        this.moveToDir();
    }
}

class Wall extends Point {
    constructor({
        x,
        y,
    }){
        super({
            x,
            y,
            sprite: { src: "./images/wall.png" }
        });
    }
}

class Weapon {
    constructor( handler, {
            type = "sword", 
            damage = 1,
            sprite = { src: "./images/sword.png" }
        } ) {
        this.handler = handler;
        this.type = type;
        this.damage = damage;
        this.sprite = sprite;
        if(this.type == "bow"){
            this.sprite.src = "./images/bow.png"
        }
    }
    attack(){
        if(this.type === "bow"){
            let arrX = this.handler.x;
            let arrY = this.handler.y;
            let arr = new Arrow( { x: arrX, y: arrY, handler: this.handler, direction: this.handler.direction } );
            let bowAnimation = new MyAnimation( { 
                x: this.handler.x, 
                y: this.handler.y, 
                sprite: {...this.sprite, width: 30, height: 30}, 
                direction: { ...this.handler.direction },
                speed: 1
            } );
            game.objects.push(bowAnimation);
            game.objects.push(arr);
            return;
        }

        let hitX = this.handler.x + this.handler.direction.x;
        let hitY = this.handler.y + this.handler.direction.y;

        let swordAnimation = new MyAnimation( { 
            x: this.handler.x, 
            y: this.handler.y, 
            sprite: {...this.sprite, width: 30, height: 30}, 
            direction: { ...this.handler.direction }
        } );
        game.objects.push(swordAnimation);
        
        for(let i = 0; i < game.objects.length; i++){
            let curr = game.objects[i];
            if( !curr.takeDamage ) continue;

            if( hitX != curr.x || hitY != curr.y ) continue;
            curr.takeDamage(this.damage);
        }
    }
}

class MyAnimation extends Point{
    constructor( { 
        sprite,
        x,
        y,
        speed = 10,
        direction = { x: 0, y: 0 },
     } ) {
         super( {
             x,
             y,
             sprite,
             stackable: true,
         });
         this.direction = direction;
         this.speed = speed;
     }

     tick(){
        let areaSize = game.cellBorderSize + game.cellSize;

        this.sprite.offsetX = this.direction.x * (this.ticksPassed() % this.speed) * (areaSize / this.speed);
        this.sprite.offsetY = this.direction.y * (this.ticksPassed() % this.speed) * (areaSize / this.speed);

        if(this.ticksPassed() && this.ticksPassed() % this.speed === 0) this.destroy();
     }
}

class Arrow extends Point{
    constructor( {
        x,
        y,
        direction,
        speed = 2,
        handler
    } ) {
        super({
            x,
            y,
            stackable: true,
            sprite: { src: "./images/arrow.png" },
            isActive: true,
        });
        this.direction = direction;
        this.speed = speed;
        game.pauseTurnFlow();
        this.handler = handler;
        this.sprite.offsetX = -game.cellBorderSize;
    }

    tick(){
        let areaSize = game.cellBorderSize + game.cellSize;
        this.sprite.offsetX = this.direction.x * (this.ticksPassed() % this.speed) * (areaSize / this.speed);
        this.sprite.offsetY = this.direction.y * (this.ticksPassed() % this.speed) * (areaSize / this.speed);
        if(this.ticksPassed() % this.speed != 0) return;

        if(this.direction.x == 0 && this.direction.y == 0) this.direction.x = 1;

        this.x += this.direction.x;
        this.y += this.direction.y;

        if( this.x < 0 ||
            this.x >= game.map.width ||
            this.y < 0 ||
            this.y >= game.map.height
            ){
            
            this.destroy();
            game.continueTurnFlow();
            if(this.handler === game.player) game.turn();
            return;

        }

        for(let i = 0; i < game.objects.length; i++){
            let curr = game.objects[i];
            if( !curr.takeDamage || this === curr || curr === this.handler ) continue;

            let hitX = this.x;
            let hitY = this.y;

            if( hitX != curr.x || hitY != curr.y ) continue;

            curr.takeDamage(1);
            this.destroy();
            game.continueTurnFlow();
            if(this.handler === game.player) game.turn();
            return;
        }
    }
}