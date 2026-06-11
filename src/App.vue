<template>
  <div class="app-container">
    <!-- ===== 左侧表单区 ===== -->
    <main class="form-area">
      <h1 class="app-title">日本高度人才签证模拟算分系统</h1>
      <p class="app-subtitle">Japan Highly Skilled Foreign Professional Visa Points Calculator</p>

      <!-- ============ 步骤1: 领域选择 ============ -->
      <div class="card">
        <h2 class="card-title"><span class="step-badge">1</span> 选择申请领域（イ/ロ/ハ）</h2>
        <div class="field-options">
          <label
            v-for="f in FIELD_OPTIONS"
            :key="f.value"
            class="field-radio"
            :class="{ active: formData.field === f.value }"
          >
            <input type="radio" :value="f.value" v-model="formData.field" class="sr-only" />
            <span class="field-label">{{ f.label }}</span>
            <span class="field-sub">{{ f.sub }}</span>
          </label>
        </div>
      </div>

      <!-- ============ 步骤2: 基本项 ============ -->
      <div class="card" v-if="formData.field">
        <h2 class="card-title"><span class="step-badge">2</span> 基本项</h2>

        <!-- 学历（注１） -->
        <div class="form-group">
          <label class="form-label">学历（注１：最终学历为对象，不可叠加）</label>
          <select v-model="formData.education" class="form-select">
            <option value="">-- 请选择 --</option>
            <option v-for="e in currentEducationOptions" :key="e.id" :value="e.id">
              {{ e.label }} — +{{ e.points }}分
            </option>
          </select>
          <label class="checkbox-row">
            <input type="checkbox" v-model="formData.dualDegree" />
            <span>{{ EDUCATION_POINTS.dual_degree.label }} (+5分，可与最终学历叠加)</span>
          </label>
        </div>

        <!-- 职历 -->
        <div class="form-group">
          <label class="form-label">職歴</label>
          <select v-model="formData.careerYears" class="form-select">
            <option value="">-- 请选择 --</option>
            <option v-for="c in currentCareerOptions" :key="c.minYears" :value="c.minYears">
              {{ c.label }} — +{{ c.points }}分
            </option>
          </select>
        </div>

        <!-- 年收 -->
        <div class="form-group">
          <label class="form-label">
            年収（万円）
            <span v-if="formData.field === 'technical' || formData.field === 'management'" class="required-hint">
              注：不足{{ MIN_INCOME_THRESHOLD }}万円不予认定
            </span>
            <span v-if="formData.field === 'management'" class="field-hint ms-2">
              ハ无年龄区分，纯按年收档位打分
            </span>
          </label>
          <input
            type="number"
            v-model.number="formData.annualIncome"
            class="form-input"
            placeholder="例如: 500"
            min="0"
          />
        </div>

        <!-- 年龄段（イ/ロのみ） -->
        <div class="form-group" v-if="formData.field !== 'management'">
          <label class="form-label">
            年齢（年收联动查表 + 独立年龄加分）
            <span class="field-hint ms-2">30未満:15分 / 30~34:10分 / 35~39:5分</span>
          </label>
          <select v-model="formData.ageGroup" class="form-select">
            <option value="">-- 请选择 --</option>
            <option v-for="g in AGE_GROUPS" :key="g.value" :value="g.value">{{ g.label }}</option>
          </select>
        </div>
      </div>

      <!-- ============ 步骤3: 研究实绩 & 资格 ============ -->
      <div class="card" v-if="formData.field">
        <h2 class="card-title">
          <span class="step-badge">3</span>
          研究实绩 / 资格
          <span class="step-meta">
            <template v-if="formData.field === 'academic'">イ：④⑤⑥固定20分 + ⑦单独25分</template>
            <template v-else-if="formData.field === 'technical'">ロ：研究实绩固定15分 / 资格5~10分</template>
            <template v-else>ハ：无此项</template>
          </span>
        </h2>

        <!-- 研究实绩（イ/ロ专用） -->
        <template v-if="formData.field === 'academic' || formData.field === 'technical'">
          <div class="form-group">
            <label class="form-label">研究実績（④~⑦）</label>
            <p class="form-hint warn" v-if="formData.field === 'academic'">
              イ：④⑤⑥单项20分，2项以上也仅20分；⑦独立25分，可叠加
            </p>
            <p class="form-hint warn" v-else>
              ロ：④~⑦全部归为一组，1项以上 → 固定15分
            </p>
            <label v-for="r in RESEARCH_ITEMS" :key="r.id" class="checkbox-row">
              <input type="checkbox" :value="r.id" v-model="formData.researchAchievements" />
              <span>{{ r.label }} (单项{{ r.points }}分)</span>
            </label>
          </div>
        </template>

        <!-- 资格（⑧）— ロ专用 -->
        <div class="form-group" v-if="formData.field === 'technical'">
          <label class="form-label">資格（⑧）</label>
          <label v-for="q in QUALIFICATIONS" :key="q.id" class="checkbox-row radio-like">
            <input type="radio" name="qualificationLevel" :value="q.id" v-model="formData.qualificationLevel" />
            <span>{{ q.label }} — +{{ q.points }}分</span>
          </label>
        </div>
      </div>

      <!-- ============ 步骤4: 特别加算（机构） ============ -->
      <div class="card" v-if="formData.field">
        <h2 class="card-title"><span class="step-badge">4</span> 特別加算 — 機構（⑨~⑫）</h2>
        <label v-for="ib in INSTITUTION_BONUSES" :key="ib.id" class="checkbox-row">
          <input type="checkbox" :value="ib.id" v-model="formData.institutionBonuses" />
          <span>{{ ib.label }} — +{{ ib.points }}分</span>
        </label>
      </div>

      <!-- ============ 步骤5: 地位（ハ专用 ⑳） ============ -->
      <div class="card" v-if="formData.field === 'management'">
        <h2 class="card-title"><span class="step-badge">5</span> 地位（⑳）— ハ专用</h2>
        <label v-for="p in POSITION_BONUS_MANAGEMENT" :key="p.id" class="checkbox-row radio-like">
          <input type="radio" name="managementPosition" :value="p.id" v-model="formData.managementPosition" />
          <span>{{ p.label }} — +{{ p.points }}分</span>
        </label>
      </div>

      <!-- ============ 步骤6: 特别加算（个人属性 ⑬~㉑） ============ -->
      <div class="card" v-if="formData.field">
        <h2 class="card-title"><span class="step-badge">{{ formData.field === 'management' ? '6' : '5' }}</span> 特別加算 — 個人属性（⑬~㉑）</h2>

        <!-- ⑬ 外国资格 -->
        <label class="checkbox-row">
          <input type="checkbox" v-model="formData.hasForeignQual" />
          <span>{{ PERSONAL_BONUSES.foreign_qual.label }} — +{{ PERSONAL_BONUSES.foreign_qual.points }}分</span>
        </label>

        <!-- ⑭ 日本大学 -->
        <label class="checkbox-row">
          <input type="checkbox" v-model="formData.hasJapanDegree" />
          <span>{{ PERSONAL_BONUSES.japan_degree.label }} — +{{ PERSONAL_BONUSES.japan_degree.points }}分</span>
        </label>

        <!-- ⑮ 日语能力 N1/N2 互斥 -->
        <div class="form-group">
          <label class="form-label">⑮ 日本語能力（N1/N2互斥，N2不能与⑭/N1同时选择）</label>
          <select v-model="formData.japaneseLevel" class="form-select">
            <option value="">-- 不适用 --</option>
            <option value="n1">⑮-Ⅰ N1合格相当 — +15分</option>
            <option value="n2" :disabled="formData.hasJapanDegree">
              ⑮-Ⅱ N2合格相当 — +10分{{ formData.hasJapanDegree ? ' (已选⑭，N2不可用)' : '' }}
            </option>
          </select>
        </div>

        <!-- ⑯ 成长分野 -->
        <label class="checkbox-row">
          <input type="checkbox" v-model="formData.hasGrowthProject" />
          <span>{{ PERSONAL_BONUSES.growth_project.label }} — +{{ PERSONAL_BONUSES.growth_project.points }}分</span>
        </label>

        <!-- ⑰ 指定大学（与⑭可重叠） -->
        <label class="checkbox-row">
          <input type="checkbox" v-model="formData.hasTopUniversity" />
          <span>{{ PERSONAL_BONUSES.top_university.label }} — +{{ PERSONAL_BONUSES.top_university.points }}分（与⑭重複加算可）</span>
        </label>

        <!-- ⑱ JICA研修（与⑭不可重叠） -->
        <label class="checkbox-row">
          <input type="checkbox" v-model="formData.hasJicaTraining" :disabled="formData.hasJapanDegree" />
          <span>
            {{ PERSONAL_BONUSES.jica_training.label }} — +{{ PERSONAL_BONUSES.jica_training.points }}分
            <span v-if="formData.hasJapanDegree" class="required-hint">（已选⑭，不可重叠）</span>
          </span>
        </label>

        <!-- ⑲ 1亿日元投资 — ハ专用 -->
        <label class="checkbox-row" v-if="formData.field === 'management'">
          <input type="checkbox" v-model="formData.hasInvestment1oku" />
          <span>{{ PERSONAL_BONUSES.investment_1oku.label }} — +{{ PERSONAL_BONUSES.investment_1oku.points }}分</span>
        </label>

        <!-- ㉑ 投资运用业 — ロ & ハ -->
        <label class="checkbox-row" v-if="formData.field === 'technical' || formData.field === 'management'">
          <input type="checkbox" v-model="formData.hasInvestmentBiz" />
          <span>{{ PERSONAL_BONUSES.investment_biz.label }} — +{{ PERSONAL_BONUSES.investment_biz.points }}分</span>
        </label>
      </div>
    </main>

    <!-- ===== 右侧分数看板 ===== -->
    <aside class="score-panel">
      <div class="panel-inner">
        <h2 class="panel-title">实时分数看板</h2>

        <div class="total-score" :class="resultLevelClass">
          <div class="total-number">{{ result ? result.total : 0 }}</div>
          <div class="total-label">总分 / 分</div>
        </div>

        <!-- 结果提示 -->
        <div v-if="result && result.resultLevel" class="result-message" :class="resultLevelClass">
          <template v-if="result.resultLevel === 'pr'">
            <div class="msg-icon">🎉</div>
            <div class="msg-text">
              <strong>已达到高度人才标准！</strong><br/>
              满1年即可申请永驻 (Permanent Residency)
            </div>
          </template>
          <template v-else-if="result.resultLevel === 'pass'">
            <div class="msg-icon">✅</div>
            <div class="msg-text">
              <strong>已达到高度人才标准！</strong><br/>
              继续累积至80分可满1年申请永驻
            </div>
          </template>
          <template v-else>
            <div class="msg-icon">📋</div>
            <div class="msg-text">
              还未达到<strong>70分</strong>及格线，请继续提升
            </div>
          </template>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill"
              :class="resultLevelClass"
              :style="{ width: Math.min(100, (result ? result.total : 0) / 100 * 100) + '%' }"
            ></div>
          </div>
          <div class="progress-labels">
            <span>0</span>
            <span class="pass-marker">70</span>
            <span class="pr-marker">80</span>
            <span>100</span>
          </div>
        </div>

        <!-- 分数明细 -->
        <div class="score-detail" v-if="result && result.sections.length > 0">
          <h3>得分明细</h3>
          <div v-for="section in result.sections" :key="section.title" class="detail-row">
            <span class="detail-label">{{ section.title }}</span>
            <span class="detail-score">+{{ section.points }}分</span>
            <div v-if="section.breakdown.length" class="detail-item">
              <span v-for="(b, i) in section.breakdown" :key="i" class="item-text">{{ b.item }}</span>
            </div>
          </div>
        </div>
        <div v-else class="panel-empty">
          <p>请在左侧选择领域并填写信息，分数将实时计算显示。</p>
        </div>

        <!-- 警告信息 -->
        <div v-if="result && result.warnings.length > 0" class="warnings">
          <div v-for="(w, i) in result.warnings" :key="i" class="warning-msg">{{ w }}</div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import {
  FIELD_OPTIONS,
  EDUCATION_POINTS,
  CAREER_POINTS,
  AGE_GROUPS,
  AGE_BONUS_POINTS,
  RESEARCH_ITEMS,
  QUALIFICATIONS,
  INSTITUTION_BONUSES,
  PERSONAL_BONUSES,
  POSITION_BONUS_MANAGEMENT,
  MIN_INCOME_THRESHOLD,
} from './constants.js'
import { calculateTotalScore } from './calculator.js'

// 表单数据
const formData = reactive({
  field: '',
  education: '',
  dualDegree: false,
  careerYears: '',
  annualIncome: null,
  ageGroup: '',
  // 研究实绩 & 资格
  researchAchievements: [],
  qualificationLevel: '',
  // 机构
  institutionBonuses: [],
  // 地位（ハ专用）
  managementPosition: '',
  // 个人属性
  hasForeignQual: false,
  hasJapanDegree: false,
  japaneseLevel: '',
  hasGrowthProject: false,
  hasTopUniversity: false,
  hasJicaTraining: false,
  hasInvestment1oku: false,
  hasInvestmentBiz: false,
})

// 当前领域的学历选项
const currentEducationOptions = computed(() =>
  EDUCATION_POINTS[formData.field] || []
)

// 当前领域的职历选项
const currentCareerOptions = computed(() =>
  CAREER_POINTS[formData.field] || []
)

// 计算结果（实时）
const result = computed(() => calculateTotalScore(formData.field, formData))

// 结果等级CSS
const resultLevelClass = computed(() => (result.value ? result.value.resultLevel : ''))
</script>

<style>
/* ============ 全局样式 ============ */
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --primary: #1a56db;
  --primary-light: #e8f0fe;
  --success: #059669;
  --success-light: #ecfdf5;
  --warning: #d97706;
  --warning-light: #fffbeb;
  --danger: #dc2626;
  --danger-light: #fef2f2;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-500: #6b7280;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --radius: 10px;
  --shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #f1f5f9;
  color: var(--gray-800);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.app-container { display: flex; min-height: 100vh; max-width: 1400px; margin: 0 auto; }
.form-area { flex: 1; min-width: 0; padding: 32px 28px 60px; }
.score-panel { width: 380px; flex-shrink: 0; background: #fff; border-left: 1px solid var(--gray-200); position: sticky; top: 0; height: 100vh; overflow-y: auto; }

.app-title { font-size: 1.75rem; font-weight: 700; color: var(--gray-900); margin-bottom: 4px; }
.app-subtitle { font-size: 0.9rem; color: var(--gray-500); margin-bottom: 24px; }

.card { background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); padding: 24px; margin-bottom: 20px; }
.card-title { font-size: 1.1rem; font-weight: 600; color: var(--gray-800); margin-bottom: 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.step-badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
.step-meta { font-size: 0.75rem; font-weight: 400; color: var(--warning); margin-left: auto; }

.field-options { display: flex; flex-direction: column; gap: 10px; }
.field-radio { display: flex; flex-direction: column; padding: 14px 16px; border: 2px solid var(--gray-200); border-radius: var(--radius); cursor: pointer; transition: all 0.15s ease; }
.field-radio:hover { border-color: var(--primary); background: var(--primary-light); }
.field-radio.active { border-color: var(--primary); background: var(--primary-light); }
.field-label { font-weight: 600; font-size: 0.95rem; color: var(--gray-800); }
.field-sub { font-size: 0.78rem; color: var(--gray-500); margin-top: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

.form-group { margin-bottom: 18px; }
.form-label { display: block; font-weight: 600; font-size: 0.88rem; color: var(--gray-700); margin-bottom: 6px; }
.form-select, .form-input { width: 100%; padding: 9px 12px; border: 1.5px solid var(--gray-300); border-radius: 6px; font-size: 0.9rem; color: var(--gray-800); background: #fff; transition: border-color 0.15s; outline: none; }
.form-select:focus, .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(26,86,219,.12); }
.form-hint { font-size: 0.8rem; color: var(--primary); margin-top: 4px; }
.form-hint.warn { color: var(--warning); font-weight: 600; }
.field-hint { font-weight: 400; color: var(--warning); font-size: 0.8rem; }
.required-hint { font-weight: 400; color: var(--danger); font-size: 0.75rem; }
.ms-2 { margin-left: 8px; }

.checkbox-row, .radio-like { display: flex; align-items: flex-start; gap: 8px; padding: 6px 0; cursor: pointer; font-size: 0.88rem; }
.checkbox-row input[type="checkbox"], .radio-like input[type="radio"] { margin-top: 3px; accent-color: var(--primary); width: 16px; height: 16px; flex-shrink: 0; }
.checkbox-row input:disabled, .radio-like input:disabled { opacity: 0.5; cursor: not-allowed; }
.checkbox-row input:disabled + span { opacity: 0.5; }

/* ===== 分数看板 ===== */
.panel-inner { padding: 28px 20px 40px; }
.panel-title { font-size: 1.05rem; font-weight: 700; color: var(--gray-800); margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid var(--gray-100); }
.total-score { text-align: center; padding: 20px 0; border-radius: var(--radius); margin-bottom: 16px; background: var(--gray-50); border: 2px solid var(--gray-200); transition: all 0.3s ease; }
.total-score.pass { background: var(--success-light); border-color: var(--success); }
.total-score.pr { background: #dbeafe; border-color: var(--primary); }
.total-score.fail { background: var(--warning-light); border-color: var(--warning); }
.total-number { font-size: 3rem; font-weight: 800; line-height: 1; color: var(--gray-800); transition: color 0.3s; }
.total-score.pass .total-number { color: var(--success); }
.total-score.pr .total-number { color: var(--primary); }
.total-score.fail .total-number { color: var(--warning); }
.total-label { font-size: 0.85rem; color: var(--gray-500); margin-top: 4px; }

.result-message { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: var(--radius); margin-bottom: 16px; font-size: 0.88rem; line-height: 1.5; }
.result-message.pr { background: #dbeafe; border: 1px solid #93c5fd; }
.result-message.pass { background: var(--success-light); border: 1px solid #6ee7b7; }
.result-message.fail { background: var(--warning-light); border: 1px solid #fcd34d; }
.msg-icon { font-size: 1.4rem; flex-shrink: 0; }
.msg-text strong { color: var(--gray-900); }

.progress-section { margin-bottom: 20px; }
.progress-bar-bg { height: 8px; background: var(--gray-200); border-radius: 10px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 10px; background: var(--warning); transition: width 0.4s ease, background 0.3s; }
.progress-bar-fill.pass { background: var(--success); }
.progress-bar-fill.pr { background: var(--primary); }
.progress-labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--gray-500); margin-top: 4px; }
.pass-marker { color: var(--success); font-weight: 600; }
.pr-marker { color: var(--primary); font-weight: 600; }

.score-detail h3 { font-size: 0.88rem; font-weight: 600; color: var(--gray-700); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--gray-100); }
.detail-row { padding: 6px 0; border-bottom: 1px dashed var(--gray-100); }
.detail-label { font-size: 0.82rem; font-weight: 500; color: var(--gray-700); display: inline-block; min-width: 110px; }
.detail-score { font-size: 0.82rem; font-weight: 700; color: var(--primary); float: right; }
.detail-item { font-size: 0.73rem; color: var(--gray-500); padding-left: 110px; line-height: 1.4; }
.item-text { display: block; }

.panel-empty { text-align: center; padding: 40px 20px; color: var(--gray-500); font-size: 0.88rem; }

.warnings { margin-top: 16px; }
.warning-msg { background: var(--danger-light); border: 1px solid #fca5a5; border-radius: 6px; padding: 10px 12px; font-size: 0.8rem; color: var(--danger); margin-bottom: 8px; line-height: 1.5; }

@media (max-width: 1024px) {
  .app-container { flex-direction: column; }
  .score-panel { width: 100%; height: auto; position: static; border-left: none; border-top: 1px solid var(--gray-200); }
  .form-area { padding: 20px 16px; }
}
</style>
