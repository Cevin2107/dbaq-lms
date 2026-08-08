import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_BANK_CODE = process.env.BANK_CODE || "TPB";
const DEFAULT_BANK_ACCOUNT = process.env.BANK_ACCOUNT || "10002150181";
const DEFAULT_BANK_OWNER = process.env.BANK_OWNER || "DAO BA ANH QUAN";

function buildVietQrImageUrl({
  bankCode,
  accountNumber,
  amount,
  description,
  template = "qr_only",
  accountName,
}: {
  bankCode: string;
  accountNumber: string;
  amount: number | string;
  description: string;
  template?: string;
  accountName?: string;
}) {
  const bankId = encodeURIComponent(String(bankCode || DEFAULT_BANK_CODE).trim());
  const accountNo = encodeURIComponent(String(accountNumber || DEFAULT_BANK_ACCOUNT).trim());
  const qrTemplate = encodeURIComponent(template || "qr_only");

  const params = new URLSearchParams();
  if (amount) {
    params.set("amount", String(amount).trim());
  }
  if (description) {
    params.set("addInfo", String(description).trim());
  }
  if (accountName || DEFAULT_BANK_OWNER) {
    params.set("accountName", String(accountName || DEFAULT_BANK_OWNER).trim());
  }

  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${qrTemplate}.png${suffix}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      bankCode = DEFAULT_BANK_CODE,
      accountNumber = DEFAULT_BANK_ACCOUNT,
      amount,
      content,
      description,
      template = "qr_only",
    } = body;

    const numAmount = Number(amount) || 0;
    const transferContent = String(content || description || "").trim();

    if (numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Số tiền phải lớn hơn 0" },
        { status: 400 }
      );
    }

    const qrImageUrl = buildVietQrImageUrl({
      bankCode,
      accountNumber,
      amount: numAmount,
      description: transferContent,
      template,
    });

    let base64DataUrl = qrImageUrl;
    try {
      const imgRes = await fetch(qrImageUrl, { cache: "no-store" });
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        base64DataUrl = `data:image/png;base64,${base64}`;
      }
    } catch (fetchErr) {
      console.warn("[VIETQR-SERVER-FETCH-WARN]", fetchErr);
    }

    return NextResponse.json({
      success: true,
      qrCode: base64DataUrl,
      qrLink: base64DataUrl,
      rawUrl: qrImageUrl,
      bankCode,
      bankAccount: accountNumber,
      bankOwner: DEFAULT_BANK_OWNER,
    });
  } catch (error: any) {
    console.error("[VIETQR-GENERATE-ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Lỗi khi tạo mã QR", details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bankCode = searchParams.get("bankCode") || DEFAULT_BANK_CODE;
    const accountNumber = searchParams.get("accountNumber") || DEFAULT_BANK_ACCOUNT;
    const amount = searchParams.get("amount");
    const description = searchParams.get("description") || searchParams.get("content") || "";
    const template = searchParams.get("template") || "compact2";

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Số tiền phải lớn hơn 0" },
        { status: 400 }
      );
    }

    const qrImageUrl = buildVietQrImageUrl({
      bankCode,
      accountNumber,
      amount: numAmount,
      description,
      template,
    });

    return NextResponse.json({
      success: true,
      qrCode: qrImageUrl,
      qrLink: qrImageUrl,
      bankCode,
      bankAccount: accountNumber,
      bankOwner: DEFAULT_BANK_OWNER,
    });
  } catch (error: any) {
    console.error("[VIETQR-GENERATE-GET-ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Lỗi khi tạo mã QR", details: error?.message },
      { status: 500 }
    );
  }
}
