import { CanvasTexture, SRGBColorSpace } from 'three';

const W = 512;
const H = 384;

/**
 * Écran du moniteur CRT : un canvas 2D (« 404 », texte tapé, scanlines, vignette)
 * utilisé comme texture. Le rendu 2D est fait ici, hors du composant React.
 */
export class CrtScreen {
  readonly texture: CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D | null;

  constructor() {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext('2d');
    this.texture = new CanvasTexture(canvas);
    this.texture.colorSpace = SRGBColorSpace;
  }

  draw(time: number, lines: string[], hovered: boolean) {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.fillStyle = '#0d0b26';
    ctx.fillRect(0, 0, W, H);

    // grille discrète
    ctx.strokeStyle = 'rgba(62,216,160,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // « 404 » avec un léger décalage chromatique, qui saute de temps en temps
    const glitch = Math.sin(time * 9) > 0.96 ? (Math.random() - 0.5) * 16 : 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 190px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = 'rgba(255,74,46,0.75)';
    ctx.fillText('404', W / 2 - 5 + glitch, H * 0.42);
    ctx.fillStyle = hovered ? '#FF8AD1' : '#3ED8A0';
    ctx.fillText('404', W / 2 + glitch, H * 0.42);

    // ligne de commande tapée
    const text = hovered ? 'coucou, toi !' : lines.join(' ');
    const typed = text.slice(0, Math.floor((time * 8) % (text.length + 14)));
    const cursor = Math.floor(time * 2.5) % 2 === 0 ? '█' : ' ';
    ctx.font = 'bold 34px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = '#FFF3DC';
    ctx.fillText(`> ${typed}${cursor}`, W / 2, H * 0.83);

    // scanlines + vignette
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.5);
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}
