// Cloud Career Architect round logic and scoring

(function (global) {
  'use strict';

  var DATA = global.V4_DATA;
  var Progression = global.V4_Progression;
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

  function includes(list, value) {
    return list.indexOf(value) >= 0;
  }

  function unique(list) {
    var out = [];
    list.forEach(function (item) {
      if (item && !includes(out, item)) out.push(item);
    });
    return out;
  }

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function getService(id) {
    return findById(DATA.services, id);
  }

  function getChallenge(id) {
    return findById(DATA.challenges, id);
  }

  function getChapter(idOrIndex) {
    if (typeof idOrIndex === 'number') return DATA.chapters[idOrIndex] || null;
    return findById(DATA.chapters, idOrIndex);
  }

  function rank(score) {
    return Progression.rank(score);
  }

  function weightedReviewIds(reviewFlags) {
    return Object.keys(reviewFlags || {}).sort(function (a, b) {
      return reviewFlags[b] - reviewFlags[a];
    }).filter(function (id) {
      return !!getService(id);
    });
  }

  function candidatePool(challenge, saveData) {
    var seeded = unique(challenge.required.concat(challenge.support, challenge.traps));
    var review = weightedReviewIds(saveData.reviewFlags).filter(function (id) {
      return !includes(seeded, id);
    }).slice(0, 4);
    var target = clamp(challenge.candidateCount, 10, 16);
    var filler = shuffle(DATA.services.map(function (s) { return s.id; }).filter(function (id) {
      return !includes(seeded, id) && !includes(review, id);
    }));
    var candidates = seeded.concat(review, filler).slice(0, target);
    return shuffle(candidates);
  }

  function makeRound(challenge, saveData) {
    return {
      challengeId: challenge.id,
      candidates: candidatePool(challenge, saveData)
    };
  }

  function chapterQueue(chapter, saveData) {
    var challenges = chapter.challengeIds.map(getChallenge).filter(Boolean);
    var normal = challenges.filter(function (c) { return !c.boss; });
    var boss = challenges.filter(function (c) { return c.boss; });
    return normal.concat(boss).map(function (challenge) {
      return makeRound(challenge, saveData);
    });
  }

  function startChapter(saveData, chapterIndex) {
    var chapter = getChapter(chapterIndex);
    if (!chapter) return null;
    return {
      chapter: chapter,
      chapterIndex: chapterIndex,
      timeLimit: 34,
      roundIndex: 0,
      queue: chapterQueue(chapter, saveData),
      selected: [],
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

  function timeLimit(challenge) {
    return clamp(42 - challenge.difficulty * 3 + (challenge.maxSelect - 4) * 2, 24, 38);
  }

  function toggleSelect(state, id) {
    var challenge = currentChallenge(state);
    var idx = state.selected.indexOf(id);
    if (idx >= 0) {
      state.selected.splice(idx, 1);
      return {ok: true};
    }
    if (state.selected.length >= challenge.maxSelect) {
      return {ok: false, msg: '選べるのは最大' + challenge.maxSelect + 'つです'};
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

  function matchingRules(rules, selected) {
    return (rules || []).filter(function (rule) {
      return rule.ids.every(function (id) { return includes(selected, id); });
    });
  }

  function axisScores(challenge, selected, synergies, conflicts, antiPatterns, penaltyIds) {
    var weights = DATA.typeWeights[challenge.type] || DATA.typeWeights.design;
    var scores = {};
    AXES.forEach(function (ax) {
      scores[ax] = includes(challenge.focusAxes, ax) ? 36 : 44;
    });

    selected.forEach(function (id) {
      var service = getService(id);
      if (!service) return;
      AXES.forEach(function (ax) {
        var weight = weights[ax] || 1;
        scores[ax] += Math.round((service.axes[ax] || 0) * weight * 0.72);
      });
    });

    synergies.forEach(function (syn) {
      AXES.forEach(function (ax) {
        scores[ax] += syn.axes[ax] || 0;
      });
    });

    challenge.required.forEach(function (id) {
      if (!includes(selected, id)) {
        var service = getService(id);
        if (!service) return;
        AXES.forEach(function (ax) {
          if (service.axes[ax]) scores[ax] -= Math.ceil(Math.abs(service.axes[ax]) * 0.65);
        });
      }
    });

    penaltyIds.forEach(function (id) {
      var hardTrap = includes(challenge.traps, id);
      AXES.forEach(function (ax) {
        if (includes(challenge.focusAxes, ax)) scores[ax] -= hardTrap ? 13 : 6;
      });
    });

    conflicts.concat(antiPatterns).forEach(function (rule) {
      AXES.forEach(function (ax) {
        if (includes(challenge.focusAxes, ax)) scores[ax] -= Math.ceil((rule.penalty || 10) * 0.65);
      });
    });

    AXES.forEach(function (ax) {
      scores[ax] = clamp(scores[ax], 0, 100);
    });
    return scores;
  }

  function evaluate(state, elapsedSeconds) {
    var challenge = currentChallenge(state);
    var selected = state.selected.slice();
    var requiredHits = challenge.required.filter(function (id) { return includes(selected, id); });
    var supportHits = challenge.support.filter(function (id) { return includes(selected, id); });
    var missing = challenge.required.filter(function (id) { return !includes(selected, id); });
    var trapHits = selected.filter(function (id) { return includes(challenge.traps, id); });
    var penaltyIds = selected.filter(function (id) {
      return !includes(challenge.required, id) && !includes(challenge.support, id);
    });
    var synergies = matchingSynergies(selected);
    var conflicts = matchingRules(challenge.conflicts, selected);
    var antiPatterns = matchingRules(challenge.antiPatterns, selected);
    var limit = timeLimit(challenge);
    var timeLeft = Math.max(0, limit - elapsedSeconds);
    var requiredValue = Math.max(12, Math.floor(72 / challenge.required.length));
    var supportValue = challenge.boss ? 6 : 8;
    var score = requiredHits.length * requiredValue +
      supportHits.length * supportValue +
      (missing.length === 0 ? 10 : 0) +
      Math.min(18, synergies.length * 7) +
      Math.min(8, Math.floor(timeLeft / limit * 8)) -
      trapHits.length * 16 -
      (penaltyIds.length - trapHits.length) * 7 -
      conflicts.reduce(function (sum, item) { return sum + (item.penalty || 14); }, 0) -
      antiPatterns.reduce(function (sum, item) { return sum + (item.penalty || 10); }, 0);

    if (selected.length === 0) score -= 28;
    if (selected.length > challenge.maxSelect) score -= 20;
    score = clamp(score, 0, 100);

    var axes = axisScores(challenge, selected, synergies, conflicts, antiPatterns, penaltyIds);
    var result = {
      challenge: challenge,
      selected: selected,
      requiredHits: requiredHits,
      supportHits: supportHits,
      missing: missing,
      trapHits: trapHits,
      penaltyIds: penaltyIds,
      synergies: synergies,
      conflicts: conflicts,
      antiPatterns: antiPatterns,
      axes: axes,
      score: score,
      rank: rank(score),
      timeLeft: timeLeft,
      resourceDelta: null
    };
    state.currentResult = result;
    state.history.push(result);
    return result;
  }

  function retractCurrentResult(state) {
    if (state.currentResult && state.history[state.history.length - 1] === state.currentResult) {
      state.history.pop();
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

  global.V4_Game = {
    startChapter: startChapter,
    currentRound: currentRound,
    currentChallenge: currentChallenge,
    timeLimit: timeLimit,
    toggleSelect: toggleSelect,
    resetSelection: resetSelection,
    evaluate: evaluate,
    retractCurrentResult: retractCurrentResult,
    retryRound: retryRound,
    nextRound: nextRound,
    getService: getService,
    getChallenge: getChallenge,
    getChapter: getChapter,
    rank: rank,
    AXES: AXES,
    AXIS_LABEL: DATA.axisLabel
  };
})(typeof window !== 'undefined' ? window : globalThis);
