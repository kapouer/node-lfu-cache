var events = require('events');
var util = require('util');

module.exports = LFU;

function LFU(size, aging) {
	if (!(this instanceof LFU)) return new LFU(size, aging);
	this.size = size || 10;
	this.aging = aging || null;
	this.cache = {};
	this.head = freq();
	this.length = 0;
}
util.inherits(LFU, events.EventEmitter);

LFU.prototype.get = function(key) {
	var el = this.cache[key];
	if (!el) return;
	var curfreq = el.parent;
	var nextfreq = freq.next;
	if (!nextfreq || nextfreq.weight != curfreq.weight + 1) {
		nextfreq = node(curfreq.weight + 1, curfreq, nextfreq);
	}
	this.removeParent(el.parent, key);
	nextfreq.items.add(key);
	el.parent = nextfreq;
	el.atime = Date.now();
	return el.data;
};

LFU.prototype.set = function(key, obj) {
	var el = this.cache[key];
	if (el) {
		el.data = obj;
		return;
	}
	if (this.length == this.size) {
		this.evict();
	}
	this.length++;
	var curfreq = this.head.next;
	if (!curfreq || curfreq.weight != 1) {
		curfreq = node(1, this.head, curfreq);
	}
	curfreq.items.add(key);
	this.cache[key] = {
		data: obj,
		atime: Date.now(),
		parent: curfreq
	};
};

LFU.prototype.remove = function(key) {
	var el = this.cache[key];
	if (!el) return;
	delete this.cache[key];
	this.removeParent(el.parent, key);
	this.length--;
	return el.data;
};

LFU.prototype.removeParent = function(parent, key) {
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
	}
};

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
