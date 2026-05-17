// game-v2/js/ui.js - Cloud Architect Simulator UI

(function (global) {
  'use strict';

  var DATA = global.SIM_DATA;
  var Sim = global.Sim;

  var state = {
    screen: 'title',
    caseId: null,
    arch: [],     // 配置済みサービスID
    lastResult: null,
    clearedCases: {}
  };

  function $(id) { return document.getElementById(id); }

  function show(screenId) {
    document.querySelectorAll('.screen').forEach(function (el) {
      el.classList.add('hidden');
    });
    $(screenId).classList.remove('hidden');
    state.screen = screenId;
  }

  // === タイトル ===
  function renderTitle() {
    show('screen-title');
  }

  // === 案件選択 ===
  function renderCaseSelect() {
    var list = $('case-list');
    list.innerHTML = '';
    DATA.CASES.forEach(function (c) {
      var div = document.createElement('div');
      div.className = 'case-card';
      var cleared = state.clearedCases[c.id];
      div.innerHTML =
        '<div class="case-card-title">' + c.title +
          (cleared ? ' <span class="cleared">[' + cleared + ']</span>' : '') + '</div>' +
        '<div class="case-card-brief">' + c.brief + '</div>' +
        '<div class="case-card-meta">' +
          '<span>RPS: ' + c.baselineRPS + '〜' + c.peakRPS + '</span>' +
          '<span>予算: $' + c.budget + '/月</span>' +
          '<span>SLA: ' + c.targetSLA + '%</span>' +
          '<span>応答: ' + c.targetLatency + 'ms以下</span>' +
        '</div>';
      div.addEventListener('click', function () {
        state.caseId = c.id;
        state.arch = [];
        state.lastResult = null;
        renderArchitect();
      });
      list.appendChild(div);
    });
    show('screen-cases');
  }

  // === アーキテクト画面 ===
  function currentCase() {
    for (var i = 0; i < DATA.CASES.length; i++) {
      if (DATA.CASES[i].id === state.caseId) return DATA.CASES[i];
    }
    return null;
  }

  function renderRequirements() {
    var c = currentCase();
    var req = $('req-panel');
    req.innerHTML =
      '<h3>' + c.title + '</h3>' +
      '<p class="brief">' + c.brief + '</p>' +
      '<div class="req-grid">' +
        '<div><span class="req-label">想定RPS</span><span class="req-val">' + c.baselineRPS + ' 〜 ' + c.peakRPS + '</span></div>' +
        '<div><span class="req-label">月額予算</span><span class="req-val">$' + c.budget + '</span></div>' +
        '<div><span class="req-label">目標SLA</span><span class="req-val">' + c.targetSLA + '%</span></div>' +
        '<div><span class="req-label">目標応答</span><span class="req-val">≤ ' + c.targetLatency + 'ms</span></div>' +
        '<div><span class="req-label">静的比率</span><span class="req-val">' + Math.round(c.staticRatio * 100) + '%</span></div>' +
      '</div>' +
      '<div class="req-events">想定イベント: ' + c.events.length + '件 (DDoS・AZ障害など発生する場合あり)</div>' +
      '<details><summary>ヒント</summary><ul>' +
        c.hints.map(function (h) { return '<li>' + h + '</li>'; }).join('') +
      '</ul></details>';
  }

  function renderLayers() {
    var area = $('layers-area');
    area.innerHTML = '';
    Sim.LAYERS.forEach(function (layer) {
      var div = document.createElement('div');
      div.className = 'layer-row';
      div.dataset.layer = layer.id;
      var placed = state.arch.filter(function (id) {
        var s = Sim.getService(id);
        return s && s.layer === layer.id;
      });
      div.innerHTML =
        '<div class="layer-label"><strong>' + layer.name + '</strong>' +
        '<div class="layer-desc">' + layer.desc + '</div></div>' +
        '<div class="layer-slots">' +
          (placed.length === 0 ? '<span class="empty-slot">未配置</span>' :
            placed.map(function (id) {
              var s = Sim.getService(id);
              return '<span class="placed-card" data-id="' + id + '">' + s.name +
                ' <span class="placed-cost">$' + s.cost + '</span>' +
                ' <button class="remove-btn" data-remove="' + id + '">×</button></span>';
            }).join('')) +
        '</div>';
      area.appendChild(div);
    });

    area.querySelectorAll('.remove-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = btn.dataset.remove;
        var i = state.arch.indexOf(id);
        if (i >= 0) {
          state.arch.splice(i, 1);
          renderLayers();
          renderPalette();
          renderSummary();
        }
      });
    });
  }

  function renderPalette() {
    var pal = $('palette');
    pal.innerHTML = '';
    Sim.LAYERS.forEach(function (layer) {
      var group = document.createElement('div');
      group.className = 'palette-group';
      group.innerHTML = '<div class="palette-group-label">' + layer.name + '</div>';
      var row = document.createElement('div');
      row.className = 'palette-row';
      DATA.SERVICES.filter(function (s) { return s.layer === layer.id; }).forEach(function (s) {
        var btn = document.createElement('button');
        btn.className = 'palette-card';
        var placed = state.arch.indexOf(s.id) >= 0;
        if (placed) btn.classList.add('placed');
        btn.innerHTML =
          '<div class="pc-name">' + s.name + '</div>' +
          '<div class="pc-stats">' +
            (s.cap !== Infinity && s.cap > 0 ? 'cap:' + s.cap + ' ' : '') +
            (s.latency !== 0 ? 'lat:' + (s.latency > 0 ? '+' : '') + s.latency + 'ms ' : '') +
            '$' + s.cost + '/月' +
          '</div>' +
          '<div class="pc-desc">' + s.desc + '</div>';
        btn.addEventListener('click', function () {
          if (placed) return;
          state.arch.push(s.id);
          renderLayers();
          renderPalette();
          renderSummary();
        });
        row.appendChild(btn);
      });
      group.appendChild(row);
      pal.appendChild(group);
    });
  }

  function renderSummary() {
    var c = currentCase();
    var totalCost = 0;
    state.arch.forEach(function (id) {
      var s = Sim.getService(id);
      if (s) totalCost += s.cost;
    });
    var missing = Sim.checkRequired(state.arch, c);
    $('summary').innerHTML =
      '<span>配置: ' + state.arch.length + '個</span>' +
      '<span class="' + (totalCost > c.budget ? 'over' : '') + '">月額固定: $' + totalCost + ' / $' + c.budget + '</span>' +
      '<span class="' + (missing.length ? 'over' : 'ok') + '">必須充足: ' +
        (missing.length === 0 ? '✓' : missing.length + '件不足 (' + missing.join(',') + ')') + '</span>';
  }

  function renderArchitect() {
    state.lastResult = null;
    renderRequirements();
    renderLayers();
    renderPalette();
    renderSummary();
    $('result-panel').innerHTML = '<p class="placeholder">シミュレーションを実行してください。</p>';
    show('screen-architect');
  }

  // === シミュレーション実行 ===
  function runSim() {
    var c = currentCase();
    if (state.arch.length === 0) {
      alert('サービスを配置してください');
      return;
    }
    var result = Sim.runFullSim(state.arch, c);
    state.lastResult = result;
    animateResult(result);
  }

  function animateResult(result) {
    var panel = $('result-panel');
    panel.innerHTML =
      '<div class="sim-running"><strong>📡 30日間シミュレーション実行中...</strong></div>' +
      '<div class="day-counter">Day 0 / 30</div>' +
      '<div class="chart-area">' +
        '<canvas id="chart-rps" width="600" height="120"></canvas>' +
        '<canvas id="chart-lat" width="600" height="120"></canvas>' +
      '</div>' +
      '<div class="event-log"></div>';

    var idx = 0;
    var rpsCanvas = $('chart-rps');
    var latCanvas = $('chart-lat');
    var rpsCtx = rpsCanvas.getContext('2d');
    var latCtx = latCanvas.getContext('2d');
    var maxRPS = Math.max.apply(null, result.days.map(function (d) {
      return (d.incoming || 0) + (d.blocked || 0);
    })) || 1;
    var maxLat = Math.max.apply(null, result.days.map(function (d) {
      return Math.min(d.latency, 2000);
    })) || 1;

    drawAxes(rpsCtx, rpsCanvas, 'RPS', maxRPS);
    drawAxes(latCtx, latCanvas, '応答 ms', maxLat);

    function tick() {
      if (idx >= result.days.length) {
        finishSim(result);
        return;
      }
      var day = result.days[idx];
      panel.querySelector('.day-counter').textContent =
        'Day ' + (idx + 1) + ' / 30';

      drawBar(rpsCtx, rpsCanvas, idx, day.incoming + (day.blocked || 0),
        maxRPS, day.errors > 10 ? '#f85149' : '#39d353');
      drawBar(latCtx, latCanvas, idx, Math.min(day.latency, maxLat),
        maxLat, day.latency > 500 ? '#f85149' : '#58a6ff');

      if (day.log && day.log.length) {
        var ev = panel.querySelector('.event-log');
        day.log.forEach(function (msg) {
          var line = document.createElement('div');
          line.className = 'event-line';
          line.textContent = 'Day ' + (idx + 1) + ': ' + msg;
          ev.appendChild(line);
        });
        ev.scrollTop = ev.scrollHeight;
      }
      idx++;
      setTimeout(tick, 100);
    }
    tick();
  }

  function drawAxes(ctx, canvas, label, max) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8b949e';
    ctx.font = '11px monospace';
    ctx.fillText(label + ' (max ' + Math.round(max) + ')', 4, 14);
  }

  function drawBar(ctx, canvas, idx, value, max, color) {
    var w = (canvas.width - 20) / 30;
    var h = (value / max) * (canvas.height - 20);
    ctx.fillStyle = color;
    ctx.fillRect(10 + idx * w, canvas.height - 5 - h, w - 1, h);
  }

  function finishSim(result) {
    var panel = $('result-panel');
    var t = result.totals;
    var ev = result.eval;
    var rankColor = {S: '#39d353', A: '#56d364', B: '#d29922',
                     C: '#f85149', D: '#f85149'}[ev.rank];

    var existing = panel.querySelector('.day-counter');
    if (existing) existing.textContent = 'Day 30 / 30 完了';
    var running = panel.querySelector('.sim-running');
    if (running) running.innerHTML = '<strong>📊 シミュレーション結果</strong>';

    var summary = document.createElement('div');
    summary.className = 'sim-summary';
    summary.innerHTML =
      '<div class="rank-big" style="color:' + rankColor + '">' + ev.rank + '</div>' +
      '<div class="score">スコア: ' + ev.score + '</div>' +
      '<div class="metrics">' +
        '<div><span>累計コスト</span><strong>$' + t.cost.toFixed(0) + '</strong></div>' +
        '<div><span>SLA</span><strong>' + t.sla.toFixed(2) + '%</strong></div>' +
        '<div><span>平均応答</span><strong>' + Math.round(t.avgLatency) + 'ms</strong></div>' +
        '<div><span>エラー率</span><strong>' + t.errorRate.toFixed(2) + '%</strong></div>' +
        '<div><span>停止</span><strong>' + t.downtime.toFixed(1) + '日</strong></div>' +
      '</div>' +
      '<div class="reasons">' +
        ev.reasons.map(function (r) {
          var cls = r.indexOf('✓') >= 0 ? 'ok' : 'ng';
          return '<div class="' + cls + '">' + r + '</div>';
        }).join('') +
      '</div>';
    panel.appendChild(summary);

    if (ev.pass) {
      var rankOrder = {S: 5, A: 4, B: 3, C: 2, D: 1};
      var prev = state.clearedCases[state.caseId];
      if (!prev || rankOrder[ev.rank] > rankOrder[prev]) {
        state.clearedCases[state.caseId] = ev.rank;
      }
    }
  }

  // === イベント ===
  function bind() {
    $('btn-start').addEventListener('click', renderCaseSelect);
    $('btn-back-to-cases').addEventListener('click', renderCaseSelect);
    $('btn-simulate').addEventListener('click', runSim);
    $('btn-clear-arch').addEventListener('click', function () {
      state.arch = [];
      renderLayers();
      renderPalette();
      renderSummary();
      $('result-panel').innerHTML = '<p class="placeholder">シミュレーションを実行してください。</p>';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    renderTitle();
  });

  global.UI = {state: state};
})(typeof window !== 'undefined' ? window : globalThis);
