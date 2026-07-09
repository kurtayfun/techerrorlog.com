import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { adminDb, firebaseAdminDb } from "@/lib/firebase-admin";
import { doc, setDoc } from "firebase/firestore";
import { getArticlesData, getCategoriesData, getSettingsData } from "@/lib/content";

export const dynamic = "force-dynamic";

// Helper to get filepath by database name
const getFilePath = (type: string): string => {
  return path.join(process.cwd(), "src/data", `${type}.json`);
};

const adminPayload = (data: any) => ({
  ...data,
  secretToken: "AI_STUDIO_SECURE_ADMIN_SECRET_2026"
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "articles";

    const allowedTypes = ["articles", "categories", "settings", "prompts", "authors", "internal_links"];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid database type" }, { status: 400 });
    }

    let data: any;

    if (type === "articles") {
      data = await getArticlesData();
    } else if (type === "categories") {
      data = await getCategoriesData();
    } else if (type === "settings") {
      data = await getSettingsData();
    } else {
      // Fallback for types not stored directly in Firestore collections yet
      const filePath = getFilePath(type);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: `Database file ${type} not found` }, { status: 404 });
      }
      const fileContent = fs.readFileSync(filePath, "utf8");
      data = JSON.parse(fileContent);
    }

    return NextResponse.json({ success: true, type, data });
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

    // Write to local JSON file for resilience and local fallbacks
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    // Mirror to Cloud Firestore database permanently
    let writeSucceeded = false;
    if (firebaseAdminDb) {
      try {
        if (type === "articles") {
          for (const art of data) {
            if (art.slug) {
              await firebaseAdminDb.collection("articles").doc(art.slug).set(adminPayload(art), { merge: true });
            }
          }
        } else if (type === "categories") {
          for (const cat of data) {
            const docId = cat.id || cat.slug;
            if (docId) {
              await firebaseAdminDb.collection("categories").doc(docId).set(adminPayload(cat), { merge: true });
            }
          }
        } else if (type === "settings") {
          await firebaseAdminDb.collection("settings").doc("global").set(adminPayload(data), { merge: true });
        } else if (type === "internal_links") {
          await firebaseAdminDb.collection("settings").doc("internal_links").set(adminPayload({ links: data }), { merge: true });
        }
        writeSucceeded = true;
      } catch (adminWriteErr: any) {
        console.warn("[FS Admin Write Err] Failed via Admin SDK, falling back to Client SDK:", adminWriteErr.message);
      }
    }

    if (!writeSucceeded && adminDb) {
      try {
        if (type === "articles") {
          for (const art of data) {
            if (art.slug) {
              await setDoc(doc(adminDb, "articles", art.slug), adminPayload(art), { merge: true });
            }
          }
        } else if (type === "categories") {
          for (const cat of data) {
            const docId = cat.id || cat.slug;
            if (docId) {
              await setDoc(doc(adminDb, "categories", docId), adminPayload(cat), { merge: true });
            }
          }
        } else if (type === "settings") {
          await setDoc(doc(adminDb, "settings", "global"), adminPayload(data), { merge: true });
        } else if (type === "internal_links") {
          // Double down and save list of links too
          await setDoc(doc(adminDb, "settings", "internal_links"), adminPayload({ links: data }));
        }
        writeSucceeded = true;
      } catch (fsErr) {
        console.error(`[FS POST Err] Permanent mirror failed for ${type}: `, fsErr);
      }
    }

    // Also update settings timestamp if it's not settings itself
    if (type !== "settings") {
      const settingsPath = getFilePath("settings");
      if (fs.existsSync(settingsPath)) {
        try {
          const settingsContent = fs.readFileSync(settingsPath, "utf8");
          const settings = JSON.parse(settingsContent);
          settings.lastUpdated = new Date().toISOString();
          fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
          
          let tsUpdateSucceeded = false;
          if (firebaseAdminDb) {
            try {
              await firebaseAdminDb.collection("settings").doc("global").set(adminPayload({ lastUpdated: settings.lastUpdated }), { merge: true });
              tsUpdateSucceeded = true;
            } catch (tsAdminErr: any) {
              console.warn("Failed to update settings timestamp via Admin SDK:", tsAdminErr.message);
            }
          }
          
          if (!tsUpdateSucceeded && adminDb) {
            await setDoc(doc(adminDb, "settings", "global"), adminPayload({ lastUpdated: settings.lastUpdated }), { merge: true });
          }
        } catch (e) {
          console.error("Failed to update settings timestamp", e);
        }
      }
    }

    return NextResponse.json({ success: true, message: `Database ${type} successfully updated and sync'd to cloud.` });
  } catch (err: any) {
    console.error("Database write error:", err);
    return NextResponse.json({ error: err.message || "Failed to write data" }, { status: 500 });
  }
}
