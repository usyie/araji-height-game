// machine_config.js
// ============================================
// 粗地高さゲーム 設定ファイル
// - ねじ範囲、金敷リスト、レベル定義、ラム巡回設定
// - LEVEL0（原理授業）ステップ＆2択クイズ
// - LEVEL3（当て物）設定（4問セット固定）
// ============================================

const MACHINE_CONFIG = {
  // =========================
  // ===== 定数（共通） =====
  // =========================
  pmax_screw: 175,     // 最大高さ（base_pMAX）
  pmax_kanashiki: 210, // 最大高さ（base_pMAX）

  screw_min: 18,
  screw_max: 52, // 最新修正

  // 表示/計算ルート用
  // F（34+19）
  F_display: 53,

  // =========================
  // ===== 金敷ボタン =====
  // =========================
  kanashiki_values: [5, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 27, 30, 33, 34, 39],
  kanashiki_max_pieces: 3,
  kanashiki_allow_duplicates: false,

  // =========================
  // ===== 昇格条件（LEVEL1）=====
  // =========================
  promote_streak: 5, // 5問連続正解でLEVEL昇格（※現状は表示のみ）

  // =========================
  // ===== レベル定義 =====
  // pmaxMode:
  // - "CHOICE"  : 毎問題ごとに 175/210 選択（LEVEL1-1）
  // - "FIX_175" : base_pMAX=175 固定
  // - "FIX_210" : base_pMAX=210 固定
  // designRange: 粗地高さ（target）帯（LEVEL2はramで平行移動）
  // =========================
  levels: [
    // ---- LEVEL1 ----
    { key: "LEVEL1-1", label: "LEVEL1-1（比較）",     designRange: [123, 157], pmaxMode: "CHOICE"  },
    { key: "LEVEL1-2", label: "LEVEL1-2（175固定）",  designRange: [79, 122],  pmaxMode: "FIX_175" },
    { key: "LEVEL1-3", label: "LEVEL1-3（210固定）",  designRange: [158, 210], pmaxMode: "FIX_210" },

    // ---- LEVEL2（ラム） ----
    { key: "LEVEL2-1", label: "LEVEL2-1（ラム/175）", designRange: [79, 210],  pmaxMode: "FIX_175" },
    { key: "LEVEL2-2", label: "LEVEL2-2（ラム/210）", designRange: [79, 210],  pmaxMode: "FIX_210" },

    // ---- LEVEL3（当て物） ----
    // ラム無し
    // 3-1: base_pMAX=175 固定（cal1想定）
    // 3-2: base_pMAX=210 固定（target帯は計算不可能回避のため 79〜200）
    { key: "LEVEL3-1", label: "LEVEL3-1（当て物/175）", designRange: [79, 210], pmaxMode: "FIX_175" },
    { key: "LEVEL3-2", label: "LEVEL3-2（当て物/210）", designRange: [79, 200], pmaxMode: "FIX_210" }

    // （将来）LEVEL4はここに追加
  ],

  // =========================
  // ===== ラム設定（LEVEL2） =====
  // - 1セット3問
  // - 固定順で巡回
  // =========================
  ram: {
    enabled_level_keys: ["LEVEL2-1", "LEVEL2-2"],
    step: 5,
    min: -20,
    max: 30,
    questions_per_set: 3,
    cycle_mm: [-5, -10, 5, 10, 15],
    ui_locked: true
  },

  // =========================
  // ===== 当て物設定（LEVEL3） =====
  // - 1セット4問（固定順）
  // - 指定：+5 一回目 → +10 一回目 → +5 二回目 → +10 二回目
  // - 表示targetは「元target」のまま（UIで注記を出す）
  //
  // 用語：
  // - pressStage: 1 or 2
  // - pad_mm: 5 or 10
  // - effective_target:
  //   pressStage=1: effective_target = target
  //   pressStage=2: effective_target = target + pad_mm
  // =========================
  ate: {
    enabled_level_keys: ["LEVEL3-1", "LEVEL3-2"],
    questions_per_set: 4,
    cycle: [
      { pad_mm: 5,  pressStage: 1 },
      { pad_mm: 10, pressStage: 1 },
      { pad_mm: 5,  pressStage: 2 },
      { pad_mm: 10, pressStage: 2 }
    ],
    ui_locked: true
  },

  // =========================
  // ===== ヘルプ（？）文言 =====
  // ※現在は「？」UIを撤去しているが、残しても害なし（将来用）
  // =========================
  help_text: {
    "LEVEL1-1": [
      "粗地高さ（target）を見て、調整値（adjust）を作る。",
      "判定後に黒板へ答えが出る。",
      "pMAXラベルをタップで 175/210 切替。"
    ],
    "LEVEL1-2": [
      "175固定。ねじ値（s_value）中心。",
      "金敷はF（34+19）前提。",
      "判定後に黒板へ答えが出る。"
    ],
    "LEVEL1-3": [
      "210固定。金敷合計値（k_value）中心。",
      "金敷は最大3枚・重複不可。",
      "判定後に黒板へ答えが出る。"
    ],
    "LEVEL2-1": [
      "ラムで最大高さ±ラム（pMAX'）が変わる。",
      "3問ごとにラムが変化（固定巡回）。",
      "判定後に黒板へ答えが出る。"
    ],
    "LEVEL2-2": [
      "ラム＋210固定。pMAX'に注意。",
      "3問ごとにラムが変化（固定巡回）。",
      "判定後に黒板へ答えが出る。"
    ],
    "LEVEL3-1": [
      "当て物の厚みとタイミングは固定セットで出る。",
      "表示targetはそのまま。",
      "2回目当て物は内部で target+当て物厚 を使う。"
    ],
    "LEVEL3-2": [
      "当て物の厚みとタイミングは固定セットで出る。",
      "表示targetはそのまま。",
      "2回目当て物は内部で target+当て物厚 を使う。"
    ]
  }
};

// ============================================
// LEVEL0（原理授業）
// - ステップ式（前へ/次へ）
// - 各ステップに2択（正解まで次へ不可）
// - 表記：基本日本語（英語）
// ============================================
MACHINE_CONFIG.level0_steps = [
  {
    title: "LEVEL0-1：基準の完成高さ",
    body: [
      "最大高さ（base_pMAX）は、機械の基準完成高さです。",
      "175 / 210 は「モード」ではなく、完成高さの基準です。"
    ],
    formula: [
      "175成立：F（34+19） + ねじ0 → 完成175",
      "210成立：金敷0 + ねじ18 → 完成210"
    ],
    quiz: {
      q: "最大高さ（base_pMAX）は何を表す？",
      options: ["粗地高さ（target）", "機械の基準完成高さ"],
      answerIndex: 1
    }
  },
  {
    title: "LEVEL0-2：粗地高さと調整値",
    body: [
      "粗地高さ（target）は「作りたい高さ」です。",
      "調整値（adjust）は「完成高さから引いた差」です。"
    ],
    formula: [
      "粗地高さ（target） = 作りたい高さ",
      "調整値（adjust） = base_pMAX - target"
    ],
    quiz: {
      q: "調整値（adjust）の計算はどっち？",
      options: ["target − base_pMAX", "base_pMAX − target"],
      answerIndex: 1
    }
  },
  {
    title: "LEVEL0-3：検算（絶対軸）",
    body: [
      "最後に必ず検算します。",
      "粗地高さ（target）＋調整値（adjust）が完成高さなら正しい。"
    ],
    formula: [
      "検算：target + adjust = base_pMAX"
    ],
    quiz: {
      q: "正しい検算式はどれ？",
      options: ["target + adjust = base_pMAX", "adjust − target = base_pMAX"],
      answerIndex: 0
    }
  },
  {
    title: "LEVEL0-4：調整値の正体（合算）",
    body: [
      "調整値（adjust）は単一要素で作る必要はありません。",
      "金敷合計値（k_value）とねじ値（s_value）の合算で作ります。"
    ],
    formula: [
      "adjust = k_value + s_value"
    ],
    quiz: {
      q: "調整値（adjust）は何で作る？",
      options: ["金敷合計値（k_value）＋ねじ値（s_value）", "金敷合計値（k_value）だけ"],
      answerIndex: 0
    }
  },
  {
    title: "LEVEL0-5：175側の考え方",
    body: [
      "175側はF（34+19）前提で考えます。",
      "ねじ値（s_value）で不足分を吸収します。"
    ],
    formula: [
      "175側：金敷はF（34+19）前提",
      "→ ねじ値（s_value）で調整"
    ],
    quiz: {
      q: "175側の金敷はどう考える？",
      options: ["F（34+19）を前提にする", "金敷は使わない"],
      answerIndex: 0
    }
  },
  {
    title: "LEVEL0-6：210側の考え方",
    body: [
      "210側は金敷合計値（k_value）主体で作ります。",
      "足りない分は、ねじ値（s_value）で吸収してOKです。"
    ],
    formula: [
      "210側：金敷合計値（k_value）主体",
      "→ 不足分をねじ値（s_value）で吸収"
    ],
    quiz: {
      q: "210側の基本思想は？",
      options: ["ねじ値（s_value）主体", "金敷合計値（k_value）主体"],
      answerIndex: 1
    }
  }
];