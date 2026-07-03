document.addEventListener('DOMContentLoaded', function () {
  // 避免重复创建
  if (document.querySelector('.reading-progress-bar')) return

  // ============ 顶部阅读进度条 ============
  var bar = document.createElement('div')
  bar.className = 'reading-progress-bar'
  document.body.appendChild(bar)

  // ============ 返回顶部按钮（带百分比） ============
  var btn = document.createElement('div')
  btn.className = 'back-to-top-btn'
  btn.setAttribute('role', 'button')
  btn.setAttribute('aria-label', '返回顶部')
  btn.innerHTML =
    '<span class="arrow"><i class="fa-solid fa-arrow-up"></i></span>' +
    '<span class="progress-num">0%</span>'
  document.body.appendChild(btn)

  var numEl = btn.querySelector('.progress-num')
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
    numEl.textContent = percent + '%'

    if (scrollTop > 300) {
      btn.classList.add('show')
    } else {
      btn.classList.remove('show')
    }
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

  // 点击平滑回顶
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
})
