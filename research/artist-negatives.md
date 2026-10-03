> Архив исследования. Актуальные адаптации и формат весов находятся в data.json и на сайте.

# NovelAI v5: полные негативы с художниками

Проверено 2 октября 2026. Дополнение к первой подборке. Два новых источника и два ранее найденных, заново разобранных с сохранением художников. Ни один не выдан за проверенный мной на генерациях.

Все кодовые блоки ниже — полные адаптированные строки UC. Это не дословные оригиналы: сняты явные конфликты комиксов, текста, чиби и формы ушей персонажа, а также явно сценовые ограничения. Художники сохранены точно как в источниках; числовые веса им не назначались. Полные оригиналы доступны по ссылкам, а перечни правок приведены ниже. Вставлять один блок при UC Preset=None.

В первом ответе я слишком широко трактовал очистку и убрал художников из wrtnw. Это не следовало из требования сохранить комиксы и чиби. Здесь этот выбор исправлен.

## Подтверждённые имена

| Художник в UC | Источники |
|---|---|
| artist:urielbeaupre15 | wrtnw |
| artist:bkub | wrtnw, Genit |
| artist:xinzoruo | Genit, AI TAG Limbus, AI TAG Chuseok |
| artist:milkpanda | Genit, AI TAG Limbus, AI TAG Chuseok |
| artist:aki99 | Genit |
| artist:kurukurumagical | AI TAG Limbus, AI TAG Chuseok |

Наличие имени в рабочем UC подтверждает использование, но не доказывает, что оно улучшит любую другую смесь. Почти одинаковая тройка в разных публикациях может быть скопированной базой; независимость рецептов не установлена. Ни «anti-chibi художников», ни причин подавления ресниц по отдельным именам из этих данных доказать нельзя.

## 1. wrtnw: urielbeaupre15 + bkub

Источник: https://gall.dcinside.com/mini/board/view/?id=wrtnw&no=257255

Пост nai v5 от 21.08.2026. Это восстановленная версия ранее найденного источника, а не новая находка.

```text
watermark, too many watermarks, username, signature, mutation, deformed, distorted, disfigured, artistic error, distorted anatomy, anatomical structure error, unnatural hair, bad eyes, bad limb, bad hands, extra hands, bad hand structure, extra digits, fewer digits, bad legs, extra legs, distorted composition, bad perspective, animation error, chromatic aberration, disorganized colors, scan artifacts, jpeg artifacts, vertical lines, vertical banding, worst quality, bad quality, lowres, blurry, upscaled, unfinished, incomplete, amateur, cheesy, unsatisfactory, inadequate, deficient, subpar, poor, displeasing, very displeasing, bad illustration, bad portrait, artist:urielbeaupre15, artist:bkub
```

Правки: text, logo, blank page, text-only page, reference, 4koma, 2koma, toon (style), oekaki, turnaround, asymmetrical face, bad proportions, amputee, multiple views, negative space, fewer details, wide mouth, eyelashes, nostrils. Исправлено склеивание multiple views artist:urielbeaupre15; все художники сохранены.

Примечания: В источнике есть отдельный пример, подписанный 치비 (чиби), поэтому наличие bkub в UC не равнозначно абсолютному запрету чиби. Однако причинный эффект художников в источнике не изолирован.

## 2. Genit: xinzoruo + milkpanda + bkub + aki99

Источник: https://gall.dcinside.com/mgallery/board/view/?id=genit&no=13145

Новый источник: V5 작태 하나 공유해봐요, 22.08.2026. Полный позитив, негатив, изображения и параметры.

```text
artist:xinzoruo, artist:milkpanda, artist:bkub, artist:aki99, lowres, worst quality, bad quality, very displeasing, jpeg artifacts, scan artifacts, artistic error, film grain, chromatic aberration, dithering, blurry, unfinished, incomplete, distorted composition, bad perspective, animation error, disorganized colors, vertical lines, vertical banding, mutation, deformed, distorted, disfigured, distorted anatomy, anatomical structure error, unnatural hair, bad eyes, cloudy eyes, blank eyes, 2::empty eyes::, bad limb, bad hands, extra hands, bad hand structure, 3::bad fingers, bad hands::, extra digits, fewer digits, bad legs, extra legs, bad illustration, bad portrait, amateur, cheesy, unsatisfactory, inadequate, deficient, subpar, poor, watermark, too many watermarks, username, signature, artist collaboration
```

Правки: halftone, screentone, fewer details, multiple views, negative space, asymmetrical face, bad ears, red ears, asymmetrical ears, too long ears, monkey ears, bad proportions, amputee, monochrome, dated, old, 1990s (style), toon (style), oekaki, chibi, turnaround, 4koma, 2koma, text, logo, blank page, text-only page, reference, variant set, large variant set, 3::text::. Ограничения формы и цвета ушей сняты: они зависят от дизайна персонажа.

Примечания: Сохранены исходные веса глаз 2 и рук 3. У художников нет числовых весов. Вес 3 агрессивен для намеренно упрощённых рук чиби; действие адаптации генерацией не проверено. Параметры источника: 18–20 steps, guidance 5, rescale 0.4, Euler Ancestral.

## 3. AI TAG: xinzoruo + milkpanda + kurukurumagical

Источник: https://aitag.win/i/149867573

Новый источник: 림버스 컴퍼니. JSON содержит Source: NovelAI Diffusion V5 0ADF9AB7 и полный base_caption отрицательного промпта.

```text
watermark, too many watermarks, signature, dated, artistic error, scan artifacts, jpeg artifacts, upscaled, aliasing, film grain, heavy film grain, dithering, chromatic aberration, digital dissolve, artist:xinzoruo, artist:milkpanda, artist:kurukurumagical, artist collaboration, one-hour drawing challenge, 1990s (style), mutation, deformed, distorted, disfigured, bad anatomy, unnatural hair, bad face, mob face, bad eyes, empty eyes, bad limbs, bad arm, bad hands, bad hand structure, extra digits, fewer digits, bad leg, extra leg, distorted composition, bad perspective, disorganized colors, unfinished, incomplete, displeasing, very displeasing, unsatisfactory, inadequate, deficient, subpar, poor, blurry, lowres, worst quality, bad quality
```

Правки: blank page, logo (повторы), reference, artist name (повторы), halftone, screentones, toon (style), 4koma, 2koma, bad proportions, amputee, multiple views, fewer details, happy expression, fighting pose, clean clothing, intact clothing, strong, confident, clear vision, easy struggle, single goblin, no explicit content, text, choker, artist logo, gold bikini. Последние сценовые ограничения не являются универсальными антидефектами.

Примечания: Все три художника без числовых весов. Сохранены dated, 1990s (style), one-hour drawing challenge: это стилистические ограничения исходника. Для ретро-комикса вариант не нейтрален. На эффективность каждого художника отдельно этот пример не проверяет.

## 4. AI TAG: очень длинная база с теми же тремя художниками

Источник: https://aitag.win/i/150120088

Ранее найденный источник 추석 теперь разобран как полный UC с художниками. Метаданные V5 0ADF9AB7. Это другая строка, но не новая комбинация художников.

```text
watermark, too many watermarks, username, signature, artist collaboration, film grain, dithering, dated, 1990s (style), mutation, deformed, distorted, disfigured, artistic error, distorted anatomy, anatomical structure error, unnatural hair, bad eyes, cloudy eyes, blank eyes, bad limb, bad hands, extra hands, bad hand structure, extra digits, fewer digits, bad legs, extra legs, distorted composition, bad perspective, animation error, chromatic aberration, disorganized colors, scan artifacts, jpeg artifacts, vertical lines, vertical banding, worst quality, bad quality, lowres, blurry, upscaled, unfinished, incomplete, amateur, cheesy, unsatisfactory, inadequate, deficient, subpar, poor, displeasing, very displeasing, bad illustration, bad portrait, aliasing, heavy film grain, digital dissolve, artist:xinzoruo, artist:milkpanda, artist:kurukurumagical, one-hour drawing challenge, mutated, bad anatomy, bad face, mob face, cloned face, distorted face, poorly drawn face, ugly, empty eyes, extra eyes, lazy eye, distorted body, bad limbs, missing limbs, extra limbs, bad arm, malformed hands, poorly drawn hands, extra fingers, fused fingers, bad leg, extra leg, unrealistic colors, messy details
```

Правки: Удалены точные повторы; сняты text, logo, blank page, text-only page, reference, variant set, large variant set, 4koma, 2koma, toon (style), chibi, turnaround, halftone, screentones, screentone, multiple views, negative space, subtitles, captions, artist name, pointy ears, asymmetrical face, bad proportions, amputee, fewer details, asymmetrical eyes, cross-eyed, wrong body proportions, unrealistic proportions, long neck, wrong head size, duplicate, cheek blush lines, striped blush, blush streaks. Сняты специфические ограничения половой анатомии: large areolae, puckered anus, triangular anus, inverted nipples.

Примечания: Самая длинная адаптация в дополнении. Сохраняет оценочные и анатомические синонимы оригинала; полезность каждого не доказана. Может мешать нарочито искажённым или одноглазым персонажам. Художники сохранены, их вес не выдуман.

## Границы поиска и отсеивание

Продолжен поиск полных UC с именами художников на корейском, английском, японском и китайском; проверялись запросы с 네거, 부정, 작가, ネガティブ, 絵師, 负面, 画师, negative artist и полями UC/base_caption. Дополнительно проверялись отдельные имена художников, встреченные в негативе. В открытой выдаче преобладают два семейства баз, а не десятки независимых V5-рецептов.

- https://aichat.tistory.com/56 — полезное наблюдение о помещении художников в негатив ради изменения палитры. Датировано июлем, до выпуска V5; полных строк и имён в доступном тексте нет. Не включено как полный V5-негатив.
- https://latent.moe/art/b696f6b6-919a-4e69-9305-959670719220 — полный UC с xinzoruo и milkpanda, но Source указывает V4.5 4BDE2A90. Исключён из V5-подборки.
- https://aitags.fun/p.aspx?md5=da4e0bf2e09031ae5a67bd693983f5d4 — похожая длинная база с тремя именами; не использована как отдельное подтверждение V5 без проверки версии.
- https://www.tumblr.com/theothin/tagged/novelai — поисковая выдача содержит обсуждение negative artist tags, но полный UC и принадлежность конкретного сообщения V5 не извлечены. Не восстановлен по догадке.
- https://kone.gg/s/somisoft/dBq-nMiDi6M-HWD2p6iQab — V5-пост отсылает к ранее опубликованному V4.5f-негативу. Самой полной строки в доступном тексте нет. Не включено фрагментом.
- Закрытые Discord-каналы не прочитаны: доступ отсутствует.

Отдельные слова artist name и artist collaboration не являются именами художников. Первая запись ограничивает подписи, вторая — смешение стилей. Они не учитывались как новые художники.

Совместимость здесь означает отсутствие прямых запретов на комиксы, текст и чиби. Косвенное действие художественных тегов, анатомических негативов и весов нельзя гарантировать без сравнения генераций на вашей смеси.
