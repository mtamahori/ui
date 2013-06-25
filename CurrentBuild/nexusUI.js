/*
 *  2013 Jesse Allison, Ben Taylor, Yemin Oh
 *  Nexus - shared utility functions for javascript UI objects
 */ 
 

/*****************************
*     DEFINE NX MANAGER      *
*****************************/
 

var nxManager = function() {
	
	var manager = this;
	
	// new manager properties
	
	this.nxObjects = new Array();
	this.nxThrottlePeriod = 20;
	this.elemTypeArr = new Array();
	this.aniItems = new Array();
	
	// Colorize all Nexus objects aspects = [fill, accent, border, accentborder]
	this.colorize = function(aspect, newCol) {
		if (!newCol) {
			newCol = aspect;
			aspect = "accent";
		}
		for (i=0;i<this.nxObjects.length;i++) {
			eval("this.nxObjects[i].colors."+aspect+" = '"+newCol+"';");
			this.nxObjects[i].draw();
		}
	}
	
	this.addNxObject = function(newObj) {
		this.nxObjects.push(newObj);
		//console.log(this.nxObjects);
	}
	
	this.setNxThrottlePeriod = function(newThrottle) {
		manager.nxThrottlePeriod = newThrottle;
		for (i=0;i<manager.nxObjects.length;i++) {
			manager.nxObjects[i].nxThrottlePeriod = manager.nxThrottlePeriod;
		}
	}
	
	
	/* old manager properties and methods */

	this.is_touch_device = ('ontouchstart' in document.documentElement)?true:false;

	this.canvasOffset = function(left, top) {
		this.left = left;
		this.top = top;
	}

	this.findPosition = function(element) {
	    var body = document.body,
	        win = document.defaultView,
	        docElem = document.documentElement,
	        box = document.createElement('div');
	    box.style.paddingLeft = box.style.width = "1px";
	    body.appendChild(box);
	    var isBoxModel = box.offsetWidth == 2;
	    body.removeChild(box);
	    box = element.getBoundingClientRect();
	    var clientTop  = docElem.clientTop  || body.clientTop  || 0,
	        clientLeft = docElem.clientLeft || body.clientLeft || 0,
	        scrollTop  = win.pageYOffset || isBoxModel && docElem.scrollTop  || body.scrollTop,
	        scrollLeft = win.pageXOffset || isBoxModel && docElem.scrollLeft || body.scrollLeft;
	    return {
	        top : box.top  + scrollTop  - clientTop,
	        left: box.left + scrollLeft - clientLeft
	  	};
	}

	// *******************
	//	nxTransmit
	// *******************
		
	// Transmit code that sends ui data to various destinations set by the transmissionProtocol variable
	// TODO: why does this work and not self unless self is passed in???  
	
		// Set Transmission Protocol for all nx objects
	this.setTransmissionProtocol = function (setting) {
		for (i=0;i<this.nxObjects.length;i++) {
			this.nxObjects[i].transmissionProtocol = setting;
		}	
	}
	
		// Set Transmist Command for all nx objects
	this.setTransmitCommand = function (setting) {
		for (i=0;i<this.nxObjects.length;i++) {
			this.nxObjects[i].transmitCommand = setting;
		}	
	}

	
	this.nxTransmit = function (data) {
		//console.log(this);
		//console.log("nxTransmit data: ", this.transmissionProtocol, data);
		
		data = manager.prune(data,3);
		
		if (this.transmissionProtocol == "none") {
			
		} else if (this.transmissionProtocol == "ajax") {
			// transmitCommand is the ajax url to send to, oscName is the osc call, uiIndex is used if you have multiple buttons/dials/etc, data is data
			//   If you want to have a callback function to respond to the method, you could send that as a final parameter.
			// console.log("nxTransmit: ", this.transmitCommand, this.oscName, this.uiIndex, data);
			this.ajaxTransmit(this.transmitCommand, this.oscName, this.uiIndex, data);
		} else if (this.transmissionProtocol == "ios") {

		} else if (this.transmissionProtocol == "android") {
			
		} else if (this.transmissionProtocol == "local") {
				// sender, receiver, parameter, data //
			this.localTransmit(data);
		}
		
	}
	
		// globalLocalTransmit (and localTransmit) is the function to send data to other js objects. 
		//   it requires a localObjectFrom, localObject, localParameter and data
	this.globalLocalTransmit = function (localObjectFrom, localObject, localParameter, data) {
		// console.log("Global " + localObjectFrom + " to " + localObject, localParameter, data);
		eval(localObject + "."+ localParameter + "=" + data);
	}
	
	/*
		TODO Update to be globalAjaxTransmit which can be overwritten on an object by object basis.
				Follow globalLocalTransmit as an example
	*/
	
	// ajaxTransmit is the function to send info back to the server. 
	// it requires a command and an osc_name (by default it is the name of the canvas id) and data
	this.ajaxTransmit = function (ajaxCommand, oscName, uiIndex, data, callbackFunction) {
		if (this.ajaxRequestType == "post") {
			if (uiIndex) {
				$.post(ajaxCommand, {oscName: oscName, id: uiIndex, data: data});
			} else {
				$.post(ajaxCommand, {oscName: oscName, data: data});
			}
		} else if (this.ajaxRequestType == "get") {
			if (uiIndex) {
				$.ajax(ajaxCommand, {oscName: oscName, id: uiIndex, data: data});
			} else {
				$.ajax(ajaxCommand, {oscName: oscName, data: data});
			}
		}
	}
	
	//iosTransmit is the function to send osc commands as urls to be captured by the browser.
	this.iosTransmit = function (command, osc_name, id, data) {
		
	}
	
	//androidTransmit is the function to send osc commands as urls to be captured by the browser.
	this.androidTransmit = function (command, osc_name, id, data) {
		
	}
	
	
	
	//event listeners
	this.getHandlers = function(self) {
		if (manager.is_touch_device) {
			 self.canvas.ontouchstart = self.preTouch;
			 self.canvas.ontouchmove = self.nxThrottle(self.preTouchMove, self.nxThrottlePeriod);
			 self.canvas.ontouchend = self.preTouchRelease;
		} else {
			 self.canvas.addEventListener("mousedown", self.preClick, false);
		}
	}
	
	
	//replaces Point
	this.point = function(x,y){
		this.x = x;
		this.y = y;
	}

	this.getCursorPosition = function(e, canvas_offset) {
		var x;
	  var y;
	  if (e.pageX != undefined && e.pageY != undefined) {
			x = e.pageX;
			y = e.pageY;
	  } else {
			x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	  }
		x -= canvas_offset.left;
	  y -= canvas_offset.top;
		var click_position = new nx.point(x,y);
		return click_position;
	}

	// Works great for one touch per UI element (does not handle multi-touch on a single UI)
	this.getTouchPosition = function(e, canvas_offset) {
		var x;
		var y;
		x = e.targetTouches[0].pageX;
		y = e.targetTouches[0].pageY;
		x -= canvas_offset.left;
	  	y -= canvas_offset.top;
		var click_position = new nx.point(x,y);
		return click_position;
	}

	this.nxThrottle = function(func, wait) {
	    var timeout;
	    return function() {
	        var context = this, args = arguments;
	        if (!timeout) {
	            // the first time the event fires, we setup a timer, which 
	            // is used as a guard to block subsequent calls; once the 
	            // timer's handler fires, we reset it and create a new one
	            timeout = setTimeout(function() {
	                timeout = null;
	                try {
	               		func.apply(context, args);
	               	} catch (err) {
	               		console.log(err);
	               	}
	            }, wait);
	        }
	    }
	}

	//replaces to_cartesian
	this.toCartesian = function(radius, angle){
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		var point = new nx.point(radius*cos, radius*sin*-1);
		return point;
	}

	//replaces to_polar
	this.toPolar = function(x,y) {
		var r = Math.sqrt(x*x + y*y);

		var theta = Math.atan2(y,x);
		if (theta < 0.) {
			theta = theta + (2 * Math.PI);
		}
		var polar = new nx.point(r, theta);

		return polar;
	}

	this.clip = function(value, low, high) {
		var clipped_value = Math.min(high, Math.max(low, value));
		return clipped_value;
	}

	this.text = function(context, text, position) {
		if (!position) {
			position = [10 , 10];
		}
		with(context) {
			beginPath();
				// fillStyle = "#000";
				font = "bold 12px sans-serif";
				fillText(text,position[0],position[1]);
			closePath();
		}
	}
	
	this.boolToVal = function(somebool) {
		if (somebool) {
			return 1;
		} else {
			return 0;
		}
	}
	
	this.prune = function(data, scale) {
		var scale = Math.pow(10,scale);
		if (typeof data=="number") {
			data = Math.round( data * scale ) / scale;
		}
		return data;
	}
	
	
	this.scale = function(inNum, inMin, inMax, outMin, outMax) {
		outNum = (((inNum - inMin) * (outMax - outMin)) / (inMax - inMin)) + outMin;
		return outNum;	
	}
		
	this.invert = function (inNum) {
		return manager.scale(inNum, 1, 0, 0, 1);
	}



	/*  
	 * 		GUI
	 */
	
	//replaces Colors
	this.colors = { 
			"accent": "#ff5500", 
			"fill": "#f7f7f7", 
			"border": "#ccc", 
			"accentborder": "#aa2200",
			"black": "#000",
			"white": "#FFF"
	};
	
	/* Global GUI Function Library*/
		
	this.randomNum = function(scale) {
		var randNum = Math.floor(Math.random() * scale);
		return randNum;
	} 
	
	this.randomColor = function() {
		var randCol = "rgb(" + this.randomNum(250) + "," + this.randomNum(250) + "," + this.randomNum(250) + ")";
		return randCol;
	}
	
	this.makeRoundRect = function(ctx,xpos,ypos,wid,hgt) {
		var x1 = xpos;
		var y1 = ypos;
		var x2 = wid+x1;
		var y2 = hgt+y1;
		var depth = 6;
		
		ctx.beginPath();
		ctx.moveTo(x1+depth, y1); //TOP LEFT
		ctx.lineTo(x2-depth, y1); //TOP RIGHT
		ctx.quadraticCurveTo(x2, y1, x2, y1+depth);
		ctx.lineTo(x2, y2-depth); //BOTTOM RIGHT
		ctx.quadraticCurveTo(x2, y2, x2-depth, y2);
		ctx.lineTo(x1+depth, y2); //BOTTOM LEFT
		ctx.quadraticCurveTo(x1, y2, x1, y2-depth);
		ctx.lineTo(x1, y1+depth); //TOP LEFT
		ctx.quadraticCurveTo(x1, y1, x1+depth, y1);
		ctx.closePath();
	}
	
	
	this.isInside = function(clickedNode,currObject) {
		if (clickedNode.xpos > currObject.xpos && clickedNode.xpos < (currObject.xpos+currObject.wid) && clickedNode.ypos > currObject.ypos && clickedNode.ypos < (currObject.ypos+currObject.hgt)) {
			return true;	
		} else {
			return false;	
		}
	}
	
	this.getPos = function(e) {
		clickPos = [e.pageX, e.pageY];
		adjustedPos = new Object();
		adjustedPos.xpos = clickPos[0]-offsetLeft;
		adjustedPos.ypos = clickPos[1]-offsetTop;	
		return adjustedPos;
	}
	
	
	this.blockMove = function(e) {
		e.preventDefault();
	}
	
	
	/* animation functions */
	
	this.startPulse = function() {
		manager.pulseInt = setInterval("nx.pulse()", 30);
	}
	
	this.stopPulse = function() {
		clearInterval(manager.pulseInt);
	}
	
	this.pulse = function() {
		for (var i=0;i<manager.aniItems.length;i++) {
			manager.aniItems[i]();
		}
	}
	
	this.bounce = function(posIn, borderMin, borderMax, delta) {
		if (posIn > borderMin && posIn < borderMax) {
			return delta;
		} else {
			return delta * -1;
		}
	}

	
}
	



/************************************************
*  INSTANTIATE NX MANAGER AND CREATE ELEMENTS   *
************************************************/

var nx = new nxManager();

/* this onload function turns canvases into nexus elements,
 * using their id as their var name */

// CHANGED: using document ready to set up nexus.  Will not conflict with window.onload and you can add more functions to the document.ready chain if needed.

$(document).ready(function() {
	var allcanvi = document.getElementsByTagName("canvas");
	for (i=0;i<allcanvi.length;i++) {
		var nxId = allcanvi[i].getAttribute("nx");
		var elemCount = 0;
		for (j=0;j<nx.elemTypeArr.length;j++) {
			if (nx.elemTypeArr[j]==nxId) {
				elemCount++;
			}
		}
		nx.elemTypeArr.push(nxId);
		if (!allcanvi[i].id) {
			var idNum = elemCount + 1;
			allcanvi[i].id = nxId + idNum;
		}
		if(nxId) {
			// dial1 = new dial(dial1, nexus, 1);
			eval(allcanvi[i].id + " = new "+nxId+"('"+allcanvi[i].id+"', 'nexus', "+idNum+");");
		}
	}
	
	if (nx.is_touch_device) {
		document.addEventListener("touchmove", nx.blockMove, true);
		document.addEventListener("touchstart", nx.blockMove, true);
	}
	
	nx.onload();
	
});
	
	
	
	
	

/*****************************
*      OBJECT TEMPLATE       *
*****************************/

function getTemplate(self, target, transmitCommand) {
	//canvas
	self.canvasID = target;
	self.canvas = document.getElementById(target);
	self.context = self.canvas.getContext("2d");
	self.canvas.height = window.getComputedStyle(document.getElementById(target), null).getPropertyValue("height").replace("px","");
	self.canvas.width = window.getComputedStyle(document.getElementById(target), null).getPropertyValue("width").replace("px","");
	self.height = parseInt(window.getComputedStyle(document.getElementById(target), null).getPropertyValue("height").replace("px",""));
	self.width = parseInt(window.getComputedStyle(document.getElementById(target), null).getPropertyValue("width").replace("px",""));
	if (self.width==300 && self.height==150) {
		self.canvas.width = self.defaultSize.width;
		self.canvas.height = self.defaultSize.height;
		self.width = self.defaultSize.width;
		self.height = self.defaultSize.height;
	}
	self.offset = new nx.canvasOffset(nx.findPosition(self.canvas).left,nx.findPosition(self.canvas).top);
	self.center = {
					x: self.width/2, 
					y: self.height/2
				};
	//dimensions
	self.corners = {
						"TLx": 0,
						"TLy": 0,
						"TRx": this.width,
						"TRy": 0,
						"BRx": this.width,
						"BRy": this.height,
						"BLx": 0,
						"BLy": this.height
				};
	//drawing
	self.lineWidth = 3;
	self.padding = 3;
	//self.colors = nx.colors;
	self.colors = new Object();
	self.colors.accent = nx.colors.accent;
	self.colors.fill = nx.colors.fill;
	self.colors.border = nx.colors.border;
	self.colors.accentborder = nx.colors.accentborder;
	self.colors.black = nx.colors.black;
	self.colors.white = nx.colors.white; 
	//interaction
	self.click = new nx.point(0,0);
	self.clicked = false;
	self.value = 0;
	self.nodePos = new Array();	
	self.deltaMove = new Object();
	self.nxThrottlePeriod = nx.nxThrottlePeriod;
	self.nxThrottle = nx.nxThrottle;
	//recording
	nx.addNxObject(self);
	self.isRecording = false;
	self.tapeNum = 0;
	self.recorder = null;
	//Transmission
	self.nxTransmit = nx.nxTransmit;
	self.transmissionProtocol = "ajax";  // transmissionProtocol = [none, local, ajax, ios, android]

	self.ajaxRequestType = "post";	// ajaxRequestType = [post, get]
	if (!transmitCommand) {
		self.transmitCommand = "nexusTransmit";
	} else {
		self.transmitCommand = transmitCommand;
	}
	self.oscName = target;
	
	self.ajaxTransmit = nx.ajaxTransmit;
	
	
		// By default localTransmit will call the global nx manager globalLocalTransmit function. It can be individually rewritten.
	self.localTransmit = function(data) {
		nx.globalLocalTransmit(self.canvasID, self.localObject, self.localParameter, data);
	};
	self.localObject = "dial1";
	self.localParameter = "value";

	//built-in methods
	self.getCursorPosition = nx.getCursorPosition;
	self.getTouchPosition = nx.getTouchPosition;
	self.is_touch_device = ('ontouchstart' in document.documentElement)?true:false;
	
	self.preClick = function(e) {
		self.offset = new nx.canvasOffset(nx.findPosition(self.canvas).left,nx.findPosition(self.canvas).top);
		//document.addEventListener("mousemove", self.nxThrottle(self.preMove, self.nxThrottlePeriod), false);
		document.addEventListener("mousemove", self.preMove, false);
		document.addEventListener("mouseup", self.preRelease, false);
		self.clickPos = self.getCursorPosition(e, self.offset);
		self.clicked = true;
		self.deltaMove.x = 0;
		self.deltaMove.y = 0;
		self.click(e);
	};
	self.preMove = function(e) {
		self.movehandle = 0;
		var new_click_position = self.getCursorPosition(e, self.offset);
		self.deltaMove.y = new_click_position.y - self.clickPos.y;
		self.deltaMove.x = new_click_position.x - self.clickPos.x;
		self.clickPos = new_click_position;
		self.move(e);
	};
	self.preRelease = function(e) {
		document.removeEventListener("mousemove", self.preMove, false);
		self.clicked = false;
		self.release();
		document.removeEventListener("mouseup", self.preRelease, false);
	};
	self.preTouch = function(e) {
		self.clickPos = self.getTouchPosition(e, self.offset);
		self.clicked = true;
		self.deltaMove.x = 0;
		self.deltaMove.y = 0;
		self.touch(e);
	};
	self.preTouchMove = function(e) {
		if (self.clicked) {
			var new_click_position = self.getTouchPosition(e, self.offset);
			self.deltaMove.y = new_click_position.y - self.clickPos.y;
			self.deltaMove.x = new_click_position.x - self.clickPos.x;
			self.clickPos = new_click_position;
			self.touchMove(e);
		}
	};
	self.preTouchRelease = function(e) {
		if (self.clicked) {
			self.clicked = false;
		}
		self.touchRelease(e);
	};
	
	self.adjustSizeIfDefault = function() {
		if (self.width==300 && self.height==150) {
			self.canvas.width = self.defaultSize.width;
			self.canvas.height = self.defaultSize.height;
			self.width = self.defaultSize.width;
			self.height = self.defaultSize.height;
		}
	}
	self.makeRoundedBG = function() {
		this.bgLeft = this.lineWidth;
		this.bgRight = this.width - this.lineWidth;
		this.bgTop = this.lineWidth;
		this.bgBottom = this.height - this.lineWidth;
		this.bgHeight = this.bgBottom - this.lineWidth;
		this.bgWidth = this.bgRight - this.lineWidth;	
		
		nx.makeRoundRect(self.context, self.bgLeft, self.bgTop, self.bgWidth, self.bgHeight);
	};
	self.erase = function() {
		self.context.clearRect(0,0,self.width,self.height);
	};
	self.hideCursor = function() {
		self.canvas.style.cursor = "none";
	};
	self.showCursor = function() {
		self.canvas.style.cursor = "auto";
	};
	
	nx.getHandlers(self);
};

	
	
	

// nexus Toggle button

function toggle(target, ajaxCommand, uiIndex) {

	//self awareness
	var self = this;
	this.uiIndex = uiIndex;
	this.defaultSize = { width: 75, height: 100 };
	
	//get common attributes and methods
	this.getTemplate = getTemplate;
	this.getTemplate(self, target, ajaxCommand);
	
	var i;
	this.on = false;
	if (this.width>=50) {
		this.fontsize = 20;
	} else {
		this.fontsize = 11;
	}

	this.init = function() {
		self.draw();
	}
	
	this.draw = function() {
		
		with (this.context) {
			//erase
			clearRect(0,0, this.canvas.width, canvas.height);
		}
		//make background
		this.makeRoundedBG();
		with (this.context) {	
			strokeStyle = self.colors.border;
			fillStyle = self.colors.fill;
			lineWidth = this.lineWidth;
			stroke();
			fill();
		}
	
		if (this.on) {
			nx.makeRoundRect(this.context, this.bgLeft+this.padding, this.bgTop+this.padding, this.bgWidth-this.padding*2, this.bgHeight/2.1);
			with (this.context) {
				fillStyle = self.colors.accent;
				strokeStyle = self.colors.border;
				stroke();
				fill();
				
				fillStyle = self.colors.white;
				font = "bold "+self.fontsize+"px courier";
				textAlign = "center";
				fillText("on", this.canvas.width/2, this.bgHeight/4.5+this.lineWidth+this.padding+5);
			}
		}
		
		else {
			nx.makeRoundRect(this.context, this.bgLeft+ this.padding, this.bgBottom-this.padding-this.bgHeight/2.1, this.bgWidth-this.padding*2, this.bgHeight/2.1);
			with (this.context) {
				fillStyle = self.colors.border;
				strokeStyle = self.colors.border;
				stroke();
				fill();
				fillStyle = self.colors.white;
				font = "bold "+self.fontsize+"px courier";
				textAlign = "center";
				fillText("off", this.canvas.width/2, this.bgBottom-this.padding-this.bgHeight/4.5+5);
			}
		}
	}
	
	this.click = function() {
		if (!self.on) {
			self.on = true;
		}
		else {
			self.on = false;
		}
		self.draw();
		self.nxTransmit(nx.boolToVal(self.on));
	}
	
	this.move = function() {
		
	}
	
	this.release = function() {
		
	}
		
	this.touch = function(e) {
		if (!self.on) {
			self.on = true;
		}
		else {
			self.on = false;
		}
		self.draw();
		self.nxTransmit(nx.boolToVal(self.on));
	}


	this.touchMove = function(e) {
	}


	this.touchRelease = function(e) {
	}
	
	
	this.init();
	
}
// nexusUI - Dial
//
//

				
function dial(target, transmitCommand, uiIndex) {
					
	//self awareness
	var self = this;
	if (!isNaN(uiIndex)) {
		self.uiIndex = uiIndex;
	}
	this.defaultSize = { width: 100, height: 100 };
	
	//get common attributes and methods
	this.getTemplate = getTemplate;
	this.getTemplate(self, target, transmitCommand);
	
	
	//define unique attributes
	this.circle_size = 1;
	this.dial_position_length = 6;
	this.lineWidth = 4;
	if (this.width<101 || this.width<101) {
		this.accentWidth = this.lineWidth * 1.2;
	} else {
		this.accentWidth = this.lineWidth * 2;
	}
	this.value = 0.5;
	this.responsivity = 0.005;
	this.toCartesian = nx.toCartesian;
	this.throttle = nx.throttle;
	this.clip = nx.clip;

	function init() {
	
		self.circle_size = (Math.min(self.center.x, self.center.y)-5);
		self.dial_position_length = self.circle_size+self.lineWidth;
		
		if (self.width<101) {
			self.dial_position_length--;
			self.dial_position_length--;
		}
		
		self.draw();
		
		return 1;
	}

	this.draw = function() {
		//dial_line
		var dial_angle = (((1.0 - self.value) * 2 * Math.PI) + (1.5 * Math.PI));
		var dial_position = (self.value + 0.25) * 2 * Math.PI
		var point = self.toCartesian(self.dial_position_length, dial_angle);
		
		if (self.isRecording) {
			self.recorder.write(self.tapeNum,self.value);
		}

		with (self.context) {
			clearRect(0,0, self.width, self.height);
			strokeStyle = self.colors.border;
			fillStyle = self.colors.fill;
			lineWidth = self.lineWidth;
			
			//draw main circle
			beginPath();
				arc(self.center.x, self.center.y, self.circle_size, 0, Math.PI*2, true);
				fill();
				stroke();
			closePath();

			//draw color fill
			beginPath();
				lineWidth = self.accentWidth;
				arc(self.center.x, self.center.y, self.circle_size , Math.PI* 0.5, dial_position, false);
				lineTo(self.center.x,self.center.y);
				//strokeStyle = self.colors.accent;
				globalAlpha = 0.1;
				fillStyle = self.colors.accent;
				fill();
				globalAlpha = 1;
			closePath(); 

			//draw round accent
			beginPath();
				lineWidth = self.accentWidth;
				arc(self.center.x, self.center.y, self.circle_size , Math.PI* 0.5, dial_position, false);
				strokeStyle = self.colors.accent;
				stroke();
			closePath(); 
		
			//draw bar accent
			beginPath();
				lineWidth = self.accentWidth;
				strokeStyle = self.colors.accent;
				moveTo(self.center.x, self.center.y);
				lineTo(point.x + self.center.x, point.y + self.center.y);
				stroke();
			closePath(); 
			
			//draw circle in center
			beginPath();
				fillStyle = self.colors.accent;
				arc(self.center.x, self.center.y, self.circle_size/15+6, 0, Math.PI*2, false);
				fill();
			closePath(); 
			
		}
		//text(self.context,self.value.toFixed(2));
	}
	

	this.click = function(e) {
		//clicked is now set to true, coords are in self.clickPos
		// console.log("Dial nxTransmit", self.transmitCommand, self.oscName, self.uiIndex, self.clickPos);
		self.nxTransmit(self.value);
		self.draw();
	}


	this.move = function() {
		//self.delta_move is set to difference between curr and prev pos
		//self.clickPos is now newest mouse position in [x,y]
		
		self.value = self.clip((self.value - (self.deltaMove.y * self.responsivity)), 0, 1);
		self.nxTransmit(self.value);
		
		self.draw();
	}


	this.release = function() {
		//self.clicked is now set to false
		//mousemove handler is removed
		
	}
	
	
	this.touch = function(e) {
		self.nxTransmit(self.value);
		self.draw();
	}


	this.touchMove = function(e) {
		self.value = self.clip((self.value - (self.deltaMove.y * self.responsivity)), 0, 1);
		self.nxTransmit(self.value);
		self.draw();
	}


	this.touchRelease = function(e) {
	}

	init();
	
}


// nexusUI - Button 
// 
// 
 

function button(target, transmitCommand, uiIndex) {

	//self awareness
	var self = this;
	if (!isNaN(uiIndex)) {
		self.uiIndex = uiIndex;
	}
	this.defaultSize = { width: 100, height: 100 };
	
	//get common attributes and methods
	this.getTemplate = getTemplate;
	getTemplate(self, target, transmitCommand);

	// Define Unique Attributes
	// Value is the value to send when the button is clicked.  
	this.value = 1;
	this.transmitRelease = true;	// transmit 0 on release of button.

	this.init = function() {
		
		self.draw();
		
		return 1;
	}
	
	this.draw = function() {
		
		with (self.context) {
			clearRect(0, 0, self.width, self.height);
			lineWidth = self.lineWidth;
		
			// ** Button ** //
			if (!self.clicked) {
				fillStyle = self.colors.fill;
				strokeStyle = self.colors.border;
			} else if (self.clicked) {
				fillStyle = self.colors.accent;
				strokeStyle = self.colors.accent;
			}
			
			beginPath();
			arc(self.center.x, self.center.y, self.center.x-6, 0, Math.PI*2, true);
			fill();	  
			stroke();
			
		}
	}

	this.click = function(e) {
		self.nxTransmit(self.value * nx.boolToVal(self.clicked));
		self.draw();
	}
	
	this.move = function () {
		// use to track movement on the button...
	}

	this.release = function() {
		if (self.transmitRelease) {
			self.nxTransmit(self.value * nx.boolToVal(self.clicked)); 
		}
		self.draw();
	}
	
	this.touch = function(e) {
		self.nxTransmit(self.value * nx.boolToVal(self.clicked));
		self.draw();
	}
	
	this.touchMove = function(e) {
		//use to track movement on the button...
	}

	this.touchRelease = function(e) {
		if (self.transmitRelease) {
			self.nxTransmit(self.value * nx.boolToVal(self.clicked)); 
		}
		self.draw();
	}
	
	this.init();

}
// nexusUI - Keyboard
//

function keyboard(target, transmitCommand, uiIndex) {

	//self awareness
	var self = this;
	if (!isNaN(uiIndex)) {
		self.uiIndex = uiIndex;
	}
	this.defaultSize = { width: 400, height: 100 };
	
	//get common attributes and methods
	self.getTemplate = getTemplate;
	self.getTemplate(self, target, transmitCommand);

	// define unique attributes
	self.octaves = 2;
//	var width = (self.canvas.width/(self.octaves*12))/3;
	var width = (self.canvas.width/(self.octaves*12))/1.75;
	var w_height = self.height;
	var b_height = w_height*4/7;
	var w_width = width*3;
	var b_width = width*2;
	// [On/Off, order of white or black, white(0) or black(1), start_position of X, end_position of X]
	var black_dis = [0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 4, 5];
	var white_dis = [[0, 2], [4, 5], [7, 9], [9, 11], [13, 14], [16, 17], [19, 21]];
	var order = [0, 2, 4, 5, 7, 9, 11, 1, 3, 6, 8, 10];
	var keys = new Array();

	var note_new;
	var note_old;
		
	this.init = function() {
		document.addEventListener("keydown", self.type);
		document.addEventListener("keyup", self.untype);
		var o,j,i;
		for (j=0;j<self.octaves;j++) {
			for (i=0; i<12; i++) {
				o = order[i]+j*12;
				if (i<7) {
					var u1 = w_width*(i + j*7);
					var y = i + 1;
					var u2 = w_width*(y + j*7);
					keys.push([0, i, 0, u1, u2, o]);
				}
				else {
					var k = black_dis[i];
					var t1 = b_width*(1 + k + k/2) + 7*j*w_width;
					var r = k + 1;
					var t2 = b_width*(1 + r + k/2) + 7*j*w_width;
					keys.push([0, k, 1, t1, t2, o]);
				}
			}
		}
		
		self.draw();
		
		return 1;
	}

	this.draw = function() {
		var m,i,d,xx, dis;

		for(m=0;m<self.octaves;m++) {
			for (i=0;i<12;i++){
				d = m*12 + i;
				if (keys[d][2] == 0) {
					var k = keys[d][1];
					var x = k*w_width + (m*w_width*7);
					with (self.context) {
						lineWidth = self.lineWidth;
						if (keys[d][0] == 0){
							fillStyle = self.colors.fill;
							fillRect(x, 0, w_width, w_height);
							strokeStyle = self.colors.border;
							strokeRect(x , 0, w_width, w_height);

						}
						else {
							fillStyle = "#AAA";
							fillRect(x, 0, w_width, w_height);
						}

					}
				}
				else {
					dis = keys[d][1];
					xx = dis*(b_width+b_width/2) + b_width + (m*w_width*7);	
					with (self.context) {
						lineWidth = self.lineWidth;
						if (keys[d][0] == 0){
							fillStyle = self.colors.black;
						}	
						else {
							fillStyle = "#AAA";
						}
						fillRect(xx, 0, b_width, b_height);	
					}
				}	
			}
		}
		with (self.context) {
			strokeStyle = self.colors.border;
			lineWidth = 5;
			strokeRect(0,0,self.width,self.height);
		}
	}

	this.change_cell = function(whichCell, number) {
		if(whichCell != null){
			keys[whichCell].splice(0,1,number);
		}
	}

	// "WhichKey_pressed" find out the key, and changes the cell of the array(keys[]) and pass it into variable "note_new"
	this.whichKey_pressed = function (x, y){
		var found_click = 0;
		var j,i,k;

		if (y < b_height){
			for (j=0; j<self.octaves; j++){
				for (i=7; i<12; i++) {
					var d = j*12 + i;
					if (x > keys[d][3] && x <= keys[d][4]) {
						note_new = d;
						found_click = 1;
						break;
					}
				}
				if (found_click == 0) {
					for (k=0; k<7; k++) {
						var sp = (white_dis[k][0]+(21*j))*width;
						var ep = (white_dis[k][1]+(21*j))*width;
						if (x > sp && x <= ep) {
							var o = j*12 + k;
							note_new = o;
							break;
						}					
					}
				}
			}

		}
		else if (y > b_height && y < w_height) {
			for (j=0; j<self.octaves; j++){
				for (i=0; i<7; i++) {
					var d = j*12 + i;
					if (x > keys[d][3] && x < keys[d][4]) {
						note_new = d;
					}
				}
			}
		}
		else {
			note_new = null;
		}
	}

	// 
	this.click = function(e) {
		self.whichKey_pressed(self.clickPos.x, self.clickPos.y);
		self.change_cell(note_new, 1);
		note_old = note_new;
		console.log(note_new);
		
		midi_note = keys[note_new][5];
		
		// change the note_new --> midi_note_new (offset)
		var note = [midi_note, 1];
		self.nxTransmit(note);
		self.draw();	
	}

	this.move = function(e) {
		if (self.clicked) {
			self.whichKey_pressed(self.clickPos.x,self.clickPos.y);
			if (note_old != note_new) {
				self.change_cell(note_old, 0);
				self.change_cell(note_new, 1);
				midi_note = keys[note_new][5];
				self.nxTransmit(midi_note, 1);
				self.draw();
			}
		}
		note_old = note_new;
	}

	this.release = function(e) {
		for (j=0;j<self.octaves;j++) {
			for (i=0;i<12;i++) {
				var note_released = j*12 + i;
				self.change_cell(note_released, 0);
				self.nxTransmit(note_released, 0);
			}
		}
		self.draw();
	}
	
	
	this.touch = function(e) {
		self.whichKey_pressed(self.clickPos.x, self.clickPos.y);
		self.change_cell(note_new, 1);
		note_old = note_new;
		
		midi_note = keys[note_new][5];
		
		// change the note_new --> midi_note_new (offset)
		self.nxTransmit(midi_note);
		self.draw();
	}

	this.touchMove = function(e) {
		if(self.clicked) {
		self.clickPos = self.getTouchPosition(e, self.offset);;

		self.whichKey_pressed(this.clickPos.x,this.clickPos.y);
			if (note_old != note_new) {
				self.change_cell(note_old, 0);
				self.change_cell(note_new, 1);
				midi_note = keys[note_new][5];
				self.nxTransmit(midi_note);
				self.draw();
			}
		}
		note_old = note_new;
	}

	this.touchRelease = function(e) {
		for (j=0;j<self.octaves;j++) {
			for (i=0;i<12;i++) {
				var d = j*12 + i;
					self.change_cell(d, 0);
			}
		}
		self.draw();
	}
	
	this.type = function(e) {
		var currKey = e.which;
		if (e.which>47 && e.which<91) {
			var asciis = [  81,50,87,51,69,82,53,84,54,89,55,85];
			var keyIndex = [0,7,1,8,2,3,9,4,10,5,11,6 ];
			var keyAsciiIndex = asciis.indexOf(currKey);
			note_new = keyIndex[keyAsciiIndex];
			console.log(note_new);
			self.change_cell(note_new, 1);
			note_old = note_new;
			
			midi_note = keys[note_new][5];
			
			// change the note_new --> midi_note_new (offset)
			self.nxTransmit(midi_note);
			self.draw();	
		}
	}
	
	this.untype = function(e) {
		var currKey = e.which;
		if (e.which>47 && e.which<91) {
			var asciis = [  81,50,87,51,69,82,53,84,54,89,55,85];
			var keyIndex = [0,7,1,8,2,3,9,4,10,5,11,6 ];
			var keyAsciiIndex = asciis.indexOf(currKey);
			note_old = keyIndex[keyAsciiIndex];
			self.change_cell(note_old, 0);
			
			midi_note = keys[note_new][5];
			
			// change the note_new --> midi_note_new (offset)
			self.nxTransmit(midi_note);
			self.draw();
		}	
	}
	

	this.init();
	
}

// Javascript 2d_slider

function position(target, ajaxCommand, oscName, uiIndex, oscIp) {
					
	//self awareness
	var self = this;
	this.uiIndex = uiIndex;
	this.defaultSize = { width: 300, height: 200 };
	
	//get common attributes and methods
	this.getTemplate = getTemplate;
	this.getTemplate(self, target, ajaxCommand);
	
	//this.line_width = 3;
	this.nodeSize = 15;
	this.values = [0,0];
	
	this.default_text = "click or touch to control a node";	
	this.throttle = nx.throttle;
	this.clip = nx.clip;
	
	

	this.init = function() {
		self.draw();
	}

	this.draw = function() {
		self.erase();
		self.makeRoundedBG();
		with (self.context) {
			strokeStyle = self.colors.border;
			fillStyle = self.colors.fill;
			lineWidth = self.lineWidth;
			stroke();
			fill();
			if (self.nodePos[0] != null) {
				self.drawNode();
			}
			else {
				fillStyle = self.colors.border;
				font = "14px courier";
				fillText(self.default_text, 10, 20);
			}
		}
	}

	this.drawNode = function() {
		//stay within right/left bounds
		if (self.nodePos[0]<(self.bgLeft+self.nodeSize)) {
			self.nodePos[0] = self.bgLeft + self.nodeSize;
		} else if (self.nodePos[0]>(self.bgRight-self.nodeSize)) {
			self.nodePos[0] = self.bgRight - self.nodeSize;
		}
		//stay within top/bottom bounds
		if (self.nodePos[1]<(self.bgTop+self.nodeSize)) {
			self.nodePos[1] = self.bgTop + self.nodeSize;
		} else if (self.nodePos[1]>(self.bgBottom-self.nodeSize)) {
			self.nodePos[1] = self.bgBottom - self.nodeSize;
		}
	
		with (self.context) {
			globalAlpha=0.2;
			beginPath();
				strokeStyle = self.colors.accent;
				//lineWidth = self.lineWidth;
				lineWidth = 2;
				moveTo(self.nodePos[0],0+self.padding);
				lineTo(self.nodePos[0],self.height-self.padding);
				moveTo(0+self.padding,self.nodePos[1]);
				lineTo(self.width-self.padding,self.nodePos[1]);					
				stroke();
			closePath();
			globalAlpha=1;
			beginPath();
				fillStyle = self.colors.accent;
				strokeStyle = self.colors.border;
				lineWidth = self.lineWidth;
				arc(self.nodePos[0], self.nodePos[1], self.nodeSize, 0, Math.PI*2, true);					
				fill();
			closePath();
		}
	}
	
	this.scaleNode = function() {
		self.values = [ nx.prune(self.nodePos[0]/self.width, 3), nx.prune(self.nodePos[1]/self.height, 3) ];
		return self.values;
	}

	this.click = function() {
		self.nodePos[0] = self.clickPos.x;
		self.nodePos[1] = self.clickPos.y;
		self.draw();
		//FIXME: how to send two values?
		self.nxTransmit(self.scaleNode());
	}

	this.move = function() {
		if (self.clicked) {
			self.nodePos[0] = self.clickPos.x;
			self.nodePos[1] = self.clickPos.y;
			self.draw();
			var help = {
				"self.clickPos.x": self.clickPos.x,
				"self.clickPos.y": self.clickPos.y,
				"self.nodePos[0]": self.nodePos[0],
				"self.nodePos[1]": self.nodePos[1],
				"self.offset": self.offset
			}
			self.nxTransmit(self.scaleNode());
		}
	}
	

	this.release = function() {
		
	}
	
	this.touch = function() {
		self.nodePos[0] = self.clickPos.x;
		self.nodePos[1] = self.clickPos.y;
		self.draw();
		self.nxTransmit(self.scaleNode());
	}

	this.touchMove = function() {
		if (self.clicked) {
			self.nodePos[0] = self.clickPos.x;
			self.nodePos[1] = self.clickPos.y;
			self.draw();
			self.nxTransmit(self.scaleNode());
		}
	}

	this.touchRelease = function() {
		
	}
	
	this.animate = function(aniType) {
		
		switch (aniType) {
			case "bounce":
				nx.aniItems.push(self.aniBounce);
				break;
			case "none":
				nx.aniItems.splice(nx.aniItems.indexOf(self.aniBounce));
				break;
		}
		
	}
	
	this.aniBounce = function() {
		if (!self.clicked && self.nodePos[0]) {
			self.nodePos[0] += (self.deltaMove.x/2);
			self.nodePos[1] += (self.deltaMove.y/2);
			self.deltaMove.x = nx.bounce(self.nodePos[0], self.bgLeft + self.nodeSize, self.width - self.bgLeft- self.nodeSize, self.deltaMove.x);
			self.deltaMove.y = nx.bounce(self.nodePos[1], self.bgTop + self.nodeSize, self.height - self.bgTop - self.nodeSize, self.deltaMove.y);
			self.draw();
			self.nxTransmit(self.scaleNode());
		}
	}
	
	this.init();
}
// Javascript Matrix slider


//function matrix(canvas, ajax_command, ui_id) {
function matrix(target, ajaxCommand, uiIndex) {

	//self awareness
	var self = this;
	this.uiIndex = uiIndex;
	this.defaultSize = { width: 200, height: 200 };
	
	//get common attributes and methods
	this.getTemplate = getTemplate;
	this.getTemplate(self, target, ajaxCommand);
	
	var i;
	
	this.row = 3;
	this.col = 3;
	
	this.on = false;
	this.off = 3;
	this.matrix; 
	this.matrixLevels;
	this.cellHgt;
	this.cellWid;
	this.pos;
	
	this.init = function() {
		
		// generate 2D matrix array
		self.matrix = new Array(self.row);
		self.matrixLevels = new Array(self.row);
		for (i=0;i<self.matrix.length;i++) {
			self.matrix[i] = new Array(self.col);
			self.matrixLevels[i] = new Array(self.col);
		}
		
		for (i=0;i<self.row;i++) {
			for (j=0;j<self.col;j++) {
				self.matrix[i][j] = 0; // set value of each matrix cell
				self.matrixLevels[i][j] = 1; // set default matrix levels
			}
		}
	
		self.draw();
		
	}
	
	
	this.draw = function() {
	
		this.cellWid = (this.canvas.width-(this.off*2))/this.col;
		this.cellHgt = (this.canvas.height-(this.off*2))/this.row;
		this.makeRoundedBG();
		with (this.context) {
			strokeStyle = self.colors.border;
			fillStyle = self.colors.fill;
			lineWidth = this.lineWidth;
			stroke();
			fill();
		}
		
		for (i=0;i<this.row;i++){
			for (j=0;j<this.col;j++) {
				var st_x = j*this.cellWid+this.padding+this.lineWidth; // starting point(left)
				var st_y = i*this.cellHgt+this.padding+this.lineWidth; // starting point(top)
				var mo_x = this.cellWid*this.matrix[i][j]; //dynamic changes of diagonal line
				var mo_y = this.cellHgt*this.matrix[i][j]; //dynamic changes of diagonal line
				var de_x = (j+1)*this.cellWid+this.off/2; // end point(right)
				var de_y = (i+1)*this.cellHgt+this.off+this.off/2; // end point(bottom)
				var boxwid = this.cellWid - this.padding - this.lineWidth;
				var boxhgt = this.cellHgt - this.padding - this.lineWidth;
	
				nx.makeRoundRect(this.context, st_x, st_y, boxwid, boxhgt);
				with (this.context) {
					strokeStyle = self.colors.border;
					fillStyle = self.colors.fill;
					lineWidth = this.lineWidth;
					stroke();
					fill();
	
					//if on
					if (this.matrix[i][j] > 0) {
						
						var level = Math.abs(this.matrix[i][j]-1);
						var x1 = st_x;
						var y1 = st_y+this.cellHgt*level-(5*level);
						var x2 = boxwid+x1;
						var y2 = (boxhgt*this.matrix[i][j])+y1;
						var depth = 6;
						
						beginPath();
						if (this.matrix[i][j]>0.95) {
							moveTo(x1+depth, y1); //TOP LEFT
							lineTo(x2-depth, y1); //TOP RIGHT
							quadraticCurveTo(x2, y1, x2, y1+depth);
						} else {
							moveTo(x1, y1); //TOP LEFT
							lineTo(x2, y1); //TOP RIGHT
						}
						lineTo(x2, y2-depth); //BOTTOM RIGHT
						quadraticCurveTo(x2, y2, x2-depth, y2);
						lineTo(x1+depth, y2); //BOTTOM LEFT
						quadraticCurveTo(x1, y2, x1, y2-depth);
						if (this.matrix[i][j]>0.95) {
							lineTo(x1, y1+depth); //TOP LEFT
							quadraticCurveTo(x1, y1, x1+depth, y1);
						} else {
							lineTo(x1, y1); //TOP LEFT
						}
						closePath();
						
						fillStyle = self.colors.accent;
						fill();
					}
				}
			} 
		}
	}
	
	var whichCell;
	
	this.click = function(e) {
		for (i=0; i<self.row; i++) {
			for (j=0; j<self.col; j++) {
				var cell_x = j*self.cellWid+self.off/2;
				var cell_y = i*self.cellHgt+self.off+self.off/2;
	
				if(cell_x<self.clickPos.x && self.clickPos.x<cell_x+self.cellWid && cell_y<self.clickPos.y && self.clickPos.y<cell_y+self.cellHgt) {
					if(e.shiftKey != 1) {
					//	self.matrix[i][j] = (self.matrix[i][j]+1)%2;
						if (self.matrix[i][j]>0) {
							self.matrix[i][j]=0;
						} else {
							self.matrix[i][j] = self.matrixLevels[i][j];	
						}
					}
					whichCell = [i,j];
					break;
				}
			}
		}
		self.nxTransmit(self.matrix);
		self.draw();
	}
	
	this.move = function(e) {
		if (self.clicked) {
			if (self.matrix[whichCell[0]][whichCell[1]] > 0) {
				
				delta_value = Math.min(1.0, Math.max(0.0, self.matrix[whichCell[0]][whichCell[1]]+(self.deltaMove.y*-1)*0.01));	
				self.matrix[whichCell[0]][whichCell[1]] = delta_value;
				self.matrixLevels[whichCell[0]][whichCell[1]] = delta_value;
				self.nxTransmit(self.matrix);
				self.draw();
	
			}
		}
	}
	
	this.release = function() {
		
	}
	
		
	this.touch = function(e) {
		for (i=0; i<self.row; i++) {
			for (j=0; j<self.col; j++) {
				var cell_x = j*self.cellWid+self.off/2;
				var cell_y = i*self.cellHgt+self.off+self.off/2;
	
				if(cell_x<self.clickPos.x && self.clickPos.x<cell_x+self.cellWid && cell_y<self.clickPos.y && self.clickPos.y<cell_y+self.cellHgt) {
					if(e.shiftKey != 1) {
					//	self.matrix[i][j] = (self.matrix[i][j]+1)%2;
						if (self.matrix[i][j]>0) {
							self.matrix[i][j]=0;
						} else {
							self.matrix[i][j] = self.matrixLevels[i][j];	
						}
					}
					whichCell = [i,j];
					break;
				}
			}
		}
		self.nxTransmit(self.matrix);
		self.draw();
	}


	this.touchMove = function(e) {
		if (self.clicked) {
			if (self.matrix[whichCell[0]][whichCell[1]] > 0) {
				
				delta_value = Math.min(1.0, Math.max(0.0, self.matrix[whichCell[0]][whichCell[1]]+(self.deltaMove.y*-1)*0.01));	
				self.matrix[whichCell[0]][whichCell[1]] = delta_value;
				self.matrixLevels[whichCell[0]][whichCell[1]] = delta_value;
				self.draw();
	
			} 
		}
		self.nxTransmit(self.matrix);
	}


	this.touchRelease = function(e) {
	}
	
	this.init();
	
}
// Javascript 2d_slider

function slider(target, ajaxCommand, oscName, uiIndex, oscIp) {
					
	//self awareness
	var self = this;
	this.uiIndex = uiIndex;
	this.defaultSize = { width: 30, height: 200 };
	
	//get common attributes and methods
	this.getTemplate = getTemplate;
	this.getTemplate(self, target, ajaxCommand);
	
	//unique attributes
	this.value = 0.7
	this.realSpace = { x: self.width-self.padding*2, y: self.height-self.padding*2 }
	this.sliderWidth = self.realSpace.x;
		
	this.throttle = nx.throttle;
	this.clip = nx.clip;
	
	

	this.init = function() {
		getHandlers(self);
		
		if (!self.ajaxCommand) {
			self.ajaxCommand = "slider";
		}

		self.draw();
	}

	this.draw = function() {
		self.erase();
		self.makeRoundedBG();
		
		var level = self.value;
		var x1 = self.padding;
		var y1 = self.height-self.value*self.height;
		var x2 = self.padding+self.sliderWidth;
		var y2 = self.height-self.padding;
		var depth = self.padding*2;
		
		
		with (this.context) {
			strokeStyle = self.colors.border;
			fillStyle = self.colors.fill;
			lineWidth = self.lineWidth;
			stroke();
			fill();
			
			strokeStyle = this.colors.accent;
			fillStyle = this.colors.accent;
			lineWidth = 5;
	    	
			beginPath();
			if (self.value>0.97) {
				moveTo(x1+depth, y1); //TOP LEFT
				lineTo(x2-depth, y1); //TOP RIGHT
				quadraticCurveTo(x2, y1, x2, y1+depth);
			} else {
				moveTo(x1, y1); //TOP LEFT
				lineTo(x2, y1); //TOP RIGHT
				//stroke();
			}
			lineTo(x2, y2-depth); //BOTTOM RIGHT
			quadraticCurveTo(x2, y2, x2-depth, y2);
			lineTo(x1+depth, y2); //BOTTOM LEFT
			quadraticCurveTo(x1, y2, x1, y2-depth);
			if (self.value>0.95) {
				lineTo(x1, y1+depth); //TOP LEFT
				quadraticCurveTo(x1, y1, x1+depth, y1);
			} else {
				lineTo(x1, y1); //TOP LEFT
			}
			if (self.value>0.03) {
			//	globalAlpha = 0.3;
				fill();	
			//	globalAlpha = 1;
			}
			closePath();
		} 
	}
	
	this.click = function() {
		self.move();
	}

	this.move = function() {
		if (self.clicked) {
			self.value = (Math.abs((nx.clip(self.clickPos.y / self.height, 0.01, 0.98)) - 1));
			self.draw();
		}
		self.nxTransmit(self.value);
	}
	

	this.release = function() {
		
	}

	this.touch = function() {
		self.move();
	}

	this.touchMove = function() {
		self.move();
	}

	this.touchRelease = function() {
		
	}
}
// Javascript Multislider

function multislider(target, ajaxCommand, oscName, uiIndex, oscIp) {
					
	//self awareness
	var self = this;
	this.uiIndex = uiIndex;
	this.defaultSize = { width: 300, height: 200 };
	
	//get common attributes and methods
	this.getTemplate = getTemplate;
	this.getTemplate(self, target, ajaxCommand);
	
	//unique attributes
	this.sliders = 15;
	this.values = new Array();
	for (var i=0;i<this.sliders;i++) {
		this.values.push(0.7 - i*(0.3/this.sliders));
	}
	this.sliderClicked = 0;
	this.realSpace = { x: self.width-self.padding*2, y: self.height-self.padding*2 }
	this.sliderWidth = self.realSpace.x/self.sliders;
	this.oldSliderToMove;
		
	this.throttle = nx.throttle;
	this.clip = nx.clip;
	
	

	this.init = function() {
		getHandlers(self);

		self.draw();
	}

	this.draw = function() {
		self.erase();
		self.makeRoundedBG();
		with (this.context) {
			strokeStyle = self.colors.border;
			fillStyle = self.colors.fill;
			lineWidth = self.lineWidth;
			stroke();
			fill();
			
			strokeStyle = this.colors.accent;
			fillStyle = this.colors.accent;
			lineWidth = 5;
	    
	    	
			for(i=0; i<self.sliders; i++) {
				beginPath();
				moveTo(self.padding+i*self.sliderWidth, self.height-self.values[i]*self.height);
				lineTo(self.padding+i*self.sliderWidth + self.sliderWidth, self.height-self.values[i]*self.height);
				stroke();
				lineTo(self.padding+i*self.sliderWidth + self.sliderWidth, self.height-self.padding);
				lineTo(self.padding+i*self.sliderWidth,  self.height-self.padding);
				globalAlpha = 0.3 - (i%3)*0.1;
				fill();
				closePath();
				globalAlpha = 1;
			}
		}
	}
	
	this.click = function() {
		self.oldSliderToMove = false;
		self.move();
	}

	this.move = function() {
		if (self.clicked) {
			var sliderToMove = Math.floor(self.clickPos.x / self.sliderWidth);
			self.values[sliderToMove] = (Math.abs((self.clickPos.y / self.height) - 1));
			if (self.oldSliderToMove) {
				var sliderJump = sliderToMove -  self.oldSliderToMove;
				if (sliderJump>1) {
					var sliderIncrement = ( self.values[sliderToMove] - self.values[self.oldSliderToMove] ) / sliderJump;
					for (i=1;i<sliderJump;i++) {			
						self.values[self.oldSliderToMove+i] = self.values[self.oldSliderToMove] + sliderIncrement * i;		
					}
				}
				if (sliderJump<-1) {
					var sliderIncrement = ( self.values[sliderToMove] - self.values[self.oldSliderToMove] ) / Math.abs(sliderJump);
					for (i=-1;i>sliderJump;i--) {			
						self.values[self.oldSliderToMove+i] = self.values[sliderToMove] + sliderIncrement * i;		
					}
				}
				/*sliderToMove value = 100
				
				* oldslidertomove value = 50
				* slider increment = -25
				* 
				* 
				* */
				
			}
			self.oldSliderToMove = sliderToMove;
			self.draw();
		}
		//FIXME: how to send multiple values?
		self.nxTransmit(self.values);
	}
	

	this.release = function() {
		
	}

	this.touch = function() {
		self.oldSliderToMove = false;
		self.move();
	}

	this.touchMove = function() {
		self.move();
	}

	this.touchRelease = function() {
		
	}
	
	this.setNumberOfSliders = function(numOfSliders) {
		this.sliders = numOfSliders;
		this.values = new Array();
		for (var i=0;i<this.sliders;i++) {
			this.values.push(0.5);
		}
		this.sliderWidth = self.realSpace.x/self.sliders;
		this.init();
	}
}