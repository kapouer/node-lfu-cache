lfu-cache for Node.js
=====================

This module implements an O(1) Least Frequently Used cache, as described
in the paper "An O(1) algorithm for implementing the LFU cache eviction scheme"
by K. Shah, A. Mitra and D. Matani.

It also features an "aging" parameter that penalizes objects that have not
been accessed since `Date.now() - aging * 1000`, by halving their frequency
every 'aging' seconds.

The cache emits an "eviction" event with parameters (key, value).

Usage
-----

```

var lfu = require('lfu-cache')(
	2,   // max size of the cache
	60    // aging of the entries in seconds
);

lfu.on('eviction', function(key, obj) {
	console.log("test was evicted", key, obj);
});
lfu.set('test', {my: "val"});
lfu.set('test2', {my: "val2"});
lfu.get('test2');
lfu.set('test3', {my: "val2"});

```

