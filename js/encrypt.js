document.addEventListener('DOMContentLoaded', function () {
  var EYE_OPEN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
  var EYE_CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'

  // 恢复进度条状态
  function restoreProgressBar () {
    var progressBar = document.querySelector('.reading-progress-bar')
    if (progressBar) {
      progressBar.style.setProperty('z-index', '', '')
    }
  }

  // 立即设置进度条到最上层
  function bringProgressBarToTop () {
    var progressBar = document.querySelector('.reading-progress-bar')
    if (progressBar) {
      progressBar.style.setProperty('z-index', '10000', 'important')
    }
  }

  function initEncryptUI () {
    var container = document.getElementById('hexo-blog-encrypt')
    var content = document.querySelector('.hbe-content')
    var input = document.querySelector('.hbe-input-field-default')
    if (!input || !content || !container) return
    if (input.dataset.eyeInit === '1') return
    input.dataset.eyeInit = '1'

    // 立即将进度条放到最上层
    bringProgressBarToTop()

    // 关键：禁用 #content-inner 的 transform 动画
    var contentInner = document.getElementById('content-inner')
    if (contentInner) {
      contentInner.style.setProperty('animation', 'none', 'important')
      contentInner.style.setProperty('transform', 'none', 'important')
    }

    // 读取 md 中设置的三个字段
    var abstractEl = content.querySelector('.hbe-abstract')
    var abstractText = abstractEl ? abstractEl.textContent.trim() : ''
    var messageEl = content.querySelector('.hbe-input-label-content-default')
    var messageText = messageEl ? messageEl.textContent.trim() : ''

    // 注入锁图标 + 主标题
    var lock = document.createElement('div')
    lock.className = 'hbe-lock-icon'
    content.insertBefore(lock, content.firstChild)

    var title = document.createElement('div')
    title.className = 'hbe-title'
    title.textContent = '请输入密码'
    content.insertBefore(title, lock.nextSibling)

    // 副标题：使用 md 中的 abstract（如「我们在一起的日期」）
    if (abstractText) {
      var subtitle = document.createElement('div')
      subtitle.className = 'hbe-subtitle'
      subtitle.textContent = abstractText
      content.insertBefore(subtitle, title.nextSibling)
    }

    // 输入框 placeholder：使用 md 中的 message
    if (messageText) {
      input.setAttribute('placeholder', messageText)
    }

    // 注入关闭按钮（右上角，点击返回上一页）
    var closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.className = 'hbe-close-btn'
    closeBtn.setAttribute('aria-label', '关闭并返回')
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    content.appendChild(closeBtn)
    closeBtn.addEventListener('click', function () {
      restoreProgressBar()
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.location.href = '/'
      }
    })

    // Decrypt → 确认
    var btn = content.querySelector('.hbe-button')
    if (btn) btn.textContent = '确认'

    // 注入「忘记密码」小字
    var form = content.querySelector('.hbe-form')
    if (form && !form.querySelector('.hbe-forgot')) {
      var forgot = document.createElement('span')
      forgot.className = 'hbe-forgot'
      forgot.textContent = '忘记密码？请联系博主'
      form.appendChild(forgot)
    }

    // 眼睛显隐按钮
    var wrapper = input.parentNode
    wrapper.style.position = 'relative'

    var eyeBtn = document.createElement('button')
    eyeBtn.type = 'button'
    eyeBtn.className = 'hbe-eye-btn'
    eyeBtn.setAttribute('aria-label', '显示或隐藏密码')
    eyeBtn.innerHTML = EYE_OPEN_SVG
    wrapper.appendChild(eyeBtn)

    var visible = false
    eyeBtn.addEventListener('click', function () {
      visible = !visible
      input.type = visible ? 'text' : 'password'
      eyeBtn.innerHTML = visible ? EYE_CLOSE_SVG : EYE_OPEN_SVG
    })

    // 必应每日美图作弹窗卡片背景
    fetch('https://api.xygeng.cn/bing/')
      .then(function (res) { return res.json() })
      .then(function (data) {
        var imgUrl = data.url || (data.data && data.data.url)
        if (imgUrl) {
          if (imgUrl.indexOf('http') !== 0) {
            imgUrl = 'https://cn.bing.com' + imgUrl
          }
          content.style.setProperty('background-image', 'url("' + imgUrl + '")', 'important')
        }
      })
      .catch(function () {
        // 降级：保持 CSS 默认背景色
      })
  }

  // 立即执行初始化（不延迟）
  function tryInit () {
    if (document.querySelector('.hbe-input-field-default')) {
      initEncryptUI()
      return true
    }
    return false
  }

  // 立即尝试执行
  if (!tryInit()) {
    // 如果没找到元素，使用 MutationObserver 监听
    var observer = new MutationObserver(function (mutations, obs) {
      if (tryInit()) {
        obs.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    setTimeout(function () { observer.disconnect() }, 10000)
  }

  // 持续监听加密框状态，确保进度条始终在最上层
  var progressObserver = new MutationObserver(function () {
    var encryptContainer = document.getElementById('hexo-blog-encrypt')
    if (encryptContainer) {
      bringProgressBarToTop()
    }
  })
  progressObserver.observe(document.body, { childList: true, subtree: true, attributes: true })
  setTimeout(function () { progressObserver.disconnect() }, 30000)

  // 解密成功后滚动到页面顶部，恢复进度条
  window.addEventListener('hexo-blog-decrypt', function () {
    window.scrollTo(0, 0)
    restoreProgressBar()
  })
})