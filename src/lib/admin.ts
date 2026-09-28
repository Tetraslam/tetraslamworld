import { parseAdminIds } from "../../shared/home-content";

export const ADMIN_USER_IDS = parseAdminIds(
  process.env.NEXT_PUBLIC_ADMIN_USER_IDS,
  process.env.NEXT_PUBLIC_ADMIN_USER_ID,
);
export function isAdminUser(id: string | null | undefined) {
  return !!id && ADMIN_USER_IDS.includes(id);
}
