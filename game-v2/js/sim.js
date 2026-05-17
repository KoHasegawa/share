// game-v2/js/sim.js - Cloud Architect Simulator engine

(function (global) {
  'use strict';

  var DATA = global.SIM_DATA;

  function getService(id) {
    for (var i = 0; i < DATA.SERVICES.length; i++) {
      if (DATA.SERVICES[i].id === id) return DATA.SERVICES[i];
    }
    return null;
  }

  function archHas(arch, feature) {
    for (var i = 0; i < arch.length; i++) {
      var s = getService(arch[i]);
      if (s && s.features.indexOf(feature) >= 0) return true;
    }
    return false;
  }

  function archByLayer(arch, layer) {
    return arch.map(getService).filter(function (s) {
      return s && s.layer === layer;
    });
  }

  function archHasIn(arch, layer, feature) {
    return archByLayer(arch, layer).some(function (s) {
      return s.features.indexOf(feature) >= 0;
    });
  }

  // 1日のトラフィック係数 (平日/週末/曜日リズム)
  function trafficMultiplier(day) {
    // ベース 0.9 - 1.3 の範囲で揺らぐ
    var weekday = day % 7;
    var base = (weekday === 0 || weekday === 6) ? 0.85 : 1.05;
    var noise = Math.sin(day * 0.7) * 0.1;
    return base + noise;
  }

  function checkRequired(arch, caseObj) {
    var missing = [];
    caseObj.required.forEach(function (f) {
      if (!archHas(arch, f)) missing.push(f);
    });
    return missing;
  }

  // 1日分のシミュレーション
  function simulateDay(arch, caseObj, day, scheduledEvent) {
    var log = [];
    var hasAttack = false;
    var azDown = false;
    var dataLoss = false;

    // ベース + ピーク混入 (peakがある日)
    var mult = trafficMultiplier(day);
    var dailyRPS = caseObj.baselineRPS * mult;
    // 月末に向けてゆるやかに増加
    dailyRPS *= (1 + day * 0.005);

    var event = scheduledEvent;
    if (event) {
      if (event.type === 'spike') {
        dailyRPS = caseObj.peakRPS * (0.9 + Math.random() * 0.3);
        log.push('📈 トラフィックスパイク発生 (' + Math.round(dailyRPS) + ' RPS)');
      } else if (event.type === 'ddos') {
        hasAttack = true;
        log.push('🛡 DDoS攻撃検知');
      } else if (event.type === 'az_down') {
        azDown = true;
        log.push('⚠ AZ障害発生');
      } else if (event.type === 'data_loss') {
        dataLoss = true;
        log.push('💾 データ破損イベント発生');
      }
    }

    var attackRPS = hasAttack ? dailyRPS * 4 : 0;
    var totalIncoming = dailyRPS + attackRPS;
    var passedRPS = totalIncoming;
    var blocked = 0;

    // === エッジ層 ===
    if (!archHasIn(arch, 'edge', 'dns')) {
      log.push('❌ DNS未設定: 名前解決できず全リクエスト失敗');
      return finishDay({errors: passedRPS, handled: 0, latency: 9999,
        downtime: 1, cost: dailyCost(arch, 0), log: log, day: day});
    }

    if (hasAttack) {
      if (archHasIn(arch, 'edge', 'waf')) {
        blocked = attackRPS * 0.97;
        passedRPS -= blocked;
        log.push('🛡 WAFが攻撃トラフィックの97%を遮断');
      } else {
        log.push('⚠ WAF未配置: 攻撃トラフィックがそのまま通過');
      }
    }

    var cacheHit = 0;
    if (archHasIn(arch, 'edge', 'cdn')) {
      cacheHit = passedRPS * caseObj.staticRatio;
      passedRPS -= cacheHit;
    }

    // 100%静的サイトかつS3配置済 → S3+CDNが直接サーブ。compute/DB不要
    var pureStatic = caseObj.staticRatio >= 0.99;
    var hasObject = archByLayer(arch, 'data').some(function (s) {
      return s.features.indexOf('object') >= 0;
    });
    if (pureStatic && hasObject) {
      var staticLatency = 50;
      arch.forEach(function (id) {
        var s = getService(id);
        if (s) staticLatency += s.latency;
      });
      return finishDay({
        day: day,
        errors: 0,
        handled: totalIncoming - blocked,
        blocked: blocked,
        incoming: dailyRPS,
        latency: staticLatency,
        downtime: 0,
        cost: dailyCost(arch, totalIncoming - blocked),
        log: log
      });
    }

    // === ネットワーク層 ===
    var albs = archByLayer(arch, 'network').filter(function (s) {
      return s.features.indexOf('lb') >= 0;
    });
    var lbCap = albs.reduce(function (a, s) { return a + s.cap; }, 0);
    var hasLB = albs.length > 0;

    if (hasLB && passedRPS > lbCap) {
      var lbDrop = passedRPS - lbCap;
      log.push('❌ ALB容量超過 (' + Math.round(lbDrop) + ' RPS 喪失)');
      passedRPS = lbCap;
    }

    // === 計算層 ===
    var computeServices = archByLayer(arch, 'compute');
    var servers = computeServices.filter(function (s) {
      return s.features.indexOf('server') >= 0 ||
             s.features.indexOf('container') >= 0;
    });
    var hasAutoScale = computeServices.some(function (s) {
      return s.features.indexOf('autoscale') >= 0;
    });
    var hasServerless = computeServices.some(function (s) {
      return s.features.indexOf('serverless') >= 0;
    });

    var computeCap = servers.reduce(function (a, s) { return a + s.cap; }, 0);
    if (hasAutoScale && hasLB) computeCap *= 3;
    if (hasServerless) computeCap = Math.max(computeCap, 99999);

    if (computeCap === 0) {
      log.push('❌ 計算リソース未配置: 全リクエスト失敗');
      return finishDay({errors: passedRPS, handled: 0, latency: 9999,
        downtime: 1, cost: dailyCost(arch, 0), log: log, day: day});
    }

    // 単一サーバ + ALBなし + 高負荷 → 単一障害点
    if (!hasLB && servers.length > 0 && servers.length === 1 && passedRPS > servers[0].cap * 0.8) {
      log.push('⚠ LBなし単一サーバで負荷集中');
    }

    var computeOverload = 1;
    if (passedRPS > computeCap) {
      var computeDrop = passedRPS - computeCap;
      log.push('❌ 計算容量超過 (' + Math.round(computeDrop) + ' RPS 喪失)');
      computeOverload = passedRPS / computeCap;
      passedRPS = computeCap;
    }

    // === データ層 ===
    var dataServices = archByLayer(arch, 'data');
    var dbs = dataServices.filter(function (s) {
      return s.features.indexOf('rdb') >= 0 || s.features.indexOf('nosql') >= 0;
    });
    var dbCap = dbs.reduce(function (a, s) { return a + s.cap; }, 0);
    var hasCache = dataServices.some(function (s) {
      return s.features.indexOf('cache') >= 0;
    });
    var hasMultiAZ = dataServices.some(function (s) {
      return s.features.indexOf('multi-az') >= 0;
    });
    var hasBackup = dataServices.some(function (s) {
      return s.features.indexOf('backup') >= 0;
    });
    var hasObject = dataServices.some(function (s) {
      return s.features.indexOf('object') >= 0;
    });

    // 静的中心サイトはS3だけで充足
    var needsDB = caseObj.staticRatio < 0.7;

    // AZ障害
    if (azDown) {
      if (!hasMultiAZ && dbs.length > 0) {
        log.push('❌ AZ障害でDB停止: 全リクエスト失敗');
        return finishDay({errors: passedRPS, handled: 0, latency: 9999,
          downtime: 1, cost: dailyCost(arch, 0), log: log, day: day});
      } else if (!hasMultiAZ && !hasObject) {
        log.push('❌ AZ障害でデータ層停止');
        return finishDay({errors: passedRPS, handled: 0, latency: 9999,
          downtime: 1, cost: dailyCost(arch, 0), log: log, day: day});
      } else {
        log.push('✓ Multi-AZ構成で自動フェイルオーバ');
      }
    }

    // データ損失
    if (dataLoss) {
      if (hasBackup && hasMultiAZ) {
        log.push('✓ バックアップ+Multi-AZで高速復旧 (15分停止)');
      } else if (hasBackup) {
        log.push('✓ バックアップから復旧 (2時間停止)');
      } else {
        log.push('❌ バックアップなし: データ損失で1日停止');
        return finishDay({errors: passedRPS, handled: 0, latency: 9999,
          downtime: 1, cost: dailyCost(arch, 0), log: log, day: day});
      }
    }

    var dbRPS = passedRPS;
    if (hasCache) dbRPS *= 0.3;

    if (needsDB && dbCap === 0 && !hasObject) {
      log.push('❌ DB未配置: 動的処理が失敗');
      return finishDay({errors: passedRPS, handled: 0, latency: 9999,
        downtime: 1, cost: dailyCost(arch, 0), log: log, day: day});
    }

    if (dbCap > 0 && dbRPS > dbCap) {
      var dbDrop = dbRPS - dbCap;
      log.push('❌ DB容量超過 (' + Math.round(dbDrop) + ' RPS のクエリ失敗)');
      passedRPS *= (dbCap / dbRPS);
    }

    // === レイテンシ集計 ===
    var latency = 50;  // ベースインターネットレイテンシ
    arch.forEach(function (id) {
      var s = getService(id);
      if (s) latency += s.latency;
    });
    if (hasCache) latency -= 10;
    if (computeOverload > 1) latency *= computeOverload;

    // === 集計 ===
    // handled = compute/DBで処理できた + CDNキャッシュで返した分
    var handled = passedRPS + cacheHit;
    var errors = totalIncoming - handled - blocked;
    if (errors < 0) errors = 0;

    var downtime = 0;
    // Backup + Multi-AZ なら15分、Backupのみなら2時間
    if (dataLoss && hasBackup && hasMultiAZ) downtime = 0.25 / 24;
    else if (dataLoss && hasBackup) downtime = 2 / 24;

    return finishDay({
      day: day,
      errors: errors,
      handled: handled,
      blocked: blocked,
      incoming: dailyRPS,
      latency: latency,
      downtime: downtime,
      cost: dailyCost(arch, handled),
      log: log
    });
  }

  function dailyCost(arch, handledRPS) {
    var fixed = 0;
    var variable = 0;
    arch.forEach(function (id) {
      var s = getService(id);
      if (!s) return;
      fixed += s.cost / 30;  // 月額を日割り
    });
    // Lambdaは使用量で課金 ($0.20 / 1M requests 想定)
    if (archHas(arch, 'serverless')) {
      variable = handledRPS * 86400 * 0.0000002;
    }
    return fixed + variable;
  }

  function finishDay(r) {
    if (!r.log) r.log = [];
    return r;
  }

  // 30日通したシミュレーション
  function runFullSim(arch, caseObj) {
    var missing = checkRequired(arch, caseObj);
    var days = [];
    for (var d = 0; d < DATA.SIM_DAYS; d++) {
      var ev = null;
      for (var i = 0; i < caseObj.events.length; i++) {
        if (caseObj.events[i].day === d) {
          ev = caseObj.events[i];
          break;
        }
      }
      days.push(simulateDay(arch, caseObj, d, ev));
    }

    // 集計
    var totalIncoming = days.reduce(function (a, d) { return a + (d.incoming || 0); }, 0);
    var totalHandled = days.reduce(function (a, d) { return a + (d.handled || 0); }, 0);
    var totalErrors = days.reduce(function (a, d) { return a + (d.errors || 0); }, 0);
    var totalCost = days.reduce(function (a, d) { return a + d.cost; }, 0);
    var totalDowntime = days.reduce(function (a, d) { return a + d.downtime; }, 0);
    var workingDays = days.filter(function (d) { return d.downtime < 1; });
    var avgLatency = workingDays.length
      ? workingDays.reduce(function (a, d) { return a + d.latency; }, 0) / workingDays.length
      : 9999;

    // 空構成は incoming=0 で SLA 100% になってしまうので、必須要素チェックを優先
    var errorRate = totalIncoming > 0 ? (totalErrors / totalIncoming) * 100 : 100;
    if (errorRate > 100) errorRate = 100;
    var sla = 100 - errorRate;
    // 完全停止日もSLAから引く
    sla -= (totalDowntime / DATA.SIM_DAYS) * 100 * 0.5;
    if (sla < 0) sla = 0;

    return {
      days: days,
      missing: missing,
      totals: {
        cost: totalCost,
        sla: sla,
        avgLatency: avgLatency,
        errorRate: errorRate,
        downtime: totalDowntime
      },
      eval: evaluate(caseObj, totalCost, sla, avgLatency, errorRate, missing)
    };
  }

  function evaluate(caseObj, cost, sla, latency, errorRate, missing) {
    var reasons = [];
    var pass = true;

    if (missing.length > 0) {
      pass = false;
      reasons.push('必須要素が不足: ' + missing.join(', '));
    }
    if (cost > caseObj.budget) {
      pass = false;
      reasons.push('予算超過: $' + cost.toFixed(0) + ' / $' + caseObj.budget);
    } else {
      reasons.push('✓ 予算内: $' + cost.toFixed(0) + ' / $' + caseObj.budget);
    }
    if (sla < caseObj.targetSLA) {
      pass = false;
      reasons.push('SLA未達: ' + sla.toFixed(2) + '% / ' + caseObj.targetSLA + '%');
    } else {
      reasons.push('✓ SLA達成: ' + sla.toFixed(2) + '%');
    }
    if (latency > caseObj.targetLatency) {
      pass = false;
      reasons.push('応答時間超過: ' + Math.round(latency) + 'ms / ' + caseObj.targetLatency + 'ms');
    } else {
      reasons.push('✓ 応答時間: ' + Math.round(latency) + 'ms');
    }
    if (errorRate > 1) {
      pass = false;
      reasons.push('エラー率高: ' + errorRate.toFixed(2) + '%');
    }

    // スコア
    var score = 100;
    if (cost > caseObj.budget) score -= Math.min(40, (cost - caseObj.budget) / caseObj.budget * 60);
    if (sla < caseObj.targetSLA) score -= Math.min(50, (caseObj.targetSLA - sla) * 4);
    if (latency > caseObj.targetLatency) score -= Math.min(20, (latency - caseObj.targetLatency) / 10);
    if (missing.length > 0) score -= missing.length * 15;
    if (errorRate > 1) score -= Math.min(40, errorRate * 0.6);
    score = Math.max(0, Math.round(score));

    var rank;
    if (pass && score >= 90) rank = 'S';
    else if (pass && score >= 75) rank = 'A';
    else if (pass) rank = 'B';
    else if (score >= 60) rank = 'C';
    else if (score >= 30) rank = 'D';
    else rank = 'D';

    return {pass: pass, score: score, rank: rank, reasons: reasons};
  }

  global.Sim = {
    runFullSim: runFullSim,
    simulateDay: simulateDay,
    checkRequired: checkRequired,
    getService: getService,
    LAYERS: DATA.LAYERS
  };
})(typeof window !== 'undefined' ? window : globalThis);
