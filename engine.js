// engine.js
// 粗地高さゲーム v1.3（LEVEL2-1/LEVEL2-2 分割）
//
// 定義：
// base_pMAX = 175 or 210（世界判定の軸）
// ram(mm) = -20..+30（5mm刻み）※LEVEL2は出題側が固定
// pMAX' = base_pMAX + ram（計算に使う最大高さ）
// adjust = pMAX' - target（絶対軸は維持）
//
// add1 = k - F
// add2 = s - screw_MIN
//
// check_cal1:
//   base=175: s == adjust
//   base=210: F + add1 == adjust  <=> k == adjust
// check_cal2: s + add1 == adjust
// check_cal3: add2 + k == adjust

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calcAdjust(pmaxPrime, target) {
  return pmaxPrime - target;
}

function inRange(v, min, max) {
  return Number.isInteger(v) && v >= min && v <= max;
}

// --- Kanashiki sums (0.., up to N pieces, no duplicates) ---
function buildKanashikiPossibleSums() {
  const vals = MACHINE_CONFIG.kanashiki_values.slice().sort((a, b) => a - b);
  const maxPieces = MACHINE_CONFIG.kanashiki_max_pieces;
  const allowDup = !!MACHINE_CONFIG.kanashiki_allow_duplicates;

  const set = new Set();
  set.add(0); // "no selection" allowed

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

// --- Active routes by spec ---
// ※世界判定は pMAX' ではなく base_pMAX で行う（ここが重要）
function getActiveRoutes(levelKey, basePmax) {
  if (levelKey === "LEVEL1-1") {
    if (basePmax === MACHINE_CONFIG.pmax_screw) return ["cal1"];
    return ["cal1", "cal2", "cal3"];
  }
  if (levelKey === "LEVEL1-2") return ["cal2"];
  if (levelKey === "LEVEL1-3") return ["cal3"];

  // LEVEL2 split
  if (levelKey === "LEVEL2-1") return ["cal1"];                 // 175世界
  if (levelKey === "LEVEL2-2") return ["cal1", "cal2", "cal3"]; // 210世界

  return ["cal1"];
}

// --- Route evaluation (PASS/FAIL/NA) ---
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
      results.cal1 = (s_value === adjust) ? "PASS" : "FAIL";
    } else {
      results.cal1 = ((F + add1) === adjust) ? "PASS" : "FAIL"; // <=> k==adjust
    }
  }

  // cal2
  if (!isInactive("cal2")) results.cal2 = ((s_value + add1) === adjust) ? "PASS" : "FAIL";

  // cal3
  if (!isInactive("cal3")) results.cal3 = ((add2 + k_value) === adjust) ? "PASS" : "FAIL";

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

// --- Solvability checks ---
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
      if (inRange(s, screwMin, screwMax)) return true;
    }
    return false;
  }

  for (const route of active) {
    if (route === "cal1") {
      if (base_pmax === MACHINE_CONFIG.pmax_screw) {
        if (inRange(adjust, screwMin, screwMax)) return true;
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

// LEVELの「設計レンジ」を返す（LEVEL2-1/2-2はramで平行移動）
function getDesignRange({ levelKey, ram }) {
  const lv = MACHINE_CONFIG.levels.find(x => x.key === levelKey);
  if (!lv) return [0, 0];
  const [a, b] = lv.designRange;

  if (levelKey === "LEVEL2-1" || levelKey === "LEVEL2-2") {
    return [a + (ram || 0), b + (ram || 0)];
  }
  return [a, b];
}

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

// Blackboard fixed 3 lines
function makeBlackboard({ target, pmaxPrime }) {
  const adjust = calcAdjust(pmaxPrime, target);
  const line1 = `target = ${target}`;
  const line2 = `adjust = ${pmaxPrime} - ${target} = ${adjust}`;
  const line3 = `検算: ${target} + ${adjust} = ${pmaxPrime}`;
  return { text: [line1, line2, line3].join("\n"), adjust };
}