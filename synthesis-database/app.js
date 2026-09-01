(function () {
  "use strict";

  const RECIPES = DQMJ2_DATA.recipes;
  const MONSTER_ICONS = DQMJ2_DATA.monsterIcons;
  const SKILLS = DQMJ2_DATA.skills;

  const RANK_ORDER = ["E", "D", "C", "B", "A", "S", "SS / X"];

  function rankClass(rank) {
    if (!rank) return "";
    const r = rank.trim().toUpperCase();
    if (r.startsWith("SS")) return "rank-ss";
    if (r === "S") return "rank-s";
    if (r === "A") return "rank-a";
    if (r === "B") return "rank-b";
    if (r === "C") return "rank-c";
    if (r === "D") return "rank-d";
    if (r === "E") return "rank-e";
    return "";
  }

  function normalise(s) {
    return (s || "").toLowerCase().trim();
  }

  function iconFor(name) {
    return MONSTER_ICONS[name] || "";
  }

  function monChip(name, isHighlighted) {
    const icon = iconFor(name);
    const cls = "mon-chip" + (isHighlighted ? " highlight" : "");
    const img = icon ? `<img src="${icon}" alt="" loading="lazy">` : "";
    return `<span class="${cls}">${img}${escapeHtml(name)}</span>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------- Indexes ----------

  const RECIPES_BY_RESULT = {};
  const MONSTER_META = {};
  RECIPES.forEach((r) => {
    (RECIPES_BY_RESULT[r.result] = RECIPES_BY_RESULT[r.result] || []).push(r);
    if (!MONSTER_META[r.result]) {
      MONSTER_META[r.result] = { rank: r.rank, family: r.family };
    }
  });
  const ALL_MONSTER_NAMES = Object.keys(MONSTER_ICONS).sort();

  // ---------- Populate filters ----------

  const familySet = new Set();
  const rankSet = new Set();
  RECIPES.forEach((r) => {
    if (r.family) familySet.add(r.family);
    if (r.rank) rankSet.add(r.rank);
  });

  const familyFilter = document.getElementById("familyFilter");
  Array.from(familySet).sort().forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f;
    familyFilter.appendChild(opt);
  });

  const rankFilter = document.getElementById("rankFilter");
  RANK_ORDER.filter((r) => rankSet.has(r)).forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    rankFilter.appendChild(opt);
  });

  // ---------- Tabs ----------

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const target = "tab-" + btn.dataset.tab;
      tabPanels.forEach((p) => p.classList.toggle("active", p.id === target));
    });
  });

  // ---------- Monster search ----------

  const monsterSearch = document.getElementById("monsterSearch");
  const monsterClear = document.getElementById("monsterClear");
  const monsterEmptyState = document.getElementById("monsterEmptyState");
  const monsterResults = document.getElementById("monsterResults");
  const asResultList = document.getElementById("asResultList");
  const asMaterialList = document.getElementById("asMaterialList");
  const countAsResult = document.getElementById("countAsResult");
  const countAsMaterial = document.getElementById("countAsMaterial");
  const viewToggleBtns = document.querySelectorAll(".view-toggle-btn");

  let currentView = "card";
  let lastAsResult = [];
  let lastAsMaterial = [];

  function recipeCard({ r, highlightResult, highlightMaterialIdx }) {
    const badges = [];
    if (r.rank) badges.push(`<span class="rank-badge ${rankClass(r.rank)}">${escapeHtml(r.rank)}</span>`);
    if (r.family) badges.push(`<span class="family-tag">${escapeHtml(r.family)}</span>`);

    const materialsHtml = r.materials
      .map((m, i) => monChip(m, i === highlightMaterialIdx))
      .join(`<span class="formula-plus">+</span>`);

    return `
      <div class="recipe-card">
        <div class="recipe-top">
          ${monChip(r.result, !!highlightResult)}
          ${badges.join("")}
        </div>
        <div class="recipe-formula">
          <span class="formula-eq">=</span>
          ${materialsHtml}
        </div>
      </div>`;
  }

  function recipeTableRow({ r, highlightResult, highlightMaterialIdx }) {
    const rankHtml = r.rank ? `<span class="rank-badge ${rankClass(r.rank)}">${escapeHtml(r.rank)}</span>` : "";
    const materialsHtml = r.materials
      .map((m, i) => monChip(m, i === highlightMaterialIdx))
      .join(`<span class="formula-plus">+</span>`);
    return `<tr>
        <td>${monChip(r.result, !!highlightResult)}</td>
        <td>${rankHtml}</td>
        <td>${r.family ? escapeHtml(r.family) : ""}</td>
        <td class="materials-cell">${materialsHtml}</td>
      </tr>`;
  }

  function recipeTable(items) {
    return `<div class="table-scroll"><table class="recipe-table">
      <thead><tr><th>Result</th><th>Rank</th><th>Family</th><th>Materials</th></tr></thead>
      <tbody>${items.map(recipeTableRow).join("")}</tbody>
      </table></div>`;
  }

  function renderResultGroup(container, items, emptyMessage) {
    if (!items.length) {
      container.innerHTML = `<div class="no-results">${emptyMessage}</div>`;
      return;
    }
    container.innerHTML = currentView === "list" ? recipeTable(items) : items.map(recipeCard).join("");
  }

  function renderMonsterResults() {
    countAsResult.textContent = lastAsResult.length;
    countAsMaterial.textContent = lastAsMaterial.length;
    renderResultGroup(asResultList, lastAsResult, `No recipes produce a monster matching “${escapeHtml(monsterSearch.value)}”.`);
    renderResultGroup(asMaterialList, lastAsMaterial, `No recipes use a monster matching “${escapeHtml(monsterSearch.value)}” as a material.`);
  }

  viewToggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      currentView = btn.dataset.view;
      viewToggleBtns.forEach((b) => b.classList.toggle("active", b === btn));
      renderMonsterResults();
    });
  });

  function passesFilters(r) {
    const fam = familyFilter.value;
    const rank = rankFilter.value;
    if (fam && r.family !== fam) return false;
    if (rank && r.rank !== rank) return false;
    return true;
  }

  function runMonsterSearch() {
    const q = normalise(monsterSearch.value);
    monsterClear.hidden = q.length === 0;

    if (!q) {
      monsterEmptyState.hidden = false;
      monsterResults.hidden = true;
      return;
    }

    lastAsResult = [];
    lastAsMaterial = [];

    RECIPES.forEach((r) => {
      if (!passesFilters(r)) return;
      if (normalise(r.result).includes(q)) {
        lastAsResult.push({ r, highlightResult: true });
      }
      const idx = r.materials.findIndex((m) => normalise(m).includes(q));
      if (idx !== -1) {
        lastAsMaterial.push({ r, highlightMaterialIdx: idx });
      }
    });

    renderMonsterResults();

    monsterEmptyState.hidden = true;
    monsterResults.hidden = false;
  }

  monsterSearch.addEventListener("input", runMonsterSearch);
  familyFilter.addEventListener("change", runMonsterSearch);
  rankFilter.addEventListener("change", runMonsterSearch);
  monsterClear.addEventListener("click", () => {
    monsterSearch.value = "";
    runMonsterSearch();
    monsterSearch.focus();
  });

  document.querySelectorAll("[data-fill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      monsterSearch.value = btn.dataset.fill;
      runMonsterSearch();
    });
  });

  // ---------- Synthesis tree ----------

  const treeSearch = document.getElementById("treeSearch");
  const treeClear = document.getElementById("treeClear");
  const treeSuggestions = document.getElementById("treeSuggestions");
  const treeEmptyState = document.getElementById("treeEmptyState");
  const treeWrap = document.getElementById("treeWrap");
  const treeContainer = document.getElementById("treeContainer");

  const recipeChoice = {};
  let currentTreeRoot = null;
  const MAX_TREE_DEPTH = 25;

  function buildTreeNode(name, path, depth, count) {
    if (depth > MAX_TREE_DEPTH) {
      return { name, isTruncated: true, children: [], count };
    }
    if (path.indexOf(name) !== -1) {
      return { name, isCycle: true, children: [], count };
    }
    const recipes = RECIPES_BY_RESULT[name];
    if (!recipes || recipes.length === 0) {
      return { name, isBase: true, children: [], count };
    }
    const idx = (recipeChoice[name] || 0) % recipes.length;
    const recipe = recipes[idx];
    const newPath = path.concat([name]);

    // Materials repeated within the same recipe (e.g. "Liquid Metal Slime x4")
    // share an identical subtree, so collapse them into one child with a
    // quantity badge instead of rendering duplicate branches side by side.
    const order = [];
    const counts = {};
    recipe.materials.forEach((m) => {
      if (!(m in counts)) {
        counts[m] = 0;
        order.push(m);
      }
      counts[m]++;
    });
    const children = order.map((m) => buildTreeNode(m, newPath, depth + 1, counts[m]));
    return { name, recipeIndex: idx, recipeCount: recipes.length, children, count };
  }

  function renderTreeNode(node) {
    const icon = iconFor(node.name);
    const img = icon ? `<img src="${icon}" alt="" loading="lazy">` : "";
    const meta = MONSTER_META[node.name];
    const badges = [];
    if (meta && meta.rank) badges.push(`<span class="rank-badge ${rankClass(meta.rank)}">${escapeHtml(meta.rank)}</span>`);
    if (node.isBase) badges.push(`<span class="base-badge">Base</span>`);
    if (node.isCycle) badges.push(`<span class="cycle-badge">↺ loop</span>`);
    if (node.isTruncated) badges.push(`<span class="cycle-badge">…</span>`);
    if (node.count > 1) badges.push(`<span class="qty-badge">×${node.count}</span>`);

    const variantBtn = node.recipeCount > 1
      ? `<button type="button" class="variant-btn" data-variant="${escapeHtml(node.name)}" title="Show a different recipe for this monster">⟲ ${node.recipeIndex + 1}/${node.recipeCount}</button>`
      : "";

    const nodeHtml = `
      <div class="tree-node${node.isBase ? " base" : ""}${node.isCycle || node.isTruncated ? " cycle" : ""}">
        <button type="button" class="tree-node-main" data-reroot="${escapeHtml(node.name)}">
          ${img}
          <span class="tree-node-name">${escapeHtml(node.name)}</span>
        </button>
        <div class="tree-node-badges">${badges.join("")}</div>
        ${variantBtn}
      </div>`;

    if (!node.children || node.children.length === 0) {
      return `<li>${nodeHtml}</li>`;
    }
    return `<li>${nodeHtml}<ul>${node.children.map(renderTreeNode).join("")}</ul></li>`;
  }

  function renderTree(name) {
    if (!MONSTER_ICONS[name]) return;
    currentTreeRoot = name;
    const node = buildTreeNode(name, [], 0, 1);
    treeContainer.innerHTML = `<ul>${renderTreeNode(node)}</ul>`;
    treeWrap.hidden = false;
    treeEmptyState.hidden = true;
    treeSuggestions.innerHTML = "";
    treeSearch.value = name;
    treeClear.hidden = false;
  }

  treeContainer.addEventListener("click", (e) => {
    const rerootBtn = e.target.closest("[data-reroot]");
    if (rerootBtn) {
      renderTree(rerootBtn.dataset.reroot);
      return;
    }
    const variantBtn = e.target.closest(".variant-btn");
    if (variantBtn) {
      const name = variantBtn.dataset.variant;
      const count = (RECIPES_BY_RESULT[name] || []).length;
      if (count > 0) {
        recipeChoice[name] = ((recipeChoice[name] || 0) + 1) % count;
        renderTree(currentTreeRoot);
      }
    }
  });

  function runTreeSearch() {
    const q = normalise(treeSearch.value);
    treeClear.hidden = q.length === 0;

    if (!q) {
      treeSuggestions.innerHTML = "";
      if (!currentTreeRoot) {
        treeEmptyState.hidden = false;
        treeWrap.hidden = true;
      }
      return;
    }

    const exact = ALL_MONSTER_NAMES.find((n) => normalise(n) === q);
    if (exact) {
      renderTree(exact);
      return;
    }

    const matches = ALL_MONSTER_NAMES.filter((n) => normalise(n).includes(q)).slice(0, 12);
    treeSuggestions.innerHTML = matches.length
      ? matches.map((n) => `<button type="button" class="suggest-chip" data-suggest="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join("")
      : `<div class="no-results">No monster matches “${escapeHtml(treeSearch.value)}”.</div>`;
    treeWrap.hidden = true;
    treeEmptyState.hidden = true;
  }

  treeSearch.addEventListener("input", runTreeSearch);
  treeSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = normalise(treeSearch.value);
      const match = ALL_MONSTER_NAMES.find((n) => normalise(n) === q) ||
        ALL_MONSTER_NAMES.find((n) => normalise(n).includes(q));
      if (match) renderTree(match);
    }
  });
  treeSuggestions.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-suggest]");
    if (btn) renderTree(btn.dataset.suggest);
  });
  treeClear.addEventListener("click", () => {
    treeSearch.value = "";
    treeSuggestions.innerHTML = "";
    currentTreeRoot = null;
    treeClear.hidden = true;
    treeWrap.hidden = true;
    treeEmptyState.hidden = false;
    treeSearch.focus();
  });
  document.querySelectorAll("[data-fill-tree]").forEach((btn) => {
    btn.addEventListener("click", () => renderTree(btn.dataset.fillTree));
  });

  // ---------- Skill search ----------

  const skillSearch = document.getElementById("skillSearch");
  const skillClear = document.getElementById("skillClear");
  const skillEmptyState = document.getElementById("skillEmptyState");
  const skillResults = document.getElementById("skillResults");
  const skillAsResultList = document.getElementById("skillAsResultList");
  const skillAsMaterialList = document.getElementById("skillAsMaterialList");
  const countSkillResult = document.getElementById("countSkillResult");
  const countSkillMaterial = document.getElementById("countSkillMaterial");

  function skillPill(name, level, isHighlighted) {
    const cls = "skill-pill" + (isHighlighted ? " highlight" : "");
    const lvl = level != null ? `<span class="lvl">(${level})</span>` : "";
    return `<span class="${cls}">${escapeHtml(name)} ${lvl}</span>`;
  }

  function skillCardAsResult(s) {
    const needed = s.needed
      .map((n) => skillPill(n.skill, n.level, false))
      .join(`<span class="formula-plus">+</span>`);
    return `
      <div class="skill-card">
        <div class="skill-name">${escapeHtml(s.result)}</div>
        <div class="skill-formula">
          <span class="formula-eq">=</span>
          ${needed}
        </div>
      </div>`;
  }

  function skillCardAsMaterial(s, idx) {
    const needed = s.needed
      .map((n, i) => skillPill(n.skill, n.level, i === idx))
      .join(`<span class="formula-plus">+</span>`);
    return `
      <div class="skill-card">
        <div class="skill-name dim">${escapeHtml(s.result)}</div>
        <div class="skill-formula">
          <span class="formula-eq">=</span>
          ${needed}
        </div>
      </div>`;
  }

  function runSkillSearch() {
    const q = normalise(skillSearch.value);
    skillClear.hidden = q.length === 0;

    if (!q) {
      skillEmptyState.hidden = false;
      skillResults.hidden = true;
      return;
    }

    const asResult = SKILLS.filter((s) => normalise(s.result).includes(q));
    const asMaterial = [];
    SKILLS.forEach((s) => {
      const idx = s.needed.findIndex((n) => normalise(n.skill).includes(q));
      if (idx !== -1) asMaterial.push({ s, idx });
    });

    countSkillResult.textContent = asResult.length;
    countSkillMaterial.textContent = asMaterial.length;

    skillAsResultList.innerHTML = asResult.length
      ? asResult.map(skillCardAsResult).join("")
      : `<div class="no-results">No skill matching “${escapeHtml(skillSearch.value)}” is created by a combination.</div>`;

    skillAsMaterialList.innerHTML = asMaterial.length
      ? asMaterial.map(({ s, idx }) => skillCardAsMaterial(s, idx)).join("")
      : `<div class="no-results">No skill combination uses “${escapeHtml(skillSearch.value)}” as an ingredient.</div>`;

    skillEmptyState.hidden = true;
    skillResults.hidden = false;
  }

  skillSearch.addEventListener("input", runSkillSearch);
  skillClear.addEventListener("click", () => {
    skillSearch.value = "";
    runSkillSearch();
    skillSearch.focus();
  });

  document.querySelectorAll("[data-fill-skill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      skillSearch.value = btn.dataset.fillSkill;
      runSkillSearch();
    });
  });
})();
