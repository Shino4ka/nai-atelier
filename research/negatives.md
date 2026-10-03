> Архив исследования. Актуальные адаптации и формат весов находятся в data.json и на сайте.

# Полные негативные промпты для NovelAI v5

Дата проверки: 2 октября 2026. Подборка по открытым источникам на английском, японском, корейском, китайском и русском. Поиск включал официальную документацию, Reddit, DCInside, Arca, 4chan, японские wiki/5ch, note, Postype, Tistory, X, GitHub, NovelAI Explore, галереи с метаданными и публичные упоминания Discord. Наличие площадки в поиске не означает, что там найден подходящий полный негатив.

Закрытые Discord-каналы не прочитаны: доступа к ним нет. В открытых сообщениях найдены рекомендации искать промпты в официальном Discord, но подтверждённых полных строк оттуда в подборке нет. Arca и ряд DCInside-страниц не дали доступного полного содержимого. В Explore UC часто скрыт за Expand: такие строки не восстанавливались по догадке.

Это исследование опубликованных строк и проверка смысловых конфликтов, а не испытание негативов на генерациях. Совместимость означает отсутствие явных запретов на комиксы, текст и чиби; гарантию отсутствия косвенного влияния дать нельзя. bad anatomy может влиять на преувеличенные пропорции.

Каждый кодовый блок ниже — целое содержимое поля Undesired Content. Выбирать один вариант; не складывать все строки. При ручном вводе полных пресетов установить UC Preset = None. Иначе автоматический пресет может вернуть удалённые запреты.

Все варианты, кроме №1, явно адаптированы. Это не дословные оригиналы и не новые авторские сборки, выданные за найденные. Ссылки ведут к исходникам; правки перечислены отдельно.

## 1. Короткий: Light V5, без изменений

Источник: https://docs.novelai.net/en/image/undesiredcontent/

Официальный V5 Full / Curated. Совпадает с оригиналом.

```text
lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::
```

Правки: Нет.

Применение: Не запрещает комиксы, текст, чиби. bad anatomy может косвенно влиять на намеренно преувеличенную анатомию.

## 2. Короткий: Itsuki AI Laboratory

Источник: https://note.com/itsuki_ailab/n/n29fdd7879590

Авторский эксперимент на V5; адаптирован.

```text
lowres, bad anatomy, bad hands, watermark, signature
```

Правки: Удалены text и nsfw. Второй тег убран для нейтральности по содержанию, а не из-за комиксов.

Применение: Пять тегов — полная адаптированная строка, не модуль для добавления к Heavy.

## 3. Средний: Heavy V5 для комиксов

Источник: https://docs.novelai.net/en/image/undesiredcontent/

Официальный пресет с явно указанными правками. Полный оригинал также опубликован на https://www.reddit.com/r/NovelAi/comments/1tzmijp/what_prompts_do_you_put_for_undesired_content/ .

```text
lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, too many watermarks
```

Правки: Удалены halftone, screentone, multiple views, logo, negative space, blank page.

Применение: Сохранён запрет на зерно и дизеринг. Для намеренно зернистого или пиксельного стиля этот вариант не нейтрален.

## 4. Средний: Human Focus V5, с сохранением светящихся глаз

Источник: https://docs.novelai.net/en/image/undesiredcontent/

Официальный пресет, адаптирован.

```text
lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, too many watermarks, mismatched pupils, bad anatomy
```

Правки: Удалены halftone, screentone, multiple views, logo, negative space, blank page, @_@, glowing eyes.

Применение: Сняты запрет на комедийные глаза и запрет на свечение. mismatched pupils не подходит, если намеренно нужны разные зрачки.

## 5. Средний: чистое аниме, Reddit V5

Источник: https://www.reddit.com/r/NovelAi/comments/1vvfz1z/over_detailed_images/

Автор использовал Heavy + собственное поле UC. Здесь полная развёрнутая комбинация с правками Heavy, а не только два дополнительных тега.

```text
lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, too many watermarks, oil painting (medium), fine art
```

Правки: Раскрыт Heavy; удалены halftone, screentone, multiple views, logo, negative space, blank page.

Применение: Для чёткой аниме-отрисовки. Не подходит для желаемой живописной подачи, WLOP-подобного рендера или масляных мазков. В сообщении автора также присутствовал no text в позитиве — его не переносить.

## 6. Длинный: анатомия и окружение, Yuushiin

Источник: https://note.com/yuushiin_ai/n/n25080ef05311

Полный негатив опубликован вместе с примером V5 Full; адаптирован.

```text
lowres, blurry, jpeg artifacts, bad anatomy, deformed, bad hands, malformed hands, extra fingers, fused fingers, missing fingers, extra arms, extra legs, malformed limbs, poorly drawn face, poorly drawn eyes, watermark, signature, very displeasing, messy background, distorted background, warped architecture, broken perspective, malformed furniture, incoherent background
```

Правки: Удалены duplicate, cropped, out of frame, text, logo, simple shading, sketch, {{{multiple views}}}, {{{reference sheet}}}, back, anime style, cel shading. Исправлено склеивание incoherent background anime style: оставлено только incoherent background. Дополнительно удалены bad proportions, cross-eyed для сохранения гротеска, чиби и нейтральности сюжета.

Применение: Не содержит явных запретов на панели, надписи или чиби. Косвенный риск: плохо нарисованные глаза могут влиять на гротеск; messy background — на намеренно хаотичное окружение. Генерацией адаптация не проверена.

## 7. Длинный: усиленная анатомия, метаданные V5

Источник: https://latent.moe/art/d865ba4e-fa8a-49e4-aa8f-963e5d8b1af1

В карточке указан Source: NovelAI Diffusion V5 0ADF9AB7. Адаптация опубликованного полного UC.

```text
lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, too many watermarks, 2::bad anatomy, bad feet, deformed, bad hands, error, extra digit, extra limb, inaccurate eyes, inaccurate limb, missing finger, extra finger::, tangled hair, chaotic hair, unnatural hair flow, hair deformation, realistic face
```

Правки: Удалён повтор целого Heavy; удалены nsfw, halftone, screentone, multiple views, logo, negative space, blank page, alternate costume.

Применение: Вес 2 сохранён из источника. Это более агрессивный вариант; для нарочито упрощённых чиби может быть хуже Light. Запрет на хаотичные волосы не подходит, если нужны растрёпанные волосы. realistic face мешает реалистичному лицу.

## 8. Очень длинный: корейский DCInside, wrtnw

Источник: https://gall.dcinside.com/mini/board/view/?id=wrtnw&no=257255

Публикация от 21.08.2026 с явным nai v5 в заголовке; полный UC в теле. Адаптирован с удалением конфликтов и случайных стилистических ограничений.

```text
watermark, too many watermarks, username, signature, mutation, deformed, distorted, disfigured, artistic error, distorted anatomy, anatomical structure error, unnatural hair, bad eyes, bad limb, bad hands, extra hands, bad hand structure, extra digits, fewer digits, bad legs, extra legs, distorted composition, bad perspective, animation error, chromatic aberration, disorganized colors, scan artifacts, jpeg artifacts, vertical lines, vertical banding, worst quality, bad quality, lowres, blurry, upscaled, unfinished, incomplete, amateur, cheesy, unsatisfactory, inadequate, deficient, subpar, poor, displeasing, very displeasing, bad illustration, bad portrait
```

Правки: Удалены text, logo, blank page, text-only page, reference, 4koma, 2koma, toon (style), oekaki, turnaround, multiple views (оба вхождения), negative space, artist:urielbeaupre15, artist:bkub, wide mouth, eyelashes, nostrils. Исправлены разделители, последний лишний знак запятой убран. Дополнительно удалены bad proportions, asymmetrical face, amputee, fewer details для сохранения гротеска, чиби и нейтральности сюжета.

Применение: eyelashes в исходнике конфликтует с выразительными ресницами. Художники убраны: это ограничения стиля, а не доказанный универсальный антидефект. Много оценочных синонимов сохранено из источника, но их независимая полезность не доказана.

## Найденные полные источники, которые не включены как готовые рекомендации

- DCInside, zetam: https://gall.dcinside.com/mgallery/board/view/?id=zetam&no=1276766 . В источнике действительно есть очень длинный полный негатив для V5, но он запрещает чиби, большой размер головы, детское/кукольное лицо, упрощённый нос, плоскую заливку, скринтоны, бабблы и типографику. После правок получился бы существенно другой пресет. Ссылка сохранена, но оригинал для заданной задачи непригоден.
- AI TAG, 추석: https://aitag.win/i/150120088 . Метаданные V5 подтверждены. Полный UC содержит повторы Heavy и повторные запреты на текст, captions, subtitles, 2koma, 4koma, chibi, toon, pointy ears, пропорции. Не включён: мешает тексту, чиби и необычной форме ушей; чрезмерно специфичен.
- AI TAG, Straylight: https://aitag.win/i/149022132 . Метаданные V5 подтверждены; вариант Heavy с nsfw, pierced ears, tight clothes и bad hands. Дополнения слишком зависят от конкретной одежды и персонажа, чтобы давать ещё один почти одинаковый универсальный пресет.
- Wetsuit, Reddit: https://www.reddit.com/r/NovelAi/comments/1wtyt8g/wetsuit/ . Полный UC опубликован, но это Heavy + nsfw, а не отдельная новая база. Учтён как дубликат.
- Sese: https://sese2000ai.com/novelai-v45-art-style-guide/ . Есть полные короткие стилевые негативы, но статья заявляет совместимость сразу с v5/v4.5; отдельной проверки каждой строки на V5 не показывает. Не смешан с подтверждёнными V5-примерами.
- Manga, note: https://note.com/ogre/n/n6941b5dc5228 . Полезный материал о V5-комиксах, но автор публикует дополнительные стилевые UC-теги сверх неназванной общей базы, а не полный негатив. Поэтому этот фрагмент не выдан за готовую строку.
- «V.5 Partial Illustration», Reddit: https://www.reddit.com/r/NovelAi/comments/1klrtts/ . Автор в комментариях уточняет, что это V4.5. Исключён.
- «D.Va’s Your New Roommate», Reddit: https://www.reddit.com/r/NovelAi/comments/1vj1m0n/dvas_your_new_roommate/ . Пост написан до выхода V5 и прямо ожидает V5. Исключён.
- 4chan /adt/ #146: https://boards.4chan.org/g/thread/109848057/adt-anime-diffusion-thread-146 . Есть упоминания V5, но подходящей подтверждённой полной строки для этой подборки не извлечено.
- Корейское обсуждение перехода на V5: https://kone.gg/s/somisoft/dBq-nMiDi6M-HWD2p6iQab . Полезны наблюдения о весах, но полного UC нет; не включено.

## Проверка конфликтов

| Ограничение в негативе | Почему убрано |
|---|---|
| text, lettering, typography, captions, subtitles, speech bubble, thought bubble | Запрещает нужные надписи и бабблы |
| comic, manga, 2koma, 4koma, multiple scenes, sequence | Запрещает или ограничивает повествовательную композицию |
| multiple views, variant set, reference sheet, duplicate | Может мешать повторному появлению одного персонажа в разных панелях; это смысловой риск, не измеренный факт |
| chibi, super deformed, oversized head, tiny nose, doll-like face | Прямой или косвенный запрет чиби |
| toon (style), flat color, simple shading, bad proportions | Может мешать упрощению и гротеску; все четыре удалены из готовых строк |
| halftone, screentone | Запрещает манговые растры |
| blank page, negative space, cropped, out of frame | Возможен конфликт с белыми полями и намеренным кадрированием; удалены консервативно |
| eyelashes, wide mouth, @_@, glowing eyes | Ограничивает детали персонажа, комедийные лица или свечение; удалены |
| pointy ears | Не подходит для персонажа с заострёнными ушами |

Не добавлены запреты на пользователей, возраст, пол, расу, сексуальность или жанровое содержание. nsfw из адаптаций убран как ненужное ограничение содержания.

## Короткая настройка

UC Preset: None. В поле UC вставить одну полную строку. В позитивном промпте и автоматических Quality Tags проверить no text: это отдельный потенциальный конфликт, который чистка негативов не устраняет. Официальная документация качества: https://docs.novelai.net/en/image/qualitytags/ .

В UC положительное числовое усиление, например 2::bad hands::, усиливает избегание; отрицательный вес внутри UC не следует считать более сильным запретом. Официальный синтаксис: https://docs.novelai.net/en/image/strengthening-weakening/ .

Для первого сравнения я выбрал бы №1, №5, №6 и №8: краткая база, подавление масляной живописи, анатомия с окружением и длинный корейский список. Сравнивать с одинаковым позитивом и несколькими одинаковыми seeds. Увеличение длины само по себе не подтверждает улучшение результата.
