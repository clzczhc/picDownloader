import { Worker } from "worker_threads";

// 线程池管理器
export class ThreadPool {
  constructor(maxThreads = 4) {
    this.maxThreads = maxThreads;
    this.threads = [];
    this.threadsTaskCount = []; // 每个线程的任务数量
    this.pendingTasks = [];
  }

  excuteTask(data) {
    if (this.threads.length < this.maxThreads) {
      // 当前没达到限制，直接创建新的线程
      const thread = new Worker("./worker.js");
      this.threads.push(thread);

      thread.on("message", () => {
        const excuteNext = this.pendingTasks.shift();
        if (excuteNext) {
          excuteNext(thread);
        } else {
          this.threads.splice(this.threads.indexOf(thread), 1);
        }
      });

      thread.postMessage(data);
    } else {
      const excutingTask = (thread) => {
        thread.postMessage(data);
      };

      this.pendingTasks.push(excutingTask);
    }
  }
}
