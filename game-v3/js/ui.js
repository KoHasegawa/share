// Cloud Sprint Architect UI

(function () {
  'use strict';

  var Game = window.SprintGame;
  var state = null;
  var timerId = null;
  var startedAt = 0;
  var submitted = false;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch];
    });
  }

  function show(id) {
    document.querySelectorAll('.screen').forEach(function (el) { el.classList.add('hidden'); });
    $(id).classList.remove('hidden');
  }

  function serviceName(id) {
    var s = Game.getService(id);
    return s ? s.name : id;
  }

  function updateTopStats() {
    $('stat-score').textContent = 'Score ' + (state ? state.score : 0);
    $('stat-streak').textContent = 'Streak ' + (state ? state.streak : 0);
  }

  function startRun(mode) {
    state = Game.start(mode);
    updateTopStats();
    renderGame();
  }

  function renderGame() {
    submitted = false;
    var round = Game.currentRound(state);
    var c = Game.currentChallenge(state);
    show('screen-game');
    $('round-label').textContent = 'Round ' + (state.roundIndex + 1) + ' / ' + state.queue.length;
    $('challenge-title').textContent = c.title;
    $('challenge-brief').textContent = c.brief;
    $('focus-tags').innerHTML = c.focusAxes.map(function (ax) {
      return '<span class="focus-tag">' + esc(Game.AXIS_LABEL[ax]) + '</span>';
    }).join('');
    $('service-grid').innerHTML = round.candidates.map(serviceCardHTML).join('');
    bindServiceCards();
    renderSelection();
    startTimer();
  }

  function serviceCardHTML(id) {
    var s = Game.getService(id);
    var selected = state.selected.indexOf(id) >= 0;
    var effects = Object.keys(s.axes).slice(0, 3).map(function (ax) {
      return '<span>' + esc(Game.AXIS_LABEL[ax]) + '+' + s.axes[ax] + '</span>';
    }).join('');
    return '<button class="service-card' + (selected ? ' selected' : '') + '" data-id="' + esc(id) + '">' +
      '<span class="svc-icon">' + esc(s.icon) + '</span>' +
      '<span class="svc-main"><strong>' + esc(s.name) + '</strong><em>' + esc(s.role) + '</em></span>' +
      '<span class="svc-effects">' + effects + '</span>' +
      '<span class="svc-desc">' + esc(s.desc) + '</span>' +
      '</button>';
  }

  function bindServiceCards() {
    $('service-grid').querySelectorAll('.service-card').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var res = Game.toggleSelect(state, btn.dataset.id);
        if (!res.ok) flashCount();
        renderServiceGrid();
        renderSelection();
      });
    });
  }

  function renderServiceGrid() {
    var round = Game.currentRound(state);
    $('service-grid').innerHTML = round.candidates.map(serviceCardHTML).join('');
    bindServiceCards();
  }

  function renderSelection() {
    $('selected-count').textContent = '選択中 ' + state.selected.length + '/3';
    $('btn-submit').disabled = state.selected.length === 0;
  }

  function flashCount() {
    $('selected-count').classList.add('flash');
    setTimeout(function () { $('selected-count').classList.remove('flash'); }, 220);
  }

  function startTimer() {
    clearInterval(timerId);
    startedAt = Date.now();
    updateTimer(state.timeLimit);
    timerId = setInterval(function () {
      var elapsed = (Date.now() - startedAt) / 1000;
      var left = Math.max(0, state.timeLimit - elapsed);
      updateTimer(left);
      if (left <= 0) submitRound();
    }, 100);
  }

  function updateTimer(left) {
    $('timer-text').textContent = left.toFixed(1) + 's';
    $('timer-fill').style.width = Math.max(0, left / state.timeLimit * 100) + '%';
    $('timer-fill').className = left <= 4 ? 'danger' : left <= 7 ? 'warn' : '';
  }

  function submitRound() {
    if (submitted || !state) return;
    submitted = true;
    clearInterval(timerId);
    var elapsed = (Date.now() - startedAt) / 1000;
    var result = Game.evaluate(state, elapsed);
    updateTopStats();
    renderResult(result);
  }

  function renderResult(result) {
    show('screen-result');
    $('result-rank').textContent = result.rank;
    $('result-rank').className = 'rank-badge rank-' + result.rank;
    $('result-score').textContent = result.score + '点';
    $('result-time').textContent = '残り ' + result.timeLeft.toFixed(1) + '秒';
    $('result-title').textContent = result.challenge.title;
    $('axis-bars').innerHTML = Game.AXES.map(function (ax) {
      var v = result.axes[ax];
      var cls = v >= 70 ? 'hi' : v >= 55 ? 'mid' : 'lo';
      return '<div class="axis-row">' +
        '<span>' + esc(Game.AXIS_LABEL[ax]) + '</span>' +
        '<div><i class="' + cls + '" style="width:' + v + '%"></i></div>' +
        '<b>' + v + '</b>' +
      '</div>';
    }).join('');
    $('match-summary').innerHTML = summaryHTML(result);
    $('explanation').innerHTML = explanationHTML(result);
    $('btn-next').textContent = state.roundIndex + 1 >= state.queue.length ? '最終結果へ' : '次へ';
  }

  function pillList(label, ids, className) {
    if (!ids.length) return '';
    return '<div class="match-row"><b>' + esc(label) + '</b><span>' +
      ids.map(function (id) { return '<i class="' + className + '">' + esc(serviceName(id)) + '</i>'; }).join('') +
      '</span></div>';
  }

  function summaryHTML(result) {
    var html = '';
    html += pillList('的中', result.requiredHits.concat(result.supportHits), 'ok-pill');
    html += pillList('不足', result.missing, 'miss-pill');
    html += pillList('余計', result.penaltyIds, 'bad-pill');
    if (result.synergies.length) {
      html += '<div class="match-row"><b>シナジー</b><span>' +
        result.synergies.map(function (s) { return '<i class="syn-pill">' + esc(s.label) + '</i>'; }).join('') +
        '</span></div>';
    }
    if (!html) html = '<div class="match-row"><b>結果</b><span><i class="miss-pill">サービス未選択</i></span></div>';
    return html;
  }

  function explanationHTML(result) {
    var selected = result.selected.length ? result.selected.map(serviceName).join(' / ') : 'なし';
    var correct = result.challenge.required.concat(result.challenge.support).map(serviceName).join(' / ');
    return '<p>' + esc(result.challenge.explanation) + '</p>' +
      '<p><strong>選択:</strong> ' + esc(selected) + '</p>' +
      '<p><strong>推奨:</strong> ' + esc(correct) + '</p>';
  }

  function nextOrFinal() {
    if (!Game.nextRound(state)) {
      renderFinal();
      return;
    }
    renderGame();
  }

  function retryRound() {
    if (!state) return;
    Game.retractCurrentResult(state);
    Game.retryRound(state);
    updateTopStats();
    renderGame();
  }

  function renderFinal() {
    var s = Game.summary(state);
    show('screen-final');
    $('final-rank').textContent = s.rank;
    $('final-rank').className = 'rank-badge rank-' + s.rank;
    $('final-title').textContent = s.clear ? 'クリア' : '再挑戦推奨';
    $('final-stats').innerHTML =
      '<div><span>平均</span><strong>' + s.avg + '点</strong></div>' +
      '<div><span>ラウンド</span><strong>' + s.rounds + '</strong></div>' +
      '<div><span>最高連続</span><strong>' + s.bestStreak + '</strong></div>';
    $('round-log').innerHTML = state.history.map(function (r, i) {
      return '<div class="log-row"><span>' + (i + 1) + '. ' + esc(r.challenge.title) + '</span>' +
        '<b class="rank-' + r.rank + '">' + r.rank + '</b><em>' + r.score + '点</em></div>';
    }).join('');
    $('review-box').innerHTML = reviewHTML(s);
  }

  function reviewHTML(summary) {
    var weak = summary.weakAxes.length
      ? summary.weakAxes.slice(0, 3).map(function (ax) { return '<i>' + esc(Game.AXIS_LABEL[ax]) + '</i>'; }).join('')
      : '<i>大きな弱点なし</i>';
    var services = summary.reviewServices.length
      ? summary.reviewServices.map(function (id) { return '<i>' + esc(serviceName(id)) + '</i>'; }).join('')
      : '<i>総合演習</i>';
    return '<h3>復習テーマ</h3><div class="review-tags">' + weak + '</div>' +
      '<h3>見直すサービス</h3><div class="review-tags">' + services + '</div>';
  }

  function bind() {
    $('btn-start-sprint').addEventListener('click', function () { startRun('sprint'); });
    $('btn-start-quick').addEventListener('click', function () { startRun('quick'); });
    $('btn-reset').addEventListener('click', function () {
      Game.resetSelection(state);
      renderServiceGrid();
      renderSelection();
    });
    $('btn-submit').addEventListener('click', submitRound);
    $('btn-next').addEventListener('click', nextOrFinal);
    $('btn-retry-round').addEventListener('click', retryRound);
    $('btn-play-again').addEventListener('click', function () { startRun(state ? state.mode : 'sprint'); });
    $('btn-back-title').addEventListener('click', function () {
      clearInterval(timerId);
      state = null;
      updateTopStats();
      show('screen-title');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    updateTopStats();
    show('screen-title');
  });
})();
