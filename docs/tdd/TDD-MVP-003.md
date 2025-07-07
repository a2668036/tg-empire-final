# TDD-MVP-003: 内容浏览与点赞功能技术设计文档

- **创建日期**: 2024-12-07
- **对应PRD**: PRD-MVP-003
- **负责人**: 项目技术负责人
- **状态**: 待开发

---

## 1. 系统架构设计

### 1.1 整体架构图
────────────────────────────────────────────────┐
│ 内容浏览系统 │
└───────┬─────────────────────────────┬──────────┘
│ │
┌───────▼───────┐ ┌───────▼──────────┐
│ 内容获取模块 │ │ 交互反馈模块 │
├───────────────┤ ├──────────────────┤
│ - 内容列表 │ │ - 点赞功能 │
│ - 内容详情 │ │ - 收藏功能 │
│ - 内容搜索 │ │ - 分享功能 │
└───────────────┘ └──────────────────┘
│ │
└─────────────┬───────────────┘
│
┌────────▼─────────┐
│ 数据统计模块 │
├──────────────────┤
│ - 热门内容排序 │
│ - 用户兴趣分析 │
└──────────────────┘

### 1.2 技术选型

- **前端技术**:
  - Vue 3 + Vite (与ProfileApp保持一致)
  - Tailwind CSS (响应式UI)
  - Vue Router (内容页面路由)
  - Pinia (状态管理)
  - Intersection Observer API (无限滚动加载)

- **后端技术**:
  - Node.js + Express (RESTful API)
  - PostgreSQL (内容存储)
  - Redis (缓存热门内容和计数器)
  - Elasticsearch (内容搜索，可选)

---

## 2. 数据模型设计

### 2.1 内容表设计

```sql
CREATE TABLE contents (
    id SERIAL PRIMARY KEY,                             -- 内容ID
    title VARCHAR(255) NOT NULL,                       -- 内容标题
    content TEXT NOT NULL,                             -- 内容正文
    summary VARCHAR(500),                              -- 内容摘要
    creator_id INTEGER NOT NULL,                       -- 创建者ID
    content_type VARCHAR(50) NOT NULL,                 -- 内容类型(article, news, announcement)
    status VARCHAR(20) DEFAULT 'published',            -- 状态(draft, published, hidden)
    view_count INTEGER DEFAULT 0,                      -- 浏览次数
    like_count INTEGER DEFAULT 0,                      -- 点赞次数
    collection_count INTEGER DEFAULT 0,                -- 收藏次数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
    
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_contents_creator ON contents(creator_id);
CREATE INDEX idx_contents_created_at ON contents(created_at);
CREATE INDEX idx_contents_content_type ON contents(content_type);
CREATE INDEX idx_contents_popularity ON contents(like_count, view_count);
```

### 2.2 内容标签表

```sql
CREATE TABLE content_tags (
    id SERIAL PRIMARY KEY,                      -- 标签关联ID
    content_id INTEGER NOT NULL,                -- 内容ID
    tag_name VARCHAR(50) NOT NULL,              -- 标签名称
    
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    UNIQUE (content_id, tag_name)
);

-- 创建索引
CREATE INDEX idx_content_tags_content ON content_tags(content_id);
-- 创建标签名称索引
CREATE INDEX idx_content_tags_name ON content_tags(tag_name);

###  2.3 用户点赞表


CREATE TABLE content_likes (
    id SERIAL PRIMARY KEY,                      -- 点赞记录ID
    content_id INTEGER NOT NULL,                -- 内容ID
    user_id INTEGER NOT NULL,                   -- 用户ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 点赞时间
    
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (content_id, user_id)                -- 确保一个用户只能给一个内容点一次赞
);


2.4 用户收藏表

-- 创建索引
CREATE INDEX idx_content_likes_content ON content_likes(content_id);
CREATE INDEX idx_content_likes_user ON content_likes(user_id);
CREATE TABLE content_collections (
    id SERIAL PRIMARY KEY,                      -- 收藏记录ID
    content_id INTEGER NOT NULL,                -- 内容ID
    user_id INTEGER NOT NULL,                   -- 用户ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 收藏时间
    
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (content_id, user_id)                -- 确保一个用户只能收藏一个内容一次
);

-- 创建索引
CREATE INDEX idx_content_collections_content ON content_collections(content_id);
CREATE INDEX idx_content_collections_user ON content_collections(user_id);

2.5 内容附件表
CREATE TABLE content_attachments (
    id SERIAL PRIMARY KEY,                      -- 附件ID
    content_id INTEGER NOT NULL,                -- 关联内容ID
    attachment_type VARCHAR(50) NOT NULL,       -- 附件类型(image, video, file)
    url VARCHAR(500) NOT NULL,                  -- 附件URL
    filename VARCHAR(255),                      -- 原始文件名
    file_size INTEGER,                          -- 文件大小(字节)
    mime_type VARCHAR(100),                     -- MIME类型
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
    
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_content_attachments_content ON content_attachments(content_id);

3. API设计
3.1 内容列表API
接口: GET /api/v1/contents
type=article                # 内容类型(可选)
tag=technology              # 标签筛选(可选)
sort=latest|popular         # 排序方式(可选，默认latest)
page=1                      # 页码(可选，默认1)
limit=10                    # 每页数量(可选，默认10)

请求头:
x-telegram-id: 123456789    # 用户身份(可选，用于个性化)
{
  "success": true,
  "data": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "contents": [
      {
        "id": 1,
        "title": "帝国星系探索指南",
        "summary": "本文介绍了帝国星系的主要探索路线和资源分布...",
        "content_type": "article",
        "creator": {
          "id": 2,
          "username": "spaceguide"
        },
        "view_count": 328,
        "like_count": 42,
        "collection_count": 15,
        "has_liked": true,       // 当前用户是否已点赞
        "has_collected": false,  // 当前用户是否已收藏
        "tags": ["exploration", "resources", "guide"],
        "thumbnail": "https://empire-assets.com/thumbnails/1.jpg",
        "created_at": "2024-12-01T08:30:00Z"
      },
      // 更多内容...
    ]
  }
}
状态码:
200: 请求成功
400: 请求参数错误
500: 服务器错误

3.2 内容详情API
接口: GET /api/v1/contents/:contentId
x-telegram-id: 123456789    # 用户身份(可选，用于个性化)
{
  "success": true,
  "data": {
    "id": 1,
    "title": "帝国星系探索指南",
    "content": "# 帝国星系探索指南\n\n本文将详细介绍帝国星系的各个区域...(完整内容)",
    "summary": "本文介绍了帝国星系的主要探索路线和资源分布...",
    "content_type": "article",
    "creator": {
      "id": 2,
      "username": "spaceguide",
      "first_name": "星系",
      "last_name": "向导"
    },
    "view_count": 329,  // 已增加1，记录本次查看
    "like_count": 42,
    "collection_count": 15,
    "has_liked": true,
    "has_collected": false,
    "tags": ["exploration", "resources", "guide"],
    "created_at": "2024-12-01T08:30:00Z",
    "updated_at": "2024-12-01T10:15:00Z",
    "attachments": [
      {
        "id": 1,
        "type": "image",
        "url": "https://empire-assets.com/contents/1/map.jpg",
        "filename": "empire_map.jpg"
      }
    ],
    "related_contents": [
      {
        "id": 5,
        "title": "资源采集技巧",
        "content_type": "article"
      }
    ]
  }
}
状态码:
200: 请求成功
404: 内容不存在
500: 服务器错误

3.3 内容点赞API
接口: POST /api/v1/contents/:contentId/like
请求头:
x-telegram-id: 123456789    # 用户身份(必需)
响应:
{
  "success": true,
  "data": {
    "content_id": 1,
    "like_count": 43,     // 更新后的点赞数
    "has_liked": true,    // 操作后状态
    "reputation_earned": 1 // 用户获得的声望点数
  },
  "message": "点赞成功"
}

3.4 取消点赞API
接口: DELETE /api/v1/contents/:contentId/like
请求头:
x-telegram-id: 123456789    # 用户身份(必需)
响应:
{
  "success": true,
  "data": {
    "content_id": 1,
    "like_count": 42,      // 更新后的点赞数
    "has_liked": false     // 操作后状态
  },
  "message": "已取消点赞"
}

3.5 内容收藏API
接口: POST /api/v1/contents/:contentId/collection
请求头:
x-telegram-id: 123456789    # 用户身份(必需)
响应:
{
  "success": true,
  "data": {
    "content_id": 1,
    "collection_count": 16, // 更新后的收藏数
    "has_collected": true   // 操作后状态
  },
  "message": "收藏成功"
}

3.6 取消收藏API
接口: DELETE /api/v1/contents/:contentId/collection
请求头:
x-telegram-id: 123456789    # 用户身份(必需)
响应:
{
  "success": true,
  "data": {
    "content_id": 1,
    "collection_count": 15, // 更新后的收藏数
    "has_collected": false  // 操作后状态
  },
  "message": "已取消收藏"
}

3.7 获取用户收藏列表API
接口: GET /api/v1/users/me/collections
请求头:
x-telegram-id: 123456789    # 用户身份(必需)
查询参数:
page=1      # 页码(可选，默认1)
limit=10    # 每页数量(可选，默认10)
响应:
{
  "success": true,
  "data": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "collections": [
      {
        "id": 1,
        "content": {
          "id": 5,
          "title": "资源采集技巧",
          "summary": "提高资源采集效率的十大技巧...",
          "content_type": "article",
          "view_count": 215,
          "like_count": 31,
          "created_at": "2024-12-03T14:20:00Z"
        },
        "collected_at": "2024-12-04T09:15:00Z"
      },
      // 更多收藏...
    ]
  }
}

4. 业务逻辑实现
4.1 内容服务设计
// ContentService.js
class ContentService {
  constructor(
    contentRepository, 
    contentLikeRepository, 
    contentCollectionRepository,
    userRepository,
    reputationService
  ) {
    this.contentRepository = contentRepository;
    this.contentLikeRepository = contentLikeRepository;
    this.contentCollectionRepository = contentCollectionRepository;
    this.userRepository = userRepository;
    this.reputationService = reputationService;
  }
  
  async getContentsList(options = {}) {
    const { 
      type, 
      tag, 
      sort = 'latest', 
      page = 1, 
      limit = 10, 
      userId = null 
    } = options;
    
    // 构建查询条件
    const filters = { status: 'published' };
    if (type) filters.content_type = type;
    
    // 构建排序条件
    const order = sort === 'popular' 
      ? { like_count: 'DESC', view_count: 'DESC', created_at: 'DESC' }
      : { created_at: 'DESC' };
    
    // 获取内容列表
    const { contents, total } = await this.contentRepository.findAll({
      filters,
      order,
      page,
      limit,
      tag,
      withCreator: true,
      withTags: true
    });
    
    // 如果提供了用户ID，查询用户的点赞和收藏状态
    if (userId) {
      const contentIds = contents.map(content => content.id);
      const userLikes = await this.contentLikeRepository.findByUserAndContents(userId, contentIds);
      const userCollections = await this.contentCollectionRepository.findByUserAndContents(userId, contentIds);
      
      // 映射用户交互状态
      const likeMap = new Map(userLikes.map(like => [like.content_id, true]));
      const collectionMap = new Map(userCollections.map(collection => [collection.content_id, true]));
      
      // 将状态添加到内容对象
      contents.forEach(content => {
        content.has_liked = likeMap.has(content.id);
        content.has_collected = collectionMap.has(content.id);
      });
    }
    
    return { contents, total, page, limit };
  }
  
  async getContentDetail(contentId, userId = null) {
    // 获取内容详情
    const content = await this.contentRepository.findById(contentId, {
      withCreator: true,
      withTags: true,
      withAttachments: true
    });
    
    if (!content) {
      throw new Error('内容不存在');
    }
    
    // 增加浏览次数
    await this.incrementViewCount(contentId);
    content.view_count += 1;
    
    // 如果提供了用户ID，查询用户的点赞和收藏状态
    if (userId) {
      const hasLiked = await this.contentLikeRepository.exists(contentId, userId);
      const hasCollected = await this.contentCollectionRepository.exists(contentId, userId);
      
      content.has_liked = hasLiked;
      content.has_collected = hasCollected;
    }
    
    // 获取相关内容
    content.related_contents = await this.getRelatedContents(contentId, content.tags);
    
    return content;
  }
  
  async likeContent(contentId, userId) {
    // 检查内容是否存在
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new Error('内容不存在');
    }
    
    // 检查是否已点赞
    const existingLike = await this.contentLikeRepository.exists(contentId, userId);
    if (existingLike) {
      throw new Error('已经点赞过此内容');
    }
    
    // 使用事务处理点赞操作
    return await this.executeTransaction(async (transaction) => {
      // 创建点赞记录
      await this.contentLikeRepository.createWithTransaction(
        transaction,
        { content_id: contentId, user_id: userId }
      );
      
      // 更新内容点赞计数
      const updatedContent = await this.contentRepository.incrementLikeCountWithTransaction(
        transaction,
        contentId
      );
      
      // 如果内容创建者不是当前用户，奖励声望点数
      if (content.creator_id !== userId) {
        // 给内容创建者增加声望点数
        await this.reputationService.addReputationPoints(
          content.creator_id,
          1, // 每次点赞增加1点声望
          '内容被点赞',
          'content_like',
          contentId
        );
        
        // 给点赞用户增加声望点数(激励用户参与互动)
        const reputationResult = await this.reputationService.addReputationPoints(
          userId,
          1, // 每次点赞自己获得1点声望
          '参与内容互动',
          'interaction',
          contentId
        );
        
        return {
          content_id: contentId,
          like_count: updatedContent.like_count,
          has_liked: true,
          reputation_earned: reputationResult.points_added
        };
      }
      
      return {
        content_id: contentId,
        like_count: updatedContent.like_count,
        has_liked: true,
        reputation_earned: 0 // 自己点赞自己的内容不奖励声望
      };
    });
  }
  
  async unlikeContent(contentId, userId) {
    // 检查点赞记录是否存在
    const existingLike = await this.contentLikeRepository.exists(contentId, userId);
    if (!existingLike) {
      throw new Error('未点赞此内容');
    }
    
    // 使用事务处理取消点赞操作
    return await this.executeTransaction(async (transaction) => {
      // 删除点赞记录
      await this.contentLikeRepository.deleteWithTransaction(
        transaction,
        contentId,
        userId
      );
      
      // 更新内容点赞计数
      const updatedContent = await this.contentRepository.decrementLikeCountWithTransaction(
        transaction,
        contentId
      );
      
      return {
        content_id: contentId,
        like_count: updatedContent.like_count,
        has_liked: false
      };
    });
  }
  
  // 收藏、取消收藏内容相关方法...
  // 获取用户收藏列表方法...
  // 其他辅助方法...
  
  async incrementViewCount(contentId) {
    // 增加浏览次数(可使用Redis计数，定期同步到数据库)
    return await this.contentRepository.incrementViewCount(contentId);
  }
  
  async getRelatedContents(contentId, tags, limit = 3) {
    // 根据标签获取相关内容
    if (!tags || tags.length === 0) {
      return [];
    }
    
    return await this.contentRepository.findRelated(contentId, tags, limit);
  }
  
  // 事务辅助方法
  async executeTransaction(callback) {
    // 事务实现...
  }
}

4.2 内容交互处理
// ContentInteractionHandler.js
class ContentInteractionHandler {
  constructor(contentService, redisClient) {
    this.contentService = contentService;
    this.redisClient = redisClient;
  }
  
  // 使用Redis缓存热门内容
  async cacheHotContents() {
    try {
      // 获取热门内容
      const hotContents = await this.contentService.getContentsList({
        sort: 'popular',
        limit: 20
      });
      
      // 缓存到Redis，设置TTL为1小时
      await this.redisClient.setEx(
        'hot_contents',
        3600,
        JSON.stringify(hotContents)
      );
      
      return true;
    } catch (error) {
      console.error('缓存热门内容失败:', error);
      return false;
    }
  }
  
  // 使用Redis实现计数器，减轻数据库压力
  async incrementViewCountBuffer(contentId) {
    const key = `content_view_count:${contentId}`;
    
    try {
      // 增加计数
      await this.redisClient.incr(key);
      
      // 检查是否达到同步阈值(每50次浏览同步一次数据库)
      const count = await this.redisClient.get(key);
      if (parseInt(count) >= 50) {
        // 同步到数据库并重置计数
        await this.contentService.incrementViewCount(contentId, parseInt(count));
        await this.redisClient.del(key);
      }
      
      return true;
    } catch (error) {
      console.error('增加浏览计数失败:', error);
      return false;
    }
  }
  
  // 定时任务：将Redis缓存的浏览计数同步到数据库
  async syncViewCountsToDatabase() {
    try {
      // 获取所有内容浏览计数键
      const keys = await this.redisClient.keys('content_view_count:*');
      
      // 批量处理
      for (const key of keys) {
        const contentId = key.split(':')[1];
        const count = await this.redisClient.get(key);
        
        // 同步到数据库
        await this.contentService.incrementViewCount(contentId, parseInt(count));
        
        // 删除Redis键
        await this.redisClient.del(key);
      }
      
      return true;
    } catch (error) {
      console.error('同步浏览计数失败:', error);
      return false;
    }
  }
}

4.3 热门内容排序算法
// 热门内容分数计算(Wilson score confidence interval for Bernoulli parameter)
function calculateHotScore(likes, views, collections, commentCount, timeDecay) {
  if (views === 0) return 0;
  
  // 基础互动分(点赞率 + 收藏率)
  const interactionRate = (likes + collections) / views;
  
  // Wilson置信区间下限计算
  const z = 1.96; // 95% 置信区间
  const phat = interactionRate;
  const n = views;
  const score = (phat + z*z/(2*n) - z * Math.sqrt((phat*(1-phat)+z*z/(4*n))/n))/(1+z*z/n);
  
  // 评论权重(评论更能体现内容价值)
  const commentWeight = Math.log10(commentCount + 1) * 0.5;
  
  // 时间衰减因子(发布时间越久远，分数越低)
  // timeDecay是一个0到1之间的值，表示内容的新鲜度
  
  // 最终热度分数
  const finalScore = (score + commentWeight) * timeDecay;
  
  return finalScore;
}

// 计算时间衰减因子
function calculateTimeDecay(publishDate) {
  const now = new Date();
  const published = new Date(publishDate);
  const diffHours = (now - published) / (1000 * 60 * 60);
  
  // 半衰期为48小时，48小时后分数降为初始的一半
  return Math.exp(-Math.log(2) * diffHours / 48);
}

5. 前端组件设计
5.1 内容列表组件
<template>
  <div class="content-list-container">
    <div class="content-filters">
      <div class="filter-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value" 
          :class="['tab', { active: activeTab === tab.value }]"
          @click="changeTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <div class="sort-options">
        <button 
          v-for="sort in sortOptions" 
          :key="sort.value" 
          :class="['sort-option', { active: activeSort === sort.value }]"
          @click="changeSort(sort.value)"
        >
          {{ sort.label }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <p>加载中...</p>
    </div>
    
    <div v-else-if="contentList.length === 0" class="empty-state">
      <p>暂无内容</p>
    </div>
    
    <div v-else class="content-cards">
      <content-card
        v-for="content in contentList"
        :key="content.id"
        :content="content"
        @like="handleLike"
        @collect="handleCollect"
      />
    </div>
    
    <div class="pagination" v-if="totalPages > 1">
      <button 
        :disabled="currentPage === 1" 
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button 
        :disabled="currentPage === totalPages" 
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { webApp } from '@twa-dev/sdk';
import axios from 'axios';
import ContentCard from './ContentCard.vue';

export default {
  name: 'ContentList',
  components: {
    ContentCard
  },
  setup() {
    const loading = ref(true);
    const contentList = ref([]);
    const currentPage = ref(1);
    const totalContents = ref(0);
    const limit = 10;
    
    const activeTab = ref('all');
    const activeSort = ref('latest');
    
    const tabs = [
      { label: '全部', value: 'all' },
      { label: '文章', value: 'article' },
      { label: '新闻', value: 'news' },
      { label: '公告', value: 'announcement' }
    ];
    
    const sortOptions = [
      { label: '最新', value: 'latest' },
      { label: '热门', value: 'popular' }
    ];
    
    const totalPages = computed(() => {
      return Math.ceil(totalContents.value / limit);
    });
    
    // 获取内容列表
    const fetchContentList = async () => {
      loading.value = true;
      
      try {
        const telegramId = webApp.initDataUnsafe?.user?.id;
        const headers = telegramId ? { 'x-telegram-id': telegramId } : {};
        
        // 构建查询参数
        const params = {
          page: currentPage.value,
          limit: limit,
          sort: activeSort.value
        };
        
        // 添加内容类型过滤
        if (activeTab.value !== 'all') {
          params.type = activeTab.value;
        }
        
        const response = await axios.get('/api/v1/contents', { 
          params,
          headers
        });
        
        const { data } = response.data;
        contentList.value = data.contents;
        totalContents.value = data.total;
      } catch (error) {
        console.error('获取内容列表失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 处理点赞/取消点赞
    const handleLike = async (content) => {
      try {
        const telegramId = webApp.initDataUnsafe?.user?.id;
        if (!telegramId) {
          webApp.showAlert('请登录后再点赞');
          return;
        }
        
        const headers = { 'x-telegram-id': telegramId };
        
        if (!content.has_liked) {
          // 点赞
          const response = await axios.post(`/api/v1/contents/${content.id}/like`, null, { headers });
          const updatedLikes = response.data.data.like_count;
          
          // 更新本地内容列表
          const index = contentList.value.findIndex(item => item.id === content.id);
          if (index !== -1) {
            contentList.value[index].like_count = updatedLikes;
            contentList.value[index].has_liked = true;
          }
          
          // 如果有声望奖励，显示提示
          if (response.data.data.reputation_earned > 0) {
            webApp.showPopup({
              title: '获得声望',
              message: `你获得了 ${response.data.data.reputation_earned} 点声望奖励!`,
              buttons: [{ type: 'ok' }]
            });
          }
        } else {
          // 取消点赞
          const response = await axios.delete(`/api/v1/contents/${content.id}/like`, { headers });
          const updatedLikes = response.data.data.like_count;
          
          // 更新本地内容列表
          const index = contentList.value.findIndex(item => item.id === content.id);
          if (index !== -1) {
            contentList.value[index].like_count = updatedLikes;
            contentList.value[index].has_liked = false;
          }
        }
      } catch (error) {
        console.error('操作失败:', error);
        webApp.showAlert('操作失败，请稍后再试');
      }
    };
    
    // 处理收藏/取消收藏
    const handleCollect = async (content) => {
      // 实现逻辑类似handleLike...
    };
    
    const changeTab = (tab) => {
      if (activeTab.value === tab) return;
      activeTab.value = tab;
      currentPage.value = 1;
      fetchContentList();
    };
    
    const changeSort = (sort) => {
      if (activeSort.value === sort) return;
      activeSort.value = sort;
      currentPage.value = 1;
      fetchContentList();
    };
    
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return;
      currentPage.value = page;
      fetchContentList();
    };
    
    onMounted(() => {
      fetchContentList();
    });
    
    return {
      loading,
      contentList,
      currentPage,
      totalPages,
      activeTab,
      activeSort,
      tabs,
      sortOptions,
      changeTab,
      changeSort,
      changePage,
      handleLike,
      handleCollect
    };
  }
}
</script>

5.2 内容卡片组件
<template>
  <div class="content-card" @click="navigateToDetail">
    <div class="card-thumbnail" v-if="content.thumbnail">
      <img :src="content.thumbnail" :alt="content.title">
    </div>
    
    <div class="card-content">
      <div class="content-type-tag" :class="content.content_type">
        {{ contentTypeLabel }}
      </div>
      
      <h3 class="content-title">{{ content.title }}</h3>
      
      <p class="content-summary">{{ content.summary }}</p>
      
      <div class="content-meta">
        <span class="creator">{{ content.creator.username }}</span>
        <span class="date">{{ formatDate(content.created_at) }}</span>
      </div>
      
      <div class="content-tags">
        <span v-for="tag in content.tags" :key="tag" class="tag">
          #{{ tag }}
        </span>
      </div>
    </div>
    
    <div class="card-actions" @click.stop>
      <button 
        :class="['action-button', 'like-button', { active: content.has_liked }]"
        @click="$emit('like', content)"
      >
        <span class="icon">👍</span>
        <span class="count">{{ content.like_count }}</span>
      </button>
      
      <button 
        :class="['action-button', 'collect-button', { active: content.has_collected }]"
        @click="$emit('collect', content)"
      >
        <span class="icon">⭐</span>
        <span class="count">{{ content.collection_count }}</span>
      </button>
      
      <div class="view-count">
        <span class="icon">👁️</span>
        <span class="count">{{ content.view_count }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'ContentCard',
  props: {
    content: {
      type: Object,
      required: true
    }
  },
  emits: ['like', 'collect'],
  setup(props) {
    const router = useRouter();
    
    const contentTypeLabel = computed(() => {
      const typeMap = {
        'article': '文章',
        'news': '新闻',
        'announcement': '公告'
      };
      return typeMap[props.content.content_type] || '内容';
    });
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    const navigateToDetail = () => {
      router.push(`/content/${props.content.id}`);
    };
    
    return {
      contentTypeLabel,
      formatDate,
      navigateToDetail
    };
  }
}
</script>

5.3 内容详情组件
<template>
  <div class="content-detail-container">
    <div v-if="loading" class="loading-container">
      <p>加载中...</p>
    </div>
    
    <div v-else-if="!content" class="error-state">
      <p>内容不存在或已被删除</p>
      <button class="back-button" @click="goBack">返回列表</button>
    </div>
    
    <div v-else class="content-detail">
      <!-- 内容头部 -->
      <div class="content-header">
        <h1 class="content-title">{{ content.title }}</h1>
        
        <div class="content-meta">
          <div class="creator-info">
            <span class="creator-name">{{ content.creator.first_name }} {{ content.creator.last_name }}</span>
            <span class="creator-username">@{{ content.creator.username }}</span>
          </div>
          
          <div class="content-date">
            {{ formatDate(content.created_at) }}
          </div>
        </div>
        
        <div class="content-tags">
          <span v-for="tag in content.tags" :key="tag" class="tag">
            #{{ tag }}
          </span>
        </div>
      </div>
      
      <!-- 内容正文 -->
      <div class="content-body" v-html="renderedContent"></div>
      
      <!-- 内容附件 -->
      <div class="content-attachments" v-if="content.attachments && content.attachments.length > 0">
        <h3>附件</h3>
        <div class="attachment-list">
          <div 
            v-for="attachment in content.attachments" 
            :key="attachment.id"
            class="attachment-item"
          >
            <img v-if="attachment.type === 'image'" :src="attachment.url" :alt="attachment.filename">
            <div v-else class="file-attachment">
              <span class="file-icon">📄</span>
              <span class="file-name">{{ attachment.filename }}</span>
              <a :href="attachment.url" target="_blank" class="download-link">下载</a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 互动区域 -->
      <div class="interaction-area">
        <button 
          :class="['action-button', 'like-button', { active: content.has_liked }]"
          @click="handleLike"
        >
          <span class="icon">👍</span>
          <span class="label">{{ content.has_liked ? '已点赞' : '点赞' }}</span>
          <span class="count">{{ content.like_count }}</span>
        </button>
        
        <button 
          :class="['action-button', 'collect-button', { active: content.has_collected }]"
          @click="handleCollect"
        >
          <span class="icon">⭐</span>
          <span class="label">{{ content.has_collected ? '已收藏' : '收藏' }}</span>
          <span class="count">{{ content.collection_count }}</span>
        </button>
        
        <button class="action-button share-button" @click="handleShare">
          <span class="icon">📤</span>
          <span class="label">分享</span>
        </button>
        
        <div class="view-count">
          <span class="icon">👁️</span>
          <span class="count">{{ content.view_count }} 次浏览</span>
        </div>
      </div>
      
      <!-- 相关内容 -->
      <div class="related-contents" v-if="content.related_contents && content.related_contents.length > 0">
        <h3>相关内容</h3>
        <div class="related-list">
          <div 
            v-for="related in content.related_contents" 
            :key="related.id"
            class="related-item"
            @click="navigateToContent(related.id)"
          >
            <span class="related-title">{{ related.title }}</span>
            <span class="related-type">{{ getContentTypeLabel(related.content_type) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 


