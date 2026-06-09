---
CIP: ????
Title: Governance Action Comment Metadata
Status: Proposed
Category: Metadata
Authors:
  - TBD
Discussions-To: https://github.com/cardano-foundation/CIPs/discussions
Created: 2026-06-09
Requires: CIP-0010
---

## Abstract

This CIP defines a standard transaction metadata format under label **1215** for
attaching public comments to Cardano governance actions. A comment is linked to a
specific governance action by the submission transaction hash and certificate index,
authored implicitly by the stake address derivable from the comment transaction's
inputs, and optionally threaded via a `replyTo` field. Comment content may be stored
inline as chunked strings or referenced off-chain via a URL/hash anchor. Any indexer
can reconstruct the full comment tree from chain data alone — no shared API or
trusted third party is required.

---

## Motivation

Governance actions submitted under CIP-1694 currently attract discussion only on
individual explorers or off-chain forums. Comments left on one explorer are invisible
to every other. This creates fragmented, siloed discourse around decisions that affect
the entire Cardano network.

A chain-native comment standard provides properties no off-chain system can guarantee:

- **Permanence** — comments are stored on-chain and cannot be deleted by any single
  party.
- **Permissionlessness** — any ada holder can comment by submitting a normal
  transaction. The transaction fee (~0.17–0.20 ADA) provides inherent spam deterrence
  without requiring any application-level gatekeeping.
- **Universality** — any explorer, wallet, or dApp implementing this CIP displays the
  same comments from the same source of truth.
- **Verifiable authorship** — the transaction signature is the proof of authorship.
  No additional cryptographic ceremony is needed.
- **Proposer identification** — explorers can identify when the submitter of a
  governance action is the same entity commenting on their own proposal, purely from
  on-chain data.

---

## Specification

### 1. Metadata Label

All conforming comment transactions MUST include metadata under label **1215**.

```
Transaction metadata key: 1215
```

### 2. Top-Level Schema

```json
{
  "1215": {
    "v": 1,
    "govAction": {
      "txHash": "<64-char lowercase hex>",
      "index": 0
    },
    "body": ["<string, ≤64 UTF-8 bytes>", "..."],
    "anchor": {
      "url": "<string ≤64 UTF-8 bytes>  OR  [\"<chunk>\", \"<chunk>\", ...]",
      "hash": "<64-char lowercase hex (blake2b-256)>"
    },
    "replyTo": "<64-char lowercase hex tx hash>"
  }
}
```

#### 2.1 Required Fields

| Field | Type | Description |
|---|---|---|
| `v` | integer | Schema version. MUST be `1` for this version. |
| `govAction` | object | Identifies the governance action being commented on. |
| `govAction.txHash` | string | Transaction hash of the governance action submission, as 64 lowercase hex characters. |
| `govAction.index` | integer | Certificate index of the governance action within that transaction. MUST be a non-negative integer. MUST be `0` when the transaction contains exactly one governance action. |

At least one of `body` or `anchor` MUST be present.

#### 2.2 Optional Fields

**`body`** *(array of strings)*

The comment text, split into chunks of at most 64 UTF-8 bytes each due to the
Cardano metadata string length limit. Consumers MUST concatenate all elements in
order to recover the full comment.

- MUST contain at least one non-empty string if present.
- Each element MUST be ≤64 UTF-8 bytes.
- The concatenated result SHOULD NOT exceed approximately 2560 characters
  (40 chunks). Comments exceeding this SHOULD use `anchor` instead, or in addition.
- If both `body` and `anchor` are present, `body` is treated as the primary content
  and `anchor` as an extended version.

---

**`anchor`** *(object)*

A reference to off-chain comment content for longer or richer text.

| Sub-field | Type | Description |
|---|---|---|
| `url` | string or array of strings | URL of the content. If a string, MUST be ≤64 UTF-8 bytes. If an array, each element MUST be ≤64 UTF-8 bytes; elements are concatenated in order to form the full URL. |
| `hash` | string | blake2b-256 hash of the raw response bytes at `url`, as 64 lowercase hex characters. |

Consumers MUST verify the hash before displaying anchor content. Consumers SHOULD
support `ipfs://` URIs by resolving them via a public IPFS gateway. If hash
verification fails, consumers MUST NOT display the content and SHOULD indicate that
the anchor is invalid.

The content at the URL MUST be a UTF-8 encoded text document. It SHOULD be plain
text or Markdown.

---

**`replyTo`** *(string)*

The transaction hash of the parent comment transaction, as 64 lowercase hex
characters.

- MUST NOT be present on top-level comments.
- If present, the referenced transaction SHOULD itself be a valid label-1215 comment
  for the same `govAction`.
- If `replyTo` points to a comment whose `govAction` does not match the reply's own
  `govAction`, the reply SHOULD be treated as a top-level comment on its declared
  `govAction` and `replyTo` SHOULD be ignored.

---

### 3. Author Derivation

The author of a comment is the **stake address** derivable from the inputs of the
comment transaction.

Implementations SHOULD resolve the stake key (`stake1...`) from the first input
address in the comment transaction using standard Cardano address decomposition.

**No `stakeAddress` or author field is included in the metadata.** The transaction
itself is the proof of authorship. The stake address cannot be forged because
spending the input requires possession of the corresponding signing key.

If no stake key can be derived (e.g., script-locked inputs), the payment address of
the first input SHOULD be used as the author identifier.

Explorers SHOULD display the derived `stake1...` address as the default author
identifier. If the stake key is registered as a DRep (per CIP-0119), the DRep's
display name and voting power MAY additionally be shown. If the stake key belongs to
a registered SPO, that identity MAY additionally be shown.

### 4. Proposer Identification

A commenter is the **proposer** of the governance action being commented on if and
only if:

```
stakeAddress(comment transaction inputs) == stakeAddress(govAction.txHash inputs)
```

Explorers implementing this CIP SHOULD resolve the stake address from both the
comment transaction and the governance action submission transaction and compare them.
If they match, the explorer MAY display a visual indicator (e.g., a "Proposer" label)
alongside the comment.

This check requires no extra metadata fields. It is a pure derivation from on-chain
data and cannot be spoofed.

> **Edge case:** If the governance action was submitted via a script address with no
> stake key, the proposer identity check cannot be performed and SHOULD be skipped
> silently.

### 5. Threading

Comments form a tree. Top-level comments have no `replyTo`. Replies carry the same
`govAction` reference as their parent, enabling the full comment tree to be
reconstructed from a single indexed query.

#### 5.1 Indexing Algorithm

```
1. Retrieve all label-1215 transactions where govAction matches the target action.
2. Partition into roots (no replyTo) and replies (have replyTo).
3. Build the tree by linking each reply to its parent by replyTo (the parent's txHash).
4. Sort siblings by block slot ascending for chronological order within each level.
```

Implementations SHOULD handle cycles defensively (a reply chain that eventually
references itself) by stopping traversal after a reasonable depth limit. A display
depth limit of 10 levels is RECOMMENDED.

#### 5.2 Orphan Replies

If a reply's `replyTo` does not correspond to any indexed comment for the same
`govAction` — either because the parent transaction was not yet indexed, the
reference is incorrect, or the `govAction` mismatch rule above applies — the reply
SHOULD be displayed as a top-level comment.

### 6. Validation

A label-1215 transaction is **valid** for indexing if all of the following hold:

1. `v` equals `1`
2. `govAction.txHash` is a 64-character lowercase hex string
3. `govAction.index` is a non-negative integer
4. At least one of `body` or `anchor` is present
5. If `body` is present: it is a non-empty array; each element is a string of 1–64
   UTF-8 bytes
6. If `anchor` is present: `anchor.hash` is a 64-character lowercase hex string;
   `anchor.url` is a non-empty string (≤64 UTF-8 bytes) or a non-empty array of
   non-empty strings (each ≤64 UTF-8 bytes)
7. If `replyTo` is present: it is a 64-character lowercase hex string

Unknown top-level keys within the `1215` object MUST be ignored to allow forward
compatibility with future versions of this standard.

---

## Examples

### Example 1 — Short inline comment (top-level)

A community member comments on a treasury withdrawal proposal. The full comment fits
in two chunks.

```json
{
  "1215": {
    "v": 1,
    "govAction": {
      "txHash": "9a9d53c4e8f2b1d7a6c3e5f8b2d4a7c1e3f5b8d2a4c6e8f1b3d5a7c9e2f4b6d8",
      "index": 0
    },
    "body": [
      "This treasury withdrawal seems underfunded for the stated scope.",
      " The budget breakdown in section 3 does not add up."
    ]
  }
}
```

The commenter's stake address is derived from the transaction inputs. Explorers
compare it against the stake address that submitted the governance action transaction
`9a9d53c4...`. If they match, the comment is labelled "Proposer".

---

### Example 2 — Reply to Example 1

The proposer responds to the comment above. `replyTo` contains the transaction hash
of Example 1's comment transaction. `govAction` is repeated for efficient indexing.

```json
{
  "1215": {
    "v": 1,
    "govAction": {
      "txHash": "9a9d53c4e8f2b1d7a6c3e5f8b2d4a7c1e3f5b8d2a4c6e8f1b3d5a7c9e2f4b6d8",
      "index": 0
    },
    "body": [
      "Section 3 has been revised. The updated budget anchor is in the",
      " amended governance action transaction."
    ],
    "replyTo": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
  }
}
```

---

### Example 3 — Long-form comment via anchor

A DRep publishes a detailed analysis too long for inline storage. The content is
hosted on IPFS. The blake2b-256 hash of the raw IPFS response is included for
verification.

```json
{
  "1215": {
    "v": 1,
    "govAction": {
      "txHash": "9a9d53c4e8f2b1d7a6c3e5f8b2d4a7c1e3f5b8d2a4c6e8f1b3d5a7c9e2f4b6d8",
      "index": 0
    },
    "body": ["Detailed analysis — see anchor for full text."],
    "anchor": {
      "url": "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      "hash": "3d5a7c9e2f4b6d89a9d53c4e8f2b1d7a6c3e5f8b2d4a7c1e3f5b8d2a4c6e8f1b"
    }
  }
}
```

---

### Example 4 — Anchor with a URL longer than 64 bytes

When the anchor URL exceeds 64 bytes, it is expressed as an array of strings that
are concatenated to form the full URL.

```json
{
  "1215": {
    "v": 1,
    "govAction": {
      "txHash": "9a9d53c4e8f2b1d7a6c3e5f8b2d4a7c1e3f5b8d2a4c6e8f1b3d5a7c9e2f4b6d8",
      "index": 0
    },
    "anchor": {
      "url": [
        "https://raw.githubusercontent.com/example-org/gov-comments/",
        "main/proposals/9a9d53c4/analysis.md"
      ],
      "hash": "3d5a7c9e2f4b6d89a9d53c4e8f2b1d7a6c3e5f8b2d4a7c1e3f5b8d2a4c6e8f1b"
    }
  }
}
```

---

## Rationale

### Why label 1215?

Label 1215 was chosen for its historical significance: it is the year of the
**Magna Carta** (15 June 1215), the foundational constitutional document in which
English barons compelled King John to acknowledge that even a sovereign must answer
to law — and that subjects have the right to be heard. This CIP formalises precisely
that principle on Cardano: any ada holder may publicly comment on a governance action
and have that comment preserved permanently, without the permission of any central
authority.

The label is also unregistered, sits in a clean gap in the CIP-0010 registry, and is
immediately memorable to anyone who encounters it in chain data.

### Why txHash + index rather than the bech32 govActionId?

The bech32 `gov_action1...` identifier is 66–70 characters long, exceeding Cardano's
64-byte metadata string value limit. Splitting it across two array elements introduces
a parsing dependency on the exact split point and is error-prone. The `txHash` +
`index` pair encodes exactly the same information: the tx hash is exactly 64
lowercase hex characters and the index is a small integer. Both fit within metadata
constraints without splitting. The bech32 form is always reconstructable from these
values.

### Why not extend CIP-0100?

CIP-0100 requires JSON-LD canonicalization and RDF dataset normalisation to compute
the body hash for witness verification. This is a substantial tooling requirement
that would exclude light wallets, simple dApps, and community tools from implementing
comment submission. Comments must be accessible to any ada holder; the barrier to
post should be as low as posting a message (CIP-0020). CIP-0119 established the
precedent of deriving authorship from the transaction itself rather than requiring an
explicit witness.

### Why derive authorship from tx inputs rather than an explicit witness or field?

The transaction signature already proves that the submitter controls the spending
keys for the inputs. This is as strong a proof of authorship as any inline signature
could provide. Including an explicit `stakeAddress` field would create a spoofing
vector: a commenter could include an address they do not own. Deriving from inputs
eliminates this.

### Why repeat govAction on every reply?

Without `govAction` on replies, an indexer retrieving all comments for a specific
governance action would need to recursively resolve the `replyTo` chain for every
reply to determine which action's discussion it belongs to. Repeating `govAction`
on all nodes of the tree — including nested replies — allows a single query by
`govAction.txHash` + `govAction.index` to retrieve the complete comment set, with
`replyTo` used only for local tree construction.

### Why support both body and anchor?

Short comments (typical replies, brief reactions) should be fully on-chain for
simplicity and permanence. Long-form analysis and structured documents benefit from
the anchor pattern — already established in Cardano governance for vote rationales.
A single standard covering both avoids fragmentation between implementations that
only handle one format.

### Spam prevention

The Cardano transaction fee (~0.17–0.20 ADA at current network parameters) provides
inherent economic deterrence against high-volume spam without requiring any
application-level mechanism. Explorers MAY additionally apply their own display
filters based on stake amount, DRep registration, or other signals, but such policies
are outside the scope of this standard.

---

## Path to Active

### Acceptance Criteria

- [ ] Metadata label 1215 registered in CIP-0010
- [ ] At least two independent explorer implementations (indexing and display)
- [ ] At least one wallet or dApp supporting comment submission
- [ ] Reference implementation of the indexing algorithm published

---

## Copyright

This CIP is licensed under
[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).
