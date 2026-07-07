document.addEventListener('DOMContentLoaded', function () {
  var EYE_OPEN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
  var EYE_CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'

  function initEncryptUI () {
    var container = document.getElementById('hexo-blog-encrypt')
    var content = document.querySelector('.hbe-content')
    var input = document.querySelector('.hbe-input-field-default')
    if (!input || !content || !container) return
    if (input.dataset.eyeInit) return
    input.dataset.eyeInit = '1'

    // 关键：禁用 #content-inner 的 transform 动画
    // 原因：#content-inner 有 bottom-top 动画使用 transform: translateY(35px)，
    // 动画期间会破坏 .hbe-container 的 position: fixed 定位（变成相对祖先定位），
    // 导致弹窗先在底部显示再跳到中心。
    // 不能移动容器到 body，否则 hbe 解密后会用解密内容替换该元素，
    // 导致内容脱离 #article-container，相册等页面 JS 失效。
    var contentInner = document.getElementById('content-inner')
    if (contentInner) {
      contentInner.style.setProperty('animation', 'none', 'important')
      contentInner.style.setProperty('transform', 'none', 'important')
    }

    // 加密框弹出时：将阅读进度条放到最上层并禁止滚动
    var progressBar = document.querySelector('.reading-progress-bar')
    if (progressBar) {
      progressBar.style.setProperty('z-index', '10000', 'important')
    }
    // 禁止背景滚动
    document.body.style.setProperty('overflow', 'hidden', 'important')

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

    // 必应每日美图作弹窗卡片背景（与每日一言卡片保持一致）
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

  initEncryptUI()

  // 加密页元素可能延迟渲染，监听 input 出现
  if (!document.querySelector('.hbe-input-field-default')) {
    var observer = new MutationObserver(function (mutations, obs) {
      if (document.querySelector('.hbe-input-field-default')) {
        initEncryptUI()
        obs.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    setTimeout(function () { observer.disconnect() }, 30000)
  }

  // 解密成功后滚动到页面顶部，恢复背景滚动
  window.addEventListener('hexo-blog-decrypt', function () {
    window.scrollTo(0, 0)
    // 恢复背景滚动
    document.body.style.setProperty('overflow', '', '')
    // 恢复进度条 z-index
    var progressBar = document.querySelector('.reading-progress-bar')
    if (progressBar) {
      progressBar.style.setProperty('z-index', '', '')
    }
  })
})
