/* 共通ユーティリティ */
(function () {
  const Util = {};

  Util.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  Util.pick = function (arr, n) {
    return Util.shuffle(arr).slice(0, n);
  };

  Util.escapeHtml = function (str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // 数値判定: tolerance を考慮
  Util.numericMatch = function (input, expected, tolerance) {
    const x = parseFloat(input);
    if (Number.isNaN(x)) return false;
    const tol = tolerance || 0;
    return Math.abs(x - expected) <= tol + 1e-9;
  };

  // 文字列判定: 配列内の候補と一致 (大文字小文字/前後空白を無視)
  Util.textMatch = function (input, accepted) {
    const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
    const x = norm(input);
    return accepted.some((a) => norm(a) === x);
  };

  // 配列比較: 要素を sort して厳密比較
  Util.arraysEqual = function (a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    const sa = a.slice().sort((x, y) => x - y);
    const sb = b.slice().sort((x, y) => x - y);
    return sa.every((v, i) => v === sb[i]);
  };

  Util.byId = (id) => document.getElementById(id);

  Util.el = function (tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === "class") e.className = attrs[k];
        else if (k === "html") e.innerHTML = attrs[k];
        else if (k === "text") e.textContent = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") {
          e.addEventListener(k.substring(2), attrs[k]);
        } else if (attrs[k] != null) {
          e.setAttribute(k, attrs[k]);
        }
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null) return;
        e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return e;
  };

  window.Util = Util;
})();
