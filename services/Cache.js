const NodeCache = require('node-cache');

const c = new NodeCache({ stdTTL: 240, checkperiod: 300 });
exports.OutboundBlockCache = c;
/*
set(key, val, [ ttl ]): Used to set some value corresponding to a particular key in the cache. This same key must be used to retrieve this value.
get(key):Used to get value set to specified key. It returns undefined, if the key is not already present.
has(key): Used to check if the cache already has some value set for specified key. Returns true if present otherwise false.
*/

// myCache.set( key, val, [ ttl ] )
// myCache.get( key )
// myCache.take( key )

// get the cached value and remove the key from the cache.
// Equivalent to calling get(key) + del(key).
// myCache.del( key )
// myCache.del( [ key1, key2, ..., keyn ] )

// Delete multiple keys. Returns the number of deleted entries. A delete will never fail.
// myCache.ttl( key, ttl )

// Redefine the ttl of a key. Returns true if the key has been found and changed.\
// myCache.on( "set", function( key, value ){
//     // ... do something ...
// });
