// Cloud Sprint Architect game logic

(function (global) {
  'use strict';

  var DATA = global.SPRINT_DATA;
  var AXES = DATA.axes;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function find(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function includes(list, value) {
    return list.indexOf(value) >= 0;
  }

  function unique(list) {
    var out = [];
    list.forEach(function (v) {
      if (!includes(out, v)) out.push(v);
    });
    return out;
  }

  function rank(score) {
    if (score >= 90) return 'S';
    if (score >= 75) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }

  function getService(id) {
    return find(DATA.services, id);
  }

  function getChallenge(id) {
    return find(DATA.challenges, id);
  }

  function candidatePool(challenge) {
    var seeded = unique(challenge.required.concat(challenge.support, challenge.traps));
    var pool = shuffle(DATA.services.map(function (s) { return s.id; }).filter(function (id) {
      return !includes(seeded, id);
    }));
    var candidates = seeded.concat(pool).slice(0, 8);
    return shuffle(candidates);
  }

  function makeRound(challenge) {
    return {
      challengeId: challenge.id,
      candidates: candidatePool(challenge)
    };
  }

  function start(mode) {
    var config = mode === 'quick'
      ? {mode: 'quick', rounds: 5, timeLimit: 12}
      : {mode: 'sprint', rounds: 8, timeLimit: 14};
    var queue = shuffle(DATA.challenges).slice(0, config.rounds).map(makeRound);
    return {
      mode: config.mode,
      timeLimit: config.timeLimit,
      roundIndex: 0,
      queue: queue,
      selected: [],
      score: 0,
      streak: 0,
      bestStreak: 0,
      history: [],
      currentResult: null,
      completed: false
    };
  }

  function currentRound(state) {
    return state.queue[state.roundIndex] || null;
  }

  function currentChallenge(state) {
    var round = currentRound(state);
    return round ? getChallenge(round.challengeId) : null;
  }

  function toggleSelect(state, id) {
    var idx = state.selected.indexOf(id);
    if (idx >= 0) {
      state.selected.splice(idx, 1);
      return {ok: true};
    }
    if (state.selected.length >= 3) {
      return {ok: false, msg: '選べるのは最大3つです'};
    }
    state.selected.push(id);
    return {ok: true};
  }

  function resetSelection(state) {
    state.selected = [];
  }

  function matchingSynergies(selected) {
    return DATA.synergies.filter(function (syn) {
      return syn.ids.every(function (id) { return includes(selected, id); });
    });
  }

  function axisScores(challenge, selected, synergies, penaltyIds) {
    var scores = {};
    AXES.forEach(function (ax) { scores[ax] = includes(challenge.focusAxes, ax) ? 28 : 34; });

    selected.forEach(function (id) {
      var s = getService(id);
      if (!s) return;
      AXES.forEach(function (ax) {
        scores[ax] += s.axes[ax] || 0;
      });
    });

    synergies.forEach(function (syn) {
      AXES.forEach(function (ax) {
        scores[ax] += syn.axes[ax] || 0;
      });
    });

    penaltyIds.forEach(function (id) {
      var s = getService(id);
      if (!s) return;
      AXES.forEach(function (ax) {
        if (includes(challenge.focusAxes, ax)) scores[ax] -= includes(challenge.traps, id) ? 14 : 7;
      });
    });

    challenge.required.forEach(function (id) {
      if (!includes(selected, id)) {
        var s = getService(id);
        if (!s) return;
        AXES.forEach(function (ax) {
          if (s.axes[ax]) scores[ax] -= Math.ceil(s.axes[ax] * 0.7);
        });
      }
    });

    AXES.forEach(function (ax) { scores[ax] = clamp(scores[ax], 0, 100); });
    return scores;
  }

  function evaluate(state, elapsedSeconds) {
    var challenge = currentChallenge(state);
    var selected = state.selected.slice();
    var requiredHits = challenge.required.filter(function (id) { return includes(selected, id); });
    var supportHits = challenge.support.filter(function (id) { return includes(selected, id); });
    var missing = challenge.required.filter(function (id) { return !includes(selected, id); });
    var penaltyIds = selected.filter(function (id) {
      return !includes(challenge.required, id) && !includes(challenge.support, id);
    });
    var trapHits = selected.filter(function (id) { return includes(challenge.traps, id); });
    var synergies = matchingSynergies(selected);
    var timeLeft = Math.max(0, state.timeLimit - elapsedSeconds);
    var synergyScore = synergies.length * 8;
    var penaltyScore = penaltyIds.reduce(function (sum, id) {
      return sum + (includes(challenge.traps, id) ? 18 : 8);
    }, 0);
    var score = requiredHits.length * 24 +
      supportHits.length * 12 +
      (missing.length === 0 ? 12 : 0) +
      synergyScore +
      Math.floor(timeLeft * 2) -
      penaltyScore;

    if (selected.length === 0) score -= 25;
    score = clamp(score, 0, 100);

    var axes = axisScores(challenge, selected, synergies, penaltyIds);
    var result = {
      challenge: challenge,
      selected: selected,
      requiredHits: requiredHits,
      supportHits: supportHits,
      missing: missing,
      penaltyIds: penaltyIds,
      trapHits: trapHits,
      synergies: synergies,
      axes: axes,
      score: score,
      rank: rank(score),
      timeLeft: timeLeft
    };

    state.currentResult = result;
    state.history.push(result);
    state.score += score;
    if (score >= 75) {
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
    } else {
      state.streak = 0;
    }
    return result;
  }

  function rebuildStats(state) {
    state.score = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.history.forEach(function (r) {
      state.score += r.score;
      if (r.score >= 75) {
        state.streak += 1;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
      } else {
        state.streak = 0;
      }
    });
  }

  function retractCurrentResult(state) {
    if (state.currentResult && state.history[state.history.length - 1] === state.currentResult) {
      state.history.pop();
      rebuildStats(state);
    }
    state.currentResult = null;
  }

  function retryRound(state) {
    state.selected = [];
    state.currentResult = null;
  }

  function nextRound(state) {
    state.roundIndex += 1;
    state.selected = [];
    state.currentResult = null;
    if (state.roundIndex >= state.queue.length) {
      state.completed = true;
      return false;
    }
    return true;
  }

  function summary(state) {
    var count = state.history.length;
    var avg = count ? Math.round(state.score / count) : 0;
    var weakCounts = {};
    var reviewServices = {};
    AXES.forEach(function (ax) { weakCounts[ax] = 0; });

    state.history.forEach(function (r) {
      AXES.forEach(function (ax) {
        if (r.axes[ax] < 55) weakCounts[ax] += 1;
      });
      r.missing.concat(r.trapHits).forEach(function (id) {
        reviewServices[id] = (reviewServices[id] || 0) + 1;
      });
    });

    var weakAxes = AXES.slice().sort(function (a, b) {
      return weakCounts[b] - weakCounts[a];
    }).filter(function (ax) { return weakCounts[ax] > 0; });

    var services = Object.keys(reviewServices).sort(function (a, b) {
      return reviewServices[b] - reviewServices[a];
    }).slice(0, 5);

    return {
      avg: avg,
      rank: rank(avg),
      clear: avg >= 75,
      bestStreak: state.bestStreak,
      rounds: count,
      weakAxes: weakAxes,
      reviewServices: services
    };
  }

  global.SprintGame = {
    start: start,
    currentRound: currentRound,
    currentChallenge: currentChallenge,
    toggleSelect: toggleSelect,
    resetSelection: resetSelection,
    evaluate: evaluate,
    retractCurrentResult: retractCurrentResult,
    retryRound: retryRound,
    nextRound: nextRound,
    summary: summary,
    getService: getService,
    getChallenge: getChallenge,
    rank: rank,
    AXES: AXES,
    AXIS_LABEL: DATA.axisLabel
  };
})(typeof window !== 'undefined' ? window : globalThis);
