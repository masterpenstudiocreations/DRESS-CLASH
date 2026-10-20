import { StageDefinition } from '../types/fighter';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface CrowdPerson {
  x: number;
  baseY: number;
  height: number;
  color: string;
  bounceOffset: number;
  bounceSpeed: number;
  armUp: boolean;
}

export class StageRenderer {
  private static loadedImages: Map<string, HTMLImageElement> = new Map();
  private static particles: Particle[] = [];
  private static crowd: CrowdPerson[] = [];
  private static lastStageId: string = '';
  private static flashTimer: number = 0;
  private static flashCoords: { x: number; y: number } | null = null;

  private static initCrowd(stageWidth: number, groundY: number) {
    this.crowd = [];
    const count = 35;
    const colors = ['#334155', '#475569', '#64748b', '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#a855f7'];
    for (let i = 0; i < count; i++) {
      this.crowd.push({
        x: (i / count) * stageWidth + (Math.random() * 20 - 10),
        baseY: groundY - 50 - Math.random() * 25,
        height: 40 + Math.random() * 25,
        color: colors[Math.floor(Math.random() * colors.length)],
        bounceOffset: Math.random() * Math.PI * 2,
        bounceSpeed: 0.15 + Math.random() * 0.1,
        armUp: Math.random() > 0.4
      });
    }
  }

  private static initParticles(type: string, stageWidth: number, groundY: number) {
    this.particles = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * stageWidth,
        y: Math.random() * groundY,
        vx: (Math.random() - 0.5) * 1.5,
        vy: type === 'petals' || type === 'confetti' ? 1 + Math.random() * 2 : -(0.5 + Math.random() * 1.5),
        size: type === 'sparks' ? 2 + Math.random() * 2 : 4 + Math.random() * 5,
        color: type === 'confetti' ? ['#f43f5e', '#38bdf8', '#fbbf24', '#a855f7'][Math.floor(Math.random() * 4)] : '#ffffff',
        alpha: 0.3 + Math.random() * 0.7
      });
    }
  }

  public static render(
    ctx: CanvasRenderingContext2D,
    stage: StageDefinition,
    cameraX: number,
    width: number,
    height: number,
    groundY: number = 420,
    superDim: number = 0 // 0 to 1: dims background during Super Flash
  ) {
    // Reinit crowd & particles if stage changed
    if (this.lastStageId !== stage.id) {
      this.lastStageId = stage.id;
      this.initCrowd(width + 400, groundY);
      this.initParticles(stage.ambientParticles, width + 400, groundY);
    }

    ctx.save();

    // 1. Draw Background Image or Dynamic Procedural Backdrop
    let imageDrawn = false;
    if (stage.imageKey) {
      if (!this.loadedImages.has(stage.imageKey)) {
        const img = new Image();
        img.src = stage.imageKey;
        img.onload = () => {
          this.loadedImages.set(stage.imageKey!, img);
        };
      } else {
        const img = this.loadedImages.get(stage.imageKey);
        if (img && img.complete) {
          // Render with subtle parallax
          const parallaxShift = (cameraX - width / 2) * 0.18;
          ctx.drawImage(img, -50 - parallaxShift, 0, width + 100, height);
          imageDrawn = true;
        }
      }
    }

    if (!imageDrawn) {
      // Procedural Vector Backdrop
      this.renderProceduralBackdrop(ctx, stage, cameraX, width, height, groundY);
    }

    // 2. Animated Cheering Crowd
    this.renderCrowd(ctx, cameraX, width, groundY);

    // 3. Ground / Floor with Neo Geo Arena Markings & Reflection
    this.renderFloor(ctx, stage, cameraX, width, height, groundY);

    // 4. Ambient Particles (Steam, Confetti, Sparks)
    this.renderParticles(ctx, stage, cameraX, width, groundY);

    // 5. Paparazzi Camera Flashes (Frequent in Opera and Colosseum)
    this.renderFlashes(ctx, stage, width, groundY);

    // 6. Super Dim Overlay
    if (superDim > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${superDim * 0.85})`;
      ctx.fillRect(0, 0, width, height);

      // Speed lines during MAX Super
      if (superDim > 0.5) {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
        ctx.lineWidth = 2;
        const lineTime = Date.now() * 0.05;
        for (let l = 0; l < 15; l++) {
          const ly = ((l * 40 + lineTime * 20) % height);
          ctx.beginPath();
          ctx.moveTo(0, ly);
          ctx.lineTo(width, ly);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  private static renderProceduralBackdrop(
    ctx: CanvasRenderingContext2D,
    stage: StageDefinition,
    cameraX: number,
    width: number,
    height: number,
    groundY: number
  ) {
    const shift = (cameraX - width / 2) * 0.15;

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    if (stage.id.includes('urban')) {
      skyGrad.addColorStop(0, '#0f0c29');
      skyGrad.addColorStop(0.5, '#302b63');
      skyGrad.addColorStop(1, '#24243e');
    } else if (stage.id.includes('opera')) {
      skyGrad.addColorStop(0, '#2e020c');
      skyGrad.addColorStop(0.5, '#4a0e17');
      skyGrad.addColorStop(1, '#1a0307');
    } else if (stage.id.includes('fashion') || stage.id.includes('colosseum')) {
      skyGrad.addColorStop(0, '#1a0026');
      skyGrad.addColorStop(0.5, '#4c004c');
      skyGrad.addColorStop(1, '#0d001a');
    } else {
      skyGrad.addColorStop(0, '#0a0f1d');
      skyGrad.addColorStop(0.6, '#1e293b');
      skyGrad.addColorStop(1, '#0f172a');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, groundY);

    // Skyline Buildings / Pillars
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    const numBuildings = 14;
    for (let b = 0; b < numBuildings; b++) {
      const bx = b * 85 - shift;
      const bHeight = 120 + ((b * 47) % 160);
      ctx.fillRect(bx, groundY - bHeight - 50, 65, bHeight + 50);

      // Windows
      ctx.fillStyle = 'rgba(255, 230, 100, 0.2)';
      for (let wy = groundY - bHeight - 40; wy < groundY - 60; wy += 18) {
        ctx.fillRect(bx + 10, wy, 8, 8);
        ctx.fillRect(bx + 35, wy, 8, 8);
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    }

    // Stage Spotlights
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const spotTime = Date.now() * 0.001;
    const spot1 = Math.sin(spotTime) * 150;
    const spot2 = Math.cos(spotTime * 1.2) * 150;

    const spotGrad1 = ctx.createRadialGradient(width * 0.3 + spot1, groundY, 10, width * 0.3, 0, width * 0.6);
    spotGrad1.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    spotGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGrad1;
    ctx.fillRect(0, 0, width, groundY);

    const spotGrad2 = ctx.createRadialGradient(width * 0.7 + spot2, groundY, 10, width * 0.7, 0, width * 0.6);
    spotGrad2.addColorStop(0, 'rgba(255, 0, 85, 0.25)');
    spotGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGrad2;
    ctx.fillRect(0, 0, width, groundY);
    ctx.restore();
  }

  private static renderCrowd(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    width: number,
    groundY: number
  ) {
    const shift = (cameraX - width / 2) * 0.3;
    const time = Date.now() * 0.005;

    ctx.save();
    for (const p of this.crowd) {
      const px = p.x - shift;
      if (px < -40 || px > width + 40) continue;

      const bounce = Math.abs(Math.sin(time * p.bounceSpeed + p.bounceOffset)) * 12;
      const curY = p.baseY - bounce;

      // Crowd person silhouette
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.75;

      // Head
      ctx.beginPath();
      ctx.arc(px, curY - p.height, 8, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillRect(px - 9, curY - p.height + 8, 18, p.height - 8);

      // Cheering arms
      if (p.armUp) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(px - 9, curY - p.height + 15);
        ctx.lineTo(px - 14, curY - p.height - 10 + Math.sin(time * 3 + p.bounceOffset) * 6);
        ctx.moveTo(px + 9, curY - p.height + 15);
        ctx.lineTo(px + 14, curY - p.height - 10 - Math.sin(time * 3 + p.bounceOffset) * 6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private static renderFloor(
    ctx: CanvasRenderingContext2D,
    stage: StageDefinition,
    cameraX: number,
    width: number,
    height: number,
    groundY: number
  ) {
    const shift = (cameraX - width / 2) * 0.5;

    // Floor Base
    ctx.fillStyle = stage.groundColor || '#1e1b2e';
    ctx.fillRect(0, groundY, width, height - groundY);

    // Floor Border Neon Line
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Neo Geo Arena Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    for (let gx = -100; gx < width + 200; gx += 80) {
      const floorX = gx - shift;
      ctx.beginPath();
      ctx.moveTo(floorX, groundY);
      ctx.lineTo(floorX * 1.3 - width * 0.15, height);
      ctx.stroke();
    }

    // Arena Center Logo Ring
    const centerX = width / 2 - shift;
    ctx.strokeStyle = 'rgba(255, 229, 0, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(centerX, groundY + 45, 160, 30, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Stage Name Banner under center
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '11px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[ ${stage.name.toUpperCase()} ]`, centerX, groundY + 80);
  }

  private static renderParticles(
    ctx: CanvasRenderingContext2D,
    stage: StageDefinition,
    cameraX: number,
    width: number,
    groundY: number
  ) {
    const shift = (cameraX - width / 2) * 0.2;

    ctx.save();
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < 0) p.y = groundY;
      if (p.y > groundY) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x - shift, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private static renderFlashes(
    ctx: CanvasRenderingContext2D,
    stage: StageDefinition,
    width: number,
    groundY: number
  ) {
    const isHighFlashStage = stage.ambientParticles === 'flashes' || stage.id.includes('opera') || stage.id.includes('colosseum');
    const chance = isHighFlashStage ? 0.08 : 0.02;

    if (Math.random() < chance && this.flashTimer <= 0) {
      this.flashTimer = 4; // 4 frames duration
      this.flashCoords = {
        x: Math.random() * width,
        y: groundY - 60 - Math.random() * 80
      };
    }

    if (this.flashTimer > 0 && this.flashCoords) {
      this.flashTimer--;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(this.flashCoords.x, this.flashCoords.y, 18, 0, Math.PI * 2);
      ctx.fill();

      // Flash Star burst
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.flashCoords.x - 30, this.flashCoords.y);
      ctx.lineTo(this.flashCoords.x + 30, this.flashCoords.y);
      ctx.moveTo(this.flashCoords.x, this.flashCoords.y - 30);
      ctx.lineTo(this.flashCoords.x, this.flashCoords.y + 30);
      ctx.stroke();
      ctx.restore();
    }
  }
}
