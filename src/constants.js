/**
 * 日本高度人才签证算分系统 - 常量/映射表
 * 数据来源：法務省出入国在留管理庁 公式「高度専門職ポイント計算表」
 * (文件: 930001673.xls, 令和5年4月1日以降)
 */

/** 三大领域 */
export const FIELD_OPTIONS = [
  { value: 'academic',   label: '高度学术研究领域（高度専門職１号イ）',    sub: '(Advanced academic research activities)' },
  { value: 'technical',  label: '高度专业/技术领域（高度専門職１号ロ）',    sub: '(Advanced specialized/technical activities)' },
  { value: 'management', label: '高度经营/管理领域（高度専門職１号ハ）',    sub: '(Advanced business management activities)' },
]

// ===================== 基本项 =====================

/**
 * 学历打分（注１）
 * 注１：最终学历为对象，学历不可叠加（例如有博士和修士学位 → 30分，不是50分）
 * 注２：双学位（不同专业）另加 5分，可与最终学历叠加
 */
export const EDUCATION_POINTS = {
  // --- イ (academic) ---
  academic: [
    { id: 'doctoral',       label: '博士学位（専門職学位を除く）',                 points: 30 },
    { id: 'master',         label: '修士又は専門職学位',                           points: 20 },
    { id: 'bachelor',       label: '大卒又はこれと同等以上の教育（博士・修士を除く）', points: 10 },
  ],
  // --- ロ (technical) --- 注：MBA/MOT 为25分的独立档位
  technical: [
    { id: 'doctoral',       label: '博士学位（専門職学位を除く）',                 points: 30 },
    { id: 'mba_mot',        label: '経営管理に関する専門職学位（MBA・MOT）',       points: 25 },
    { id: 'master',         label: '修士又は専門職学位',                           points: 20 },
    { id: 'bachelor',       label: '大卒又はこれと同等以上の教育（博士・修士を除く）', points: 10 },
  ],
  // --- ハ (management) ---
  management: [
    { id: 'mba_mot',        label: '経営管理に関する専門職学位（MBA・MOT）',       points: 25 },
    { id: 'doctoral_master',label: '博士若しくは修士の学位又は専門職学位',          points: 20 },
    { id: 'bachelor',       label: '大卒又はこれと同等以上の教育（博士・修士を除く）', points: 10 },
  ],
  // 双学位加算（所有领域通用，注２）
  dual_degree: { id: 'dual_degree', label: '複数の分野における2以上の博士・修士・専門職学位（注２）', points: 5 },
}

/**
 * 职历分数
 * イ（学术研究）: 研究/指导/教育实务经验
 * ロ（专业/技术）: 业务实务经验
 * ハ（经营/管理）: 经营/管理实务经验
 */
export const CAREER_POINTS = {
  // イ (academic) — 注：最大7年以上15分，无10年档位
  academic: [
    { minYears: 7,  label: '7年以上',        points: 15 },
    { minYears: 5,  label: '5年以上7年未満',  points: 10 },
    { minYears: 3,  label: '3年以上5年未満',  points: 5  },
    { minYears: 0,  label: '3年未満',         points: 0  },
  ],
  // ロ (technical)
  technical: [
    { minYears: 10, label: '10年以上',         points: 20 },
    { minYears: 7,  label: '7年以上10年未満',  points: 15 },
    { minYears: 5,  label: '5年以上7年未満',   points: 10 },
    { minYears: 3,  label: '3年以上5年未満',   points: 5  },
    { minYears: 0,  label: '3年未満',          points: 0  },
  ],
  // ハ (management)
  management: [
    { minYears: 10, label: '10年以上',         points: 25 },
    { minYears: 7,  label: '7年以上10年未満',  points: 20 },
    { minYears: 5,  label: '5年以上7年未満',   points: 15 },
    { minYears: 3,  label: '3年以上5年未満',   points: 10 },
    { minYears: 0,  label: '3年未満',          points: 0  },
  ],
}

/**
 * 年收配分表（④/③）— イ & ロ 共用
 * 年收分数与年龄段联动，年龄越大年收门槛越高
 * 注：ロ 的场合，年收不满300万日元时即使其他项满70分也不予认定
 */
export const INCOME_TABLE_ACADEMIC_TECH = [
  // minIncome  maxIncome   ~29   30~34   35~39   40~
  [ 1000,      Infinity,   40,    40,     40,     40  ],
  [  900,        999,      35,    35,     35,     35  ],
  [  800,        899,      30,    30,     30,     30  ],
  [  700,        799,      25,    25,     25,      0  ],
  [  600,        699,      20,    20,     20,      0  ],
  [  500,        599,      15,    15,      0,      0  ],
  [  400,        499,      10,     0,      0,      0  ],
  // 400万未満 → 0分
]

/**
 * 年收配分表 — ハ（经营/管理）
 * 注：年收不满300万日元时不予认定（即使其他项满70分）
 * ハ 无年龄段区分，纯按年收档位打分
 */
export const INCOME_TABLE_MANAGEMENT = [
  [ 3000,      Infinity,   50 ],
  [ 2500,        2999,     40 ],
  [ 2000,        2499,     30 ],
  [ 1500,        1999,     20 ],
  [ 1000,        1499,     10 ],
  // 1000万未満 → 0分
]

/** 年龄段选项 */
export const AGE_GROUPS = [
  { value: 'under30',  label: '30歳未満',    column: 0 },
  { value: '30to34',   label: '30～34歳',    column: 1 },
  { value: '35to39',   label: '35～39歳',    column: 2 },
  { value: '40plus',   label: '40歳以上',    column: 3 },
]

/**
 * 年齢（独立加分项）— 仅限 イ & ロ
 * 这是与年收无关的独立年龄加分
 */
export const AGE_BONUS_POINTS = {
  under30:  15,
  '30to34': 10,
  '35to39': 5,
  '40plus': 0,
}

// ===================== 研究实绩（④~⑦） =====================

/** 研究实绩项目 */
export const RESEARCH_ITEMS = [
  { id: 'patent',   label: '④ 発明者として特許を受けた発明が1件以上',                  points: 20 },
  { id: 'grant',    label: '⑤ 外国政府から補助金・競争的資金等を受けた研究に3回以上従事',   points: 20 },
  { id: 'paper',    label: '⑥ 学術論文DB登載の学術雑誌に掲載論文が3本以上（責任著者）',      points: 20 },
  { id: 'other_r',  label: '⑦ その他法務大臣が認める研究実績',                        points: 25 },
]

// ===================== 资格（⑧）— 仅限 ロ =====================

export const QUALIFICATIONS = [
  { id: 'qual_single', label: '業務に関連する日本の国家資格（業務独占・名称独占）又はIT告示試験・資格を1つ保有', points: 5 },
  { id: 'qual_multi',  label: '同上を複数保有', points: 10 },
]

// ===================== 特别加算（⑨~㉑） =====================

/**
 * 特别加算 — 机构相关（⑨~⑫）
 * 共通项目，イ/ロ/ハ 均可
 */
export const INSTITUTION_BONUSES = [
  { id: 'innovation',      label: '⑨ イノベーション促進支援措置を受けている機関',                                        points: 10 },
  { id: 'innovation_sme',  label: '⑩ 上記に該当＋中小企業基本法に規定する中小企業者',                                    points: 10 },
  { id: 'local_gov',       label: '⑪ 地方公共団体が法務大臣認定の高度人材支援措置を受けている機関',                      points: 10 },
  { id: 'rd_3pct',         label: '⑫ 中小企業者で試験研究費等が売上高の3%超',                                          points: 5 },
]

/**
 * 特别加算 — 个人属性/日语/大学等（⑬~⑱, ⑲, ㉑）
 */
export const PERSONAL_BONUSES = {
  // ⑬ 外国资格/表彰 — 共通
  foreign_qual: { id: 'foreign_qual', label: '⑬ 業務に関連する外国の資格・表彰等（法務大臣認定）', points: 5 },

  // ⑭ 日本大学毕业 — 共通
  japan_degree: { id: 'japan_degree', label: '⑭ 日本の大学を卒業又は大学院の課程を修了', points: 10 },

  // ⑮ 日语能力 — 共通
  japanese_n1: { id: 'japanese_n1', label: '⑮-Ⅰ 日本語専攻で外国の大学を卒業又はN1合格相当', points: 15 },
  japanese_n2: { id: 'japanese_n2', label: '⑮-Ⅱ 日本語能力試験N2合格相当 ※⑭・N1該当者を除く', points: 10 },

  // ⑯ 成长分野 — 共通
  growth_project: { id: 'growth_project', label: '⑯ 各省が関与する成長分野の先端プロジェクトに従事', points: 10 },

  // ⑰ 指定大学 — 共通（⑭と重複加算可）
  top_university: { id: 'top_university', label: '⑰ 指定大学卒業（QS/THE/上海交通大300位以内・SGU・Innovative Asia等）', points: 10 },

  // ⑱ JICA研修 — 共通（⑭と重複加算不可）
  jica_training: { id: 'jica_training', label: '⑱ JICAイノベーティブ・アジア研修修了（1年以上）', points: 5 },

  // ⑲ 1亿日元投资 — ハ 专用
  investment_1oku: { id: 'investment_1oku', label: '⑲ 本邦の公私の機関に1億円以上を投資', points: 5 },

  // ㉑ 投资运用业 — ロ & ハ
  investment_biz: { id: 'investment_biz', label: '㉑ 投資運用業等に係る業務に従事', points: 10 },
}

// ===================== 地位（⑳）— ハ专用 =====================

export const POSITION_BONUS_MANAGEMENT = [
  { id: 'rep_director',   label: '代表取締役・代表執行役・代表権のある業務執行社員',          points: 10 },
  { id: 'director',       label: '取締役・執行役・業務執行社員',                              points: 5 },
]

// ===================== 分数阈值 =====================

/** 及格线 */
export const PASS_LINE = 70
/** 永驻快速通道线（满1年即可申请永驻） */
export const PR_LINE = 80
/** 最低年收基准（万日元）— ロ & ハ 适用 */
export const MIN_INCOME_THRESHOLD = 300
