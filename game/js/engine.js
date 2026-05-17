// game/js/engine.js - Cloud Deck Architect game engine

(function (global) {
  'use strict';

  var DATA = global.GAME_DATA;
  var AXES = DATA.axes;
  var AXIS_LABEL = DATA.axisLabel;

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
    return Math.max(min, Math.min(max, Math.round(n || 0)));
  }

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function getCard(id) {
    return findById(DATA.cards, id);
  }

  function hasTag(card, tag) {
    return card && card.tags && card.tags.indexOf(tag) >= 0;
  }

  function calcRank(score) {
    if (score >= 85) return 'S';
    if (score >= 70) return 'A';
    if (score >= 55) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }

  function countCards(all, id) {
    var n = 0;
    all.forEach(function (x) { if (x === id) n += 1; });
    return n;
  }

  function unique(list) {
    return list.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function currentCase(state) {
    return state.caseQueue[state.caseIndex];
  }

  function randomConstraint(state, index) {
    var start = state.ascension >= 5 ? 0 : 1;
    if (index < start && state.ascension < 5) return null;
    var roll = Math.random();
    var chance = state.ascension >= 5 ? 0.85 : state.ascension >= 3 ? 0.7 : 0.55;
    if (roll > chance) return null;
    return shuffle(DATA.constraints)[0].id;
  }

  function randomIncident(state, index) {
    if (index === 0 && state.ascension < 2) return null;
    var chance = 0.25;
    if (state.ascension >= 2) chance += 0.2;
    if (state.ascension >= 3) chance += 0.25;
    if (state.ascension >= 5) chance += 0.1;
    if (Math.random() > chance) return null;
    return shuffle(DATA.incidents)[0].id;
  }

  function makeRunCases(state) {
    var queue = shuffle(DATA.cases).slice();
    queue.forEach(function (c, i) {
      c.constraintId = randomConstraint(state, i);
      c.incidentId = randomIncident(state, i);
    });
    return queue;
  }

  function effectMultiplierForCard(state, card, ax) {
    var m = 1;
    var inc = findById(DATA.incidents, currentCase(state).incidentId);
    if (inc && inc.type === 'halve_axis_effect' && inc.axis === ax) m *= 0.5;
    if (inc && inc.type === 'halve_tag_effect' && hasTag(card, inc.tag)) m *= 0.5;
    if (state.relics.indexOf('iam_seal') >= 0 && ax === 'sec' && (hasTag(card, 'identity') || card.id === 'IAM' || card.id === '最小権限')) m *= 1.3;
    if (state.relics.indexOf('managed_faith') >= 0 && ax === 'ops' && hasTag(card, 'managed')) m *= 1.3;
    return m;
  }

  function addReason(reasons, ax, text) {
    if (!reasons[ax]) reasons[ax] = [];
    if (reasons[ax].indexOf(text) === -1) reasons[ax].push(text);
  }

  function selectedCards(state, selectedIds) {
    return (selectedIds || state.playedCards).map(getCard).filter(Boolean);
  }

  function hasPlayed(state, id, selectedIds) {
    return (selectedIds || state.playedCards).indexOf(id) >= 0;
  }

  function hasPlayedTag(state, tag, selectedIds) {
    var cards = selectedCards(state, selectedIds);
    for (var i = 0; i < cards.length; i++) {
      if (hasTag(cards[i], tag)) return true;
    }
    return false;
  }

  function axisWeakTags(ax, totals, playedIds) {
    var tags = {
      func: ['要件未充足'],
      avail: ['単一障害点', '復旧設計不足'],
      sec: ['権限過大', '暗号化不足', '監査不足', '秘密情報管理ミス'],
      perf: ['レイテンシ対策不足', 'スパイク吸収不足'],
      cost: ['過剰構成', '保存コスト過多'],
      ops: ['監視不足', '手動運用過多']
    };
    var result = tags[ax].slice();
    if (ax === 'sec' && playedIds.indexOf('公開S3') >= 0) result.unshift('公開範囲の誤り');
    if (ax === 'sec' && playedIds.indexOf('長期アクセスキー') >= 0) result.unshift('長期アクセスキーのリスク');
    if (ax === 'ops' && playedIds.indexOf('ログなし運用') >= 0) result.unshift('ログなし運用');
    if (ax === 'avail' && playedIds.indexOf('バックアップ後回し') >= 0) result.unshift('バックアップ不足');
    return unique(result).slice(0, 3);
  }

  function evaluateArchitecture(state, selectedIds, mutate) {
    var c = currentCase(state);
    var totals = {func: 32, avail: 32, sec: 32, perf: 32, cost: 42, ops: 36};
    var details = [];
    var reasons = {};
    var synergyBonuses = [];
    var played = selectedIds || state.playedCards;
    var cards = selectedCards(state, played);
    var incidentUsedBook = false;

    cards.forEach(function (card) {
      AXES.forEach(function (ax) {
        var e = card.effects[ax] || 0;
        var p = card.penalties[ax] || 0;
        if (e) {
          e *= effectMultiplierForCard(state, card, ax);
          if (state.upgrades[card.id]) e += state.upgrades[card.id];
          totals[ax] += e;
        }
        if (p) totals[ax] += p;
      });
    });

    function combo(label, ax, value) {
      totals[ax] += value;
      synergyBonuses.push(label + ': ' + AXIS_LABEL[ax] + '+' + value);
    }

    if (hasPlayed(state, 'DNS', played) && hasPlayed(state, 'Route53', played)) combo('DNS x Route 53', 'perf', 7);
    if (hasPlayed(state, 'キュー', played) && hasPlayed(state, 'SQS', played)) combo('キュー x SQS', 'avail', 7);
    if (hasPlayed(state, '暗号化', played) && hasPlayed(state, 'KMS', played)) combo('暗号化 x KMS', 'sec', 7);
    if (hasPlayed(state, '暗号化', played) && hasPlayed(state, 'ACM', played)) combo('暗号化 x ACM', 'sec', 6);
    if (hasPlayed(state, 'キャッシュ', played) && hasPlayed(state, 'CloudFront', played)) combo('キャッシュ x CloudFront', 'perf', 8);
    if (hasPlayed(state, 'スケール', played) && hasPlayed(state, 'AutoScaling', played)) combo('スケール x Auto Scaling', 'avail', 7);
    if (hasPlayed(state, 'ALB', played) && hasPlayed(state, 'AutoScaling', played)) combo('ALB x Auto Scaling', 'perf', 7);
    if (hasPlayed(state, 'CloudWatch', played) && hasPlayed(state, 'CloudTrail', played)) combo('監視 x 監査', 'ops', 6);
    if (hasPlayed(state, 'S3', played) && hasPlayed(state, 'CloudFront', played)) combo('S3 x CloudFront', 'cost', 5);
    if (state.relics.indexOf('loose_chain') >= 0 && (hasPlayed(state, 'SQS', played) || hasPlayed(state, 'SNS', played) || hasPlayed(state, 'EventBridge', played))) combo('疎結合の鎖', 'avail', 7);

    c.required.forEach(function (id) {
      if (hasPlayed(state, id, played)) {
        totals.func += 5;
        details.push('要件一致: ' + getCard(id).name + ' で機能+5');
      }
    });

    state.knowledgeTags.forEach(function (ax) {
      var bonus = state.relics.indexOf('cloud_wisdom') >= 0 ? 8 : 5;
      totals[ax] += bonus;
      details.push('知識タグ「' + AXIS_LABEL[ax] + '理解」: +' + bonus);
    });

    if (state.mockExamTickets > 0 && c.weights.sec >= 4) {
      totals.sec += 5;
      details.push('模擬問題チケット: セキュリティ読解+5');
    }

    if (state.nextCostReview) {
      totals.cost += 12;
      details.push('コストレビュー: コスト+12');
      if (mutate) state.nextCostReview = false;
    }

    if (state.relics.indexOf('cost_bell') >= 0) totals.cost += 10;
    if (state.relics.indexOf('cache_glass') >= 0) totals.perf += 5;
    if (state.relics.indexOf('audit_pen') >= 0) totals.sec += 10;
    if (state.relics.indexOf('ops_notebook') >= 0) totals.ops += 10;
    if (state.relics.indexOf('startup_soul') >= 0 && c.weights.cost >= 3) totals.cost += 15;

    if (state.ascension >= 1) {
      totals.cost *= 0.9;
      addReason(reasons, 'cost', 'A1: コスト評価が厳しい');
    }
    if (state.ascension >= 2) {
      totals.sec *= 0.92;
      addReason(reasons, 'sec', 'A2: セキュリティ事故が増える');
    }
    if (state.ascension >= 3) {
      totals.avail *= 0.92;
      addReason(reasons, 'avail', 'A3: 障害イベントが増える');
    }

    var con = findById(DATA.constraints, c.constraintId);
    if (con) {
      if (con.multiplier) {
        totals[con.axis] *= con.multiplier;
        addReason(reasons, con.axis, '制約「' + con.name + '」');
      } else if (con.type === 'simple') {
        if (played.indexOf('EC2') >= 0 || played.indexOf('EC2で全部やる') >= 0) {
          totals.ops -= 14;
          addReason(reasons, 'ops', '短納期で手動運用が重い');
        } else {
          totals.ops += 6;
        }
      } else if (con.type === 'compliance') {
        if (!hasPlayed(state, 'CloudTrail', played) && !hasPlayed(state, 'KMS', played) && !hasPlayed(state, '暗号化', played)) {
          totals.sec -= 18;
          addReason(reasons, 'sec', 'コンプライアンスに監査・暗号化が不足');
        }
      } else if (con.type === 'multi_region') {
        totals.cost -= hasPlayed(state, 'Route53', played) || hasPlayed(state, '冗長化', played) ? 6 : 16;
        addReason(reasons, 'cost', 'マルチリージョンでコスト増');
      }
      if (con.min && totals[con.axis] < con.min) {
        totals[con.axis] -= con.penalty;
        addReason(reasons, con.axis, '制約「' + con.name + '」の最低ライン未達');
      }
    }

    var inc = findById(DATA.incidents, c.incidentId);
    if (inc) {
      var incidentScale = 1;
      if (state.relics.indexOf('incident_book') >= 0 && !state.incidentBookUsed) {
        incidentScale = 0.5;
        incidentUsedBook = true;
      }
      if (inc.penalty && inc.axis) {
        totals[inc.axis] -= inc.penalty * incidentScale;
        addReason(reasons, inc.axis, '障害「' + inc.name + '」');
      } else if (inc.type === 'requires_tag' && !hasPlayedTag(state, inc.tag, played)) {
        totals[inc.axis] -= inc.penalty * incidentScale;
        addReason(reasons, inc.axis, '障害「' + inc.name + '」への備え不足');
      } else if (inc.type === 'requires_card' && !hasPlayed(state, inc.card, played)) {
        totals[inc.axis] -= inc.penalty * incidentScale;
        addReason(reasons, inc.axis, '障害「' + inc.name + '」への備え不足');
      } else if (inc.type === 'requires_any') {
        var ok = inc.cards.some(function (id) { return hasPlayed(state, id, played); });
        if (!ok) {
          totals[inc.axis] -= inc.penalty * incidentScale;
          addReason(reasons, inc.axis, '障害「' + inc.name + '」への備え不足');
        }
      }
      if (inc.type === 'halve_axis_effect') addReason(reasons, inc.axis, '障害「' + inc.name + '」で効果低下');
      if (inc.type === 'halve_tag_effect') addReason(reasons, 'func', '障害「' + inc.name + '」でDB系効果低下');
      if (incidentUsedBook && mutate) state.incidentBookUsed = true;
    }

    AXES.forEach(function (ax) { totals[ax] = clamp(totals[ax], 0, 100); });

    var w = c.weights;
    var totalW = AXES.reduce(function (s, ax) { return s + (w[ax] || 0); }, 0);
    var weighted = AXES.reduce(function (s, ax) { return s + totals[ax] * (w[ax] || 0); }, 0);
    var avg = totalW ? Math.round(weighted / totalW) : 0;
    var rank = calcRank(avg);
    var weakAxes = AXES.filter(function (ax) { return totals[ax] < 50; });
    var missed = c.required.filter(function (id) { return played.indexOf(id) === -1; });

    return {
      case: c,
      constraint: con,
      incident: inc,
      totals: totals,
      avg: avg,
      rank: rank,
      weakAxes: weakAxes,
      weakLabels: weakAxes.map(function (ax) { return AXIS_LABEL[ax]; }),
      missed: missed,
      synergyBonuses: synergyBonuses,
      details: details,
      reasons: reasons,
      lossTags: weakAxes.reduce(function (out, ax) {
        out[ax] = axisWeakTags(ax, totals, played);
        return out;
      }, {})
    };
  }

  var Engine = {
    newGame: function (ascension) {
      var state = {
        ascension: ascension || 0,
        sp: 6,
        deck: shuffle(DATA.initialDeck.slice()),
        hand: [],
        discard: [],
        relics: [],
        knowledgeTags: [],
        playedCards: [],
        caseIndex: 0,
        phase: 'select',
        playLog: [],
        totalScore: 0,
        upgrades: {},
        runComplete: false,
        scoutText: '',
        nextCostReview: false,
        mockExamTickets: 0,
        incidentBookUsed: false
      };
      state.caseQueue = makeRunCases(state);
      if (ascension >= 2) {
        state.discard.push('長期アクセスキー');
      }
      if (ascension >= 3) {
        state.discard.push('ログなし運用');
      }
      if (ascension >= 5) {
        state.discard.push('EC2で全部やる');
      }
      return state;
    },

    drawHand: function (state) {
      var need = state.relics.indexOf('arch_glasses') >= 0 ? 7 : 6;
      while (state.hand.length < need) {
        if (state.deck.length === 0) {
          if (state.discard.length === 0) break;
          state.deck = shuffle(state.discard);
          state.discard = [];
        }
        state.hand.push(state.deck.pop());
      }
      state.playedCards = [];
    },

    playCard: function (state, id) {
      if (state.playedCards.length >= 4) return false;
      var idx = state.hand.indexOf(id);
      if (idx < 0) return false;
      state.playedCards.push(state.hand.splice(idx, 1)[0]);
      return true;
    },

    undoCard: function (state, id) {
      var idx = state.playedCards.indexOf(id);
      if (idx < 0) return false;
      state.hand.push(state.playedCards.splice(idx, 1)[0]);
      return true;
    },

    preview: function (state) {
      return evaluateArchitecture(state, state.playedCards, false);
    },

    evaluate: function (state) {
      var result = evaluateArchitecture(state, state.playedCards, true);
      var spMul = {S: 2, A: 1.5, B: 1, C: 0.5, D: 0};
      result.spEarned = Math.round(result.case.sp * (spMul[result.rank] || 0));
      state.sp += result.spEarned;
      state.totalScore += result.avg;
      state.phase = 'result';
      state.discard = state.discard.concat(state.playedCards, state.hand);
      state.hand = [];
      state.playedCards = [];
      state.playLog.push({
        caseTitle: result.case.title,
        theme: result.case.theme,
        constraint: result.constraint ? result.constraint.name : '',
        incident: result.incident ? result.incident.name : '',
        avg: result.avg,
        rank: result.rank,
        scores: result.totals,
        weakAxes: result.weakAxes,
        weakLabels: result.weakLabels,
        reasons: result.reasons,
        lossTags: result.lossTags,
        missed: result.missed.map(function (id) {
          var c = getCard(id);
          return c ? c.name : id;
        })
      });
      return result;
    },

    generateRewards: function (state) {
      var all = state.deck.concat(state.discard, state.hand, state.playedCards);
      var pool = shuffle(DATA.cards.filter(function (c) {
        return c.type !== 'trap' && all.indexOf(c.id) === -1;
      }));
      var options = [];
      if (pool[0]) options.push({type: 'add_card', card: pool[0], label: '新カード獲得: ' + pool[0].name});

      var upgradable = unique(all.filter(function (id) {
        var c = getCard(id);
        return c && c.type === 'aws';
      }));
      if (upgradable.length) {
        var u = shuffle(upgradable)[0];
        options.push({type: 'upgrade', cardId: u, label: 'カード強化: ' + getCard(u).name + ' +4'});
      } else {
        options.push({type: 'sp_bonus', label: 'SP +5 獲得', amount: 5});
      }

      var relicPool = shuffle(DATA.relics.filter(function (r) { return state.relics.indexOf(r.id) < 0; }));
      var tagPool = shuffle(AXES.filter(function (ax) { return state.knowledgeTags.indexOf(ax) < 0; }));
      if (relicPool.length && Math.random() < 0.45) {
        options.push({type: 'relic', relic: relicPool[0], label: 'レリック獲得: ' + relicPool[0].name});
      } else if (tagPool.length) {
        options.push({type: 'knowledge_tag', tag: tagPool[0], label: '知識タグ獲得: ' + AXIS_LABEL[tagPool[0]] + '理解'});
      } else {
        options.push({type: 'mock_exam', label: '模擬問題チケット +1'});
      }

      if (options.length < 3) options.push({type: 'remove_card', label: 'カード削除（デッキ圧縮）', candidates: unique(all)});
      return options.slice(0, 3);
    },

    applyReward: function (state, option) {
      if (option.type === 'add_card') {
        state.deck.push(option.card.id);
        state.deck = shuffle(state.deck);
      } else if (option.type === 'sp_bonus') {
        state.sp += option.amount || 5;
      } else if (option.type === 'relic') {
        state.relics.push(option.relic.id);
      } else if (option.type === 'knowledge_tag') {
        state.knowledgeTags.push(option.tag);
      } else if (option.type === 'upgrade') {
        state.upgrades[option.cardId] = (state.upgrades[option.cardId] || 0) + 4;
      } else if (option.type === 'mock_exam') {
        state.mockExamTickets += 1;
      }
    },

    removeCardFromDeck: function (state, cardId) {
      var zones = [state.discard, state.deck, state.hand];
      for (var i = 0; i < zones.length; i++) {
        var idx = zones[i].indexOf(cardId);
        if (idx >= 0) {
          zones[i].splice(idx, 1);
          return true;
        }
      }
      return false;
    },

    getMarket: function (state) {
      var factor = state && state.ascension >= 4 ? 1.5 : 1;
      return DATA.market.map(function (m) {
        return {
          id: m.id,
          name: m.name,
          desc: m.desc,
          cost: m.cost === 0 ? 0 : Math.ceil(m.cost * factor)
        };
      });
    },

    buyMarketItem: function (state, itemId, extra) {
      var item = findById(Engine.getMarket(state), itemId);
      if (!item) return {ok: false, msg: '存在しない市場商品です'};
      if (state.sp < item.cost) return {ok: false, msg: 'SPが不足しています'};
      var all = state.deck.concat(state.discard, state.hand);

      if (itemId === 'buy_card') {
        var pool = shuffle(DATA.cards.filter(function (c) {
          return c.type === 'aws' && all.indexOf(c.id) < 0;
        }));
        if (!pool.length) return {ok: false, msg: '購入可能なサービスカードがありません'};
        state.deck.push(pool[0].id);
        state.sp -= item.cost;
        return {ok: true, msg: pool[0].name + ' をデッキに追加しました'};
      }
      if (itemId === 'buy_lecture') {
        var tags = shuffle(AXES.filter(function (ax) { return state.knowledgeTags.indexOf(ax) < 0; }));
        if (!tags.length) return {ok: false, msg: '取得可能な知識タグがありません'};
        state.knowledgeTags.push(tags[0]);
        state.sp -= item.cost;
        return {ok: true, msg: '知識タグ「' + AXIS_LABEL[tags[0]] + '理解」を取得しました'};
      }
      if (itemId === 'delete_card') {
        if (!extra) return {ok: false, msg: '削除するカードを選んでください'};
        if (!Engine.removeCardFromDeck(state, extra)) return {ok: false, msg: 'カードが見つかりません'};
        state.sp -= item.cost;
        return {ok: true, msg: 'カードを削除しました'};
      }
      if (itemId === 'upgrade') {
        if (!extra) return {ok: false, msg: '強化するカードを選んでください'};
        var c = getCard(extra);
        if (!c || c.type !== 'aws') return {ok: false, msg: '強化できるのはAWSサービスカードです'};
        state.upgrades[extra] = (state.upgrades[extra] || 0) + 4;
        state.sp -= item.cost;
        return {ok: true, msg: c.name + ' を強化しました（効果+4）'};
      }
      if (itemId === 'scout') {
        var next = state.caseQueue[state.caseIndex + 1];
        if (!next) return {ok: false, msg: '次の案件はありません'};
        var sorted = AXES.slice().sort(function (a, b) { return (next.weights[b] || 0) - (next.weights[a] || 0); });
        state.scoutText = '次の案件「' + next.title + '」は ' + sorted.slice(0, 2).map(function (ax) { return AXIS_LABEL[ax]; }).join('・') + ' が重要です。';
        state.sp -= item.cost;
        return {ok: true, msg: state.scoutText};
      }
      if (itemId === 'mock_exam') {
        state.mockExamTickets += 1;
        state.sp -= item.cost;
        return {ok: true, msg: '模擬問題チケットを1枚獲得しました'};
      }
      if (itemId === 'cost_review') {
        state.nextCostReview = true;
        state.sp -= item.cost;
        return {ok: true, msg: '次回のコスト評価に+12されます'};
      }
      if (itemId === 'wa_review') {
        var last = state.playLog[state.playLog.length - 1];
        if (!last) return {ok: true, msg: 'まだ案件を提出していません'};
        var weak = AXES.filter(function (ax) { return last.scores[ax] < 55; })
          .map(function (ax) { return AXIS_LABEL[ax] + '(' + last.scores[ax] + ')'; });
        return {ok: true, msg: weak.length ? '弱点: ' + weak.join(', ') : '全軸55点以上です'};
      }
      return {ok: false, msg: '未実装の商品です'};
    },

    nextCase: function (state) {
      state.caseIndex += 1;
      state.playedCards = [];
      state.scoutText = '';
      if (state.caseIndex >= state.caseQueue.length) {
        state.runComplete = true;
        state.phase = 'gameover';
        return false;
      }
      state.phase = 'select';
      return true;
    },

    getRunSummary: function (state) {
      var avg = state.playLog.length ? Math.round(state.totalScore / state.playLog.length) : 0;
      var rank = calcRank(avg);
      var weakCounts = {};
      var lostCases = [];
      var causeCounts = {};
      state.playLog.forEach(function (log) {
        if (log.rank === 'C' || log.rank === 'D' || log.weakAxes.length) lostCases.push(log);
        log.weakAxes.forEach(function (ax) {
          weakCounts[ax] = (weakCounts[ax] || 0) + 1;
          (log.lossTags[ax] || []).forEach(function (tag) {
            causeCounts[tag] = (causeCounts[tag] || 0) + 1;
          });
        });
      });
      var topWeak = AXES.slice().sort(function (a, b) {
        return (weakCounts[b] || 0) - (weakCounts[a] || 0);
      }).filter(function (ax) { return weakCounts[ax] > 0; });
      var causes = Object.keys(causeCounts).sort(function (a, b) {
        return causeCounts[b] - causeCounts[a];
      }).slice(0, 5);
      var reviewThemes = topWeak.slice(0, 3).map(function (ax) { return AXIS_LABEL[ax]; });
      var goal = reviewThemes.length ? reviewThemes[0] + 'を補うカードを優先して取得する' : 'Sランク案件を増やす';
      return {
        avg: avg,
        rank: rank,
        maxWeak: topWeak.length ? AXIS_LABEL[topWeak[0]] : 'なし',
        playLog: state.playLog,
        lostCases: lostCases,
        causes: causes,
        reviewThemes: reviewThemes,
        nextGoal: goal
      };
    },

    getCard: getCard,
    getConstraint: function (id) { return findById(DATA.constraints, id); },
    getIncident: function (id) { return findById(DATA.incidents, id); },
    countCards: countCards,
    calcRank: calcRank,
    AXES: AXES,
    AXIS_LABEL: AXIS_LABEL
  };

  global.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
