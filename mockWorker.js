import { parentPort } from "worker_threads";

// 模拟下载任务
async function mockDownload(startId, endId) {
  console.log(`Worker ${process.pid} 开始模拟下载: ${startId} - ${endId}`);

  // 模拟下载延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`Worker ${process.pid} 完成模拟下载: ${startId} - ${endId}`);

  // 通知主线程批次完成
  parentPort.postMessage({
    type: "batchComplete",
    startId: startId,
    endId: endId,
    lastDownloadId: endId,
  });
}

// 监听主线程消息
parentPort.on("message", async (data) => {
  if (data.type === "downloadBatch") {
    await mockDownload(data.startId, data.endId);
  }
});
