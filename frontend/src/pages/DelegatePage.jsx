// One-click delegate landing page, meant to be shared as a link in social
// posts. Loads just enough about the DRep to show who you are delegating to;
// the wallet prompt happens here on Civitas, never inside the post.
import { Link, useParams } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useActor, useDrepLive } from "../api/queries";
import DelegateButton from "../components/delegation/DelegateButton";
import MetaVerifyPill from "../components/MetaVerifyPill";
import { Alert, Avatar, Card, PageHeader, Skeleton, StatusPill } from "../ui";
import { formatAdaCompact, truncateMiddle } from "../lib/governance/format";

export default function DelegatePage() {
  const { drepId } = useParams();
  const id = decodeURIComponent(String(drepId || "")).trim();
  const snapshot = useActor("drep", id);
  const liveQuery = useDrepLive(id);
  const live = liveQuery.data?.id ? liveQuery.data : null;
  const drep = live || snapshot.data?.actor || null;
  const name = drep?.name || drep?.profile?.name || "";
  useSeoMeta({
    title: name ? `Delegate to ${name}` : "Delegate to a DRep",
    description: name ? `One-click delegate your Cardano governance voting power to ${name} on Civitas.` : "One-click delegate your Cardano governance voting power on Civitas."
  });
  const loading = liveQuery.isLoading && snapshot.isLoading;
  const notFound = !loading && !drep;
  const imageUrl = drep?.profile?.imageUrl || "";
  const bio = String(drep?.profile?.bio || "").trim();

  return (
    <main className="shell page p-delegate">
      <PageHeader eyebrow="Delegate" title={loading ? "Loading DRep…" : notFound ? "DRep not found" : `Delegate to ${name || truncateMiddle(id, 14, 6)}`}>
        <p className="c-hash break" style={{ marginTop: 8 }}>{id}</p>
      </PageHeader>
      {loading ? <Skeleton kind="card" /> : notFound ? (
        <Alert tone="warning" title="This DRep could not be found on chain.">{liveQuery.error?.message || snapshot.error?.message || "Check the link and try again."}</Alert>
      ) : (
        <Card accent className="p-delegate__card">
          <div className="p-delegate__who">
            <Avatar src={imageUrl} name={name} size="lg" />
            <div className="stack--2">
              <div className="row">
                <strong style={{ fontSize: "1.15rem" }}>{name || "Unnamed DRep"}</strong>
                {drep?.status ? <StatusPill status={drep.status} size="sm" /> : null}
                <MetaVerifyPill verification={live?.metadataVerification} />
              </div>
              {Number(drep?.votingPowerAda || 0) > 0 ? <span className="small muted">Current voting power {formatAdaCompact(drep.votingPowerAda)}</span> : null}
              {bio ? <p className="small muted" style={{ margin: 0 }}>{bio.length > 280 ? `${bio.slice(0, 280)}…` : bio}</p> : null}
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <DelegateButton drepId={id} block />
          </div>
          <p className="tiny muted" style={{ marginTop: 14 }}>
            Delegating your voting power is a certificate signed by your wallet; only the network fee is paid and your ADA never leaves your wallet. You can change your DRep at any time.
            {" "}<Link to={`/dreps/${encodeURIComponent(id)}`}>View the full profile</Link>
          </p>
        </Card>
      )}
    </main>
  );
}
