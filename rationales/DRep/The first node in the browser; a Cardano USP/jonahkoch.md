<!-- url: ipfs://QmWxQbE1WohkKzbp8CHcrGDy1eLfGpHUzbMzV3cvuyjER4 -->
# jonahkoch

**Proposal:** The first node in the browser; a Cardano USP
**Vote:** Yes
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmcqbK3WPYiTGyjAnvX9sNbKupLHWxjuderNzz75STEN3S

I'm voting yes on Gerolamo for the same reason I voted yes on the combined proposal it was originally part of: a fully-validating browser node is something only Cardano can build without redesigning its base layer, and shipping it turns a latent architectural advantage into a competitive moat. Most Cardano wallets and dApps currently depend on centralized API providers to interact with the blockchain. That dependency reintroduces trust assumptions that decentralization is supposed to eliminate and it makes browser-based governance participation fragile in ways that matter to me directly. Gerolamo's browser extension, backed by its own validating node and exposing a CIP-30-style messaging API, removes that dependency at the application layer. A DRep with Gerolamo installed can verify chain state locally. A wallet can query UTxOs without asking Blockfrost. That's not a convenience feature; it's what "trustless" is supposed to mean in practice.
HLabs builds on its own production infrastructure here. The ouroboros-miniprotocols-ts library, the TypeScript implementation of Cardano's networking stack that Gerolamo's peer connectivity layer runs on is maintained by HLabs and in production use across the ecosystem. This team isn't learning how to implement mini-protocols in TypeScript; they wrote the library everyone else depends on. The browser-specific engineering challenges are real (IndexedDB performance, WebSocket proxy architecture, stable peer management across browser sessions) but these are solvable engineering problems, not open research questions. The M4 requirement of ≥15 stable peers maintained for ≥24 hours across ≥3 independent browser sessions with a non-Chromium screencast committed to the repo is a strong production-readiness bar.
At ₳4,600,000 (~$1.15M at $0.25), five FTEs at $200K annually with the best kickoff ratio in this batch (10% upfront, 90% against quarterly deliverables), the ask is appropriately scoped. The governance structure is the same dual-audited SundaeLabs escrow and same three-person oversight board with unilateral pause rights as the Pebble + tooling proposal. The public transaction journal and monthly status updates add a layer of transparency that exceeds anything else in this budget cycle. Separating Gerolamo from the combined proposal is better governance and it lets DReps evaluate each deliverable on its own merits and prevents a single component concern from blocking unrelated work. The merits here are clear.
