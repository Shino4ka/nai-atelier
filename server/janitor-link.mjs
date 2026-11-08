const origin = 'https://datacat.run';
const atelier = 'https://shino4ka.github.io';
const deviceToken = crypto.randomUUID();
const characterPath = /^\/api\/janitor\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i;
const upstreamHeaders = { Accept: 'application/json' };
const maxAvatarBytes = 8 * 1024 * 1024;
const maxTotalBytes = 24 * 1024 * 1024;
let session;

async function request(path, options = {}) {
  return fetch(origin + path, {
    ...options,
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });
}

function sessionToken() {
  session ||= (async () => {
    const response = await request('/api/liberator/identify', {
      method: 'POST',
      headers: { ...upstreamHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceToken }),
    });
    if (!response.ok) throw new Error('archive-session');
    const { sessionToken: token } = await response.json();
    if (typeof token !== 'string' || !token) throw new Error('archive-session');
    return token;
  })().catch(error => {
    session = undefined;
    throw error;
  });
  return session;
}

async function findCharacter(id) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const activeSession = sessionToken();
    const token = await activeSession;
    const response = await request('/api/characters/' + id, {
      headers: { ...upstreamHeaders, 'X-Session-Token': token },
    });
    if (response.status === 404 || response.status === 410) return null;
    if (response.status === 401 && attempt === 0) {
      if (session === activeSession) session = undefined;
      continue;
    }
    if (!response.ok) throw new Error('archive-character');
    const { character } = await response.json();
    if (character?.character_id !== id || character.primary_content_source_kind !== 'janitor_core' ||
        character.is_public !== true || character.full_definition_revealed_by_author !== true ||
        character.downloads_disabled || ![null, undefined, 'public'].includes(character.download_access_policy)) return null;
    return character;
  }
}

function imageUrl(value) {
  if (typeof value !== 'string' && typeof value !== 'object') return '';
  try {
    const url = new URL(typeof value === 'string' ? value : value?.url || value?.avatar);
    if (url.origin === 'https://media.datacat.run' && !url.username && !url.password) {
      url.hash = '';
      return url.href;
    }
  } catch {
    // Some archive rows only carry an image filename.
  }
  return '';
}

async function fetchAvatar(urls) {
  for (const url of urls) {
    let response;
    try {
      response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
    } catch {
      continue;
    }
    const mime = response.headers.get('content-type')?.split(';', 1)[0];
    if (!response.ok || !/^image\/(avif|gif|jpeg|png|webp)$/.test(mime || '')) continue;
    if (Number(response.headers.get('content-length')) > maxAvatarBytes) continue;
    const reader = response.body?.getReader();
    if (!reader) continue;
    let size = 0;
    let encoded = '';
    let remainder = new Uint8Array(0);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxAvatarBytes) {
        await reader.cancel();
        break;
      }
      const bytes = new Uint8Array(remainder.length + value.length);
      bytes.set(remainder);
      bytes.set(value, remainder.length);
      const end = bytes.length - bytes.length % 3;
      for (let offset = 0; offset < end; offset += 8190) {
        encoded += btoa(String.fromCharCode(...bytes.subarray(offset, Math.min(end, offset + 8190))));
      }
      remainder = bytes.subarray(end);
    }
    if (size > 0 && size <= maxAvatarBytes) {
      return { mime, base64: encoded + btoa(String.fromCharCode(...remainder)), size };
    }
  }
  throw new Error('archive-avatar');
}

async function loadAvatars(character) {
  const main = [character.avatar_variant_urls?.original, character.avatar, character.avatar_display_url]
    .map(imageUrl).filter(Boolean);
  const groups = main.length ? [main] : [];
  const seen = new Set(main);
  for (const field of [character.avatars, character.alternate_avatars]) {
    if (!Array.isArray(field)) continue;
    for (const value of field) {
      const url = imageUrl(value);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      groups.push([url]);
    }
  }
  if (!groups.length || groups.length > 20) throw new Error('archive-avatar');
  const avatars = [];
  let total = 0;
  for (const urls of groups) {
    const { size, ...image } = await fetchAvatar(urls);
    total += size;
    if (total > maxTotalBytes) throw new Error('archive-avatar');
    avatars.push(image);
  }
  return avatars;
}

export default {
  async fetch(request, env = {}) {
    const allowedOrigin = env.ATELIER_ORIGIN || atelier;
    const headers = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Cache-Control': 'no-store',
      Vary: 'Origin',
    };
    const send = (data, status = 200) => Response.json(data, { status, headers });
    const [, id] = new URL(request.url).pathname.match(characterPath) || [];
    if (!id) return send({ error: 'not-found' }, 404);
    if (request.method !== 'GET') return send({ error: 'method' }, 405);
    const requestOrigin = request.headers.get('Origin');
    if (requestOrigin && requestOrigin !== allowedOrigin) return send({ error: 'origin' }, 403);

    try {
      const character = await findCharacter(id.toLowerCase());
      const card = character?.chara_card_v2_json;
      if (!card || card.spec !== 'chara_card_v2' || typeof card.data?.name !== 'string' ||
          typeof card.data.first_mes !== 'string' || !card.data.first_mes.trim()) {
        return send({ error: 'unavailable' }, 404);
      }
      const archived = Array.isArray(card.data.alternate_greetings) ? card.data.alternate_greetings : [];
      const extra = Array.isArray(character.alternate_greetings) ? character.alternate_greetings : [];
      card.data.alternate_greetings = [...archived, ...new Set(extra.filter(text =>
        typeof text === 'string' && text.trim() && text !== card.data.first_mes && !archived.includes(text),
      ))];
      return send({
        card: { spec: card.spec, spec_version: card.spec_version, data: card.data },
        avatars: await loadAvatars(character),
      });
    } catch {
      return send({ error: 'upstream' }, 502);
    }
  },
};
