const w = 1920;//window.innerWidth;
const h = 1080;//window.innerHeight;
const scale = window.devicePixelRatio;
const w2 = w/2;
const h2 = h/2;

const canvas = document.getElementById('canvas');
canvas.width = w * scale;
canvas.height = h * scale;
canvas.style.width = w;
canvas.style.height = h;

const ctx = canvas.getContext('2d');
ctx.scale(scale, scale);

ctx.globalCompositeOperation = 'source-over';

ctx.fillStyle = '#000000';
ctx.fillRect( 0, 0, w, h );

ctx.globalAlpha = 1;

class Game {
	constructor(){
		this.cellSize = 50;
		this.cellBorderSize = 10;
        this.intervalID = -1;
        this.DELAY_TIME = 15;
        this.turnDelay = 0;
    }
    
	tick(){
        this.handleKeys();
        this.turnDelay = this.turnDelay > 0 ? this.turnDelay - 1 : 0;

        for(let i = 0; i < this.objects.length; i++){
            this.objects[i].tick();
        }
        this.tickCount++;
    }
    
	turn(){
        if(!this.turnFlow) return;
        if(this.turnDelay) return;

		for(let i = 0; i < this.objects.length; i++){
            if(this.objects[i] === this.player) continue;
			this.objects[i].turn();
        }

        this.turnDelay = this.DELAY_TIME;
    }
    
	handleKeys(){
        if(this.inventoryBlock){

            for(let key in this.keysDown){
                if(this.keysDown[key]){

                    switch(key){
                        case "ArrowRight":
                            for(let i = 0; i < this.inventoryBlock.length - 1; i++){
                                if(!this.inventoryBlock[i].focus) continue;
                                this.inventoryBlock[i].focus = false;
                                this.inventoryBlock[i + 1].focus = true;
                                break;
                            }
                            break;

                        case "ArrowLeft":
                            for(let i = this.inventoryBlock.length -1; i > 0; i--){
                                if(!this.inventoryBlock[i].focus) continue;
                                this.inventoryBlock[i].focus = false;
                                this.inventoryBlock[i - 1].focus = true;
                                break;
                            }
                            break;

                        case "Enter":
                            for(let i = 0; i < this.inventoryBlock.length; i++){
                                if(!this.inventoryBlock[i].focus) continue;
                                this.player.weapon = this.player.inventory[i];
                                this.closeInventory();
                                break;
                            }
                            break;
                    }

                    this.keysDown[key] = false;

                }
            }

            return;
        }

		for(let key in this.keysDown){
			if(this.keysDown[key]){
                this.player.handleKey(key);
                this.keysDown[key] = false;
			}
        }
        
    }
    
	render(){
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0, 0, w, h );
		
		let earthImg = document.createElement("img");
		earthImg.src = "./images/earth.png";

		for(let i = 0; i < this.map.width; i++){
			for(let j = 0; j < this.map.height; j++){

				ctx.drawImage(earthImg, 
					this.map.x + (this.cellSize + this.cellBorderSize) * i, 
					this.map.y + (this.cellSize + this.cellBorderSize) * j, 
					this.cellSize, 
					this.cellSize);
			}
		}

		for(let i = 0; i < this.objects.length; i++){
			let curr = this.objects[i];

			let currImg = document.createElement("img");
			currImg.src = curr.sprite.src;

			ctx.drawImage(
				currImg,
				curr.x * (this.cellSize + this.cellBorderSize) + this.map.x + (curr.sprite.offsetX || 0),
				curr.y * (this.cellSize + this.cellBorderSize) + this.map.y + (curr.sprite.offsetY || 0),
				curr.sprite.width,
				curr.sprite.height
			)
        }

        if(this.inventoryBlock){
            for(let i = 0; i < this.inventoryBlock.length; i++){
                ctx.strokeStyle = this.inventoryBlock[i].focus ? "#7fffff" : "#A00000";
                ctx.strokeRect(110 * i + 200, 30, 100, 100);
                ctx.fillStyle = "#ffffff";
                ctx.font = "20px sans-serif";
                ctx.fillText(this.inventoryBlock[i].type, 110 * i + 210, 60);
            }
        }
        
        ctx.fillStyle = "#ffffff";
		ctx.font = "30px sans-serif";
		ctx.fillText(`Health: ${this.player && this.player.hp}`, 10, 40);
    }
    
	start(){
		this.loadLevel();
		this.setGameInterval();
    }
    
	loadLevel(){

        this.tickCount = 0;

		this.keysDown = {};

        this.objects = [];

        let walls = [
            { x: 4, y: 2 },
            { x: 4, y: 3 },
            { x: 4, y: 4 },
        ];

        this.turnFlow = true;

        this.map = { x: 500, y: 300, width: 8, height: 8 };
        
        this.player = new Player( { x: 1, y: 1, hp: 100 } );
		
        document.addEventListener('keydown', e => {
            this.keysDown[e.key] = true;
        });

        document.addEventListener('keyup', e => {
            this.keysDown[e.key] = false;
            this.turnDelay = 0;
        });

        document.addEventListener('keypress', e => {
            if(e.key === 'p') this.togglePause();
            else if(e.key === 'i') this.toggleInventory();
        });

        this.objects.push(this.player);
        
        this.objects.push( new Enemy( { x: 7, y: 7, } ) );
        this.objects.push( new Enemy( { x: 0, y: 7, } ) );
        this.objects.push( new Enemy( { x: 7, y: 2, } ) );
        this.objects.push( new Enemy( { x: 1, y: 6, type: "bow", hp: 1 } ) );
        this.objects.push( new Enemy( { x: 5, y: 1, hp: 50 } ) );

        for(let i = 0; i < walls.length; i++){
            let wall = new Wall(walls[i]);
            this.objects.push(wall);
        }
    }
    
	togglePause(){
		if(this.intervalID < 0) {
            this.setGameInterval();
        } else {
            clearInterval(this.intervalID);
            this.intervalID = -1;
        }
    }

	setGameInterval(){
		this.intervalID = setInterval(() => {
			this.tick();
			this.render();
		}, 1000/30);
    }
    
    pauseTurnFlow(){
        this.turnFlow = false;
    }

    continueTurnFlow(){
        this.turnFlow = true;
    }

    toggleInventory(){
        if(this.inventoryBlock){
            this.closeInventory();
            return;
        }
        this.openInventory();
    }

    openInventory(){
        this.inventoryBlock = [];
        for(let i = 0; i < game.player.inventory.length; i++){
            this.inventoryBlock[i] = { type: game.player.inventory[i].type, focus: false };
        }
        this.inventoryBlock[0].focus = true;
    }

    closeInventory(){
        this.inventoryBlock = null;
    }
}