# 图片下载器 - 线程池批量下载版本

## 功能特性

### 线程池实现

- **批量任务分配**: 每个线程负责 10 张图片的下载任务
- **动态线程管理**: 默认最大 4 个线程，根据任务需求动态创建
- **任务队列**: 当线程池满时，新任务进入队列等待
- **空闲线程复用**: 优先使用空闲线程执行新任务
- **错误处理**: 自动处理 worker 错误和异常退出

### 工作流程

1. **任务分配**: 将下载范围按 10 张图片一批分配给不同线程
2. **并发下载**: 多个线程同时处理不同批次的图片
3. **进度记录**: 每个批次完成后自动记录下载进度
4. **任务续接**: 线程完成当前批次后自动分配新批次

## 核心类: ThreadPool

### 构造函数

```javascript
const threadPool = new ThreadPool((maxThreads = 4), (batchSize = 10));
```

### 主要方法

#### setTaskRange(startId, endId)

设置下载任务的范围

- `startId`: 开始 ID
- `endId`: 结束 ID

#### setBatchCompleteCallback(callback)

设置批次完成回调函数

- `callback`: 回调函数，参数为最后下载的 ID

#### start()

启动线程池，开始执行下载任务

#### waitForAllTasks()

等待所有任务完成，返回 Promise

#### shutdown()

关闭线程池，清理资源

## 使用示例

```javascript
import { ThreadPool } from "./threadPool.js";

// 创建线程池，每个线程负责10张图片
const threadPool = new ThreadPool(4, 10);

// 设置任务范围
threadPool.setTaskRange(1, 100);

// 设置批次完成回调
threadPool.setBatchCompleteCallback((lastDownloadId) => {
  console.log(`批次完成，最后下载ID: ${lastDownloadId}`);
});

// 启动线程池
threadPool.start();

// 等待所有任务完成
await threadPool.waitForAllTasks();

// 关闭线程池
await threadPool.shutdown();
```

## 线程池工作原理

### 任务分配策略

- **线程 1**: 负责 ID 1-10
- **线程 2**: 负责 ID 11-20
- **线程 3**: 负责 ID 21-30
- **线程 4**: 负责 ID 31-40
- 当线程完成当前批次后，继续处理下一批次（41-50, 51-60...）

### 工作流程

1. **初始化**: 创建指定数量的 worker 线程
2. **任务分配**: 将下载范围按批次分配给 worker
3. **并发执行**: 每个 worker 独立处理自己的批次
4. **进度记录**: 批次完成后记录下载进度
5. **任务续接**: worker 完成当前批次后自动分配新批次
6. **完成检查**: 所有任务完成后关闭线程池

## 优势

- **高效并发**: 多个线程同时下载不同批次的图片
- **资源控制**: 限制最大线程数，避免资源耗尽
- **进度管理**: 自动记录下载进度，支持断点续传
- **错误隔离**: Worker 错误不影响其他线程
- **负载均衡**: 任务均匀分配给各个线程

## 配置参数

### data.js 配置

- `startId`: 开始下载的 ID
- `endId`: 结束下载的 ID
- `distance`: 下载范围（当使用 isDistence 时）
- `limit`: 每个文件夹最大文件数
- `continuteLastTime`: 是否继续上次下载

### 线程池配置

- `maxThreads`: 最大线程数（默认 4）
- `batchSize`: 每个线程负责的图片数量（默认 10）

## 文件结构

```
picDownloader/
├── index.js              # 主程序入口
├── threadPool.js         # 线程池实现
├── downloadWorker.js     # 下载worker
├── data.js              # 配置文件
├── agent.js             # 网络代理配置
└── img/                 # 下载的图片目录
```
