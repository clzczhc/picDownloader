import { Worker } from "worker_threads";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 线程池管理器
export class ThreadPool {
  constructor(maxThreads = 4, batchSize = 10) {
    this.maxThreads = maxThreads;
    this.batchSize = batchSize; // 每个线程负责的图片数量
    this.workers = []; // 存储所有worker实例
    this.idleWorkers = []; // 空闲的worker队列
    this.busyWorkers = []; // 忙碌的worker队列
    this.taskQueue = []; // 待执行的任务队列
    this.currentId = 0; // 当前处理的ID
    this.endId = 0; // 结束ID
    this.onBatchComplete = null; // 批次完成回调
  }

  // 设置任务范围
  setTaskRange(startId, endId) {
    this.currentId = startId;
    this.endId = endId;
  }

  // 设置批次完成回调
  setBatchCompleteCallback(callback) {
    this.onBatchComplete = callback;
  }

  // 创建新的worker
  createWorker() {
    // 使用模拟worker进行测试
    const workerPath = path.join(__dirname, "mockWorker.js");
    const worker = new Worker(workerPath);

    // 设置worker消息处理
    worker.on("message", (message) => {
      this.handleWorkerMessage(worker, message);
    });

    // 设置worker错误处理
    worker.on("error", (error) => {
      console.error("Worker error:", error);
      this.removeWorker(worker);
    });

    // 设置worker退出处理
    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
      this.removeWorker(worker);
    });

    return worker;
  }

  // 处理worker消息
  handleWorkerMessage(worker, message) {
    if (message.type === "batchComplete") {
      // 批次完成
      console.log(
        `Worker ${worker.threadId} 完成批次: ${message.startId} - ${message.endId}`
      );

      // 调用批次完成回调
      if (this.onBatchComplete) {
        this.onBatchComplete(message.lastDownloadId);
      }

      // 分配新任务
      this.assignNextBatch(worker);
    } else if (message.type === "error") {
      console.error("Worker error:", message.error);
      // 重新分配任务
      this.assignNextBatch(worker);
    }
  }

  // 分配下一个批次任务
  assignNextBatch(worker) {
    if (this.currentId > this.endId) {
      // 所有任务完成，标记worker为空闲
      this.markWorkerIdle(worker);
      return;
    }

    const startId = this.currentId;
    const endId = Math.min(this.currentId + this.batchSize - 1, this.endId);

    // 更新当前ID
    this.currentId = endId + 1;

    // 分配任务给worker
    worker.postMessage({
      type: "downloadBatch",
      startId: startId,
      endId: endId,
    });
  }

  // 标记worker为空闲
  markWorkerIdle(worker) {
    const busyIndex = this.busyWorkers.indexOf(worker);
    if (busyIndex > -1) {
      this.busyWorkers.splice(busyIndex, 1);
      this.idleWorkers.push(worker);
    }

    // 检查是否还有待处理的任务
    this.processNextTask();
  }

  // 移除worker
  removeWorker(worker) {
    const busyIndex = this.busyWorkers.indexOf(worker);
    if (busyIndex > -1) {
      this.busyWorkers.splice(busyIndex, 1);
    }

    const idleIndex = this.idleWorkers.indexOf(worker);
    if (idleIndex > -1) {
      this.idleWorkers.splice(idleIndex, 1);
    }

    const allIndex = this.workers.indexOf(worker);
    if (allIndex > -1) {
      this.workers.splice(allIndex, 1);
    }

    worker.terminate();
  }

  // 处理下一个任务
  processNextTask() {
    if (this.currentId > this.endId) {
      return; // 所有任务已完成
    }

    let worker = null;

    // 优先使用空闲的worker
    if (this.idleWorkers.length > 0) {
      worker = this.idleWorkers.shift();
    } else if (this.workers.length < this.maxThreads) {
      // 创建新的worker
      worker = this.createWorker();
      this.workers.push(worker);
    } else {
      // 没有可用的worker，任务继续等待
      return;
    }

    // 分配任务
    this.busyWorkers.push(worker);
    this.assignNextBatch(worker);
  }

  // 开始执行任务
  start() {
    console.log(`开始下载任务: ${this.currentId} - ${this.endId}`);
    console.log(`线程池大小: ${this.maxThreads}, 批次大小: ${this.batchSize}`);

    // 启动初始worker
    for (
      let i = 0;
      i <
      Math.min(
        this.maxThreads,
        Math.ceil((this.endId - this.currentId + 1) / this.batchSize)
      );
      i++
    ) {
      this.processNextTask();
    }
  }

  // 等待所有任务完成
  async waitForAllTasks() {
    return new Promise((resolve) => {
      const checkComplete = () => {
        if (this.currentId > this.endId && this.busyWorkers.length === 0) {
          resolve();
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      checkComplete();
    });
  }

  // 关闭线程池
  async shutdown() {
    // 等待所有任务完成
    await this.waitForAllTasks();

    // 终止所有worker
    for (const worker of this.workers) {
      worker.terminate();
    }

    this.workers = [];
    this.idleWorkers = [];
    this.busyWorkers = [];
  }
}
