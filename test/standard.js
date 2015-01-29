var LFU = require('../');
var assert = require('assert');

describe("standard mode", function suite() {
	it("should evict first added item", function(done) {
		var lfu = LFU(2);
		lfu.on('eviction', function(key, obj) {
			assert.equal("test", key);
			assert.equal("val", obj && obj.my);
			done();
		});
		lfu.set('test', {my: "val"});
		lfu.set('test2', {my: "val2"});
		lfu.get('test2');
		lfu.set('test3', {my: "val3"});
	});
});

