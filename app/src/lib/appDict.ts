import type { Lang } from './lang';

/**
 * Тексты экранов и панелей приложения. Один словарь на всё, что не относится к
 * блоку результата (у него свой, `components/results.dict.ts`) и не к карточкам
 * вопросов (`components/InterruptCard.dict.ts`): разбивать оставшееся по файлам
 * значило бы держать два десятка словарей по пять строк.
 *
 * Секции названы по экранам, чтобы искать текст там же, где его видно.
 */

export type AppDict = {
  chat: {
    staleResults: string;
    metricResults: string;
    newChat: string;
    welcome: (name: string) => string;
    createHint: string;
    createTest: string;
    agentTyping: string;
    agentAnalysing: string;
    waitingOwnerTeam: string;
    analysisFailed: (error: string) => string;
    readOnlyNamed: (team: string) => string;
    readOnly: string;
    answerFirst: string;
    askAgent: string;
  };
  checks: {
    title: string;
    showAll: (n: number) => string;
    collapse: string;
    stepData: string;
    hideStepData: string;
  };
  derived: {
    title: string;
    ratio: string;
    notComputed: string;
    ratioNote: string;
    aggregatedBy: (unit: string) => string;
    perRow: string;
  };
  segments: {
    rows: (n: number) => string;
    cannotCompute: string;
    title: string;
    subtitle: string;
  };
  context: {
    partial: string;
    absent: string;
    continueFilling: string;
    fill: string;
    hideReminder: string;
  };
  invite: {
    title: string;
    role: string;
    sent: (email: string) => string;
    send: string;
  };
  auth: {
    tagline: string;
    signIn: string;
    signUp: string;
    passwordPlaceholder: string;
    companyPlaceholder: string;
    submitSignUp: string;
    submitSignIn: string;
    firstUserIsAdmin: string;
  };
  sidebar: {
    actions: string;
    rename: string;
    copyId: string;
    confirmDelete: string;
    deleteTest: string;
    newTest: string;
    tests: string;
    allTests: string;
    settings: string;
    theme: (name: string) => string;
    light: string;
    dark: string;
    help: string;
    signOut: string;
  };
  allTests: {
    title: string;
    allTeams: string;
    myTeam: string;
    name: string;
    team: string;
    hypothesis: string;
    status: string;
    results: string;
    decision: string;
    date: string;
    inProgress: string;
    emptyMine: string;
    emptyAll: string;
    showAllTeams: string;
    createFirst: string;
  };
  settings: {
    title: string;
    tabs: Record<string, string>;
    name: string;
    password: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    repeatPassword: string;
    savePassword: string;
    savingPassword: string;
    passwordChanged: string;
    passwordsDiffer: string;
    passwordChangeFailed: string;
    cancel: string;
    uploadingDoc: string;
    uploadDocFailed: string;
    role: string;
    metricsIntro: string;
    alsoKnownAs: (aliases: string) => string;
    remove: string;
    emptyDictionary: string;
    metricName: string;
    aliases: string;
    aliasesPlaceholder: string;
    add: string;
    addFailed: string;
    contextStatus: Record<string, string>;
    companyName: string;
    contextForAgent: string;
    contextNoSpecifics: string;
    continueFilling: string;
    fill: string;
    ownerFills: string;
    companyDescription: string;
    contextVersion: (version: string, updatedAt: string) => string;
    uploadNew: string;
    versionHistory: string;
    download: string;
    inviteMember: string;
    lightTheme: string;
    darkTheme: string;
    adminRights: string;
    memberRights: string;
    language: string;
  };
  newTest: {
    defaultTestType: string;
    formulasFailed: string;
    needFileForDerived: string;
    formulasNotComputed: (names: string) => string;
    createFailed: string;
    title: string;
    testName: string;
    testNamePlaceholder: string;
    hypothesis: string;
    hypothesisPlaceholder: string;
    testType: string;
    testTypes: string[];
    groups: string;
    tracker: string;
    segment: string;
    segmentPlaceholder: string;
    start: string;
    end: string;
    derivedColumns: string;
    derivedHint: string;
    derivedPlaceholder: string;
    removeColumn: string;
    addColumn: string;
    unitPlaceholder: string;
    checking: string;
    checkOnData: string;
    checkAfterFile: string;
    computed: string;
    aggregatedBy: (unit: string) => string;
    overlapsCount: (n: number) => string;
    overlapDays: (days: number) => string;
    sameAudience: string;
    andMore: (n: number) => string;
    overlapNote: string;
    dataFile: string;
    dropFile: string;
    pickFile: string;
    uploading: string;
    runAnalysis: string;
    needName: string;
    needFile: string;
    needNameAndFile: string;
  };
  onboardForm: {
    goals: string[];
    templateFailed: string;
    title: string;
    subtitle: string;
    name: string;
    namePlaceholder: string;
    role: string;
    company: string;
    mainGoal: string;
    companyDoc: string;
    uploaded: string;
    dropMd: string;
    pickFile: string;
    downloadTemplate: string;
    uploading: string;
    continue: string;
    later: string;
    laterHint: string;
  };
  onboardChat: {
    understood: (content: string) => string;
    buildFailed: string;
    enough: string;
    saveFailed: string;
    subtitle: string;
    thinking: string;
    questionsLeft: (n: number) => string;
    allCorrect: string;
    answerQuestion: string;
    answerAgent: string;
  };
  errors: {
    noServer: string;
  };
};

export const appDict: Record<Lang, AppDict> = {
  ru: {
    chat: {
      staleResults: 'Результаты на момент этого прогона (устарели)',
      metricResults: 'Результаты по метрикам',
      newChat: 'Новый чат',
      welcome: (name) => `Добро пожаловать, ${name}`,
      createHint: 'Создайте тест — агент проанализирует данные и предложит выводы',
      createTest: '✦ Создать новый тест',
      agentTyping: '✦ Агент печатает...',
      agentAnalysing: '✦ Агент анализирует данные...',
      waitingOwnerTeam: 'Агент ждёт ответа от команды-владельца теста.',
      analysisFailed: (error) => `Анализ упал: ${error}`,
      readOnlyNamed: (team) => `Тест команды «${team}» — только просмотр.`,
      readOnly: 'Тест другой команды — только просмотр.',
      answerFirst: 'Сначала ответьте на вопрос агента выше',
      askAgent: 'Спросите агента про этот тест...',
    },
    checks: {
      title: 'Проверки',
      showAll: (n) => `показать все (${n})`,
      collapse: 'свернуть',
      stepData: 'данные шага',
      hideStepData: 'скрыть данные шага',
    },
    derived: {
      title: 'Производные метрики',
      ratio: 'отношение',
      notComputed: 'не посчитана',
      ratioNote: 'сравнивается как сумма числителей к сумме знаменателей',
      aggregatedBy: (unit) => `агрегируется по «${unit}»`,
      perRow: 'считается построчно',
    },
    segments: {
      rows: (n) => `${n} строк`,
      cannotCompute: 'Не удалось посчитать в этом сегменте.',
      title: 'Гетерогенность эффекта по сегментам',
      subtitle: 'Тот же расчёт отдельно внутри каждого сегмента — сравните со строкой выше.',
    },
    context: {
      partial:
        'Контекст компании заполнен не до конца — агент отвечает без специфики вашего продукта.',
      absent: 'Контекст компании не задан — агент отвечает без специфики вашего продукта.',
      continueFilling: 'Продолжить',
      fill: 'Заполнить',
      hideReminder: 'Скрыть напоминание',
    },
    invite: {
      title: 'Пригласить участника',
      role: 'Роль',
      sent: (email) => `Ссылка-приглашение отправлена на ${email}`,
      send: 'Отправить приглашение',
    },
    auth: {
      tagline: 'Анализ A/B-тестов с AI-агентом',
      signIn: 'Вход',
      signUp: 'Регистрация',
      passwordPlaceholder: 'Пароль (минимум 8 символов)',
      companyPlaceholder: 'Компания',
      submitSignUp: 'Зарегистрироваться',
      submitSignIn: 'Войти',
      firstUserIsAdmin: 'Первый пользователь компании становится администратором',
    },
    sidebar: {
      actions: 'Действия',
      rename: 'Переименовать',
      copyId: 'Скопировать ID',
      confirmDelete: 'Точно удалить?',
      deleteTest: 'Удалить тест',
      newTest: '✦ Новый тест',
      tests: 'Тесты',
      allTests: 'Все тесты',
      settings: 'Настройки',
      theme: (name) => `Тема: ${name}`,
      light: 'Светлая',
      dark: 'Тёмная',
      help: 'Помощь / документация',
      signOut: 'Выйти',
    },
    allTests: {
      title: 'Все тесты',
      allTeams: 'Все команды',
      myTeam: 'Моя команда',
      name: 'Название',
      team: 'Команда',
      hypothesis: 'Гипотеза',
      status: 'Статус',
      results: 'Результаты',
      decision: 'Решение',
      date: 'Дата',
      inProgress: 'В процессе',
      emptyMine: 'У вашей команды пока нет тестов',
      emptyAll: 'Пока нет ни одного теста',
      showAllTeams: 'Показать тесты всех команд',
      createFirst: '✦ Создать первый тест',
    },
    settings: {
      title: 'Настройки',
      tabs: {
        profile: 'Профиль',
        company: 'Компания',
        team: 'Команда',
        metrics: 'Метрики',
        theme: 'Тема',
        roles: 'Роли и права',
      },
      name: 'Имя',
      password: 'Пароль',
      changePassword: 'Изменить пароль',
      currentPassword: 'Текущий пароль',
      newPassword: 'Новый пароль (минимум 8 символов)',
      repeatPassword: 'Повторите новый пароль',
      savePassword: 'Сохранить пароль',
      savingPassword: 'Сохраняем…',
      passwordChanged: 'Пароль изменён.',
      passwordsDiffer: 'Пароли не совпадают.',
      passwordChangeFailed: 'Не удалось сменить пароль.',
      cancel: 'Отмена',
      uploadingDoc: 'Загружаем…',
      uploadDocFailed: 'Не удалось загрузить файл.',
      role: 'Роль',
      metricsIntro:
        'Общие имена метрик для всей компании. Агент подставляет их в постановку теста, поэтому одинаковые метрики разных команд сходятся, а не расходятся по названиям.',
      alsoKnownAs: (aliases) => `также: ${aliases}`,
      remove: 'Убрать',
      emptyDictionary: 'Словарь пока пуст.',
      metricName: 'Имя метрики',
      aliases: 'Синонимы через запятую',
      aliasesPlaceholder: 'arpu_total, выручка на пользователя',
      add: 'Добавить',
      addFailed: 'Не удалось добавить метрику',
      contextStatus: {
        ready: 'Заполнен',
        draft: 'Начат, но не подтверждён',
        absent: 'Не заполнен',
      },
      companyName: 'Название',
      contextForAgent: 'Контекст для агента',
      contextNoSpecifics: ' — агент отвечает без специфики вашего продукта',
      continueFilling: 'Продолжить заполнение',
      fill: 'Заполнить',
      ownerFills: 'Заполнить может владелец компании.',
      companyDescription: 'Описание компании/продукта',
      contextVersion: (version, updatedAt) =>
        `контекст компании ${version} · обновлён ${updatedAt}`,
      uploadNew: 'Загрузить новый',
      versionHistory: 'История версий',
      download: 'Скачать',
      inviteMember: 'Пригласить участника',
      lightTheme: 'Светлая',
      darkTheme: 'Тёмная',
      adminRights:
        ' — полный доступ: команда, настройки компании, все тесты',
      memberRights:
        ' — создание тестов, просмотр всех тестов компании, чат с агентом',
      language: 'Язык',
    },
    newTest: {
      defaultTestType: 'По пользователям',
      formulasFailed: 'Не удалось посчитать формулы',
      needFileForDerived: 'Для производных колонок нужен файл с данными',
      formulasNotComputed: (names) => `Формулы не считаются: ${names}`,
      createFailed: 'Не удалось создать тест',
      title: 'Новый тест',
      testName: 'Название теста',
      testNamePlaceholder: 'Новая карточка товара',
      hypothesis: 'Гипотеза / что тестируем',
      hypothesisPlaceholder:
        'Изменение макета карточки товара увеличит конверсию в добавление в корзину',
      testType: 'Тип теста',
      testTypes: ['По пользователям', 'A/B/n', 'Ценообразование'],
      groups: 'Группы',
      tracker: 'Задача в трекере',
      segment: 'Сегмент/аудитория (опционально)',
      segmentPlaceholder: 'Новые пользователи, iOS',
      start: 'Начало',
      end: 'Конец',
      derivedColumns: 'Производные колонки (опционально)',
      derivedHint:
        'Колонка, которой нет в файле. Можно формулой — sum(orders) / count(*), — а можно словами: «конверсия из просмотра в заказ». Агент подберёт колонки сам и покажет, что именно посчитал. Юнит агрегации оставьте пустым — определим по данным.',
      derivedPlaceholder: 'конверсия из визита в заказ',
      removeColumn: 'Убрать',
      addColumn: 'Добавить колонку',
      unitPlaceholder: 'юнит: определим сам, напр. user_id',
      checking: 'Считаю...',
      checkOnData: 'Проверить на данных',
      checkAfterFile: 'Проверить формулу можно после выбора файла с данными.',
      computed: 'посчитано',
      aggregatedBy: (unit) => ` · по «${unit}»`,
      overlapsCount: (n) => `В это окно уже идут тесты: ${n}`,
      overlapDays: (days) => ` · ${days} дн. пересечения`,
      sameAudience: ' · та же аудитория',
      andMore: (n) => `и ещё ${n}`,
      overlapNote:
        'Это не мешает создать тест, но эффект может быть создан не только вашим изменением.',
      dataFile: 'Файл с данными (csv, parquet)',
      dropFile: 'Перетащите файл сюда · до 200 МБ · нужны колонки с группой и метрикой',
      pickFile: 'Выбрать файл',
      uploading: 'Загружаем...',
      runAnalysis: '✦ Запустить анализ',
      needName: 'Чтобы запустить анализ, укажите название теста.',
      needFile: 'Чтобы запустить анализ, выберите файл с данными.',
      needNameAndFile:
        'Чтобы запустить анализ, укажите название теста и выберите файл с данными.',
    },
    onboardForm: {
      goals: ['Анализ A/B тестов', 'Поиск инсайтов', 'Отчёты для команды'],
      templateFailed: 'Не удалось скачать шаблон',
      title: 'Расскажите о себе и компании',
      subtitle: 'Это поможет агенту точнее анализировать ваши тесты',
      name: 'Имя',
      namePlaceholder: 'Мария Иванова',
      role: 'Роль',
      company: 'Компания / проект',
      mainGoal: 'Основная цель использования',
      companyDoc: 'Описание компании и продукта (.md)',
      uploaded: 'загружен',
      dropMd: 'Перетащите .md файл сюда или',
      pickFile: 'Выбрать файл',
      downloadTemplate: 'Скачать шаблон .md',
      uploading: 'Загружаем...',
      continue: 'Продолжить',
      later: 'Заполнить позже',
      laterHint:
        'Контекст можно дозаполнить в любой момент — «Настройки → Компания». Тесты работают и без него: без контекста агент отвечает без специфики вашего продукта.',
    },
    onboardChat: {
      understood: (content) => `Вот как я понял ваш продукт:\n\n${content}`,
      buildFailed:
        'Не удалось собрать контекст. Проверьте, что бэкенд запущен и ANTHROPIC_API_KEY задан.',
      enough: 'Спасибо, этого достаточно — все ключевые разделы заполнены.',
      saveFailed: 'Не удалось сохранить ответ. Попробуйте ещё раз.',
      subtitle: 'Агент изучает описание компании и уточняет детали',
      thinking: '✦ Агент думает...',
      questionsLeft: (n) => `Осталось уточнить: ${n}`,
      allCorrect: 'Всё верно, начать работу',
      answerQuestion: 'Ответить на вопрос агента...',
      answerAgent: 'Ответить агенту...',
    },
    errors: {
      noServer: 'Не удалось связаться с сервером',
    },
  },
  en: {
    chat: {
      staleResults: 'Results as of this run (out of date)',
      metricResults: 'Results by metric',
      newChat: 'New chat',
      welcome: (name) => `Welcome, ${name}`,
      createHint: 'Create a test — the agent will analyse the data and propose conclusions',
      createTest: '✦ Create a new test',
      agentTyping: '✦ The agent is typing…',
      agentAnalysing: '✦ The agent is analysing the data…',
      waitingOwnerTeam: 'The agent is waiting for an answer from the team that owns this test.',
      analysisFailed: (error) => `The analysis failed: ${error}`,
      readOnlyNamed: (team) => `A test owned by team “${team}” — read-only.`,
      readOnly: 'Another team’s test — read-only.',
      answerFirst: 'Answer the agent’s question above first',
      askAgent: 'Ask the agent about this test…',
    },
    checks: {
      title: 'Checks',
      showAll: (n) => `show all (${n})`,
      collapse: 'collapse',
      stepData: 'step data',
      hideStepData: 'hide step data',
    },
    derived: {
      title: 'Derived metrics',
      ratio: 'ratio',
      notComputed: 'not computed',
      ratioNote: 'compared as the sum of numerators over the sum of denominators',
      aggregatedBy: (unit) => `aggregated per “${unit}”`,
      perRow: 'computed row by row',
    },
    segments: {
      rows: (n) => `${n} rows`,
      cannotCompute: 'Could not be computed in this segment.',
      title: 'Effect heterogeneity by segment',
      subtitle: 'The same computation inside each segment — compare it with the row above.',
    },
    context: {
      partial:
        'The company context is incomplete — the agent answers without the specifics of your product.',
      absent:
        'The company context is not set — the agent answers without the specifics of your product.',
      continueFilling: 'Continue',
      fill: 'Fill it in',
      hideReminder: 'Hide the reminder',
    },
    invite: {
      title: 'Invite a member',
      role: 'Role',
      sent: (email) => `An invitation link was sent to ${email}`,
      send: 'Send the invitation',
    },
    auth: {
      tagline: 'A/B test analysis with an AI agent',
      signIn: 'Sign in',
      signUp: 'Sign up',
      passwordPlaceholder: 'Password (at least 8 characters)',
      companyPlaceholder: 'Company',
      submitSignUp: 'Create an account',
      submitSignIn: 'Sign in',
      firstUserIsAdmin: 'The first user of a company becomes its administrator',
    },
    sidebar: {
      actions: 'Actions',
      rename: 'Rename',
      copyId: 'Copy ID',
      confirmDelete: 'Delete for good?',
      deleteTest: 'Delete the test',
      newTest: '✦ New test',
      tests: 'Tests',
      allTests: 'All tests',
      settings: 'Settings',
      theme: (name) => `Theme: ${name}`,
      light: 'Light',
      dark: 'Dark',
      help: 'Help / documentation',
      signOut: 'Sign out',
    },
    allTests: {
      title: 'All tests',
      allTeams: 'All teams',
      myTeam: 'My team',
      name: 'Name',
      team: 'Team',
      hypothesis: 'Hypothesis',
      status: 'Status',
      results: 'Results',
      decision: 'Decision',
      date: 'Date',
      inProgress: 'In progress',
      emptyMine: 'Your team has no tests yet',
      emptyAll: 'No tests yet',
      showAllTeams: 'Show tests from all teams',
      createFirst: '✦ Create the first test',
    },
    settings: {
      title: 'Settings',
      tabs: {
        profile: 'Profile',
        company: 'Company',
        team: 'Team',
        metrics: 'Metrics',
        theme: 'Theme',
        roles: 'Roles and rights',
      },
      name: 'Name',
      password: 'Password',
      changePassword: 'Change the password',
      currentPassword: 'Current password',
      newPassword: 'New password (at least 8 characters)',
      repeatPassword: 'Repeat the new password',
      savePassword: 'Save the password',
      savingPassword: 'Saving…',
      passwordChanged: 'The password has been changed.',
      passwordsDiffer: 'The passwords do not match.',
      passwordChangeFailed: 'The password could not be changed.',
      cancel: 'Cancel',
      uploadingDoc: 'Uploading…',
      uploadDocFailed: 'The file could not be uploaded.',
      role: 'Role',
      metricsIntro:
        'Shared metric names for the whole company. The agent substitutes them into the test setup, so the same metric from different teams lines up instead of drifting apart by name.',
      alsoKnownAs: (aliases) => `also: ${aliases}`,
      remove: 'Remove',
      emptyDictionary: 'The dictionary is still empty.',
      metricName: 'Metric name',
      aliases: 'Aliases, comma-separated',
      aliasesPlaceholder: 'arpu_total, revenue per user',
      add: 'Add',
      addFailed: 'The metric could not be added',
      contextStatus: {
        ready: 'Filled in',
        draft: 'Started, not confirmed',
        absent: 'Not filled in',
      },
      companyName: 'Name',
      contextForAgent: 'Context for the agent',
      contextNoSpecifics: ' — the agent answers without the specifics of your product',
      continueFilling: 'Continue filling it in',
      fill: 'Fill it in',
      ownerFills: 'Only the company owner can fill this in.',
      companyDescription: 'Company / product description',
      contextVersion: (version, updatedAt) =>
        `company context ${version} · updated ${updatedAt}`,
      uploadNew: 'Upload a new one',
      versionHistory: 'Version history',
      download: 'Download',
      inviteMember: 'Invite a member',
      lightTheme: 'Light',
      darkTheme: 'Dark',
      adminRights: ' — full access: the team, company settings, every test',
      memberRights:
        ' — creating tests, viewing every test of the company, chatting with the agent',
      language: 'Language',
    },
    newTest: {
      defaultTestType: 'By user',
      formulasFailed: 'The formulas could not be computed',
      needFileForDerived: 'Derived columns need a data file',
      formulasNotComputed: (names) => `These formulas do not compute: ${names}`,
      createFailed: 'The test could not be created',
      title: 'New test',
      testName: 'Test name',
      testNamePlaceholder: 'New product card',
      hypothesis: 'Hypothesis / what is being tested',
      hypothesisPlaceholder:
        'Changing the layout of the product card will increase add-to-cart conversion',
      testType: 'Test type',
      testTypes: ['By user', 'A/B/n', 'Pricing'],
      groups: 'Groups',
      tracker: 'Ticket in the tracker',
      segment: 'Segment / audience (optional)',
      segmentPlaceholder: 'New users, iOS',
      start: 'Start',
      end: 'End',
      derivedColumns: 'Derived columns (optional)',
      derivedHint:
        'A column that is not in the file. Either a formula — sum(orders) / count(*) — or plain words: “conversion from view to order”. The agent will pick the columns itself and show you exactly what it computed. Leave the aggregation unit empty and we will infer it from the data.',
      derivedPlaceholder: 'conversion from visit to order',
      removeColumn: 'Remove',
      addColumn: 'Add a column',
      unitPlaceholder: 'unit: inferred, e.g. user_id',
      checking: 'Computing…',
      checkOnData: 'Check against the data',
      checkAfterFile: 'A formula can be checked once a data file is chosen.',
      computed: 'computed',
      aggregatedBy: (unit) => ` · per “${unit}”`,
      overlapsCount: (n) => `Tests already running in this window: ${n}`,
      overlapDays: (days) => ` · ${days} days of overlap`,
      sameAudience: ' · same audience',
      andMore: (n) => `and ${n} more`,
      overlapNote:
        'This does not prevent creating the test, but the effect may be produced by something other than your change.',
      dataFile: 'Data file (csv, parquet)',
      dropFile: 'Drop a file here · up to 200 MB · needs a group column and a metric column',
      pickFile: 'Choose a file',
      uploading: 'Uploading…',
      runAnalysis: '✦ Run the analysis',
      needName: 'To run the analysis, give the test a name.',
      needFile: 'To run the analysis, choose a data file.',
      needNameAndFile:
        'To run the analysis, give the test a name and choose a data file.',
    },
    onboardForm: {
      goals: ['A/B test analysis', 'Finding insights', 'Reports for the team'],
      templateFailed: 'The template could not be downloaded',
      title: 'Tell us about yourself and your company',
      subtitle: 'This helps the agent analyse your tests more precisely',
      name: 'Name',
      namePlaceholder: 'Jane Doe',
      role: 'Role',
      company: 'Company / project',
      mainGoal: 'What you mainly want it for',
      companyDoc: 'Company and product description (.md)',
      uploaded: 'uploaded',
      dropMd: 'Drop a .md file here, or',
      pickFile: 'Choose a file',
      downloadTemplate: 'Download the .md template',
      uploading: 'Uploading…',
      continue: 'Continue',
      later: 'Fill it in later',
      laterHint:
        'The context can be completed at any time — Settings → Company. Tests work without it: with no context the agent answers without the specifics of your product.',
    },
    onboardChat: {
      understood: (content) => `Here is how I understood your product:\n\n${content}`,
      buildFailed:
        'The context could not be assembled. Check that the backend is running and ANTHROPIC_API_KEY is set.',
      enough: 'Thank you, that is enough — every key section is filled in.',
      saveFailed: 'The answer could not be saved. Please try again.',
      subtitle: 'The agent is reading the company description and clarifying details',
      thinking: '✦ The agent is thinking…',
      questionsLeft: (n) => `Still to clarify: ${n}`,
      allCorrect: 'All correct, let’s start',
      answerQuestion: 'Answer the agent’s question…',
      answerAgent: 'Reply to the agent…',
    },
    errors: {
      noServer: 'Could not reach the server',
    },
  },
};
