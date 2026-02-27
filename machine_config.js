// machine_config.js
const MACHINE_CONFIG = {
  // pMAX base values
  pmax_screw: 175,
  pmax_kanashiki: 210,

  // Screw input range
  screw_min: 18,
  screw_max: 52,

  // Display constants (NOT used in pMAX=175 calc; used in route formulas)
  F_display: 53,        // F = 34 + 19（表示上の定数）
  screw18_display: 18,  // 表示のみ

  // Kanashiki buttons
  kanashiki_values: [5, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 27, 30, 33, 34, 39],
  kanashiki_max_pieces: 3,
  kanashiki_allow_duplicates: false,

  // Promotion (LEVEL1 only)
  promote_streak: 5,

  // Level definitions
  levels: [
    { key: "LEVEL1-1", label: "LEVEL1-1", designRange: [123, 157], pmaxMode: "CHOICE" },
    { key: "LEVEL1-2", label: "LEVEL1-2", designRange: [79, 122],  pmaxMode: "FIX_175" },
    { key: "LEVEL1-3", label: "LEVEL1-3", designRange: [158, 210], pmaxMode: "FIX_210" },

    // LEVEL2 split
    // base帯：79〜210 → 実帯： (79+ram)〜(210+ram)
    { key: "LEVEL2-1", label: "LEVEL2-1（ラム/175）", designRange: [79, 210], pmaxMode: "FIX_175" },
    { key: "LEVEL2-2", label: "LEVEL2-2（ラム/210）", designRange: [79, 210], pmaxMode: "FIX_210" }
  ],

  // RAM config (LEVEL2 only)
  ram: {
    enabled_level_keys: ["LEVEL2-1", "LEVEL2-2"],
    step: 5,
    min: -20,
    max: 30,

    // 1セット=3問（確定）
    questions_per_set: 3,

    // 順番固定で巡回
    cycle_mm: [-5, -10, 5, 10, 15],

    // UIはロック表示（表示のみ、操作不可）
    ui_locked: true
  }
};