// engine.js
// ============================================
// 粗地高さゲーム エンジン
// - 目標(target)生成（成立フィルタあり）
// - 検算ルート eval（PASS/FAIL/NA）
// - 黒板表示（3段固定）※判定前は答えを隠す対応
// ============================================
//
// 表記（内部変数）
// target   : 粗地高さ（target）
// base_pmax: 最大高さ（base_pMAX） 175 or 210
// ram      : ラム（ram）
// pmax'    : 最大高さ±ラム（pMAX'） = base_pMAX + ram
// adjust   : 調整値（adjust） = pMAX' - target
// s_value  : ねじ値（s_value）
// k_value  : 金敷合計値（k_value）
//
// add1 = k - F
// add2 = s - screw_MIN
//
// check_cal1:
//   base=175: (s == adjust) AND (k == F)   ← ズル防止（F前提）
//   base=210: F + add1 == adjust  <=> k == adjust
// check_cal2: s + add1 == adjust
// check_cal3: add2 + k == adjust
//
// ルート有効化（現状）
// - LEVEL1-1: base=175 -> cal1のみ / base=210 -> cal1,2,3（OR）
// - LEVEL1-2: cal2のみ
// - LEVEL1-3: cal3のみ
// - LEVEL2-1: cal1のみ
// - LEVEL2-2: cal1,2,3（OR）
// - LEVEL3-1: cal1のみ（当て物/175）
// - LEVEL3-2: cal1,2,3（当て物/210）
//
// ============================================
// ===== <LEVEL3用の箱（将来拡張）> =====
// - 成立ルート表示の強調
// - 当て物を絡めた「X = target or target+pad」説明
// ============================================
//
// ============================================
// ===== <LEVEL4用の箱（将来拡張）> =====
// - 175/210混在 + ラム混在 + 反復（無制限）
// ============================================

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calcAdjust(pmaxPrime, target) {
  return pmaxPrime - target;
}

function inRangeInt(v, min, max) {
  return Number.isInteger(v) && v >= min && v <= max;
}

// =========================
// ===== 当て物ヘルパー =====
// UI側(index)で「注記」を作るための共通関数
// （表示targetは変えず、内部計算だけeffective_targetにする方針）
// =========================
function calcEffectiveTargetForAte({ target, pad_mm, pressStage }) {
  // pressStage=1: effective_target = target
  // pressStage=2: effective_target = target + pad_mm
  if (pressStage === 2) return target + (pad_mm || 0);
  return target;
}

function makeAteNote({ target, pad_mm, pressStage }) {
  if (!pressStage || pressStage === 1) {
    return `※当て物：${pad_mm}mm / プレス1回目（内部計算は target のまま）`;
  }
  const eff = target + (pad_mm || 0);
  return `※当て物：${pad_mm}mm / プレス2回目（内部計算：target+${pad_mm} → ${eff}）`;
}

// =========================
// ===== 金敷合計候補 =====
// =========================
function buildKanashikiPossibleSums() {
  const vals = MACHINE_CONFIG.kanashiki_values.slice().sort((a, b) => a - b);
  const maxPieces = MACHINE_CONFIG.kanashiki_max_pieces;
  const allowDup = !!MACHINE_CONFIG.kanashiki_allow_duplicates;

  const set = new Set();
  set.add(0); // 「選ばない」＝0 を許容（練習用）

  for (let i = 0; i < vals.length; i++) set.add(vals[i]);

  if (maxPieces >= 2) {
    for (let i = 0; i < vals.length; i++) {
      for (let j = 0; j < vals.length; j++) {
        if (!allowDup) {
          if (j <= i) continue;
        }
        set.add(vals[i] + vals[j]);
      }
    }
  }

  if (maxPieces >= 3) {
    for (let i = 0; i < vals.length; i++) {
      for (let j = 0; j < vals.length; j++) {
        for (let k = 0; k < vals.length; k++) {
          if (!allowDup) {
            if (!(i < j && j < k)) continue;
          }
          set.add(vals[i] + vals[j] + vals[k]);
        }
      }
    }
  }

  return { set, list: Array.from(set).sort((a, b) => a - b) };
}
const KSUMS = buildKanashikiPossibleSums();

// =========================
// ===== ルート有効化 =====
// =========================
function getActiveRoutes(levelKey, basePmax) {
  if (levelKey === "LEVEL1-1") {
    if (basePmax === MACHINE_CONFIG.pmax_screw) return ["cal1"];
    return ["cal1", "cal2", "cal3"];
  }
  if (levelKey === "LEVEL1-2") return ["cal2"];
  if (levelKey === "LEVEL1-3") return ["cal3"];

  if (levelKey === "LEVEL2-1") return ["cal1"];
  if (levelKey === "LEVEL2-2") return ["cal1", "cal2", "cal3"];

  // ---- LEVEL3（当て物） ----
  if (levelKey === "LEVEL3-1") return ["cal1"];
  if (levelKey === "LEVEL3-2") return ["cal1", "cal2", "cal3"];

  return ["cal1"];
}

// =========================
// ===== ルート評価 =====
// =========================
function evalRoutes({ levelKey, base_pmax, pmax_prime, target, s_value, k_value }) {
  const adjust = calcAdjust(pmax_prime, target);

  const F = MACHINE_CONFIG.F_display;
  const screwMin = MACHINE_CONFIG.screw_min;

  const add1 = k_value - F;
  const add2 = s_value - screwMin;

  const active = getActiveRoutes(levelKey, base_pmax);
  const isInactive = (k) => !active.includes(k);

  const results = { cal1: "NA", cal2: "NA", cal3: "NA" };

  // cal1
  if (!isInactive("cal1")) {
    if (base_pmax === MACHINE_CONFIG.pmax_screw) {
      // 175側：F前提（k==F）を追加してズル防止
      results.cal1 = (s_value === adjust && k_value === F) ? "PASS" : "FAIL";
    } else {
      results.cal1 = ((F + add1) === adjust) ? "PASS" : "FAIL"; // <=> k==adjust
    }
  }

  // cal2
  if (!isInactive("cal2")) {
    results.cal2 = ((s_value + add1) === adjust) ? "PASS" : "FAIL";
  }

  // cal3
  if (!isInactive("cal3")) {
    results.cal3 = ((add2 + k_value) === adjust) ? "PASS" : "FAIL";
  }

  const activeResults = active.map(r => results[r]);
  const anyPass = activeResults.includes("PASS");
  const allNA = activeResults.every(x => x === "NA");

  return {
    adjust,
    add1,
    add2,
    results,
    activeRoutes: active,
    isCorrect: anyPass && !allNA,
    isBroken: allNA
  };
}

// =========================
// ===== 成立フィルタ（LEVEL1/2/3用）=====
// 注意：ここで使う target は「計算用target」前提
//       （当て物2回目なら effective_target を渡す設計）
// =========================
function isSolvableTarget({ levelKey, base_pmax, pmax_prime, target }) {
  const adjust = calcAdjust(pmax_prime, target);
  if (adjust < 0) return false;

  const screwMin = MACHINE_CONFIG.screw_min;
  const screwMax = MACHINE_CONFIG.screw_max;
  const F = MACHINE_CONFIG.F_display;

  const active = getActiveRoutes(levelKey, base_pmax);

  function existsKforS(calcS) {
    for (const k of KSUMS.list) {
      const s = calcS(k);
      if (inRangeInt(s, screwMin, screwMax)) return true;
    }
    return false;
  }

  for (const route of active) {
    if (route === "cal1") {
      if (base_pmax === MACHINE_CONFIG.pmax_screw) {
        // 175側：adjustがねじ範囲に入っていればOK（kはF前提）
        if (inRangeInt(adjust, screwMin, screwMax)) return true;
      } else {
        if (KSUMS.set.has(adjust)) return true;
      }
    }

    if (route === "cal2") {
      // s + (k - F) = adjust  => s = adjust - k + F
      if (existsKforS((k) => adjust - k + F)) return true;
    }

    if (route === "cal3") {
      // (s - screwMin) + k = adjust => s = adjust - k + screwMin
      if (existsKforS((k) => adjust - k + screwMin)) return true;
    }
  }

  return false;
}

// =========================
// ===== target帯（LEVEL2はramで平行移動）=====
// =========================
function getDesignRange({ levelKey, ram }) {
  const lv = MACHINE_CONFIG.levels.find(x => x.key === levelKey);
  if (!lv) return [0, 0];
  const [a, b] = lv.designRange;

  if (levelKey === "LEVEL2-1" || levelKey === "LEVEL2-2") {
    return [a + (ram || 0), b + (ram || 0)];
  }
  // LEVEL3（当て物）は target帯をそのまま扱う（effective_targetはUI側で対応）
  return [a, b];
}

// =========================
// ===== target生成（同一target連続禁止）=====
// =========================
function buildCandidates({ levelKey, base_pmax, pmax_prime, ram }) {
  const [minT, maxT] = getDesignRange({ levelKey, ram });
  const arr = [];
  for (let t = minT; t <= maxT; t++) {
    if (isSolvableTarget({ levelKey, base_pmax, pmax_prime, target: t })) arr.push(t);
  }
  return arr;
}

function generateTarget({ levelKey, base_pmax, pmax_prime, ram, prevTarget }) {
  const candidates = buildCandidates({ levelKey, base_pmax, pmax_prime, ram });
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  let t = candidates[randomInt(0, candidates.length - 1)];
  for (let i = 0; i < 40 && prevTarget != null && t === prevTarget; i++) {
    t = candidates[randomInt(0, candidates.length - 1)];
  }
  return t;
}

// =========================
// ===== 黒板（3段固定）=====
// - 判定前：revealAdjust=false で答えを隠す
// - 判定後：revealAdjust=true で答えを表示
// =========================
function makeBlackboard({ target, pmaxPrime, revealAdjust = true }) {
  const adjust = calcAdjust(pmaxPrime, target);

  const line1 = `粗地高さ（target） = ${target}`;

  if (revealAdjust) {
    const line2 = `調整値（adjust） = ${pmaxPrime} - ${target} = ${adjust}`;
    const line3 = `検算：${target} + ${adjust} = ${pmaxPrime}`;
    return { text: [line1, line2, line3].join("\n"), adjust };
  } else {
    const line2 = `調整値（adjust） = ${pmaxPrime} - ${target} = ?`;
    const line3 = `検算：${target} + ? = ${pmaxPrime}`;
    return { text: [line1, line2, line3].join("\n"), adjust };
  }
}