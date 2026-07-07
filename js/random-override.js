// 覆盖 hexo-butterfly-swiper-anzhiyu 插件的 toRandomPost 函数
// 兼容无 pjax 的情况
document.addEventListener('DOMContentLoaded', function() {
    // 等待 random.js 加载完成后覆盖函数
    var checkAndOverride = function() {
        if (typeof toRandomPost === 'function') {
            // 保存原始的 posts 变量引用
            var originalToRandomPost = toRandomPost;
            window.toRandomPost = function() {
                if (typeof pjax !== 'undefined') {
                    pjax.loadUrl('/' + posts[Math.floor(Math.random() * posts.length)]);
                } else {
                    window.location.href = '/' + posts[Math.floor(Math.random() * posts.length)];
                }
            };
        } else {
            // 如果 random.js 还没加载完成，稍后重试
            setTimeout(checkAndOverride, 100);
        }
    };
    checkAndOverride();
});