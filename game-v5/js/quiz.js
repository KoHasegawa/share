/* クイズランタイム */
(function () {
  const Quiz = {};

  // 状態
  let session = null;

  // session: {
  //   mode: { id, label },
  //   questions: [],
  //   index: 0,
  //   results: [],   // { qid, correct, userAnswer }
  //   streak: 0,
  //   onFinish: function
  // }

  Quiz.start = function (opts) {
    session = {
      mode: opts.mode,
      questions: opts.questions.slice(),
      index: 0,
      results: [],
      streak: 0,
      onFinish: opts.onFinish || (() => {}),
    };
    if (session.questions.length === 0) {
      alert("対象問題が見つかりませんでした。");
      session.onFinish({ total: 0, correct: 0, results: [], xpGain: 0 });
      return;
    }
    showScreen("screen-quiz");
    Util.byId("btn-home").classList.remove("hidden");
    render();
  };

  function render() {
    const q = session.questions[session.index];
    Util.byId("quiz-mode-label").textContent = session.mode.label;
    Util.byId("quiz-progress").textContent = `${session.index + 1} / ${session.questions.length}`;
    const fill = ((session.index) / session.questions.length) * 100;
    Util.byId("progress-fill").style.width = fill + "%";

    const topicMeta = (window.QUIZ.topics.find((t) => t.id === q.topic) || { name: q.topic, emoji: "📘" });
    Util.byId("quiz-topic").textContent = `${topicMeta.emoji} ${topicMeta.name}`;
    const diff = q.difficulty || 1;
    const diffEl = Util.byId("quiz-difficulty");
    diffEl.textContent = "難易度 " + "★".repeat(diff);
    diffEl.setAttribute("data-diff", String(diff));
    Util.byId("quiz-streak").textContent = `連続 ${session.streak}`;

    const tlabel = Util.byId("quiz-type-label");
    const tnames = { single: "4 択", multi: "複数選択", fill: "入力", scenario: "シナリオ" };
    tlabel.textContent = tnames[q.type] || q.type;
    tlabel.setAttribute("data-type", q.type);

    Util.byId("quiz-question").textContent = q.q || "";
    const ctx = Util.byId("quiz-context");
    if (q.context) {
      ctx.textContent = Array.isArray(q.context) ? q.context.join("\n") : q.context;
      ctx.classList.remove("hidden");
    } else {
      ctx.classList.add("hidden");
    }

    const area = Util.byId("quiz-answer-area");
    area.innerHTML = "";
    Util.byId("quiz-feedback").classList.add("hidden");
    Util.byId("quiz-feedback").innerHTML = "";
    Util.byId("btn-submit-answer").disabled = false;
    Util.byId("btn-submit-answer").textContent = "回答する";

    if (q.type === "single") renderSingle(area, q);
    else if (q.type === "multi") renderMulti(area, q);
    else if (q.type === "fill") renderFill(area, q);
    else if (q.type === "scenario") renderScenario(area, q);

    Util.byId("btn-submit-answer").onclick = onSubmit;
  }

  function makeChoice(idx, text, onClick) {
    const key = String.fromCharCode(65 + idx);
    const c = Util.el("div", { class: "choice", "data-idx": idx }, [
      Util.el("div", { class: "choice-key", text: key }),
      Util.el("div", { class: "choice-text", text: text }),
    ]);
    c.addEventListener("click", onClick);
    return c;
  }

  function renderSingle(area, q) {
    q.choices.forEach((c, i) => {
      const el = makeChoice(i, c, () => {
        area.querySelectorAll(".choice").forEach((x) => x.classList.remove("selected"));
        el.classList.add("selected");
      });
      area.appendChild(el);
    });
  }

  function renderMulti(area, q) {
    const note = Util.el("p", { class: "muted", text: "正解は 2 つ以上あります。クリックで選択 / 解除。" });
    note.style.marginBottom = "10px";
    note.style.fontSize = "12px";
    area.appendChild(note);
    q.choices.forEach((c, i) => {
      const el = makeChoice(i, c, () => {
        el.classList.toggle("selected");
      });
      area.appendChild(el);
    });
  }

  function renderFill(area, q) {
    const wrap = Util.el("div", { class: "fill-input-wrap" });
    const input = Util.el("input", { class: "fill-input", type: q.numeric ? "number" : "text", step: "any", placeholder: q.numeric ? "数値" : "答え" });
    wrap.appendChild(input);
    if (q.unit) wrap.appendChild(Util.el("span", { class: "fill-unit", text: q.unit }));
    area.appendChild(wrap);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); Util.byId("btn-submit-answer").click(); }
    });
    setTimeout(() => input.focus(), 50);
  }

  function renderScenario(area, q) {
    if (!q.parts) return;
    q.parts.forEach((p, pi) => {
      const wrap = Util.el("div", { class: "scenario-part" });
      wrap.appendChild(Util.el("h4", { text: `Q${pi + 1}. ${p.q}` }));
      const partArea = Util.el("div", { class: "answer-area", "data-pidx": pi });
      if (p.type === "multi") {
        const note = Util.el("p", { class: "muted", text: "正解は 2 つ以上あります。" });
        note.style.marginBottom = "8px";
        note.style.fontSize = "12px";
        partArea.appendChild(note);
        p.choices.forEach((c, i) => {
          const key = String.fromCharCode(65 + i);
          const el = Util.el("div", { class: "choice", "data-idx": i }, [
            Util.el("div", { class: "choice-key", text: key }),
            Util.el("div", { class: "choice-text", text: c }),
          ]);
          el.addEventListener("click", () => el.classList.toggle("selected"));
          partArea.appendChild(el);
        });
      } else {
        // single 想定
        p.choices.forEach((c, i) => {
          const key = String.fromCharCode(65 + i);
          const el = Util.el("div", { class: "choice", "data-idx": i }, [
            Util.el("div", { class: "choice-key", text: key }),
            Util.el("div", { class: "choice-text", text: c }),
          ]);
          el.addEventListener("click", () => {
            partArea.querySelectorAll(".choice").forEach((x) => x.classList.remove("selected"));
            el.classList.add("selected");
          });
          partArea.appendChild(el);
        });
      }
      wrap.appendChild(partArea);
      area.appendChild(wrap);
    });
  }

  function evaluate(q) {
    const area = Util.byId("quiz-answer-area");
    if (q.type === "single") {
      const sel = area.querySelector(".choice.selected");
      if (!sel) return { ok: null, msg: "選択肢を 1 つクリックしてください。" };
      const idx = parseInt(sel.getAttribute("data-idx"), 10);
      return { ok: idx === q.a, userIdx: idx };
    }
    if (q.type === "multi") {
      const picks = Array.from(area.querySelectorAll(".choice.selected")).map((e) => parseInt(e.getAttribute("data-idx"), 10));
      if (picks.length < 2) return { ok: null, msg: "選択肢は 2 つ以上選んでください。" };
      return { ok: Util.arraysEqual(picks, q.a), userIdx: picks };
    }
    if (q.type === "fill") {
      const input = area.querySelector(".fill-input");
      const v = input ? input.value.trim() : "";
      if (v === "") return { ok: null, msg: "答えを入力してください。" };
      let ok;
      if (q.numeric) ok = Util.numericMatch(v, q.a, q.tolerance || 0);
      else ok = Util.textMatch(v, Array.isArray(q.a) ? q.a : [q.a]);
      return { ok, userIdx: v };
    }
    if (q.type === "scenario") {
      const parts = Array.from(area.querySelectorAll(".scenario-part"));
      const partResults = [];
      let allOk = true;
      for (let i = 0; i < parts.length; i++) {
        const partArea = parts[i].querySelector(".answer-area");
        const p = q.parts[i];
        let pres;
        if (p.type === "multi") {
          const picks = Array.from(partArea.querySelectorAll(".choice.selected")).map((e) => parseInt(e.getAttribute("data-idx"), 10));
          if (picks.length < 2) return { ok: null, msg: `Q${i + 1} は 2 つ以上選んでください。` };
          pres = { ok: Util.arraysEqual(picks, p.a), user: picks };
        } else {
          const sel = partArea.querySelector(".choice.selected");
          if (!sel) return { ok: null, msg: `Q${i + 1} の選択肢を選んでください。` };
          const idx = parseInt(sel.getAttribute("data-idx"), 10);
          pres = { ok: idx === p.a, user: idx };
        }
        if (!pres.ok) allOk = false;
        partResults.push(pres);
      }
      return { ok: allOk, userIdx: partResults };
    }
    return { ok: false };
  }

  function showFeedback(q, ev) {
    const fb = Util.byId("quiz-feedback");
    fb.classList.remove("hidden", "correct", "wrong");
    fb.classList.add(ev.ok ? "correct" : "wrong");
    const area = Util.byId("quiz-answer-area");
    // 正誤マーキング
    if (q.type === "single") {
      area.querySelectorAll(".choice").forEach((el) => {
        const i = parseInt(el.getAttribute("data-idx"), 10);
        el.classList.add("locked");
        if (i === q.a) el.classList.add("correct");
        if (el.classList.contains("selected") && i !== q.a) el.classList.add("wrong");
      });
    } else if (q.type === "multi") {
      area.querySelectorAll(".choice").forEach((el) => {
        const i = parseInt(el.getAttribute("data-idx"), 10);
        el.classList.add("locked");
        const correctSet = q.a.indexOf(i) >= 0;
        const picked = el.classList.contains("selected");
        if (correctSet) el.classList.add("correct");
        if (!correctSet && picked) el.classList.add("wrong");
      });
    } else if (q.type === "fill") {
      // 表示用ヒント
      const expected = q.numeric
        ? `${q.a}${q.tolerance ? ` (許容±${q.tolerance})` : ""}${q.unit ? " " + q.unit : ""}`
        : (Array.isArray(q.a) ? q.a.join(" / ") : q.a);
      const ans = Util.el("p", { class: "muted", text: `想定回答: ${expected}` });
      ans.style.marginTop = "8px";
      area.appendChild(ans);
    } else if (q.type === "scenario") {
      const parts = Array.from(area.querySelectorAll(".scenario-part"));
      parts.forEach((wrap, pi) => {
        const p = q.parts[pi];
        const partArea = wrap.querySelector(".answer-area");
        partArea.querySelectorAll(".choice").forEach((el) => {
          const i = parseInt(el.getAttribute("data-idx"), 10);
          el.classList.add("locked");
          const correctSet = (p.type === "multi") ? (p.a.indexOf(i) >= 0) : (i === p.a);
          const picked = el.classList.contains("selected");
          if (correctSet) el.classList.add("correct");
          if (!correctSet && picked) el.classList.add("wrong");
        });
        if (p.explain) {
          const ex = Util.el("p", { class: "muted explain", text: "解説: " + p.explain });
          ex.style.marginTop = "8px";
          ex.style.fontSize = "12px";
          partArea.appendChild(ex);
        }
      });
    }
    const head = Util.el("div", { class: "feedback-head", text: ev.ok ? "✓ 正解" : "× 不正解" });
    const body = Util.el("div", { class: "explain", text: q.explain || "" });
    fb.appendChild(head);
    fb.appendChild(body);
  }

  function onSubmit() {
    const q = session.questions[session.index];
    const btn = Util.byId("btn-submit-answer");
    // フェーズ判定: 初回 = 回答 / 次へ = next
    if (btn.dataset.phase === "next") {
      session.index += 1;
      if (session.index >= session.questions.length) {
        return finish();
      }
      btn.dataset.phase = "";
      render();
      return;
    }

    const ev = evaluate(q);
    if (ev.ok === null) {
      alert(ev.msg);
      return;
    }
    if (ev.ok) session.streak += 1;
    else session.streak = 0;

    // 状態反映
    const data = State.load();
    const gain = State.recordAnswer(data, {
      qid: q.id,
      correct: ev.ok,
      difficulty: q.difficulty || 1,
      streak: session.streak,
    });
    State.save(data);

    session.results.push({
      qid: q.id,
      q: q,
      correct: ev.ok,
      user: ev.userIdx,
      xpGain: gain,
    });

    showFeedback(q, ev);
    btn.textContent = (session.index === session.questions.length - 1) ? "結果を見る" : "次へ →";
    btn.dataset.phase = "next";
  }

  function finish() {
    const total = session.results.length;
    const correct = session.results.filter((r) => r.correct).length;
    const xpGain = session.results.reduce((s, r) => s + (r.xpGain || 0), 0);
    const cb = session.onFinish;
    const summary = { total, correct, xpGain, results: session.results, mode: session.mode };
    session = null;
    cb(summary);
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
    Util.byId(id).classList.remove("hidden");
  }

  Quiz.showScreen = showScreen;
  window.Quiz = Quiz;
})();
