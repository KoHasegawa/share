/* AWS 早押しクイズ — みんはや形式
 * フロー: スタート設定 → 問題文を1文字ずつ表示 → 早押し → 4択回答(制限時間) → 解説 → 次へ → 結果
 */
(function () {
  "use strict";
  const DATA = window.AWSQUIZ;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---- チューニング値 ----
  const REVEAL_MS = 165;       // 1文字あたりの表示間隔
  const ANSWER_MS = 8000;      // 早押し後の回答制限時間
  const KEYS = ["A", "B", "C", "D"];

  // ---- 設定状態 ----
  const config = { cert: "both", domains: new Set(), count: 10 };

  // ---- ゲーム状態 ----
  let deck = [];           // 出題リスト
  let idx = 0;             // 現在の問題index
  let score = 0;
  let streak = 0, bestStreak = 0;
  let correctCount = 0, buzzedCount = 0;
  const reviewWrong = [];  // 間違えた/落とした問題

  // 1問の進行状態
  let revealTimer = null, answerTimer = null, answerRAF = null;
  let revealedChars = 0, totalChars = 0;
  let phase = "reveal";    // reveal | answering | done
  let answerDeadline = 0;

  // ====== スタート画面の組み立て ======
  function buildStart() {
    // 資格
    $$("#certOpts .opt").forEach((el) => {
      el.addEventListener("click", () => {
        $$("#certOpts .opt").forEach((o) => o.classList.remove("sel"));
        el.classList.add("sel");
        config.cert = el.dataset.v;
        refreshAvailable();
      });
    });
    // 分野
    const grid = $("#domOpts");
    DATA.domains.forEach((d) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.dataset.v = d.id;
      b.innerHTML = `<span>${d.emoji}</span><span>${d.name}</span>`;
      b.addEventListener("click", () => {
        b.classList.toggle("sel");
        if (b.classList.contains("sel")) config.domains.add(d.id);
        else config.domains.delete(d.id);
        refreshAvailable();
      });
      grid.appendChild(b);
    });
    // 出題数
    $$("#countOpts .opt").forEach((el) => {
      el.addEventListener("click", () => {
        $$("#countOpts .opt").forEach((o) => o.classList.remove("sel"));
        el.classList.add("sel");
        config.count = parseInt(el.dataset.v, 10);
      });
    });
    $("#startBtn").addEventListener("click", startGame);
    refreshAvailable();
  }

  // 選択条件に合う問題数を表示し、出題可能か判定
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

  // ====== ゲーム開始 ======
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function startGame() {
    deck = shuffle(pool().slice()).slice(0, config.count);
    idx = 0; score = 0; streak = 0; bestStreak = 0;
    correctCount = 0; buzzedCount = 0; reviewWrong.length = 0;
    show("play");
    loadQuestion();
  }

  // ====== 1問のロード ======
  function loadQuestion() {
    clearTimers();
    const q = deck[idx];
    phase = "reveal";
    revealedChars = 0;
    totalChars = q.q.length;

    // HUD / プログレス
    $("#scoreVal").textContent = score;
    $("#streakVal").textContent = streak;
    $("#qpos").textContent = `第 ${idx + 1} / ${deck.length} 問`;
    $("#qprogress").style.width = `${(idx / deck.length) * 100}%`;

    // タグ
    const dom = DATA.domains.find((d) => d.id === q.domain);
    const tags = [`<span class="tag">${dom ? dom.emoji + " " + dom.name : q.domain}</span>`];
    if (q.cert.includes("clf")) tags.push(`<span class="tag clf">CLF</span>`);
    if (q.cert.includes("saa")) tags.push(`<span class="tag saa">SAA</span>`);
    tags.push(`<span class="tag">難易度 ${"★".repeat(q.level)}</span>`);
    $("#tags").innerHTML = tags.join("");

    // 表示リセット
    $("#qtext").innerHTML = `<span class="cursor">_</span>`;
    $("#buzzArea").classList.remove("hidden");
    $("#buzzBtn").disabled = false;
    $("#answerArea").classList.add("hidden");
    $("#feedback").classList.add("hidden");
    $("#nextBtn").classList.add("hidden");

    // 1文字ずつ表示
    revealTimer = setInterval(() => {
      revealedChars++;
      renderQ(q);
      if (revealedChars >= totalChars) {
        clearInterval(revealTimer); revealTimer = null;
        // 全文表示後も少し待ってから自動で回答フェーズへ(押さなかった場合)
        answerTimer = setTimeout(() => { if (phase === "reveal") enterAnswer(true); }, 1200);
      }
    }, REVEAL_MS);
  }

  function renderQ(q) {
    const shown = q.q.slice(0, revealedChars);
    const cursor = phase === "reveal" ? `<span class="cursor">_</span>` : "";
    $("#qtext").innerHTML = escapeHtml(shown) + cursor;
  }

  // ====== 早押し ======
  function buzz() {
    if (phase !== "reveal") return;
    buzzedCount++;
    enterAnswer(false);
  }

  // 回答フェーズへ。auto=true は押さずに全文表示しきった場合
  function enterAnswer(auto) {
    clearTimers();
    phase = "answering";
    const q = deck[idx];
    // 早押し時点での読み上げ進捗を記録(スピードボーナス算出に使用)
    q._revealRatio = Math.min(1, revealedChars / totalChars);
    q._auto = auto;

    // 早押し時は読み上げ位置で固定（カーソルだけ消す）。全文は回答確定後に表示する
    $("#qtext").innerHTML = escapeHtml(q.q.slice(0, revealedChars));

    $("#buzzArea").classList.add("hidden");
    const wrap = $("#answerArea");
    wrap.classList.remove("hidden");

    // 選択肢を一時シャッフルし、正解位置を追跡
    const order = shuffle(q.choices.map((c, i) => ({ c, i })));
    q._order = order;
    const box = $("#choices");
    box.innerHTML = "";
    order.forEach((o, vi) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.dataset.orig = o.i;
      b.innerHTML = `<span class="key">${KEYS[vi]}</span>${escapeHtml(o.c)}`;
      b.addEventListener("click", () => choose(o.i, b));
      box.appendChild(b);
    });

    // 回答タイマー(視覚バー)
    answerDeadline = performance.now() + ANSWER_MS;
    const bar = $("#answerBar > i");
    bar.style.width = "100%";
    const tick = () => {
      const left = answerDeadline - performance.now();
      const r = Math.max(0, left / ANSWER_MS);
      bar.style.width = (r * 100) + "%";
      if (left <= 0) { timeUp(); return; }
      answerRAF = requestAnimationFrame(tick);
    };
    answerRAF = requestAnimationFrame(tick);
  }

  // ====== 回答 ======
  function choose(origIndex, btnEl) {
    if (phase !== "answering") return;
    finishAnswer(origIndex, btnEl);
  }
  function timeUp() {
    if (phase !== "answering") return;
    finishAnswer(-1, null); // 時間切れ
  }

  function finishAnswer(picked, btnEl) {
    phase = "done";
    clearTimers();
    const q = deck[idx];
    const correct = picked === q.a;

    // 回答確定後は問題文を全文表示（解説と合わせて復習できるように）
    $("#qtext").innerHTML = escapeHtml(q.q);

    // 採点: 正解=基礎50 + スピードボーナス(早く押すほど高い、最大50) + 連答ボーナス
    let pts = 0;
    let verdict = "", vclass = "";
    if (correct) {
      const speed = Math.round((1 - q._revealRatio) * 50); // 早押しほど高い
      const base = 50;
      const streakBonus = Math.min(streak, 5) * 5;
      pts = base + Math.max(0, speed) + streakBonus;
      score += pts;
      correctCount++;
      streak++; bestStreak = Math.max(bestStreak, streak);
      verdict = q._auto ? "正解!（自動回答）" : "正解！⚡";
      vclass = "ok";
    } else {
      if (picked === -1) { verdict = "時間切れ…"; vclass = "slow"; }
      else { verdict = "お手つき！"; vclass = "ng"; }
      pts = -20;
      score = Math.max(0, score + pts);
      streak = 0;
      reviewWrong.push(q);
    }

    // 選択肢に正誤マーキング
    $$("#choices .choice").forEach((b) => {
      b.disabled = true;
      const orig = parseInt(b.dataset.orig, 10);
      if (orig === q.a) b.classList.add("correct");
      if (orig === picked && !correct) b.classList.add("wrong");
    });

    // 回答タイマーバーを止める
    $("#answerBar > i").style.width = "0%";

    // 解説
    const corrText = q.choices[q.a];
    $("#feedback").classList.remove("hidden");
    $("#feedback").innerHTML =
      `<div class="verdict ${vclass}"><span class="pts">${pts >= 0 ? "+" : ""}${pts} pt</span>${verdict}</div>` +
      `<div class="explain"><strong>正解:</strong> ${escapeHtml(corrText)}<br>${escapeHtml(q.explain)}</div>`;

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
    idx++;
    loadQuestion();
  }

  // ====== 結果 ======
  function showResult() {
    show("result");
    const total = deck.length;
    const acc = total ? Math.round((correctCount / total) * 100) : 0;
    $("#finalScore").textContent = score;
    $("#statCorrect").textContent = `${correctCount} / ${total}`;
    $("#statAcc").textContent = acc + "%";
    $("#statStreak").textContent = bestStreak;
    $("#statBuzz").textContent = buzzedCount;

    // ランク
    let rank = "🌱 クラウド見習い";
    if (acc >= 90 && score >= total * 70) rank = "🏆 ソリューションアーキテクト";
    else if (acc >= 75) rank = "🚀 クラウドエンジニア";
    else if (acc >= 50) rank = "📘 プラクティショナー候補";
    $("#rank").textContent = rank;

    // 復習リスト
    const rv = $("#reviewList");
    if (reviewWrong.length === 0) {
      $("#reviewWrap").classList.add("hidden");
    } else {
      $("#reviewWrap").classList.remove("hidden");
      rv.innerHTML = reviewWrong.map((q) =>
        `<div class="item"><div class="qq">${escapeHtml(q.q)}</div>` +
        `<div class="aa">✓ ${escapeHtml(q.choices[q.a])}</div></div>`
      ).join("");
    }

    $("#againBtn").onclick = startGame;
    $("#configBtn").onclick = () => show("start");
  }

  // ====== ユーティリティ ======
  function clearTimers() {
    if (revealTimer) { clearInterval(revealTimer); revealTimer = null; }
    if (answerTimer) { clearTimeout(answerTimer); answerTimer = null; }
    if (answerRAF) { cancelAnimationFrame(answerRAF); answerRAF = null; }
  }
  function show(screen) {
    ["start", "play", "result"].forEach((s) =>
      $("#screen-" + s).classList.toggle("hidden", s !== screen));
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ====== キーボード操作 ======
  document.addEventListener("keydown", (e) => {
    if ($("#screen-play").classList.contains("hidden")) return;
    if (phase === "reveal" && (e.code === "Space" || e.key === "Enter")) {
      e.preventDefault(); buzz();
    } else if (phase === "answering") {
      const k = e.key.toUpperCase();
      const i = KEYS.indexOf(k);
      if (i >= 0) {
        const btn = $$("#choices .choice")[i];
        if (btn) { const orig = parseInt(btn.dataset.orig, 10); choose(orig, btn); }
      }
    } else if (phase === "done" && (e.key === "Enter" || e.code === "Space")) {
      e.preventDefault(); nextQuestion();
    }
  });

  // ====== 初期化 ======
  document.addEventListener("DOMContentLoaded", () => {
    buildStart();
    $("#buzzBtn").addEventListener("click", buzz);
    $("#nextBtn").addEventListener("click", nextQuestion);
    $("#quitBtn").addEventListener("click", () => { clearTimers(); show("start"); });
  });
})();
