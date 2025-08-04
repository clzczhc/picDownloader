/*
 * @Author: clz chenzaihong@shimo.im
 * @Date: 2025-08-04 14:45:33
 * @LastEditors: clz chenzaihong@shimo.im
 * @LastEditTime: 2025-08-04 14:54:57
 * @FilePath: /picDownloader/index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import fs from "fs";
import {
  imgSource,
  limit,
  startId,
  endId,
  distance,
  isDistence,
  continuteLastTime,
} from "./data.js";
import { ThreadPool } from "./threadPool.js";

let threadPool;

process.on("SIGINT", async () => {
  console.log("程序结束");

  // 等待线程池关闭
  if (threadPool) {
    await threadPool.shutdown();
  }

  // 退出程序
  process.exit();
});

async function main() {
  let start;
  let end;

  if (continuteLastTime && fs.existsSync("./log.json")) {
    start =
      JSON.parse(fs.readFileSync("./log.json", "utf-8")).lastDownLoadId + 1;
    end = start + distance - 1;
  } else if (isDistence) {
    start = startId;
    end = start + distance - 1;
  } else {
    start = startId;
    end = endId;
  }

  console.log(`开始下载任务: ID ${start} 到 ${end}`);

  // 创建线程池，每个线程负责10张图片
  threadPool = new ThreadPool(4, 10);

  // 设置任务范围
  threadPool.setTaskRange(start, end);

  // 设置批次完成回调
  threadPool.setBatchCompleteCallback((lastDownloadId) => {
    console.log(`批次完成，最后下载ID: ${lastDownloadId}`);
  });

  try {
    // 启动线程池
    threadPool.start();

    // 等待所有任务完成
    await threadPool.waitForAllTasks();

    console.log("所有下载任务完成");
  } catch (e) {
    console.log("下载过程中出错:", e);
  } finally {
    // 关闭线程池
    await threadPool.shutdown();
  }
}

main();
