(() => {
  'use strict';

  const form = document.getElementById('janitorLinkForm');
  const field = document.getElementById('janitorLink');
  const button = form.querySelector('button');
  const status = document.getElementById('janitorStatus');
  const t = window.atelierText;
  const label = (ru, en) => document.documentElement.lang === 'en' ? en : ru;
  const encoder = new TextEncoder();
  const characterPath = /^\/characters\/([\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})(?:[_-][^/]+)?\/?$/i;

  const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
    return value;
  });

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
    return (crc ^ 0xffffffff) >>> 0;
  }

  function pngCard(png, card) {
    const data = encoder.encode(JSON.stringify(card));
    let binary = '';
    for (let offset = 0; offset < data.length; offset += 8192) {
      binary += String.fromCharCode(...data.subarray(offset, offset + 8192));
    }
    const payload = encoder.encode('tEXtchara\0' + btoa(binary));
    const chunk = new Uint8Array(payload.length + 8);
    const header = new DataView(chunk.buffer);
    header.setUint32(0, payload.length - 4);
    chunk.set(payload, 4);
    header.setUint32(chunk.length - 4, crc32(payload));

    // Canvas PNGs end with the 12-byte IEND chunk.
    const iend = png.length - 12;
    if (iend < 8 || new DataView(png.buffer, png.byteOffset).getUint32(iend + 4) !== 0x49454e44) {
      throw new Error(label('Не удалось собрать PNG.', 'The PNG could not be created.'));
    }
    return new Blob([png.subarray(0, iend), chunk, png.subarray(iend)], { type: 'image/png' });
  }

  async function zipCards(files) {
    const body = [];
    const directory = [];
    let offset = 0;
    let directorySize = 0;
    for (const { name, png } of files) {
      const filename = encoder.encode(name);
      const bytes = new Uint8Array(await png.arrayBuffer());
      const checksum = crc32(bytes);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0x0800, true);
      local.setUint16(12, 33, true);
      local.setUint32(14, checksum, true);
      local.setUint32(18, bytes.length, true);
      local.setUint32(22, bytes.length, true);
      local.setUint16(26, filename.length, true);

      const entry = new DataView(new ArrayBuffer(46));
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      entry.setUint16(8, 0x0800, true);
      entry.setUint16(14, 33, true);
      entry.setUint32(16, checksum, true);
      entry.setUint32(20, bytes.length, true);
      entry.setUint32(24, bytes.length, true);
      entry.setUint16(28, filename.length, true);
      entry.setUint32(42, offset, true);

      body.push(local.buffer, filename, bytes);
      directory.push(entry.buffer, filename);
      offset += local.byteLength + filename.length + bytes.length;
      directorySize += entry.byteLength + filename.length;
    }
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, directorySize, true);
    end.setUint32(16, offset, true);
    return new Blob([...body, ...directory, end.buffer], { type: 'application/zip' });
  }

  function download(blob, name) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 30000);
  }


  async function imageToPng({ mime, base64 }) {
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mime }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    try {
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
    } finally {
      bitmap.close();
    }
    const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('png');
    return new Uint8Array(await png.arrayBuffer());
  }

  field.addEventListener('input', () => field.setCustomValidity(''));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    let url;
    try { url = new URL(field.value); } catch {}
    const id = url?.pathname.match(characterPath)?.[1].toLowerCase();
    if (!id || !['https://janitorai.com', 'https://www.janitorai.com'].includes(url.origin) || url.username || url.password) {
      field.setCustomValidity(t('Вставь ссылку на персонажа с janitorai.com.'));
      field.reportValidity();
      return;
    }
    if (!form.dataset.endpoint) {
      status.textContent = t('Сервис экспорта ещё не подключён.');
      return;
    }

    button.disabled = true;
    status.textContent = t('Загружаю карточку…');
    try {
      const response = await fetch(new URL('/api/janitor/' + id, form.dataset.endpoint), {
        credentials: 'omit',
        signal: AbortSignal.timeout(35000),
      });
      if (response.status === 404) {
        status.textContent = t('Карточки с открытым описанием и приветствием нет в доступном архиве.');
        return;
      }
      if (!response.ok) throw new Error('archive');
      const { card, avatars } = await response.json();
      const baseName = Array.from(card.data.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim())
        .slice(0, 100).join('').replace(/[. ]+$/, '') || 'JanitorAI';
      const files = [];
      for (const [index, avatar] of avatars.entries()) {
        const name = baseName + (index ? '-' + (index + 1) : '') + '.png';
        files.push({ name, png: pngCard(await imageToPng(avatar), card) });
      }
      if (!files.length) throw new Error('avatar');
      download(files.length === 1 ? files[0].png : await zipCards(files),
        files.length === 1 ? files[0].name : baseName + '-avatars.zip');
      const greetings = 1 + card.data.alternate_greetings.length;
      status.textContent = label(
        `Готово · аватаров: ${files.length} · приветствий: ${greetings}`,
        `Ready · avatars: ${files.length} · greetings: ${greetings}`,
      );
    } catch {
      status.textContent = t('Не удалось скачать карточку. Попробуй чуть позже.');
    } finally {
      button.disabled = false;
    }
  });
})();
