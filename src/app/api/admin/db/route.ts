import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Helper to get filepath by database name
const getFilePath = (type: string): string => {
  return path.join(process.cwd(), "data", `${type}.json`);
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "articles";

    const allowedTypes = ["articles", "categories", "settings", "prompts", "authors", "internal_links"];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid database type" }, { status: 400 });
    }

    const filePath = getFilePath(type);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Database file ${type} not found` }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const parsedData = JSON.parse(fileContent);

    return NextResponse.json({ success: true, type, data: parsedData });
  } catch (err: any) {
    console.error("Database read error:", err);
    return NextResponse.json({ error: err.message || "Failed to read database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json();

    const allowedTypes = ["articles", "categories", "settings", "prompts", "authors", "internal_links"];
    if (!allowedTypes || !allowedTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid database type" }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const filePath = getFilePath(type);
    
    // Ensure parent dir exists (should be src/data)
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    // Also update settings timestamp if it's not settings itself
    if (type !== "settings") {
      const settingsPath = getFilePath("settings");
      if (fs.existsSync(settingsPath)) {
        try {
          const settingsContent = fs.readFileSync(settingsPath, "utf8");
          const settings = JSON.parse(settingsContent);
          settings.lastUpdated = new Date().toISOString();
          fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
        } catch (e) {
          console.error("Failed to update settings timestamp", e);
        }
      }
    }

    return NextResponse.json({ success: true, message: `Database ${type} successfully updated.` });
  } catch (err: any) {
    console.error("Database write error:", err);
    return NextResponse.json({ error: err.message || "Failed to write data" }, { status: 500 });
  }
}
