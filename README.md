# MinionJob

Multi-process, multi-queue background processing in both node and browser.

## Install

```
npm install minion-job --save
```

## Usage

### In browser
```javascript
var job = new MinionJob.Job(
  function(dataset){
    do_some_intense_work(dataset)
  },
  'urgent_queue'
)

job.perform_later(dataset)
```

### In Node.js

Well, it's almost exactly the same code as in browser.

```javascript
var MinionJob = require('minion-job')

var job = new MinionJob.Job(
  function(dataset){
    do_some_intense_work(dataset)
  },
  'urgent_queue'
)

job.perform_later('abc')
```

## Inside

Using Web Worker in browser and [node-webworker-threads](https://github.com/audreyt/node-webworker-threads) in node as multi-process implantation.

Using [Loki.js](http://lokijs.org/) for in-memory data storage in both browser and node.

## More

Please feel free to create issues for bugs, feature requests and other discussions.
