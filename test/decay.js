var LFU = require('../');
var assert = require('assert');

describe("decay mode", function suite() {
	it("should evict least frequently accessed item and decay non-accessed items (2 items)", function(done) {
		var decay = 100;
		this.timeout(2 * decay);
		var lfu = LFU(2, decay);
		lfu.on('eviction', function(key, obj) {
			assert.equal("perempting", key);
			done();
		});
		// access now test1 one time
		lfu.set('eventually', 'me');
		setTimeout(function() {
			// access before decay test1 one time
			lfu.get('eventually');
			lfu.get('eventually');
		}, decay / 2);
		lfu.set('perempting', {my: "val2"});
		// access now test2 three times
		lfu.get('perempting');
		lfu.get('perempting');
		lfu.get('perempting');
		setTimeout(function() {
			// decay should have happened, test2 is going to have Math.floor(frequentation / 2) = 1
			// and test1 keeps frequentation at 2 so test2 will be evicted besides it be accessed
			// three times and test1 accessed only two times
			lfu.set('evicter', 'stuff');
		}, decay + 1);
	});
	it("should evict least frequently accessed item and decay non-accessed items (3 items)", function(done) {
		var decay = 100;
		this.timeout(2 * decay);
		var lfu = LFU(3, decay);
		lfu.on('eviction', function(key, obj) {
			assert.equal("last", key);
			done();
		});
		// access now test1 one time
		lfu.set('eventually', 'me');
		setTimeout(function() {
			// access before decay test1 one time
			lfu.get('eventually');
			lfu.get('eventually');
		}, decay / 2);
		lfu.set('perempting', {my: "val2"});
		// access now test2 three times
		lfu.get('perempting');
		lfu.get('perempting');
		lfu.get('perempting');
		setTimeout(function() {
			lfu.set('last', 'one');
		}, decay / 3);
		setTimeout(function() {
			// decay should have happened, test2 is going to have Math.floor(frequentation / 2) = 1
			// and test1 keeps frequentation at 2 so test2 will be evicted besides it be accessed
			// three times and test1 accessed only two times
			lfu.set('evicter', 'stuff');
		}, decay + 1);
	});
});

