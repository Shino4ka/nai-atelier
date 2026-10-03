/* Public owner content. GitHub authenticates publication; no credentials in this app. */
(function (root) {
  "use strict";
  const OWNER = "Shino4ka",
    REPO = "nai-atelier",
    MARK = "nai-atelier:v1:";
  function imageURL(value) {
    try {
      const u = new URL(String(value || ""));
      return u.protocol === "https:" &&
        !u.username &&
        !u.password &&
        u.href.length < 3000
        ? u.href
        : "";
    } catch {
      return "";
    }
  }
  function normalizePrompt(value) {
    return String(value || "")
      .replace(/\s*\n\s*/g, ", ")
      .replace(/(-?\d+(?:\.\d+)?)::(.*?)::/g, (_, w, s) => {
        const parts = s.split(",").map((x) => x.trim());
        return parts.some((x) => x.startsWith("artist:"))
          ? parts
              .map((x) => `${w}::${x.replace(/^artist:\s*/, "")} ::`)
              .join(", ")
          : `${w}::${s.trim()} ::`;
      })
      .trim();
  }
  function encode(p) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(p))));
  }
  function decode(s) {
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  }
  function attachedImage(body) {
    const cleaned = String(body || "").replace(
      /<!--\s*nai-atelier:v1:[A-Za-z0-9+/=]+\s*-->/g,
      "",
    );
    const found = [];
    const re =
      /!\[[^\]]*\]\(\s*(https:\/\/[^\s)]+)(?:\s+[^)]*)?\)|<img\b[^>]*\bsrc=["'](https:\/\/[^"']+)["'][^>]*>/gi;
    let m;
    while ((m = re.exec(cleaned))) found.push(imageURL(m[1] || m[2]));
    return found.filter(Boolean).pop() || "";
  }
  function parseIssue(issue) {
    if (
      !issue ||
      String(issue.user?.login).toLowerCase() !== OWNER.toLowerCase() ||
      issue.pull_request ||
      !Number.isSafeInteger(issue.number)
    )
      return null;
    const m = String(issue.body || "").match(
      /<!--\s*nai-atelier:v1:([A-Za-z0-9+/=]+)\s*-->/,
    );
    if (!m || m[1].length > 45000) return null;
    try {
      const p = decode(m[1]);
      if (p.version !== 1 || !["style", "example"].includes(p.type))
        return null;
      const key = p.type === "style" ? p.id : p.target;
      if (!/^(r\d+|c-[a-z0-9-]{8,64})$/.test(key || "")) return null;
      if (
        p.type === "style" &&
        (!p.id.startsWith("c-") ||
          !["style", "mix"].includes(p.variant) ||
          !String(p.name || "").trim() ||
          !String(p.prompt || "").trim() ||
          !String(p.description || "").trim())
      )
        return null;
      if (
        p.type === "style" &&
        [p.name, p.prompt, p.description, p.note || ""].some(
          (x) => typeof x !== "string" || x.length > 10000,
        )
      )
        return null;
      return {
        payload: p,
        key,
        number: issue.number,
        open: issue.state === "open",
        url: `https://github.com/${OWNER}/${REPO}/issues/${issue.number}`,
        image: attachedImage(issue.body) || imageURL(p.imageURL),
        caption: String(p.caption || "").slice(0, 1000),
        params: String(p.params || "").slice(0, 1000),
      };
    } catch {
      return null;
    }
  }
  function materialize(base, issues) {
    const styles = new Map(),
      examples = new Map();
    for (const issue of issues) {
      const r = parseIssue(issue);
      if (!r) continue;
      const map = r.payload.type === "style" ? styles : examples;
      if (!map.has(r.key) || r.number > map.get(r.key).number)
        map.set(r.key, r);
    }
    const out = base.map((r) => ({ ...r }));
    for (const r of styles.values()) {
      if (!r.open) continue;
      const p = r.payload;
      out.push({
        id: p.id,
        name: p.name.trim().slice(0, 160),
        prompt: normalizePrompt(p.prompt),
        description: p.description.trim(),
        note: String(p.note || ""),
        kind: "mix",
        category: p.variant === "style" ? "Авторские стили" : "Меши",
        status: "Авторская подборка",
        author: "Шино",
        custom: true,
        variant: p.variant,
        source: r.url,
        original: "",
        params: r.params,
        imageURL: r.image,
        imageCaption: r.caption,
        cmsIssue: r.url,
      });
    }
    for (const r of out) {
      const ex = examples.get(r.id);
      if (ex?.open) {
        r.imageURL = ex.image;
        r.imageCaption = ex.caption;
        r.exampleParams = ex.params;
        r.exampleIssue = ex.url;
      }
    }
    return out;
  }
  function buildIssue(p) {
    const title =
      p.type === "style"
        ? `[Atelier] ${p.name}`
        : `[Atelier · пример] ${p.targetName}`;
    const details =
      p.type === "style"
        ? `## ${p.name}\n\n${p.description}\n\n### Промпт\n\n\`\`\`text\n${normalizePrompt(p.prompt)}\n\`\`\`\n\n${p.note || ""}`
        : `## Пример: ${p.targetName}`;
    const body = `<!-- ${MARK}${encode({ ...p, version: 1 })} -->\n\n${details}\n\n### Пример изображения\n\n${p.imageURL ? `![Пример](${imageURL(p.imageURL)})` : "Прикрепи изображение сюда кнопкой загрузки GitHub или перетаскиванием файла."}\n\n${p.caption || ""}\n\n${p.params ? `Параметры: ${p.params}` : ""}\n\n---\nПубликация NAI Atelier. Открытая запись от ${OWNER} появится в каталоге. Закрытие последней публикации скроет её.`;
    const url = new URL(`https://github.com/${OWNER}/${REPO}/issues/new`);
    url.searchParams.set("title", title.slice(0, 220));
    url.searchParams.set("body", body);
    const needsPaste = url.href.length > 7500;
    if (needsPaste) url.searchParams.delete("body");
    return { url: url.href, body, needsPaste };
  }
  root.AtelierCMS = {
    OWNER,
    REPO,
    imageURL,
    normalizePrompt,
    parseIssue,
    materialize,
    buildIssue,
  };
})(typeof window !== "undefined" ? window : globalThis);

("use strict");
const $ = (s) => document.querySelector(s),
  data = window.ATLAS,
  baseItems = data.items.map((r) => ({ ...r }));
let items = baseItems.map((r) => ({ ...r }));
const CMS = window.AtelierCMS;
const copyIcon =
  '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>';
const categories = [
  "Все",
  "Особые v5",
  "Рисовка",
  "Материал",
  "Цвет",
  "Эффекты",
  "Качество",
  "Находки пользователей",
  "Художники",
  "Художники в UC",
  "Авторские стили",
];
const sections = [
  ["all", "Все записи"],
  ["tag", "Стилевые теги"],
  ["artist", "Художники"],
  ["mix", "Меши"],
  ["negative", "Негативы"],
  ["own", "Авторские стили"],
];
let section = "all",
  category = "Все",
  query = "",
  status = "all",
  limit = 24,
  selected = new Set(),
  timer;
const esc = (s) =>
  String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const safeRead = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
if (safeRead("atelier-theme", "dark") === "light") {
  document.body.classList.add("light");
  $("#themeBtn").setAttribute("aria-label", "Включить тёмную тему");
}
function group(r) {
  if (r.status.includes("Официаль")) return "official";
  if (r.status.includes("Адаптация")) return "adapted";
  if (r.status.includes("заготовка") || r.status.includes("Авторская подборка"))
    return "experimental";
  return "community";
}
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => $("#toast").classList.remove("show"), 2400);
}
async function copy(t) {
  try {
    if (navigator.clipboard && window.isSecureContext)
      await navigator.clipboard.writeText(t);
    else {
      let a = document.createElement("textarea");
      a.value = t;
      a.style.cssText = "position:fixed;left:-9999px";
      document.body.append(a);
      a.select();
      const ok = document.execCommand("copy");
      a.remove();
      if (!ok) throw Error("copy");
    }
    toast("Скопировано");
  } catch {
    openInfo(
      '<h2>Скопируй строку вручную</h2><p>Браузер не дал доступ к буферу. Выдели текст ниже.</p><textarea aria-label="Промпт для ручного копирования" class="manual-copy" rows="6">' +
        esc(t) +
        "</textarea>",
    );
  }
}
function nav() {
  $("#nav").innerHTML = sections
    .map(
      ([k, v]) =>
        `<button class="nav-btn ${section === k ? "active" : ""}" data-section="${k}" aria-pressed="${section === k}">${v}<span>${k === "all" ? items.length : items.filter((r) => (k === "own" ? r.custom : r.kind === k)).length}</span></button>`,
    )
    .join("");
}
function filtered() {
  return items.filter(
    (r) =>
      (section === "all" ||
        (section === "own" ? r.custom : r.kind === section)) &&
      (category === "Все" || r.category === category) &&
      (status === "all" || group(r) === status) &&
      (!query ||
        [r.name, r.prompt, r.description, r.category, r.status, r.note]
          .join(" ")
          .toLowerCase()
          .includes(query)),
  );
}
function render() {
  nav();
  const art =
    section === "mix"
      ? [
          "assets/mix.webp",
          "Сереброволосый мужчина среди золотых цветов — декоративная иллюстрация",
        ]
      : ["assets/canal.webp", "Ночной канал — декоративная иллюстрация"];
  if ($("#heroArt").getAttribute("src") !== art[0]) {
    $("#heroArt").src = art[0];
    $("#heroArt").alt = art[1];
  }
  $("#categories").innerHTML = (
    ["all", "tag", "artist"].includes(section)
      ? categories.filter(
          (c) =>
            c === "Все" ||
            items.some(
              (r) =>
                r.category === c &&
                (section === "all" ||
                  (section === "own" ? r.custom : r.kind === section)),
            ),
        )
      : ["Все"]
  )
    .map(
      (c) =>
        `<button class="chip ${c === category ? "active" : ""}" data-category="${esc(c)}" aria-pressed="${c === category}">${esc(c)}</button>`,
    )
    .join("");
  const found = filtered();
  $("#cards").innerHTML = found
    .slice(0, limit)
    .map(
      (r) =>
        `<article class="card ${r.kind}"><div class="card-head"><span class="type-label">${esc(r.category)}</span></div><button class="open-card" data-open="${r.id}" aria-label="Подробнее: ${esc(r.name)}"><h3>${esc(r.name)}</h3><p class="desc">${esc(r.description)}</p></button>${cardExample(r)}<div class="card-footer"><button class="detail-link" data-open="${r.id}">Подробнее</button><div class="card-actions"><button data-copy="${r.id}" aria-label="Копировать ${esc(r.name)}" title="Копировать">${copyIcon}</button>${r.kind === "tag" || r.kind === "artist" ? `<button data-add="${r.id}" aria-pressed="${selected.has(r.id)}" aria-label="${selected.has(r.id) ? "Убрать из строки" : "Добавить в строку"}: ${esc(r.name)}" title="${selected.has(r.id) ? "Убрать из строки" : "Добавить в строку"}">${selected.has(r.id) ? "✓" : "+"}</button>` : ""}</div></div></article>`,
    )
    .join("");
  $("#resultCount").textContent = found.length;
  $("#empty").hidden = found.length > 0;
  $("#loadMore").hidden = found.length <= limit;
  $("#sectionTitle").firstChild.textContent =
    sections.find((s) => s[0] === section)[1] + " ";
}
function tray() {
  const a = items.filter((r) => selected.has(r.id));
  $("#tray").hidden = !a.length;
  $("#trayCount").textContent =
    a.length + " " + (a.length === 1 ? "тег" : a.length < 5 ? "тега" : "тегов");
}
function show(r) {
  currentDetail = r.id;
  $("#modalKicker").textContent = r.category + " / " + r.status;
  $("#detailContent").innerHTML =
    `<div><h2 id="detailTitle">${esc(r.name)}</h2><p>${esc(r.description)}</p></div>${r.params ? `<p class="params">${esc(r.params)}</p>` : ""}<div class="code-wrap"><pre>${esc(r.prompt)}</pre></div><div class="code-actions"><button class="primary" data-copy="${r.id}">${r.kind === "negative" ? "Копировать UC" : "Копировать строку"}</button>${["tag", "artist"].includes(r.kind) ? `<button data-add="${r.id}">${selected.has(r.id) ? "Убрать из строки" : "Добавить в строку"}</button>` : ""}</div>${exampleMarkup(r)}${r.custom ? `<button data-edit-style="${r.id}">Изменить свой стиль</button>` : ""}${r.note ? `<h3>Примечания</h3><p class="note">${esc(r.note)}</p>` : ""}${r.original ? `<details><summary>Строка из публикации</summary><div class="code-wrap"><pre>${esc(r.original)}</pre></div><button data-original="${r.id}">Копировать оригинал</button></details>` : ""}${r.source ? `<a class="source-link" href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">Источник ↗</a>` : `<p class="source-link">${r.author ? "Автор подборки: " + esc(r.author) : "Авторская подборка."}</p>`}`;
  $("#detail").showModal();
}
function openInfo(html) {
  $("#infoContent").innerHTML = html;
  if (!$("#info").open) $("#info").showModal();
}
function sources() {
  openInfo(
    "<h2>Источники</h2><p>Документация NovelAI и публикации с примерами. Ссылки на отдельные рецепты доступны в карточках.</p>" +
      data.sources
        .map(
          (s) =>
            `<div class="source-row"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><small>${esc(s.type)}</small><details><summary>Примечания</summary><p>${esc(s.note)}</p></details></div>`,
        )
        .join(""),
  );
}
function method() {
  openInfo(`<h2>О каталоге</h2>
<p>Каталог объединяет художественные теги, имена художников, меши и негативы для NovelAI v5. Стилевые строки задают рисовку; персонажа, внешность, действие и окружение добавляй отдельно.</p>
<h3>Происхождение записей</h3><p>Официальные теги и пресеты взяты из документации. Публикации v5 содержат примеры авторов. Адаптации сопровождаются примечаниями к строке, а авторские подборки служат основой для экспериментов. Генерационные тесты каталога не проводились; параметры указаны там, где их опубликовал автор.</p>
<h3>Веса</h3><p><code>1.2::tag ::</code> усиливает тег, <code>0.5::tag ::</code> ослабляет. Имена художников записываются так же: <code>0.8::kagoya1219 ::</code>. Отрицательный вес направляет изображение от признака. В UC положительный вес усиливает избегание. Prompt Mixing через <code>|</code> доступен для v3 и ниже.</p>
<h3>Негативы</h3><p>Вставляй одну полную строку в UC с пресетом None. Heavy подавляет dithering, halftone, screentone и multiple views; Light содержит sepia. Выбирай негатив с учётом нужных эффектов. Для комиксов есть адаптации без прямых запретов текста, чиби и панелей; их косвенное влияние не проверено.</p>
<p>Тег eyelashes в UC подавляет ресницы. Автоматические Quality Tags могут добавлять no text. Задавай чиби для нужного кадра, а не глобально для комикса. Имена художников в UC не подтверждены как средство подавления чиби.</p>
<h3>Сравнение стилей</h3><p>Используй одну модель Full или Curated, одинаковые промпт, размеры, sampler, steps и guidance. Сравни несколько seeds, меняя по одному тегу или весу. Вклад отдельных художников в мешах не проверен в изоляции.</p>
<details><summary>Материалы и ограничения</summary><p>Каталог — открытый справочник, а не полный словарь обучения NovelAI. Общая документация художественных тегов не подтверждает тест каждого тега на v5. Опубликованный результат отражает пример автора.</p><p>Оригинальные строки доступны в карточках. Для части источников доступны сохранённые материалы; сведения о проверке указаны в списке источников. Закрытые Discord-каналы и недоступный EXIF не использованы для восстановления рецептов.</p><p>Иллюстрации шапки и чиби созданы для оформления другим генератором. Примеры стилей находятся в карточках.</p></details>
<button id="exportData">Скачать каталог JSON</button>`);
}
let currentDetail = "",
  workshopMode = "style",
  workshopTarget = null,
  workshopId = "",
  syncBusy = false;
const chibiAssets = [
  "assets/chibi/painter.webp",
  "assets/chibi/palette.webp",
  "assets/chibi/ink.webp",
  "assets/chibi/eraser.webp",
  "assets/chibi/album.webp",
];
$("#mascots").innerHTML = chibiAssets
  .map(
    (src) => `<img src="${src}" alt="" width="52" height="58" loading="lazy">`,
  )
  .join("");
function cardExample(r) {
  if (!["mix", "tag"].includes(r.kind) || !r.imageURL) return "";
  return `<button class="card-example" data-open="${r.id}" aria-label="Посмотреть пример: ${esc(r.name)}"><img src="${esc(r.imageURL)}" alt="Пример ${esc(r.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span>Пример</span></button>`;
}
function exampleMarkup(r) {
  return `<section class="example-panel" aria-label="Пример изображения"><div class="example-heading"><h3>Пример</h3><button data-example="${r.id}">${r.imageURL ? "Заменить пример" : "Добавить пример"}</button></div>${r.imageURL ? `<figure class="style-example"><a href="${esc(r.imageURL)}" target="_blank" rel="noopener noreferrer"><img src="${esc(r.imageURL)}" alt="${esc(r.imageCaption || "Пример стиля " + r.name)}" referrerpolicy="no-referrer"></a>${r.imageCaption ? `<figcaption>${esc(r.imageCaption)}</figcaption>` : ""}</figure>${r.exampleParams || (r.custom && r.params) ? `<p class="example-params">${esc(r.exampleParams || r.params)}</p>` : ""}` : ""}${r.exampleIssue ? `<a class="source-link" href="${esc(r.exampleIssue)}" target="_blank" rel="noopener noreferrer">Публикация примера на GitHub</a>` : ""}</section>`;
}
function field(id, value) {
  $("#" + id).value = value || "";
}
function openWorkshop(r = null, mode = "style") {
  if ($("#detail").open) $("#detail").close();
  workshopMode = mode;
  workshopTarget = r;
  workshopId = r?.custom ? r.id : "c-" + crypto.randomUUID();
  $("#workshopTitle").textContent =
    mode === "example"
      ? "Пример: " + r.name
      : r?.custom
        ? "Редактирование стиля"
        : "Новый стиль";
  $("#styleFields").hidden = mode === "example";
  for (const id of ["ownName", "ownPrompt", "ownDescription"])
    $("#" + id).required = mode !== "example";
  field("ownName", r?.custom ? r.name : "");
  field("ownVariant", r?.variant || "style");
  field("ownPrompt", r?.custom ? r.prompt : "");
  field("ownDescription", r?.custom ? r.description : "");
  field("ownNote", r?.custom ? r.note : "");
  field("ownImageURL", r?.imageURL);
  field("ownCaption", r?.imageCaption);
  field(
    "ownParams",
    mode === "example" ? r?.exampleParams || r?.params : r?.params,
  );
  $("#editorPreview").hidden = true;
  $("#publicationStep").hidden = true;
  $("#publicationStep").innerHTML = "";
  $("#workshopError").hidden = true;
  const own = items.filter((x) => x.custom);
  $("#workshopRecords").innerHTML =
    `<div class="workshop-records"><h3>Опубликованные стили <span>${own.length}</span></h3><p class="field-help">Для изменения выбери карточку. Чтобы скрыть запись, закрой её последнюю публикацию на GitHub.</p>${own.map((x) => `<div class="owner-record"><button data-edit-style="${x.id}">${esc(x.name)}</button><a href="${esc(x.cmsIssue)}" target="_blank" rel="noopener noreferrer">На GitHub</a></div>`).join("")}${safeRead("atelier-draft-v1", "") ? '<button type="button" id="restoreDraft">Открыть черновик</button>' : ""}</div>`;
  if (!$("#workshop").open) $("#workshop").showModal();
}
function workshopPayload() {
  const image = fieldValue("ownImageURL");
  if (image && !CMS.imageURL(image))
    throw Error("Укажи полную ссылку https:// на изображение.");
  const common = {
    version: 1,
    imageURL: CMS.imageURL(image),
    caption: fieldValue("ownCaption"),
    params: fieldValue("ownParams"),
  };
  if (workshopMode === "example")
    return {
      ...common,
      type: "example",
      target: workshopTarget.id,
      targetName: workshopTarget.name,
    };
  return {
    ...common,
    type: "style",
    id: workshopId,
    variant: fieldValue("ownVariant"),
    name: fieldValue("ownName"),
    prompt: CMS.normalizePrompt(fieldValue("ownPrompt")),
    description: fieldValue("ownDescription"),
    note: fieldValue("ownNote"),
  };
}
function fieldValue(id) {
  return $("#" + id).value.trim();
}
function previewWorkshopImage() {
  const u = CMS.imageURL(fieldValue("ownImageURL"));
  $("#editorPreview").hidden = !u;
  $("#editorPreview").innerHTML = u
    ? `<img src="${esc(u)}" alt="Предпросмотр примера" referrerpolicy="no-referrer">`
    : "";
  if (!u && fieldValue("ownImageURL")) toast("Нужна полная ссылка https://");
}
function saveWorkshopDraft() {
  try {
    const p = workshopPayload();
    localStorage.setItem("atelier-draft-v1", JSON.stringify(p));
    toast("Черновик сохранён в этом браузере");
  } catch (e) {
    toast(e.message || "Не удалось сохранить черновик");
  }
}
function restoreWorkshopDraft() {
  try {
    const p = JSON.parse(safeRead("atelier-draft-v1", ""));
    const r =
      p.type === "example" ? items.find((x) => x.id === p.target) : null;
    if (p.type === "example" && !r) throw Error();
    openWorkshop(r, p.type === "example" ? "example" : "style");
    if (p.type === "style") {
      workshopId = p.id;
      field("ownName", p.name);
      field("ownVariant", p.variant);
      field("ownPrompt", p.prompt);
      field("ownDescription", p.description);
      field("ownNote", p.note);
    }
    field("ownImageURL", p.imageURL);
    field("ownCaption", p.caption);
    field("ownParams", p.params);
    toast("Черновик открыт");
  } catch {
    toast("Черновик не удалось открыть");
  }
}
function updateOwned(issues) {
  items = CMS.materialize(baseItems, issues);
  data.items = items;
  render();
  if ($("#detail").open) {
    const r = items.find((x) => x.id === currentDetail);
    if (r) {
      $("#detail").close();
      show(r);
    }
  }
}
async function loadOwned(force = false) {
  if (syncBusy) return;
  syncBusy = true;
  $("#refreshOwned").disabled = true;
  let cached = null;
  try {
    cached = JSON.parse(safeRead("atelier-owner-cache-v1", "null"));
    if (cached && Array.isArray(cached.issues)) updateOwned(cached.issues);
    if (cached && !force && Date.now() - cached.time < 120000) {
      $("#syncMessage").textContent = "Стили загружены";
      return;
    }
    $("#syncMessage").textContent = "Загрузка стилей…";
    const issues = [];
    for (let page = 1; page <= 20; page++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let response;
      try {
        response = await fetch(
          `https://api.github.com/repos/${CMS.OWNER}/${CMS.REPO}/issues?creator=${CMS.OWNER}&state=all&sort=created&direction=desc&per_page=100&page=${page}`,
          {
            headers: { Accept: "application/vnd.github+json" },
            signal: controller.signal,
            cache: "no-store",
          },
        );
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) throw Error("GitHub " + response.status);
      const batch = await response.json();
      if (!Array.isArray(batch)) throw Error("response");
      issues.push(...batch);
      if (batch.length < 100) break;
      if (page === 20) throw Error("pagination limit");
    }
    updateOwned(issues);
    try {
      localStorage.setItem(
        "atelier-owner-cache-v1",
        JSON.stringify({ time: Date.now(), issues }),
      );
    } catch {}
    $("#syncMessage").textContent = "Стили обновлены";
  } catch {
    $("#syncMessage").textContent = cached
      ? "Показана сохранённая копия авторских стилей · попробуй обновить"
      : "Авторские стили временно недоступны · попробуй обновить";
  } finally {
    syncBusy = false;
    $("#refreshOwned").disabled = false;
  }
}
$("#workshopForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#workshopError").hidden = true;
  try {
    const p = workshopPayload();
    const result = CMS.buildIssue(p);
    if (result.needsPaste) await copy(result.body);
    $("#publicationStep").hidden = false;
    $("#publicationStep").innerHTML =
      `<h3>Подтверди публикацию</h3><p>${result.needsPaste ? "Текст публикации скопирован. Вставь его в описание на GitHub. " : ""}Прикрепи изображение, если нужно, и нажми <strong>Create</strong> или <strong>Создать</strong> в аккаунте Shino4ka. Затем вернись сюда и нажми «Обновить».</p><a class="primary publish-link" href="${esc(result.url)}" target="_blank" rel="noopener noreferrer">${result.needsPaste ? "Открыть GitHub и вставить текст" : "Открыть публикацию на GitHub"}</a><p class="field-help">Записи других аккаунтов не включаются в каталог. Изображения и опубликованные стили будут общедоступны.</p>`;
    $("#publicationStep").scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  } catch (e) {
    $("#workshopError").hidden = false;
    $("#workshopError").textContent = e.message || "Проверь заполнение формы.";
  }
});
document.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (
      img.tagName === "IMG" &&
      img.closest(".style-example,.card-example,.editor-preview")
    ) {
      img.hidden = true;
      const label = document.createElement("p");
      label.className = "image-load-error";
      label.textContent =
        "Не удалось загрузить изображение. Проверь ссылку на пример.";
      img.parentElement.append(label);
    }
  },
  true,
);

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const ds = b.dataset;
  if (ds.example) {
    openWorkshop(
      items.find((r) => r.id === ds.example),
      "example",
    );
    return;
  }
  if (ds.editStyle) {
    openWorkshop(
      items.find((r) => r.id === ds.editStyle),
      "style",
    );
    return;
  }
  if (ds.section) {
    section = ds.section;
    category = "Все";
    limit = 24;
    render();
    return;
  }
  if (ds.category) {
    category = ds.category;
    limit = 24;
    render();
    return;
  }
  const id = ds.copy || ds.open || ds.add || ds.original;
  if (id) {
    const r = items.find((r) => r.id === id);
    if (ds.copy) copy(r.prompt);
    if (ds.original) copy(r.original);
    if (ds.open) show(r);
    if (ds.add) {
      if (selected.has(id)) selected.delete(id);
      else {
        const isUc = r.category === "Художники в UC",
          existing = items.filter((x) => selected.has(x.id));
        if (existing.some((x) => (x.category === "Художники в UC") !== isUc)) {
          toast("Собирай позитив и UC отдельно");
          return;
        }
        selected.add(id);
      }
      tray();
      render();
      if ($("#detail").open) {
        const action = $("#detail [data-add]");
        if (action)
          action.textContent = selected.has(id)
            ? "Убрать из строки"
            : "Добавить в строку";
      }
      toast(selected.has(id) ? "Добавлено в строку" : "Убрано из строки");
    }
    return;
  }
  if (b.classList.contains("close")) b.closest("dialog").close();
  if (b.id === "sourceBtn") sources();
  if (b.id === "workshopBtn") openWorkshop();
  if (b.id === "refreshOwned") loadOwned(true);
  if (b.id === "saveDraft") saveWorkshopDraft();
  if (b.id === "previewExample") previewWorkshopImage();
  if (b.id === "restoreDraft") restoreWorkshopDraft();
  if (b.id === "methodBtn") method();
  if (b.id === "themeBtn") {
    document.body.classList.toggle("light");
    const light = document.body.classList.contains("light");
    b.setAttribute(
      "aria-label",
      light ? "Включить тёмную тему" : "Включить светлую тему",
    );
    try {
      localStorage.setItem("atelier-theme", light ? "light" : "dark");
    } catch {}
  }
  if (b.id === "loadMore") {
    limit += 36;
    render();
  }
  if (b.id === "reset") {
    section = "all";
    category = "Все";
    query = "";
    status = "all";
    $("#search").value = "";
    $("#status").value = "all";
    limit = 24;
    render();
  }
  if (b.id === "trayClear") {
    selected.clear();
    tray();
    render();
  }
  if (b.id === "trayCopy")
    copy(
      items
        .filter((r) => selected.has(r.id))
        .map((r) => r.prompt)
        .join(", "),
    );
  if (b.id === "trayView")
    openInfo(
      '<h2>Твоя строка</h2><p>Теги соединены в порядке каталога. Выбранные художники для UC собираются отдельно от позитивных тегов.</p><div class="code-wrap"><pre>' +
        esc(
          items
            .filter((r) => selected.has(r.id))
            .map((r) => r.prompt)
            .join(", "),
        ) +
        "</pre></div>",
    );
  if (b.id === "exportData") {
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "nai-atelier-v5.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
});
$("#search").addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  limit = 24;
  render();
});
$("#status").addEventListener("change", (e) => {
  status = e.target.value;
  limit = 24;
  render();
});
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) &&
    !$("dialog[open]")
  ) {
    e.preventDefault();
    $("#search").focus();
  }
});
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  }),
);
render();
loadOwned();
