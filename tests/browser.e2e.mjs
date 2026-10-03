// Run in the Codex browser REPL with a local tab and its browser binding.
export async function runAtelierE2E(tab, browser) {
  const fs = await import("node:fs/promises");
  const artifactDir = new URL("../verification/", import.meta.url);
  await fs.mkdir(artifactDir, { recursive: true });
  const checks = [];
  const assert = (name, condition) => {
    checks.push({ name, passed: Boolean(condition) });
    if (!condition) throw new Error(name);
  };
  const count = () => tab.playwright.locator("#resultCount").textContent();
  const close = async () => {
    await tab.playwright.locator("dialog[open] .close").click();
    await tab.getAXState({ emit: false });
    if (await tab.playwright.locator("dialog[open]").count()) {
      throw new Error("dialog closes before the next action");
    }
  };
  const fit = () =>
    tab.playwright.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
  await tab.reload();
  await tab.getAXState({ emit: false });
  if ((await tab.playwright.locator("body").getAttribute("class")) === "light")
    await tab.playwright.locator("#themeBtn").click();
  assert("catalog contains all 208 base records", Number(await count()) >= 208);
  assert(
    "first page contains 24 cards",
    (await tab.playwright.locator(".card").count()) === 24,
  );
  await tab.playwright.locator("#loadMore").click();
  assert(
    "pagination adds 36 cards",
    (await tab.playwright.locator(".card").count()) === 60,
  );
  await tab.playwright.locator("#search").fill("low complexity");
  assert("search finds a tag", Number(await count()) === 1);
  await tab.playwright.locator('[data-copy="r92"]').click();
  assert(
    "copy preserves the prompt",
    (await tab.clipboard.readText()) === "low complexity",
  );
  await tab.playwright.locator('[data-add="r92"]').click();
  assert(
    "builder opens for a selected tag",
    await tab.playwright.locator("#tray").isVisible(),
  );
  await tab.playwright.locator("#trayView").click();
  assert(
    "builder displays the selected prompt",
    (await tab.playwright.locator("#infoContent pre").textContent()) ===
      "low complexity",
  );
  await close();
  await tab.playwright.locator("#trayClear").click();
  assert(
    "builder clears",
    !(await tab.playwright.locator("#tray").isVisible()),
  );
  await tab.playwright.locator(".open-card").click();
  assert(
    "detail preserves prompt and source",
    (await tab.playwright
      .locator("#detailContent pre")
      .first()
      .textContent()) === "low complexity" &&
      (await tab.playwright.locator("#detailContent a.source-link").count()) >
        0,
  );
  await tab.playwright.locator('[data-example="r92"]').click();
  assert(
    "example form is available",
    (await tab.playwright.locator("#workshop").isVisible()) &&
      !(await tab.playwright.locator("#styleFields").isVisible()),
  );
  await close();
  await tab.playwright.locator("#search").fill("no-such-style-atelier-e2e");
  assert(
    "empty search state",
    await tab.playwright.locator("#empty").isVisible(),
  );
  await tab.playwright.locator("#reset").click();
  assert("reset restores the catalog", Number(await count()) >= 208);
  for (const [section, expected] of [
    ["tag", 146],
    ["artist", 30],
    ["negative", 15],
  ]) {
    await tab.playwright.locator(`[data-section="${section}"]`).click();
    assert(
      `${section} section retains records`,
      Number(await count()) === expected,
    );
  }
  await tab.playwright.locator(".open-card").first().click();
  assert(
    "negative detail has a full UC string",
    (await tab.playwright.locator("#detailContent pre").first().textContent())
      .length > 100,
  );
  await close();
  await tab.playwright.locator('[data-section="mix"]').click();
  assert("mix section retains recipes", Number(await count()) >= 17);
  await tab.playwright.locator('[data-section="all"]').click();
  await tab.playwright.locator("#status").selectOption("official");
  assert(
    "provenance filter works",
    Number(await count()) > 0 && Number(await count()) < 208,
  );
  await tab.playwright.locator("#status").selectOption("all");
  await tab.playwright.locator("#sourceBtn").click();
  assert(
    "all 20 sources are accessible",
    (await tab.playwright.locator(".source-row").count()) === 20,
  );
  await close();
  await tab.playwright.locator("#methodBtn").click();
  assert(
    "reference and JSON export are accessible",
    await tab.playwright.locator("#exportData").isVisible(),
  );
  await close();
  await tab.playwright.locator("#workshopBtn").click();
  assert(
    "style editor retains required fields",
    (await tab.playwright.locator("#ownName").getAttribute("required")) !==
      null &&
      (await tab.playwright.locator("#ownPrompt").getAttribute("required")) !==
        null &&
      (await tab.playwright.locator("#saveDraft").isVisible()),
  );
  await close();
  const viewport = await browser.capabilities.get("viewport");
  for (const width of [1440, 1024, 768, 390, 320]) {
    await viewport.set({ width, height: 900 });
    await tab.getAXState({ emit: false });
    assert(`catalog fits ${width}px`, await fit());
    if (width === 1440) {
      assert(
        "navigation occupies the sidebar on desktop",
        await tab.playwright.evaluate(
          () =>
            document.querySelector("#nav").getBoundingClientRect().right <
            document.querySelector("main").getBoundingClientRect().left,
        ),
      );
      assert(
        "search and provenance controls share a height",
        await tab.playwright.evaluate(
          () =>
            document.querySelector(".search-wrap").getBoundingClientRect()
              .height ===
            document.querySelector("#status").getBoundingClientRect().height,
        ),
      );
      assert(
        "cards and controls share the corner radius",
        await tab.playwright.evaluate(
          () =>
            getComputedStyle(document.querySelector(".card")).borderRadius ===
            getComputedStyle(document.querySelector(".search-wrap"))
              .borderRadius,
        ),
      );
      assert(
        "Cyrillic interface and heading fonts are loaded",
        await tab.playwright.evaluate(
          () =>
            document.fonts.check("16px Manrope", "Каталог") &&
            document.fonts.check("40px Literata", "Каталог"),
        ),
      );
    }
    await tab.playwright.locator(".brand").click();
    await tab.getAXState({ emit: false });
    await tab.playwright.locator(".open-card").first().click();
    assert(`detail fits ${width}px`, await fit());
    await close();
  }
  await tab.playwright.locator("#themeBtn").click();
  assert(
    "light theme is available",
    (await tab.playwright.locator("body").getAttribute("class")) === "light",
  );
  await tab.reload();
  await tab.getAXState({ emit: false });
  assert(
    "theme persists on reload",
    (await tab.playwright.locator("body").getAttribute("class")) === "light",
  );
  await tab.playwright.locator("#themeBtn").click();
  await viewport.reset();
  const report = { url: await tab.url(), checks, passed: checks.length };
  await fs.writeFile(
    new URL("browser-report.json", artifactDir),
    JSON.stringify(report, null, 2),
  );
  return report;
}
