/* ==========================================
 * 关于我页面 - 技能栈渲染、地图初始化、布局适配
 * ========================================== */

/* ====== 技能栈渲染 ====== */
function renderSkills() {
  var container = document.getElementById('skills-container')
  if (!container) return

  container.innerHTML = ''

  var skillsConfig = [
    {
      category: '后端',
      subtitle: '主要开发方向',
      items: [
        { name: 'Java', desc: '主力语言，日常开发' },
        { name: 'C++', desc: '' },
        { name: 'SpringCloud', desc: '' },
        { name: 'SpringBoot', desc: '' },
        { name: 'MySQL', desc: '' },
        { name: 'Redis', desc: '' },
        { name: 'MyBatis', desc: '' },
        { name: 'Shiro', desc: '' }
      ]
    },
    {
      category: '前端',
      subtitle: '能写能改',
      items: [
        { name: 'Vue.js', desc: '' },
        { name: 'JavaScript', desc: '' },
        { name: 'TypeScript', desc: '' },
        { name: 'HTML / CSS', desc: '' },
        { name: 'Bootstrap', desc: '' }
      ]
    },
    {
      category: '工具 & 部署',
      subtitle: '日常使用',
      items: [
        { name: 'Git', desc: '' },
        { name: 'Docker', desc: '' },
        { name: 'Linux', desc: '' },
        { name: 'Nginx', desc: ' ' },
        { name: 'Maven', desc: '' }
      ]
    }
  ]

  for (var g = 0; g < skillsConfig.length; g++) {
    var group = skillsConfig[g]

    var groupEl = document.createElement('div')
    groupEl.className = 'skill-group'

    var headerEl = document.createElement('div')
    headerEl.className = 'skill-group-header'
    headerEl.innerHTML = '<span class="skill-group-name">' + group.category + '</span><span class="skill-group-subtitle">' + group.subtitle + '</span>'
    groupEl.appendChild(headerEl)

    var tagsEl = document.createElement('div')
    tagsEl.className = 'skill-group-tags'

    for (var i = 0; i < group.items.length; i++) {
      var item = group.items[i]
      var tagEl = document.createElement('div')
      tagEl.className = 'skill-tag'
      tagEl.innerHTML = '<span class="skill-tag-name">' + item.name + '</span><span class="skill-tag-desc">' + item.desc + '</span>'
      tagsEl.appendChild(tagEl)
    }

    groupEl.appendChild(tagsEl)
    container.appendChild(groupEl)
  }
}

/* ====== 杭州地图初始化 ====== */
function initMap() {
  var mapContainer = document.getElementById('hangzhou-map')
  if (!mapContainer || mapContainer._leaflet_id) return

  var map = L.map('hangzhou-map', {
    center: [30.2741, 120.1551],
    zoom: 9,
    zoomControl: false,
    attributionControl: false
  })

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: '1234'
  }).addTo(map)

  L.marker([30.2741, 120.1551], {
    icon: L.divIcon({
      className: 'custom-marker',
      html: '<div class="marker-inner"><span class="marker-icon" style="font-size:24px;color:#667eea;display:flex;align-items:center;justify-content:center;">📍</span></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    })
  }).addTo(map)
}

/* ====== 右侧高度自适应 ====== */
function adjustRightHeight() {
  var leftEl = document.querySelector('.about-hero-left')
  var rightEl = document.querySelector('.about-hero-right')
  var personalityImg = document.querySelector('.about-hero-personality')

  if (!leftEl || !rightEl) return

  var leftHeight = leftEl.offsetHeight
  rightEl.style.height = leftHeight + 'px'

  if (personalityImg) {
    var baseSize = 130
    var minSize = 90
    var scale = Math.max(minSize / baseSize, leftHeight / 350)
    var newSize = Math.min(baseSize, Math.max(minSize, baseSize * scale))
    personalityImg.style.width = newSize + 'px'
    personalityImg.style.height = newSize + 'px'
  }
}

/* ====== 初始化绑定 ====== */
document.addEventListener('DOMContentLoaded', function () {
  renderSkills()
  setTimeout(initMap, 100)
  adjustRightHeight()
})
document.addEventListener('pjax:complete', function () {
  renderSkills()
  initMap()
  adjustRightHeight()
})
window.addEventListener('resize', adjustRightHeight)
