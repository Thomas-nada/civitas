const scoreWeights = {
  attendance: 0.45,
  transparencyScore: 0.3,
  consistency: 0.15,
  responsiveness: 0.1
};

const tableBody = document.getElementById("drepTableBody");
const detailPanel = document.getElementById("detailPanel");
const summaryCards = document.getElementById("summaryCards");
const searchInput = document.getElementById("searchInput");
const attendanceInput = document.getElementById("attendanceInput");
const attendanceValue = document.getElementById("attendanceValue");
const modeSelect = document.getElementById("modeSelect");
const sortSelect = document.getElementById("sortSelect");
const actionSelect = document.getElementById("actionSelect");
const actionTypeSelect = document.getElementById("actionTypeSelect");
const includeActiveActionsInput = document.getElementById("includeActiveActionsInput");
const includeAttendanceInput = document.getElementById("includeAttendanceInput");
const includeTransparencyInput = document.getElementById("includeTransparencyInput");
const includeAlignmentInput = document.getElementById("includeAlignmentInput");
const includeResponsivenessInput = document.getElementById("includeResponsivenessInput");
const statusText = document.getElementById("statusText");
const refreshButton = document.getElementById("refreshButton");
const actorHeader = document.getElementById("actorHeader");
const API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:8080" : "";

let selectedId = null;
let dreps = [];
let committeeMembers = [];
let proposalInfo = {};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function displayName(drep) {
  if (typeof drep.name === "string" && drep.name.trim()) {
    return drep.name.trim();
  }
  return "";
}

function drepCardanoscanUrl(drepId) {
  return `https://cardanoscan.io/drep/${encodeURIComponent(drepId)}`;
}

function governanceTypeForProposal(proposalId) {
  return proposalInfo[proposalId]?.governanceType || "Unknown";
}

function totalVotingPowerAda() {
  return dreps.reduce((sum, drep) => sum + Number(drep.votingPowerAda || 0), 0);
}

function currentMode() {
  return modeSelect.value;
}

function currentActors() {
  return currentMode() === "committee" ? committeeMembers : dreps;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function formatResponseHours(hours) {
  if (hours === null || hours === undefined || Number.isNaN(hours)) {
    return "N/A";
  }
  if (hours < 24) {
    return `${round(hours)}h`;
  }
  return `${round(hours / 24)}d`;
}

function scoreClass(score) {
  if (score >= 75) return "good";
  if (score >= 50) return "mid";
  return "low";
}

function isActiveAction(proposalId) {
  const info = proposalInfo[proposalId];
  const outcome = String(info?.outcome || "").toLowerCase();
  return outcome === "pending";
}

function computeMetrics(drep) {
  const cast = drep.votes.length;
  const totalEligibleVotes = drep.totalEligibleVotes || 1;
  const attendance = cast / totalEligibleVotes * 100;
  const transparencyScore = drep.transparencyScore ?? 20;
  const comparableVotes = drep.votes.filter((vote) => {
    const outcome = String(vote.outcome || "").toLowerCase();
    return outcome === "yes" || outcome === "no";
  });
  const consistency =
    comparableVotes.length > 0
      ? comparableVotes.filter((vote) => String(vote.vote).toLowerCase() === String(vote.outcome).toLowerCase()).length /
        comparableVotes.length *
        100
      : 0;
  const includeAlignment = includeAlignmentInput.checked;
  const includeAttendance = includeAttendanceInput.checked;
  const includeTransparencyBase = includeTransparencyInput.checked;
  const responseSamples = drep.votes
    .map((vote) => (typeof vote.responseHours === "number" ? vote.responseHours : null))
    .filter((value) => value !== null);
  const avgResponseHours =
    responseSamples.length > 0
      ? responseSamples.reduce((sum, value) => sum + value, 0) / responseSamples.length
      : null;
  const responsiveness =
    avgResponseHours === null
      ? 0
      : Math.max(0, 100 - avgResponseHours / (24 * 30) * 100);

  const abstainCount = drep.votes.filter((vote) => String(vote.vote).toLowerCase() === "abstain").length;
  const abstainRate = cast > 0 ? abstainCount / cast * 100 : 0;

  const mode = currentMode();
  const vpTotal = mode === "drep" ? totalVotingPowerAda() : 0;
  const votingPowerPct = mode === "drep" && vpTotal > 0 ? Number(drep.votingPowerAda || 0) / vpTotal * 100 : 0;
  const includeResponsiveness = includeResponsivenessInput.checked;
  const includeTransparency = includeTransparencyBase && mode === "drep";
  const activeWeights =
    (includeAttendance ? scoreWeights.attendance : 0) +
    (includeTransparency ? scoreWeights.transparencyScore : 0) +
    (includeAlignment ? scoreWeights.consistency : 0) +
    (includeResponsiveness ? scoreWeights.responsiveness : 0);
  const weightedScore =
    (includeAttendance ? attendance * scoreWeights.attendance : 0) +
    (includeTransparency ? transparencyScore * scoreWeights.transparencyScore : 0) +
    (includeAlignment ? consistency * scoreWeights.consistency : 0) +
    (includeResponsiveness ? responsiveness * scoreWeights.responsiveness : 0);
  const accountability = activeWeights > 0 ? weightedScore / activeWeights : 0;

  return {
    ...drep,
    cast,
    attendance: round(attendance),
    transparencyScore: round(transparencyScore),
    consistency: round(consistency),
    avgResponseHours: avgResponseHours === null ? null : round(avgResponseHours),
    responsiveness: round(responsiveness),
    abstainRate: round(abstainRate),
    votingPowerPct: round(votingPowerPct),
    accountability: round(accountability)
  };
}

function getFilteredRows() {
  const minAttendance = Number(attendanceInput.value);
  const searchText = searchInput.value.trim().toLowerCase();
  const sortBy = sortSelect.value;
  const selectedActionId = actionSelect.value;
  const selectedTypes = new Set(
    Array.from(actionTypeSelect.selectedOptions || []).map((option) => option.value).filter(Boolean)
  );
  const includeActiveActions = includeActiveActionsInput.checked;
  const countedActions = includeActiveActions
    ? Object.keys(proposalInfo).length
    : Object.keys(proposalInfo).filter((proposalId) => !isActiveAction(proposalId)).length;

  return currentActors()
    .map((drep) => {
      const filteredVotes = drep.votes.filter((vote) => {
        if (selectedActionId && vote.proposalId !== selectedActionId) return false;
        if (!includeActiveActions && isActiveAction(vote.proposalId)) return false;
        if (selectedTypes.size > 0 && !selectedTypes.has(governanceTypeForProposal(vote.proposalId))) return false;
        return true;
      });
      return {
        ...drep,
        votes: filteredVotes,
        totalEligibleVotes: selectedActionId ? 1 : Math.max(countedActions, 1)
      };
    })
    .map(computeMetrics)
    .filter((row) => row.cast > 0)
    .filter((row) => row.attendance >= minAttendance)
    .filter((row) => {
      if (!searchText) return true;
      return (displayName(row) || "").toLowerCase().includes(searchText) || row.id.toLowerCase().includes(searchText);
    })
    .sort((a, b) => {
      if (sortBy === "name") return (displayName(a) || a.id).localeCompare(displayName(b) || b.id);
      return b[sortBy] - a[sortBy];
    });
}

function renderSummary(rows) {
  if (!rows.length) {
    summaryCards.innerHTML = "";
    return;
  }

  const avgScore = round(rows.reduce((sum, row) => sum + row.accountability, 0) / rows.length);
  const avgAttendance = round(rows.reduce((sum, row) => sum + row.attendance, 0) / rows.length);
  const avgTransparency = round(rows.reduce((sum, row) => sum + row.transparencyScore, 0) / rows.length);
  const mode = currentMode();
  const totalVotingPower = totalVotingPowerAda();
  const totalActions = Object.keys(proposalInfo).length;
  const countedActions = includeActiveActionsInput.checked
    ? totalActions
    : Object.keys(proposalInfo).filter((proposalId) => !isActiveAction(proposalId)).length;
  const top = rows[0];
  const topName = displayName(top) || top.id;

  summaryCards.innerHTML = `
    <article class="card">
      <p>Visible DReps</p>
      <strong>${rows.length}</strong>
    </article>
    <article class="card">
      <p>Avg Accountability</p>
      <strong>${avgScore}</strong>
    </article>
    <article class="card">
      <p>Avg Attendance</p>
      <strong>${avgAttendance}%</strong>
    </article>
    <article class="card">
      <p>Avg Transparency</p>
      <strong>${avgTransparency}</strong>
    </article>
    <article class="card">
      <p>Top ${mode === "committee" ? "Committee Member" : "DRep"}</p>
      <strong>${escapeHtml(topName)}</strong>
    </article>
    <article class="card">
      <p>Total Governance Actions</p>
      <strong>${totalActions}</strong>
    </article>
    ${
      mode === "drep"
        ? `<article class="card">
      <p>Total Voting Power</p>
      <strong>${Number(totalVotingPower).toLocaleString()} ADA</strong>
    </article>`
        : `<article class="card">
      <p>Total Committee Members</p>
      <strong>${committeeMembers.length}</strong>
    </article>`
    }
    <article class="card">
      <p>Counted Actions</p>
      <strong>${countedActions}</strong>
    </article>
  `;
}

function renderTable(rows) {
  if (!rows.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="muted">No DReps match the selected filters.</td>
      </tr>
    `;
    detailPanel.innerHTML = `<p class="muted">Adjust filters to view DRep details.</p>`;
    return;
  }

  if (!selectedId || !rows.some((row) => row.id === selectedId)) {
    selectedId = rows[0].id;
  }

  tableBody.innerHTML = rows
    .map((row) => `
      <tr data-id="${row.id}" class="${row.id === selectedId ? "active" : ""}">
        <td>
          <div class="name-line">
            ${displayName(row) ? `<strong>${escapeHtml(displayName(row))}</strong>` : ""}
            ${
              currentMode() === "drep"
                ? `<span class="pill mid">${Number(row.votingPowerAda || 0).toLocaleString()} ADA (${row.votingPowerPct}%)</span>`
                : `<span class="pill mid">Committee Member</span>`
            }
          </div>
          <div class="mono"><a class="ext-link" href="${drepCardanoscanUrl(row.id)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.id)}</a></div>
        </td>
        <td>${row.attendance}%</td>
        <td>${row.transparencyScore ?? "-"}</td>
        <td>${row.consistency}%</td>
        <td>${row.abstainRate}%</td>
        <td><span class="pill ${scoreClass(row.accountability)}">${row.accountability}</span></td>
      </tr>
    `)
    .join("");

  tableBody.querySelectorAll("tr[data-id]").forEach((rowNode) => {
    rowNode.addEventListener("click", () => {
      selectedId = rowNode.dataset.id;
      render();
    });
  });

  renderDetails(rows.find((row) => row.id === selectedId));
}

function renderDetails(drep) {
  if (!drep) return;

  const votes = drep.votes
    .slice()
    .map((vote) => {
      const info = proposalInfo[vote.proposalId] || {};
      return `
      <article class="vote-item">
        <h3>${escapeHtml(info.actionName || vote.proposalId || "Unknown action")}</h3>
        <p class="mono">${escapeHtml(info.governanceType || "Unknown")} | ${escapeHtml(vote.proposalId || "-")}</p>
        <p>Vote: <strong>${vote.vote}</strong> | Final outcome: <strong>${vote.outcome}</strong></p>
        <p>Response time: <strong>${formatResponseHours(vote.responseHours)}</strong> after submission</p>
        <details>
          <summary>Read rationale</summary>
          <p class="rationale-text">${escapeHtml(info.rationale || "No rationale available.")}</p>
        </details>
      </article>
    `;
    })
    .join("");

  detailPanel.innerHTML = `
    ${displayName(drep) ? `<h2>${escapeHtml(displayName(drep))}</h2>` : ""}
    <p class="mono"><a class="ext-link" href="${drepCardanoscanUrl(drep.id)}" target="_blank" rel="noopener noreferrer">${escapeHtml(drep.id)}</a></p>
    <div class="meta">
      <p>Attendance: <strong>${drep.attendance}%</strong> (${drep.cast}/${drep.totalEligibleVotes})</p>
      <p>Transparency score: <strong>${drep.transparencyScore ?? "N/A"}</strong>${drep.transparencyScore === null ? "" : "/100"}</p>
      <p>Outcome alignment: <strong>${drep.consistency}%</strong></p>
      <p>Abstain rate: <strong>${drep.abstainRate}%</strong></p>
      <p>Avg response time: <strong>${formatResponseHours(drep.avgResponseHours)}</strong></p>
      ${
        currentMode() === "drep"
          ? `<p>Voting power: <strong>${Number(drep.votingPowerAda || 0).toLocaleString()}</strong> ADA (${drep.votingPowerPct}%)</p>`
          : ""
      }
      <p>Accountability: <span class="pill ${scoreClass(drep.accountability)}">${drep.accountability}</span></p>
    </div>
    <h3>Recent votes from loaded proposal set</h3>
    <div class="vote-list">${votes || '<p class="muted">No votes in loaded proposal window.</p>'}</div>
  `;
}

function render() {
  actorHeader.textContent = currentMode() === "committee" ? "Committee Member" : "DRep";
  const rows = getFilteredRows();
  renderSummary(rows);
  renderTable(rows);
}

function setStatus(message) {
  statusText.textContent = message;
}

async function loadLiveData() {
  try {
    refreshButton.disabled = true;
    if (window.location.protocol === "file:") {
      setStatus("Using local file mode. Attempting API at http://127.0.0.1:8080 ...");
    } else {
      setStatus("Loading latest synced snapshot...");
    }
    const response = await fetch(`${API_BASE}/api/accountability`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Failed to load live data.");
    }
    dreps = payload.dreps || [];
    committeeMembers = payload.committeeMembers || [];
    proposalInfo = payload.proposalInfo || {};
    populateActionSelect();
    populateActionTypeSelect();
    setStatus(
      `Snapshot: ${payload.generatedAt ? new Date(payload.generatedAt).toLocaleString() : "N/A"} | proposals loaded: ${payload.proposalCount ?? 0} | scanned: ${payload.scannedProposalCount ?? payload.proposalCount ?? 0} | processed: ${payload.processedProposalCount ?? payload.proposalCount ?? 0}${payload.syncing ? ` | sync in progress (${payload.syncProcessedProposals ?? 0}/${payload.syncScannedProposals ?? payload.syncTotalProposals ?? 0})` : ""}${payload.partial ? " | partial" : ""}${payload.notice ? ` | ${payload.notice}` : ""}${payload.lastSyncError ? ` | sync error: ${payload.lastSyncError}` : ""}`
    );
    render();
  } catch (error) {
    setStatus(`Error: ${error.message}`);
    dreps = [];
    committeeMembers = [];
    proposalInfo = {};
    render();
  } finally {
    refreshButton.disabled = false;
  }
}

function populateActionSelect() {
  const previous = actionSelect.value;
  const options = Object.entries(proposalInfo)
    .map(([proposalId, info]) => ({
      proposalId,
      actionName: info.actionName || proposalId
    }))
    .sort((a, b) => a.actionName.localeCompare(b.actionName));

  actionSelect.innerHTML = '<option value="">All governance actions</option>';
  for (const option of options) {
    const node = document.createElement("option");
    node.value = option.proposalId;
    node.textContent = option.actionName;
    actionSelect.appendChild(node);
  }
  if (previous && options.some((option) => option.proposalId === previous)) {
    actionSelect.value = previous;
  }
}

function populateActionTypeSelect() {
  const selected = new Set(
    Array.from(actionTypeSelect.selectedOptions || []).map((option) => option.value).filter(Boolean)
  );
  const types = Array.from(
    new Set(
      Object.values(proposalInfo)
        .map((info) => info?.governanceType || "Unknown")
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  actionTypeSelect.innerHTML = "";
  for (const type of types) {
    const node = document.createElement("option");
    node.value = type;
    node.textContent = type;
    if (selected.has(type)) node.selected = true;
    actionTypeSelect.appendChild(node);
  }
}

attendanceInput.addEventListener("input", () => {
  attendanceValue.textContent = `${attendanceInput.value}%`;
  render();
});
searchInput.addEventListener("input", render);
sortSelect.addEventListener("change", render);
modeSelect.addEventListener("change", render);
actionSelect.addEventListener("change", render);
actionTypeSelect.addEventListener("change", render);
includeActiveActionsInput.addEventListener("change", render);
includeAlignmentInput.addEventListener("change", render);
includeAttendanceInput.addEventListener("change", render);
includeTransparencyInput.addEventListener("change", render);
includeResponsivenessInput.addEventListener("change", render);
refreshButton.addEventListener("click", loadLiveData);

loadLiveData();
