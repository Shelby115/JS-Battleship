function Battleship() {
    this.cells = [];
    this.ships = [];
    this.turn = 0;
    this.sunkenCount = 0;
    this.gridSize = 10;
    this.ready = false;
};
Battleship.prototype = {
    isReady: function () {
        return this.ready;
    },
    getRandomLocation: function (direction, length) {
        var gridSize = 10,
            xFactor = 1,
            yFactor = 1,
            loc = { x: 0, y: 0 };
            
        xFactor = direction === "H" ? length : 1;
        yFactor = direction === "V" ? length : 1;
        
        loc.x = parseInt(Math.random() * (gridSize - xFactor) + 1, 10);
        loc.y = parseInt(Math.random() * (gridSize - yFactor) + 1, 10);
        
        return loc;
    },
	locationsIntersect: function (locs, locs2) {
		var i = 0, j = 0, intersect = false;
		for (i = 0; i < locs.length; i += 1) {
			for (j = 0; j < locs2.length; j += 1) {
				intersect = intersect ? intersect : (locs[i].x === locs2[j].x && locs[i].y === locs2[j].y);
			}
		}
		return intersect;
	},
    getRandomDirection: function () {
        return Math.random() > 0.5 ? "H" : "V";
    },
	shoot: function (cell) {
        var shotValue = cell.shot, x = cell.x, y = cell.y, value = "miss", i = 0;
            
        for (i = 0; i < this.ships.length; i += 1) {
            value = this.ships[i].shoot({ x: x, y: y });
            shotValue =  shotValue === "miss" || shotValue === "empty" ? value : shotValue;
        }
        return shotValue;
    },
    init: function () {
        var x = 10, y = 10, i = 0, j = 0,
            direction, location, ship, intersects = false;
        this.cells = [];
        // Initialize Cells
        for (i = 0; i < x; i += 1) {
            this.cells[i] = [];
            for (j = 0; j < y; j += 1) {
                this.cells[i][j] = {
                    x: i,
                    y: j,
                    shot: "empty"
                };
                // Draw Cells
                this.uiNewCell(this.cells[i][j]);
            }
        }
        
        // Initialize random ships.
        for (i = 1; i < 6; i += 1) {
            direction = this.getRandomDirection();
            location = this.getRandomLocation(direction, i);
			ship = new Ship(direction, i + 1, [], location.x, location.y);
			intersects = false;
			for (j = 0; j < this.ships.length; j += 1) {
				intersects = intersects ? intersects : this.locationsIntersect(ship.loc, this.ships[j].loc);
			}
			
			if (intersects) {
				i -= 1;
			} else {
				this.ships.push(ship);
			}
        }
        // No need to draw the ships, only upon sinking shall they be revealed.
	},
	start: function () {
        if (this.cells.length === 0) {
            this.init();
        }
        this.turn = 0;
        this.ready = true;
        
        var i = 0, j = 0;
        for (i = 0; i < this.gridSize; i += 1) {
            for (j = 0; j < this.gridSize; j += 1) {
                this.cells[i][j].shot = "empty";
                this.uiUpdateCell(this.cells[i][j]);
            }
        }
	},
	click: function (cell) {
        if (!this.ready) {
            return;
        }
        
        if (cell.shot !== "empty" && cell.ui._cutout.name !== "empty") {
            console.log("(" + cell.x + ", " + cell.y + ") " + cell.shot + "-Shot already taken!"); 
        } else {
            cell.shot = this.shoot(cell);
			this.turn += 1;
        
            console.log("(" + cell.x + ", " + cell.y + ") " + cell.shot + "!"); 
            
            this.uiUpdateCell(cell);
            
            this.sunkenCount = (cell.shot === "sunk") ? this.sunkenCount + 1 : this.sunkenCount;
            
            if (this.victory()) {
                // Victory.
				alert("You've won in " + this.turn + " turns!");
                console.log("Congratulations! You've won!");
            }
        }
        
	},
    victory: function () {
        return this.sunkenCount >= this.ships.length;
    }
};
function Ship(direction, length, hitsTaken, x, y) {
    this.direction = direction;
    this.length = length;
    this.hitsTaken = hitsTaken;
    this.loc = [];
	var i = 0;
	for (i = 0; i < length; i += 1) {
		if (direction === "H") {
			this.loc.push({
				x: x + i,
				y: y
			});
		} else {
			this.loc.push({
				x: x,
				y: y + i
			});
		}
	}
}
Ship.prototype = {
    // Checks if the shot at the given locationw as a hit.
    wasHit: function (loc) {
		var index = -1, i = 0, result = false,
		checkEqual = function (loc, loc2) {
			return loc.x === loc2.x && loc.y === loc2.y;
		};
		for (i = 0; i < this.loc.length; i += 1) {
			result = result ? result : checkEqual(loc, this.loc[i]);
		}
        return result;
    },
    // Checks if the ship has taken a hit at the given location.
    hasTakenHit: function (loc) {
        var i = 0;
        for (i = 0; i < this.hitsTaken.length; i += 1) {
            if (this.hitsTaken[i].x === loc.x && this.hitsTaken[i].y === loc.y)
                return true;
        }
        return false;
    },
    // Declares a shot at a given location.
    // return: "miss", "shotTakenAlready", "hit", "sunk"
    shoot: function (loc) {
        var success = "miss";
        if (this.wasHit(loc)) {
            if (!this.hasTakenHit(loc)) {
                this.hitsTaken.push(loc);
                success = "hit";
                if (this.hasSunk()) {
                    success = "sunk";
                }
            } else {
                success = "shotTakenAlready";
            }
        }
        return success;
    },
    // Checks if the ship has sunk.
    hasSunk: function () {
        return this.loc.length <= this.hitsTaken.length;
    }
};

Cut(function(root, container) {
	Cut.Mouse(root, container);
	root.viewbox(200, 200).pin("handle", 0);
	Cut.image("base:grid").pin({
        scale: 1,
        handle: 0
    }).appendTo(root);
	
	var game = new Battleship();
	
	game.uiNewCell = function (cell) {
		cell.ui = Cut.image("base:empty").appendTo(root).pin({
			offsetX: cell.x * 10,
			offsetY: cell.y * 10,
			width: 10,
			height: 10,
			handle: 0.0
		}).on(Cut.Mouse.CLICK, function () {
            if (game.isReady()) {
                game.click(cell);
            } else {
                game.start();
            }
		});
	};	
	game.uiUpdateCell = function (cell) {
		cell.ui.setImage("base:" + cell.shot);
		cell.ui.pin({
			alpha: 0.8,
			scale: 1
		});
	};
	game.uiWin = function (row, sign) {
		// TODO: Victory condition check & parameters. Called from Battleship.click.
	};	
	game.uiDraw = function () {
	};	
	game.start();
});

Cut.addTexture({
	name: "base",
	cutouts: [
		Cut.Out.drawing("grid", 100, 100, 5, function (context, ratio) {
			context.scale(ratio, ratio);
			var x = 0, y = 0, gridSize = 10, tileSize = 10;
			context.beginPath();
			for (y = 0; y <= 10; y += 1) {
				context.moveTo((y * tileSize), 0);
				context.lineTo((y * tileSize), (tileSize * gridSize));
			}
			for (x = 0; x <= 10; x += 1) {
				context.moveTo(0, (x * tileSize));
				context.lineTo((tileSize * gridSize), (x * tileSize));
			}
            context.closePath();
            context.lineWidth = 1.0;
            context.lineCap = "square";
            context.lineStyle = "blue";
			context.stroke();
		}),
		Cut.Out.drawing("hit", 10, 10, 5, function (context, ratio) {
			context.scale(ratio, ratio);
            context.beginPath();
            context.moveTo(2.5, 7.5);
			context.lineTo(3.5, 8.5);
			context.moveTo(3.5, 8.5);
			context.lineTo(7.5, 2.5);
			context.stroke();
		}),
		Cut.Out.drawing("sunk", 10, 10, 5, function (context, ratio) {
			context.scale(ratio, ratio);
            context.beginPath();
            context.moveTo(2.5, 7.5);
			context.lineTo(3.5, 8.5);
			context.moveTo(3.5, 8.5);
			context.lineTo(7.5, 2.5);
			context.strokeStyle = 'red';
			context.stroke();
		}),
		Cut.Out.drawing("miss", 10, 10, 5, function (context, ratio) {
			context.scale(ratio, ratio);
            context.beginPath();
            context.moveTo(2.5, 2.5);
			context.lineTo(7.5, 7.5);
			context.moveTo(7.5, 2.5);
			context.lineTo(2.5, 7.5);
			context.stroke();
		}),
        Cut.Out.drawing("empty", 10, 10, 5, function (context, ratio) {
		}),
	]
});