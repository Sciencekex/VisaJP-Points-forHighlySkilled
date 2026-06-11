# 日本高度人才签证模拟算分系统

Japan Highly Skilled Foreign Professional Visa Points Calculator

[![Deploy to GitHub Pages](https://github.com/Sciencekex/VisaJP-Points-forHighlySkilled/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sciencekex/VisaJP-Points-forHighlySkilled/actions/workflows/deploy.yml)

在线地址：**[https://sciencekex.github.io/VisaJP-Points-forHighlySkilled/](https://sciencekex.github.io/VisaJP-Points-forHighlySkilled/)**

---

## 简介

基于法务省出入国在留管理厅公式「高度専門職ポイント計算表」（令和5年4月1日以降）的在线模拟算分工具。

支持三大申请领域：

| 领域 | 日语 | 对应在留资格 |
|------|------|-------------|
| 高度学术研究（イ） | Advanced Academic Research | 教授、研究 |
| 高度专业/技术（ロ） | Advanced Specialized/Technical | 技術・人文知識・国際業務 |
| 高度经营/管理（ハ） | Advanced Business Management | 経営・管理 |

## 算分覆盖

### 基本项
- **学历（①）** — 最终学历为对象，双学位另加5分
- **職歴（②）** — イ/ロ/ハ 三套不同的年数档位
- **年収（③/④）** — イ/ロ 与年龄段联动查表，ハ 纯收入档位
- **年齢** — イ/ロ 独立年龄加分（30未満15分、30~34:10分、35~39:5分）

### 加分项
| 编号 | 项目 | 适用 |
|------|------|------|
| ④~⑦ | 研究实绩 | イ/ロ |
| ⑧ | 国家资格 | ロ |
| ⑨~⑫ | 机构特别加算 | 共通 |
| ⑬~⑱ | 个人属性加算 | 共通 |
| ⑲ | 1亿日元投资 | ハ |
| ⑳ | 地位 | ハ |
| ㉑ | 投资运用业 | ロ/ハ |

### 官方规则处理
- **N1/N2互斥**：N1(15分)和N2(10分)不可叠加
- **N2排除条件**：已选日本大学毕业或N1者，N2自动不可用
- **研究业绩**：イ ④⑤⑥固定20分 + ⑦独立25分；ロ 全部归组固定15分
- **JICA研修**：与日本大学学位不可重叠加分
- **最低年收基准**：ロ/ハ 需300万日元以上
- **及格线70分** / **永驻快速通道80分**

## 技术栈

- Vue 3 (Composition API + `<script setup>`)
- Vite 5
- 纯 CSS（无 UI 框架依赖）
- GitHub Pages + GitHub Actions 自动部署

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build     # 构建到 dist/
npm run preview   # 预览构建结果
```

## 数据来源

计算逻辑参照法务省出入国在留管理厅公式「高度専門職ポイント計算表」（令和5年4月1日以降），Excel 文件已包含在仓库中（`930001673.xls`）。

### 加点対象大学一览（⑰）

仓库包含法务省公布的官方加分対象大学一览 PDF（2026年1月版）：

`A list of universities for adding points 加点対象となる大学一覧… moj go isa jp-2026 Jan.pdf`

该文件列出了可以在 **特别加算⑰（指定大学毕业）** 中加 10 分的大学名单，包括以下三类：

- **QS / THE / 上海交通大学（ARWU）** 世界大学排名中至少两个榜单进入前 300 位的大学
- 文部科学省 **スーパーグローバル大学創成支援事業**（SGU）补助金交付大学
- 外务省 **イノベーティブ・アジア事業** 伙伴校

注：⑰ 与 ⑭（日本大学卒業）**可以重叠加算**。

### 官方参考资料

| 文件 | 说明 | 来源 |
|------|------|------|
| `930001673.xls` | 高度専門職ポイント計算表（R5.4.1） | [出入国在留管理庁](https://www.moj.go.jp/isa/) |
| `加点対象となる大学一覧.pdf` | ⑰加点対象大学一览（2026年1月） | [出入国在留管理庁](https://www.moj.go.jp/isa/) |

## License

MIT
