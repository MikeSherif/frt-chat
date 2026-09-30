const REPLY_DELAY_MS = 720;

function snapshot(state) {
  return {
    open: state.open,
    typing: state.typing,
    messages: state.messages.map((message) => ({
      ...message,
      options: message.options?.map((option) => ({ ...option })),
    })),
  };
}

function spendOptions(messages) {
  return messages.map((message) => {
    if (!message.options?.some((option) => !option.spent)) return message;
    return {
      ...message,
      options: message.options.map((option) => ({ ...option, spent: true })),
    };
  });
}

export function createChatStore({ resolveReply, delayMs = REPLY_DELAY_MS }) {
  if (typeof resolveReply !== 'function') {
    throw new Error('createChatStore: resolveReply is required');
  }

  let sequence = 0;
  let replyToken = 0;
  let replyTimer = 0;
  let state = { open: false, typing: false, messages: [] };
  const listeners = new Set();

  function nextId() {
    sequence += 1;
    return `m${sequence}`;
  }

  function emit() {
    const current = snapshot(state);
    listeners.forEach((listener) => listener(current));
  }

  function activeOption(optionId) {
    for (let index = state.messages.length - 1; index >= 0; index -= 1) {
      const message = state.messages[index];
      const option = message.options?.find((item) => item.id === optionId && !item.spent);
      if (option) return option;
    }
    return null;
  }

  function appendBot(reply) {
    state = {
      ...state,
      typing: false,
      messages: [
        ...state.messages,
        {
          id: nextId(),
          role: 'bot',
          text: reply.text,
          options: reply.options.map((option) => ({ ...option, spent: false })),
        },
      ],
    };
    emit();
  }

  function scheduleReply(input) {
    const token = replyToken + 1;
    replyToken = token;
    clearTimeout(replyTimer);
    replyTimer = setTimeout(() => {
      if (token !== replyToken) return;
      appendBot(resolveReply(input));
    }, delayMs);
  }

  function pushUser(text, replyInput) {
    state = {
      ...state,
      typing: true,
      messages: [
        ...spendOptions(state.messages),
        { id: nextId(), role: 'user', text },
      ],
    };
    emit();
    scheduleReply(replyInput);
  }

  function open() {
    if (state.open) return;
    const needsGreeting = state.messages.length === 0 && !state.typing;
    state = { ...state, open: true, typing: needsGreeting || state.typing };
    emit();
    if (needsGreeting) scheduleReply('welcome');
  }

  function close() {
    if (!state.open) return;
    state = { ...state, open: false };
    emit();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot(state));
      return () => listeners.delete(listener);
    },
    open,
    close,
    toggle() {
      if (state.open) close();
      else open();
    },
    send(text) {
      const trimmed = String(text ?? '').trim();
      if (!trimmed || state.typing) return false;
      pushUser(trimmed, trimmed);
      return true;
    },
    choose(optionId) {
      if (state.typing) return false;
      const option = activeOption(optionId);
      if (!option) return false;
      pushUser(option.label, option.id);
      return true;
    },
  };
}
