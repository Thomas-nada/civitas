const ROLE_NAMES = ["DRep", "SPO", "CC", "Stakeholder", "Keyholder"];
const METHOD_TYPES = [
  "urn:cardano:poll-method:custom:v1",
  "urn:cardano:poll-method:single-choice:v2",
  "urn:cardano:poll-method:multi-select:v2",
  "urn:cardano:poll-method:ranking:v1",
  "urn:cardano:poll-method:numeric-range:v2",
  "urn:cardano:poll-method:points-allocation:v1",
  "urn:cardano:poll-method:rating:v1",
];

let importsPromise;
function imports() {
  if (!importsPromise) {
    importsPromise = Promise.all([
      import("cip-179"),
      import("cip-179/domain"),
      import("cip-179/evolution"),
      import("cip-179/txproof"),
    ]).then(([codec, domain, evolution, txproof]) => ({ codec, domain, evolution, txproof }));
  }
  return importsPromise;
}

function asHex(value) {
  return typeof value === "string" ? value.replace(/^(?:0x|\\x)/, "").toLowerCase() : "";
}

function credentialHex(credential, bytesToHex) {
  return bytesToHex(credential.type === "key" ? credential.keyHash : credential.scriptHash);
}

function anchorJson(anchor, bytesToHex) {
  return anchor ? { uri: anchor.uri, hash: bytesToHex(anchor.hash) } : undefined;
}

function optionsJson(options) {
  if (options.type === "options") return [...options.labels];
  return Array.from({ length: options.count }, (_, index) => `Option ${index + 1}`);
}

function integerJson(value) {
  const integer = BigInt(value);
  return integer >= BigInt(Number.MIN_SAFE_INTEGER) && integer <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(integer)
    : integer.toString();
}

function questionJson(question, index, bytesToHex) {
  const base = {
    questionId: `q${index}`,
    question: question.prompt,
    methodType: METHOD_TYPES[indexOfQuestionType(question.type)],
    required: question.required === true,
  };
  switch (question.type) {
    case "custom":
      return { ...base, contentAnchor: anchorJson(question.methodSchema, bytesToHex) };
    case "singleChoice":
      return { ...base, options: optionsJson(question.options), externalOptions: question.options.type === "count" };
    case "multiSelect":
      return {
        ...base,
        options: optionsJson(question.options),
        externalOptions: question.options.type === "count",
        minSelections: question.minSelections,
        maxSelections: question.maxSelections,
      };
    case "ranking":
      return {
        ...base,
        options: optionsJson(question.options),
        externalOptions: question.options.type === "count",
        minRanked: question.minRanked,
        maxRanked: question.maxRanked,
      };
    case "numericRange":
      return {
        ...base,
        numericConstraints: {
          minValue: integerJson(question.constraints.min),
          maxValue: integerJson(question.constraints.max),
          ...(question.constraints.step !== undefined ? { step: integerJson(question.constraints.step) } : {}),
        },
      };
    case "pointsAllocation":
      return { ...base, options: optionsJson(question.options), externalOptions: question.options.type === "count", budget: question.budget };
    case "rating": {
      const ratingScale = question.scale.type === "numeric"
        ? [integerJson(question.scale.constraints.min), integerJson(question.scale.constraints.max)]
        : question.scale.type === "labels"
          ? [0, question.scale.labels.length - 1]
          : [0, question.scale.count - 1];
      return {
        ...base,
        options: optionsJson(question.options),
        externalOptions: question.options.type === "count",
        ratingScale,
        ...(question.scale.type === "labels" ? { ratingLabels: [...question.scale.labels] } : {}),
        ...(question.scale.type === "count" ? { externalRatingLabels: true } : {}),
        requireAll: question.requireAll,
      };
    }
  }
}

function indexOfQuestionType(type) {
  return {
    custom: 0,
    singleChoice: 1,
    multiSelect: 2,
    ranking: 3,
    numericRange: 4,
    pointsAllocation: 5,
    rating: 6,
  }[type];
}

function answerJson(answer) {
  const questionId = `q${answer.questionIndex}`;
  switch (answer.type) {
    case "custom": return { questionId, customValue: answer.value };
    case "singleChoice": return { questionId, selection: [answer.optionIndex] };
    case "multiSelect": return { questionId, selection: [...answer.optionIndices] };
    case "ranking": return { questionId, selection: [...answer.ranking] };
    case "numeric": return { questionId, numericValue: integerJson(answer.value) };
    case "pointsAllocation": return { questionId, pointsAllocation: answer.allocations.map((a) => [a.optionIndex, a.points]) };
    case "rating": return { questionId, ratings: answer.ratings.map((r) => [r.optionIndex, integerJson(r.rating)]) };
  }
}

function surveyJson(record, bytesToHex) {
  const definition = record.definition;
  const ownerHash = credentialHex(definition.owner, bytesToHex);
  return {
    surveyTxId: record.ref.txIdHex,
    surveyIndex: record.ref.index,
    slot: record.slot,
    blockTime: record.blockTime,
    details: {
      specVersion: definition.specVersion,
      title: definition.title,
      description: definition.description,
      eligibleRoles: definition.eligibleRoles.map((role) => ROLE_NAMES[role]),
      endEpoch: definition.endEpoch,
      questions: definition.questions.map((question, index) => questionJson(question, index, bytesToHex)),
      isTimelocked: definition.submissionMode.type === "sealed",
      ownerCredential: { type: definition.owner.type, hash: ownerHash },
      ...(definition.owner.type === "key" ? { ownerKeyHash: ownerHash } : {}),
      ...(definition.submissionMode.type === "sealed"
        ? {
            drandRound: definition.submissionMode.round,
            padding: definition.submissionMode.paddingSize,
            drandChainHash: bytesToHex(definition.submissionMode.chainHash),
          }
        : {}),
      ...(definition.contentAnchor ? { contentAnchor: anchorJson(definition.contentAnchor, bytesToHex) } : {}),
    },
  };
}

function responseJson(record, bytesToHex) {
  const response = record.response;
  const credential = credentialHex(response.credential, bytesToHex);
  const sealed = response.answers.type === "sealed";
  const ciphertextHex = sealed ? bytesToHex(response.answers.ciphertext) : "";
  return {
    txId: record.txHash,
    slot: record.slot,
    txIndexInBlock: record.blockIndex,
    responseIndex: record.responseIndex,
    blockTime: record.blockTime,
    responderRole: ROLE_NAMES[response.role],
    surveyTxId: bytesToHex(response.surveyRef.txId),
    surveyIndex: response.surveyRef.index,
    responseCredential: `${response.credential.type}:${credential}`,
    answers: sealed ? [] : response.answers.answers.map(answerJson),
    ...(sealed ? { sealedHexChunks: ciphertextHex.match(/.{1,128}/g) || [] } : {}),
    ...(response.rationale ? { rationale: anchorJson(response.rationale, bytesToHex) } : {}),
  };
}

async function decodeCborPayload(cborHex) {
  const { codec, domain, evolution } = await imports();
  const metadatum = evolution.evolutionCodec.cborToMetadatum(domain.hexToBytes(asHex(cborHex)));
  try {
    return codec.decodePayload(metadatum);
  } catch (payloadError) {
    try {
      return codec.decodeMetadata(metadatum);
    } catch {
      throw payloadError;
    }
  }
}

function cborValue(row) {
  return row?.metadata || row?.cbor_metadata || row?.cbor || "";
}

async function fetchProof(get, txHash, cache) {
  if (!cache.has(txHash)) {
    cache.set(txHash, (async () => {
      const [cborRow, txInfo] = await Promise.all([
        get(`/txs/${txHash}/cbor`).catch(() => null),
        get(`/txs/${txHash}`).catch(() => null),
      ]);
      const { evolution, txproof } = await imports();
      let proof = null;
      if (cborRow?.cbor) {
        try {
          proof = txproof.decodeTxProof(evolution.evolutionCodec, cborRow.cbor);
        } catch {
          // Unreadable transaction evidence cannot prove an owner or responder.
        }
      }
      return {
        proof,
        txInfo,
      };
    })());
  }
  return cache.get(txHash);
}

async function epochForTx(get, txInfo, blockCache) {
  const block = txInfo?.block;
  if (!block) return null;
  if (!blockCache.has(block)) blockCache.set(block, get(`/blocks/${block}`).catch(() => null));
  return Number((await blockCache.get(block))?.epoch ?? NaN);
}

function refKey(ref, bytesToHex) {
  return `${bytesToHex(ref.txId)}:${ref.index}`;
}

async function buildIndex({ get, maxPages, linkedActionsBySurvey = new Map() }) {
  const { codec, domain } = await imports();
  const decoded = [];
  let incomplete = false;

  for (let page = 1; page <= maxPages; page += 1) {
    const rows = await get(`/metadata/txs/labels/17/cbor?page=${page}&count=100&order=desc`).catch(() => []);
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      const txHash = String(row?.tx_hash || "").toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(txHash) || !cborValue(row)) continue;
      try {
        const payload = await decodeCborPayload(cborValue(row));
        decoded.push({ txHash, payload });
      } catch {
        // Native-CBOR decoding is intentionally fail closed.
      }
    }
    if (rows.length < 100) break;
    if (page === maxPages) incomplete = true;
  }

  const proofCache = new Map();
  const blockCache = new Map();
  const surveyRecords = [];
  const responseRecords = [];
  const cancellationRecords = [];

  for (const item of decoded.filter((item) => item.payload.type === "definitions")) {
    const { proof, txInfo } = await fetchProof(get, item.txHash, proofCache);
    const epochNo = await epochForTx(get, txInfo, blockCache);
    for (let index = 0; index < item.payload.definitions.length; index += 1) {
      const definition = item.payload.definitions[index];
      if (definition.specVersion !== codec.SPEC_VERSION) continue;
      if (codec.validateDefinition(definition).length) continue;
      if (!Number.isFinite(epochNo) || definition.endEpoch <= epochNo) continue;
      if (!proof || !domain.cancellationVerified(definition.owner, proof)) continue;
      surveyRecords.push({
        txHash: item.txHash,
        slot: Number(txInfo?.slot || 0),
        epochNo,
        blockTime: Number(txInfo?.block_time || 0),
        ref: { txId: domain.hexToBytes(item.txHash), txIdHex: item.txHash, index },
        definition,
      });
    }
  }

  const surveysByRef = new Map(surveyRecords.map((record) => [
    `${record.txHash}:${record.ref.index}`,
    record,
  ]));

  for (const item of decoded.filter((item) => item.payload.type === "cancellations")) {
    const { proof, txInfo } = await fetchProof(get, item.txHash, proofCache);
    const epochNo = await epochForTx(get, txInfo, blockCache);
    for (const target of item.payload.cancellations) {
      const key = refKey(target, domain.bytesToHex);
      const survey = surveysByRef.get(key);
      if (!survey || !proof || !domain.cancellationVerified(survey.definition.owner, proof)) continue;
      if (!Number.isFinite(epochNo) || epochNo > survey.definition.endEpoch) continue;
      cancellationRecords.push({
        txHash: item.txHash,
        slot: Number(txInfo?.slot || 0),
        epochNo,
        blockTime: Number(txInfo?.block_time || 0),
        target,
        proof,
      });
    }
  }

  const cancelledRefs = new Set(cancellationRecords.map((record) => refKey(record.target, domain.bytesToHex)));

  for (const item of decoded.filter((item) => item.payload.type === "responses")) {
    const { proof, txInfo } = await fetchProof(get, item.txHash, proofCache);
    const epochNo = await epochForTx(get, txInfo, blockCache);
    for (let responseIndex = 0; responseIndex < item.payload.responses.length; responseIndex += 1) {
      const response = item.payload.responses[responseIndex];
      const key = refKey(response.surveyRef, domain.bytesToHex);
      const survey = surveysByRef.get(key);
      if (!survey || cancelledRefs.has(key)) continue;
      if (!Number.isFinite(epochNo) || epochNo > survey.definition.endEpoch) continue;
      if (codec.validateResponse(survey.definition, response).length) continue;
      const linkedActions = [...(linkedActionsBySurvey.get(key) || [])]
        .filter((link) => typeof link === "string" || Number(link?.expirationEpoch) === survey.definition.endEpoch)
        .map((link) => typeof link === "string" ? link : link.actionId)
        .filter(Boolean);
      if (!domain.responseCredentialProven(response, proof, linkedActions)) continue;
      responseRecords.push({
        txHash: item.txHash,
        slot: Number(txInfo?.slot || 0),
        epochNo,
        blockIndex: Number(txInfo?.index || 0),
        blockTime: Number(txInfo?.block_time || 0),
        responseIndex,
        response,
      });
    }
  }

  const surveys = surveyRecords
    .map((record) => ({ ...surveyJson(record, domain.bytesToHex), cancelled: cancelledRefs.has(`${record.txHash}:${record.ref.index}`) }))
    .sort((a, b) => b.slot - a.slot);
  const responsesBySurvey = {};
  for (const record of responseRecords.sort((a, b) => a.slot - b.slot || a.blockIndex - b.blockIndex || a.responseIndex - b.responseIndex)) {
    const key = refKey(record.response.surveyRef, domain.bytesToHex);
    (responsesBySurvey[key] ||= []).push(responseJson(record, domain.bytesToHex));
  }

  return { surveys, responsesBySurvey, cancelledRefs, incomplete, records: { surveyRecords, responseRecords, cancellationRecords } };
}

async function decodeDefinitionTransaction({ get, txHash, surveyIndex = 0 }) {
  const rows = await get(`/txs/${txHash}/metadata/cbor`).catch(() => []);
  const row = Array.isArray(rows) ? rows.find((item) => String(item?.label) === "17") : null;
  if (!row) return null;
  const payload = await decodeCborPayload(cborValue(row));
  if (payload.type !== "definitions") return null;
  const { codec, domain } = await imports();
  const definition = payload.definitions[surveyIndex];
  if (!definition || definition.specVersion !== codec.SPEC_VERSION || codec.validateDefinition(definition).length) return null;
  const { proof, txInfo } = await fetchProof(get, txHash, new Map());
  const epochNo = await epochForTx(get, txInfo, new Map());
  if (!Number.isFinite(epochNo) || definition.endEpoch <= epochNo) return null;
  if (!proof || !domain.cancellationVerified(definition.owner, proof)) return null;
  return surveyJson({
    txHash,
    slot: Number(txInfo?.slot || 0),
    blockTime: Number(txInfo?.block_time || 0),
    ref: { txId: domain.hexToBytes(txHash), txIdHex: txHash, index: surveyIndex },
    definition,
  }, domain.bytesToHex);
}

async function parseGovernanceLink(metadata) {
  const { domain } = await imports();
  const parsed = domain.parseCip179Link(metadata);
  const problems = [...parsed.problems];
  const link = metadata?.body?.cip179;
  if (link?.specVersion !== 5) {
    problems.push('"body.cip179.specVersion" must be 5.');
  }
  if (parsed.surveyRef?.index > 65535) {
    problems.push('"body.cip179.surveyIndex" must fit in an unsigned 16-bit integer.');
  }
  return {
    surveyRef: problems.length === 0 ? parsed.surveyRef : null,
    problems,
  };
}

module.exports = {
  buildIndex,
  decodeCborPayload,
  decodeDefinitionTransaction,
  parseGovernanceLink,
};
