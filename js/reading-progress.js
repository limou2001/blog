document.addEventListener('DOMContentLoaded', function () {
  // 避免重复创建
  if (document.querySelector('.reading-progress-bar')) return

  // ============ 顶部阅读进度条 ============
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
