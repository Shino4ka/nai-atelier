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

