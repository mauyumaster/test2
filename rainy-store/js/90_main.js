/* 90_main.js — 渲染主循环（无任何界面元素，仅自由拖拽 / 旋转 / 缩放） */
(function () {
  const SB = window.SB, THREE = SB.THREE;
  const renderer = SB.renderer, scene = SB.scene, camera = SB.camera, controls = SB.controls;

  /* 初始展示缓慢自转，用户一旦操作即停止 */
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.26;
  renderer.domElement.addEventListener('pointerdown', function () { controls.autoRotate = false; }, { once: true });
  renderer.domElement.addEventListener('wheel', function () { controls.autoRotate = false; }, { once: true });

  const clock = new THREE.Clock();
  let frames = 0;

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    SB.runTocks(t);
    for (let i = 0; i < SB.anim.length; i++) SB.anim[i](t, dt);
    controls.update();
    renderer.render(scene, camera);
    frames++;
    if (frames === 3) {
      const cover = document.getElementById('cover');
      if (cover) cover.classList.add('gone');
    }
  }

  /* WebGL 可用性检查 */
  (function () {
    try {
      const gl = renderer.getContext();
      if (!gl) throw new Error('no context');
    } catch (e) {
      document.getElementById('fallback').style.display = 'flex';
      document.getElementById('cover').classList.add('gone');
      return;
    }
    frame();
  })();
})();
