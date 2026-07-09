import { NextRequest, NextResponse } from "next/server";
import { getSettingsData } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const settings = await getSettingsData();
    const correctPassword = settings?.adminPassword || "admin123";

    if (password === correctPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Hatalı şifre!" }, { status: 401 });
  } catch (err: any) {
    console.error("Login verification error:", err);
    return NextResponse.json({ success: false, error: err.message || "Giriş doğrulanırken bir hata oluştu." }, { status: 500 });
  }
}
