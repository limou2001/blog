const shuoshuoData = [
  {
    "date": "2026-07-07",
    "content": "**加密框 & 页脚优化** — 加密文章弹出时自动加载必应背景图、阅读进度条置顶显示；修复加密框背景图和密码提示延迟加载问题；移除页脚不蒜子统计（一直转圈），保留运行时间和工作状态；修复 hexo-blog-encrypt 的 kdf.iterations 警告；配置 SSH 部署解决 GitHub 443 超时问题；deploy.bat 集成自动更新 B站追番追剧数据",
    "image": "https://gitee.com/gyqjava/picture/raw/master/blog/info_front.jpg"
  },
  {
    "date": "2026-07-05",
    "content": "**首页轮播 & 人潮汹涌上线** — 引入 hexo-butterfly-swiper-anzhiyu 插件，首页新增文章轮播和「人潮汹涌」随机逛逛动画（基于 Open Peeps 精灵图 + GSAP）。修复了第三方图床失效导致动画不渲染的问题，将图片资源本地化。隐藏右侧文章轮播、扩大人潮汹涌区域，新增 crowdSize 参数控制同时显示人数",
    "image": "https://gitee.com/gyqjava/picture/raw/master/blog/20231201135335-0-4016-image-9.jpg"
  },
  {
    "date": "2026-07-03",
    "content": "**博客体验细节优化** — 侧栏新增时钟卡片（时段问候 + 动态壁纸 + 指针时钟）和每日一言卡片，顶部新增阅读进度条 + 右下角返回顶部按钮（实时百分比），启用复制文章自动追加版权声明，打赏收款码保持原比例放大至 240px 并适配暗黑模式，搜索入口从导航栏迁移至个人卡片 Follow Me 下方（样式统一）",
    "image": ""
  },
  {
    "date": "2026-06-30",
    "content": "**音乐模块重构** — 自定义播放器控件：歌曲名/歌手/专辑信息展示、封面黑胶唱片缓慢旋转、歌词滚动加载与高亮同步、进度条与音量控制、左右分栏布局，打造网易云音乐风格的音乐卡片",
    "image": ""
  },
  {
    "date": "2026-06-29",
    "content": "**地图 & 分类页优化** — 修复中国地图热力图不渲染、省份标签偏移、选中不高亮等 Bug；分类页改为简约卡片网格风格；CSS 按页面条件加载；ECharts 替换为原生 SVG（减重 ~800KB）；背单词适配 Butterfly 主题 & 修复 6 个 Bug",
    "image": ""
  },
  {
    "date": "2026-06-23",
    "content": "**相册模块重构** — 旅行风景上线中国地图热力图，照片配置改为极简 JSON 格式，首页自动读取子页面照片展示封面和最近动态",
    "image": ""
  },
  {
    "date": "2026-06-22",
    "content": "**博客功能完善** — 观影墙上线，QQ 社交链接修复，个人主页美化完成",
    "image": ""
  },
  {
    "date": "2026-06-20",
    "content": "**Git 学习笔记** — 整理发布了《Git 常用命令速查与最佳实践》，系统梳理了日常开发中的 Git 操作",
    "image": ""
  },
  {
    "date": "2026-06-18",
    "content": "**英语学习之路** — 开始记录英语学习过程，坚持每天进步一点点",
    "image": ""
  },
  {
    "date": "2026-06-17",
    "content": "**博客正式上线** — 从零开始用 Hexo + Butterfly 搭建，经历了选主题、配环境、调样式，终于上线了！",
    "image": ""
  }
];

if (typeof window !== 'undefined') {
  window.shuoshuoEntries = shuoshuoData;
}
