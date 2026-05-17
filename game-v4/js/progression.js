// Cloud Career Architect progression and save state

(function (global) {
  'use strict';

  var DATA = global.V4_DATA;
  var STORAGE_KEY = 'awsGameV4Save';
  var VERSION = 4;
  var RESOURCE_KEYS = ['reputation', 'budget', 'trust', 'sla'];
  var RESOURCE_LABEL = {
    reputation: '評判',
    budget: '予算',
    trust: '信頼',
    sla: 'SLA'
  };
  var CAREERS = [
    '新人クラウド見習い',
    'ジュニアクラウド設計者',
    'セキュリティ実践者',
    'シニア移行設計者',
    'シニアクラウド設計者',
    'クラウドアーキテクト候補',
    'クラウドアーキテクト'
  ];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function emptySave() {
    return {
      version: VERSION,
      resources: {reputation: 55, budget: 70, trust: 60, sla: 60},
      unlockedChapter: 0,
      currentChapter: 0,
      completedChapters: [],
      reviewFlags: {},
      totals: {rounds: 0, clears: 0, bestRank: 'D', gamesOver: 0},
      lastChapter: null
    };
  }

  function normalize(raw) {
    if (!raw || raw.version !== VERSION || !raw.resources) return emptySave();
    var save = emptySave();
    Object.keys(save).forEach(function (key) {
      if (raw[key] !== undefined) save[key] = raw[key];
    });
    RESOURCE_KEYS.forEach(function (key) {
      save.resources[key] = clamp(Number(save.resources[key] || 0), 0, 100);
    });
    save.unlockedChapter = clamp(Number(save.unlockedChapter || 0), 0, DATA.chapters.length - 1);
    save.currentChapter = clamp(Number(save.currentChapter || 0), 0, DATA.chapters.length - 1);
    save.completedChapters = Array.isArray(save.completedChapters) ? save.completedChapters : [];
    save.reviewFlags = save.reviewFlags && typeof save.reviewFlags === 'object' ? save.reviewFlags : {};
    save.totals = save.totals || {rounds: 0, clears: 0, bestRank: 'D', gamesOver: 0};
    return save;
  }

  function canStore() {
    try {
      global.localStorage.setItem('__v4_test', '1');
      global.localStorage.removeItem('__v4_test');
      return true;
    } catch (e) {
      return false;
    }
  }

  function load() {
    if (!canStore()) return emptySave();
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      return normalize(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return emptySave();
    }
  }

  function save(data) {
    var normalized = normalize(data);
    if (canStore()) {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  }

  function hasSave() {
    if (!canStore()) return false;
    return !!global.localStorage.getItem(STORAGE_KEY);
  }

  function reset() {
    var fresh = emptySave();
    return save(fresh);
  }

  function careerTitle(saveData) {
    var data = normalize(saveData);
    if (isFinalCleared(data)) return CAREERS[CAREERS.length - 1];
    return CAREERS[Math.min(data.unlockedChapter, CAREERS.length - 2)];
  }

  function isFinalCleared(saveData) {
    return saveData.completedChapters.indexOf('final') >= 0;
  }

  function isGameOver(saveData) {
    return RESOURCE_KEYS.some(function (key) {
      return saveData.resources[key] <= 0;
    });
  }

  function chapterStatus(saveData, chapterIndex) {
    var chapter = DATA.chapters[chapterIndex];
    if (!chapter) return 'locked';
    if (saveData.completedChapters.indexOf(chapter.id) >= 0) return 'cleared';
    if (chapterIndex <= saveData.unlockedChapter) return 'open';
    return 'locked';
  }

  function rankValue(rank) {
    return {S: 5, A: 4, B: 3, C: 2, D: 1}[rank] || 0;
  }

  function betterRank(a, b) {
    return rankValue(a) >= rankValue(b) ? a : b;
  }

  function resourceDelta(result) {
    var delta = {reputation: 0, budget: 0, trust: 0, sla: 0};
    var score = result.score;

    if (score >= 90) {
      delta.reputation += 5; delta.budget += 2; delta.trust += 3; delta.sla += 3;
    } else if (score >= 75) {
      delta.reputation += 3; delta.budget += 1; delta.trust += 2; delta.sla += 2;
    } else if (score >= 60) {
      delta.reputation += 1;
    } else if (score >= 40) {
      delta.reputation -= 4; delta.trust -= 2; delta.sla -= 2;
    } else {
      delta.reputation -= 8; delta.budget -= 3; delta.trust -= 4; delta.sla -= 5;
    }

    if (result.challenge.type === 'cost_cut') delta.budget += score >= 70 ? 5 : -7;
    if (result.challenge.type === 'harden') delta.trust += score >= 70 ? 4 : -7;
    if (result.challenge.type === 'incident') delta.sla += score >= 70 ? 5 : -8;
    if (result.challenge.type === 'migrate') {
      delta.budget += score >= 70 ? 1 : -4;
      delta.reputation += score >= 70 ? 1 : -2;
    }

    delta.reputation -= result.trapHits.length * 2;
    delta.budget -= result.trapHits.length * 2;
    delta.trust -= result.missing.length;
    delta.sla -= result.missing.length;
    delta.budget -= result.conflicts.length;
    delta.trust -= result.conflicts.length;

    if (result.challenge.boss && score < 60) {
      RESOURCE_KEYS.forEach(function (key) { delta[key] -= 5; });
    }

    RESOURCE_KEYS.forEach(function (key) {
      delta[key] = clamp(delta[key], -20, 12);
    });
    return delta;
  }

  function applyDelta(saveData, delta) {
    RESOURCE_KEYS.forEach(function (key) {
      saveData.resources[key] = clamp(saveData.resources[key] + (delta[key] || 0), 0, 100);
    });
  }

  function applyReviewFlags(saveData, result) {
    result.missing.forEach(function (id) {
      saveData.reviewFlags[id] = clamp((saveData.reviewFlags[id] || 0) + 2, 0, 9);
    });
    result.requiredHits.forEach(function (id) {
      if (saveData.reviewFlags[id]) {
        saveData.reviewFlags[id] = clamp(saveData.reviewFlags[id] - 1, 0, 9);
        if (saveData.reviewFlags[id] === 0) delete saveData.reviewFlags[id];
      }
    });
  }

  function applyRoundResult(saveData, result) {
    var working = normalize(clone(saveData));
    var delta = resourceDelta(result);
    applyDelta(working, delta);
    applyReviewFlags(working, result);
    working.totals.rounds += 1;
    working.totals.bestRank = betterRank(result.rank, working.totals.bestRank);
    if (isGameOver(working)) working.totals.gamesOver += 1;
    result.resourceDelta = delta;
    return save(working);
  }

  function chapterSummary(runState) {
    var count = runState.history.length;
    var score = runState.history.reduce(function (sum, item) { return sum + item.score; }, 0);
    var avg = count ? Math.round(score / count) : 0;
    var chapter = runState.chapter;
    var weakCounts = {};
    var review = {};
    DATA.axes.forEach(function (ax) { weakCounts[ax] = 0; });
    runState.history.forEach(function (item) {
      DATA.axes.forEach(function (ax) {
        if (item.axes[ax] < 58) weakCounts[ax] += 1;
      });
      item.missing.concat(item.trapHits).forEach(function (id) {
        review[id] = (review[id] || 0) + 1;
      });
    });
    var weakAxes = DATA.axes.slice().sort(function (a, b) {
      return weakCounts[b] - weakCounts[a];
    }).filter(function (ax) { return weakCounts[ax] > 0; });
    var reviewServices = Object.keys(review).sort(function (a, b) {
      return review[b] - review[a];
    }).slice(0, 6);
    return {
      chapter: chapter,
      rounds: count,
      avg: avg,
      rank: rank(avg),
      clear: avg >= chapter.requiredAvg,
      weakAxes: weakAxes,
      reviewServices: reviewServices
    };
  }

  function rank(score) {
    if (score >= 90) return 'S';
    if (score >= 75) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }

  function finishChapter(saveData, runState) {
    var working = normalize(clone(saveData));
    var summary = chapterSummary(runState);
    var idx = DATA.chapters.findIndex(function (c) { return c.id === summary.chapter.id; });
    var clearedBefore = working.completedChapters.indexOf(summary.chapter.id) >= 0;
    summary.gameOver = isGameOver(working);
    summary.clear = summary.clear && !summary.gameOver;
    summary.unlockMessage = '';

    if (summary.clear && !clearedBefore) {
      working.completedChapters.push(summary.chapter.id);
      working.totals.clears += 1;
      applyDelta(working, {reputation: 6, budget: 3, trust: 3, sla: 3});
      if (idx === working.unlockedChapter && idx < DATA.chapters.length - 1) {
        working.unlockedChapter += 1;
        summary.unlockMessage = DATA.chapters[working.unlockedChapter].title + ' が解放されました。';
      } else if (summary.chapter.id === 'final') {
        summary.unlockMessage = 'クラウドアーキテクトへ昇格しました。';
      }
    } else if (!summary.clear && !summary.gameOver) {
      applyDelta(working, {reputation: -3, budget: -2, trust: -2, sla: -2});
      summary.unlockMessage = '章平均が基準未満です。復習して再挑戦してください。';
    }

    working.currentChapter = Math.min(working.unlockedChapter, DATA.chapters.length - 1);
    working.lastChapter = {
      id: summary.chapter.id,
      avg: summary.avg,
      rank: summary.rank,
      clear: summary.clear,
      at: new Date().toISOString()
    };
    summary.resources = clone(working.resources);
    summary.career = careerTitle(working);
    return {saveData: save(working), summary: summary};
  }

  global.V4_Progression = {
    storageKey: STORAGE_KEY,
    resourceKeys: RESOURCE_KEYS,
    resourceLabel: RESOURCE_LABEL,
    load: load,
    save: save,
    hasSave: hasSave,
    reset: reset,
    careerTitle: careerTitle,
    isGameOver: isGameOver,
    chapterStatus: chapterStatus,
    resourceDelta: resourceDelta,
    applyRoundResult: applyRoundResult,
    finishChapter: finishChapter,
    rank: rank
  };
})(typeof window !== 'undefined' ? window : globalThis);
