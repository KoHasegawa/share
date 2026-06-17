const EXACT_RULES = [
  {
    patterns: ['座って', 'おすわり', 'おすわりして', '座ってください'],
    commands: [makeAnimation('sit')],
  },
  {
    patterns: ['吠えて', 'ほえて', '吠えてください'],
    commands: [makeSimple('bark')],
  },
  {
    patterns: ['伏せて', '伏せ', 'ふせ', 'ふせて'],
    commands: [makeAnimation('lie_down')],
  },
  {
    patterns: ['待て', 'まて'],
    commands: [makeWait(2)],
  },
  {
    patterns: ['こっちに来て', 'おいで', 'こっちにきて', 'こっちきて'],
    commands: [makeSimple('return_to_user')],
  },
  {
    patterns: ['しっぽを振って', 'しっぽ振って', '尻尾を振って'],
    commands: [makeSimple('wag_tail')],
  },
  {
    patterns: ['ジャンプして', 'ジャンプ', '跳んで'],
    commands: [makeAnimation('jump')],
  },
];

const KEYWORD_RULES = [
  {
    test: (text) => text.includes('ボール') && /走/.test(text),
    commands: [makeMove('ball', 'run')],
    label: 'ボール+走',
  },
  {
    test: (text) => text.includes('ボール'),
    commands: [makeMove('ball', 'walk')],
    label: 'ボール',
  },
  {
    test: (text) => text.includes('ベッド') && /歩/.test(text),
    commands: [makeMove('bed', 'walk')],
    label: 'ベッド+歩',
  },
  {
    test: (text) => /(餌|エサ|ごはん|ご飯)/.test(text),
    commands: [makeMove('bowl', 'walk')],
    label: '餌',
  },
  {
    test: (text) => /(嗅|匂|におい)/.test(text),
    commands: [makeAnimation('sniff')],
    label: '嗅ぐ',
  },
  {
    test: (text) => /(しっぽ|尻尾)/.test(text) && /(振|ふ)/.test(text),
    commands: [makeSimple('wag_tail')],
    label: '尻尾',
  },
  {
    test: (text) => /ジャンプ/.test(text),
    commands: [makeAnimation('jump')],
    label: 'ジャンプ',
  },
];

const CACHE_PREFIX = 'dog-command-cache:';

export async function parseInput(rawText) {
  const text = (rawText || '').trim();
  if (!text) {
    return {
      commands: [],
      origins: [],
      message: '入力が空でした。',
      fallback: true,
    };
  }

  const normalized = normalize(text);
  const segments = splitSegments(normalized);
  const commands = [];
  const origins = [];

  for (const segment of segments) {
    if (!segment) continue;
    const exact = matchExact(segment);
    if (exact) {
      pushCommands(commands, origins, exact.commands, 'rule', segment);
      continue;
    }
    const keyword = matchKeyword(segment);
    if (keyword) {
      pushCommands(commands, origins, keyword.commands, `keyword:${keyword.label}`, segment);
    }
  }

  if (commands.length > 0) {
    const sanitized = commands.map(sanitizeCommand);
    setCache(normalized, sanitized, origins);
    return {
      commands: sanitized,
      origins,
      message: 'ルールで解決しました。',
      source: 'rule',
      fallback: false,
    };
  }

  const cached = getCache(normalized);
  if (cached) {
    return {
      commands: cached.commands,
      origins: cached.origins.map((o) => ({ ...o, origin: 'cache' })),
      message: 'キャッシュから取得しました。',
      source: 'cache',
      fallback: false,
    };
  }

  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    const rawCommands = Array.isArray(data.commands) ? data.commands : [];
    const sanitized = rawCommands.map(sanitizeCommand);
    const llmOrigins = sanitized.map((cmd, index) => ({
      origin: data.source || (data.fallback ? 'llm-fallback' : 'llm'),
      sourceText: segments[index] || text,
      command: cmd.type,
    }));

    if (!data.fallback && sanitized.length > 0) {
      setCache(normalized, sanitized, llmOrigins);
    }

    return {
      commands: sanitized,
      origins: llmOrigins,
      message: data.error ? `LLM応答: ${data.error}` : 'LLMで解決しました。',
      source: data.source || 'llm',
      fallback: Boolean(data.fallback),
      error: data.error,
    };
  } catch (error) {
    return {
      commands: [],
      origins: [],
      message: `通信エラー: ${error.message}`,
      fallback: true,
      error: error.message,
    };
  }
}

function matchExact(segment) {
  return EXACT_RULES.find((rule) => rule.patterns.some((pattern) => segment === pattern));
}

function matchKeyword(segment) {
  return KEYWORD_RULES.find((rule) => rule.test(segment));
}

function pushCommands(commands, origins, newCommands, origin, text) {
  newCommands.forEach((command) => {
    const sanitized = sanitizeCommand(command);
    commands.push(sanitized);
    origins.push({ origin, sourceText: text, command: sanitized.type });
  });
}

function normalize(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/[　]/g, ' ')
    .trim();
}

function splitSegments(text) {
  return text
    .split(/[、，,。\.！!？?]/)
    .map((segment) => segment.trim())
    .flatMap((segment) => {
      if (!segment) return [];
      if (segment.endsWith('して')) {
        return [segment.slice(0, -2), ''];
      }
      return [segment];
    })
    .map((segment) => segment.replace(/してください$|してね$|してよ$/g, ''))
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function sanitizeCommand(command) {
  const allowedTypes = new Set([
    'move_to',
    'play_animation',
    'look_at',
    'wait',
    'bark',
    'wag_tail',
    'return_to_user',
  ]);
  const sanitized = {
    type: command.type || 'look_at',
    target: command.target ?? null,
    name: command.name ?? null,
    speed: command.speed ?? null,
    duration: typeof command.duration === 'number' ? command.duration : null,
  };

  if (!allowedTypes.has(sanitized.type)) {
    sanitized.type = 'look_at';
    sanitized.target = sanitized.target || 'user';
  }

  if (sanitized.type === 'move_to') {
    const validTargets = new Set(['ball', 'bed', 'bowl', 'user']);
    const validSpeeds = new Set(['walk', 'run']);
    sanitized.target = validTargets.has(sanitized.target) ? sanitized.target : 'user';
    sanitized.speed = validSpeeds.has(sanitized.speed) ? sanitized.speed : 'walk';
  }

  if (sanitized.type === 'play_animation') {
    const validNames = new Set([
      'idle',
      'walk',
      'run',
      'sit',
      'lie_down',
      'bark',
      'wag_tail',
      'sniff',
      'jump',
    ]);
    sanitized.name = validNames.has(sanitized.name) ? sanitized.name : 'idle';
  }

  if (sanitized.type === 'wait') {
    sanitized.duration = typeof sanitized.duration === 'number' && sanitized.duration > 0 ? sanitized.duration : 1;
  }

  return sanitized;
}

function makeAnimation(name) {
  return { type: 'play_animation', name, target: null, speed: null, duration: null };
}

function makeMove(target, speed = 'walk') {
  return { type: 'move_to', target, speed, name: null, duration: null };
}

function makeWait(duration) {
  return { type: 'wait', duration, target: null, speed: null, name: null };
}

function makeSimple(type) {
  return { type, target: null, speed: null, name: null, duration: null };
}

function getCacheKey(text) {
  return `${CACHE_PREFIX}${text}`;
}

function setCache(text, commands, origins) {
  try {
    const key = getCacheKey(text);
    const payload = JSON.stringify({ commands, origins, savedAt: Date.now() });
    window.localStorage.setItem(key, payload);
  } catch (error) {
    console.warn('キャッシュ保存に失敗しました', error);
  }
}

function getCache(text) {
  try {
    const key = getCacheKey(text);
    const payload = window.localStorage.getItem(key);
    if (!payload) return null;
    return JSON.parse(payload);
  } catch (error) {
    console.warn('キャッシュ読込に失敗しました', error);
    return null;
  }
}
