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

  // 插入到 Follow Me 按钮 (#card-info-btn) 下方
  var followBtn = cardInfo.querySelector('#card-info-btn')
  if (followBtn) {
    followBtn.parentNode.insertBefore(entry, followBtn.nextSibling)
  } else {
    // 若未启用 Follow Me 按钮，则回退到卡片末尾
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
