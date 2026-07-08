/**
 * 节日主题装饰特效
 * 根据不同节日自动显示对应的装饰元素
 */

(function() {
  // 节日配置
  const festivals = {
    // 春节 (1月21日 - 2月20日左右，农历新年)
    spring: {
      start: [1, 20],
      end: [2, 20],
      name: '春节'
    },
    // 圣诞 (12月20日 - 12月27日)
    christmas: {
      start: [12, 20],
      end: [12, 27],
      name: '圣诞'
    },
    // 万圣节 (10月25日 - 11月1日)
    halloween: {
      start: [10, 25],
      end: [11, 1],
      name: '万圣节'
    }
  };

  // 获取当前日期
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDate = now.getDate();

  // 检测当前节日
  function getCurrentFestival() {
    for (const [key, festival] of Object.entries(festivals)) {
      const [startMonth, startDate] = festival.start;
      const [endMonth, endDate] = festival.end;

      if (startMonth === endMonth) {
        // 同月节日
        if (currentMonth === startMonth && currentDate >= startDate && currentDate <= endDate) {
          return key;
        }
      } else {
        // 跨月节日（如春节）
        if ((currentMonth === startMonth && currentDate >= startDate) ||
            (currentMonth === endMonth && currentDate <= endDate)) {
          return key;
        }
      }
    }
    return null;
  }

  // 创建灯笼 (春节)
  window.createLanterns = function() {
    const container = document.createElement('div');
    container.id = 'lantern-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:visible;';

    const lanternCount = 8;
    const positions = [10, 20, 30, 40, 50, 60, 70, 80];
    const text = ['春', '节', '快', '乐', '阖', '家', '团', '圆'];

    for (let i = 0; i < lanternCount; i++) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: absolute;
        top: 0;
        left: ${positions[i]}%;
        transform: translateX(-50%);
        animation: lanternSwing ${2 + Math.random()}s ease-in-out infinite;
        animation-delay: ${i * 0.2}s;
        transform-origin: top center;
      `;

      // 灯笼挂绳
      const rope = document.createElement('div');
      rope.style.cssText = `
        width: 2px;
        height: 15px;
        background: linear-gradient(to bottom, #8B4513, #A0522D);
        margin: 0 auto;
      `;

      // 灯笼主体 - 传统灯笼形状（带发光效果）
      const lantern = document.createElement('div');
      lantern.style.cssText = `
        width: 40px;
        height: 45px;
        background: radial-gradient(ellipse at 50% 30%, #ff6666 0%, #dd3333 40%, #aa1111 80%, #881111 100%);
        border-radius: 50% 50% 45% 45%;
        position: relative;
        box-shadow: 0 0 20px rgba(255, 180, 0, 0.4), 0 0 40px rgba(255, 150, 0, 0.2), inset 0 -8px 15px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: lanternGlow 2s ease-in-out infinite;
      `;

      // 灯笼上的文字（带发光）
      const char = document.createElement('span');
      char.textContent = text[i];
      char.style.cssText = `
        color: #FFD700;
        font-size: 18px;
        font-weight: bold;
        font-family: "Microsoft YaHei", "SimHei", sans-serif;
        text-shadow: 0 0 10px rgba(255,200,0,0.8), 0 0 20px rgba(255,150,0,0.5), 1px 1px 2px rgba(0,0,0,0.5);
        z-index: 1;
      `;

      // 灯笼上盖
      const topCap = document.createElement('div');
      topCap.style.cssText = `
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 8px;
        background: linear-gradient(to bottom, #330000, #550000);
        border-radius: 3px 3px 0 0;
      `;

      // 灯笼下盖
      const bottomCap = document.createElement('div');
      bottomCap.style.cssText = `
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 8px;
        background: linear-gradient(to top, #330000, #550000);
        border-radius: 0 0 3px 3px;
      `;

      // 灯笼中间接缝
      const seam = document.createElement('div');
      seam.style.cssText = `
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent 0%, #440000 20%, #440000 80%, transparent 100%);
        transform: translateY(-50%);
      `;

      // 灯笼穗子 - 多股线效果
      const tassel = document.createElement('div');
      tassel.style.cssText = `
        width: 8px;
        height: 28px;
        margin: -2px auto 0;
        position: relative;
      `;

      // 多根穗子线
      for (let j = 0; j < 5; j++) {
        const thread = document.createElement('div');
        thread.style.cssText = `
          position: absolute;
          width: 1px;
          height: 28px;
          background: linear-gradient(to bottom, #FFD700, #FF8C00);
          left: ${j * 2}px;
          transform-origin: top center;
          animation: tasselSway ${1.5 + Math.random() * 0.5}s ease-in-out infinite;
          animation-delay: ${j * 0.1}s;
        `;
        tassel.appendChild(thread);
      }

      // 穗子顶部的装饰环
      const tasselRing = document.createElement('div');
      tasselRing.style.cssText = `
        width: 10px;
        height: 4px;
        background: linear-gradient(to bottom, #8B4513, #A0522D);
        margin: 0 auto;
        border-radius: 2px;
      `;

      tassel.appendChild(tasselRing);
      lantern.appendChild(char);
      lantern.appendChild(topCap);
      lantern.appendChild(bottomCap);
      lantern.appendChild(seam);
      wrapper.appendChild(rope);
      wrapper.appendChild(lantern);
      wrapper.appendChild(tassel);
      container.appendChild(wrapper);
    }

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes lanternSwing {
        0% { transform: rotate(-6deg); }
        50% { transform: rotate(6deg); }
        100% { transform: rotate(-6deg); }
      }
      @keyframes lanternGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(255, 180, 0, 0.4), 0 0 40px rgba(255, 150, 0, 0.2), inset 0 -8px 15px rgba(0,0,0,0.15); }
        50% { box-shadow: 0 0 30px rgba(255, 200, 0, 0.6), 0 0 60px rgba(255, 150, 0, 0.3), inset 0 -8px 15px rgba(0,0,0,0.15); }
      }
      @keyframes tasselSway {
        0%, 100% { transform: rotate(-3deg); }
        50% { transform: rotate(3deg); }
      }
      @keyframes coupletScroll {
        0% { transform: translateY(0); }
        100% { transform: translateY(-50%); }
      }
      @keyframes coupletFade {
        0%, 100% { opacity: 0.85; }
        50% { opacity: 1; }
      }
      #lantern-container * {
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);
  }

  // 创建烟花 (春节)
  window.createFireworks = function() {
    const container = document.createElement('div');
    container.id = 'fireworks-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9997;';

    document.body.appendChild(container);

    function createFirework() {
      const firework = document.createElement('div');
      firework.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 10px 2px rgba(255, 200, 0, 0.8);
        left: ${Math.random() * 100}%;
        top: ${30 + Math.random() * 40}%;
        animation: fireworkFade 1.5s ease-out forwards;
      `;

      container.appendChild(firework);

      // 爆炸效果
      setTimeout(() => {
        const colors = ['#ff4d4d', '#ff8c00', '#ffd700', '#ff69b4', '#00ff00'];
        for (let i = 0; i < 20; i++) {
          const particle = document.createElement('div');
          const angle = (i / 20) * Math.PI * 2;
          const velocity = 50 + Math.random() * 100;
          const color = colors[Math.floor(Math.random() * colors.length)];

          particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: ${color};
            border-radius: 50%;
            left: ${firework.offsetLeft}px;
            top: ${firework.offsetTop}px;
            box-shadow: 0 0 6px 1px ${color};
            animation: particleExplode 1s ease-out forwards;
            --tx: ${Math.cos(angle) * velocity}px;
            --ty: ${Math.sin(angle) * velocity}px;
          `;

          container.appendChild(particle);
          setTimeout(() => particle.remove(), 1000);
        }
        firework.remove();
      }, 300);
    }

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fireworkFade {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.5); }
      }
      @keyframes particleExplode {
        0% { transform: translate(0, 0); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    // 定时发射烟花（春节主题）
    function startAutoFireworks() {
      // 立即发射一次
      createFirework();

      // 每隔3秒发射一次
      setInterval(createFirework, 3000);
    }

    // 启动定时烟花
    startAutoFireworks();

    function createFirework(x, y) {
      // 如果没有指定位置，随机生成
      const posX = x !== undefined ? x : Math.random() * window.innerWidth;
      const posY = y !== undefined ? y : window.innerHeight * (0.3 + Math.random() * 0.3);

      const firework = document.createElement('div');
      firework.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 10px 2px rgba(255, 200, 0, 0.8);
        left: ${posX}px;
        top: ${posY}px;
        animation: fireworkFade 1.5s ease-out forwards;
      `;

      container.appendChild(firework);

      setTimeout(() => {
        const colors = ['#ff4d4d', '#ff8c00', '#ffd700', '#ff69b4', '#00ff00', '#00ffff', '#ff00ff'];
        for (let i = 0; i < 30; i++) {
          const particle = document.createElement('div');
          const angle = (i / 30) * Math.PI * 2;
          const velocity = 60 + Math.random() * 120;
          const color = colors[Math.floor(Math.random() * colors.length)];

          particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: ${color};
            border-radius: 50%;
            left: ${posX}px;
            top: ${posY}px;
            box-shadow: 0 0 6px 1px ${color};
            animation: particleExplode 1s ease-out forwards;
            --tx: ${Math.cos(angle) * velocity}px;
            --ty: ${Math.sin(angle) * velocity}px;
          `;

          container.appendChild(particle);
          setTimeout(() => particle.remove(), 1000);
        }
        firework.remove();
      }, 300);
    }
  }

  // 创建圣诞特效
  window.createChristmas = function() {
    const container = document.createElement('div');
    container.id = 'christmas-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;overflow:hidden;';

    // 1. 雪花
    const snowflakeCount = 60;
    for (let i = 0; i < snowflakeCount; i++) {
      const snowflake = document.createElement('div');
      snowflake.style.cssText = `
        position: absolute;
        color: #fff;
        font-size: ${8 + Math.random() * 18}px;
        top: -20px;
        left: ${Math.random() * 100}%;
        opacity: ${0.5 + Math.random() * 0.5};
        animation: snowFall ${6 + Math.random() * 12}s linear infinite;
        animation-delay: ${Math.random() * 12}s;
        text-shadow: 0 0 5px rgba(255,255,255,0.8);
      `;
      snowflake.textContent = Math.random() > 0.5 ? '❄' : '❅';
      container.appendChild(snowflake);
    }

    // 圣诞老人骑麋鹿拉雪橇车 (从右到左)
    for (let i = 0; i < 3; i++) {
      const group = document.createElement('div');
      group.style.cssText = `
        position: fixed;
        top: ${10 + i * 30}%;
        left: 100%;
        width: 120px;
        height: 60px;
        z-index: 9999;
        animation: sleighFly ${15 + i * 3}s linear infinite;
        animation-delay: ${i * 5}s;
      `;

      // 麋鹿 (在左边)
      const reindeer = document.createElement('div');
      reindeer.style.cssText = `
        position: absolute;
        left: 0;
        top: 10px;
        font-size: 45px;
        animation: reindeerBounce 0.4s ease-in-out infinite;
      `;
      reindeer.textContent = '🦌';

      // 圣诞老人 (骑在麋鹿上)
      const santa = document.createElement('div');
      santa.style.cssText = `
        position: absolute;
        left: 15px;
        top: 3px;
        font-size: 28px;
      `;
      santa.textContent = '🎅';

      // 雪橇车 (在中间)
      const sleigh = document.createElement('div');
      sleigh.style.cssText = `
        position: absolute;
        left: 40px;
        top: 20px;
        font-size: 35px;
      `;
      sleigh.textContent = '🛷';

      // 礼物 (在雪橇车上)
      const gifts = document.createElement('div');
      gifts.style.cssText = `
        position: absolute;
        left: 60px;
        top: 22px;
        font-size: 18px;
        animation: giftShake 0.3s ease-in-out infinite;
      `;
      gifts.textContent = '🎁';

      group.appendChild(reindeer);
      group.appendChild(santa);
      group.appendChild(sleigh);
      group.appendChild(gifts);
      container.appendChild(group);
    }

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes snowFall {
        0% { transform: translateY(-20px) rotate(0deg); }
        100% { transform: translateY(100vh) rotate(360deg); }
      }
      @keyframes treeShake {
        0%, 100% { transform: rotate(-2deg); }
        50% { transform: rotate(2deg); }
      }
      @keyframes santaWave {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-10px) scale(1.05); }
      }
      @keyframes hatFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes giftBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes bellRing {
        0%, 100% { transform: rotate(-10deg); }
        50% { transform: rotate(10deg); }
      }
      @keyframes lightBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      @keyframes sleighFly {
        0% { left: 100%; transform: translateY(0); }
        25% { left: 75%; transform: translateY(-15px); }
        50% { left: 50%; transform: translateY(8px); }
        75% { left: 25%; transform: translateY(-10px); }
        100% { left: -30%; transform: translateY(0); }
      }
      @keyframes reindeerBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      @keyframes giftShake {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);

    // 添加积雪边框效果到页面元素
    addSnowBorders();
  }

  // 添加积雪边框效果
  function addSnowBorders() {
    // 移除积雪边框效果，保持原有背景
  }

  // 创建万圣节装饰
  window.createHalloween = function() {
    const container = document.createElement('div');
    container.id = 'halloween-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;';

    // 南瓜
    const pumpkin = document.createElement('div');
    pumpkin.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      font-size: 80px;
      animation: pumpkinFloat 3s ease-in-out infinite;
      filter: drop-shadow(0 0 10px orange);
    `;
    pumpkin.textContent = '🎃';

    // 蜘蛛
    const spider = document.createElement('div');
    spider.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      font-size: 40px;
      animation: spiderSwing 4s ease-in-out infinite;
    `;
    spider.textContent = '🕷️';

    // 蝙蝠
    for (let i = 0; i < 5; i++) {
      const bat = document.createElement('div');
      bat.style.cssText = `
        position: absolute;
        font-size: ${20 + Math.random() * 20}px;
        top: ${Math.random() * 30}%;
        left: ${Math.random() * 100}%;
        animation: batFly ${8 + Math.random() * 4}s linear infinite;
        animation-delay: ${Math.random() * 5}s;
        opacity: 0.8;
      `;
      bat.textContent = '🦇';
      container.appendChild(bat);
    }

    // 幽灵
    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 10%;
      font-size: 50px;
      animation: ghostFloat 4s ease-in-out infinite;
    `;
    ghost.textContent = '👻';

    container.appendChild(pumpkin);
    container.appendChild(spider);
    container.appendChild(ghost);

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pumpkinFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes spiderSwing {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
      }
      @keyframes batFly {
        0% { transform: translateX(-100px) translateY(0); }
        50% { transform: translateX(50vw) translateY(-20px); }
        100% { transform: translateX(100vw) translateY(0); }
      }
      @keyframes ghostFloat {
        0%, 100% { transform: translateY(0) rotate(-5deg); }
        50% { transform: translateY(-15px) rotate(5deg); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);
  }

  // 初始化节日特效 - 由 theme-switcher.js 控制，不再自动触发
  function init() {
    // 导出 getCurrentFestival 供外部使用
    window.getCurrentFestival = getCurrentFestival;
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();