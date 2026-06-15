class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationFrameId = null;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  addParticle(p) {
    this.particles.push(p);
  }

  // Generate a magical particle stream from wand to animal pedestal
  createWandStream(startX, startY, endX, endY) {
    const steps = 15;
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        const angle = Math.atan2(endY - startY, endX - startX);
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        // Spawn multiple sparkles per step
        for (let j = 0; j < 3; j++) {
          const spreadAngle = angle + (Math.random() - 0.5) * 0.4;
          const speed = (0.3 + Math.random() * 0.7) * (distance / 30);
          
          this.addParticle({
            x: startX,
            y: startY,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed - (Math.random() * 2), // rise slightly
            size: 2 + Math.random() * 4,
            color: `hsla(${200 + Math.random() * 60}, 100%, 75%, ${0.8 + Math.random() * 0.2})`,
            alpha: 1,
            decay: 0.015 + Math.random() * 0.01,
            gravity: 0.08,
            type: Math.random() > 0.4 ? 'star' : 'sparkle'
          });
        }
      }, i * 35);
    }
  }

  // Create a smoke and magic blast at the animal pedestal
  createSummonExplosion(x, y) {
    // 1. Core smoke puff particles
    const smokeCount = 25;
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.addParticle({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 1.5),
        size: 15 + Math.random() * 20,
        color: `rgba(255, 255, 255, ${0.4 + Math.random() * 0.3})`,
        alpha: 0.8,
        decay: 0.01 + Math.random() * 0.01,
        gravity: -0.02, // rise up slowly
        type: 'smoke'
      });
    }

    // 2. Magic burst sparks
    const sparkCount = 40;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.addParticle({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (1 + Math.random() * 3),
        size: 3 + Math.random() * 5,
        color: `hsla(${30 + Math.random() * 50}, 100%, 60%, 1)`, // Golden/Yellow/Orange
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
        gravity: 0.15, // fall down like sparks
        type: 'spark'
      });
    }

    // 3. Magical rings
    const ringCount = 15;
    for (let i = 0; i < ringCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      this.addParticle({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 3,
        color: `hsla(${280 + Math.random() * 60}, 100%, 70%, 1)`, // Purple/pink
        alpha: 1,
        decay: 0.015 + Math.random() * 0.015,
        gravity: 0.05,
        type: 'star'
      });
    }
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  drawSparkle(ctx, x, y, size, color) {
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.quadraticCurveTo(x, y, x, y - size);
    ctx.quadraticCurveTo(x, y, x + size, y);
    ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update positions
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      p.alpha -= p.decay;

      // Remove dead particles
      if (p.alpha <= 0 || p.size <= 0.1) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;

      if (p.type === 'smoke') {
        // Draw fluffy soft circles
        const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'star') {
        this.drawStar(this.ctx, p.x, p.y, 5, p.size, p.size / 2.5, p.color);
      } else if (p.type === 'sparkle') {
        this.drawSparkle(this.ctx, p.x, p.y, p.size * 1.5, p.color);
      } else {
        // Standard sparks/glow circles
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
