import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { parentPort } from "worker_threads";

// 配置参数
const imgSource = "https://safebooru.org";
const limit = 1000; // 每个文件夹最大文件数

// 创建图片目录
async function mkdirImg() {
  if (!fs.existsSync("./img")) {
    try {
      fs.mkdirSync("./img");
    } catch (error) {
      // 忽略目录已存在的错误
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }
}

// 获取当前目录
async function getCurrentDir() {
  const dirs = fs
    .readdirSync("./img")
    .map(Number)
    .sort((a, b) => a - b);

  if (dirs.length === 0) {
    try {
      fs.mkdirSync(`./img/${1}`);
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
    return 1;
  } else {
    const finalDir = dirs[dirs.length - 1];
    if (fs.readdirSync(`./img/${finalDir}`).length < limit) {
      return finalDir;
    } else {
      try {
        fs.mkdirSync(`./img/${finalDir + 1}`);
      } catch (error) {
        if (error.code !== "EEXIST") {
          throw error;
        }
      }
      return finalDir + 1;
    }
  }
}

// 记录下载进度
async function makeRecord(id) {
  fs.writeFileSync(
    "./log.json",
    `{
    "lastDownLoadId": ${id}
  }`.trim()
  );
}

// 下载单张图片
async function downloadImage(id, currentDir) {
  try {
    // 检查目录是否需要更新
    if (fs.readdirSync(`./img/${currentDir}`).length >= limit) {
      currentDir += 1;
      try {
        fs.mkdirSync(`./img/${currentDir}`);
      } catch (error) {
        if (error.code !== "EEXIST") {
          throw error;
        }
      }
    }

    // 获取帖子信息
    const res = await fetch(`${imgSource}/post.json?tags=id:${id}`);

    if (!res.ok) {
      console.error(`获取帖子信息失败 ${id}: HTTP ${res.status}`);
      return null;
    }

    const texts = await res.text();

    // 检查返回内容是否为JSON
    if (!texts.trim().startsWith("[") && !texts.trim().startsWith("{")) {
      console.error(`获取帖子信息失败 ${id}: 返回内容不是JSON格式`);
      return null;
    }

    const posts = JSON.parse(texts);

    const img = posts.filter(
      (img) => img.file_url && !img.tags.includes("partial_scan")
    )[0];

    if (!img) {
      return null;
    }

    // 下载图片
    const imgRes = await fetch(img.file_url);
    if (!imgRes.ok) {
      console.error(`下载图片失败 ${id}: HTTP ${imgRes.status}`);
      return null;
    }

    const imageData = await imgRes.arrayBuffer();
    const filePath = `./img/${currentDir}/${img.id}.${img.file_ext}`;

    // 保存文件
    if (!fs.existsSync(filePath)) {
      const buffer = Buffer.from(imageData);
      fs.writeFileSync(filePath, buffer);
    }

    return id;
  } catch (error) {
    console.error(`下载图片 ${id} 失败:`, error.message);
    return null;
  }
}

// 处理批量下载任务
async function processBatch(startId, endId) {
  console.log(`Worker ${process.pid} 开始处理批次: ${startId} - ${endId}`);

  await mkdirImg();
  let currentDir = await getCurrentDir();
  let lastDownloadId = startId - 1;

  for (let i = startId; i <= endId; i++) {
    try {
      const downloadedId = await downloadImage(i, currentDir);
      if (downloadedId) {
        lastDownloadId = downloadedId;
      }
    } catch (error) {
      console.error(`处理ID ${i} 时出错:`, error.message);
    }
  }

  console.log(
    `Worker ${process.pid} 完成批次: ${startId} - ${endId}, 最后下载ID: ${lastDownloadId}`
  );

  // 记录进度
  makeRecord(lastDownloadId);

  // 通知主线程批次完成
  parentPort.postMessage({
    type: "batchComplete",
    startId: startId,
    endId: endId,
    lastDownloadId: lastDownloadId,
  });
}

// 监听主线程消息
parentPort.on("message", async (data) => {
  if (data.type === "downloadBatch") {
    await processBatch(data.startId, data.endId);
  }
});
