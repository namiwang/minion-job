# minion-job

Multi-process, multi-queue background processing for both node and browser.

## Usage

```
var job = new MinionJob.Job(
  function(dataset){
    some_intense_job(dataset)
  }
)

job.perform_later(dataset)
```

## Inside

Using Web Worker in browser and [node-webworker-threads](https://github.com/audreyt/node-webworker-threads) in node as multi-process implantation.

Using Loki.js for in-memory data storage in both browser and node.
