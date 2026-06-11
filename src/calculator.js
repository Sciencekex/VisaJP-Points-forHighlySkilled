/**
 * 日本高度人才签证算分系统 - 计算引擎（v2.0）
 * 参照法務省公式「高度専門職ポイント計算表」(930001673.xls) 的完整规则
 * 注①~注⑤，以及各领域特殊规则均在此文件中实现
 */

import {
  EDUCATION_POINTS,
  CAREER_POINTS,
  INCOME_TABLE_ACADEMIC_TECH,
  INCOME_TABLE_MANAGEMENT,
  AGE_GROUPS,
  AGE_BONUS_POINTS,
  RESEARCH_ITEMS,
  QUALIFICATIONS,
  INSTITUTION_BONUSES,
  PERSONAL_BONUSES,
  POSITION_BONUS_MANAGEMENT,
  PASS_LINE,
  PR_LINE,
  MIN_INCOME_THRESHOLD,
} from './constants.js'

// ===================== 辅助函数 =====================

function lookupIncomeScore(income, table, ageColIdx = null) {
  for (const row of table) {
    const minIncome = row[0]
    const maxIncome = row[1]
    if (income >= minIncome && income <= maxIncome) {
      if (ageColIdx !== null) {
        // イ/ロ 的年收表：行后有4列对应年龄段
        return row[2 + ageColIdx] || 0
      }
      // ハ 的年收表：只有一列
      return row[2] || 0
    }
  }
  return 0
}

function getAgeColumnIndex(ageGroupValue) {
  const group = AGE_GROUPS.find(g => g.value === ageGroupValue)
  return group ? group.column : 3
}

// ===================== 基本项计算 =====================

/**
 * 学历分数（注１）
 * 注１：最终学历为对象，单选。双学位（注２）可额外加5分。
 */
export function calcEducationPoints(field, formData) {
  let pts = 0
  const breakdown = []
  const options = EDUCATION_POINTS[field] || []

  if (formData.education) {
    const edu = options.find(e => e.id === formData.education)
    if (edu) {
      pts += edu.points
      breakdown.push({ item: edu.label, points: edu.points })
    }
  }

  // 注２：双学位额外加5分（可与最终学历叠加）
  if (formData.dualDegree) {
    const dd = EDUCATION_POINTS.dual_degree
    pts += dd.points
    breakdown.push({ item: dd.label, points: dd.points })
  }

  return { points: pts, breakdown }
}

/**
 * 职历分数
 * イ与ロ/ハ的职历年数档位不同
 */
export function calcCareerPoints(field, formData) {
  const table = CAREER_POINTS[field] || CAREER_POINTS.academic
  const years = parseInt(formData.careerYears) || 0

  for (const row of table) {
    if (years >= row.minYears) {
      return { points: row.points, breakdown: [{ item: `職歴 ${row.label} (${years}年)`, points: row.points }] }
    }
  }
  return { points: 0, breakdown: [] }
}

/**
 * 年收分数
 * イ/ロ：与年龄联动打表
 * ハ：纯收入档位（无年龄区分）
 * 注：ロ/ハ 年收不满300万 → 不予认定（分数强制为0 + 警告）
 */
export function calcIncomePoints(field, formData) {
  const income = parseInt(formData.annualIncome) || 0

  // 注：ロ & ハ 最低年收基准
  if (field === 'technical' || field === 'management') {
    if (income < MIN_INCOME_THRESHOLD) {
      return {
        points: 0,
        breakdown: [],
        warning: `注：${field === 'management' ? '高度経営・管理（ハ）' : '高度専門・技術（ロ）'}领域年收必须${MIN_INCOME_THRESHOLD}万円以上。当前年收${income}万円 → 年收分数为0，且不予认定。`,
      }
    }
  }

  let pts = 0
  let label = ''

  if (field === 'management') {
    // ハ：无年龄区分，纯收入档位
    pts = lookupIncomeScore(income, INCOME_TABLE_MANAGEMENT)
    label = `年收 ${income}万円`
  } else {
    // イ/ロ：与年龄联动
    const ageCol = getAgeColumnIndex(formData.ageGroup)
    pts = lookupIncomeScore(income, INCOME_TABLE_ACADEMIC_TECH, ageCol)
    const ageLabel = AGE_GROUPS.find(g => g.column === ageCol)?.label || ''
    label = `年收 ${income}万円 / ${ageLabel}`
  }

  return { points: pts, breakdown: [{ item: label, points: pts }] }
}

/**
 * 年齢（独立加分项）
 * 仅限 イ & ロ，年轻者得分：
 * 30未満:15, 30~34:10, 35~39:5, 40+:0
 */
export function calcAgeBonusPoints(field, formData) {
  if (field === 'management') return { points: 0, breakdown: [] }

  if (!formData.ageGroup) return { points: 0, breakdown: [] }

  const pts = AGE_BONUS_POINTS[formData.ageGroup] || 0
  if (pts === 0) return { points: 0, breakdown: [] }

  const label = AGE_GROUPS.find(g => g.value === formData.ageGroup)?.label || ''
  return { points: pts, breakdown: [{ item: `年齢 ${label}`, points: pts }] }
}

// ===================== 研究实绩（④~⑦） =====================

/**
 * 研究实绩（④~⑦）
 * イ (academic):
 *   - ④⑤⑥ 单项 20分，但2项以上 → 仅20分（非叠加）
 *   - ⑦ 独立 25分，可与④⑤⑥叠加
 * ロ (technical):
 *   - ④⑤⑥⑦ 全部归类为同一组
 *   - 有任意1项以上 → 15分（仅15分，不叠加）
 * ハ (management): 无此项
 */
export function calcResearchPoints(field, formData) {
  if (field === 'management') return { points: 0, breakdown: [] }

  const selected = formData.researchAchievements || []
  if (selected.length === 0) return { points: 0, breakdown: [] }

  if (field === 'academic') {
    // イ：拆分④⑤⑥和⑦
    const items456 = selected.filter(id => ['patent', 'grant', 'paper'].includes(id))
    const hasItem7 = selected.includes('other_r')
    let pts = 0
    const breakdown = []

    // ④⑤⑥：有1项20分，2项以上也仅20分
    if (items456.length >= 1) {
      pts += 20
      const names = items456.map(id => RESEARCH_ITEMS.find(r => r.id === id)?.label.split(' ')[0]).join('')
      breakdown.push({ item: `研究実績④⑤⑥ ${items456.length}项該当 → 固定20分`, points: 20 })
    }

    // ⑦：独立25分
    if (hasItem7) {
      pts += 25
      breakdown.push({ item: '⑦ その他法務大臣が認める研究実績', points: 25 })
    }

    return { points: pts, breakdown }
  }

  // ロ (technical)：所有研究实绩归为一组，有任意1项以上 → 15分
  const names = selected.map(id => RESEARCH_ITEMS.find(r => r.id === id)?.label.split(' ')[0]).join('、')
  return {
    points: 15,
    breakdown: [{ item: `研究実績④~⑦ ${selected.length}项該当 → 固定15分（${names}）`, points: 15 }],
  }
}

// ===================== 资格（⑧）— 仅ロ =====================

export function calcQualificationPoints(field, formData) {
  if (field !== 'technical') return { points: 0, breakdown: [] }

  const qualId = formData.qualificationLevel
  if (!qualId) return { points: 0, breakdown: [] }

  const q = QUALIFICATIONS.find(q => q.id === qualId)
  if (!q) return { points: 0, breakdown: [] }

  return { points: q.points, breakdown: [{ item: q.label, points: q.points }] }
}

// ===================== 特别加算 =====================

/**
 * 机构加分（⑨~⑫）
 */
export function calcInstitutionBonuses(field, formData) {
  const items = formData.institutionBonuses || []
  if (items.length === 0) return { points: 0, breakdown: [] }

  let pts = 0
  const breakdown = []
  for (const id of items) {
    const ib = INSTITUTION_BONUSES.find(b => b.id === id)
    if (ib) {
      pts += ib.points
      breakdown.push({ item: ib.label, points: ib.points })
    }
  }
  return { points: pts, breakdown }
}

/**
 * 个人属性加分（⑬~⑱, ⑲, ㉑）
 * 需要处理互斥/排除规则：
 * - N2排除条件：已有⑭（日本大学）或N1者不可选N2
 * - ⑲ 仅ハ可用
 * - ㉑ ロ&ハ可用
 * - ⑱ JICA与⑭不可重叠
 */
export function calcPersonalBonuses(field, formData) {
  let pts = 0
  const breakdown = []
  const warnings = []

  const pb = PERSONAL_BONUSES

  // ⑬ 外国资格/表彰 — 共通
  if (formData.hasForeignQual) {
    pts += pb.foreign_qual.points
    breakdown.push({ item: pb.foreign_qual.label, points: pb.foreign_qual.points })
  }

  // ⑭ 日本大学毕业 — 共通
  const hasJapanDegree = !!formData.hasJapanDegree
  if (hasJapanDegree) {
    pts += pb.japan_degree.points
    breakdown.push({ item: pb.japan_degree.label, points: pb.japan_degree.points })
  }

  // ⑮ 日语能力 — 共通（N1/N2互斥，且N2排除条件）
  const jpLevel = formData.japaneseLevel
  if (jpLevel === 'n1') {
    pts += pb.japanese_n1.points
    breakdown.push({ item: pb.japanese_n1.label, points: pb.japanese_n1.points })
  } else if (jpLevel === 'n2') {
    // N2排除条件：已有⑭或N1 → 不可选N2
    if (hasJapanDegree) {
      warnings.push('注：⑮-Ⅱ N2不适用 — 已选择⑭（日本大学卒業），不可同时获得N2加分。')
    } else {
      pts += pb.japanese_n2.points
      breakdown.push({ item: pb.japanese_n2.label, points: pb.japanese_n2.points })
    }
  }

  // ⑯ 成长分野 — 共通
  if (formData.hasGrowthProject) {
    pts += pb.growth_project.points
    breakdown.push({ item: pb.growth_project.label, points: pb.growth_project.points })
  }

  // ⑰ 指定大学 — 共通（⑭と重複加算可）
  if (formData.hasTopUniversity) {
    pts += pb.top_university.points
    breakdown.push({ item: pb.top_university.label, points: pb.top_university.points })
  }

  // ⑱ JICA研修 — 共通（⑭と重複不可）
  if (formData.hasJicaTraining) {
    if (hasJapanDegree) {
      warnings.push('注：⑱ JICA研修与⑭（日本大学卒業）不可重叠加分，已自动排除⑱。')
    } else {
      pts += pb.jica_training.points
      breakdown.push({ item: pb.jica_training.label, points: pb.jica_training.points })
    }
  }

  // ⑲ 1亿日元投资 — ハ专用
  if (field === 'management' && formData.hasInvestment1oku) {
    pts += pb.investment_1oku.points
    breakdown.push({ item: pb.investment_1oku.label, points: pb.investment_1oku.points })
  }

  // ㉑ 投资运用业 — ロ & ハ
  if ((field === 'technical' || field === 'management') && formData.hasInvestmentBiz) {
    pts += pb.investment_biz.points
    breakdown.push({ item: pb.investment_biz.label, points: pb.investment_biz.points })
  }

  return { points: pts, breakdown, warnings }
}

/**
 * 地位（⑳）— ハ专用
 */
export function calcPositionPointsManagement(field, formData) {
  if (field !== 'management') return { points: 0, breakdown: [] }

  const posId = formData.managementPosition
  if (!posId) return { points: 0, breakdown: [] }

  const p = POSITION_BONUS_MANAGEMENT.find(p => p.id === posId)
  if (!p) return { points: 0, breakdown: [] }

  return { points: p.points, breakdown: [{ item: p.label, points: p.points }] }
}

// ===================== 综合计算 =====================

/**
 * 计算全部得分
 */
export function calculateTotalScore(field, formData) {
  if (!field) {
    return { total: 0, sections: [], warnings: [], resultLevel: null }
  }

  const sections = []
  const warnings = []

  const addSection = (title, result) => {
    if (result.points !== 0 || result.breakdown.length > 0) {
      sections.push({ title, ...result })
    }
    if (result.warnings) {
      warnings.push(...result.warnings)
    }
    if (result.warning) {
      warnings.push(result.warning)
    }
  }

  // === 基本项 ===
  addSection('学历（①）', calcEducationPoints(field, formData))
  addSection('職歴（②）', calcCareerPoints(field, formData))

  const incomeResult = calcIncomePoints(field, formData)
  const incomeTitle = field === 'management' ? '年収（③）' : '年収（③/④）'
  addSection(incomeTitle, incomeResult)

  // 年齢（独立加分）— イ/ロ
  if (field !== 'management') {
    addSection('年齢', calcAgeBonusPoints(field, formData))
  }

  // === 研究实绩（④~⑦）— イ/ロ ===
  addSection('研究実績（④~⑦）', calcResearchPoints(field, formData))

  // === 资格（⑧）— ロ ===
  addSection('資格（⑧）', calcQualificationPoints(field, formData))

  // === 特别加算：机构 ===
  addSection('特別加算（⑨~⑫）', calcInstitutionBonuses(field, formData))

  // === 地位（⑳）— ハ ===
  addSection('地位（⑳）', calcPositionPointsManagement(field, formData))

  // === 特别加算：个人属性 ===
  const personalResult = calcPersonalBonuses(field, formData)
  addSection('特別加算（⑬~㉑）', personalResult)

  const total = sections.reduce((sum, s) => sum + s.points, 0)

  let resultLevel = null
  if (total >= PR_LINE) {
    resultLevel = 'pr'
  } else if (total >= PASS_LINE) {
    resultLevel = 'pass'
  } else {
    resultLevel = 'fail'
  }

  return { total, sections, warnings, resultLevel }
}
