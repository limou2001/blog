/**
 * 相册照片墙 - 交互增强脚本
 * 处理：滚动渐显、空状态检测、中国地图热力图交互
 */
(function () {
  'use strict'

  var initPhotoWall = function () {
    var waterfalls = document.querySelectorAll('.photo-waterfall')
    if (!waterfalls.length) return

    waterfalls.forEach(function (waterfall) {
      generateCards(waterfall)
      checkEmptyState(waterfall)
      enhanceScrollReveal(waterfall)
    })

    // 初始化中国地图热力图（仅旅行风景页面）
    initChinaMap()
  }

  /* ==========================================
     卡片 SVG 图标（共享）
     ========================================== */
  var CARD_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>'

  /* ==========================================
     从 JSON 数据生成照片卡片
     ========================================== */
  function generateCards(waterfall) {
    var dataScript = document.querySelector('script.photo-data[type="application/json"]')
    if (!dataScript) return

    var photos
    try {
      photos = JSON.parse(dataScript.textContent.trim())
    } catch (e) {
      return
    }

    if (!photos || !photos.length) return

    var galleryGroup = waterfall.getAttribute('data-gallery') || 'gallery-photos'
    var cardsHTML = ''

    photos.forEach(function (photo) {
      var desc = photo.desc || ''
      var province = photo.province || ''
      var url = photo.url || ''
      var alt = desc.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ').trim().slice(0, 20) || 'photo'

      var provinceAttr = province ? ' data-province="' + province + '"' : ''

      cardsHTML +=
        '<a href="' + url + '" data-fancybox="' + galleryGroup + '" data-caption="' + desc + '">' +
          '<div class="photo-card"' + provinceAttr + '>' +
            '<div class="photo-card-img">' +
              '<img src="' + url + '" alt="' + alt + '" loading="lazy">' +
              '<div class="photo-card-overlay">' +
                '<div class="photo-card-overlay-icon">' + CARD_ICON_SVG + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="photo-card-desc">' +
              '<span class="desc-text">' + desc + '</span>' +
            '</div>' +
          '</div>' +
        '</a>'
    })

    waterfall.innerHTML = cardsHTML

    // 自动更新统计栏
    updateStats(waterfall, photos)
  }

  /* ==========================================
     自动更新统计栏
     ========================================== */
  function updateStats(waterfall, photos) {
    var statsBar = waterfall.parentNode.querySelector('.photo-stats')
    if (!statsBar) return

    var total = photos.length
    var strongEls = statsBar.querySelectorAll('strong')

    // 更新照片总数
    if (strongEls[0]) strongEls[0].textContent = total

    // 更新省份数量（仅旅行风景）
    if (strongEls[1]) {
      var provinces = {}
      photos.forEach(function (p) {
        if (p.province) provinces[p.province] = true
      })
      var provinceCount = Object.keys(provinces).length
      strongEls[1].textContent = provinceCount
    }
  }

  /* ==========================================
     空状态检测
     ========================================== */
  function checkEmptyState(waterfall) {
    var cards = waterfall.querySelectorAll('.photo-card')
    if (cards.length > 0) return

    var existing = waterfall.querySelector('.photo-empty-state')
    if (existing) return

    var emptyHTML = '\n<div class="photo-empty-state">\n  <span class="empty-icon">📸</span>\n  <p class="empty-title">还没有照片</p>\n  <p class="empty-hint">打开此页面的 Markdown 源文件<br>按照注释说明添加你的照片吧 ✨</p>\n</div>'
    waterfall.insertAdjacentHTML('beforeend', emptyHTML)
  }

  /* ==========================================
     滚动渐显增强
     ========================================== */
  function enhanceScrollReveal(waterfall) {
    if (CSS.supports('animation-timeline: view()')) return

    var cards = waterfall.querySelectorAll('.photo-card')
    if (!cards.length) return

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    cards.forEach(function (card) {
      card.style.animation = 'none'
      card.style.opacity = '0'
      card.style.transform = 'translateY(30px)'
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
      observer.observe(card)
    })
  }

  /* ==========================================
     中国地图热力图 (原生 SVG，无需 ECharts)
     ========================================== */
  var svgMapState = { activeProvince: null, allLinks: null }

  function initChinaMap() {
    var mapWrapper = document.querySelector('.china-map-wrapper')
    if (!mapWrapper) return

    var chartDom = document.getElementById('china-map-chart')
    if (!chartDom) return

    var waterfall = document.getElementById('travel-waterfall')
    if (!waterfall) return

    chartDom.classList.add('china-map-loading')

    fetch('/data/china.json')
      .then(function (resp) { return resp.json() })
      .then(function (geoJson) {
        chartDom.classList.remove('china-map-loading')
        renderSVGMap(chartDom, geoJson, waterfall)
      })
      .catch(function () {
        chartDom.classList.remove('china-map-loading')
        var fallback = document.createElement('div')
        fallback.className = 'china-map-fallback'
        fallback.innerHTML = '<p>🗺️ 地图加载失败</p><p style="font-size:13px;color:#999;">请检查网络连接后刷新重试</p>'
        chartDom.appendChild(fallback)
      })
  }

  function renderSVGMap(container, geoJson, waterfall) {
    // 收集各省份照片数量
    var provinceCount = {}
    var allLinks = waterfall.querySelectorAll('a[data-fancybox]')
    svgMapState.allLinks = allLinks

    allLinks.forEach(function (link) {
      var card = link.querySelector('.photo-card')
      if (!card) return
      var province = card.getAttribute('data-province')
      if (!province) return
      provinceCount[province] = (provinceCount[province] || 0) + 1
    })

    // 省份名称（DataV GeoJSON 全称） ↔ 拼音代码 映射
    var nameToCode = {
      '新疆维吾尔自治区': 'xinjiang', '西藏自治区': 'xizang', '青海省': 'qinghai', '甘肃省': 'gansu',
      '内蒙古自治区': 'neimenggu', '黑龙江省': 'heilongjiang', '吉林省': 'jilin', '辽宁省': 'liaoning',
      '宁夏回族自治区': 'ningxia', '陕西省': 'shaanxi', '山西省': 'shanxi', '河北省': 'hebei',
      '北京市': 'beijing', '天津市': 'tianjin', '山东省': 'shandong', '河南省': 'henan',
      '四川省': 'sichuan', '重庆市': 'chongqing', '湖北省': 'hubei', '安徽省': 'anhui',
      '江苏省': 'jiangsu', '上海市': 'shanghai', '浙江省': 'zhejiang', '江西省': 'jiangxi',
      '湖南省': 'hunan', '贵州省': 'guizhou', '云南省': 'yunnan', '广西壮族自治区': 'guangxi',
      '广东省': 'guangdong', '福建省': 'fujian', '海南省': 'hainan', '台湾省': 'taiwan',
      '香港特别行政区': 'xianggang', '澳门特别行政区': 'aomen'
    }

    // 全称 → 简称（用于显示）
    var shortName = {
      '新疆维吾尔自治区': '新疆', '西藏自治区': '西藏', '青海省': '青海', '甘肃省': '甘肃',
      '内蒙古自治区': '内蒙古', '黑龙江省': '黑龙江', '吉林省': '吉林', '辽宁省': '辽宁',
      '宁夏回族自治区': '宁夏', '陕西省': '陕西', '山西省': '山西', '河北省': '河北',
      '北京市': '北京', '天津市': '天津', '山东省': '山东', '河南省': '河南',
      '四川省': '四川', '重庆市': '重庆', '湖北省': '湖北', '安徽省': '安徽',
      '江苏省': '江苏', '上海市': '上海', '浙江省': '浙江', '江西省': '江西',
      '湖南省': '湖南', '贵州省': '贵州', '云南省': '云南', '广西壮族自治区': '广西',
      '广东省': '广东', '福建省': '福建', '海南省': '海南', '台湾省': '台湾',
      '香港特别行政区': '香港', '澳门特别行政区': '澳门'
    }

    var maxCount = 0
    Object.keys(provinceCount).forEach(function (k) {
      if (provinceCount[k] > maxCount) maxCount = provinceCount[k]
    })

    var heatColors = ['#e8edf2', '#c8e0d6', '#a8d4c0', '#88c8aa', '#68bc94', '#48b07e', '#2d8a6e']

    // 创建筛选栏和 Toast
    createFilterBar(waterfall)
    createMapToast()

    // 创建投影函数
    var svgWidth = 800
    var svgHeight = 640
    var project = createChinaProjection(svgWidth, svgHeight)

    // 创建 SVG
    var svgNS = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(svgNS, 'svg')
    svg.setAttribute('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
    svg.setAttribute('class', 'china-map-svg')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

    // 创建 tooltip
    var tooltip = document.createElement('div')
    tooltip.className = 'china-map-tooltip'
    tooltip.style.display = 'none'
    container.style.position = 'relative'
    container.appendChild(tooltip)

    // 渲染省份路径和标签
    var pathsGroup = document.createElementNS(svgNS, 'g')
    var labelsGroup = document.createElementNS(svgNS, 'g')

    geoJson.features.forEach(function (feature) {
      var name = feature.properties.name
      var code = nameToCode[name] || ''
      var count = provinceCount[code] || 0

      // 创建路径
      var path = document.createElementNS(svgNS, 'path')
      path.setAttribute('d', geoToPath(feature.geometry, project))
      path.setAttribute('class', 'province-path' + (count > 0 ? ' has-photos' : ' no-photos'))
      path.setAttribute('data-name', name)
      path.setAttribute('data-code', code)
      path.setAttribute('data-count', count)

      // 热力色：count=0 用最浅色，count>0 从第2级开始按比例分配
      var colorIdx
      if (count === 0) {
        colorIdx = 0
      } else if (maxCount <= 1) {
        colorIdx = heatColors.length - 1
      } else {
        // count >= 1 映射到 [1, heatColors.length-1]
        colorIdx = Math.min(
          1 + Math.floor((count - 1) / (maxCount - 1) * (heatColors.length - 2)),
          heatColors.length - 1
        )
      }
      path.setAttribute('fill', heatColors[colorIdx])

      // 点击事件
      path.addEventListener('click', function () {
        var displayName = shortName[name] || name
        if (!code || count === 0) {
          showMapToast(displayName)
          return
        }
        if (svgMapState.activeProvince === code) {
          clearProvinceFilter(waterfall, allLinks)
          svgMapState.activeProvince = null
          updateFilterBar(null, waterfall)
          pathsGroup.querySelectorAll('.province-path.active').forEach(function (p) {
            p.classList.remove('active')
          })
        } else {
          svgMapState.activeProvince = code
          filterByProvince(code, waterfall, allLinks, displayName, count)
          pathsGroup.querySelectorAll('.province-path.active').forEach(function (p) {
            p.classList.remove('active')
          })
          path.classList.add('active')
        }
      })

      // 悬浮 tooltip
      path.addEventListener('mouseenter', function () {
        var displayName = shortName[name] || name
        tooltip.innerHTML = '<strong>' + displayName + '</strong><br>📷 照片: ' + count + ' 张'
        tooltip.style.display = 'block'
      })
      path.addEventListener('mousemove', function (e) {
        var rect = container.getBoundingClientRect()
        tooltip.style.left = (e.clientX - rect.left + 12) + 'px'
        tooltip.style.top = (e.clientY - rect.top - 40) + 'px'
      })
      path.addEventListener('mouseleave', function () {
        tooltip.style.display = 'none'
      })

      pathsGroup.appendChild(path)

      // 创建标签：优先使用 centroid（几何中心），其次 center（省会）
      var center = feature.properties.centroid || feature.properties.center
      if (center) {
        var pos = project(center[0], center[1])
        var text = document.createElementNS(svgNS, 'text')
        text.setAttribute('x', pos[0])
        text.setAttribute('y', pos[1])
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('dominant-baseline', 'central')
        text.setAttribute('class', 'province-label-text')
        text.textContent = shortName[name] || name
        labelsGroup.appendChild(text)
      }
    })

    svg.appendChild(pathsGroup)
    svg.appendChild(labelsGroup)
    container.innerHTML = ''
    container.appendChild(svg)
    container.appendChild(tooltip)
  }

  /* ====== 投影函数（等距圆柱 + 纬度余弦修正） ====== */
  function createChinaProjection(width, height) {
    var minLon = 73.5, maxLon = 135.5
    var minLat = 17.5, maxLat = 53.5
    var centerLat = (minLat + maxLat) / 2
    var cosCenter = Math.cos(centerLat * Math.PI / 180)

    var padding = 15
    var mapW = width - padding * 2
    var mapH = height - padding * 2

    var scaleX = mapW / ((maxLon - minLon) * cosCenter)
    var scaleY = mapH / (maxLat - minLat)
    var scale = Math.min(scaleX, scaleY)

    var offsetX = padding + (mapW - (maxLon - minLon) * scale * cosCenter) / 2
    var offsetY = padding + (mapH - (maxLat - minLat) * scale) / 2

    return function (lon, lat) {
      var x = (lon - minLon) * cosCenter * scale + offsetX
      var y = (maxLat - lat) * scale + offsetY
      return [x, y]
    }
  }

  /* ====== GeoJSON → SVG path ====== */
  function geoToPath(geometry, project) {
    var type = geometry.type
    var coords = geometry.coordinates

    if (type === 'Polygon') {
      return ringsToPath(coords, project)
    } else if (type === 'MultiPolygon') {
      return coords.map(function (polygon) {
        return ringsToPath(polygon, project)
      }).join(' ')
    }
    return ''
  }

  function ringsToPath(rings, project) {
    return rings.map(function (ring) {
      var d = ''
      for (var i = 0; i < ring.length; i++) {
        var p = project(ring[i][0], ring[i][1])
        d += (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)
      }
      return d + 'Z'
    }).join(' ')
  }

  /**
   * 按省份筛选照片
   */
  function filterByProvince(code, waterfall, allLinks, provinceName, count) {
    allLinks.forEach(function (link) {
      var card = link.querySelector('.photo-card')
      if (!card) return
      var cardProvince = card.getAttribute('data-province')

      if (cardProvince === code) {
        link.classList.remove('filtered-out')
        link.classList.add('filtered-in')
        card.classList.remove('filtered-out')
        card.classList.add('filtered-in')
        // 重新触发渐显动画
        card.style.animation = 'none'
        card.offsetHeight
        card.style.animation = 'photoFadeInUp 0.6s ease forwards'
      } else {
        link.classList.add('filtered-out')
        link.classList.remove('filtered-in')
        card.classList.add('filtered-out')
        card.classList.remove('filtered-in')
      }
    })

    updateFilterBar({ name: provinceName, code: code, count: count }, waterfall)
  }

  /**
   * 清除省份筛选
   */
  function clearProvinceFilter(waterfall, allLinks) {
    allLinks.forEach(function (link) {
      link.classList.remove('filtered-out', 'filtered-in')
      var card = link.querySelector('.photo-card')
      if (card) {
        card.classList.remove('filtered-out', 'filtered-in')
        card.style.animation = 'none'
        card.offsetHeight
        card.style.animation = 'photoFadeInUp 0.6s ease forwards'
      }
    })
  }

  /**
   * 创建筛选栏
   */
  function createFilterBar(waterfall) {
    var existing = document.querySelector('.photo-filter-bar')
    if (existing) return

    var bar = document.createElement('div')
    bar.className = 'photo-filter-bar'
    bar.innerHTML = '<span class="filter-label"></span><span class="filter-count"></span><button class="filter-clear">← 返回全部</button>'

    bar.querySelector('.filter-clear').addEventListener('click', function () {
      // 移除地图高亮
      var activePath = document.querySelector('.china-map-svg .province-path.active')
      if (activePath) activePath.classList.remove('active')
      svgMapState.activeProvince = null
      var allLinks = waterfall.querySelectorAll('a[data-fancybox]')
      clearProvinceFilter(waterfall, allLinks)
      bar.classList.remove('visible')
    })

    waterfall.parentNode.insertBefore(bar, waterfall)
  }

  /**
   * 更新筛选栏状态
   */
  function updateFilterBar(info, waterfall) {
    var bar = document.querySelector('.photo-filter-bar')
    if (!bar) return

    if (!info) {
      bar.classList.remove('visible')
      return
    }

    bar.querySelector('.filter-label').textContent = '📍 ' + info.name
    bar.querySelector('.filter-count').textContent = '共 ' + info.count + ' 张照片'
    bar.classList.add('visible')
  }

  /**
   * 创建 Toast 弹窗
   */
  function createMapToast() {
    if (document.querySelector('.map-toast')) return

    var backdrop = document.createElement('div')
    backdrop.className = 'map-toast-backdrop'

    var toast = document.createElement('div')
    toast.className = 'map-toast'
    toast.innerHTML = '<span class="toast-icon">📸</span><p class="toast-title"></p><p class="toast-desc">该省份还没有风景照片<br>打开页面源文件，添加带有对应省份标记的照片吧 ✨</p><button class="toast-close">知道了</button>'

    document.body.appendChild(backdrop)
    document.body.appendChild(toast)

    var hideToast = function () {
      toast.classList.remove('show')
      backdrop.classList.remove('show')
    }

    toast.querySelector('.toast-close').addEventListener('click', hideToast)
    backdrop.addEventListener('click', hideToast)
  }

  /**
   * 显示 Toast 引导弹窗
   */
  function showMapToast(provinceName) {
    var toast = document.querySelector('.map-toast')
    var backdrop = document.querySelector('.map-toast-backdrop')
    if (!toast || !backdrop) return

    toast.querySelector('.toast-title').textContent = '📍 ' + provinceName
    toast.classList.add('show')
    backdrop.classList.add('show')
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhotoWall)
  } else {
    initPhotoWall()
  }

  // 加密页面解密后 DOM 才出现，需监听 .photo-waterfall 元素注入
  if (!document.querySelector('.photo-waterfall')) {
    var observer = new MutationObserver(function (mutations, obs) {
      if (document.querySelector('.photo-waterfall')) {
        obs.disconnect()
        initPhotoWall()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    // 兜底：30 秒后停止监听，避免长期占用
    setTimeout(function () { observer.disconnect() }, 30000)
  }

  // PJAX 页面切换后重新初始化
  if (typeof btf !== 'undefined' && btf.addGlobalFn) {
    btf.addGlobalFn('pjaxComplete', initPhotoWall, 'photoWall')
  }
})()