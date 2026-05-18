import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getPasskeyRelyingParty, PASSKEY_CHALLENGE_COOKIE } from "@/lib/passkeys";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

export async function POST(req: NextRequest) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const challenge = req.cookies.get(PASSKEY_CHALLENGE_COOKIE.register)?.value;
  if (!challenge) {
    return NextResponse.json({ error: "Missing challenge" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const attestationResponse = body?.attestationResponse;
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    const { rpID, rpOrigin } = getPasskeyRelyingParty(req);
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: challenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Registration failed" }, { status: 400 });
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    const credentialIdRaw: unknown = credentialID;
    let credentialIdBytes: Uint8Array | null = null;

    if (credentialIdRaw instanceof ArrayBuffer) {
      credentialIdBytes = new Uint8Array(credentialIdRaw);
    } else if (ArrayBuffer.isView(credentialIdRaw)) {
      credentialIdBytes = new Uint8Array(credentialIdRaw.buffer);
    } else if (typeof credentialIdRaw === "string" && credentialIdRaw.length > 0) {
      credentialIdBytes = isoBase64URL.toBuffer(credentialIdRaw);
    } else if (typeof attestationResponse?.id === "string" && attestationResponse.id.length > 0) {
      credentialIdBytes = isoBase64URL.toBuffer(attestationResponse.id);
    } else if (typeof attestationResponse?.rawId === "string" && attestationResponse.rawId.length > 0) {
      credentialIdBytes = isoBase64URL.toBuffer(attestationResponse.rawId);
    }

    const publicKeyBytes = new Uint8Array(credentialPublicKey);
    const credentialIdLength = credentialIdBytes?.length ?? 0;
    const publicKeyLength = publicKeyBytes.length;

    if (!credentialIdBytes || credentialIdLength === 0 || publicKeyLength === 0) {
      console.error("Passkey empty credential data", {
        credentialIdType: typeof credentialID,
        credentialIdLength,
        publicKeyType: typeof credentialPublicKey,
        publicKeyLength,
      });
      return NextResponse.json({ error: "Passkey không hợp lệ (credential rỗng)" }, { status: 400 });
    }

    const credentialIdBase64 = isoBase64URL.fromBuffer(credentialIdBytes);
    const publicKeyBase64 = isoBase64URL.fromBuffer(publicKeyBytes);

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("admin_passkeys").insert({
      name: name || null,
      credential_id: credentialIdBase64,
      public_key: publicKeyBase64,
      counter,
      transports: attestationResponse?.transports || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(PASSKEY_CHALLENGE_COOKIE.register, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Passkey register verify error:", error);
    const message = error instanceof Error ? error.message : "Không thể đăng ky passkey";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
