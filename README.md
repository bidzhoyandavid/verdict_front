# Handoff: Verdict AI — платформа анализа A/B-тестов

## Overview
Verdict AI — веб-приложение для анализа A/B-тестов с AI-агентом: пользователь загружает данные теста, агент анализирует их в чате и выдаёт статистический вердикт (значимость, рекомендация).

## About the Design Files
Файлы в этом пакете — **дизайн-референс, созданный в HTML** (кликабельный прототип), а не production-код. Задача: воссоздать этот дизайн и поведение в реальном стеке проекта (React/Vue/Swift/др. — на выбор разработчика, если стека ещё нет), используя принятые в проекте паттерны и библиотеки, а не переносить HTML напрямую.

## Fidelity
**Hi-fi**: финальные цвета, типографика, отступы и интерактивность — воссоздавать пиксель-в-пиксель насколько возможно средствами целевого стека.

## Screens / Views

### 1. Auth (Вход/Регистрация)
- Центрированная карточка 380px, логотип (32x32 gradient #6366F1→#8B5CF6, radius 10px), таб-переключатель Вход/Регистрация (pill-контейнер, активный таб — белый фон + тень).
- Поля: Email, Пароль (текстовые инпуты, radius 8px, border 1px).
- Кнопка Primary (Войти/Зарегистрироваться) + Secondary (Продолжить с Google).
- Переход: submit → `onboard-form` (регистрация) или `main` (вход).

### 2a. Onboarding — форма
- Поля: Имя, Роль (select: Admin/Analyst/Product/Marketer/Other), Компания, чекбоксы цели использования.
- Загрузка .md файла с описанием компании (dropzone, dashed border 1.5px, radius 10px) + ссылка "Скачать шаблон .md".
- Кнопка "Продолжить" → `onboard-chat`.

### 2b. Onboarding — чат-интервью
- Агент задаёт уточняющие вопросы по company.md (bubble чата: агент слева с avatar-градиентом, пользователь справа, фон accentSoft).
- Инпут ответа снизу, кнопка "Всё верно, начать работу" → `main`.

### 3. Main (чат по тесту) — основной shell
- Сайдбар 240px (collapsible до 56px): лого, кнопка "✦ Новый тест", список тестов (dot-индикатор статуса), "Все тесты", профиль пользователя (avatar-инициалы) с dropdown-меню (Настройки, Тема, Помощь, Выйти).
- Хедер 56px: имя теста + статус-бэдж.
- Пустое состояние: центрированный welcome + CTA.
- Активный тест: сообщения чата, у агента — результат в виде мини-таблицы (Группа/Конверсия/Δ vs control), состояние "анализирует" — пульсирующий индикатор (`pulseGlow` keyframe, 1.6s).
- Инпут чата снизу (если есть активный тест).

### 4. All Tests (таблица всех тестов)
- Таблица: Название / Гипотеза / Статус (бэдж) / Результаты / Решение / Дата.
- Пустое состояние: CTA "Создать первый тест".
- Клик по строке → открывает тест в Main.

### 5. New Test Modal
- Модалка (520px, radius 14px, overlay rgba(0,0,0,0.45)): Название, Гипотеза (textarea), Тип теста + Группы (2 select в ряд), задача в трекере, сегмент, даты начала/конца, dropzone для файла данных (csv/parquet/xlsx).
- Submit → создаёт тест со статусом "analyzing", через 3.5s (демо) переключается на "done".

### 6. Settings
- Табы слева (200px): Профиль, Компания, Команда, Тема, Роли и права.
- Профиль: имя/email/пароль/роль (read-only).
- Компания: файл company.md с версией + история версий со ссылками "Скачать".
- Команда: список участников (имя/email/роль) + кнопка "Пригласить участника" → модалка (email + select роли) → отправка → confirmation.
- Тема: radio-подобные карточки Светлая/Тёмная.
- Роли и права: текстовое описание прав Admin vs остальные роли.

## Interactions & Behavior
- Тема (светлая/тёмная) переключается глобально через меню профиля или Settings → Тема; влияет на все экраны (см. Design Tokens).
- Сайдбар сворачивается/разворачивается (ширина 240px ↔ 56px, transition 0.15s).
- Модалки (New Test, Invite Member) закрываются кликом на backdrop или кнопкой "Отмена".
- Статусы теста: `queued` (в очереди), `analyzing` (пульсирующая иконка-агент), `done` (готово), `failed` (ошибка) — цветные бэджи.
- Нет анимаций переходов между экранами (мгновенная замена, SPA-style).

## State Management
Ключевые состояния: `theme`, `screen` (auth/onboard-form/onboard-chat/main/all-tests/settings), `authMode`, `currentTestId`, `tests[]` (id, name, hypothesis, status, decision, date), `sidebarCollapsed`, `profileMenuOpen`, `newTestModalOpen`, `inviteModalOpen`, `settingsTab`.
Данные для разработки: реальный backend должен отдавать список тестов, статус анализа (polling/websocket для "analyzing" → "done"), результаты (per-group conversion, p-value, decision recommendation), company.md контекст для агента, команда участников с ролями (RBAC: Admin/Analyst/Product/Marketer).

## Design Tokens

**Light theme**
- bg `#FFFFFF`, surface `#F7F7F8`, border `#E5E5E8`
- text primary `#1A1A1E`, text secondary `#6B6B76`
- accent `#6366F1` (hover `#4F46E5`, active `#4338CA`), accent soft `#EEF2FF`
- success `#10B981`, warning `#F59E0B`, error `#EF4444`

**Dark theme**
- bg `#161618`, surface `#1E1E21`, border `#2E2E33`
- text primary `#EDEDEF`, text secondary `#9B9BA3`
- accent same as light, accent soft `rgba(99,102,241,0.2)`

**Typography**: Inter (UI text, weights 400/500/600/700), JetBrains Mono (табличные/числовые данные — конверсии, заголовки таблиц).

**Radius**: inputs/buttons 8px, cards/dropzones 10px, modals 14px, avatars circle/50%.

**Spacing**: base gaps 6/8/10/12/14/16/20/24px depending on density (chat/list rows tighter, modals/forms looser).

## Assets
Нет внешних изображений — логотип и аватары — CSS-градиенты/цветные плейсхолдеры (`linear-gradient(135deg,#6366F1,#8B5CF6)`), заменить на реальный лого/иллюстрации при разработке.

## Files
- `Verdict AI.dc.html` — полный кликабельный прототип, все 6 экранов + модалки, переключение темы. Открыть в браузере для интерактивной проверки поведения.
