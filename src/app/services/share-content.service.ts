import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const APP_BRAND = 'Striving 4 Jannah';

function isShareCancelled(err: unknown): boolean {
  const m = String((err as { message?: string })?.message ?? err).toLowerCase();
  return m.includes('cancel') || m.includes('abort') || m.includes('dismiss') || m.includes('canceled');
}

function canvasToBase64Png(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL('image/png');
  const i = dataUrl.indexOf(',');
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
}

@Injectable({ providedIn: 'root' })
export class ShareContentService {
  readonly appLabel = APP_BRAND;

  buildVersePlainText(params: {
    surahEnglish: string;
    surahArabic: string;
    ayahNum: number;
    arabic: string;
    translation?: string;
  }): string {
    const lines = [
      `${params.surahEnglish} (${params.surahArabic}) — Ayah ${params.ayahNum}`,
      '',
      params.arabic,
      ''
    ];
    if (params.translation?.trim()) {
      lines.push(params.translation.trim(), '');
    }
    lines.push(`— ${APP_BRAND}`, 'Quran text: api.alquran.cloud');
    return lines.join('\n');
  }

  buildHadithPlainText(params: {
    bookName: string;
    hadithNumber: string;
    chapterName?: string;
    narrator: string;
    arabic?: string;
    body: string;
  }): string {
    const lines = [
      `${params.bookName} — Hadith #${params.hadithNumber}`,
      params.chapterName ? `Chapter: ${params.chapterName}` : '',
      '',
      params.narrator,
      '',
      params.body
    ].filter(Boolean);
    if (params.arabic?.trim()) {
      lines.push('', params.arabic.trim());
    }
    lines.push('', `— ${APP_BRAND}`);
    return lines.join('\n');
  }

  async sharePlainText(text: string, title?: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: title ?? APP_BRAND, text, dialogTitle: 'Share' });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: title ?? APP_BRAND, text });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      throw new Error('CLIPBOARD_OK');
    }
    throw new Error('Share is not available in this browser.');
  }

  async shareVerseImage(params: {
    surahEnglish: string;
    surahArabic: string;
    ayahNum: number;
    arabic: string;
    translation?: string;
  }): Promise<void> {
    const el = this.makeVerseCardEl(params);
    await this.renderCardAndShare(el);
  }

  async shareHadithImage(params: {
    bookName: string;
    hadithNumber: string;
    chapterName?: string;
    narrator: string;
    arabic?: string;
    body: string;
    rtl: boolean;
  }): Promise<void> {
    const el = this.makeHadithCardEl(params);
    await this.renderCardAndShare(el);
  }

  private makeVerseCardEl(params: {
    surahEnglish: string;
    surahArabic: string;
    ayahNum: number;
    arabic: string;
    translation?: string;
  }): HTMLElement {
    const root = document.createElement('div');
    root.style.cssText = [
      'box-sizing:border-box',
      'width:400px',
      'padding:28px 24px',
      'background:linear-gradient(165deg,#121a2e 0%,#0a0e1a 55%)',
      'color:#e8e0d0',
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
      'border-radius:16px',
      'border:1px solid rgba(201,168,76,0.35)',
      'box-shadow:0 12px 40px rgba(0,0,0,0.45)'
    ].join(';');

    const brand = document.createElement('div');
    brand.textContent = APP_BRAND;
    brand.style.cssText =
      'font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c9a84c;margin-bottom:14px;font-weight:600';
    root.appendChild(brand);

    const title = document.createElement('div');
    title.style.cssText = 'font-size:15px;font-weight:700;color:#f5efe3;line-height:1.35;margin-bottom:4px';
    title.textContent = `${params.surahEnglish} — Ayah ${params.ayahNum}`;
    root.appendChild(title);

    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:13px;color:#a89b82;margin-bottom:18px';
    sub.textContent = params.surahArabic;
    root.appendChild(sub);

    const ar = document.createElement('div');
    ar.dir = 'rtl';
    ar.style.cssText =
      'font-size:22px;line-height:1.75;color:#f8f4ea;font-family:Amiri,Georgia,"Arial Unicode MS",serif;margin-bottom:16px';
    ar.textContent = params.arabic;
    root.appendChild(ar);

    if (params.translation?.trim()) {
      const tr = document.createElement('div');
      tr.style.cssText =
        'font-size:14px;line-height:1.55;color:#d4cbb8;border-top:1px solid rgba(201,168,76,0.2);padding-top:14px';
      tr.textContent = params.translation.trim();
      root.appendChild(tr);
    }

    const foot = document.createElement('div');
    foot.style.cssText = 'margin-top:18px;font-size:10px;color:#7a7165';
    foot.textContent = 'Quran data: api.alquran.cloud · For reflection and sharing';
    root.appendChild(foot);

    return root;
  }

  private makeHadithCardEl(params: {
    bookName: string;
    hadithNumber: string;
    chapterName?: string;
    narrator: string;
    arabic?: string;
    body: string;
    rtl: boolean;
  }): HTMLElement {
    const root = document.createElement('div');
    root.style.cssText = [
      'box-sizing:border-box',
      'width:400px',
      'padding:28px 24px',
      'background:linear-gradient(165deg,#121a2e 0%,#0a0e1a 55%)',
      'color:#e8e0d0',
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
      'border-radius:16px',
      'border:1px solid rgba(201,168,76,0.35)',
      'box-shadow:0 12px 40px rgba(0,0,0,0.45)'
    ].join(';');

    const brand = document.createElement('div');
    brand.textContent = APP_BRAND;
    brand.style.cssText =
      'font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c9a84c;margin-bottom:14px;font-weight:600';
    root.appendChild(brand);

    const title = document.createElement('div');
    title.style.cssText = 'font-size:15px;font-weight:700;color:#f5efe3;line-height:1.35';
    title.textContent = `${params.bookName} · #${params.hadithNumber}`;
    root.appendChild(title);

    if (params.chapterName?.trim()) {
      const ch = document.createElement('div');
      ch.style.cssText = 'font-size:12px;color:#a89b82;margin:6px 0 14px';
      ch.textContent = params.chapterName.trim();
      root.appendChild(ch);
    }

    if (params.arabic?.trim()) {
      const ar = document.createElement('div');
      ar.dir = 'rtl';
      ar.style.cssText =
        'font-size:18px;line-height:1.7;color:#f0ebe0;font-family:Amiri,Georgia,"Arial Unicode MS",serif;margin-bottom:12px';
      ar.textContent = params.arabic.trim();
      root.appendChild(ar);
    }

    const nar = document.createElement('div');
    nar.style.cssText = 'font-size:12px;font-style:italic;color:#c4b8a4;margin-bottom:10px';
    nar.textContent = params.narrator;
    root.appendChild(nar);

    const body = document.createElement('div');
    body.dir = params.rtl ? 'rtl' : 'ltr';
    body.style.cssText = `font-size:14px;line-height:1.55;color:#d4cbb8;border-top:1px solid rgba(201,168,76,0.2);padding-top:12px;white-space:pre-wrap`;
    body.textContent = params.body.trim();
    root.appendChild(body);

    const foot = document.createElement('div');
    foot.style.cssText = 'margin-top:16px;font-size:10px;color:#7a7165';
    foot.textContent = 'Hadith data: hadithapi.com · Verify with scholars and printed sources';
    root.appendChild(foot);

    return root;
  }

  private async renderCardAndShare(card: HTMLElement): Promise<void> {
    card.style.position = 'fixed';
    card.style.left = '-8000px';
    card.style.top = '0';
    card.style.zIndex = '-1';
    document.body.appendChild(card);
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: '#0a0e1a',
        logging: false,
        useCORS: true
      });
      await this.sharePngCanvas(canvas);
    } finally {
      card.remove();
    }
  }

  private async sharePngCanvas(canvas: HTMLCanvasElement): Promise<void> {
    const base64 = canvasToBase64Png(canvas);
    const fileName = `share-${Date.now()}.png`;

    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache
      });
      const { uri } = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache
      });
      await Share.share({
        title: APP_BRAND,
        files: [uri],
        dialogTitle: 'Share image'
      });
      return;
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not create image.'))), 'image/png');
    });
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: APP_BRAND });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    throw new Error('DOWNLOAD_OK');
  }

  /** Use after catching errors from share methods. */
  isCancelled(err: unknown): boolean {
    return isShareCancelled(err);
  }

  isClipboardOk(err: unknown): boolean {
    return (err as Error)?.message === 'CLIPBOARD_OK';
  }

  isDownloadFallback(err: unknown): boolean {
    return (err as Error)?.message === 'DOWNLOAD_OK';
  }
}
