/* ==========================================
 * 自定义小组件合并脚本
 * 包含：阅读进度条、随机文章覆盖、卡片搜索入口、时钟 Pjax 兼容
 * ========================================== */

/* ====== 1. 顶部阅读进度条 ====== */
document.addEventListener('DOMContentLoaded', function () {
  // 避免重复创建
  if (document.querySelector('.reading-progress-bar')) return

  var bar = document.createElement('div')
  bar.className = 'reading-progress-bar'
  document.body.appendChild(bar)

  var ticking = false

  function update() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop
    var docHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight
    var percent =
      docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0
    percent = Math.round(percent)

    bar.style.width = percent + '%'
    ticking = false
  }

  window.addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        window.requestAnimationFrame(update)
        ticking = true
      }
    },
    { passive: true }
  )

  // 窗口尺寸变化时重算
  window.addEventListener('resize', update, { passive: true })

  update()
})

/* ====== 2. 覆盖 swiper 插件的 toRandomPost 函数 ====== */
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

window.addEventListener('load', overrideRandomPost)
document.addEventListener('DOMContentLoaded', overrideRandomPost)

/* ====== 3. 侧栏卡片搜索入口按钮 ====== */
document.addEventListener('DOMContentLoaded', function () {
  // 避免重复注入
  if (document.querySelector('.card-search-entry')) return

  var cardInfo = document.querySelector('.card-widget.card-info')
  if (!cardInfo) return

  // 仅在搜索功能启用时注入
  if (!document.querySelector('#search-button .search')) return

  // 创建搜索入口按钮
  var entry = document.createElement('div')
  entry.className = 'card-search-entry'
  entry.setAttribute('role', 'button')
  entry.setAttribute('aria-label', '搜索文章')
  entry.innerHTML =
    '<i class="fas fa-search fa-fw"></i>' +
    '<span class="card-search-placeholder">搜索文章…</span>'

  // 插入到 Follow Me 按钮下方
  var followBtn = cardInfo.querySelector('#card-info-btn')
  if (followBtn) {
    followBtn.parentNode.insertBefore(entry, followBtn.nextSibling)
  } else {
    cardInfo.appendChild(entry)
  }

  // 点击触发主题原生搜索弹窗
  entry.addEventListener('click', function () {
    var nativeSearchBtn = document.querySelector('#search-button .search')
    if (nativeSearchBtn) {
      nativeSearchBtn.click()
    }
  })
})

/* ====== 4. 时钟和每日一言 Pjax 兼容 ====== */
document.addEventListener('pjax:send', function() {
  var clock = document.getElementById('hexo_electric_clock');
  if (clock) {
    clock.style.display = 'none';
  }
});

document.addEventListener('pjax:complete', function() {
  setTimeout(function() {
    if (document.getElementById('hexo_electric_clock')) {
      if (typeof getIpAndWeather === 'function') {
        getIpAndWeather('杭州');
      }
    }

    var asideContent = document.getElementById('aside-content');
    if (asideContent) {
      var dailyCard = asideContent.querySelector('.daily-card');
      var clockCard = asideContent.querySelector('.card-clock');

      if (dailyCard && clockCard) {
        var nextElement = clockCard.nextSibling;
        if (nextElement !== dailyCard) {
          asideContent.insertBefore(dailyCard, clockCard.nextSibling);
        }
      }
    }
  }, 500);
});
