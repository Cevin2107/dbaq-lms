import { NextRequest } from "next/server";

export function getPasskeyRelyingParty(req: NextRequest) {
  const originHeader = req.headers.get("origin");
  const hostHeader = req.headers.get("host") || req.headers.get("x-forwarded-host");
  const protoHeader = req.headers.get("x-forwarded-proto") || "https";

  let origin = originHeader;
  if (!origin) {
    if (hostHeader) {
      origin = `${protoHeader}://${hostHeader}`;
    } else {
      origin = req.nextUrl.origin;
    }
  }

  let hostname = "localhost";
  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = hostHeader?.split(":")[0] || "localhost";
  }

  let rpID = hostname;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    const envRpId = process.env.PASSKEY_RP_ID?.trim();
    if (envRpId && (hostname === envRpId || hostname.endsWith(`.${envRpId}`))) {
      rpID = envRpId;
    } else {
      rpID = hostname;
    }
  }

  return {
    origin,
    rpID,
    rpName: process.env.PASSKEY_RP_NAME || "Exams Admin",
    rpOrigin: origin,
  };
}

export const PASSKEY_CHALLENGE_COOKIE = {
  register: "admin_passkey_reg_challenge",
  auth: "admin_passkey_auth_challenge",
};
