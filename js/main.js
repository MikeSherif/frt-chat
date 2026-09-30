import { resolveReply } from './scenario.js';
import { createChatStore } from './store.js';
import { mountChatWidget } from './view.js';

const store = createChatStore({ resolveReply });
mountChatWidget(document.body, store);
