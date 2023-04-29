import fetch from 'node-fetch';
import fs from 'fs';
import { agent } from './agent.js';
import { imgSource, limit, startId, endId, distance, isDistence, continuteLastTime } from './data.js';

(async function () {

  let start;
  let end;
  if (continuteLastTime && fs.existsSync('./log.json')) {
    start = JSON.parse(fs.readFileSync('./log.json', 'utf-8')).lastDownLoadId + 1;
    end = start + distance - 1;
  } else if (isDistence) {
    start = startId;
    end = start + distance - 1;
  } else {
    start = startId;
    end = endId;
  }

  await mkdirImg();

  let currentDir = await getCurrentDir();
  let i = start;
  let finishId = 0;       // 能成功fetch到的才会变更，即下载成功的id

  try {
    for (; i <= end; i++) {
      if (fs.readdirSync(`./img/${currentDir}`).length >= limit) {
        currentDir += 1;
        fs.mkdirSync(`./img/${currentDir}`);
      }

      const res = await fetch(`${imgSource}/post.json?tags=id:${i}`, { agent });
      const texts = await res.text();
      const img = JSON.parse(texts).filter(img => img.file_url)[0];                      // 将字符串转换为JSON形式的对象，这里会转成数组。
    
      if (!img) {
        continue;
      }

      const imgRes = await fetch(img.file_url, { agent });

      if (imgRes) {
        finishId = i;
      }

      const filePath = `./img/${currentDir}/${img.id}.${img.file_ext}`;

      if (!fs.existsSync(filePath)) {
        const writeStream = fs.createWriteStream(filePath);
        imgRes.body.pipe(writeStream);
      }
    }

    makeRecord(end);
  } catch (e) {
    console.log(e);
    makeRecord(i - 1);
  }

})();

async function mkdirImg() {
  if (!fs.existsSync('./img')) {
    fs.mkdirSync('./img');
  }
}

async function getCurrentDir() {
  const dirs = fs.readdirSync('./img').map(Number).sort((a, b) => a - b);

  if (dirs.length === 0) {
    fs.mkdirSync(`./img/${1}`);
    return 1;
  } else {
    const finalDir = dirs[dirs.length - 1];
    if (fs.readdirSync(`./img/${finalDir}`).length < limit) {
      return finalDir;
    } else {
      fs.mkdirSync(`./img/${finalDir + 1}`);
      return finalDir + 1;
    }
  }
}

async function makeRecord(id) {
  fs.writeFileSync('./log.json', `{
    "lastDownLoadId": ${id}
  }`.trim())
}