import { ThreadPool } from "./threadPool.js";

async function testThreadPool() {
  console.log("开始测试线程池批量下载功能...");

  // 创建线程池，每个线程负责10张图片
  const threadPool = new ThreadPool(4, 10);

  // 设置测试任务范围（ID 1-50）
  threadPool.setTaskRange(1, 50);

  // 设置批次完成回调
  threadPool.setBatchCompleteCallback((lastDownloadId) => {
    console.log(`批次完成，最后下载ID: ${lastDownloadId}`);
  });

  try {
    // 启动线程池
    threadPool.start();

    // 等待所有任务完成
    await threadPool.waitForAllTasks();

    console.log("所有测试任务完成");
  } catch (error) {
    console.error("测试出错:", error);
  } finally {
    await threadPool.shutdown();
    console.log("线程池已关闭");
  }
}

testThreadPool();
