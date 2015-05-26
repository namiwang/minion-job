# MinionJob

Multi-process, multi-queue background processing in both node and browser.

## Usage

```
var job = new MinionJob.Job(
  function(dataset){
    do_some_intense_work(dataset)
  },
  'urgent_queue'
)

job.perform_later(dataset)
```

## Inside

Using Web Worker in browser and [node-webworker-threads](https://github.com/audreyt/node-webworker-threads) in node as multi-process implantation.

Using Loki.js for in-memory data storage in both browser and node.
