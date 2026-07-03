document.addEventListener('DOMContentLoaded', function () {
  // 仅在存在侧边栏的页面插入卡片
  var asideContent = document.getElementById('aside-content')
  if (!asideContent) return

  // 预设的降级一言（API 失败时使用）
  var fallbackQuotes = [
    { hitokoto: '生活明朗，万物可爱，人间值得，未来可期。', from: '人间值得', from_who: '' },
    { hitokoto: '你如今的气质里，藏着你走过的路，读过的书和爱过的人。', from: '飞鸟集', from_who: '' },
    { hitokoto: '愿你历尽千帆，归来仍是少年。', from: '定风波', from_who: '' },
    { hitokoto: '所有的不甘，都是因为还心存梦想。', from: '网络', from_who: '' },
    { hitokoto: '这个世界疯狂，没人性，腐败。你却一直清醒，温柔，一尘不染。', from: '萨冈', from_who: '' }
  ]

  // 创建卡片 DOM
  var card = document.createElement('div')
  card.className = 'daily-card loading'
  card.innerHTML =
    '<div class="daily-card-content">' +
    '  <div class="daily-card-title"><i class="fa-solid fa-quote-left"></i><span>每日一言</span></div>' +
    '  <div class="daily-card-text">加载中...</div>' +
    '  <div class="daily-card-footer">' +
    '    <span class="daily-card-from">—</span>' +
    '    <span class="daily-card-refresh"><i class="fa-solid fa-rotate-right"></i>换一句</span>' +
    '  </div>' +
    '</div>' +
    '<div class="daily-card-bing-tag">Bing</div>'

  // 插入到侧边栏顶部（作者卡片之后）
  var firstCard = asideContent.querySelector('.card-widget')
  if (firstCard && firstCard.nextSibling) {
    asideContent.insertBefore(card, firstCard.nextSibling)
  } else {
    asideContent.insertBefore(card, asideContent.firstChild)
  }

  var textEl = card.querySelector('.daily-card-text')
  var fromEl = card.querySelector('.daily-card-from')

  // 获取每日一言
  function fetchQuote () {
    card.classList.add('loading')
    // 一言 API，支持 CORS
    fetch('https://v1.hitokoto.cn/?c=i&c=k&c=d&c=j&encode=json')
      .then(function (res) { return res.json() })
      .then(function (data) {
        textEl.textContent = data.hitokoto
        var from = data.from_who || data.from || ''
        fromEl.textContent = from ? '— ' + from : '— 网络摘录'
      })
      .catch(function () {
        // 降级：随机使用预设句子
        var q = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
        textEl.textContent = q.hitokoto
        fromEl.textContent = q.from ? '— ' + q.from : '— 网络摘录'
      })
      .finally(function () {
        card.classList.remove('loading')
      })
  }

  // 获取必应每日美图
  function fetchBingImage () {
    fetch('https://api.xygeng.cn/bing/')
      .then(function (res) { return res.json() })
      .then(function (data) {
        // 接口返回 { url: "https://cn.bing.com/..." } 或 { data: {...} }
        var imgUrl = data.url || (data.data && data.data.url)
        if (imgUrl) {
          if (imgUrl.indexOf('http') !== 0) {
            imgUrl = 'https://cn.bing.com' + imgUrl
          }
          card.style.backgroundImage = 'url("' + imgUrl + '")'
        }
      })
      .catch(function () {
        // 降级：使用默认渐变背景（CSS 中已设置）
        card.querySelector('.daily-card-bing-tag').style.display = 'none'
      })
  }

  // 点击卡片换一句
  card.addEventListener('click', function (e) {
    if (e.target.closest('.daily-card-refresh') || e.currentTarget === card) {
      card.classList.add('refreshing')
      fetchQuote()
      setTimeout(function () { card.classList.remove('refreshing') }, 600)
    }
  })

  // 初始化
  fetchQuote()
  fetchBingImage()
})
