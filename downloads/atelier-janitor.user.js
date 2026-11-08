// ==UserScript==
// @name         Atelier · JanitorAI Card Export
// @namespace    https://shino4ka.github.io/nai-atelier/
// @version      1.0.0
// @description  Save JanitorAI avatars and greetings as SillyTavern PNG cards.
// @match        https://janitorai.com/*
// @run-at       document-idle
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      ella.janitorai.com
// ==/UserScript==

(() => {
  'use strict';

  const encoder = new TextEncoder();
  const characterPath = /^\/characters\/([\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})(?:[_-][^/]+)?\/?$/i;
  const characterId = () => location.pathname.match(characterPath)?.[1].toLowerCase();
  const preferredLanguage = new URLSearchParams(location.search).get('atelier_lang');
  const russian = preferredLanguage ? preferredLanguage === 'ru' : navigator.language.startsWith('ru');
  const label = (ru, en) => russian ? ru : en;
  const asText = value => typeof value === 'string' ? value : '';

  function characterFrom(payload, id) {
    for (const character of [payload?.character, payload?.data?.character, payload?.data, payload]) {
      if (asText(character?.id).toLowerCase() === id && asText(character.name).trim()) return character;
    }
  }

  function embeddedCharacter(id) {
    const state = unsafeWindow._storeState_;
    for (const [key, store] of Object.entries(state || {})) {
      if (key.includes('characterStore')) {
        const character = characterFrom(store, id);
        if (character) return character;
      }
    }

    for (const script of document.scripts) {
      const source = script.textContent;
      if (!source.includes('window.mbxM.push') || !source.includes('characterStore')) continue;
      for (const match of source.matchAll(/JSON\.parse\(("(?:[^"\\]|\\[\s\S])*")\)/g)) {
        try {
          const stores = JSON.parse(JSON.parse(match[1]));
          for (const [key, store] of Object.entries(stores)) {
            if (!key.includes('characterStore')) continue;
            const character = characterFrom(store, id);
            if (character) return character;
          }
        } catch {
          // Other hydration scripts can have a different serialization format.
        }
      }
    }
  }

  function sessionToken() {
    const chunks = new Map();
    for (const cookie of document.cookie.split(/;\s*/)) {
      const match = cookie.match(/^(sb-[\w-]+-auth-token)(?:\.(\d+))?=(.*)$/);
      if (!match) continue;
      const [, key, index = '0', value] = match;
      if (!chunks.has(key)) chunks.set(key, []);
      chunks.get(key)[Number(index)] = value;
    }

    for (const values of chunks.values()) {
      try {
        const raw = decodeURIComponent(values.join(''));
        const json = raw.startsWith('base64-')
          ? new TextDecoder().decode(Uint8Array.from(atob(raw.slice(7).replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0)))
          : raw;
        const token = asText(JSON.parse(json)?.access_token);
        if (/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return token;
      } catch {
        // Ignore expired or unrecognized session cookies.
      }
    }
  }

  async function getCharacter(id) {
    const embedded = embeddedCharacter(id);
    const endpoint = new URL('/hampter/characters/' + id, location.origin);
    const headers = { Accept: 'application/json' };
    const token = sessionToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    let api;
    try {
      const response = await fetch(endpoint, {
        headers, credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(8000),
      });
      if (response.ok) api = characterFrom(await response.json(), id);
    } catch {
      // The page's own data can still be used if the detail request fails.
    }

    if (!api && !embedded) {
      throw new Error(label('Данные персонажа недоступны. Войди в JanitorAI и обнови страницу.', 'Character data is unavailable. Sign in to JanitorAI and reload the page.'));
    }

    const character = { ...embedded, ...api };
    const apiStarters = readGreetings(api?.first_messages);
    const pageStarters = readGreetings(embedded?.first_messages);
    const [starters, extraStarters] = apiStarters.length >= pageStarters.length
      ? [apiStarters, pageStarters] : [pageStarters, apiStarters];
    character.first_messages = starters;
    character.alternate_greetings = [
      ...extraStarters.filter(text => !starters.includes(text)),
      ...readGreetings(api?.alternate_greetings), ...readGreetings(embedded?.alternate_greetings),
    ];
    character.avatars = [api?.avatars, embedded?.avatars].filter(Array.isArray).flat();
    character.alternate_avatars = [api?.alternate_avatars, embedded?.alternate_avatars].filter(Array.isArray).flat();
    return character;
  }

  function greetingText(value) {
    return asText(value) || asText(value?.content) || asText(value?.message) || asText(value?.text);
  }

  function readGreetings(values) {
    return Array.isArray(values) ? values.map(greetingText).filter(text => text.trim()) : [];
  }

  function toCard(character) {
    const [primary, ...starters] = character.first_messages;
    const first = primary || greetingText(character.first_message) || greetingText(character.greeting);
    if (!first.trim()) {
      throw new Error(label('JanitorAI не передал приветствия для этой карточки.', 'JanitorAI did not provide greetings for this card.'));
    }

    const extra = [...new Set(character.alternate_greetings)].filter(text => text !== first && !starters.includes(text));
    const tags = [character.tags, character.custom_tags].flatMap(values =>
      Array.isArray(values) ? values.map(tag => asText(tag?.name ?? tag)).filter(Boolean) : [],
    );
    return {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: character.name,
        description: asText(character.description),
        personality: asText(character.personality),
        scenario: asText(character.scenario),
        first_mes: first,
        mes_example: asText(character.example_dialogs || character.example_dialogue),
        creator_notes: asText(character.creator_notes),
        system_prompt: asText(character.system_prompt),
        post_history_instructions: asText(character.post_history_instructions),
        alternate_greetings: [...starters, ...extra],
        tags: [...new Set(tags)],
        creator: asText(character.creator_name || character.creator?.name || character.creator),
        character_version: '',
        extensions: { janitor_id: character.id },
      },
    };
  }

  function avatarUrl(value) {
    const raw = asText(value?.url || value?.src || value?.avatar_url || value?.avatar || value?.filename || value).trim();
    if (!raw) return '';
    try {
      const url = raw.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(raw)
        ? new URL(raw, location.origin)
        : new URL(raw.replace(/^bot-avatars\//, ''), 'https://ella.janitorai.com/bot-avatars/');
      if (url.protocol === 'https:' && (url.hostname === 'janitorai.com' || url.hostname.endsWith('.janitorai.com')) &&
          !url.username && !url.password && !url.port) {
        url.hash = '';
        return url.href;
      }
    } catch {
      // Skip malformed image locations.
    }
    return '';
  }

  function avatarGroups(character) {
    const portrait = document.querySelector('.character-card-flex-avatar img');
    const primary = [character.avatar_url, character.avatar, portrait?.currentSrc || portrait?.src]
      .map(avatarUrl).filter(Boolean);
    const key = value => new URL(value).pathname.replace(/^\/bot-avatars\//, '');
    const seen = new Set(primary.map(key));
    const groups = primary.length ? [[...new Set(primary)]] : [];

    for (const list of [character.avatars, character.alternate_avatars]) {
      if (!Array.isArray(list)) continue;
      for (const value of list) {
        const url = avatarUrl(value);
        if (!url || seen.has(key(url))) continue;
        seen.add(key(url));
        groups.push([url]);
      }
    }
    return groups;
  }

  async function avatarBlob(url) {
    try {
      const response = await fetch(url, {
        credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(8000),
      });
      if (response.ok) return response.blob();
    } catch {
      // Some avatars are served without CORS headers.
    }
    if (new URL(url).hostname !== 'ella.janitorai.com') return null;
    return new Promise(resolve => {
      GM_xmlhttpRequest({
        method: 'GET', url, responseType: 'blob', anonymous: true, redirect: 'error', timeout: 8000,
        onload: response => resolve(response.status >= 200 && response.status < 300 ? response.response : null),
        onerror: () => resolve(null),
        onabort: () => resolve(null),
        ontimeout: () => resolve(null),
      });
    });
  }

  async function avatarPng(urls, number) {
    for (const url of urls) {
      try {
        const blob = await avatarBlob(url);
        if (!blob) continue;
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        try {
          canvas.getContext('2d').drawImage(bitmap, 0, 0);
        } finally {
          bitmap.close();
        }
        const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (png) return new Uint8Array(await png.arrayBuffer());
      } catch {
        // The same portrait may be available at another official CDN URL.
      }
    }
    throw new Error(label(`Не удалось скачать аватар №${number}. Обнови страницу и попробуй ещё раз.`, `Avatar ${number} could not be downloaded. Reload the page and try again.`));
  }

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

  async function exportCard(id, status) {
    const character = await getCharacter(id);
    const card = toCard(character);
    const groups = avatarGroups(character);
    if (!groups.length) throw new Error(label('JanitorAI не передал аватар.', 'JanitorAI did not provide an avatar.'));
    const baseName = Array.from(card.data.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim())
      .slice(0, 100).join('').replace(/[. ]+$/, '') || 'JanitorAI';
    const files = [];
    for (const [index, urls] of groups.entries()) {
      if (id !== characterId()) return;
      status.textContent = label(`Аватар ${index + 1} из ${groups.length}…`, `Avatar ${index + 1} of ${groups.length}…`);
      const png = pngCard(await avatarPng(urls, index + 1), card);
      files.push({ name: baseName + (index ? `-${index + 1}` : '') + '.png', png });
    }
    const output = files.length === 1 ? files[0].png : await zipCards(files);
    if (id !== characterId()) return;
    download(output, files.length === 1 ? files[0].name : baseName + '-avatars.zip');
    const greetings = card.data.alternate_greetings.length + 1;
    status.textContent = label(`Готово · аватаров: ${files.length} · приветствий: ${greetings}`, `Ready · avatars: ${files.length} · greetings: ${greetings}`);
  }

  const panel = document.createElement('aside');
  panel.setAttribute('aria-label', 'Atelier');
  panel.style.cssText = 'position:fixed;right:12px;bottom:max(68px,env(safe-area-inset-bottom));z-index:10000;max-width:min(320px,calc(100vw - 24px));padding:9px;border:1px solid #547578;border-radius:12px;background:#121927;color:#edf1f8;font:14px/1.45 system-ui,sans-serif;box-shadow:0 4px 24px #0006';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label('Скачать карточку', 'Download card');
  button.style.cssText = 'padding:9px 13px;border:0;border-radius:7px;background:#93e2d9;color:#101f27;font:inherit;font-weight:700;cursor:pointer';
  const status = document.createElement('div');
  status.setAttribute('role', 'status');
  panel.append(button, status);

  let shownId;
  function syncPage() {
    const id = characterId();
    if (id === shownId) return;
    shownId = id;
    status.textContent = '';
    button.disabled = false;
    if (id) document.body.append(panel);
    else panel.remove();
  }

  button.addEventListener('click', async () => {
    const id = characterId();
    if (!id || button.disabled) return;
    button.disabled = true;
    status.textContent = label('Загружаю карточку…', 'Loading the card…');
    try {
      await exportCard(id, status);
    } catch (error) {
      if (id === characterId()) status.textContent = error.message;
    } finally {
      if (id === characterId()) button.disabled = false;
    }
  });

  syncPage();
  setInterval(syncPage, 500);
})();
