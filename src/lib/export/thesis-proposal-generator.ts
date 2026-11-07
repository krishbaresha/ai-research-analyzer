import { ResearchExplorerData } from "@/types/research-explorer";

export interface ProposalParams {
  explorerData: ResearchExplorerData;
  gapTitle?: string;
  gapProblem?: string;
  proposedTopic?: string;
  plan?: string;
  datasets?: string[];
  baselines?: string[];
}

export function generateThesisProposalContent(params: ProposalParams) {
  const { explorerData, gapTitle, gapProblem, proposedTopic, plan, datasets, baselines } = params;
  const paperTitle = explorerData.identity.title || "Academic Study";
  const projectTitle = proposedTopic || `Investigating ${gapTitle || "Methodological Frontiers"} based on ${paperTitle}`;
  const authors = (explorerData.identity.authors || []).join(", ") || "Published Research Team";
  const year = explorerData.identity.publicationYear || new Date().getFullYear();

  const problemText = gapProblem || explorerData.executiveOverview.problemAddressed;
  const contributionText = explorerData.executiveOverview.technicalContribution;
  const datasetList = datasets && datasets.length > 0 ? datasets.join(", ") : "Standard academic benchmark corpora";
  const baselineList = baselines && baselines.length > 0 ? baselines.join(", ") : "Current state-of-the-art architectures";

  const markdown = `# MASTER / BS THESIS RESEARCH PROPOSAL
## ${projectTitle}

**Academic Track:** Robotics, AI & Computational Intelligence  
**Dated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}  
**Antecedent Research Paper:** *${paperTitle}* (${authors}, ${year})  

---

### 1. PROJECT TITLE & EXECUTIVE SUMMARY
**Proposed Research Title:** ${projectTitle}

**Abstract:**
This research proposal addresses critical methodological boundaries identified in recent scholarly publications, specifically expanding upon *"${paperTitle}"*. While prior work established ${contributionText.slice(0, 160)}, key vulnerabilities remain regarding ${problemText.slice(0, 180)}. This project proposes a rigorous empirical framework utilizing ${baselineList} evaluated across ${datasetList} to advance computational reliability, benchmark generalizability, and reproducible research standards.

---

### 2. PROBLEM STATEMENT & MOTIVATION
Recent advancements have demonstrated significant capability, yet critical research gaps remain unaddressed:
- **Core Limitation:** ${problemText}
- **Intellectual Motivation:** Solving this bottleneck is essential to enable practical, cost-effective, and robust deployment in unconstrained real-world environments.
- **Scope Constraints:** Focuses on reproducible benchmark evaluation, minimizing computational overhead while enhancing accuracy and resilience.

---

### 3. TARGETED RESEARCH QUESTIONS & OBJECTIVES
1. **Research Question 1 (RQ1):** How does the proposed framework perform under uncurated, noisy academic benchmarks compared to ${baselineList}?
2. **Research Question 2 (RQ2):** What is the trade-off between computational resource consumption (inference latency, memory footprint) and task accuracy?
3. **Primary Objective:** Formulate and validate an optimized, open-source architectural extension resolving the documented failure modes.
4. **Secondary Objective:** Establish an open benchmark suite and release verified replication code for the academic community.

---

### 4. PROPOSED METHODOLOGY & WORKFLOW
${plan ? plan : `1. **Phase I - Environment & Baseline Setup:** Replicate core baseline models (${baselineList}) using standard configurations.\n2. **Phase II - Algorithmic Formulation:** Integrate specialized domain-adaptation layers and neuro-symbolic verification guardrails.\n3. **Phase III - Empirical Evaluation:** Execute comprehensive multi-seed trials across ${datasetList}.\n4. **Phase IV - Ablation & Statistical Validation:** Conduct rigorous ablation studies and compute confidence intervals to verify significance.`}

---

### 5. BENCHMARKS, DATASETS & COMPARATIVE CONTROLS
- **Target Datasets:** ${datasetList}
- **Baseline Models:** ${baselineList}
- **Evaluation Metrics:** Accuracy, Precision/Recall, Inference Latency, Memory Usage, and Error Margin Reduction.

---

### 6. EXPECTED CONTRIBUTIONS & DELIVERABLES
1. A novel, validated empirical methodology extending state-of-the-art capabilities.
2. Complete open-source codebase with containerized replication scripts (Docker / PyTorch).
3. A comprehensive experimental report ready for peer-reviewed conference or journal submission.
4. Defense-ready Master's / Bachelor's graduation thesis manuscript.

---

### 7. PROJECT MILESTONES & WORK PLAN
| Month / Milestone | Core Activities & Deliverables | Expected Completion |
|---|---|---|
| **Month 1: Literature Review** | Deep survey of antecedent papers, formulation of formal mathematical model. | Week 4 |
| **Month 2: Baseline Replication** | Baseline benchmark establishment, dataset curation and cleaning pipeline. | Week 8 |
| **Month 3: Architecture Implementation** | Core novel algorithm coding, initial ablation experiments. | Week 12 |
| **Month 4: Comparative Benchmarks** | Full evaluation against state-of-the-art baselines across all datasets. | Week 16 |
| **Month 5: Manuscript Preparation** | Final thesis drafting, peer-review simulation, viva presentation defense. | Week 20 |

---
*Generated by AI Research Analyzer • Academic Research Intelligence Suite*
`;

  return { projectTitle, markdown };
}

/**
 * Triggers direct browser download of a formatted Word (.doc) thesis proposal.
 */
export function downloadThesisProposalDoc(params: ProposalParams) {
  const { projectTitle, markdown } = generateThesisProposalContent(params);

  // Convert markdown to rich styled HTML for Word import
  const htmlBody = markdown
    .split("\n\n")
    .map((block) => {
      if (block.startsWith("# ")) {
        return `<h1 style="color: #0f172a; font-size: 22px; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-top: 10px;">${block.replace("# ", "")}</h1>`;
      }
      if (block.startsWith("## ")) {
        return `<h2 style="color: #1e40af; font-size: 16px; margin-top: 5px; margin-bottom: 15px;">${block.replace("## ", "")}</h2>`;
      }
      if (block.startsWith("### ")) {
        return `<h3 style="color: #0369a1; font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 25px;">${block.replace("### ", "")}</h3>`;
      }
      if (block.startsWith("- ")) {
        const items = block
          .split("\n")
          .map((li) => `<li style="margin-bottom: 6px;">${li.replace(/^-\s*/, "").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</li>`)
          .join("");
        return `<ul style="padding-left: 20px; font-size: 12px; line-height: 1.6; color: #1e293b;">${items}</ul>`;
      }
      if (block.startsWith("|")) {
        // Table format
        const rows = block.split("\n").filter((r) => !r.includes("---"));
        const tableHtml = rows
          .map((row, idx) => {
            const cells = row.split("|").filter((c) => c.trim().length > 0);
            const tag = idx === 0 ? "th" : "td";
            const style = idx === 0 ? "background: #f1f5f9; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1;" : "padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;";
            return `<tr>${cells.map((c) => `<${tag} style="${style}">${c.trim()}</${tag}>`).join("")}</tr>`;
          })
          .join("");
        return `<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">${tableHtml}</table>`;
      }
      return `<p style="font-size: 12px; line-height: 1.6; color: #334155; margin-bottom: 10px;">${block.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>")}</p>`;
    })
    .join("");

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${projectTitle}</title>
  <style>
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 40px; color: #0f172a; }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeFilename = projectTitle.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, "_");
  a.download = `Thesis_Proposal_${safeFilename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface VivaQuestionItem {
  question: string;
  category: string;
  examinerAngle: string;
  modelAnswer: string;
  defenseTip: string;
}

export function downloadVivaDefenseDoc(
  explorerData: ResearchExplorerData,
  questions: VivaQuestionItem[],
  overallScore: number,
  verdict: string
) {
  const paperTitle = explorerData.identity.title || "Academic Study";
  const authors = (explorerData.identity.authors || []).join(", ") || "Research Authors";

  const questionBlocks = questions
    .map(
      (q, idx) => `
    <div style="margin-bottom: 25px; padding: 15px; border-left: 4px solid #0284c7; background: #f8fafc; border-radius: 4px;">
      <h3 style="color: #0369a1; margin-top: 0; font-size: 14px;">Q${idx + 1}: ${q.question}</h3>
      <p style="font-size: 11px; color: #64748b; margin-bottom: 8px;"><strong>Examiner Attack Angle (${q.category}):</strong> ${q.examinerAngle}</p>
      <div style="background: #ffffff; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 8px;">
        <strong style="color: #0f172a; font-size: 12px;">Winning Model Defense Answer:</strong>
        <p style="font-size: 12px; color: #334155; margin: 4px 0 0 0; line-height: 1.5;">${q.modelAnswer}</p>
      </div>
      <p style="font-size: 11px; color: #047857; margin: 0;"><strong>Tactical Defense Tip:</strong> ${q.defenseTip}</p>
    </div>
  `
    )
    .join("");

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Viva Defense Simulator & Reviewer 2 Guide</title>
  <style>
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 40px; color: #0f172a; }
  </style>
</head>
<body>
  <h1 style="color: #0f172a; font-size: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 6px;">PEER REVIEW & THESIS VIVA DEFENSE SIMULATOR</h1>
  <p style="font-size: 12px; color: #475569;">Target Manuscript: <strong>${paperTitle}</strong> (${authors})</p>
  <div style="padding: 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; margin: 20px 0;">
    <p style="margin: 0; font-size: 12px; color: #166534;"><strong>Simulated Peer-Review Verdict:</strong> ${verdict} | <strong>Composite Rigor Rating:</strong> ${overallScore}/100</p>
  </div>
  <h2 style="color: #0f172a; font-size: 16px; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">TOP 5 TOUGHEST EXAMINER QUESTIONS & MODEL DEFENSE STRATEGY</h2>
  ${questionBlocks}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeFilename = paperTitle.slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, "_");
  a.download = `Viva_Defense_Guide_${safeFilename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
