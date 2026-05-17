// Cloud Career Architect UI

(function () {
  'use strict';

  var DATA = window.V4_DATA;
  var Game = window.V4_Game;
  var Progression = window.V4_Progression;
  var saveData = null;
  var runState = null;
  var timerId = null;
  var startedAt = 0;
  var submitted = false;
  var activeScreen = 'screen-title';

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch];
    });
  }

  function show(id) {
    document.querySelectorAll('.screen').forEach(function (el) {
      el.classList.add('hidden');
    });
    $(id).classList.remove('hidden');
    activeScreen = id;
  }

  function serviceName(id) {
    var service = Game.getService(id);
    return service ? service.name : id;
  }

  function deltaText(delta) {
    return Progression.resourceKeys.map(function (key) {
      var value = delta && delta[key] ? delta[key] : 0;
      var sign = value > 0 ? '+' : '';
      return '<span class="' + (value >= 0 ? 'gain' : 'loss') + '">' +
        esc(Progression.resourceLabel[key]) + sign + value + '</span>';
    }).join('');
  }

  function updateHeader() {
    if (!saveData) saveData = Progression.load();
    $('hud-career').textContent = Progression.careerTitle(saveData);
    $('hud-resources').innerHTML = resourceMeters(saveData.resources, true);
  }

  function resourceMeters(resources, compact) {
    return Progression.resourceKeys.map(function (key) {
      var value = resources[key];
      var danger = value <= 20 ? ' danger' : value <= 40 ? ' warn' : '';
      return '<div class="resource' + (compact ? ' compact' : '') + danger + '">' +
        '<span>' + esc(Progression.resourceLabel[key]) + '</span>' +
        '<b>' + value + '</b>' +
        '<i><em style="width:' + value + '%"></em></i>' +
      '</div>';
    }).join('');
  }

  function renderTitle() {
    clearInterval(timerId);
    saveData = Progression.load();
    updateHeader();
    $('btn-continue').disabled = !Progression.hasSave();
    $('title-save-state').innerHTML = Progression.hasSave()
      ? '<strong>' + esc(Progression.careerTitle(saveData)) + '</strong><div class="title-resources">' + resourceMeters(saveData.resources, true) + '</div>'
      : '<span class="muted">保存データはまだありません。</span>';
    show('screen-title');
  }

  function renderCareer() {
    clearInterval(timerId);
    updateHeader();
    $('career-title').textContent = Progression.careerTitle(saveData);
    $('career-resources').innerHTML = resourceMeters(saveData.resources, false);
    $('career-note').textContent = saveData.lastChapter
      ? '前回: ' + saveData.lastChapter.id + ' / ' + saveData.lastChapter.rank + ' / ' + saveData.lastChapter.avg + '点'
      : '章をクリアすると次の章と肩書きが解放されます。';
    $('chapter-list').innerHTML = DATA.chapters.map(chapterCardHTML).join('');
    bindChapterButtons();
    renderReviewFlags();
    if (Progression.isGameOver(saveData)) {
      renderGameOver('リソースが尽きました。最初から再挑戦してください。');
      return;
    }
    show('screen-career');
  }

  function chapterCardHTML(chapter, index) {
    var status = Progression.chapterStatus(saveData, index);
    var locked = status === 'locked';
    var label = status === 'cleared' ? '完了' : locked ? 'LOCK' : '開始';
    return '<article class="chapter-card ' + esc(status) + '">' +
      '<div class="chapter-top"><span>Chapter ' + (index + 1) + '</span><b>' + esc(label) + '</b></div>' +
      '<h3>' + esc(chapter.title) + '</h3>' +
      '<p>' + esc(chapter.blurb) + '</p>' +
      '<div class="chapter-meta"><span>案件 ' + chapter.challengeIds.length + '</span><span>クリア平均 ' + chapter.requiredAvg + '点</span></div>' +
      '<button class="chapter-start" data-index="' + index + '"' + (locked ? ' disabled' : '') + '>' +
      (status === 'cleared' ? '再挑戦' : 'この章を開始') + '</button>' +
    '</article>';
  }

  function bindChapterButtons() {
    $('chapter-list').querySelectorAll('.chapter-start').forEach(function (btn) {
      btn.addEventListener('click', function () {
        startChapter(Number(btn.dataset.index));
      });
    });
  }

  function renderReviewFlags() {
    var ids = Object.keys(saveData.reviewFlags || {}).sort(function (a, b) {
      return saveData.reviewFlags[b] - saveData.reviewFlags[a];
    }).slice(0, 8);
    $('review-flags').innerHTML = ids.length
      ? ids.map(function (id) { return '<i>' + esc(serviceName(id)) + '</i>'; }).join('')
      : '<span class="muted">復習フラグはありません。</span>';
  }

  function startChapter(index) {
    saveData.currentChapter = index;
    saveData = Progression.save(saveData);
    runState = Game.startChapter(saveData, index);
    renderGame();
  }

  function renderGame() {
    submitted = false;
    var round = Game.currentRound(runState);
    var challenge = Game.currentChallenge(runState);
    var limit = Game.timeLimit(challenge);
    updateHeader();
    show('screen-game');
    $('chapter-label').textContent = runState.chapter.title + ' / ' + (runState.roundIndex + 1) + ' of ' + runState.queue.length;
    $('type-label').textContent = DATA.typeLabel[challenge.type];
    $('type-label').className = 'type-badge type-' + challenge.type;
    $('type-hint').textContent = DATA.typeHint[challenge.type];
    $('challenge-title').textContent = challenge.title;
    $('challenge-brief').textContent = challenge.brief;
    $('focus-tags').innerHTML = challenge.focusAxes.map(function (ax) {
      return '<span class="focus-tag">' + esc(Game.AXIS_LABEL[ax]) + '</span>';
    }).join('');
    $('select-limit').textContent = '選択上限 ' + challenge.maxSelect;
    $('service-grid').innerHTML = round.candidates.map(serviceCardHTML).join('');
    bindServiceCards();
    renderSelection();
    startTimer(limit);
  }

  function serviceCardHTML(id) {
    var service = Game.getService(id);
    var selected = runState.selected.indexOf(id) >= 0;
    var effects = Object.keys(service.axes).filter(function (ax) {
      return service.axes[ax] > 0;
    }).slice(0, 3).map(function (ax) {
      return '<span>' + esc(Game.AXIS_LABEL[ax]) + '+' + service.axes[ax] + '</span>';
    }).join('');
    return '<button class="service-card' + (selected ? ' selected' : '') + '" data-id="' + esc(id) + '">' +
      '<span class="svc-icon">' + esc(service.icon) + '</span>' +
      '<span class="svc-main"><strong>' + esc(service.name) + '</strong><em>' + esc(service.role) + '</em></span>' +
      '<span class="svc-effects">' + effects + '</span>' +
      '<span class="svc-desc">' + esc(service.desc) + '</span>' +
    '</button>';
  }

  function bindServiceCards() {
    $('service-grid').querySelectorAll('.service-card').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var res = Game.toggleSelect(runState, btn.dataset.id);
        if (!res.ok) flashLimit(res.msg);
        renderServiceGrid();
        renderSelection();
      });
    });
  }

  function renderServiceGrid() {
    var round = Game.currentRound(runState);
    $('service-grid').innerHTML = round.candidates.map(serviceCardHTML).join('');
    bindServiceCards();
  }

  function renderSelection() {
    var challenge = Game.currentChallenge(runState);
    $('selected-count').textContent = '選択中 ' + runState.selected.length + '/' + challenge.maxSelect;
    $('btn-submit').disabled = runState.selected.length === 0;
  }

  function flashLimit(message) {
    $('selected-count').textContent = message;
    $('selected-count').classList.add('flash');
    setTimeout(function () {
      $('selected-count').classList.remove('flash');
      renderSelection();
    }, 650);
  }

  function startTimer(limit) {
    clearInterval(timerId);
    startedAt = Date.now();
    updateTimer(limit, limit);
    timerId = setInterval(function () {
      var elapsed = (Date.now() - startedAt) / 1000;
      var left = Math.max(0, limit - elapsed);
      updateTimer(left, limit);
      if (left <= 0) submitRound();
    }, 100);
  }

  function updateTimer(left, limit) {
    $('timer-text').textContent = left.toFixed(1) + 's';
    $('timer-fill').style.width = Math.max(0, left / limit * 100) + '%';
    $('timer-fill').className = left <= 6 ? 'danger' : left <= 12 ? 'warn' : '';
  }

  function submitRound() {
    if (submitted || !runState) return;
    submitted = true;
    clearInterval(timerId);
    var elapsed = (Date.now() - startedAt) / 1000;
    var result = Game.evaluate(runState, elapsed);
    saveData = Progression.applyRoundResult(saveData, result);
    updateHeader();
    renderResult(result);
  }

  function renderResult(result) {
    show('screen-result');
    $('result-rank').textContent = result.rank;
    $('result-rank').className = 'rank-badge rank-' + result.rank;
    $('result-score').textContent = result.score + '点';
    $('result-delta').innerHTML = deltaText(result.resourceDelta);
    $('result-title').textContent = result.challenge.title;
    $('result-type').textContent = DATA.typeLabel[result.challenge.type] + ' / ' + result.challenge.industry;
    $('axis-bars').innerHTML = Game.AXES.map(function (ax) {
      var value = result.axes[ax];
      var cls = value >= 70 ? 'hi' : value >= 55 ? 'mid' : 'lo';
      return '<div class="axis-row"><span>' + esc(Game.AXIS_LABEL[ax]) + '</span>' +
        '<div><i class="' + cls + '" style="width:' + value + '%"></i></div><b>' + value + '</b></div>';
    }).join('');
    $('match-summary').innerHTML = summaryHTML(result);
    $('explanation').innerHTML = explanationHTML(result);
    $('btn-next').textContent = Progression.isGameOver(saveData)
      ? 'ゲームオーバーへ'
      : runState.roundIndex + 1 >= runState.queue.length ? '章の結果へ' : '次の案件へ';
  }

  function pillList(label, ids, className) {
    if (!ids.length) return '';
    return '<div class="match-row"><b>' + esc(label) + '</b><span>' +
      ids.map(function (id) { return '<i class="' + className + '">' + esc(serviceName(id)) + '</i>'; }).join('') +
    '</span></div>';
  }

  function ruleList(label, rules, className) {
    if (!rules.length) return '';
    return '<div class="match-row"><b>' + esc(label) + '</b><span>' +
      rules.map(function (rule) { return '<i class="' + className + '">' + esc(rule.reason) + '</i>'; }).join('') +
    '</span></div>';
  }

  function summaryHTML(result) {
    var html = '';
    html += pillList('必須的中', result.requiredHits, 'ok-pill');
    html += pillList('支援', result.supportHits, 'support-pill');
    html += pillList('不足', result.missing, 'miss-pill');
    html += pillList('罠/余計', result.penaltyIds, 'bad-pill');
    html += ruleList('互換不可', result.conflicts, 'bad-pill');
    html += ruleList('アンチ', result.antiPatterns, 'bad-pill');
    if (result.synergies.length) {
      html += '<div class="match-row"><b>シナジー</b><span>' +
        result.synergies.map(function (syn) { return '<i class="syn-pill">' + esc(syn.label) + '</i>'; }).join('') +
      '</span></div>';
    }
    if (!html) html = '<div class="match-row"><b>結果</b><span><i class="miss-pill">サービス未選択</i></span></div>';
    return html;
  }

  function explanationHTML(result) {
    var selected = result.selected.length ? result.selected.map(serviceName).join(' / ') : 'なし';
    var recommended = result.challenge.required.concat(result.challenge.support).map(serviceName).join(' / ');
    return '<p>' + esc(result.challenge.explanation) + '</p>' +
      '<p><strong>選択:</strong> ' + esc(selected) + '</p>' +
      '<p><strong>推奨:</strong> ' + esc(recommended) + '</p>';
  }

  function nextAfterResult() {
    if (Progression.isGameOver(saveData)) {
      renderGameOver('リソースが尽きました。案件を受け続けられません。');
      return;
    }
    if (!Game.nextRound(runState)) {
      var finished = Progression.finishChapter(saveData, runState);
      saveData = finished.saveData;
      renderChapterFinal(finished.summary);
      return;
    }
    renderGame();
  }

  function renderChapterFinal(summary) {
    updateHeader();
    $('chapter-final-rank').textContent = summary.rank;
    $('chapter-final-rank').className = 'rank-badge rank-' + summary.rank;
    $('chapter-final-title').textContent = summary.clear ? '章クリア' : '章クリアならず';
    $('chapter-final-detail').textContent = summary.chapter.title + ' / 平均 ' + summary.avg + '点 / 基準 ' + summary.chapter.requiredAvg + '点';
    $('unlock-message').textContent = summary.unlockMessage;
    $('chapter-final-resources').innerHTML = resourceMeters(summary.resources, false);
    $('round-log').innerHTML = runState.history.map(function (item, i) {
      return '<div class="log-row"><span>' + (i + 1) + '. ' + esc(item.challenge.title) + '</span>' +
        '<b class="rank-' + item.rank + '">' + item.rank + '</b><em>' + item.score + '点</em></div>';
    }).join('');
    $('final-review').innerHTML = finalReviewHTML(summary);
    show('screen-chapter-final');
  }

  function finalReviewHTML(summary) {
    var weak = summary.weakAxes.length
      ? summary.weakAxes.slice(0, 3).map(function (ax) { return '<i>' + esc(Game.AXIS_LABEL[ax]) + '</i>'; }).join('')
      : '<i>大きな弱点なし</i>';
    var services = summary.reviewServices.length
      ? summary.reviewServices.map(function (id) { return '<i>' + esc(serviceName(id)) + '</i>'; }).join('')
      : '<i>総合演習</i>';
    return '<h3>苦手軸</h3><div class="review-tags">' + weak + '</div>' +
      '<h3>復習サービス</h3><div class="review-tags">' + services + '</div>';
  }

  function renderGameOver(message) {
    clearInterval(timerId);
    updateHeader();
    $('gameover-message').textContent = message;
    $('gameover-resources').innerHTML = resourceMeters(saveData.resources, false);
    show('screen-gameover');
  }

  function bind() {
    $('btn-continue').addEventListener('click', function () {
      saveData = Progression.load();
      renderCareer();
    });
    $('btn-new').addEventListener('click', function () {
      if (Progression.hasSave() && !window.confirm('保存済みの進行を消して最初から始めますか？')) return;
      saveData = Progression.reset();
      renderCareer();
    });
    $('btn-back-title').addEventListener('click', renderTitle);
    $('btn-submit').addEventListener('click', submitRound);
    $('btn-reset').addEventListener('click', function () {
      Game.resetSelection(runState);
      renderServiceGrid();
      renderSelection();
    });
    $('btn-next').addEventListener('click', nextAfterResult);
    $('btn-career').addEventListener('click', renderCareer);
    $('btn-title-from-final').addEventListener('click', renderTitle);
    $('btn-restart-gameover').addEventListener('click', function () {
      saveData = Progression.reset();
      renderCareer();
    });
    $('btn-title-gameover').addEventListener('click', renderTitle);

    document.addEventListener('keydown', function (ev) {
      if (activeScreen === 'screen-game' && ev.key === 'Enter' && !$('btn-submit').disabled) {
        ev.preventDefault();
        submitRound();
      } else if (activeScreen === 'screen-result' && (ev.key === 'Enter' || ev.key === ' ')) {
        ev.preventDefault();
        nextAfterResult();
      } else if (activeScreen === 'screen-chapter-final' && (ev.key === 'Enter' || ev.key === ' ')) {
        ev.preventDefault();
        renderCareer();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    renderTitle();
  });
})();
