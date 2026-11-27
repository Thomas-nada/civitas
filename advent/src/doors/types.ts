export type Kind = "read" | "wallet" | "sign" | "tx" | "mint";

export const KIND_LABEL: Record<Kind, string> = {
  read: "Free · no wallet",
  wallet: "Free · connect a wallet (read-only)",
  sign: "Free · sign a message",
  tx: "Costs ~0.2 ADA",
  mint: "Costs ~0.3 ADA · ~1.2 ADA stays with your NFT",
};

export interface Door {
  day: number;
  title: string;
  emoji: string;
  kind: Kind;
  teaser: string;
  /** Draw into `el`. May return a cleanup function (timers etc). */
  render(el: HTMLElement): Promise<void | (() => void)>;
}
