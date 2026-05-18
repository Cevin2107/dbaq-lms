import { NextRequest } from "next/server";

export function getPasskeyRelyingParty(req: NextRequest) {
  const origin = req.headers.get("origin") || req.nextUrl.origin;
  let rpID = process.env.PASSKEY_RP_ID;
  if (!rpID) {
    try {
      rpID = new URL(origin).hostname;
    } catch {
      rpID = "localhost";
    }
  }

  return {
    origin,
    rpID,
    rpName: process.env.PASSKEY_RP_NAME || "Admin",
    rpOrigin: process.env.PASSKEY_RP_ORIGIN || origin,
  };
}

export const PASSKEY_CHALLENGE_COOKIE = {
  register: "admin_passkey_reg_challenge",
  auth: "admin_passkey_auth_challenge",
};
