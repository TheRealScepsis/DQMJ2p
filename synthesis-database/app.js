(function () {
  "use strict";

  const RECIPES = DQMJ2_DATA.recipes;
  const MONSTER_ICONS = DQMJ2_DATA.monsterIcons;
  const SKILLS = DQMJ2_DATA.skills;

  const RANK_ORDER = ["F", "E", "D", "C", "B", "A", "S", "SS / X"];

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
    if (r === "F") return "rank-f";
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

  // ---------- Shared monster-picker search (Tree + Builder) ----------

  function setupMonsterPicker({ searchInput, clearBtn, suggestionsEl, emptyStateEl, hideOnSearch, onSelect, getCurrentRoot, onClear }) {
    function run() {
      const q = normalise(searchInput.value);
      clearBtn.hidden = q.length === 0;

      if (!q) {
        suggestionsEl.innerHTML = "";
        if (!getCurrentRoot()) {
          emptyStateEl.hidden = false;
          hideOnSearch.forEach((el) => (el.hidden = true));
        }
        return;
      }

      const exact = ALL_MONSTER_NAMES.find((n) => normalise(n) === q);
      if (exact) {
        onSelect(exact);
        return;
      }

      const matches = ALL_MONSTER_NAMES.filter((n) => normalise(n).includes(q)).slice(0, 12);
      suggestionsEl.innerHTML = matches.length
        ? matches.map((n) => `<button type="button" class="suggest-chip" data-suggest="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join("")
        : `<div class="no-results">No monster matches “${escapeHtml(searchInput.value)}”.</div>`;
      hideOnSearch.forEach((el) => (el.hidden = true));
      emptyStateEl.hidden = true;
    }

    searchInput.addEventListener("input", run);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const q = normalise(searchInput.value);
        const match = ALL_MONSTER_NAMES.find((n) => normalise(n) === q) ||
          ALL_MONSTER_NAMES.find((n) => normalise(n).includes(q));
        if (match) onSelect(match);
      }
    });
    suggestionsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-suggest]");
      if (btn) onSelect(btn.dataset.suggest);
    });
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      suggestionsEl.innerHTML = "";
      clearBtn.hidden = true;
      hideOnSearch.forEach((el) => (el.hidden = true));
      emptyStateEl.hidden = false;
      searchInput.focus();
      onClear();
    });
  }

  // ---------- Synthesis tree ----------

  const treeSearch = document.getElementById("treeSearch");
  const treeClear = document.getElementById("treeClear");
  const treeSuggestions = document.getElementById("treeSuggestions");
  const treeEmptyState = document.getElementById("treeEmptyState");
  const treeToolbar = document.getElementById("treeToolbar");
  const treeWrap = document.getElementById("treeWrap");
  const treeZoomShell = document.getElementById("treeZoomShell");
  const treeContainer = document.getElementById("treeContainer");
  const treeViewToggleBtns = document.querySelectorAll("[data-tree-view]");
  const zoomControls = document.getElementById("zoomControls");
  const zoomOutBtn = document.getElementById("zoomOut");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomFitBtn = document.getElementById("zoomFit");
  const zoomLevelLabel = document.getElementById("zoomLevel");

  const recipeChoice = {};
  let currentTreeRoot = null;
  const MAX_TREE_DEPTH = 25;
  const isNarrowScreen = window.matchMedia("(max-width: 700px)").matches;
  let treeViewMode = isNarrowScreen ? "outline" : "diagram";
  let zoomScale = 1;

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

  // catchable: label base/cycle endpoints as "obtain in the wild" (used by
  // the Builder) instead of the more technical Base/loop badges the Tree
  // diagram and outline use.
  function nodeBadges(node, catchable) {
    const meta = MONSTER_META[node.name];
    const badges = [];
    if (meta && meta.rank) badges.push(`<span class="rank-badge ${rankClass(meta.rank)}">${escapeHtml(meta.rank)}</span>`);
    if (node.isBase) {
      badges.push(catchable
        ? `<span class="catch-badge">🎣 Catchable</span>`
        : `<span class="base-badge">Base</span>`);
    }
    if (node.isCycle) {
      badges.push(catchable
        ? `<span class="catch-badge">🎣 Catchable</span>`
        : `<span class="cycle-badge">↺ loop</span>`);
    }
    if (node.isTruncated) badges.push(`<span class="cycle-badge">…</span>`);
    if (node.count > 1) badges.push(`<span class="qty-badge">×${node.count}</span>`);
    return badges.join("");
  }

  function nodeVariantBtn(node) {
    return node.recipeCount > 1
      ? `<button type="button" class="variant-btn" data-variant="${escapeHtml(node.name)}" title="Show a different recipe for this monster">⟲ ${node.recipeIndex + 1}/${node.recipeCount}</button>`
      : "";
  }

  function renderTreeNode(node) {
    const icon = iconFor(node.name);
    const img = icon ? `<img src="${icon}" alt="" loading="lazy">` : "";
    const nodeHtml = `
      <div class="tree-node${node.isBase ? " base" : ""}${node.isCycle || node.isTruncated ? " cycle" : ""}">
        <button type="button" class="tree-node-main" data-reroot="${escapeHtml(node.name)}">
          ${img}
          <span class="tree-node-name">${escapeHtml(node.name)}</span>
        </button>
        <div class="tree-node-badges">${nodeBadges(node)}</div>
        ${nodeVariantBtn(node)}
      </div>`;

    if (!node.children || node.children.length === 0) {
      return `<li>${nodeHtml}</li>`;
    }
    return `<li>${nodeHtml}<ul>${node.children.map(renderTreeNode).join("")}</ul></li>`;
  }

  function renderOutlineNode(node) {
    const icon = iconFor(node.name);
    const img = icon ? `<img src="${icon}" alt="" loading="lazy">` : "";
    const row = `
        <button type="button" class="outline-name-btn" data-reroot="${escapeHtml(node.name)}">
          ${img}
          <span class="tree-node-name">${escapeHtml(node.name)}</span>
        </button>
        <span class="outline-badges">${nodeBadges(node)}</span>
        ${nodeVariantBtn(node)}`;

    if (!node.children || node.children.length === 0) {
      return `<li class="outline-leaf">${row}</li>`;
    }
    return `<li>
        <details open>
          <summary>${row}</summary>
          <ul class="tree-outline">${node.children.map(renderOutlineNode).join("")}</ul>
        </details>
      </li>`;
  }

  function applyTreeViewMode() {
    treeViewToggleBtns.forEach((b) => b.classList.toggle("active", b.dataset.treeView === treeViewMode));
    zoomControls.hidden = treeViewMode !== "diagram";
    treeZoomShell.classList.toggle("outline-mode", treeViewMode === "outline");
  }

  const MIN_ZOOM = 0.15;
  const MIN_AUTOFIT_ZOOM = 0.35;

  function setZoom(scale) {
    zoomScale = Math.max(MIN_ZOOM, Math.min(1, scale));
    if (treeViewMode === "diagram") {
      // Reset before measuring: the shell's own width/height from a
      // previous zoom would otherwise constrain treeContainer's
      // min-width:100% and reflow it narrower before we can read its
      // true natural size.
      treeZoomShell.style.width = "";
      treeZoomShell.style.height = "";
      treeContainer.style.transform = "none";
      const w = treeContainer.offsetWidth;
      const h = treeContainer.offsetHeight;
      treeContainer.style.transform = `scale(${zoomScale})`;
      treeZoomShell.style.width = w * zoomScale + "px";
      treeZoomShell.style.height = h * zoomScale + "px";
    }
    zoomLevelLabel.textContent = Math.round(zoomScale * 100) + "%";
  }

  function fitTreeToWidth() {
    treeZoomShell.style.width = "";
    treeZoomShell.style.height = "";
    treeContainer.style.transform = "none";
    const naturalWidth = treeContainer.offsetWidth;
    const available = treeWrap.clientWidth - 4;
    const idealFit = naturalWidth > available ? available / naturalWidth : 1;
    // Below this, text stops being legible - better to stay readable and
    // let the wrap's horizontal scroll handle the rest of a very wide tree.
    setZoom(Math.max(idealFit, MIN_AUTOFIT_ZOOM));
  }

  function renderTree(name) {
    if (!MONSTER_ICONS[name]) return;
    currentTreeRoot = name;
    const node = buildTreeNode(name, [], 0, 1);
    treeContainer.style.transform = "";
    treeContainer.innerHTML = treeViewMode === "outline"
      ? `<ul class="tree-outline root">${renderOutlineNode(node)}</ul>`
      : `<ul class="tree-diagram">${renderTreeNode(node)}</ul>`;
    applyTreeViewMode();
    treeWrap.hidden = false;
    treeToolbar.hidden = false;
    treeEmptyState.hidden = true;
    treeSuggestions.innerHTML = "";
    treeSearch.value = name;
    treeClear.hidden = false;

    if (treeViewMode === "diagram") {
      fitTreeToWidth();
    } else {
      treeZoomShell.style.width = "";
      treeZoomShell.style.height = "";
    }
  }

  treeContainer.addEventListener("click", (e) => {
    const rerootBtn = e.target.closest("[data-reroot]");
    if (rerootBtn) {
      e.preventDefault();
      e.stopPropagation();
      renderTree(rerootBtn.dataset.reroot);
      return;
    }
    const variantBtn = e.target.closest(".variant-btn");
    if (variantBtn) {
      e.preventDefault();
      e.stopPropagation();
      const name = variantBtn.dataset.variant;
      const count = (RECIPES_BY_RESULT[name] || []).length;
      if (count > 0) {
        recipeChoice[name] = ((recipeChoice[name] || 0) + 1) % count;
        renderTree(currentTreeRoot);
      }
    }
  });

  treeViewToggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (treeViewMode === btn.dataset.treeView) return;
      treeViewMode = btn.dataset.treeView;
      if (currentTreeRoot) renderTree(currentTreeRoot);
      else applyTreeViewMode();
    });
  });

  zoomInBtn.addEventListener("click", () => setZoom(zoomScale + 0.1));
  zoomOutBtn.addEventListener("click", () => setZoom(zoomScale - 0.1));
  zoomFitBtn.addEventListener("click", fitTreeToWidth);

  applyTreeViewMode();

  setupMonsterPicker({
    searchInput: treeSearch,
    clearBtn: treeClear,
    suggestionsEl: treeSuggestions,
    emptyStateEl: treeEmptyState,
    hideOnSearch: [treeWrap, treeToolbar],
    onSelect: renderTree,
    getCurrentRoot: () => currentTreeRoot,
    onClear: () => { currentTreeRoot = null; },
  });
  document.querySelectorAll("[data-fill-tree]").forEach((btn) => {
    btn.addEventListener("click", () => renderTree(btn.dataset.fillTree));
  });

  // ---------- Synthesis builder ----------

  const builderSearch = document.getElementById("builderSearch");
  const builderClear = document.getElementById("builderClear");
  const builderSuggestions = document.getElementById("builderSuggestions");
  const builderEmptyState = document.getElementById("builderEmptyState");
  const builderWrap = document.getElementById("builderWrap");
  const builderContainer = document.getElementById("builderContainer");
  const builderBackRow = document.getElementById("builderBackRow");
  const builderBackBtn = document.getElementById("builderBackBtn");
  const builderBackName = document.getElementById("builderBackName");

  let currentBuilderRoot = null;
  // Stack of previously-viewed roots, pushed each time tapping a monster
  // inside the kit re-roots it onto that monster - lets "Back" walk you
  // out again, one step at a time, all the way to what you first searched.
  let builderHistory = [];

  function renderBuilderNode(node, isRoot) {
    const icon = iconFor(node.name);
    const img = icon ? `<img src="${icon}" alt="" loading="lazy">` : "";
    const row = `
        <button type="button" class="kit-name-btn" data-reroot="${escapeHtml(node.name)}">
          ${img}
          <span class="tree-node-name">${escapeHtml(node.name)}</span>
        </button>
        <span class="outline-badges">${nodeBadges(node, true)}</span>
        ${nodeVariantBtn(node)}`;

    // data-name/data-count let a variant switch walk back up the DOM to
    // rebuild this node's exact path/depth/count later, so only this one
    // node needs to be touched instead of re-rendering the whole kit.
    const nameAttr = escapeHtml(node.name);
    const countAttr = node.count || 1;

    if (!node.children || node.children.length === 0) {
      return `<li class="kit-leaf" data-name="${nameAttr}" data-count="${countAttr}">${row}</li>`;
    }
    // The root's own materials are opened automatically (that's the whole
    // point of searching); everything deeper starts collapsed so the kit
    // stays compact until you choose to drill into a specific branch.
    return `<li data-name="${nameAttr}" data-count="${countAttr}">
        <details${isRoot ? " open" : ""}>
          <summary>${row}</summary>
          <ul class="kit-list">${node.children.map((c) => renderBuilderNode(c, false)).join("")}</ul>
        </details>
      </li>`;
  }

  function renderBuilderTree(name) {
    if (!MONSTER_ICONS[name]) return;
    currentBuilderRoot = name;
    const node = buildTreeNode(name, [], 0, 1);
    builderContainer.innerHTML = `<ul class="kit-list root">${renderBuilderNode(node, true)}</ul>`;
    builderWrap.hidden = false;
    builderEmptyState.hidden = true;
    builderSuggestions.innerHTML = "";
    builderSearch.value = name;
    builderClear.hidden = false;

    if (builderHistory.length) {
      builderBackRow.hidden = false;
      builderBackName.textContent = builderHistory[builderHistory.length - 1];
    } else {
      builderBackRow.hidden = true;
    }
  }

  // A fresh pick (search, suggestion, or example chip) starts a new
  // exploration - the history only tracks re-roots made by tapping into
  // the kit itself.
  function selectBuilderRoot(name) {
    builderHistory = [];
    renderBuilderTree(name);
  }

  builderContainer.addEventListener("click", (e) => {
    const rerootBtn = e.target.closest("[data-reroot]");
    if (rerootBtn) {
      e.preventDefault();
      e.stopPropagation();
      if (currentBuilderRoot && rerootBtn.dataset.reroot !== currentBuilderRoot) {
        builderHistory.push(currentBuilderRoot);
      }
      renderBuilderTree(rerootBtn.dataset.reroot);
      return;
    }
    const variantBtn = e.target.closest(".variant-btn");
    if (variantBtn) {
      e.preventDefault();
      e.stopPropagation();
      const name = variantBtn.dataset.variant;
      const recipeCount = (RECIPES_BY_RESULT[name] || []).length;
      if (recipeCount > 0) {
        recipeChoice[name] = ((recipeChoice[name] || 0) + 1) % recipeCount;
        updateBuilderNodeInPlace(variantBtn.closest("li"));
      }
    }
  });

  // Rebuild and swap in just the one <li> whose recipe variant changed,
  // instead of re-rendering the whole kit - so every other branch keeps
  // whatever expanded/collapsed state the player already set up.
  function updateBuilderNodeInPlace(li) {
    if (!li) return;
    const name = li.dataset.name;
    const count = Number(li.dataset.count) || 1;

    const path = [];
    let ancestorLi = li.parentElement.closest("li");
    while (ancestorLi) {
      path.unshift(ancestorLi.dataset.name);
      ancestorLi = ancestorLi.parentElement.closest("li");
    }

    const wasOpenEl = li.querySelector(":scope > details");
    const wasOpen = wasOpenEl ? wasOpenEl.open : null;

    const freshNode = buildTreeNode(name, path, path.length, count);
    const wrapper = document.createElement("ul");
    wrapper.innerHTML = renderBuilderNode(freshNode, false);
    const newLi = wrapper.firstElementChild;

    const newDetails = newLi.querySelector(":scope > details");
    if (newDetails) newDetails.open = wasOpen === true;

    li.replaceWith(newLi);
  }

  builderBackBtn.addEventListener("click", () => {
    if (!builderHistory.length) return;
    const previous = builderHistory.pop();
    renderBuilderTree(previous);
  });

  setupMonsterPicker({
    searchInput: builderSearch,
    clearBtn: builderClear,
    suggestionsEl: builderSuggestions,
    emptyStateEl: builderEmptyState,
    hideOnSearch: [builderWrap],
    onSelect: selectBuilderRoot,
    getCurrentRoot: () => currentBuilderRoot,
    onClear: () => { currentBuilderRoot = null; builderHistory = []; },
  });
  document.querySelectorAll("[data-fill-builder]").forEach((btn) => {
    btn.addEventListener("click", () => selectBuilderRoot(btn.dataset.fillBuilder));
  });

  // ---------- All Monsters catalog (no search - just sortable lists) ----------

  const catalogRecipeTable = document.getElementById("catalogRecipeTable");
  const catalogRecipeBody = document.getElementById("catalogRecipeBody");
  const catalogRecipeCount = document.getElementById("catalogRecipeCount");
  const catalogBaseTable = document.getElementById("catalogBaseTable");
  const catalogBaseBody = document.getElementById("catalogBaseBody");
  const catalogBaseCount = document.getElementById("catalogBaseCount");

  const BASE_MONSTERS = (() => {
    const usedInCount = {};
    RECIPES.forEach((r) => {
      new Set(r.materials).forEach((m) => {
        usedInCount[m] = (usedInCount[m] || 0) + 1;
      });
    });
    return ALL_MONSTER_NAMES
      .filter((n) => !RECIPES_BY_RESULT[n])
      .map((n) => ({ name: n, usedIn: usedInCount[n] || 0 }));
  })();

  function compareCatalog(a, b, field, dir) {
    let av, bv;
    if (field === "rank") {
      av = RANK_ORDER.indexOf((a.rank || "").trim());
      bv = RANK_ORDER.indexOf((b.rank || "").trim());
    } else if (field === "size" || field === "usedIn") {
      av = Number(a[field]) || 0;
      bv = Number(b[field]) || 0;
    } else {
      av = String(a[field] || "").toLowerCase();
      bv = String(b[field] || "").toLowerCase();
    }
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  }

  function updateSortHeaders(table, field, dir) {
    table.querySelectorAll("th[data-sort]").forEach((th) => {
      th.classList.remove("sort-asc", "sort-desc");
      if (th.dataset.sort === field) th.classList.add(dir === "asc" ? "sort-asc" : "sort-desc");
    });
  }

  function catalogRecipeRow(r) {
    const rankHtml = r.rank ? `<span class="rank-badge ${rankClass(r.rank)}">${escapeHtml(r.rank)}</span>` : "";
    const materialsHtml = r.materials.map((m) => monChip(m, false)).join(`<span class="formula-plus">+</span>`);
    return `<tr>
        <td>${monChip(r.result, false)}</td>
        <td>${rankHtml}</td>
        <td>${r.family ? escapeHtml(r.family) : ""}</td>
        <td>${r.size ? escapeHtml(r.size) : ""}</td>
        <td class="materials-cell">${materialsHtml}</td>
      </tr>`;
  }

  function catalogBaseRow(b) {
    return `<tr>
        <td>${monChip(b.name, false)}</td>
        <td>${b.usedIn} recipe${b.usedIn === 1 ? "" : "s"}</td>
      </tr>`;
  }

  let catalogRecipeSort = { field: "result", dir: "asc" };
  let catalogBaseSort = { field: "name", dir: "asc" };

  function renderCatalogRecipes() {
    const sorted = RECIPES.slice().sort((a, b) => compareCatalog(a, b, catalogRecipeSort.field, catalogRecipeSort.dir));
    catalogRecipeBody.innerHTML = sorted.map(catalogRecipeRow).join("");
    catalogRecipeCount.textContent = sorted.length;
    updateSortHeaders(catalogRecipeTable, catalogRecipeSort.field, catalogRecipeSort.dir);
  }

  function renderCatalogBase() {
    const sorted = BASE_MONSTERS.slice().sort((a, b) => compareCatalog(a, b, catalogBaseSort.field, catalogBaseSort.dir));
    catalogBaseBody.innerHTML = sorted.map(catalogBaseRow).join("");
    catalogBaseCount.textContent = sorted.length;
    updateSortHeaders(catalogBaseTable, catalogBaseSort.field, catalogBaseSort.dir);
  }

  catalogRecipeTable.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      if (catalogRecipeSort.field === field) {
        catalogRecipeSort.dir = catalogRecipeSort.dir === "asc" ? "desc" : "asc";
      } else {
        catalogRecipeSort = { field, dir: "asc" };
      }
      renderCatalogRecipes();
    });
  });

  catalogBaseTable.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      if (catalogBaseSort.field === field) {
        catalogBaseSort.dir = catalogBaseSort.dir === "asc" ? "desc" : "asc";
      } else {
        catalogBaseSort = { field, dir: "asc" };
      }
      renderCatalogBase();
    });
  });

  renderCatalogRecipes();
  renderCatalogBase();

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
