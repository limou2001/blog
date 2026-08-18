// 覆盖 hexo-butterfly-swiper-anzhiyu 插件的 toRandomPost 函数
// 兼容无 pjax 的情况
function overrideRandomPost () {
  if (typeof toRandomPost !== 'function') return
  window.toRandomPost = function () {
    if (typeof pjax !== 'undefined') {
      pjax.loadUrl('/' + posts[Math.floor(Math.random() * posts.length)])
    } else {
      window.location.href = '/' + posts[Math.floor(Math.random() * posts.length)]
    }
  }
}

// 页面加载完成后执行一次
window.addEventListener('load', overrideRandomPost)
// DOMContentLoaded 时再尝试一次（兑底）
document.addEventListener('DOMContentLoaded', overrideRandomPost)