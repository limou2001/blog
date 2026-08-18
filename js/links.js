/* ==========================================
 * 友链页面 - 翻转卡片、随机访问、复制信息
 * ========================================== */

function toggleFlip() {
  document.getElementById('flipInner').classList.toggle('flipped');
}

function randomVisit() {
  var links = document.querySelectorAll('.flink-list-item a');
  if (links.length > 0) {
    var randomLink = links[Math.floor(Math.random() * links.length)];
    window.open(randomLink.href, '_blank');
  }
}

function copyMyInfo(e) {
  e.stopPropagation();
  var info = '站点名称: 宫野琦的小站\n站点地址: https://gongyeqi.top\n站点描述: 摸得浮生半日闲\n站点头像: https://gongyeqi.top/img/neko01.png';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(info).then(function() {
      showCopyFeedback();
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = info;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showCopyFeedback();
  }
}

function showCopyFeedback() {
  var btn = document.querySelector('.copy-btn');
  if (!btn) return;
  btn.innerHTML = '<iconify-icon icon="ep:check" class="ep-icon"></iconify-icon> 已复制';
  setTimeout(function() {
    btn.innerHTML = '<iconify-icon icon="ep:document-copy" class="ep-icon"></iconify-icon> 复制信息';
  }, 1500);
}
