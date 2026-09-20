// CIP-179 surveys for Civitas, read from a Tessera backend (the reference
// CIP-179 indexer, https://github.com/mpizenberg/Tessera) instead of
// scanning label-17 metadata ourselves. Tessera serves the survey records,
// the responses, its credential-proof verdicts, governance links and, once a
// survey is finalized, the hash-committed tally artifact. This module turns
// those answers into what the Civitas pages render, and counts an
// informational tally the way DRepTalk does: the generic CIP-179 rules and
// nothing beyond them, with DRep responses weighted by the voting power
// Civitas already holds.
//
// CommonJS on purpose (server.js is CJS); cip-179 and the Tessera client are
// ESM and are loaded on first use.

const ROLE_NAMES = ["DRep", "SPO", "CC", "Stakeholder", "Keyholder"];

const LIFECYCLE_LABELS = {
  open: "Open",
  closed: "Closed",
  cancelled: "Cancelled",
  untalliable: "Invalid definition",
};

let importsPromise;
function imports() {
  if (!importsPromise) {
    importsPromise = Promise.all([
      import("cip-179"),
      import("cip-179/domain"),
      import("cip-179/tally"),
      import("cardano-tessera-client"),
    ]).then(([codec, domain, tally, tessera]) => ({ codec, domain, tally, tessera }));
  }
  return importsPromise;
}

function roleName(role) {
  return ROLE_NAMES[Number(role)] ?? `role ${role}`;
}

function bigintString(value) {
  return typeof value === "bigint" ? value.toString() : String(value);
}

function credentialHashHex(credential, domain) {
  return domain.bytesToHex(credential.type === "key" ? credential.keyHash : credential.scriptHash);
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
// Responses are accepted through `endEpoch` inclusive, so the survey is open
// while the calendar's epoch is at or before it. A decision Tessera made
// outranks the clock: an untalliable definition was never a valid survey, and
// a verified cancellation ends it early.
function lifecycleOf({ talliable, cancelled, finalState, endEpoch, calendarEpoch }) {
  if (finalState?.state === "untalliable" || talliable === false) return "untalliable";
  if (finalState?.state === "cancelled" || cancelled) return "cancelled";
  return Number(calendarEpoch) <= Number(endEpoch) ? "open" : "closed";
}

// ── Question presentation ──────────────────────────────────────────────────
function optionLabels(options) {
  if (!options) return null;
  if (options.type === "options") return [...options.labels];
  if (options.type === "count") return Array.from({ length: options.count }, (_, i) => `Option ${i + 1}`);
  return null;
}

function questionView(question, index) {
  const options = "options" in question ? optionLabels(question.options) : null;
  const externalOptions = Boolean(question.options && question.options.type === "count");
  const view = {
    index,
    prompt: question.prompt || "",
    required: question.required === true,
    kind: question.type,
    kindLabel: "Custom format",
    options,
    externalOptions,
  };
  switch (question.type) {
    case "singleChoice":
      view.kindLabel = "Single choice";
      break;
    case "multiSelect":
      view.kindLabel = `Select ${question.minSelections} to ${question.maxSelections}`;
      view.minSelections = question.minSelections;
      view.maxSelections = question.maxSelections;
      break;
    case "ranking":
      view.kindLabel = `Rank ${question.minRanked} to ${question.maxRanked}`;
      view.minRanked = question.minRanked;
      view.maxRanked = question.maxRanked;
      break;
    case "numericRange":
      view.kindLabel = `Number between ${question.constraints.min} and ${question.constraints.max}`;
      view.min = bigintString(question.constraints.min);
      view.max = bigintString(question.constraints.max);
      view.step = question.constraints.step != null ? bigintString(question.constraints.step) : null;
      break;
    case "pointsAllocation":
      view.kindLabel = `Distribute ${question.budget} points`;
      view.budget = bigintString(question.budget);
      break;
    case "rating": {
      view.kindLabel = question.requireAll ? "Rate every option" : "Rate the options";
      view.requireAll = question.requireAll === true;
      const scale = question.scale || {};
      if (scale.type === "numeric") {
        view.scaleMin = bigintString(scale.constraints.min);
        view.scaleMax = bigintString(scale.constraints.max);
      } else if (scale.type === "labels") {
        view.scaleLabels = [...scale.labels];
        view.scaleMin = "0";
        view.scaleMax = String(scale.labels.length - 1);
      } else if (scale.type === "count") {
        view.scaleMin = "0";
        view.scaleMax = String(scale.count - 1);
      }
      break;
    }
    case "custom":
      view.contentAnchor = question.methodSchema
        ? { uri: question.methodSchema.uri, hash: null }
        : null;
      break;
    default:
      break;
  }
  return view;
}

// One answer as a sentence, for the responses list.
function answerText(answer, question) {
  const labels = question?.options || [];
  const label = (i) => labels[i] ?? `Option ${Number(i) + 1}`;
  switch (answer.type) {
    case "singleChoice":
      return label(answer.optionIndex);
    case "multiSelect":
      return answer.optionIndices.map(label).join(", ");
    case "ranking":
      return answer.ranking.map((i, pos) => `${pos + 1}. ${label(i)}`).join(" · ");
    case "numeric":
      return bigintString(answer.value);
    case "pointsAllocation":
      return answer.allocations.map((a) => `${label(a.optionIndex)}: ${bigintString(a.points)}`).join(", ");
    case "rating":
      return answer.ratings.map((r) => `${label(r.optionIndex)}: ${bigintString(r.rating)}`).join(", ");
    case "custom":
      return typeof answer.value === "string" ? answer.value : "(custom answer)";
    default:
      return "";
  }
}

// ── Summaries ──────────────────────────────────────────────────────────────
function surveySummary(agg, ctx) {
  const { finalState, countedByRole, responseCount, calendarEpoch, tip, appUrl, domain } = ctx;
  const record = agg.record;
  const def = record.definition;
  const key = agg.key;
  const lifecycle = lifecycleOf({
    talliable: agg.talliable,
    cancelled: agg.cancelled,
    finalState,
    endEpoch: def.endEpoch,
    calendarEpoch,
  });
  const counted = countedByRole
    ? Object.fromEntries(Object.entries(countedByRole).map(([role, n]) => [roleName(role), Number(n)]))
    : null;
  const submittedAt = tip && Number.isFinite(record.slot) && Number(tip.slot) >= Number(record.slot)
    ? Number(tip.time) - (Number(tip.slot) - Number(record.slot))
    : null;
  return {
    key,
    txHash: record.txHash,
    index: record.ref.index,
    slot: record.slot,
    epochNo: record.epochNo,
    submittedAt,
    title: def.title || "",
    description: def.description || "",
    eligibleRoles: def.eligibleRoles.map(roleName),
    endEpoch: def.endEpoch,
    sealed: agg.sealed,
    sealedUnsupported: agg.sealedUnsupported,
    external: agg.external,
    talliable: agg.talliable,
    cancelled: lifecycle === "cancelled",
    lifecycle,
    lifecycleLabel: LIFECYCLE_LABELS[lifecycle],
    finalState: finalState || null,
    countedByRole: counted,
    responseCount: Number(responseCount ?? agg.responseCount ?? 0),
    govLinks: agg.govLinks.map((link) => ({ actionId: link.actionId, title: link.title, endEpoch: link.endEpoch })),
    questions: def.questions.map(questionView),
    owner: { type: def.owner.type, hash: credentialHashHex(def.owner, domain) },
    sealedRound: def.submissionMode.type === "sealed" ? def.submissionMode.round : null,
    contentAnchor: def.contentAnchor
      ? { uri: def.contentAnchor.uri, hash: domain.bytesToHex(def.contentAnchor.hash) }
      : null,
    tesseraUrl: appUrl ? `${appUrl}/survey/${key}` : null,
  };
}

function presentResponses({ records, audit, verdicts, questions, domain, tally }) {
  const status = new Map();
  for (const r of audit.counted) status.set(`${r.txHash}:${r.responseIndex}`, { counted: true, exclusion: null });
  for (const e of audit.excludedRecords) {
    status.set(`${e.record.txHash}:${e.record.responseIndex}`, { counted: false, exclusion: e.key });
  }
  return records
    .map((record) => {
      const response = record.response;
      const hash = credentialHashHex(response.credential, domain);
      const k = `${record.txHash}:${record.responseIndex}`;
      const sealed = response.answers.type === "sealed";
      return {
        txHash: record.txHash,
        slot: record.slot,
        epochNo: record.epochNo,
        responseIndex: record.responseIndex,
        role: roleName(response.role),
        credential: `${response.credential.type}:${hash}`,
        credentialType: response.credential.type,
        credentialHash: hash,
        sealed,
        answers: sealed
          ? []
          : response.answers.answers.map((answer) => ({
              questionIndex: answer.questionIndex,
              type: answer.type,
              text: answerText(answer, questions[answer.questionIndex]),
              value: tally.toJsonSafe(answer),
            })),
        rationale: response.rationale
          ? { uri: response.rationale.uri, hash: domain.bytesToHex(response.rationale.hash) }
          : null,
        verdict: verdicts && Object.prototype.hasOwnProperty.call(verdicts, k) ? verdicts[k] : null,
        ...(status.get(k) || { counted: false, exclusion: null }),
      };
    })
    .sort((a, b) => (b.slot - a.slot) || (b.responseIndex - a.responseIndex));
}

// ── Informational tally ────────────────────────────────────────────────────
// The reading DRepTalk shows and the rules it counts under: cip-179's own
// audit decides what counts, its dedup decides which of several responses
// from one credential wins, and weightedTallySurvey does the aggregation.
// Civitas only chooses the responder sets and the weights. Two runs, because
// they differ in their responder SET: every counted DRep at unit weight is
// the head count of record, and only the DReps a voting power could be found
// for enter the weighted run, so a DRep with unresolved power never vanishes
// from their own answer.
function computeTally({ definition, responses, verdicts, power, artifactRole, artifactEndEpoch, sealed, codec, domain, tally }) {
  const audit = domain.auditResponses(responses, definition, verdicts);
  const drepRole = codec.Role.DRep;
  const countedDreps = audit.counted.filter((r) => r.response.role === drepRole);
  const responder = (r, weight) => ({
    credentialKey: domain.credentialKey(r.response.credential),
    weight,
    txHash: r.txHash,
    responseIndex: r.responseIndex,
    response: r.response,
  });
  const artifact = artifactRole ? { role: artifactRole, endEpoch: artifactEndEpoch } : null;

  // Run A: head count. A sealed survey's answers are unreadable before the
  // artifact, so its head-count questions are the artifact's own.
  const headcount = sealed && artifact
    ? [...artifact.role.questions]
    : tally.toArtifactQuestions(tally.weightedTallySurvey(definition, countedDreps.map((r) => responder(r, 1n))));

  // Run B: weighted, over the DReps with a known voting power (zero included).
  const weightedResponders = [];
  let answered = 0n;
  for (const r of countedDreps) {
    const weight = power.weightOf(credentialHashHex(r.response.credential, domain), r.response.credential.type === "script");
    if (weight === null) continue;
    weightedResponders.push(responder(r, weight));
    answered += weight;
  }
  const weighted = artifact
    ? [...artifact.role.questions]
    : tally.toArtifactQuestions(tally.weightedTallySurvey(definition, weightedResponders));

  const answeredPower = artifact
    ? artifact.role.responders.reduce((sum, r) => sum + BigInt(r.weight), 0n)
    : answered;
  const matchedCount = artifact ? artifact.role.responders.length : weightedResponders.length;
  const powerEpoch = artifact ? artifact.endEpoch : power.epoch;
  const totalPower = artifact
    ? (artifact.role.total ?? null)
    : (power.totalPower == null ? null : power.totalPower.toString());

  const excludedDreps = audit.excludedRecords.filter((e) => e.record.response.role === drepRole);
  const excludedBy = {};
  for (const e of excludedDreps) excludedBy[e.key] = (excludedBy[e.key] ?? 0) + 1;

  const roleCounts = {};
  for (const r of audit.counted) {
    const name = roleName(r.response.role);
    roleCounts[name] = (roleCounts[name] ?? 0) + 1;
  }

  return {
    audit,
    tally: {
      weightedSource: artifact ? "artifact" : "live",
      headcountSource: sealed && artifact ? "artifact" : "audit",
      powerEpoch,
      questions: { headcount, weighted },
      counted: countedDreps.length,
      matchedCount,
      answeredPower: answeredPower.toString(),
      totalPower,
      excluded: excludedDreps.length,
      excludedBy,
      roleCounts,
    },
  };
}

// Why no tally is drawn, or null when one can be. Decided once so the page
// cannot show figures and a refusal at the same time.
function tallyRefusal({ lifecycle, sealed, external, artifactRole }) {
  if (lifecycle === "untalliable") return "untalliable";
  if (lifecycle === "cancelled") return "cancelled";
  if (external) return "external";
  if (sealed && !artifactRole) return "sealed-pending";
  return null;
}

// ── DRep voting power ──────────────────────────────────────────────────────
// Weights for the live tally come from the Civitas snapshot's DRep list
// (voting power in ada per CIP-129 id). `drepIdOf(hashHex, isScript)` encodes
// a credential hash the way the snapshot names DReps.
function buildDrepPowerLookup(snapshot, drepIdOf) {
  const byId = new Map();
  let total = 0n;
  for (const drep of snapshot?.dreps || []) {
    const id = String(drep?.id || "");
    if (!id || id.startsWith("drep_always")) continue;
    const lovelace = BigInt(Math.max(0, Math.round(Number(drep.votingPowerAda || 0) * 1_000_000)));
    byId.set(id, lovelace);
    total += lovelace;
  }
  return {
    epoch: Number(snapshot?.latestEpoch) || null,
    totalPower: byId.size > 0 ? total : null,
    weightOf(hashHex, isScript) {
      if (byId.size === 0) return null;
      const id = drepIdOf(hashHex, isScript);
      return id && byId.has(id) ? byId.get(id) : null;
    },
  };
}

// ── Governance-action link ─────────────────────────────────────────────────
// A governance action's anchor document may link a survey (CIP-179 body.cip179).
async function parseGovernanceLink(metadata) {
  const { domain } = await imports();
  const parsed = domain.parseCip179Link(metadata);
  const problems = [...parsed.problems];
  const link = metadata?.body?.cip179;
  if (link?.specVersion !== 5) problems.push('"body.cip179.specVersion" must be 5.');
  if (parsed.surveyRef?.index > 65535) problems.push('"body.cip179.surveyIndex" must fit in an unsigned 16-bit integer.');
  return {
    surveyRef: problems.length === 0 ? parsed.surveyRef : null,
    problems,
  };
}

// The surveys each governance action links, keyed by action id. CIP-179
// links run Action → Survey (the action's anchor names the survey); Tessera
// indexes those links onto the survey, so the reverse map is derived here.
function indexLinksByAction(summaries) {
  const byAction = {};
  for (const s of summaries || []) {
    for (const link of s.govLinks || []) {
      const id = String(link.actionId || "").trim();
      if (!id) continue;
      (byAction[id] ||= []).push({
        key: s.key,
        txHash: s.txHash,
        index: s.index,
        title: s.title,
        lifecycle: s.lifecycle,
        lifecycleLabel: s.lifecycleLabel,
        endEpoch: s.endEpoch,
        actionEndEpoch: link.endEpoch,
        eligibleRoles: s.eligibleRoles,
        responseCount: s.responseCount,
        sealed: s.sealed,
        questionCount: s.questions.length,
      });
    }
  }
  return byAction;
}

// ── Reader ─────────────────────────────────────────────────────────────────
class SurveyIndexError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "SurveyIndexError";
    this.status = status;
  }
}

function mergePages(pages) {
  const body = {
    surveys: [], cancellations: [], govLinks: [],
    responseCounts: {}, countedByRole: {}, finalState: {},
    tip: null, fetchedAt: null, counts: null, incomplete: false,
  };
  for (const page of pages) {
    body.surveys.push(...(page.surveys || []));
    body.cancellations.push(...(page.cancellations || []));
    body.govLinks.push(...(page.govLinks || []));
    Object.assign(body.responseCounts, page.responseCounts || {});
    Object.assign(body.countedByRole, page.countedByRole || {});
    Object.assign(body.finalState, page.finalState || {});
    body.tip = page.tip || body.tip;
    body.fetchedAt = page.fetchedAt ?? body.fetchedAt;
    body.counts = body.counts || page.counts || null;
    body.incomplete = body.incomplete || Boolean(page.incomplete);
  }
  // A survey can ride two pages when a refresh lands mid-walk; keep one row per key.
  const seen = new Set();
  body.surveys = body.surveys.filter((row) => {
    const key = `${row?.txHash}:${row?.ref?.index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return body;
}

function createSurveyReader({
  backendUrl,
  appUrl = "",
  network = "mainnet",
  listTtlMs = 120_000,
  bundleTtlMs = 60_000,
  getPowerLookup = () => ({ epoch: null, totalPower: null, weightOf: () => null }),
  maxPages = 25,
}) {
  const base = String(backendUrl || "").replace(/\/+$/, "");
  const app = String(appUrl || "").replace(/\/+$/, "");
  let clientPromise;
  const listCache = { at: 0, value: null, promise: null };
  const bundleCache = new Map(); // key -> { at, value }

  async function client() {
    if (!clientPromise) {
      clientPromise = imports().then(({ tessera }) => tessera.createTesseraClient({ baseUrl: base, network, timeoutMs: 20_000 }));
    }
    return clientPromise;
  }

  async function calendarEpoch() {
    const { tessera } = await imports();
    return tessera.currentEpoch(network);
  }

  function notReady() {
    return new SurveyIndexError("The survey index is still warming up. Please try again in a moment.", 503);
  }

  async function walkList() {
    const c = await client();
    for (let restart = 0; restart < 3; restart += 1) {
      const pages = [];
      let cursor;
      let resync = false;
      for (let i = 0; i < maxPages; i += 1) {
        const page = await c.surveys({ limit: 200, ...(cursor ? { cursor } : {}) });
        if (!page.ready) throw notReady();
        if (page.body.resync) { resync = true; break; }
        pages.push(page.body);
        cursor = page.body.nextCursor;
        if (!cursor) break;
      }
      if (!resync) return mergePages(pages);
    }
    throw new SurveyIndexError("The survey index kept refreshing while it was being read. Please try again.", 503);
  }

  async function buildList() {
    // The Tessera client hands back records already decoded into cip-179
    // types (bytes as Uint8Array, big integers as bigint); the wire (JSON-safe)
    // form the widget re-decodes client-side is produced with toJsonSafe.
    const [{ domain, tally }, body, epoch] = await Promise.all([imports(), walkList(), calendarEpoch()]);
    const surveys = body.surveys;
    const cancellations = body.cancellations;
    const finalizedCancelled = new Set(
      Object.entries(body.finalState).filter(([, s]) => s?.state === "cancelled").map(([k]) => k),
    );
    const aggregates = domain.aggregate(surveys, cancellations, body.responseCounts, body.tip, body.govLinks, finalizedCancelled);
    const rawByKey = new Map();
    for (const row of body.surveys) {
      rawByKey.set(`${row.txHash}:${row.ref.index}`, tally.toJsonSafe(row));
    }
    const summaries = aggregates.map((agg) => surveySummary(agg, {
      finalState: body.finalState[agg.key],
      countedByRole: body.countedByRole[agg.key],
      responseCount: body.responseCounts[agg.key],
      calendarEpoch: epoch,
      tip: body.tip,
      appUrl: app,
      domain,
    }));
    const order = { open: 0, closed: 1, cancelled: 2, untalliable: 3 };
    summaries.sort((a, b) => (order[a.lifecycle] - order[b.lifecycle]) || (b.slot - a.slot));
    return {
      network,
      currentEpoch: epoch,
      tip: body.tip,
      fetchedAt: body.fetchedAt,
      incomplete: body.incomplete,
      counts: body.counts,
      surveys: summaries,
      finalState: body.finalState,
      countedByRole: body.countedByRole,
      rawByKey,
    };
  }

  async function list() {
    const now = Date.now();
    if (listCache.value && now - listCache.at < listTtlMs) return listCache.value;
    if (!listCache.promise) {
      listCache.promise = buildList()
        .then((value) => { listCache.value = value; listCache.at = Date.now(); return value; })
        .finally(() => { listCache.promise = null; });
    }
    // Serve a stale list while a refresh is in flight rather than blocking.
    if (listCache.value) return listCache.value;
    return listCache.promise;
  }

  async function artifactRoleFor(c, finalState, codec) {
    if (!finalState?.artifactHash) return { artifactRole: null, artifactEndEpoch: null, artifactHash: null };
    const artifact = await c.artifactByHash(finalState.artifactHash).catch(() => null);
    if (!artifact) return { artifactRole: null, artifactEndEpoch: null, artifactHash: finalState.artifactHash };
    const role = artifact.tally.perRole.find((r) => Number(r.role) === codec.Role.DRep)
      || { role: codec.Role.DRep, total: null, responders: [], questions: [] };
    return { artifactRole: role, artifactEndEpoch: artifact.tally.survey.endEpoch, artifactHash: finalState.artifactHash };
  }

  async function buildDetail(key) {
    const [{ codec, domain, tally }, c] = await Promise.all([imports(), client()]);
    let answer;
    try {
      answer = await c.wholeBundle(key);
    } catch (error) {
      if (error?.name === "TesseraHttpError" && error.status === 404) return null;
      throw error;
    }
    if (!answer.ready) throw notReady();
    const body = answer.body;
    const [listing, epoch] = await Promise.all([list().catch(() => null), calendarEpoch()]);
    const finalState = listing?.finalState?.[key] || null;
    const countedByRole = listing?.countedByRole?.[key];

    const record = body.survey;
    const responses = body.responses || [];
    const cancellations = body.cancellations || [];
    const finalizedCancelled = new Set(finalState?.state === "cancelled" ? [key] : []);
    const responseCount = domain.dedupeResponses(responses).length;
    const [agg] = domain.aggregate([record], cancellations, { [key]: responseCount }, body.tip, body.govLinks || [], finalizedCancelled);
    const summary = surveySummary(agg, {
      finalState, countedByRole, responseCount, calendarEpoch: epoch, tip: body.tip, appUrl: app, domain,
    });

    const { artifactRole, artifactEndEpoch, artifactHash } = await artifactRoleFor(c, finalState, codec);
    const refusal = tallyRefusal({ lifecycle: summary.lifecycle, sealed: agg.sealed, external: agg.external, artifactRole });
    const power = getPowerLookup();
    const { audit, tally: computed } = computeTally({
      definition: record.definition,
      responses,
      verdicts: body.verdicts,
      power,
      artifactRole,
      artifactEndEpoch,
      sealed: agg.sealed,
      codec, domain, tally,
    });
    return {
      network,
      currentEpoch: epoch,
      tip: body.tip,
      fetchedAt: body.fetchedAt ?? null,
      survey: { ...summary, record: tally.toJsonSafe(record) },
      responses: presentResponses({ records: responses, audit, verdicts: body.verdicts, questions: summary.questions, domain, tally }),
      tally: refusal ? null : computed,
      tallyRefusal: refusal,
      artifact: artifactHash ? { hash: artifactHash, endEpoch: artifactEndEpoch } : null,
    };
  }

  async function detail(key) {
    const now = Date.now();
    const cached = bundleCache.get(key);
    if (cached && now - cached.at < bundleTtlMs) return cached.value;
    const value = await buildDetail(key);
    bundleCache.set(key, { at: Date.now(), value });
    return value;
  }

  async function byRef(key) {
    const listing = await list();
    const summary = listing.surveys.find((s) => s.key === key);
    if (summary) return { ...summary, record: listing.rawByKey.get(key) || null };
    const [{ domain, tally }, c] = await Promise.all([imports(), client()]);
    const answer = await c.surveysByRefs([key]);
    if (!answer.ready) throw notReady();
    const record = answer.body.surveys.find((r) => `${r.txHash}:${r.ref.index}` === key);
    if (!record) return null;
    const cancellations = answer.body.cancellations || [];
    const [agg] = domain.aggregate([record], cancellations, answer.body.responseCounts || {}, answer.body.tip, answer.body.govLinks || [], new Set());
    return {
      ...surveySummary(agg, {
        finalState: answer.body.finalState?.[key],
        countedByRole: answer.body.countedByRole?.[key],
        responseCount: answer.body.responseCounts?.[key],
        calendarEpoch: await calendarEpoch(),
        tip: answer.body.tip,
        appUrl: app,
        domain,
      }),
      record: tally.toJsonSafe(record),
    };
  }

  // Every action → surveys link the index holds (from the cached list).
  async function linksByAction() {
    const listing = await list();
    return {
      fetchedAt: listing.fetchedAt,
      currentEpoch: listing.currentEpoch,
      incomplete: listing.incomplete,
      byAction: indexLinksByAction(listing.surveys),
    };
  }

  // The survey a governance action links, as the index sees it (with the
  // wire-form record so the answer form can sign it), or null.
  async function byAction(actionId) {
    const listing = await list();
    const id = String(actionId || "").trim();
    const summary = listing.surveys.find((s) => (s.govLinks || []).some((l) => l.actionId === id));
    if (!summary) return null;
    return { ...summary, record: listing.rawByKey.get(summary.key) || null };
  }

  // Whether a just-submitted response transaction has reached the index.
  async function txState(txHash) {
    const c = await client();
    const [status, responses] = await Promise.all([
      c.txStatus([txHash]).catch(() => ({})),
      c.responsesByTx(txHash).catch(() => ({ ready: false })),
    ]);
    const rows = responses.ready ? (responses.body.responses || []) : [];
    if (rows.length > 0) {
      for (const row of rows) bundleCache.delete(row.surveyKey);
      listCache.at = 0;
    }
    return {
      txHash,
      confirmations: Object.prototype.hasOwnProperty.call(status, txHash) ? status[txHash] : null,
      indexed: rows.length > 0,
      surveyKeys: [...new Set(rows.map((row) => row.surveyKey))],
    };
  }

  function invalidate(key) {
    if (key) bundleCache.delete(key);
    listCache.at = 0;
  }

  return { list, detail, byRef, byAction, linksByAction, txState, invalidate, calendarEpoch, appUrl: app, backendUrl: base, network };
}

module.exports = {
  ROLE_NAMES,
  LIFECYCLE_LABELS,
  SurveyIndexError,
  createSurveyReader,
  buildDrepPowerLookup,
  parseGovernanceLink,
  indexLinksByAction,
  // exported for tests
  lifecycleOf,
  questionView,
  answerText,
  computeTally,
  tallyRefusal,
  mergePages,
  imports,
};
