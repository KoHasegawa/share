// game/js/ui.js - Cloud Deck Architect UI

(function () {
  'use strict';

  var state = null;
  var currentRewards = [];
  var AXES = Engine.AXES;
  var AXIS_LABEL = Engine.AXIS_LABEL;
  var TYPE_LABEL = {concept: '基礎', aws: 'AWS', principle: '設計原則', trap: '罠'};

  function show(id) {
    document.querySelectorAll('.screen').forEach(function (el) { el.classList.add('hidden'); });
    document.getElementById(id).classList.remove('hidden');
  }

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(function () { t.classList.add('hidden'); }, 2400);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch];
    });
  }

  function cardHTML(cardId, opts) {
    opts = opts || {};
    var card = Engine.getCard(cardId);
    if (!card) return '';
    var up = state && state.upgrades && state.upgrades[cardId] ? '<span class="upgrade-mark">+' + state.upgrades[cardId] + '</span>' : '';
    var effects = Object.keys(card.effects).map(function (ax) {
      return '<span class="eff eff-' + ax + '">' + AXIS_LABEL[ax] + '+' + card.effects[ax] + '</span>';
    }).join('');
    var penalties = Object.keys(card.penalties || {}).map(function (ax) {
      return '<span class="eff eff-pen">' + AXIS_LABEL[ax] + card.penalties[ax] + '</span>';
    }).join('');
    var tags = card.tags && card.tags.length ? '<div class="card-tags">' + card.tags.slice(0, 3).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '';
    var btn = opts.action ? '<button class="card-btn" data-action="' + opts.action + '" data-id="' + esc(cardId) + '">' + esc(opts.actionLabel || '選択') + '</button>' : '';
    return '<div class="card type-' + card.type + (opts.selected ? ' selected' : '') + '" data-id="' + esc(cardId) + '">' +
      '<div class="card-header"><span class="card-type">' + (TYPE_LABEL[card.type] || '') + '</span>' +
      '<span class="card-name">' + esc(card.name) + '</span>' + up + '</div>' +
      '<div class="card-effects">' + effects + penalties + '</div>' + tags + btn + '</div>';
  }

  function pill(text, cls) {
    return '<span class="' + (cls || 'info-pill') + '">' + esc(text) + '</span>';
  }

  function renderTitle() {
    show('screen-title');
    document.getElementById('btn-start').onclick = renderAscension;
  }

  function renderAscension() {
    show('screen-ascension');
    var list = document.getElementById('asc-list');
    list.innerHTML = GAME_DATA.ascensions.map(function (a) {
      return '<div class="asc-option" data-level="' + a.level + '">' +
        '<div class="asc-label">' + esc(a.name) + '</div>' +
        '<div class="asc-desc">' + esc(a.desc) + '</div></div>';
    }).join('');
    list.querySelectorAll('.asc-option').forEach(function (el) {
      el.onclick = function () {
        state = Engine.newGame(parseInt(el.dataset.level, 10));
        Engine.drawHand(state);
        renderGame();
      };
    });
  }

  function currentCase() {
    return state.caseQueue[state.caseIndex];
  }

  function renderGame() {
    show('screen-game');
    updateStatus();
    renderCase();
    renderHand();
    renderPlayArea();
  }

  function updateStatus() {
    document.getElementById('stat-case').textContent = '案件 ' + (state.caseIndex + 1) + ' / ' + state.caseQueue.length;
    document.getElementById('stat-sp').textContent = 'SP: ' + state.sp;
    document.getElementById('stat-deck').textContent = '山札: ' + state.deck.length;
    document.getElementById('stat-discard').textContent = '捨て場: ' + state.discard.length;
    document.getElementById('stat-asc').textContent = 'A' + state.ascension;
    document.getElementById('stat-tags').textContent = state.knowledgeTags.map(function (ax) { return AXIS_LABEL[ax]; }).join(' / ') || 'なし';
    document.getElementById('stat-ticket').textContent = '模擬: ' + state.mockExamTickets;
    var relicNames = state.relics.map(function (rid) {
      var r = GAME_DATA.relics.filter(function (x) { return x.id === rid; })[0];
      return r ? r.name : rid;
    });
    document.getElementById('stat-relics').textContent = relicNames.join(' / ') || 'なし';
  }

  function renderCase() {
    var c = currentCase();
    var con = Engine.getConstraint(c.constraintId);
    var inc = Engine.getIncident(c.incidentId);
    document.getElementById('case-title').textContent = c.title;
    var desc = c.desc;
    if (state.ascension >= 5) {
      desc = desc.replace('低コストで', '条件に合う形で')
        .replace('監査ログが必要。', '管理上の確認も必要。')
        .replace('レイテンシ問題で', '体験品質の問題で')
        .replace('DB接続情報やAPIキー', '重要な設定値');
    }
    document.getElementById('case-desc').textContent = desc;
    document.getElementById('case-theme').textContent = state.ascension >= 5 ? 'テーマ: 一部条件が曖昧です' : 'テーマ: ' + c.theme;
    var sorted = AXES.filter(function (ax) { return c.weights[ax] > 0; })
      .sort(function (a, b) { return c.weights[b] - c.weights[a]; });
    document.getElementById('case-weights').innerHTML = sorted.map(function (ax, i) {
      var hidden = state.ascension >= 5 && i > 1;
      return '<span class="weight-tag w' + c.weights[ax] + '">' + (hidden ? '???' : AXIS_LABEL[ax] + ' x' + c.weights[ax]) + '</span>';
    }).join('');
    var meta = [];
    if (con) meta.push(pill('制約: ' + con.name + ' - ' + con.desc, 'constraint-pill'));
    if (inc) meta.push(pill('障害: ' + inc.name + ' - ' + inc.desc, 'incident-pill'));
    if (state.scoutText) meta.push(pill(state.scoutText, 'info-pill'));
    if (state.relics.indexOf('wa_lens') >= 0) {
      var weakest = sorted[0];
      meta.push(pill('Lens: 最重要軸は ' + AXIS_LABEL[weakest], 'info-pill'));
    }
    document.getElementById('case-meta').innerHTML = meta.join('');
  }

  function renderHand() {
    var hand = document.getElementById('hand-area');
    hand.innerHTML = state.hand.map(function (id) {
      return cardHTML(id, {action: 'play', actionLabel: '使用'});
    }).join('');
    hand.querySelectorAll('.card-btn').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        if (!Engine.playCard(state, btn.dataset.id)) toast('プレイ上限は4枚です');
        renderHand();
        renderPlayArea();
      };
    });
  }

  function renderPlayArea() {
    var area = document.getElementById('play-area');
    area.innerHTML = state.playedCards.map(function (id) {
      return cardHTML(id, {action: 'undo', actionLabel: '戻す'});
    }).join('');
    area.querySelectorAll('.card-btn').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        Engine.undoCard(state, btn.dataset.id);
        renderHand();
        renderPlayArea();
      };
    });
    document.getElementById('play-count').textContent = state.playedCards.length + ' / 4 枚使用中';
    document.getElementById('score-preview').innerHTML = state.playedCards.length ? renderPreview(Engine.preview(state)) : '';
  }

  function barsHTML(totals) {
    return AXES.map(function (ax) {
      var v = totals[ax] || 0;
      var cls = v >= 70 ? 'hi' : v >= 50 ? 'mid' : 'lo';
      return '<div class="p-bar"><span class="p-label">' + AXIS_LABEL[ax] + '</span>' +
        '<div class="bar-bg"><div class="bar-fill score-' + cls + '" style="width:' + v + '%"></div></div>' +
        '<span class="p-val">' + v + '</span></div>';
    }).join('');
  }

  function renderPreview(result) {
    var weak = result.weakLabels.length ? '<div class="preview-note">弱点候補: ' + esc(result.weakLabels.join(' / ')) + '</div>' : '';
    return '<div class="preview-box"><div class="preview-avg">予想: <b>' + result.avg + '点</b> ' +
      '<span class="rank rank-' + result.rank + '">' + result.rank + '</span></div>' +
      barsHTML(result.totals) + weak + '</div>';
  }

  function onSubmit() {
    if (!state || state.playedCards.length === 0) {
      toast('少なくとも1枚使用してください');
      return;
    }
    renderResult(Engine.evaluate(state));
  }

  function renderResult(result) {
    show('screen-result');
    document.getElementById('res-case').textContent = result.case.title;
    var rank = document.getElementById('res-rank');
    rank.textContent = result.rank;
    rank.className = 'rank-badge rank-' + result.rank;
    document.getElementById('res-avg').textContent = result.avg + ' 点';
    document.getElementById('res-bars').innerHTML = barsHTML(result.totals);
    document.getElementById('res-synergy').textContent = result.synergyBonuses.length ? 'シナジー: ' + result.synergyBonuses.join(' / ') : 'シナジー: なし';
    document.getElementById('res-weak').textContent = result.weakLabels.length ? '弱点: ' + result.weakLabels.join('・') : '全評価軸が良好です';
    document.getElementById('res-sp').textContent = '+' + result.spEarned + ' SP 獲得';
    var explain = [];
    if (result.constraint) explain.push('制約: ' + result.constraint.name);
    if (result.incident) explain.push('障害: ' + result.incident.name);
    if (result.missed.length) explain.push('未使用の推奨要素: ' + result.missed.map(function (id) {
      var c = Engine.getCard(id);
      return c ? c.name : id;
    }).join(' / '));
    Object.keys(result.lossTags).forEach(function (ax) {
      explain.push(AXIS_LABEL[ax] + ': ' + result.lossTags[ax].join('、'));
    });
    document.getElementById('res-detail').innerHTML = explain.map(function (x) { return '<div class="detail-row">' + esc(x) + '</div>'; }).join('');
    document.getElementById('btn-to-reward').onclick = renderReward;
  }

  function renderReward() {
    show('screen-reward');
    currentRewards = Engine.generateRewards(state);
    var list = document.getElementById('reward-list');
    list.innerHTML = currentRewards.map(function (r, i) {
      var extra = '';
      if (r.type === 'add_card') extra = cardHTML(r.card.id);
      if (r.type === 'relic') extra = '<div class="relic-desc">' + esc(r.relic.desc) + '</div>';
      if (r.type === 'knowledge_tag') extra = '<div class="relic-desc">関連軸の評価が毎案件上昇します。</div>';
      if (r.type === 'upgrade') extra = '<div class="relic-desc">対象カードの各プラス効果が強くなります。</div>';
      if (r.type === 'mock_exam') extra = '<div class="relic-desc">セキュリティ重視案件で読解ボーナス。</div>';
      return '<div class="reward-opt" data-i="' + i + '"><div class="reward-label">' + esc(r.label) + '</div>' + extra + '</div>';
    }).join('');
    list.querySelectorAll('.reward-opt').forEach(function (el) {
      el.onclick = function () {
        var r = currentRewards[parseInt(el.dataset.i, 10)];
        if (r.type === 'remove_card') {
          renderRemoveCard(r.candidates, renderMarket);
          return;
        }
        Engine.applyReward(state, r);
        renderMarket();
      };
    });
  }

  function renderRemoveCard(candidates, onDone) {
    show('screen-remove');
    var uniq = candidates.filter(function (v, i, a) { return a.indexOf(v) === i; });
    var area = document.getElementById('remove-list');
    area.innerHTML = uniq.map(function (id) {
      return cardHTML(id, {action: 'remove', actionLabel: '削除'});
    }).join('');
    area.querySelectorAll('.card-btn').forEach(function (btn) {
      btn.onclick = function () {
        Engine.removeCardFromDeck(state, btn.dataset.id);
        toast('カードを削除しました');
        onDone();
      };
    });
    document.getElementById('btn-skip-remove').onclick = onDone;
  }

  function renderMarket() {
    show('screen-market');
    document.getElementById('market-sp').textContent = 'SP: ' + state.sp;
    document.getElementById('market-msg').textContent = '';
    document.getElementById('market-select-area').innerHTML = '';
    var items = Engine.getMarket(state);
    document.getElementById('market-list').innerHTML = items.map(function (item) {
      return '<div class="market-item">' +
        '<div class="market-name">' + esc(item.name) + ' <span class="market-cost">' + (item.cost ? item.cost + ' SP' : '無料') + '</span></div>' +
        '<div class="market-desc">' + esc(item.desc) + '</div>' +
        '<button class="btn-buy" data-id="' + item.id + '"' + (state.sp < item.cost ? ' disabled' : '') + '>' + (item.cost ? '購入' : '利用') + '</button>' +
        '</div>';
    }).join('');
    document.querySelectorAll('.btn-buy').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.dataset.id;
        if (id === 'delete_card' || id === 'upgrade') {
          renderMarketSelectMode(id);
          return;
        }
        var res = Engine.buyMarketItem(state, id);
        toast(res.msg);
        renderMarket();
      };
    });
    document.getElementById('btn-market-next').onclick = advanceCase;
  }

  function renderMarketSelectMode(itemId) {
    var all = state.deck.concat(state.discard, state.hand).filter(function (v, i, a) { return a.indexOf(v) === i; });
    if (itemId === 'upgrade') {
      all = all.filter(function (id) {
        var c = Engine.getCard(id);
        return c && c.type === 'aws';
      });
    }
    var area = document.getElementById('market-select-area');
    if (!all.length) {
      area.innerHTML = '<div class="empty-note">対象カードがありません。</div>';
      return;
    }
    area.innerHTML = '<div class="select-title">対象カードを選択</div>' + all.map(function (id) {
      return cardHTML(id, {action: 'market', actionLabel: itemId === 'upgrade' ? '強化' : '削除'});
    }).join('');
    area.querySelectorAll('.card-btn').forEach(function (btn) {
      btn.onclick = function () {
        var res = Engine.buyMarketItem(state, itemId, btn.dataset.id);
        toast(res.msg);
        renderMarket();
      };
    });
  }

  function advanceCase() {
    if (!Engine.nextCase(state)) {
      renderGameOver();
      return;
    }
    Engine.drawHand(state);
    renderGame();
  }

  function renderGameOver() {
    show('screen-gameover');
    var s = Engine.getRunSummary(state);
    var rank = document.getElementById('go-rank');
    rank.textContent = s.rank;
    rank.className = 'rank-badge rank-' + s.rank;
    document.getElementById('go-avg').textContent = '総合平均: ' + s.avg + ' 点 / 最大失点カテゴリ: ' + s.maxWeak;
    document.getElementById('go-log').innerHTML = s.playLog.map(function (l) {
      return '<div class="go-row"><span>' + esc(l.caseTitle) + '</span><span class="rank rank-' + l.rank + '">' + l.rank + '</span><span>' + l.avg + '点</span></div>';
    }).join('');
    document.getElementById('go-lost').innerHTML = s.lostCases.length
      ? s.lostCases.map(function (l) {
        return '<div class="detail-row">' + esc(l.caseTitle) + ': ' + esc(l.weakLabels.join(' / ') || '要件充足不足') + '</div>';
      }).join('')
      : '<div class="detail-row">大きな失点案件はありません。</div>';
    document.getElementById('go-causes').innerHTML = s.causes.length
      ? s.causes.map(function (t) { return '<span class="review-tag">' + esc(t) + '</span>'; }).join('')
      : '<span class="review-tag">大きな偏りなし</span>';
    document.getElementById('go-review').innerHTML = s.reviewThemes.length
      ? s.reviewThemes.map(function (t) { return '<span class="review-tag">' + esc(t) + '</span>'; }).join('')
      : '<span class="review-tag">総合演習</span>';
    document.getElementById('go-goal').textContent = '次回の改善目標: ' + s.nextGoal;
    document.getElementById('btn-retry').onclick = renderTitle;
  }

  window.addEventListener('DOMContentLoaded', function () {
    document.getElementById('btn-submit').addEventListener('click', onSubmit);
    renderTitle();
  });
})();
