const MASCOT_URL = new URL('../assets/img/frtoshka.png', import.meta.url).href;
const SVG_NS = 'http://www.w3.org/2000/svg';

function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.8');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  if (name === 'chat') {
    path.setAttribute('d', 'M6 16.5 4.2 19c-.3.4-1 .2-1-.3V7.2A2.2 2.2 0 0 1 5.4 5h13.2A2.2 2.2 0 0 1 20.8 7.2v7.1a2.2 2.2 0 0 1-2.2 2.2H6Z');
  } else if (name === 'send') {
    path.setAttribute('d', 'M5 12h14M13 6l6 6-6 6');
  } else {
    path.setAttribute('d', 'M6 6l12 12M18 6 6 18');
  }

  svg.append(path);
  return svg;
}

const MASCOT_MOVE_MS = 15000;
const MASCOT_MOVES = ['hop', 'flip'];
let mascotMoveCursor = 0;

function renderBubble(message) {
  if (message.role !== 'bot') {
    const bubble = document.createElement('p');
    bubble.className = 'frt-chat__bubble';
    bubble.textContent = message.text;
    return bubble;
  }

  const bubble = document.createElement('div');
  bubble.className = 'frt-chat__bubble';

  const text = document.createElement('p');
  text.className = 'frt-chat__text';

  const actor = document.createElement('img');
  actor.className = 'frt-chat__bubble-actor';
  actor.src = MASCOT_URL;
  actor.alt = '';
  actor.draggable = false;
  actor.setAttribute('aria-hidden', 'true');

  text.append(actor, document.createTextNode(message.text));
  bubble.append(text);
  return bubble;
}

function renderMessage(message) {
  const row = document.createElement('div');
  row.className = `frt-chat__row frt-chat__row--${message.role}`;
  row.dataset.id = message.id;
  row.append(renderBubble(message));

  if (!message.options?.length) return row;

  const group = document.createElement('div');
  group.className = 'frt-chat__options';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Варианты ответа');

  message.options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'frt-chat__option';
    button.dataset.option = option.id;
    button.textContent = option.label;
    button.disabled = Boolean(option.spent);
    group.append(button);
  });

  row.append(group);
  return row;
}

function renderTyping() {
  const row = document.createElement('div');
  row.className = 'frt-chat__typing';
  row.dataset.typing = 'true';
  row.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 3; index += 1) {
    row.append(document.createElement('span'));
  }
  return row;
}

function syncOptions(row, message) {
  row.querySelectorAll('[data-option]').forEach((button) => {
    const option = message.options?.find((item) => item.id === button.dataset.option);
    if (option) button.disabled = Boolean(option.spent);
  });
}

function syncLog(log, state) {
  const seen = new Set();

  state.messages.forEach((message) => {
    seen.add(message.id);
    const row = [...log.children].find((node) => node.dataset.id === message.id);
    if (!row) log.append(renderMessage(message));
    else syncOptions(row, message);
  });

  [...log.children].forEach((node) => {
    if (node.dataset.id && !seen.has(node.dataset.id)) node.remove();
  });

  const typing = [...log.children].find((node) => node.dataset.typing);
  if (state.typing) {
    if (!typing) log.append(renderTyping());
    else if (log.lastElementChild !== typing) log.append(typing);
  } else if (typing) {
    typing.remove();
  }

  const last = state.messages.at(-1);
  const hostId = last?.role === 'bot' ? last.id : null;
  log.querySelectorAll('.frt-chat__row--bot').forEach((row) => {
    const isHost = row.dataset.id === hostId;
    if (!isHost) {
      row.classList.remove('frt-chat__row--host');
      return;
    }
    if (!row.classList.contains('frt-chat__row--host')) {
      requestAnimationFrame(() => row.classList.add('frt-chat__row--host'));
    }
  });

  log.scrollTop = log.scrollHeight;
  return hostId;
}

function buildShell() {
  const root = document.createElement('div');
  root.className = 'frt-chat';
  root.dataset.open = 'false';

  const panel = document.createElement('section');
  panel.className = 'frt-chat__panel';
  panel.id = 'frt-chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'frt-chat-title');
  panel.setAttribute('aria-hidden', 'true');
  panel.inert = true;

  const header = document.createElement('header');
  header.className = 'frt-chat__header';

  const avatar = document.createElement('img');
  avatar.className = 'frt-chat__avatar';
  avatar.src = MASCOT_URL;
  avatar.alt = '';
  avatar.width = 40;
  avatar.height = 40;

  const heading = document.createElement('div');
  heading.className = 'frt-chat__heading';

  const name = document.createElement('h2');
  name.className = 'frt-chat__name';
  name.id = 'frt-chat-title';
  name.textContent = 'ФРТОШКА';

  const status = document.createElement('p');
  status.className = 'frt-chat__status';
  status.textContent = 'Помощник по ВКП';

  heading.append(name, status);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'frt-chat__close';
  close.setAttribute('aria-label', 'Закрыть чат');
  close.append(icon('close'));

  header.append(avatar, heading, close);

  const body = document.createElement('div');
  body.className = 'frt-chat__body';

  const mascot = document.createElement('img');
  mascot.className = 'frt-chat__mascot';
  mascot.src = MASCOT_URL;
  mascot.alt = '';
  mascot.setAttribute('aria-hidden', 'true');

  const log = document.createElement('div');
  log.className = 'frt-chat__log';
  log.id = 'frt-chat-log';
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  log.setAttribute('aria-relevant', 'additions');

  body.append(mascot, log);

  const form = document.createElement('form');
  form.className = 'frt-chat__form';

  const input = document.createElement('textarea');
  input.className = 'frt-chat__input';
  input.rows = 1;
  input.maxLength = 500;
  input.placeholder = 'Написать ФРТОШКЕ';
  input.setAttribute('aria-label', 'Сообщение');

  const send = document.createElement('button');
  send.type = 'submit';
  send.className = 'frt-chat__send';
  send.disabled = true;
  send.setAttribute('aria-label', 'Отправить');
  send.append(icon('send'));

  form.append(input, send);

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'frt-chat__launcher';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'frt-chat-panel');
  launcher.setAttribute('aria-label', 'Открыть чат');

  const ring = document.createElement('span');
  ring.className = 'frt-chat__ring';
  ring.setAttribute('aria-hidden', 'true');

  const core = document.createElement('span');
  core.className = 'frt-chat__core';
  core.append(icon('chat'));

  launcher.append(ring, core);
  panel.append(header, body, form);
  root.append(panel, launcher);

  return { root, panel, log, form, input, send, launcher, close };
}

function fitInput(input) {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
}

function playMascotMove(log) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const actor = log.querySelector('.frt-chat__row--host .frt-chat__bubble-actor');
  if (!actor) return;

  const move = MASCOT_MOVES[mascotMoveCursor % MASCOT_MOVES.length];
  mascotMoveCursor += 1;
  actor.classList.remove('frt-chat__bubble-actor--hop', 'frt-chat__bubble-actor--flip');
  void actor.offsetWidth;
  actor.classList.add(move === 'hop' ? 'frt-chat__bubble-actor--hop' : 'frt-chat__bubble-actor--flip');
}

export function mountChatWidget(parent, store) {
  const ui = buildShell();
  let wasOpen = false;
  let typing = false;
  let hostId = null;
  let moveTimer = 0;

  function syncMotion(state, nextHost) {
    const hostChanged = nextHost !== hostId;
    hostId = nextHost;
    if (!state.open || !hostId) {
      clearInterval(moveTimer);
      moveTimer = 0;
      return;
    }
    if (hostChanged || !moveTimer) {
      clearInterval(moveTimer);
      moveTimer = setInterval(() => playMascotMove(ui.log), MASCOT_MOVE_MS);
    }
  }

  function refreshSend() {
    ui.send.disabled = typing || !ui.input.value.trim();
  }

  store.subscribe((state) => {
    typing = state.typing;
    ui.root.dataset.open = state.open ? 'true' : 'false';
    ui.panel.inert = !state.open;
    ui.panel.setAttribute('aria-hidden', state.open ? 'false' : 'true');
    ui.launcher.setAttribute('aria-expanded', state.open ? 'true' : 'false');
    ui.launcher.setAttribute('aria-label', state.open ? 'Закрыть чат' : 'Открыть чат');
    syncMotion(state, syncLog(ui.log, state));
    refreshSend();

    if (state.open && !wasOpen) {
      requestAnimationFrame(() => ui.input.focus());
    }
    if (!state.open && wasOpen) ui.launcher.focus();
    wasOpen = state.open;
  });

  ui.launcher.addEventListener('click', () => store.toggle());
  ui.close.addEventListener('click', () => store.close());

  ui.log.addEventListener('animationend', (event) => {
    if (!(event.target instanceof Element)) return;
    event.target.classList.remove('frt-chat__bubble-actor--hop', 'frt-chat__bubble-actor--flip');
  });

  ui.log.addEventListener('click', (event) => {
    const button = event.target.closest('[data-option]');
    if (!button || button.disabled) return;
    store.choose(button.dataset.option);
  });

  ui.form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!store.send(ui.input.value)) return;
    ui.input.value = '';
    fitInput(ui.input);
    refreshSend();
  });

  ui.input.addEventListener('input', () => {
    fitInput(ui.input);
    refreshSend();
  });

  ui.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      ui.form.requestSubmit();
    }
  });

  ui.root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') store.close();
  });

  parent.append(ui.root);
  return ui.root;
}
