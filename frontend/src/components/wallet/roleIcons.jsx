// One glyph per sign-in role, shared by the dialog's role controls and the
// topbar's role shortcuts so the two never drift.
import { IconBuilding, IconPersonFilled, IconPersonOutline, IconServer } from "./icons";

export const ROLE_ICONS = {
  drep: <IconPersonFilled size={15} />,
  delegator: <IconPersonOutline size={15} />,
  spo: <IconServer size={15} />,
  cc: <IconBuilding size={15} />
};
