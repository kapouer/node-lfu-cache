lfu-cache for Node.js
=====================

This module implements an O(1) Least Frequently Used cache, as described
in the paper "An O(1) algorithm for implementing the LFU cache eviction scheme"
by K. Shah, A. Mitra and D. Matani.

It also features a "decay" parameter (default null, no decay) that penalizes
objects that have not been accessed after `Date.now() - decay`, by halving their
frequency every 'decay' milliseconds.

Important: decay happens at most every `decay` milliseconds, and it's a costly
operation, so this parameter should not be too small (a minute is good).

The cache emits an "eviction" event with parameters (key, value), when
a least frequently used element has been evicted to make room for the cache.

Usage
-----

```

var lfu = require('lfu-cache')(
	2,   // max size of the cache
	60000    // decay of the entries in milliseconds
);

lfu.on('eviction', function(key, obj) {
	console.log("test was evicted", key, obj);
});
lfu.set('test', {my: "val"});
lfu.set('test2', {my: "val2"});
lfu.get('test2');
lfu.set('test3', {my: "val2"});

```

