/* AWS 早押しクイズ — みんはや形式（1文字ずつ4択で綴る）
 * 早押し→1文字ずつ4択で入力。1文字ごとに制限時間（押すたびリセット）。
 * 「ヒミツ」モードでは文字数を隠す。タップ等にインタラクティブなエフェクト。
 */
(function () {
  "use strict";
  const DATA = window.AWSQUIZ;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const REVEAL_MS = 165;        // 問題文1文字あたりの表示間隔
  const PER_CHAR_MS = 3200;     // 1文字あたりの回答制限時間（押すとリセット）
  const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const config = { cert: "both", domains: new Set(), count: 10, hideLength: false };

  let deck = [], idx = 0, score = 0;
  let streak = 0, bestStreak = 0, correctCount = 0, buzzedCount = 0;
  const reviewWrong = [];

  let revealTimer = null, holdTimer = null, charRAF = null;
  let revealedChars = 0, totalChars = 0;
  let phase = "reveal";         // reveal | spelling | done
  let charDeadline = 0;
  let spellPos = 0, curOptions = [];

  /* ===== スタート画面 ===== */
  function buildStart() {
    bindOpts("#certOpts", (v) => { config.cert = v; refreshAvailable(); });
    bindOpts("#countOpts", (v) => { config.count = parseInt(v, 10); });
    bindOpts("#modeOpts", (v) => { config.hideLength = (v === "hard"); });
    const grid = $("#domOpts");
    DATA.domains.forEach((d) => {
      const b = document.createElement("button");
      b.className = "opt"; b.dataset.v = d.id;
      b.innerHTML = `<span>${d.emoji}</span><span>${d.name}</span>`;
      b.addEventListener("click", () => {
        b.classList.toggle("sel");
        b.classList.contains("sel") ? config.domains.add(d.id) : config.domains.delete(d.id);
        refreshAvailable();
      });
      grid.appendChild(b);
    });
    $("#startBtn").addEventListener("click", startGame);
    refreshAvailable();
  }
  function bindOpts(sel, cb) {
    $$(sel + " .opt").forEach((el) => el.addEventListener("click", () => {
      $$(sel + " .opt").forEach((o) => o.classList.remove("sel"));
      el.classList.add("sel"); cb(el.dataset.v);
    }));
  }
  function pool() {
    return DATA.questions.filter((q) => {
      const certOk = config.cert === "both" || q.cert.includes(config.cert);
      const domOk = config.domains.size === 0 || config.domains.has(q.domain);
      return certOk && domOk;
    });
  }
  function refreshAvailable() {
    const n = pool().length;
    $("#avail").textContent = `条件に合う問題: ${n}問`;
    $("#startBtn").disabled = n === 0;
  }

  /* ===== ユーティリティ ===== */
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function clearTimers() {
    if (revealTimer) { clearInterval(revealTimer); revealTimer = null; }
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    if (charRAF) { cancelAnimationFrame(charRAF); charRAF = null; }
  }
  function show(screen) {
    ["start", "play", "result"].forEach((s) =>
      $("#screen-" + s).classList.toggle("hidden", s !== screen));
  }

  /* ===== エフェクト ===== */
  const FX = $("#fx");
  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
  }
  function burst(el, color, n) {
    const c = centerOf(el);
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "spark";
      const ang = Math.random() * Math.PI * 2;
      const dist = 28 + Math.random() * 70;
      p.style.left = c.x + "px"; p.style.top = c.y + "px";
      p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--dy", Math.sin(ang) * dist + "px");
      p.style.setProperty("--sz", (4 + Math.random() * 6) + "px");
      p.style.background = color;
      FX.appendChild(p);
      setTimeout(() => p.remove(), 720);
    }
  }
  function ring(el, color) {
    const c = centerOf(el);
    const r = document.createElement("span");
    r.className = "ring";
    r.style.left = c.x + "px"; r.style.top = c.y + "px";
    r.style.borderColor = color;
    FX.appendChild(r);
    setTimeout(() => r.remove(), 520);
  }
  function floatText(el, text, cls) {
    const c = centerOf(el);
    const t = document.createElement("div");
    t.className = "floattext " + (cls || "");
    t.textContent = text;
    t.style.left = c.x + "px"; t.style.top = (c.r.top - 6) + "px";
    FX.appendChild(t);
    setTimeout(() => t.remove(), 1100);
  }
  function confetti(n) {
    const colors = ["#22d3ee", "#ff8a2b", "#e84bd0", "#3fe08a", "#ffd23f"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "confetti";
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
      p.style.setProperty("--drift", (Math.random() * 160 - 80) + "px");
      p.style.animationDelay = (Math.random() * 0.4) + "s";
      p.style.animationDuration = (1.6 + Math.random() * 1.4) + "s";
      FX.appendChild(p);
      setTimeout(() => p.remove(), 3200);
    }
  }

  /* ===== ゲーム開始 ===== */
  function startGame() {
    deck = shuffle(pool().slice()).slice(0, config.count);
    idx = 0; score = 0; streak = 0; bestStreak = 0;
    correctCount = 0; buzzedCount = 0; reviewWrong.length = 0;
    show("play"); loadQuestion();
  }

  /* ===== 1問のロード ===== */
  function loadQuestion() {
    clearTimers();
    const q = deck[idx];
    phase = "reveal"; revealedChars = 0; totalChars = q.q.length;
    spellPos = 0; curOptions = [];

    $("#scoreVal").textContent = score;
    $("#streakVal").textContent = streak;
    $("#qpos").textContent = `Q ${idx + 1} / ${deck.length}`;
    $("#qprogress").style.width = `${(idx / deck.length) * 100}%`;

    const dom = DATA.domains.find((d) => d.id === q.domain);
    const tags = [`<span class="tag">${dom ? dom.emoji + " " + dom.name : q.domain}</span>`];
    if (q.cert.includes("clf")) tags.push(`<span class="tag clf">CLF</span>`);
    if (q.cert.includes("saa")) tags.push(`<span class="tag saa">SAA</span>`);
    tags.push(`<span class="tag lv">${"★".repeat(q.level)}</span>`);
    if (config.hideLength) tags.push(`<span class="tag hide">🔥 ヒミツ</span>`);
    $("#tags").innerHTML = tags.join("");

    $("#qtext").innerHTML = `<span class="cursor">　</span>`;
    $("#qtext").classList.remove("frozen");
    $("#buzzArea").classList.remove("hidden");
    $("#buzzBtn").disabled = false;
    $("#answerArea").classList.add("hidden");
    $("#feedback").classList.add("hidden");
    $("#nextBtn").classList.add("hidden");
    $("#stage").classList.remove("flash-ok", "flash-ng");

    revealTimer = setInterval(() => {
      revealedChars++;
      renderQ(q);
      if (revealedChars >= totalChars) {
        clearInterval(revealTimer); revealTimer = null;
        holdTimer = setTimeout(() => { if (phase === "reveal") enterSpelling(true); }, 1400);
      }
    }, REVEAL_MS);
  }
  function renderQ(q) {
    const shown = escapeHtml(q.q.slice(0, revealedChars));
    const cursor = phase === "reveal" ? `<span class="cursor">　</span>` : "";
    $("#qtext").innerHTML = shown + cursor;
  }

  /* ===== 早押し ===== */
  function buzz() {
    if (phase !== "reveal") return;
    buzzedCount++;
    ring($("#buzzBtn"), "#ff8a2b");
    enterSpelling(false);
  }

  /* ===== 綴り回答フェーズ ===== */
  function enterSpelling(auto) {
    clearTimers();
    phase = "spelling";
    const q = deck[idx];
    q._revealRatio = Math.min(1, revealedChars / totalChars);
    q._auto = auto;

    // 早押し時点で表示されていた文字だけで固定（残りは伏せる）
    $("#qtext").innerHTML = escapeHtml(q.q.slice(0, revealedChars))
      + (auto ? "" : `<span class="cut">…</span>`);
    $("#qtext").classList.add("frozen");

    $("#buzzArea").classList.add("hidden");
    $("#answerArea").classList.remove("hidden");
    $("#spellLabel").textContent = config.hideLength
      ? "答えを1文字ずつ（文字数ヒミツ）" : "答えを1文字ずつ選べ";

    spellPos = 0;
    renderSlots(q);
    nextSpellStep(q);   // 最初の文字＋タイマー開始
  }

  function renderSlots(q, revealAll) {
    const box = $("#slots");
    box.innerHTML = "";
    const n = q.answer.length;
    const limit = (config.hideLength && !revealAll) ? spellPos + 1 : n;
    for (let i = 0; i < limit; i++) {
      const s = document.createElement("span");
      s.className = "slot";
      if (i < spellPos) { s.classList.add("filled"); s.textContent = q.answer[i]; }
      else if (i === spellPos && phase !== "done") { s.classList.add("active"); }
      box.appendChild(s);
    }
    if (config.hideLength && !revealAll && phase !== "done") {
      const m = document.createElement("span");
      m.className = "slot more"; m.textContent = "?";
      box.appendChild(m);
    }
  }

  function nextSpellStep(q) {
    const correct = q.answer[spellPos];
    const opts = new Set([correct]);
    const inWord = shuffle(Array.from(new Set(q.answer.split("").filter((c) => c !== correct))));
    for (const c of inWord) { if (opts.size >= 3) break; opts.add(c); }
    while (opts.size < 4) { opts.add(CHARSET[Math.floor(Math.random() * CHARSET.length)]); }
    curOptions = shuffle(Array.from(opts));

    const box = $("#choices");
    box.innerHTML = "";
    curOptions.forEach((ch) => {
      const b = document.createElement("button");
      b.className = "choice"; b.dataset.ch = ch; b.textContent = ch;
      b.addEventListener("click", () => pickChar(ch, b));
      box.appendChild(b);
    });
    startCharTimer();   // 1文字ごとにタイマーをリセット
  }

  function startCharTimer() {
    if (charRAF) { cancelAnimationFrame(charRAF); charRAF = null; }
    charDeadline = performance.now() + PER_CHAR_MS;
    const bar = $("#answerBar > i");
    bar.classList.add("reset");
    void bar.offsetWidth;            // リフロー強制でリセットアニメを効かせる
    bar.classList.remove("reset");
    const tick = () => {
      const left = charDeadline - performance.now();
      const r = Math.max(0, left / PER_CHAR_MS);
      bar.style.width = (r * 100) + "%";
      bar.classList.toggle("danger", r < 0.33);
      if (left <= 0) { finishAnswer(false, "time"); return; }
      charRAF = requestAnimationFrame(tick);
    };
    charRAF = requestAnimationFrame(tick);
  }

  function pickChar(ch, btnEl) {
    if (phase !== "spelling") return;
    const q = deck[idx];
    const correct = q.answer[spellPos];
    if (ch === correct) {
      if (btnEl) { btnEl.classList.add("hit"); burst(btnEl, "#3fe08a", 12); ring(btnEl, "#3fe08a"); }
      spellPos++;
      renderSlots(q);
      if (spellPos >= q.answer.length) { finishAnswer(true, "spelled"); return; }
      // 連続ヒットのコンボ表示
      if (spellPos >= 2) floatText($("#slots"), "+", "combo-mini");
      nextSpellStep(q);   // タイマーリセット
    } else {
      if (btnEl) { btnEl.classList.add("miss"); burst(btnEl, "#ff5470", 14); }
      finishAnswer(false, "miss");
    }
  }

  /* ===== 回答確定 ===== */
  function finishAnswer(correct, reason) {
    phase = "done";
    clearTimers();
    const q = deck[idx];

    $("#qtext").classList.remove("frozen");
    $("#qtext").innerHTML = escapeHtml(q.q);
    $("#answerBar > i").style.width = "0%";

    renderSlots(q, true);
    $$("#slots .slot").forEach((s, i) => {
      s.classList.remove("active");
      s.textContent = q.answer[i];
      if (correct || i < spellPos) s.classList.add("filled");
      if (!correct && i === spellPos) s.classList.add("wrongslot");
    });
    $$("#choices .choice").forEach((b) => { b.disabled = true; });

    let pts = 0, verdict = "", vclass = "";
    if (correct) {
      const speed = Math.round((1 - q._revealRatio) * 50);
      const lenBonus = q.answer.length * 2;
      const streakBonus = Math.min(streak, 5) * 5;
      pts = 50 + Math.max(0, speed) + lenBonus + streakBonus;
      if (config.hideLength) pts = Math.round(pts * 1.3);
      score += pts; correctCount++;
      streak++; bestStreak = Math.max(bestStreak, streak);
      verdict = q._auto ? "正解！" : "正解！⚡ 早押し成功";
      vclass = "ok";
      $("#stage").classList.add("flash-ok");
      burst($("#qtext"), "#3fe08a", 24);
      floatText($("#scoreVal"), "+" + pts, "gain");
      if (streak >= 2) floatText($("#qtext"), "COMBO ×" + streak + "!", "combo");
    } else {
      pts = -20; score = Math.max(0, score + pts); streak = 0;
      reviewWrong.push(q);
      verdict = reason === "time" ? "時間切れ…" : "お手つき！";
      vclass = "ng";
      $("#stage").classList.add("flash-ng");
      floatText($("#scoreVal"), pts, "loss");
    }

    $("#feedback").classList.remove("hidden");
    $("#feedback").innerHTML =
      `<div class="verdict ${vclass}"><span class="pts">${pts >= 0 ? "+" : ""}${pts}</span>${verdict}</div>` +
      `<div class="explain"><strong>正解:</strong> ${escapeHtml(q.answer)}` +
      `<span class="ansname">（${escapeHtml(q.name)}）</span><br>${escapeHtml(q.explain)}</div>`;

    $("#scoreVal").textContent = score;
    $("#streakVal").textContent = streak;

    const last = idx === deck.length - 1;
    const nb = $("#nextBtn");
    nb.textContent = last ? "結果を見る →" : "次の問題 →";
    nb.classList.remove("hidden");
    nb.focus();
  }

  function nextQuestion() {
    if (idx === deck.length - 1) { showResult(); return; }
    idx++; loadQuestion();
  }

  /* ===== 結果 ===== */
  function showResult() {
    show("result");
    const total = deck.length;
    const acc = total ? Math.round((correctCount / total) * 100) : 0;
    countUp($("#finalScore"), score);
    $("#statCorrect").textContent = `${correctCount} / ${total}`;
    $("#statAcc").textContent = acc + "%";
    $("#statStreak").textContent = bestStreak;
    $("#statBuzz").textContent = buzzedCount;

    let rank = "🌱 クラウド見習い", rc = "r-c";
    if (acc >= 90 && score >= total * 80) { rank = "🏆 ソリューションアーキテクト"; rc = "r-s"; }
    else if (acc >= 75) { rank = "🚀 クラウドエンジニア"; rc = "r-a"; }
    else if (acc >= 50) { rank = "📘 プラクティショナー候補"; rc = "r-b"; }
    const rk = $("#rank"); rk.textContent = rank; rk.className = "rank " + rc;
    if (acc >= 75) confetti(120);

    const rv = $("#reviewList");
    if (reviewWrong.length === 0) {
      $("#reviewWrap").classList.add("hidden");
    } else {
      $("#reviewWrap").classList.remove("hidden");
      rv.innerHTML = reviewWrong.map((q) =>
        `<div class="item"><div class="qq">${escapeHtml(q.q)}</div>` +
        `<div class="aa">✓ ${escapeHtml(q.answer)} — ${escapeHtml(q.name)}</div></div>`).join("");
    }
    $("#againBtn").onclick = startGame;
    $("#configBtn").onclick = () => show("start");
  }
  function countUp(el, target) {
    const start = performance.now(), dur = 900;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ===== キーボード操作 ===== */
  document.addEventListener("keydown", (e) => {
    if ($("#screen-play").classList.contains("hidden")) return;
    if (phase === "reveal" && (e.code === "Space" || e.key === "Enter")) {
      e.preventDefault(); buzz();
    } else if (phase === "spelling") {
      const k = (e.key || "").toUpperCase();
      const btn = $$("#choices .choice").find((b) => b.dataset.ch === k);
      if (btn) { e.preventDefault(); pickChar(k, btn); }
    } else if (phase === "done" && (e.key === "Enter" || e.code === "Space")) {
      e.preventDefault(); nextQuestion();
    }
  });

  /* ===== 初期化 ===== */
  document.addEventListener("DOMContentLoaded", () => {
    buildStart();
    $("#buzzBtn").addEventListener("click", buzz);
    $("#nextBtn").addEventListener("click", nextQuestion);
    $("#quitBtn").addEventListener("click", () => { clearTimers(); show("start"); });
  });
})();
