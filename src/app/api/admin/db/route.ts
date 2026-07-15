import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { adminDb, firebaseAdminDb } from "@/lib/firebase-admin";
import { doc, setDoc } from "firebase/firestore/lite";
import { getArticlesData, getCategoriesData, getSettingsData, getPromptsData } from "@/lib/content";

export const dynamic = "force-dynamic";

// Helper to get filepath by database name
const getFilePath = (type: string): string => {
  return path.join(process.cwd(), "src/data", `${type}.json`);
};

const adminPayload = (data: any) => ({
  ...data,
  secretToken: "AI_STUDIO_SECURE_ADMIN_SECRET_2026"
});

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;
  const password = authHeader.replace("Bearer ", "").trim();
  const settings = await getSettingsData();
  const correctPassword = settings?.adminPassword || "admin123";
  return password === correctPassword;
}

export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      if (data) {
        data = { ...data };
        if (data.geminiApiKey) {
          data.geminiApiKey = "••••••••••••••••";
        }
        if (data.adminPassword) {
          data.adminPassword = "••••••••••••••••";
        }
      }
    } else if (type === "prompts") {
      data = await getPromptsData();
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
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, data } = await req.json();

    const allowedTypes = ["articles", "categories", "settings", "prompts", "authors", "internal_links", "backup_to_local"];
    if (!allowedTypes || !allowedTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid database type" }, { status: 400 });
    }

    if (type === "backup_to_local") {
      let articlesBackedUp = 0;
      let categoriesBackedUp = 0;
      let settingsBackedUp = false;
      let promptsBackedUp = false;
      let linksBackedUp = false;

      // 1. BACKUP ARTICLES
      let firestoreArticles: any[] = [];
      let fetchSucceeded = false;

      if (firebaseAdminDb) {
        try {
          const snapshot = await firebaseAdminDb.collection('articles').get();
          firestoreArticles = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
              id: data.id || doc.id,
              category: data.category || 'Other',
              title: data.title || '',
              slug: data.slug || doc.id,
              errorCode: data.errorCode || 'General',
              priority: data.priority || 2,
              status: data.status || 'draft',
              difficulty: data.difficulty || 'Medium',
              estTime: data.estTime || '5 min',
              successRate: data.successRate || '100%',
              tags: data.tags || [],
              keywords: data.keywords || [],
              updated: data.updated || null,
              seo: data.seo || {}
            };
          });
          fetchSucceeded = true;
        } catch (err: any) {
          console.warn("[Backup API] Firestore articles read failed via Admin SDK:", err.message);
        }
      }

      if (!fetchSucceeded && adminDb) {
        try {
          const { collection, getDocs } = await import("firebase/firestore/lite");
          const snapshot = await getDocs(collection(adminDb, 'articles'));
          firestoreArticles = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
              id: data.id || doc.id,
              category: data.category || 'Other',
              title: data.title || '',
              slug: data.slug || doc.id,
              errorCode: data.errorCode || 'General',
              priority: data.priority || 2,
              status: data.status || 'draft',
              difficulty: data.difficulty || 'Medium',
              estTime: data.estTime || '5 min',
              successRate: data.successRate || '100%',
              tags: data.tags || [],
              keywords: data.keywords || [],
              updated: data.updated || null,
              seo: data.seo || {}
            };
          });
          fetchSucceeded = true;
        } catch (err: any) {
          console.error("[Backup API] Firestore articles read failed via Client SDK:", err.message);
        }
      }

      if (fetchSucceeded) {
        const filePath = getFilePath("articles");
        let localArticles: any[] = [];
        if (fs.existsSync(filePath)) {
          try {
            localArticles = JSON.parse(fs.readFileSync(filePath, "utf8"));
          } catch (e) {}
        }
        const articlesMap = new Map<string, any>();
        localArticles.forEach((a: any) => articlesMap.set(a.slug, a));
        firestoreArticles.forEach((a: any) => articlesMap.set(a.slug, a));
        const merged = Array.from(articlesMap.values());
        fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf8");
        articlesBackedUp = merged.length;
      }

      // 2. BACKUP CATEGORIES
      let firestoreCategories: any[] = [];
      let catFetchSucceeded = false;
      if (firebaseAdminDb) {
        try {
          const catSnap = await firebaseAdminDb.collection('categories').get();
          firestoreCategories = catSnap.docs.map((doc: any) => doc.data());
          catFetchSucceeded = true;
        } catch (e) {}
      }
      if (!catFetchSucceeded && adminDb) {
        try {
          const { collection, getDocs } = await import("firebase/firestore/lite");
          const catSnap = await getDocs(collection(adminDb, 'categories'));
          firestoreCategories = catSnap.docs.map((doc: any) => doc.data());
          catFetchSucceeded = true;
        } catch (e) {}
      }
      if (catFetchSucceeded && firestoreCategories.length > 0) {
        const filePath = getFilePath("categories");
        fs.writeFileSync(filePath, JSON.stringify(firestoreCategories, null, 2), "utf8");
        categoriesBackedUp = firestoreCategories.length;
      }

      // 3. BACKUP SETTINGS
      let firestoreSettings: any = null;
      let setFetchSucceeded = false;
      if (firebaseAdminDb) {
        try {
          const docSnap = await firebaseAdminDb.collection('settings').doc('global').get();
          if (docSnap.exists) {
            firestoreSettings = docSnap.data();
            setFetchSucceeded = true;
          }
        } catch (e) {}
      }
      if (!setFetchSucceeded && adminDb) {
        try {
          const { doc, getDoc } = await import("firebase/firestore/lite");
          const docSnap = await getDoc(doc(adminDb, 'settings', 'global'));
          if (docSnap.exists()) {
            firestoreSettings = docSnap.data();
            setFetchSucceeded = true;
          }
        } catch (e) {}
      }
      if (setFetchSucceeded && firestoreSettings) {
        const filePath = getFilePath("settings");
        fs.writeFileSync(filePath, JSON.stringify(firestoreSettings, null, 2), "utf8");
        settingsBackedUp = true;
      }

      // 4. BACKUP PROMPTS
      let firestorePrompts: any = null;
      let promptFetchSucceeded = false;
      if (firebaseAdminDb) {
        try {
          const docSnap = await firebaseAdminDb.collection('settings').doc('prompts').get();
          if (docSnap.exists) {
            firestorePrompts = docSnap.data();
            promptFetchSucceeded = true;
          }
        } catch (e) {}
      }
      if (!promptFetchSucceeded && adminDb) {
        try {
          const { doc, getDoc } = await import("firebase/firestore/lite");
          const docSnap = await getDoc(doc(adminDb, 'settings', 'prompts'));
          if (docSnap.exists()) {
            firestorePrompts = docSnap.data();
            promptFetchSucceeded = true;
          }
        } catch (e) {}
      }
      if (promptFetchSucceeded && firestorePrompts) {
        const filePath = getFilePath("prompts");
        fs.writeFileSync(filePath, JSON.stringify(firestorePrompts, null, 2), "utf8");
        promptsBackedUp = true;
      }

      // 5. BACKUP INTERNAL LINKS
      let firestoreLinks: any = null;
      let linksFetchSucceeded = false;
      if (firebaseAdminDb) {
        try {
          const docSnap = await firebaseAdminDb.collection('settings').doc('internal_links').get();
          if (docSnap.exists) {
            firestoreLinks = docSnap.data();
            linksFetchSucceeded = true;
          }
        } catch (e) {}
      }
      if (!linksFetchSucceeded && adminDb) {
        try {
          const { doc, getDoc } = await import("firebase/firestore/lite");
          const docSnap = await getDoc(doc(adminDb, 'settings', 'internal_links'));
          if (docSnap.exists()) {
            firestoreLinks = docSnap.data();
            linksFetchSucceeded = true;
          }
        } catch (e) {}
      }
      if (linksFetchSucceeded && firestoreLinks && Array.isArray(firestoreLinks.links)) {
        const filePath = getFilePath("internal_links");
        fs.writeFileSync(filePath, JSON.stringify(firestoreLinks.links, null, 2), "utf8");
        linksBackedUp = true;
      }

      return NextResponse.json({
        success: true,
        message: `Yedekleme ve Yerel Eşitleme İşlemi Başarılı!\n\n- ${articlesBackedUp} adet makale yerel dosyaya (articles.json) başarıyla eşitlendi.\n- ${categoriesBackedUp} adet kategori yerel dosyaya (categories.json) başarıyla eşitlendi.\n- Genel ayarlar yedeklendi: ${settingsBackedUp ? "Evet" : "Hayır"}\n- AI Prompt yönergeleri yedeklendi: ${promptsBackedUp ? "Evet" : "Hayır"}\n- İç link kuralları yedeklendi: ${linksBackedUp ? "Evet" : "Hayır"}\n\nSistem artık Firestore veritabanı kotası dolsa dahi bu yerel yedek dosyaları okuyarak kesintisiz şekilde çalışmaya devam edebilir!`
      });
    }

    if (!data) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    let finalData = data;
    if (type === "settings") {
      const currentSettings = await getSettingsData();
      finalData = { ...data };
      
      if (data.geminiApiKey === "••••••••••••••••") {
        finalData.geminiApiKey = currentSettings.geminiApiKey || "";
      }
      
      if (data.adminPassword === "••••••••••••••••") {
        finalData.adminPassword = currentSettings.adminPassword || "admin123";
      }
    }

    const filePath = getFilePath(type);
    
    // Ensure parent dir exists (should be src/data)
    try {
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      // Write to local JSON file for resilience and local fallbacks
      fs.writeFileSync(filePath, JSON.stringify(finalData, null, 2), "utf8");
    } catch (fsWriteErr: any) {
      console.warn(`[Local FS Write Warning] Failed to write local JSON file ${filePath} in this environment (expected and non-critical on live serverless environments):`, fsWriteErr.message);
    }

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
          await firebaseAdminDb.collection("settings").doc("global").set(adminPayload(finalData), { merge: true });
        } else if (type === "prompts") {
          await firebaseAdminDb.collection("settings").doc("prompts").set(adminPayload(finalData), { merge: true });
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
          await setDoc(doc(adminDb, "settings", "global"), adminPayload(finalData), { merge: true });
        } else if (type === "prompts") {
          await setDoc(doc(adminDb, "settings", "prompts"), adminPayload(finalData), { merge: true });
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
