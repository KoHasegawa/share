import { createScene } from './scene.js';
import { DogController } from './dog.js';
import { ActionQueue } from './actionQueue.js';
import { parseInput } from './parser.js';

const elements = {};

function init() {
  cacheElements();
  setupExamples();
  setupScene();
  setupForm();
  setupClearButton();
  setupLogPanel();
  setupViewportAdjustment();
}

function cacheElements() {
  elements.form = document.getElementById('command-form');
  elements.input = document.getElementById('command-input');
  elements.commandJson = document.getElementById('command-json');
  elements.origins = document.getElementById('command-origins');
  elements.currentAction = document.getElementById('current-action');
  elements.parserMessage = document.getElementById('parser-message');
  elements.queueStatus = document.getElementById('queue-status');
  elements.clearButton = document.getElementById('clear-queue');
  elements.canvas = document.getElementById('scene-canvas');
  elements.barkBubble = document.getElementById('bark-bubble');
  elements.logToggle = document.getElementById('log-toggle');
  elements.logContent = document.getElementById('log-content');
  elements.inputBar = document.getElementById('input-bar');
}

function setupExamples() {
  document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => {
      elements.input.value = button.dataset.example || '';
      elements.input.focus();
    });
  });
}

function setupScene() {
  const sceneContext = createScene(elements.canvas);
  const dog = new DogController(sceneContext, {
    onBark: (visible) => toggleBubble(visible),
  });

  const actionQueue = new ActionQueue(dog, {
    onQueueUpdate: ({ queue, current }) => updateQueueStatus(queue, current),
    onActionUpdate: (label) => updateCurrentAction(label),
  });

  elements.actionQueue = actionQueue;
  elements.dog = dog;
  elements.sceneContext = sceneContext;
  // デバッグ・拡張用フック
  window.__dogApp = { sceneContext, dog, actionQueue };

  function animate() {
    sceneContext.render(dog);
    requestAnimationFrame(animate);
  }
  animate();
}

function setupForm() {
  elements.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = elements.input.value;
    updateParserMessage('解析中...');
    const result = await parseInput(text);
    applyParseResult(result);
  });
}

function setupClearButton() {
  elements.clearButton.addEventListener('click', () => {
    if (elements.actionQueue) {
      elements.actionQueue.clear();
    }
  });
}

function setupLogPanel() {
  const { logToggle, logContent } = elements;
  if (!logToggle || !logContent) {
    return;
  }

  const showLog = () => {
    logContent.classList.remove('is-hidden');
    logContent.style.display = 'block';
    logContent.setAttribute('aria-hidden', 'false');
    logToggle.setAttribute('aria-expanded', 'true');
  };

  const hideLog = () => {
    logContent.classList.add('is-hidden');
    logContent.style.display = 'none';
    logContent.setAttribute('aria-hidden', 'true');
    logToggle.setAttribute('aria-expanded', 'false');
  };

  logToggle.addEventListener('click', () => {
    if (logContent.classList.contains('is-hidden')) {
      showLog();
    } else {
      hideLog();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideLog();
    }
  });

  hideLog();
}

function setupViewportAdjustment() {
  const { inputBar } = elements;
  if (!inputBar) {
    return;
  }

  const applyOffset = () => {
    const viewport = window.visualViewport;
    if (viewport) {
      const bottomOffset = Math.max(window.innerHeight - viewport.height - viewport.offsetTop, 0);
      inputBar.style.setProperty('--keyboard-offset', `${bottomOffset}px`);
      document.documentElement.style.setProperty('--keyboard-offset', `${bottomOffset}px`);
    } else {
      inputBar.style.setProperty('--keyboard-offset', '0px');
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', applyOffset);
    window.visualViewport.addEventListener('scroll', applyOffset);
  }
  window.addEventListener('resize', applyOffset);
  applyOffset();
}

function applyParseResult(result) {
  const { commands, origins, message, fallback, error } = result;
  elements.commandJson.textContent = JSON.stringify(commands, null, 2);
  renderOrigins(origins);
  updateParserMessage(message || '');
  if (fallback && commands.length === 0) {
    updateCurrentAction('もう一度言ってもらえる？');
  }
  if (error) {
    elements.parserMessage.classList.add('error');
  } else {
    elements.parserMessage.classList.remove('error');
  }
  if (elements.actionQueue) {
    elements.actionQueue.replace(commands);
  }
}

function renderOrigins(origins) {
  elements.origins.innerHTML = '';
  if (!origins || origins.length === 0) {
    const li = document.createElement('li');
    li.textContent = '記録なし';
    elements.origins.appendChild(li);
    return;
  }
  origins.forEach((item, index) => {
    const li = document.createElement('li');
    const originLabel = item.origin || 'unknown';
    const commandLabel = item.command || '-';
    li.textContent = `${index + 1}. ${commandLabel} : ${originLabel} ← 「${item.sourceText || '-'}」`;
    elements.origins.appendChild(li);
  });
}

function updateQueueStatus(queue, current) {
  const remaining = queue.length;
  if (remaining === 0 && !current) {
    elements.queueStatus.textContent = '待機中';
  } else {
    elements.queueStatus.textContent = `残り ${remaining} 件`;
  }
}

function updateCurrentAction(text) {
  elements.currentAction.textContent = text || '未実行';
}

function updateParserMessage(text) {
  elements.parserMessage.textContent = text;
}

function toggleBubble(visible) {
  elements.barkBubble.hidden = !visible;
}

init();
