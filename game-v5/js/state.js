/* 永続化 / XP / レベル */
(function () {
  const KEY = "aws-cost-dojo:v1";

  const TITLES = [
    "見習い",                  // L1
    "駆け出し請求アナリスト",   // L2
    "コスト探偵",               // L3
    "削減コンサル",             // L4
    "AZ ハンター",              // L5
    "リザーブド軍曹",           // L6
    "タグマスター",             // L7
    "スポット格闘家",           // L8
    "グラビトン使い",           // L9
    "コスト道場師範",           // L10+
  ];

  const THRESH = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200];

  function defaultData() {
    return {
      xp: 0,
      answered: {},      // id -> { correct, attempts, last }
      wrongIds: [],      // unique ids of questions ever answered wrong (and not yet redeemed)
      streakBest: 0,
      lastPlayed: null,
    };
  }

  const State = {};

  State.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultData();
      const obj = JSON.parse(raw);
      return Object.assign(defaultData(), obj);
    } catch (e) {
      return defaultData();
    }
  };

  State.save = function (data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  };

  State.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
  };

  State.levelInfo = function (xp) {
    let level = 1;
    for (let i = 0; i < THRESH.length; i++) {
      if (xp >= THRESH[i]) level = i + 1;
    }
    if (xp >= 5200) {
      level = 10 + Math.floor((xp - 5200) / 1500);
    }
    const title = level >= 10 ? TITLES[9] : TITLES[level - 1];

    let nextAt;
    if (level < 10) nextAt = THRESH[level];
    else nextAt = 5200 + (level - 9) * 1500;
    const prevAt = level <= 10 ? THRESH[Math.max(0, level - 1)] : 5200 + (level - 10) * 1500;
    return { level, title, nextAt, prevAt, progress: nextAt === prevAt ? 1 : (xp - prevAt) / (nextAt - prevAt) };
  };

  // 1 問解いた結果を反映
  // result: { qid, correct, difficulty, streak }
  State.recordAnswer = function (data, result) {
    const rec = data.answered[result.qid] || { correct: false, attempts: 0, last: null };
    rec.attempts += 1;
    rec.last = Date.now();
    let xpGain = 0;
    if (result.correct) {
      // 初回正解 or 復習で正解
      const isNew = !rec.correct;
      rec.correct = true;
      xpGain = (result.difficulty || 1) * 10;
      if (!isNew) xpGain = 5; // 復習正解は控えめ
      // streak ボーナス
      if (result.streak && result.streak > 0 && result.streak % 5 === 0) xpGain += 20;
      // wrongIds から取り除く
      const idx = data.wrongIds.indexOf(result.qid);
      if (idx >= 0) data.wrongIds.splice(idx, 1);
    } else {
      if (data.wrongIds.indexOf(result.qid) < 0) data.wrongIds.push(result.qid);
    }
    data.answered[result.qid] = rec;
    data.xp += xpGain;
    data.lastPlayed = Date.now();
    if (result.streak && result.streak > (data.streakBest || 0)) {
      data.streakBest = result.streak;
    }
    return xpGain;
  };

  // トピックごとの正答率
  State.topicStats = function (data, topicId) {
    if (!window.QUIZ || !window.QUIZ.questions) return { total: 0, correct: 0, attempted: 0, rate: 0 };
    const qs = window.QUIZ.questions.filter((q) => q.topic === topicId);
    let correct = 0;
    let attempted = 0;
    qs.forEach((q) => {
      const r = data.answered[q.id];
      if (r) {
        attempted += 1;
        if (r.correct) correct += 1;
      }
    });
    return {
      total: qs.length,
      correct,
      attempted,
      rate: qs.length ? Math.round((correct / qs.length) * 100) : 0,
    };
  };

  window.State = State;
})();
