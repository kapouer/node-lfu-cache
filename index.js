var events = require('events');
var util = require('util');
var circularJSON = require('circular-json');

module.exports = LFU;

function LFU(size, halflife) {
	if (!(this instanceof LFU)) return new LFU(size, halflife);
	this.size = size || 10;
	this.halflife = halflife || null;
	this.cache = {};
	this.head = freq();
	this.length = 0;
	this.lastDecay = Date.now();
}
util.inherits(LFU, events.EventEmitter);

LFU.prototype.get = function(key) {
	var el = this.cache[key];
	if (!el) return;
	var cur = el.parent;
	var next = cur.next;
	if (!next || next.weight != cur.weight + 1) {
		next = node(cur.weight + 1, cur, next);
	}
	this.removeFromParent(el.parent, key);
	next.items.add(key);
	el.parent = next;
	var now = Date.now();
	el.atime = now;
	if (this.halflife && now - this.lastDecay >= this.halflife) this.decay();
	this.atime = now;
	return el.data;
};

LFU.prototype.decay = function() {
	// iterate over all entries and move the ones that have
	// this.atime - el.atime > this.halflife
	// to lower freq nodes
	// the idea is that if there is 10 hits / minute, and a minute gap,
	var now = Date.now();
	this.lastDecay = now;
	var diff = now - this.halflife;
	var halflife = this.halflife;
	var el, weight, cur, prev;
	for (var key in this.cache) {
		el = this.cache[key];
		if (diff > el.atime) {
			// decay that one
			// 1) find freq
			cur = el.parent;
			weight = Math.round(cur.weight / 2);
			if (weight == 1) continue;
			prev = cur.prev;
			while (prev) {
				if (prev.weight <= weight) break;
				cur = prev;
				prev = prev.prev;
			}
			if (!prev || !cur) {
				throw new Error("Empty before and after halved weight - please report");
			}
			// 2) either prev has the right weight, or we must insert a freq with
			// the right weight
			if (prev.weight < weight) {
				prev = node(weight, prev, cur);
			}
			this.removeFromParent(el.parent, key);
			el.parent = prev;
			prev.items.add(key);
		}
	}
};

LFU.prototype.set = function(key, obj) {
	var el = this.cache[key];
	if (el) {
		el.data = obj;
		return;
	}
	var now = Date.now();
	if (this.halflife && now - this.lastDecay >= this.halflife) {
		this.decay();
	}
	if (this.length == this.size) {
		this.evict();
	}
	this.length++;
	var cur = this.head.next;
	if (!cur || cur.weight != 1) {
		cur = node(1, this.head, cur);
	}
	cur.items.add(key);
	this.cache[key] = {
		data: obj,
		atime: now,
		parent: cur
	};
};

LFU.prototype.remove = function(key) {
	var el = this.cache[key];
	if (!el) return;
	delete this.cache[key];
	this.removeFromParent(el.parent, key);
	this.length--;
	return el.data;
};

LFU.prototype.removeFromParent = function(parent, key) {
	Object.setPrototypeOf(parent.items, new Set());
	parent.items.remove(key);
	if (parent.items.length == 0) {
		parent.prev.next = parent.next;
		if (parent.next) parent.next.prev = parent;
	}
};

LFU.prototype.evict = function() {
	var least = this.head.next && this.head.next.items.first();
	if (least) {
		this.emit('eviction', least, this.remove(least));
	} else {
		throw new Error("Cannot find an element to evict - please report issue");
	}
};

LFU.prototype.export = function() {
	return circularJSON.stringify(this.cache);
}

LFU.prototype.import = function(cache) {
	this.cache = circularJSON.parse(cache);
}

function freq() {
	return {
		weight: 0,
		items: new Set()
	}
}
function item(obj, parent) {
	return {
		obj: obj,
		parent: parent
	};
}
function node(weight, prev, next) {
	var node = freq();
	node.weight = weight;
	node.prev = prev;
	node.next = next;
	prev.next = node;
	if (next) next.prev = node;
	return node;
}

function Set() {
	this.hash = {};
	this.head = {};
	this.length = 0;
}

Set.prototype.add = function(str) {
	if (this.hash[str]) return;
	var item = {
		next: this.head.next,
		prev: this.head,
		val: str
	};
	var next = this.head.next;
	this.head.next = item;
	if (next) next.prev = item;
	this.hash[str] = item;
	this.length++;
};

Set.prototype.remove = function(str) {
	var item = this.hash[str];
	if (!item) return;
	delete this.hash[str];
	item.prev.next = item.next;
	if (item.next) item.next.prev = item.prev;
	this.length--;
};

Set.prototype.first = function() {
	return this.head.next && this.head.next.val;
};
