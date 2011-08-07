function Point(x, y)
{
	this.x = typeof(x) == 'undefined' ? 0 : x;
	this.y = typeof(y) == 'undefined' ? 0 : y;
	self = this;
}

function Node(paper, x, y, content, radius)
{
	var x = x;
	var y = y;
	var content = typeof(content) == 'undefined' ? '' : content;
	var radius = typeof(radius) == 'undefined' ? 25 : radius;
	this.connections = [];

	if(typeof(x) != 'undefined' && typeof(y) != 'undefined')
	{
		this.graphic = paper.circle(x, y, radius);
		this.text = paper.text(x, y, content.toString());
		this.graphicElems = paper.set().push(this.graphic).push(this.text);
	}
	else
	{
		this.graphic = null;
		this.text = null;
		this.graphicElems = null;
	}

	this.color = function(color) {
		if(typeof(color) == 'undefined')
		{
			color = this.graphic.attr('fill');
			if(color.substr(0, 3) == 'rgb')
			{
				numberPattern = /\d+,\d+,\d+/;
				numbers = color.match(numberPattern)[0].split(',');
				return {r: numbers[0], g: numbers[1], b: numbers[2]};
			}
		}
		else
		{
			this.attr('fill', 'rgb(' + [color.r, color.g, color.b] + ')');
		}
	}

	this.x = function(data) {
		if(typeof(data) == 'undefined')
			return x;
		else {
			x = data;
			this.graphic.attr('cx', x);
			this.text.attr('x', x);
			for(i in this.connections) {
				this.connections[i].update();
			}
		}
	}
	this.y = function(data) {
		if(typeof(data) == 'undefined')
			return y;
		else {
			y = data;
			this.graphic.attr('cy', y);
			this.text.attr('y', y);
			for(i in this.connections) {
				this.connections[i].update();
			}
		}
	}
	this.content = function(data) {
		if(typeof(data) == 'undefined')
			return content;
		else {
			content = data;
			this.text.attr('text', content);
		}
	}
	this.radius = function(data) {
		if(typeof(data) == 'undefined')
			return radius;
		else {
			radius = data;
			this.graphic.attr('r', radius);
		}
	}
	this.attr = function() {
		if(arguments.length == 0)
			return this.graphic.attr();
		if(arguments.length == 1)
			this.graphic.attr(arguments[0]);
		else
			this.graphic.attr.apply(this.graphic, arguments);
		return this;
	}
	this.toFront = function() {
		this.graphicElems.toFront()
	}
}
function MovableNode(paper, x, y, content, radius)
{
	Node.call(this, paper, x, y, content, radius);
	this.graphic.drag(move, start, up);
	this.text.drag(move, start, up);
	var self = this;

	function start()
	{
		this.ox = self.x();
		this.oy = self.y();
		self.attr({opacity: .5});
	}
	function move(dx, dy)
	{
		self.x(this.ox + dx);
		self.y(this.oy + dy);
	}
	function up() {
		self.attr({opacity: 1});
	}
}
MovableNode.prototype = new Node()

function Edge(paper, node1, node2)
{
	var node1 = node1;
	var node2 = node2;

	node1.connections.push(this);
	node2.connections.push(this);

	this.graphic = paper.edge(node1, node2);
	this.update = function() {
		var path = this.graphic.attr('path');
		path[0][1] = node1.x();
		path[0][2] = node1.y();
		path[1][1] = node2.x();
		path[1][2] = node2.y();
		this.graphic.attr('path', path);
	}
	this.attr = function() {
		if(arguments.length == 0)
			return this.graphic.attr();
		if(arguments.length == 1)
			this.graphic.attr(arguments[0]);
		else
			this.graphic.attr.apply(this.graphic, arguments);
		return this;
	}
	this.destroy = function() {
		this.graphic.remove();
	}
}
function DirEdge(paper, startnode, endnode)
{
	var arrowLength = 10;
	var arrowWidth = 5;
	var r, m, dx, dy, d, ix, iy, ox, oy, px, py;

	var startnode = startnode;
	var endnode = endnode;

	startnode.connections.push(this);
	endnode.connections.push(this);

	function calculateArrow() {
		r = endnode.radius();
		m = (endnode.y() - startnode.y()) / (endnode.x() - startnode.x());
		dx = endnode.x() - startnode.x();
		dy = endnode.y() - startnode.y();
		d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		ix = dx * ((d - r) / d) + startnode.x();
		iy = dy * ((d - r) / d) + startnode.y();
		ox = dx * ((d - r - arrowLength) / d) + startnode.x();
		oy = dy * ((d - r - arrowLength) / d) + startnode.y();
		n = -1 / m;
		px = Math.sqrt(Math.pow(arrowWidth, 2) / (1 + Math.pow(n, 2)));
		py = Math.sqrt(Math.pow(arrowWidth, 2) / (1 + Math.pow(n, 2))) * n;
	}
	calculateArrow();

	this.line = paper.edge(startnode, endnode);
	//arrow is p1 -> p2 -> i
	this.arrow = paper.path("M " + [ox + px, oy + py] +
												 " L " + [ox - px, oy - py] +
												 " L " + [ix, iy] + 
												 " Z");
	this.graphic = paper.set().push(this.line).push(this.arrow);
	this.update = function() {
		var path = this.line.attr('path');
		path[0][1] = startnode.x();
		path[0][2] = startnode.y();
		path[1][1] = endnode.x();
		path[1][2] = endnode.y();
		this.line.attr('path', path);

		calculateArrow();
		path = this.arrow.attr('path');
		path[0][1] = ox + px;
		path[0][2] = oy + py;
		path[1][1] = ox - px;
		path[1][2] = oy - py;
		path[2][1] = ix;
		path[2][2] = iy;
		this.arrow.attr('path', path);
	}
	this.attr = function() {
		if(arguments.length == 0)
			return this.graphic.attr();
		if(arguments.length == 1)
			this.graphic.attr(arguments[0]);
		else
			this.graphic.attr.apply(this.graphic, arguments);
		return this;
	}
	this.destroy = function() {
		for(var i in startnode.connections)
		{
			if(startnode.connections[i] === this)
			{
				delete startnode.connections[i];
				break;
			}
		}
		for(var i in endnode.connections)
		{
			if(endnode.connections[i] === this)
			{
				delete endnode.connections[i];
				break;
			}
		}
		this.graphic.remove();
	}
	this.startnode = function() {return startnode;}
	this.endnode = function() {return endnode;}
}
Raphael.fn.edge = function(node1, node2) {
	return this.path("M " + [node1.x(), node1.y()]
								+ " L " + [node2.x(), node2.y()]);
};
Raphael.fn.diredge = function(paper, startnode, endnode) {
	var result = paper.set();
	var arrowLength = 10;
	var arrowWidth = 5;
	var edge = this.path("M " + [startnode.x(), startnode.y()]
										+ " L " + [endnode.x(), endnode.y()]);
	//o is the furthest back the arrow goes on the line
	var intersect = edge.getPointAtLength(edge.getTotalLength() - endnode.radius());
	var o = edge.getPointAtLength(edge.getTotalLength() - endnode.radius() - arrowLength);
	o.alpha = Raphael.rad(o.alpha - 90); //Need to convert the angle and rotate the axes
	var x = arrowWidth * Math.cos(o.alpha);
	var y = arrowWidth * Math.sin(o.alpha);
	var arrow = this.path("M " + [intersect.x, intersect.y] +
					 						 " L " + [o.x - x, o.y - y] +
					 						 " L " + [o.x + x, o.y + y] +
					 						 " Z");
	return result.push(arrow, edge); //this ordering is so that when a call to toBack() is made, the arrow is in the front.
};
