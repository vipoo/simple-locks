# Simple Lock

## A Node package to provide a simple resource locking system

### requirements

* Node 8.10 or greater

NB: Only tested on linux

Locks are managed as file resource in the system /tmp directory

### Installing

```npm install --save vipoo/simple-locks#master```

### Use

#### Block method

```
const simpleLocks = require('simple-locks')

// Acquire a lock, that will be exclusive
// Method blocks if resource is currently locked
// Resource will auto release after 2 seconds (currently hard-coded)
await simpleLocks.acquire('blah', async () => {
  // async code here will have exclusive use of resource 'blah'
  // lock will be released when async method finishes
  // NB: long duration locks will become stale - no auto refershing of lock
})
```


#### Non-block method

```
const simpleLocks = require('simple-locks')

// Acquire a lock, that will be exclusive
// Method blocks if resource is currently locked
// Resource will auto release after 2 seconds (currently hard-coded)
await simpleLocks.acquire('blah')

// An optional timeout (the time it will block while waiting for resource to be free)
await simpleLocks.acquire('blah', optionalTimeout)


// To release a lock
await simpleLocks.release('blah')

```


