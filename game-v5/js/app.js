/* アプリ起動 / ホーム / モード切替 */
(function () {
  const App = {};

  const MODES = [
    { id: "drill-topic", icon: "🎯", name: "トピックドリル", desc: "下のトピックカードから選んで順番に解く", action: () => {} },
    { id: "quick10", icon: "⚡", name: "10 問ランダム", desc: "全トピック横断 / さっと回せる", action: () => startRandom(10) },
    { id: "quick30", icon: "🥋", name: "30 問模試", desc: "全トピック横断 / 実力チェック", action: () => startRandom(30) },
    { id: "quick50", icon: "🏯", name: "50 問模試", desc: "腰を据えて回す重め模試", action: () => startRandom(50) },
    { id: "final100", icon: "🐉", name: "最終試験 100 問", desc: "全部入り総合模試", action: () => startRandom(100) },
    { id: "wrong", icon: "📕", name: "間違いノート", desc: "これまでに間違えた問題だけ", action: () => startWrongOnly() },
    { id: "calc", icon: "🧮", name: "計算特訓", desc: "数値入力問題のみ", action: () => startByType("fill", 20) },
    { id: "scenario", icon: "🕵", name: "シナリオ診断", desc: "構成図/明細を見て判定", action: () => startByType("scenario", 8) },
    { id: "unseen", icon: "🆕", name: "未挑戦のみ", desc: "まだ解いたことがない問題だけ 20 問", action: () => startUnseen(20) },
  ];

  function refreshHud() {
    const data = State.load();
    const info = State.levelInfo(data.xp);
    Util.byId("hud-level").textContent = info.level;
    Util.byId("hud-xp").textContent = data.xp;
    Util.byId("hud-title").textContent = info.title;
    Util.byId("hud-streak").textContent = data.streakBest || 0;
  }

  function renderHome() {
    Quiz.showScreen("screen-home");
    Util.byId("btn-home").classList.add("hidden");
    refreshHud();
    // モード
    const mg = Util.byId("mode-grid");
    mg.innerHTML = "";
    MODES.forEach((m) => {
      const card = Util.el("div", { class: "mode-card" }, [
        Util.el("div", { class: "mode-icon", text: m.icon }),
        Util.el("div", { class: "mode-name", text: m.name }),
        Util.el("div", { class: "mode-desc", text: m.desc }),
      ]);
      // ドリルはトピック側から
      if (m.id !== "drill-topic") {
        card.style.cursor = "pointer";
        card.addEventListener("click", m.action);
      } else {
        card.style.opacity = "0.85";
        const meta = Util.el("div", { class: "mode-meta", text: "↓ トピックカードから" });
        card.appendChild(meta);
      }
      mg.appendChild(card);
    });

    // トピック
    const tg = Util.byId("topic-grid");
    tg.innerHTML = "";
    const data = State.load();
    window.QUIZ.topics.forEach((t) => {
      const stat = State.topicStats(data, t.id);
      const card = Util.el("div", { class: "topic-card" });
      card.appendChild(Util.el("div", { class: "topic-name" }, [
        Util.el("span", { class: "topic-emoji", text: t.emoji || "📘" }),
        document.createTextNode(t.name),
      ]));
      card.appendChild(Util.el("div", { class: "topic-desc", text: t.description || "" }));
      const stats = Util.el("div", { class: "topic-stats" });
      stats.innerHTML = `<span><strong>${stat.total}</strong> 問</span><span>到達 <strong>${stat.attempted}</strong></span><span>正答率 <strong>${stat.rate}%</strong></span>`;
      card.appendChild(stats);
      const bar = Util.el("div", { class: "mastery-bar" });
      const fill = Util.el("div", { class: "mastery-fill" });
      fill.style.width = stat.rate + "%";
      bar.appendChild(fill);
      card.appendChild(bar);
      card.addEventListener("click", () => startTopic(t));
      tg.appendChild(card);
    });
  }

  function startTopic(topic) {
    const qs = Util.shuffle(window.QUIZ.questions.filter((q) => q.topic === topic.id));
    Quiz.start({
      mode: { id: "topic-" + topic.id, label: `${topic.emoji} ${topic.name} ドリル (${qs.length}問)` },
      questions: qs,
      onFinish: showResult,
    });
  }

  function startRandom(n) {
    const qs = Util.shuffle(window.QUIZ.questions).slice(0, n);
    Quiz.start({
      mode: { id: "random-" + n, label: `🎲 ${n} 問ランダム` },
      questions: qs,
      onFinish: showResult,
    });
  }

  function startByType(type, n) {
    const pool = window.QUIZ.questions.filter((q) => q.type === type);
    const qs = Util.shuffle(pool).slice(0, n);
    if (qs.length === 0) { alert("対象の問題がありません。"); return; }
    const label = type === "fill" ? "🧮 計算特訓" : "🕵 シナリオ診断";
    Quiz.start({
      mode: { id: "type-" + type, label: `${label} (${qs.length}問)` },
      questions: qs,
      onFinish: showResult,
    });
  }

  function startWrongOnly() {
    const data = State.load();
    const set = new Set(data.wrongIds || []);
    const qs = Util.shuffle(window.QUIZ.questions.filter((q) => set.has(q.id)));
    if (qs.length === 0) { alert("間違えた問題はまだありません。"); return; }
    Quiz.start({
      mode: { id: "wrong", label: `📕 間違いノート (${qs.length}問)` },
      questions: qs,
      onFinish: showResult,
    });
  }

  function startUnseen(n) {
    const data = State.load();
    const seen = data.answered || {};
    const pool = window.QUIZ.questions.filter((q) => !seen[q.id]);
    if (pool.length === 0) { alert("未挑戦の問題はもうありません。"); return; }
    const qs = Util.shuffle(pool).slice(0, n);
    Quiz.start({
      mode: { id: "unseen", label: `🆕 未挑戦のみ (${qs.length}問)` },
      questions: qs,
      onFinish: showResult,
    });
  }

  function showResult(summary) {
    Quiz.showScreen("screen-result");
    Util.byId("btn-home").classList.remove("hidden");
    const pct = summary.total ? Math.round((summary.correct / summary.total) * 100) : 0;
    Util.byId("result-score-badge").textContent = pct + "%";
    Util.byId("result-title").textContent = `${summary.mode.label} 完了`;
    Util.byId("result-summary").textContent = `${summary.correct} / ${summary.total} 正解`;
    Util.byId("result-xp").textContent = `+${summary.xpGain} XP`;
    refreshHud();

    // 復習リスト
    const list = Util.byId("review-list");
    list.innerHTML = "";
    summary.results.forEach((r, idx) => {
      const item = Util.el("div", { class: "review-item " + (r.correct ? "correct" : "wrong") });
      const head = Util.el("div", { class: "review-head" }, [
        Util.el("span", { text: (idx + 1) + ". " + (r.correct ? "✓ " : "× ") }),
        Util.el("span", { text: r.q.q.slice(0, 80) + (r.q.q.length > 80 ? "…" : "") }),
      ]);
      const detail = Util.el("div", { class: "review-detail hidden" });
      // 正解情報
      detail.innerHTML = renderReviewDetail(r);
      head.addEventListener("click", () => detail.classList.toggle("hidden"));
      item.appendChild(head);
      item.appendChild(detail);
      list.appendChild(item);
    });

    // ボタン
    Util.byId("btn-retry").onclick = () => {
      // 同じモードでもう一回
      if (summary.mode.id.startsWith("topic-")) {
        const tid = summary.mode.id.replace(/^topic-/, "");
        const t = window.QUIZ.topics.find((x) => x.id === tid);
        if (t) return startTopic(t);
      }
      if (summary.mode.id.startsWith("random-")) {
        return startRandom(parseInt(summary.mode.id.replace(/^random-/, ""), 10));
      }
      if (summary.mode.id.startsWith("type-")) {
        const tp = summary.mode.id.replace(/^type-/, "");
        const n = tp === "fill" ? 20 : 8;
        return startByType(tp, n);
      }
      if (summary.mode.id === "wrong") return startWrongOnly();
      if (summary.mode.id === "unseen") return startUnseen(20);
      renderHome();
    };
    Util.byId("btn-review-wrong").onclick = () => {
      const wrongQs = summary.results.filter((r) => !r.correct).map((r) => r.q);
      if (wrongQs.length === 0) { alert("このセッションでは全問正解でした。素晴らしい。"); return; }
      Quiz.start({
        mode: { id: "wrong-session", label: `📕 直近の間違い (${wrongQs.length}問)` },
        questions: Util.shuffle(wrongQs),
        onFinish: showResult,
      });
    };
    Util.byId("btn-result-home").onclick = () => renderHome();
  }

  function renderReviewDetail(r) {
    const q = r.q;
    const esc = Util.escapeHtml;
    let userStr = "";
    let correctStr = "";
    if (q.type === "single") {
      const cs = q.choices || [];
      userStr = (typeof r.user === "number" && cs[r.user] != null) ? cs[r.user] : "(未回答)";
      correctStr = cs[q.a] || "";
    } else if (q.type === "multi") {
      const cs = q.choices || [];
      userStr = Array.isArray(r.user) ? r.user.map((i) => cs[i]).join(" / ") : "";
      correctStr = (q.a || []).map((i) => cs[i]).join(" / ");
    } else if (q.type === "fill") {
      userStr = r.user;
      correctStr = q.numeric ? `${q.a}${q.tolerance ? " (±" + q.tolerance + ")" : ""}${q.unit ? " " + q.unit : ""}` : (Array.isArray(q.a) ? q.a.join(" / ") : q.a);
    } else if (q.type === "scenario") {
      userStr = "(複問: 詳細は本文参照)";
      correctStr = (q.parts || []).map((p, i) => {
        if (p.type === "multi") return `Q${i+1}: ${(p.a || []).map((idx) => p.choices[idx]).join(" / ")}`;
        return `Q${i+1}: ${p.choices[p.a]}`;
      }).join("\n");
    }
    let html = `<div><span class="label">問題</span>${esc(q.q)}</div>`;
    if (q.context) {
      const c = Array.isArray(q.context) ? q.context.join("\n") : q.context;
      html += `<div style="margin-top:6px;white-space:pre-wrap"><span class="label">前提</span>${esc(c)}</div>`;
    }
    html += `<div style="margin-top:6px"><span class="label">あなたの回答</span>${esc(String(userStr))}</div>`;
    html += `<div style="margin-top:6px;white-space:pre-wrap"><span class="label">正答</span>${esc(String(correctStr))}</div>`;
    html += `<div style="margin-top:8px;white-space:pre-wrap"><span class="label">解説</span>${esc(q.explain || "")}</div>`;
    if (q.type === "scenario" && q.parts) {
      q.parts.forEach((p, i) => {
        if (p.explain) html += `<div style="margin-top:6px;white-space:pre-wrap"><span class="label">Q${i+1} 解説</span>${esc(p.explain)}</div>`;
      });
    }
    return html;
  }

  // 初期化
  function init() {
    if (!window.QUIZ || !window.QUIZ.questions || window.QUIZ.questions.length === 0) {
      document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#c9d1d9;font-family:sans-serif">問題データの読み込みに失敗しました。</div>';
      return;
    }
    Util.byId("btn-home").addEventListener("click", renderHome);
    Util.byId("btn-reset-progress").addEventListener("click", () => {
      if (confirm("学習履歴を全て削除します。よろしいですか？")) {
        State.reset();
        renderHome();
      }
    });
    Util.byId("btn-export").addEventListener("click", () => {
      const data = State.load();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aws-cost-dojo-progress.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });
    renderHome();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.App = App;
})();
