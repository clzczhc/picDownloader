export const imgSource = 'https://yande.re';     // 图源
export const limit = 2000;                      // 一个文件夹最多存2000张的图片
export const startId = 1;
export const endId = 100;
export const distance = 2000;                  // distance表示下载张数。比如startId为1，distance为2，则下载id为1，2  (startId -- startId + distance - 1)

export const isDistence = true;          // 是否是从startId到startId + distance - 1。值为true时，endId失效。而且，如果continuteLastTime为true，也会相当于是true。
export const continuteLastTime = true;    // 从上一次下载结束的位置开始