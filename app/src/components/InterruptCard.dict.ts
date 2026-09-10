import type { Lang } from '../lib/lang';

/**
 * Тексты карточек-вопросов. Заголовки и подписи вариантов намеренно повторяют
 * формулировки бэкенда: пауза приходит с текстом вопроса, а карточка знает,
 * как назвать кнопки, — расхождение читалось бы как два разных вопроса.
 */

export type InterruptDict = {
  aggregates: { mean: string; median: string };
  methodLabels: Record<string, string>;
  titles: Record<string, string>;
  rowsAffected: (share: string, n: number) => string;
  rowsCount: (n: number) => string;
  totalRows: string;
  keyColumn: string;
  nullsIn: (n: number) => string;
  byGroup: string;
  groupNulls: (group: string, nNull: number, nRows: number, share: string) => string;
  group: string;
  uniqueOf: (column: string) => string;
  rows: string;
  share: string;
  expected: string;
  deviation: string;
  profileHead: (n: number, median: string, mean: string, max: string) => string;
  profileMoments: (skewness: string, kurtosis: string) => string;
  top1Share: (share: string) => string;
  negativeShare: (share: string) => string;
  ownQuantiles: string;
  apply: string;
  confirmOutliers: string;
  appliedCompare: (method: string) => string;
  yesContinue: string;
  noPickAnother: string;
  checkSelected: string;
  overallSplitOnly: string;
  nLevels: (n: number) => string;
  falsePositives: (fpr: string, alpha: string) => string;
  interval: string;
  conservative: string;
  skewOutliers: (skew: string, outliers: string) => string;
  zeros: (share: string) => string;
  recommended: string;
  recommendShort: string;
  reviewSelected: string;
  allPrimary: string;
  segmentTested: (n: number) => string;
  skewIn: (levels: string) => string;
  noSkew: string;
  uniqueValues: (n: number) => string;
  oneRowPerValue: string;
  rowsPerValue: (n: string) => string;
  nullShare: (share: string) => string;
  meanValue: (value: string) => string;
  skipBalanceCheck: string;
  columnNotListed: string;
  columnNamePlaceholder: string;
  countByIt: string;
  splitSumHint: (total: string) => string;
  setPlannedSplit: string;
  alphaDefaults: (srm: string, metric: string) => string;
  alphaSrm: string;
  alphaMetrics: string;
  applyOwn: string;
  looksLikeControl: string;
  nullsIntro: string;
  outliersIntro: (column: string, share: string) => string;
  alreadyRejected: (methods: string) => string;
  countSelected: string;
  cancelOverallOnly: string;
  typicalCauses: (causes: string) => string;
};

export const interruptDict: Record<Lang, InterruptDict> = {
  ru: {
    aggregates: { mean: 'среднее', median: 'медиана' },
    methodLabels: {
      winsorize: 'Винсоризация',
      trim: 'Отбросить выбросы',
      cap: 'Обрезать по границам',
      log_transform: 'Логарифмировать',
      log_winsorize: 'Лог + винсоризация',
      none: 'Ничего не делать',
      drop: 'Удалить строки с пропусками',
      stop: 'Остановить расчёты',
      continue: 'Продолжить, понимая риск',
      keep: 'Оставить как есть',
      fill_zero: 'Заполнить нулём',
      impute_median: 'Импутировать медианой',
      impute_mean: 'Импутировать средним',
      exposure: 'Считать экспозицию',
      rows: 'Считать строки',
      unit: 'Обычный A/B',
      switchback: 'Свитчбэк',
      equal: 'Равные доли',
      manual: 'Свои доли',
      declared: 'Как в данных',
      config: 'Как задано в брифе',
      column: 'Выбрана колонка',
      defaults: 'Значения по умолчанию',
      custom: 'Свои значения',
      vs_control: 'Каждая против контроля',
      all_pairs: 'Каждая с каждой',
      omnibus: 'Один тест по всем веткам',
      yes: 'Да, посчитать по сегментам',
      no: 'Нет, только в целом',
      separate: 'По отдельности',
      per_metric: 'По каждой метрике отдельно',
      cross: 'По пересечению',
    },
    titles: {
      group_column: 'Какая колонка делит на ветки эксперимента?',
      srm_design: 'Какой это тип эксперимента?',
      srm_exposure: 'Чем измеряется экспозиция?',
      srm_unit: 'Что здесь единица рандомизации?',
      srm_split: 'Каким должно было быть распределение по группам?',
      srm_segments: 'По каким сегментам проверить SRM?',
      srm_gate: 'Обнаружен SRM — продолжать расчёты?',
      group_comparisons: 'Что с чем сравниваем?',
      null_review: 'Что делать с пропусками?',
      heterogeneity_gate: 'Считать эффект отдельно по сегментам?',
      heterogeneity_fields: 'По каким полям?',
      heterogeneity_mode: 'Пересечение сегментов или по отдельности?',
      alpha_setup: 'Какой уровень значимости использовать?',
      primary_metrics: 'Какие метрики главные?',
      outlier_policy: 'Обрабатывать выбросы одинаково у всех метрик?',
      test_method: 'Каким критерием сравнивать группы?',
      outlier_review: 'Как обработать выбросы?',
      outlier_confirm: 'Согласны с обработкой выбросов?',
      covariate_choice:
        'По каким признакам проверить, что группы одинаковы по составу?',
    },
    rowsAffected: (share, n) => `${share}% строк (${n})`,
    rowsCount: (n) => `${n} строк`,
    totalRows: 'Всего строк',
    keyColumn: ' (ключевая колонка)',
    nullsIn: (n) => `${n} пропусков`,
    byGroup: 'По группам:',
    groupNulls: (group, nNull, nRows, share) => `${group} — ${nNull} из ${nRows} (${share}%)`,
    group: 'Группа',
    uniqueOf: (column) => `Уникальных ${column}`,
    rows: 'Строк',
    share: 'Доля',
    expected: 'Ожидалось',
    deviation: 'Отклонение',
    profileHead: (n, median, mean, max) =>
      `n=${n} · медиана ${median} · среднее ${mean} · max ${max}`,
    profileMoments: (skewness, kurtosis) =>
      `асимметрия ${skewness} · эксцесс ${kurtosis} · выбросов`,
    top1Share: (share) => `На верхний 1% приходится ${share}% суммы метрики.`,
    negativeShare: (share) =>
      `Отрицательных значений ${share}% — логарифмирование неприменимо.`,
    ownQuantiles: 'Свои квантили, %:',
    apply: 'Применить',
    confirmOutliers: 'Согласны с обработкой выбросов?',
    appliedCompare: (method) => `Применён вариант ${method}. Сравните метрику до и после.`,
    yesContinue: 'Да, продолжаем',
    noPickAnother: 'Нет, выбрать другой вариант',
    checkSelected: 'Проверить по выбранным',
    overallSplitOnly: 'Только общий сплит',
    nLevels: (n) => ` · ${n} значений`,
    falsePositives: (fpr, alpha) =>
      `Ложных срабатываний ${fpr}% при заявленных ${alpha}%`,
    interval: 'интервал',
    conservative: ' — критерий осторожен, реальный эффект может не дотянуть',
    skewOutliers: (skew, outliers) => `скос ${skew}, выбросов ${outliers}`,
    zeros: (share) => `, нулей ${share}%`,
    recommended: ' · рекомендуется',
    recommendShort: 'рекомендуем',
    reviewSelected: 'Разобрать выбранные',
    allPrimary: 'Все главные',
    segmentTested: (n) => `${n} значений,`,
    skewIn: (levels) => `перекос в ${levels}`,
    noSkew: 'перекоса нет',
    uniqueValues: (n) => `${n} уникальных`,
    oneRowPerValue: ', по одной строке на значение',
    rowsPerValue: (n) => `, ≈${n} строк на значение`,
    nullShare: (share) => `, пропусков ${share}%`,
    meanValue: (value) => `среднее ${value}`,
    skipBalanceCheck: 'Не проверять состав групп',
    columnNotListed: 'Нужной колонки нет в списке — выберите любую числовую:',
    columnNamePlaceholder: 'имя колонки',
    countByIt: 'Считать по ней',
    splitSumHint: (total) =>
      `Сумма — ${total}. Доли нормируются, поэтому можно вводить и проценты, и «1/1/2».`,
    setPlannedSplit: 'Задать плановый сплит',
    alphaDefaults: (srm, metric) =>
      `Значения по умолчанию (SRM ${srm}, метрики ${metric})`,
    alphaSrm: 'alpha для SRM:',
    alphaMetrics: 'alpha для метрик:',
    applyOwn: 'Применить свои',
    looksLikeControl: ' (похоже на контроль)',
    nullsIntro:
      'В данных есть пропуски. Выбор влияет на состав выборки, поэтому решение за вами.',
    outliersIntro: (column, share) =>
      `В колонке ${column} выбросов ${share}%. Выбор влияет на результат теста, поэтому решение за вами.`,
    alreadyRejected: (methods) => `Уже отклонено: ${methods}.`,
    countSelected: 'Считать по выбранным',
    cancelOverallOnly: 'Отменить — только общий эффект',
    typicalCauses: (causes) => `Типовые причины: ${causes}.`,
  },
  en: {
    aggregates: { mean: 'mean', median: 'median' },
    methodLabels: {
      winsorize: 'Winsorise',
      trim: 'Drop outliers',
      cap: 'Cap at the bounds',
      log_transform: 'Log-transform',
      log_winsorize: 'Log + winsorise',
      none: 'Do nothing',
      drop: 'Drop rows with missing values',
      stop: 'Stop the analysis',
      continue: 'Continue, accepting the risk',
      keep: 'Leave as is',
      fill_zero: 'Fill with zero',
      impute_median: 'Impute with the median',
      impute_mean: 'Impute with the mean',
      exposure: 'Count exposure',
      rows: 'Count rows',
      unit: 'Ordinary A/B',
      switchback: 'Switchback',
      equal: 'Equal shares',
      manual: 'Own shares',
      declared: 'As observed',
      config: 'As stated in the brief',
      column: 'Column chosen',
      defaults: 'Defaults',
      custom: 'Own values',
      vs_control: 'Each against control',
      all_pairs: 'Every arm against every other',
      omnibus: 'One test across all arms',
      yes: 'Yes, compute by segment',
      no: 'No, overall only',
      separate: 'Separately',
      per_metric: 'Separately for each metric',
      cross: 'By intersection',
    },
    titles: {
      group_column: 'Which column splits rows into experiment arms?',
      srm_design: 'What kind of experiment is this?',
      srm_exposure: 'How is exposure measured?',
      srm_unit: 'What is the unit of randomisation here?',
      srm_split: 'What was the intended split across groups?',
      srm_segments: 'Which segments should SRM be checked on?',
      srm_gate: 'SRM detected — continue with the analysis?',
      group_comparisons: 'What is compared with what?',
      null_review: 'What should be done with missing values?',
      heterogeneity_gate: 'Compute the effect separately by segment?',
      heterogeneity_fields: 'By which fields?',
      heterogeneity_mode: 'Intersect the segments, or take them separately?',
      alpha_setup: 'Which significance level should be used?',
      primary_metrics: 'Which metrics are primary?',
      outlier_policy: 'Handle outliers the same way for every metric?',
      test_method: 'Which test should compare the groups?',
      outlier_review: 'How should outliers be handled?',
      outlier_confirm: 'Does this outlier treatment work for you?',
      covariate_choice:
        'Which attributes should be checked for equal composition across groups?',
    },
    rowsAffected: (share, n) => `${share}% of rows (${n})`,
    rowsCount: (n) => `${n} rows`,
    totalRows: 'Rows in total',
    keyColumn: ' (key column)',
    nullsIn: (n) => `${n} missing`,
    byGroup: 'By group:',
    groupNulls: (group, nNull, nRows, share) =>
      `${group} — ${nNull} of ${nRows} (${share}%)`,
    group: 'Group',
    uniqueOf: (column) => `Unique ${column}`,
    rows: 'Rows',
    share: 'Share',
    expected: 'Expected',
    deviation: 'Deviation',
    profileHead: (n, median, mean, max) =>
      `n=${n} · median ${median} · mean ${mean} · max ${max}`,
    profileMoments: (skewness, kurtosis) =>
      `skewness ${skewness} · kurtosis ${kurtosis} · outliers`,
    top1Share: (share) => `The top 1% accounts for ${share}% of the metric's total.`,
    negativeShare: (share) =>
      `Negative values ${share}% — a log transform does not apply.`,
    ownQuantiles: 'Own quantiles, %:',
    apply: 'Apply',
    confirmOutliers: 'Does this outlier treatment work for you?',
    appliedCompare: (method) =>
      `Applied ${method}. Compare the metric before and after.`,
    yesContinue: 'Yes, go ahead',
    noPickAnother: 'No, pick another option',
    checkSelected: 'Check the selected ones',
    overallSplitOnly: 'Overall split only',
    nLevels: (n) => ` · ${n} values`,
    falsePositives: (fpr, alpha) =>
      `False positives ${fpr}% against a stated ${alpha}%`,
    interval: 'interval',
    conservative: ' — the test is conservative, a real effect may fall short',
    skewOutliers: (skew, outliers) => `skew ${skew}, outliers ${outliers}`,
    zeros: (share) => `, zeros ${share}%`,
    recommended: ' · recommended',
    recommendShort: 'recommended',
    reviewSelected: 'Review the selected ones',
    allPrimary: 'All primary',
    segmentTested: (n) => `${n} values,`,
    skewIn: (levels) => `mismatch in ${levels}`,
    noSkew: 'no mismatch',
    uniqueValues: (n) => `${n} unique`,
    oneRowPerValue: ', one row per value',
    rowsPerValue: (n) => `, ≈${n} rows per value`,
    nullShare: (share) => `, missing ${share}%`,
    meanValue: (value) => `mean ${value}`,
    skipBalanceCheck: 'Skip the composition check',
    columnNotListed: 'The column you need is not listed — pick any numeric one:',
    columnNamePlaceholder: 'column name',
    countByIt: 'Count by it',
    splitSumHint: (total) =>
      `The total is ${total}. Shares are normalised, so percentages and “1/1/2” both work.`,
    setPlannedSplit: 'Set the intended split',
    alphaDefaults: (srm, metric) => `Defaults (SRM ${srm}, metrics ${metric})`,
    alphaSrm: 'alpha for SRM:',
    alphaMetrics: 'alpha for metrics:',
    applyOwn: 'Apply my own',
    looksLikeControl: ' (looks like the control)',
    nullsIntro:
      'The data has missing values. The choice changes the composition of the sample, so it is yours to make.',
    outliersIntro: (column, share) =>
      `Column ${column} has ${share}% outliers. The choice affects the result of the test, so it is yours to make.`,
    alreadyRejected: (methods) => `Already turned down: ${methods}.`,
    countSelected: 'Compute the selected ones',
    cancelOverallOnly: 'Cancel — overall effect only',
    typicalCauses: (causes) => `Common causes: ${causes}.`,
  },
};
