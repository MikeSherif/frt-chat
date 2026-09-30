const MENU = [
  { id: 'vote', label: 'Как голосовать' },
  { id: 'terms', label: 'Термины' },
  { id: 'maze', label: 'Лабиринт' },
];

const BACK = { id: 'welcome', label: 'В меню' };
const OTHER_TERM = { id: 'terms', label: 'Другой термин' };

const NODES = {
  welcome: {
    text: 'Привет! Я ФРТОШКА. Помогу разобраться с выборами — коротко и по делу. С чего начнём?',
    options: MENU,
  },
  vote: {
    text: 'Голосовать просто: в день выборов приходишь на свой участок с паспортом, получаешь бюллетень и отмечаешь выбор. Могу рассказать про участок или про сам бланк.',
    options: [
      { id: 'place', label: 'Участок' },
      { id: 'ballot', label: 'Бюллетень' },
      BACK,
    ],
  },
  place: {
    text: 'Участок — это место, где ты голосуешь. Адрес есть в приглашении и на Госуслугах. На входе проверяют паспорт, внутри работают члены комиссии.',
    options: [
      { id: 'ballot', label: 'Бюллетень' },
      BACK,
    ],
  },
  ballot: {
    text: 'Бюллетень — бланк со списком кандидатов или вопросов. Поставь отметку в одном квадрате и опусти лист в урну. Пока бланк ещё у тебя, испорченный можно поменять на новый.',
    options: [
      { id: 'place', label: 'Участок' },
      BACK,
    ],
  },
  terms: {
    text: 'У выборов свой словарь, но смысл у слов простой. Нажми термин — объясню его в двух фразах.',
    options: [
      { id: 'voter', label: 'Избиратель' },
      { id: 'uik', label: 'УИК' },
      { id: 'observer', label: 'Наблюдатель' },
      BACK,
    ],
  },
  voter: {
    text: 'Избиратель — гражданин от 18 лет, у которого есть право голосовать. На выборах президента России оно есть у граждан с этого возраста, если суд его не ограничил.',
    options: [OTHER_TERM, BACK],
  },
  uik: {
    text: 'УИК — участковая избирательная комиссия. Эти люди выдают бюллетени, следят за порядком на участке и считают голоса после закрытия.',
    options: [OTHER_TERM, BACK],
  },
  observer: {
    text: 'Наблюдатель следит, чтобы голосование и подсчёт шли по правилам. Он не агитирует и не подсказывает, за кого голосовать.',
    options: [OTHER_TERM, BACK],
  },
  maze: {
    text: 'Лабиринт к выборам — короткий тренажёр. Я иду по шагам, и на каждом открывается карточка с термином. Так слова с выборов запоминаются спокойнее, чем из длинного текста.',
    options: [
      { id: 'terms', label: 'Термины' },
      { id: 'vote', label: 'Как голосовать' },
    ],
  },
  fallback: {
    text: 'Не уловил. Выбери тему кнопкой или спроси своими словами — например, «что такое УИК».',
    options: MENU,
  },
};

/* Более узкие слова стоят выше, чтобы «избирательный участок» не уехал в термин «избиратель». */
const KEYWORDS = [
  { test: /друг(?:ой|ие)\s+термин/, id: 'terms' },
  { test: /бюллетен/, id: 'ballot' },
  { test: /наблюдател/, id: 'observer' },
  { test: /участок/, id: 'place' },
  { test: /избирател/, id: 'voter' },
  { test: /уик/, id: 'uik' },
  { test: /лабиринт/, id: 'maze' },
  { test: /термин/, id: 'terms' },
  { test: /голос/, id: 'vote' },
  { test: /привет|здравств/, id: 'welcome' },
  { test: /меню|назад/, id: 'welcome' },
];

function present(id) {
  const node = NODES[id];
  return {
    text: node.text,
    options: node.options.map((option) => ({ id: option.id, label: option.label })),
  };
}

export function resolveReply(input) {
  const value = String(input ?? '').trim();
  if (Object.prototype.hasOwnProperty.call(NODES, value) && value !== 'fallback') {
    return present(value);
  }

  const folded = value.toLowerCase();
  const hit = KEYWORDS.find((rule) => rule.test.test(folded));
  return present(hit ? hit.id : 'fallback');
}
