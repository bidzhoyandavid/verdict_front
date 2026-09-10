import type { Lang } from '../lib/lang';

/**
 * Тексты блоков результата: заголовок-вердикт, карточка вывода, доказательная
 * часть и таблица. Один словарь на четыре компонента: они читаются подряд, как
 * один экран, и расхождение формулировок между ними заметнее всего.
 *
 * Склонения вынесены в функции: у английского форма одна, у русского три, и
 * «2 оговорки» против «5 оговорок» — это не мелочь в тексте, по которому
 * принимают решение.
 */

export type ResultsDict = {
  // --- Headline -------------------------------------------------------------
  verdictCodes: Record<string, string>;
  caveats: (n: number) => string;
  higher: string;
  lower: string;
  whatWasComputed: string;
  branch: string;
  againstControlWithDiff: (direction: string) => string;
  againstControl: string;
  onMetric: string;
  onlyThisPair: (others: string) => string;
  howPrecise: string;
  trueEffectIn: string;
  noInterval: string;
  notSignificant: string;
  whatToDo: string;
  caveatsBelow: (n: number) => string;
  blockingChecks: (names: string) => string;

  // --- VerdictCard ----------------------------------------------------------
  conclusion: string;
  byMetric: (metric: string) => string;
  srmBroken: string;
  srmInSegments: (segments: string) => string;
  whatWeakens: string;
  recommendation: string;
  otherOptions: string;
  howComputed: string;
  metricsCount: (n: number) => string;

  // --- EvidencePanel --------------------------------------------------------
  sample: string;
  versus: (control: string, treatment: string) => string;
  compared: (estimand: string, method: string) => string;
  checksWithWarning: (n: number) => string;
  checksFailed: (n: number) => string;
  checksSkipped: (n: number) => string;
  checksPassed: string;
  outOf: (ok: number, total: number) => string;
  failedNames: (names: string) => string;
  correction: (method: string, tests: number) => string;
  significantBeforeAfter: (before: number, after: number) => string;
  lostSignificance: (names: string) => string;
  andMore: (n: number) => string;
  srmOverride: string;
  srmClean: string;
  needMorePower: string;
  observations: string;
  daysLeft: (days: number) => string;
  powerEnough: string;
  whyTrust: string;
  guardrailsDown: string;
  guardrailsOk: (n: number) => string;

  // --- ResultsTable ---------------------------------------------------------
  meanDiffLabel: string;
  effect: string;
  absoluteDelta: string;
  effectHint: string;
  control: string;
  variant: string;
  metric: string;
  significant: string;
  primary: string;
  yes: string;
  no: string;
  correctionNote: (correction: string, scope: string) => string;
  scopeTests: (rows: number, metrics: number, comparisons: number) => string;
  scopeMetrics: (n: number) => string;
  estimandNote: (estimands: string) => string;
};

/** Русские склонения: 1 оговорка, 2 оговорки, 5 оговорок. */
function ruPlural(n: number, one: string, few: string, many: string): string {
  const tail = n % 100;
  if (tail >= 11 && tail <= 14) return many;
  const last = n % 10;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

export const resultsDict: Record<Lang, ResultsDict> = {
  ru: {
    verdictCodes: {
      ship: 'РАСКАТЫВАТЬ',
      rollback: 'ОТКАТЫВАТЬ',
      blocked: 'НЕЛЬЗЯ СУДИТЬ',
      no_data: 'НЕТ ДАННЫХ',
      difference_found: 'РАЗБИРАТЬСЯ',
      inconclusive: 'РЕШЕНИЯ НЕТ',
      hold: 'ДЕРЖАТЬ ТЕСТ',
      no_effect: 'ЭФФЕКТА НЕТ',
    },
    caveats: (n) => ruPlural(n, 'оговорка', 'оговорки', 'оговорок'),
    higher: 'выше',
    lower: 'ниже',
    whatWasComputed: 'ЧТО ПОСЧИТАНО',
    branch: ': ветка ',
    againstControlWithDiff: (direction) => ` ${direction} контроля `,
    againstControl: ' против контроля ',
    onMetric: ' на ',
    onlyThisPair: (others) =>
      `Вердикт — только про эту пару. Остальные ветки (${others}) смотрите в таблице ниже.`,
    howPrecise: 'НАСКОЛЬКО ТОЧНО',
    trueEffectIn: 'Истинный эффект с вероятностью 95% лежит в',
    noInterval: 'Доверительный интервал не посчитан — судить о точности по одной точке нельзя',
    notSignificant: ' · различие статистически не значимо',
    whatToDo: 'ЧТО ДЕЛАТЬ',
    caveatsBelow: (n) => `${n} ${ruPlural(n, 'оговорка', 'оговорки', 'оговорок')} — ниже, в выводе`,
    blockingChecks: (names) => `Не пройдены обязательные проверки: ${names}`,

    conclusion: 'ВЫВОД',
    byMetric: (metric) => `по метрике ${metric}`,
    srmBroken:
      'SRM: разбиение по группам нарушено. Расчёты выполнены по вашему запросу — числа ниже нельзя использовать для решения, пока не найдена причина перекоса.',
    srmInSegments: (segments) =>
      `Общий сплит корректен, но перекос есть внутри срезов: ${segments}. Выводы по этим срезам делать нельзя, пока причина не найдена.`,
    whatWeakens: 'Что ослабляет вывод:',
    recommendation: 'Рекомендация: ',
    otherOptions: 'Остальные варианты:',
    howComputed: 'Как считали:',
    metricsCount: (n) => `${n} ${ruPlural(n, 'метрика', 'метрики', 'метрик')}`,

    sample: 'Объём:',
    versus: (control, treatment) => `— «${control}» против «${treatment}»`,
    compared: (estimand, method) => `Сравнивали ${estimand}, критерий — ${method}`,
    checksWithWarning: (n) => `${n} с предупреждением`,
    checksFailed: (n) => `${n} упало`,
    checksSkipped: (n) => `${n} неприменимо`,
    checksPassed: 'Проверок пройдено',
    outOf: (ok, total) => `${ok} из ${total}`,
    failedNames: (names) => ` — упало: ${names}`,
    correction: (method, tests) =>
      `Поправка ${method} на ${tests} ${ruPlural(tests, 'тест', 'теста', 'тестов')}:`,
    significantBeforeAfter: (before, after) => `значимых было ${before}, осталось ${after}`,
    lostSignificance: (names) => ` — потеряли значимость ${names}`,
    andMore: (n) => ` и ещё ${n}`,
    srmOverride: 'Перекос групп обнаружен — расчёты выполнены поверх него по решению аналитика',
    srmClean: 'Сплит сошёлся с заявленным — группы сравнимы',
    needMorePower: 'Мощности не хватает: нужно ещё',
    observations: 'наблюдений',
    daysLeft: (days) => ` — это ~${days} дн. при текущем темпе`,
    powerEnough: 'Мощности хватило: наблюдённая разница неотличима от нуля',
    whyTrust: 'Почему этому можно верить:',
    guardrailsDown: 'Второстепенные метрики просели:',
    guardrailsOk: (n) => `Второстепенные метрики (${n}) значимо не просели`,

    meanDiffLabel: 'разница средних',
    effect: 'Эффект',
    absoluteDelta: 'Δ абс.',
    effectHint: 'величина эффекта зависит от метрики',
    control: 'контроль',
    variant: 'вариант',
    metric: 'Метрика',
    significant: 'Значимо',
    primary: 'ГЛАВНАЯ',
    yes: 'да',
    no: 'нет',
    correctionNote: (correction, scope) =>
      `p-value скорректированы поправкой ${correction} на ${scope}`,
    scopeTests: (rows, metrics, comparisons) =>
      `${rows} тестов (${metrics} метрик × ${comparisons} сравнений)`,
    scopeMetrics: (n) => `${n} метрик`,
    estimandNote: (estimands) =>
      `Величина эффекта и интервал — ${estimands}, а не разница средних`,
  },
  en: {
    verdictCodes: {
      ship: 'SHIP IT',
      rollback: 'ROLL BACK',
      blocked: 'CANNOT JUDGE',
      no_data: 'NO DATA',
      difference_found: 'INVESTIGATE',
      inconclusive: 'NO DECISION',
      hold: 'KEEP RUNNING',
      no_effect: 'NO EFFECT',
    },
    caveats: (n) => (n === 1 ? 'caveat' : 'caveats'),
    higher: 'above',
    lower: 'below',
    whatWasComputed: 'WHAT WAS COMPUTED',
    branch: ': arm ',
    againstControlWithDiff: (direction) => ` ${direction} control `,
    againstControl: ' against control ',
    onMetric: ' on ',
    onlyThisPair: (others) =>
      `The verdict is about this pair only. The other arms (${others}) are in the table below.`,
    howPrecise: 'HOW PRECISE',
    trueEffectIn: 'With 95% probability the true effect lies in',
    noInterval:
      'No confidence interval was computed — precision cannot be judged from a single point',
    notSignificant: ' · the difference is not statistically significant',
    whatToDo: 'WHAT TO DO',
    caveatsBelow: (n) => `${n} ${n === 1 ? 'caveat' : 'caveats'} — below, in the conclusion`,
    blockingChecks: (names) => `Required checks did not pass: ${names}`,

    conclusion: 'CONCLUSION',
    byMetric: (metric) => `on metric ${metric}`,
    srmBroken:
      'SRM: the split across groups is broken. The analysis ran at your request — the numbers below cannot be used for a decision until the cause of the mismatch is found.',
    srmInSegments: (segments) =>
      `The overall split is sound, but there is a mismatch inside slices: ${segments}. No conclusion can be drawn about those slices until the cause is found.`,
    whatWeakens: 'What weakens the conclusion:',
    recommendation: 'Recommendation: ',
    otherOptions: 'Other options:',
    howComputed: 'How it was computed:',
    metricsCount: (n) => `${n} ${n === 1 ? 'metric' : 'metrics'}`,

    sample: 'Sample:',
    versus: (control, treatment) => `— “${control}” against “${treatment}”`,
    compared: (estimand, method) => `Compared ${estimand}; test used — ${method}`,
    checksWithWarning: (n) => `${n} with a warning`,
    checksFailed: (n) => `${n} failed`,
    checksSkipped: (n) => `${n} not applicable`,
    checksPassed: 'Checks passed',
    outOf: (ok, total) => `${ok} of ${total}`,
    failedNames: (names) => ` — failed: ${names}`,
    correction: (method, tests) =>
      `${method} correction over ${tests} ${tests === 1 ? 'test' : 'tests'}:`,
    significantBeforeAfter: (before, after) =>
      `${before} were significant, ${after} remain`,
    lostSignificance: (names) => ` — lost significance: ${names}`,
    andMore: (n) => ` and ${n} more`,
    srmOverride:
      'A sample ratio mismatch was detected — the analyst chose to compute on top of it',
    srmClean: 'The split matches the intended one — the groups are comparable',
    needMorePower: 'Not enough power: another',
    observations: 'observations are needed',
    daysLeft: (days) => ` — about ${days} days at the current rate`,
    powerEnough: 'Power was sufficient: the observed difference is indistinguishable from zero',
    whyTrust: 'Why this can be trusted:',
    guardrailsDown: 'Guardrail metrics dropped:',
    guardrailsOk: (n) => `Guardrail metrics (${n}) did not drop significantly`,

    meanDiffLabel: 'difference in means',
    effect: 'Effect',
    absoluteDelta: 'Δ abs.',
    effectHint: 'the effect size depends on the metric',
    control: 'control',
    variant: 'variant',
    metric: 'Metric',
    significant: 'Significant',
    primary: 'PRIMARY',
    yes: 'yes',
    no: 'no',
    correctionNote: (correction, scope) =>
      `p-values corrected with ${correction} over ${scope}`,
    scopeTests: (rows, metrics, comparisons) =>
      `${rows} tests (${metrics} metrics × ${comparisons} comparisons)`,
    scopeMetrics: (n) => `${n} metrics`,
    estimandNote: (estimands) =>
      `The effect size and interval are ${estimands}, not a difference in means`,
  },
};
