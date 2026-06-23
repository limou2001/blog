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
     中国地图热力图 (ECharts)
     ========================================== */
  function initChinaMap() {
    var mapWrapper = document.querySelector('.china-map-wrapper')
    if (!mapWrapper) return

    var chartDom = document.getElementById('china-map-chart')
    if (!chartDom) return

    var waterfall = document.getElementById('travel-waterfall')
    if (!waterfall) return

    // 收集各省份照片数量
    var provinceCount = {}
    var allCards = waterfall.querySelectorAll('.photo-card')
    var allLinks = waterfall.querySelectorAll('a[data-fancybox]')

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

    var codeToName = {}
    Object.keys(nameToCode).forEach(function (name) {
      codeToName[nameToCode[name]] = name
    })

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

    // 热力色阶
    var heatColors = ['#e8edf2', '#c8e0d6', '#a8d4c0', '#88c8aa', '#68bc94', '#48b07e', '#2d8a6e']

    function getHeatColor(count) {
      if (!count || count === 0) return heatColors[0]
      var ratio = maxCount > 0 ? count / maxCount : 0
      var idx = Math.min(Math.floor(ratio * (heatColors.length - 1)), heatColors.length - 1)
      return heatColors[idx]
    }

    // 构建 ECharts 数据
    var mapData = []
    Object.keys(nameToCode).forEach(function (name) {
      var code = nameToCode[name]
      var count = provinceCount[code] || 0
      mapData.push({ name: name, value: count })
    })

    // 创建筛选栏
    createFilterBar(waterfall)

    // 创建 Toast 弹窗
    createMapToast()

    // 加载 GeoJSON 并初始化 ECharts
    var activeProvince = null

    // 显示加载动画
    chartDom.classList.add('china-map-loading')

    // 使用本地 GeoJSON（已下载到 source/data/china.json，同域加载更快）
    fetch('/data/china.json')
      .then(function (resp) { return resp.json() })
      .then(function (geoJson) {
        chartDom.classList.remove('china-map-loading')
        echarts.registerMap('china', geoJson)

        var chart = echarts.init(chartDom)
        chart.showLoading({
          text: '地图加载中...',
          color: '#5bae9e',
          maskColor: 'rgba(255,255,255,0.7)',
          fontSize: 14
        })

        var option = {
          tooltip: {
            trigger: 'item',
            formatter: function (params) {
              if (params.data) {
                var count = params.data.value || 0
                return params.name + '<br/>📷 照片: ' + count + ' 张'
              }
              return params.name
            }
          },
          visualMap: {
            min: 0,
            max: maxCount || 1,
            left: 20,
            bottom: 20,
            show: false,
            inRange: {
              color: heatColors
            }
          },
          series: [{
            name: '足迹',
            type: 'map',
            map: 'china',
            roam: false,
            zoom: 1.2,
            center: [104.5, 36],
            label: {
              show: true,
              color: '#555',
              fontSize: 11,
              fontFamily: 'inherit'
            },
            emphasis: {
              label: {
                show: true,
                color: '#333',
                fontSize: 13,
                fontWeight: 'bold'
              },
              itemStyle: {
                areaColor: '#ffd700',
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              },
              scale: 1.02
            },
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 1.5,
              areaColor: heatColors[0]
            },
            data: mapData,
            animationDurationUpdate: 500,
            animationEasingUpdate: 'cubicInOut'
          }]
        }

        chart.setOption(option)
        chart.hideLoading()

        // 省份点击事件
        chart.on('click', function (params) {
          if (params.componentType !== 'series') return

          var provinceName = params.name
          var code = nameToCode[provinceName]
          var count = provinceCount[code] || 0
          var displayName = shortName[provinceName] || provinceName

          if (!code || count === 0) {
            showMapToast(displayName)
            return
          }

          if (activeProvince === code) {
            // 取消筛选
            clearProvinceFilter(waterfall, allLinks)
            activeProvince = null
            updateFilterBar(null, waterfall)
            chart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
          } else {
            activeProvince = code
            filterByProvince(code, waterfall, allLinks, displayName, count)
          }
        })

        // 窗口大小变化时重绘
        window.addEventListener('resize', function () {
          chart.resize()
        })

        // 存储 chart 实例以便后续使用
        chartDom._echartInstance = chart
      })
      .catch(function () {
        chartDom.classList.remove('china-map-loading')
        var fallback = document.createElement('div')
        fallback.className = 'china-map-fallback'
        fallback.innerHTML = '<p>🗺️ 地图加载失败</p><p style="font-size:13px;color:#999;">请检查网络连接后刷新重试</p>'
        chartDom.appendChild(fallback)
      })
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
      var chartDom = document.getElementById('china-map-chart')
      if (chartDom && chartDom._echartInstance) {
        chartDom._echartInstance.dispatchAction({ type: 'downplay', seriesIndex: 0 })
      }
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

  // PJAX 页面切换后重新初始化
  if (typeof btf !== 'undefined' && btf.addGlobalFn) {
    btf.addGlobalFn('pjaxComplete', initPhotoWall, 'photoWall')
  }
})()