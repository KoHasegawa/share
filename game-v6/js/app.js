/* AWS 早押しクイズ — みんはや形式（1文字ずつ4択で綴る）
 * フロー: 設定 → 問題文を1文字ずつ表示 → 早押し(表示はその位置で固定) →
 *         正解を1文字ずつ4択で入力 → 解説 → 次へ → 結果
 */
(function () {
  "use strict";
  const DATA = window.AWSQUIZ;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const REVEAL_MS = 165;                 // 1文字あたりの表示間隔
  const ANSWER_BASE_MS = 4000;           // 綴り回答の基礎制限時間
  const ANSWER_PER_CHAR_MS = 1800;       // 1文字あたり加算する制限時間
  const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const config = { cert: "both", domains: new Set(), count: 10 };

  let deck = [], idx = 0, score = 0;
  let streak = 0, bestStreak = 0, correctCount = 0, buzzedCount = 0;
  const reviewWrong = [];

  let revealTimer = null, holdTimer = null, answerRAF = null;
  let revealedChars = 0, totalChars = 0;
  let phase = "reveal";                   // reveal | spelling | done
  let answerDeadline = 0, answerWindow = 0;
  let spellPos = 0, curOptions = [];

  /* ===== スタート画面 ===== */
  function buildStart() {
    $$("#certOpts .opt").forEach((el) => el.addEventListener("click", () => {
      $$("#certOpts .opt").forEach((o) => o.classList.remove("sel"));
      el.classList.add("sel"); config.cert = el.dataset.v; refreshAvailable();
    }));
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
    $$("#countOpts .opt").forEach((el) => el.addEventListener("click", () => {
      $$("#countOpts .opt").forEach((o) => o.classList.remove("sel"));
      el.classList.add("sel"); config.count = parseInt(el.dataset.v, 10);
    }));
    $("#startBtn").addEventListener("click", startGame);
    refreshAvailable();
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
    if (answerRAF) { cancelAnimationFrame(answerRAF); answerRAF = null; }
  }
  function show(screen) {
    ["start", "play", "result"].forEach((s) =>
      $("#screen-" + s).classList.toggle("hidden", s !== screen));
  }

  /* ===== ゲーム開始 ===== */
  function startGame() {
    deck = shuffle(pool().slice()).slice(0, config.count);
    idx = 0; score = 0; streak = 0; bestStreak = 0;
    correctCount = 0; buzzedCount = 0; reviewWrong.length = 0;
    show("play"); loadQuestion();
  }

  /* ===== 1問のロード（問題文を1文字ずつ表示）===== */
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
    enterSpelling(false);
  }

  /* ===== 綴り回答フェーズ ===== */
  function enterSpelling(auto) {
    clearTimers();
    phase = "spelling";
    const q = deck[idx];
    q._revealRatio = Math.min(1, revealedChars / totalChars);
    q._auto = auto;

    // 早押し時点で表示されていた文字だけで固定（残りは見せない）
    $("#qtext").innerHTML = escapeHtml(q.q.slice(0, revealedChars))
      + (auto ? "" : `<span class="cut">…</span>`);
    $("#qtext").classList.add("frozen");

    $("#buzzArea").classList.add("hidden");
    $("#answerArea").classList.remove("hidden");

    // 正解スロット
    spellPos = 0;
    renderSlots(q);
    nextSpellStep(q);

    // 制限時間（語長に応じて延長）
    answerWindow = ANSWER_BASE_MS + q.answer.length * ANSWER_PER_CHAR_MS;
    answerDeadline = performance.now() + answerWindow;
    const bar = $("#answerBar > i");
    const tick = () => {
      const left = answerDeadline - performance.now();
      bar.style.width = Math.max(0, (left / answerWindow) * 100) + "%";
      if (left <= 0) { finishAnswer(false, "time"); return; }
      answerRAF = requestAnimationFrame(tick);
    };
    answerRAF = requestAnimationFrame(tick);
  }

  function renderSlots(q) {
    const box = $("#slots");
    box.innerHTML = "";
    for (let i = 0; i < q.answer.length; i++) {
      const s = document.createElement("span");
      s.className = "slot";
      if (i < spellPos) { s.classList.add("filled"); s.textContent = q.answer[i]; }
      else if (i === spellPos) { s.classList.add("active"); s.textContent = ""; }
      else { s.textContent = ""; }
      box.appendChild(s);
    }
  }

  // 現在位置の4択を生成して表示
  function nextSpellStep(q) {
    const correct = q.answer[spellPos];
    const opts = new Set([correct]);
    // 同じ語に出てくる他の文字を優先的に紛れ込ませる → 程よい難度
    const inWord = shuffle(Array.from(new Set(q.answer.split("").filter((c) => c !== correct))));
    for (const c of inWord) { if (opts.size >= 3) break; opts.add(c); }
    while (opts.size < 4) { opts.add(CHARSET[Math.floor(Math.random() * CHARSET.length)]); }
    curOptions = shuffle(Array.from(opts));

    const box = $("#choices");
    box.innerHTML = "";
    curOptions.forEach((ch) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.dataset.ch = ch;
      b.textContent = ch;
      b.addEventListener("click", () => pickChar(ch, b));
      box.appendChild(b);
    });
  }

  function pickChar(ch, btnEl) {
    if (phase !== "spelling") return;
    const q = deck[idx];
    const correct = q.answer[spellPos];
    if (ch === correct) {
      if (btnEl) btnEl.classList.add("hit");
      spellPos++;
      renderSlots(q);
      if (spellPos >= q.answer.length) { finishAnswer(true, "spelled"); return; }
      nextSpellStep(q);
    } else {
      if (btnEl) btnEl.classList.add("miss");
      finishAnswer(false, "miss");
    }
  }

  /* ===== 回答確定 ===== */
  function finishAnswer(correct, reason) {
    phase = "done";
    clearTimers();
    const q = deck[idx];

    // 確定後は問題文を全文表示（解説と合わせて復習できるように）
    $("#qtext").classList.remove("frozen");
    $("#qtext").innerHTML = escapeHtml(q.q);
    $("#answerBar > i").style.width = "0%";

    // 残りのスロットを正解で埋め、誤り箇所を示す
    $$("#slots .slot").forEach((s, i) => {
      s.classList.remove("active");
      s.textContent = q.answer[i];
      s.classList.toggle("filled", correct || i < spellPos);
      if (!correct && i === spellPos) s.classList.add("wrongslot");
    });
    $$("#choices .choice").forEach((b) => { b.disabled = true; });

    let pts = 0, verdict = "", vclass = "";
    if (correct) {
      const speed = Math.round((1 - q._revealRatio) * 50);
      const lenBonus = q.answer.length * 2;
      const streakBonus = Math.min(streak, 5) * 5;
      pts = 50 + Math.max(0, speed) + lenBonus + streakBonus;
      score += pts; correctCount++;
      streak++; bestStreak = Math.max(bestStreak, streak);
      verdict = q._auto ? "正解！" : "正解！⚡ 早押し成功";
      vclass = "ok";
      $("#stage").classList.add("flash-ok");
    } else {
      pts = -20; score = Math.max(0, score + pts); streak = 0;
      reviewWrong.push(q);
      verdict = reason === "time" ? "時間切れ…" : "お手つき！";
      vclass = "ng";
      $("#stage").classList.add("flash-ng");
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
    $("#finalScore").textContent = score;
    $("#statCorrect").textContent = `${correctCount} / ${total}`;
    $("#statAcc").textContent = acc + "%";
    $("#statStreak").textContent = bestStreak;
    $("#statBuzz").textContent = buzzedCount;

    let rank = "🌱 クラウド見習い", rc = "r-c";
    if (acc >= 90 && score >= total * 80) { rank = "🏆 ソリューションアーキテクト"; rc = "r-s"; }
    else if (acc >= 75) { rank = "🚀 クラウドエンジニア"; rc = "r-a"; }
    else if (acc >= 50) { rank = "📘 プラクティショナー候補"; rc = "r-b"; }
    const rk = $("#rank"); rk.textContent = rank; rk.className = "rank " + rc;

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
