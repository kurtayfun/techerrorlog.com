import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { adminDb, firebaseAdminDb } from './firebase-admin';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore/lite';

export const docMetadataSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  errorCode: z.string().default('General'),
  category: z.string().default('Other'),
  difficulty: z.string().default('Medium'),
  estTime: z.string().default('5 Mins'),
  successRate: z.string().default('100%'),
  date: z.string().default(''),
  author: z.string().default('TechErrorLog Team'),
  tags: z.array(z.string()).default([]),
});

export type DocMetadata = z.infer<typeof docMetadataSchema>;

export interface Doc {
  metadata: DocMetadata;
  content: string;
}

export function parseFrontmatter(fileContent: string): Doc {
  const lines = fileContent.split('\n');
  let inFrontmatter = false;
  const frontmatterLines: string[] = [];
  const contentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') {
      if (!inFrontmatter && frontmatterLines.length === 0) {
        inFrontmatter = true;
        continue;
      } else if (inFrontmatter) {
        inFrontmatter = false;
        continue;
      }
    }

    if (inFrontmatter) {
      frontmatterLines.push(line);
    } else {
      contentLines.push(line);
    }
  }

  const rawMetadata: Record<string, any> = {};
  frontmatterLines.forEach((line) => {
    const doubleCol = line.indexOf(':');
    if (doubleCol !== -1) {
      const key = line.slice(0, doubleCol).trim();
      let val = line.slice(doubleCol + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      
      if (key === 'tags') {
        rawMetadata[key] = val.split(',').map((t: string) => t.trim()).filter(Boolean);
      } else {
        rawMetadata[key] = val;
      }
    }
  });

  // Validate utilizing standard strict zod validation schemas
  const parseResult = docMetadataSchema.safeParse(rawMetadata);
  let metadata: DocMetadata;

  if (parseResult.success) {
    metadata = parseResult.data;
  } else {
    // Graceful fallback with standard safety baselines
    console.warn(`[Zod Validation Warn] Invalid frontmatter in file. Fallbacks applied. Errors:`, parseResult.error.format());
    metadata = {
      slug: rawMetadata.slug || '',
      title: rawMetadata.title || 'Untitled Diagnostic Document',
      description: rawMetadata.description || 'System health troubleshooting diagnostic logs.',
      errorCode: rawMetadata.errorCode || 'General',
      category: rawMetadata.category || 'Other',
      difficulty: rawMetadata.difficulty || 'Medium',
      estTime: rawMetadata.estTime || '5 Mins',
      successRate: rawMetadata.successRate || '100%',
      date: rawMetadata.date || new Date().toISOString().slice(0, 10),
      author: rawMetadata.author || 'TechErrorLog Team',
      tags: typeof rawMetadata.tags === 'string' 
        ? rawMetadata.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : Array.isArray(rawMetadata.tags) ? rawMetadata.tags : [],
    };
  }

  return {
    metadata,
    content: contentLines.join('\n').trim(),
  };
}

export function cleanContentAndExtractMetadata(content: string, existingMetadata: DocMetadata): { metadata: DocMetadata, content: string } {
  const trimmed = (content || '').trim();
  if (trimmed.startsWith('---')) {
    const parsed = parseFrontmatter(content);
    const mergedMetadata: DocMetadata = {
      slug: parsed.metadata.slug || existingMetadata.slug,
      title: parsed.metadata.title !== 'Untitled Diagnostic Document' && parsed.metadata.title !== 'Untitled' ? parsed.metadata.title : existingMetadata.title,
      description: parsed.metadata.description !== 'System health troubleshooting diagnostic logs.' && parsed.metadata.description !== '' ? parsed.metadata.description : existingMetadata.description,
      errorCode: parsed.metadata.errorCode !== 'General' ? parsed.metadata.errorCode : existingMetadata.errorCode,
      category: parsed.metadata.category !== 'Other' ? parsed.metadata.category : existingMetadata.category,
      difficulty: parsed.metadata.difficulty !== 'Medium' ? parsed.metadata.difficulty : existingMetadata.difficulty,
      estTime: parsed.metadata.estTime !== '5 Mins' && parsed.metadata.estTime !== '5 min' ? parsed.metadata.estTime : existingMetadata.estTime,
      successRate: parsed.metadata.successRate !== '100%' ? parsed.metadata.successRate : existingMetadata.successRate,
      date: parsed.metadata.date || existingMetadata.date,
      author: parsed.metadata.author || existingMetadata.author,
      tags: parsed.metadata.tags.length > 0 ? parsed.metadata.tags : existingMetadata.tags,
    };
    return {
      metadata: mergedMetadata,
      content: parsed.content,
    };
  }
  return {
    metadata: existingMetadata,
    content: content,
  };
}

// Global flag to track seeding status during hot server context
let isSeeded = false;
let cachedSettings: any = null;
let cachedPrompts: any = null;

// Circuit breaker state to handle Firestore quota exhaustion gracefully
let isFirestoreQuotaExceeded = false;
let lastQuotaCheckTime = 0;
const QUOTA_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)
const QUOTA_FILE_PATH = "/tmp/firestore_quota_exceeded_timestamp.txt";

function checkQuotaCircuitBreaker(): boolean {
  if (isFirestoreQuotaExceeded) {
    const now = Date.now();
    if (now - lastQuotaCheckTime > QUOTA_COOLDOWN_MS) {
      isFirestoreQuotaExceeded = false;
      try {
        if (fs.existsSync(QUOTA_FILE_PATH)) {
          fs.unlinkSync(QUOTA_FILE_PATH);
        }
      } catch (e) {}
    } else {
      return true;
    }
  }

  // File-based check to persist across serverless instances / server reloads
  try {
    if (fs.existsSync(QUOTA_FILE_PATH)) {
      const content = fs.readFileSync(QUOTA_FILE_PATH, "utf8").trim();
      const timestamp = parseInt(content, 10);
      if (!isNaN(timestamp)) {
        const now = Date.now();
        if (now - timestamp < QUOTA_COOLDOWN_MS) {
          isFirestoreQuotaExceeded = true;
          lastQuotaCheckTime = timestamp;
          return true;
        } else {
          try {
            fs.unlinkSync(QUOTA_FILE_PATH);
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    // Ignore any read/write issues in /tmp
  }

  return isFirestoreQuotaExceeded;
}

function handleFirestoreError(err: any) {
  const errMsg = String(err?.message || err || "").toLowerCase();
  if (
    errMsg.includes("quota limit exceeded") || 
    errMsg.includes("quota exceeded") || 
    errMsg.includes("resource_exhausted") || 
    errMsg.includes("quota") ||
    errMsg.includes("limit exceeded") ||
    errMsg.includes("exceeded free quota")
  ) {
    const now = Date.now();
    isFirestoreQuotaExceeded = true;
    lastQuotaCheckTime = now;
    try {
      fs.writeFileSync(QUOTA_FILE_PATH, String(now), "utf8");
    } catch (e) {}
    console.warn(`[Firestore Circuit Breaker] Quota limit detected. Gracefully failing over to local file-based database for next 10 minutes.`);
  }
}

const adminPayload = (data: any) => ({
  ...data,
  secretToken: "AI_STUDIO_SECURE_ADMIN_SECRET_2026"
});

// One-time startup synchronization mapping local static elements to Cloud Firestore
export async function seedIfEmpty() {
  if (isSeeded) return;
  if (checkQuotaCircuitBreaker()) {
    return;
  }

  // Try seeding via firebaseAdminDb first (Admin SDK)
  if (firebaseAdminDb) {
    try {
      const seedCheck = await firebaseAdminDb.collection("settings").doc("seed_state").get();
      if (seedCheck.exists && seedCheck.data()?.seeded) {
        isSeeded = true;
        return;
      }

      console.log("[db-seed] Database seeding initiated via Admin SDK. Deploying local templates into Firestore...");

      // Seed categories
      const categoriesPath = path.join(process.cwd(), "src/data/categories.json");
      if (fs.existsSync(categoriesPath)) {
        const categories = JSON.parse(fs.readFileSync(categoriesPath, "utf8"));
        for (const cat of categories) {
          await firebaseAdminDb.collection("categories").doc(cat.id || cat.slug).set(adminPayload(cat), { merge: true });
        }
      }

      // Seed settings
      const settingsPath = path.join(process.cwd(), "src/data/settings.json");
      if (fs.existsSync(settingsPath)) {
        const globalCheck = await firebaseAdminDb.collection("settings").doc("global").get();
        if (!globalCheck.exists) {
          const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
          await firebaseAdminDb.collection("settings").doc("global").set(adminPayload(settings), { merge: true });
        }
      }

      // Seed prompts
      const promptsPath = path.join(process.cwd(), "src/data/prompts.json");
      if (fs.existsSync(promptsPath)) {
        const promptsCheck = await firebaseAdminDb.collection("settings").doc("prompts").get();
        if (!promptsCheck.exists) {
          const prompts = JSON.parse(fs.readFileSync(promptsPath, "utf8"));
          await firebaseAdminDb.collection("settings").doc("prompts").set(adminPayload(prompts), { merge: true });
        }
      }

      // Seed articles with their parsed markdown content
      const articlesPath = path.join(process.cwd(), "src/data/articles.json");
      if (fs.existsSync(articlesPath)) {
        const articles = JSON.parse(fs.readFileSync(articlesPath, "utf8"));
        const contentDir = path.join(process.cwd(), "src/content");

        for (const art of articles) {
          let content = "";
          const mdxPath = path.join(contentDir, `${art.slug}.mdx`);
          if (fs.existsSync(mdxPath)) {
            content = fs.readFileSync(mdxPath, "utf8");
          } else {
            const mdPath = path.join(contentDir, `${art.slug}.md`);
            if (fs.existsSync(mdPath)) {
              content = fs.readFileSync(mdPath, "utf8");
            }
          }

          await firebaseAdminDb.collection("articles").doc(art.slug).set(adminPayload({
            ...art,
            content,
          }), { merge: true });
        }
      }

      await firebaseAdminDb.collection("settings").doc("seed_state").set(adminPayload({
        seeded: true,
        timestamp: new Date().toISOString()
      }));

      isSeeded = true;
      console.log("[db-seed] Seeding finished successfully via Admin SDK.");
      return;
    } catch (adminError: any) {
      handleFirestoreError(adminError);
      if (!checkQuotaCircuitBreaker()) {
        console.warn("[db-seed] Seeding failed with Admin SDK, falling back to Client Web SDK:", adminError.message);
      }
    }
  }

  // Fallback to client SDK (adminDb)
  if (adminDb && !checkQuotaCircuitBreaker()) {
    try {
      const seedCheck = await getDoc(doc(adminDb, "settings", "seed_state"));
      if (seedCheck.exists() && seedCheck.data()?.seeded) {
        isSeeded = true;
        return;
      }

      console.log("[db-seed] Database seeding initiated via Client Web SDK...");

      const categoriesPath = path.join(process.cwd(), "src/data/categories.json");
      if (fs.existsSync(categoriesPath)) {
        const categories = JSON.parse(fs.readFileSync(categoriesPath, "utf8"));
        for (const cat of categories) {
          await setDoc(doc(adminDb, "categories", cat.id || cat.slug), adminPayload(cat));
        }
      }

      const settingsPath = path.join(process.cwd(), "src/data/settings.json");
      if (fs.existsSync(settingsPath)) {
        const globalCheck = await getDoc(doc(adminDb, "settings", "global"));
        if (!globalCheck.exists()) {
          const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
          await setDoc(doc(adminDb, "settings", "global"), adminPayload(settings));
        }
      }

      const promptsPath = path.join(process.cwd(), "src/data/prompts.json");
      if (fs.existsSync(promptsPath)) {
        const promptsCheck = await getDoc(doc(adminDb, "settings", "prompts"));
        if (!promptsCheck.exists()) {
          const prompts = JSON.parse(fs.readFileSync(promptsPath, "utf8"));
          await setDoc(doc(adminDb, "settings", "prompts"), adminPayload(prompts));
        }
      }

      const articlesPath = path.join(process.cwd(), "src/data/articles.json");
      if (fs.existsSync(articlesPath)) {
        const articles = JSON.parse(fs.readFileSync(articlesPath, "utf8"));
        const contentDir = path.join(process.cwd(), "src/content");

        for (const art of articles) {
          let content = "";
          const mdxPath = path.join(contentDir, `${art.slug}.mdx`);
          if (fs.existsSync(mdxPath)) {
            content = fs.readFileSync(mdxPath, "utf8");
          } else {
            const mdPath = path.join(contentDir, `${art.slug}.md`);
            if (fs.existsSync(mdPath)) {
              content = fs.readFileSync(mdPath, "utf8");
            }
          }

          await setDoc(doc(adminDb, "articles", art.slug), adminPayload({
            ...art,
            content,
          }));
        }
      }

      await setDoc(doc(adminDb, "settings", "seed_state"), adminPayload({
        seeded: true,
        timestamp: new Date().toISOString()
      }));

      isSeeded = true;
      console.log("[db-seed] Seeding finished successfully via Client Web SDK.");
    } catch (error) {
      handleFirestoreError(error);
      if (!checkQuotaCircuitBreaker()) {
        console.error("[db-seed] Warning: Firestore automated seeding sequence failed: ", error);
      }
    }
  }
}

export async function getAllDocs(): Promise<Doc[]> {
  try {
    await seedIfEmpty();

    // 1. Read files locally
    const contentDir = path.join(process.cwd(), 'src/content');
    let localDocs: Doc[] = [];
    if (fs.existsSync(contentDir)) {
      const files = fs.readdirSync(contentDir);
      const mdxFiles = files.filter((file) => file.endsWith('.mdx') || file.endsWith('.md'));
      localDocs = mdxFiles.map((file) => {
        const fullPath = path.join(contentDir, file);
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        return parseFrontmatter(fileContent);
      });
    }

    if (checkQuotaCircuitBreaker()) {
      return localDocs.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());
    }

    // 2. Read database records
    let firestoreDocs: Doc[] = [];
    let fetchSucceeded = false;

    if (firebaseAdminDb) {
      try {
        const snapshot = await firebaseAdminDb.collection('articles').get();
        firestoreDocs = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          const baseMetadata = {
            slug: data.slug || doc.id,
            title: data.title || 'Untitled',
            description: data.seo?.meta_description || data.description || '',
            errorCode: data.errorCode || 'General',
            category: data.category || 'Other',
            difficulty: data.difficulty || 'Medium',
            estTime: data.estTime || '5 Mins',
            successRate: data.successRate || '100%',
            date: data.updated || data.date || '',
            author: data.author || 'TechErrorLog Team',
            tags: data.tags || [],
          };
          return cleanContentAndExtractMetadata(data.content || '', baseMetadata);
        });
        fetchSucceeded = true;
      } catch (err: any) {
        handleFirestoreError(err);
        if (!checkQuotaCircuitBreaker()) {
          console.warn("[FS GET Docs Error] Admin SDK failed, falling back to Client SDK:", err.message);
        }
      }
    }

    if (!fetchSucceeded && adminDb && !checkQuotaCircuitBreaker()) {
      try {
        const snapshot = await getDocs(collection(adminDb, 'articles'));
        firestoreDocs = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          const baseMetadata = {
            slug: data.slug || doc.id,
            title: data.title || 'Untitled',
            description: data.seo?.meta_description || data.description || '',
            errorCode: data.errorCode || 'General',
            category: data.category || 'Other',
            difficulty: data.difficulty || 'Medium',
            estTime: data.estTime || '5 Mins',
            successRate: data.successRate || '100%',
            date: data.updated || data.date || '',
            author: data.author || 'TechErrorLog Team',
            tags: data.tags || [],
          };
          return cleanContentAndExtractMetadata(data.content || '', baseMetadata);
        });
        fetchSucceeded = true;
      } catch (err) {
        handleFirestoreError(err);
        if (!checkQuotaCircuitBreaker()) {
          console.error("[FS GET Docs Error] client SDK fallback failed too: ", err);
        }
      }
    }

    // 3. Merge preferring Firestore records
    const docsMap = new Map<string, Doc>();
    localDocs.forEach(d => docsMap.set(d.metadata.slug, d));
    firestoreDocs.forEach(d => docsMap.set(d.metadata.slug, d));

    const docs = Array.from(docsMap.values());
    return docs.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());
  } catch (error) {
    console.error('Error fetching dynamic docs:', error);
    return [];
  }
}

export async function getDocBySlug(slug: string): Promise<Doc | null> {
  try {
    await seedIfEmpty();

    const contentDir = path.join(process.cwd(), 'src/content');
    const getLocalDoc = () => {
      const targetFile = path.join(contentDir, `${slug}.mdx`);
      if (fs.existsSync(targetFile)) {
        const fileContent = fs.readFileSync(targetFile, 'utf8');
        return parseFrontmatter(fileContent);
      }
      const targetMdFile = path.join(contentDir, `${slug}.md`);
      if (fs.existsSync(targetMdFile)) {
        const fileContent = fs.readFileSync(targetMdFile, 'utf8');
        return parseFrontmatter(fileContent);
      }
      return null;
    };

    if (checkQuotaCircuitBreaker()) {
      return getLocalDoc();
    }

    // 1. Try to query database using firebaseAdminDb
    if (firebaseAdminDb) {
      try {
        const docSnap = await firebaseAdminDb.collection('articles').doc(slug).get();
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data) {
            const baseMetadata = {
              slug: data.slug || docSnap.id,
              title: data.title || 'Untitled',
              description: data.seo?.meta_description || data.description || '',
              errorCode: data.errorCode || 'General',
              category: data.category || 'Other',
              difficulty: data.difficulty || 'Medium',
              estTime: data.estTime || '5 Mins',
              successRate: data.successRate || '100%',
              date: data.updated || data.date || '',
              author: data.author || 'TechErrorLog Team',
              tags: data.tags || [],
            };
            return cleanContentAndExtractMetadata(data.content || '', baseMetadata);
          }
        }
      } catch (err: any) {
        handleFirestoreError(err);
        if (!checkQuotaCircuitBreaker()) {
          console.warn(`[FS GET Single Doc Error] slug=${slug} Admin SDK failed, falling back to Client SDK:`, err.message);
        }
      }
    }

    // Fallback to client SDK (adminDb)
    if (adminDb && !checkQuotaCircuitBreaker()) {
      try {
        const docSnap = await getDoc(doc(adminDb, 'articles', slug));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            const baseMetadata = {
              slug: data.slug || docSnap.id,
              title: data.title || 'Untitled',
              description: data.seo?.meta_description || data.description || '',
              errorCode: data.errorCode || 'General',
              category: data.category || 'Other',
              difficulty: data.difficulty || 'Medium',
              estTime: data.estTime || '5 Mins',
              successRate: data.successRate || '100%',
              date: data.updated || data.date || '',
              author: data.author || 'TechErrorLog Team',
              tags: data.tags || [],
            };
            return cleanContentAndExtractMetadata(data.content || '', baseMetadata);
          }
        }
      } catch (err: any) {
        handleFirestoreError(err);
        if (!checkQuotaCircuitBreaker()) {
          console.error(`[FS GET Single Doc Error] slug=${slug}: `, err);
        }
      }
    }

    return getLocalDoc();
  } catch (error) {
    console.error(`Error reading doc slug: ${slug}`, error);
    return null;
  }
}

export interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(content: string): TOCHeading[] {
  const headings: TOCHeading[] = [];
  const lines = (content || '').split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip headers that are inside code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    if (inCodeBlock) {
      continue;
    }

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export async function getCategoriesData() {
  try {
    await seedIfEmpty();

    // Read local categories first to determine which ones are active
    let allowedIds: string[] = [];
    const filePath = path.join(process.cwd(), "src/data/categories.json");
    if (fs.existsSync(filePath)) {
      try {
        const localCats = JSON.parse(fs.readFileSync(filePath, "utf8"));
        allowedIds = localCats.map((c: any) => c.id || c.slug);
      } catch (e) {
        console.error("Failed to read local categories.json:", e);
      }
    }

    if (checkQuotaCircuitBreaker()) {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
      return [];
    }

    // Try Firestore Admin first
    if (firebaseAdminDb) {
      try {
        const snapshot = await firebaseAdminDb.collection("categories").get();
        if (!snapshot.empty) {
          const docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          if (allowedIds.length > 0) {
            return docs.filter((doc: any) => allowedIds.includes(doc.id) || allowedIds.includes(doc.slug));
          }
          return docs;
        }
      } catch (e: any) {
        handleFirestoreError(e);
        if (!checkQuotaCircuitBreaker()) {
          console.warn("Failed to read categories via Admin SDK:", e.message);
        }
      }
    }

    // Try Firestore Client second
    if (adminDb && !checkQuotaCircuitBreaker()) {
      try {
        const snapshot = await getDocs(collection(adminDb, "categories"));
        if (!snapshot.empty) {
          const docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          if (allowedIds.length > 0) {
            return docs.filter((doc: any) => allowedIds.includes(doc.id) || allowedIds.includes(doc.slug));
          }
          return docs;
        }
      } catch (e: any) {
        handleFirestoreError(e);
        if (!checkQuotaCircuitBreaker()) {
          console.error("Failed to read categories from firestore:", e);
        }
      }
    }

    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.error("Error reading categories:", e);
  }
  return [];
}

export async function getSettingsData() {
  try {
    await seedIfEmpty();

    const getLocalSettings = () => {
      if (cachedSettings) {
        return cachedSettings;
      }
      const filePath = path.join(process.cwd(), "src/data/settings.json");
      if (fs.existsSync(filePath)) {
        const settings = JSON.parse(fs.readFileSync(filePath, "utf8"));
        cachedSettings = settings;
        return settings;
      }
      return {};
    };

    if (checkQuotaCircuitBreaker()) {
      return getLocalSettings();
    }

    // Try Firestore Admin first
    if (firebaseAdminDb) {
      try {
        const docSnap = await firebaseAdminDb.collection("settings").doc("global").get();
        if (docSnap.exists) {
          cachedSettings = docSnap.data() || {};
          return cachedSettings;
        }
      } catch (e: any) {
        handleFirestoreError(e);
        if (!checkQuotaCircuitBreaker()) {
          console.warn("Failed to read settings via Admin SDK:", e.message);
        }
      }
    }

    // Try Firestore Client second
    if (adminDb && !checkQuotaCircuitBreaker()) {
      try {
        const docSnap = await getDoc(doc(adminDb, "settings", "global"));
        if (docSnap.exists()) {
          cachedSettings = docSnap.data() || {};
          return cachedSettings;
        }
      } catch (e: any) {
        handleFirestoreError(e);
        if (!checkQuotaCircuitBreaker()) {
          console.error("Failed to read settings from firestore:", e);
        }
      }
    }

    return getLocalSettings();
  } catch (e) {
    console.error("Error reading settings JSON:", e);
  }
  return cachedSettings || {};
}

export async function getPromptsData() {
  try {
    await seedIfEmpty();

    const getLocalPrompts = () => {
      if (cachedPrompts) {
        return cachedPrompts;
      }
      const filePath = path.join(process.cwd(), "src/data/prompts.json");
      if (fs.existsSync(filePath)) {
        const prompts = JSON.parse(fs.readFileSync(filePath, "utf8"));
        cachedPrompts = prompts;
        return prompts;
      }
      return {};
    };

    if (checkQuotaCircuitBreaker()) {
      return getLocalPrompts();
    }

    // Try Firestore Admin first
    if (firebaseAdminDb) {
      try {
        const docSnap = await firebaseAdminDb.collection("settings").doc("prompts").get();
        if (docSnap.exists) {
          cachedPrompts = docSnap.data() || {};
          return cachedPrompts;
        }
      } catch (e: any) {
        handleFirestoreError(e);
        if (!checkQuotaCircuitBreaker()) {
          console.warn("Failed to read prompts via Admin SDK:", e.message);
        }
      }
    }

    // Try Firestore Client second
    if (adminDb && !checkQuotaCircuitBreaker()) {
      try {
        const docSnap = await getDoc(doc(adminDb, "settings", "prompts"));
        if (docSnap.exists()) {
          cachedPrompts = docSnap.data() || {};
          return cachedPrompts;
        }
      } catch (e: any) {
        handleFirestoreError(e);
        if (!checkQuotaCircuitBreaker()) {
          console.error("Failed to read prompts from firestore:", e);
        }
      }
    }

    return getLocalPrompts();
  } catch (e) {
    console.error("Error reading prompts JSON:", e);
  }
  const defaultPromptPath = path.join(process.cwd(), "src/data/prompts.json");
  if (fs.existsSync(defaultPromptPath)) {
    const prompts = JSON.parse(fs.readFileSync(defaultPromptPath, "utf8"));
    cachedPrompts = prompts;
    return prompts;
  }
  return cachedPrompts || {};
}

export async function getArticlesData() {
  try {
    await seedIfEmpty();

    // 1. Read files locally
    const filePath = path.join(process.cwd(), "src/data/articles.json");
    let localArticles: any[] = [];
    if (fs.existsSync(filePath)) {
      localArticles = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    const getRetroTags = (category: string, errorCode: string): string[] => {
      const catClean = (category || "").toLowerCase();
      let tags = ["windows"];
      
      if (catClean.includes("update")) {
        tags.push("update", "system-repair");
      } else if (catClean.includes("bsod") || catClean.includes("blue")) {
        tags.push("bsod", "system-crash");
      } else if (catClean.includes("dll") || catClean.includes("library")) {
        tags.push("dll-error", "dependency");
      } else if (catClean.includes("gaming") || catClean.includes("game")) {
        tags.push("gaming-fix", "graphics");
      } else if (catClean.includes("activation") || catClean.includes("license")) {
        tags.push("activation", "licensing");
      } else if (catClean.includes("driver") || catClean.includes("hardware")) {
        tags.push("driver", "device-manager");
      } else if (catClean.includes("performance") || catClean.includes("slow") || catClean.includes("usage")) {
        tags.push("performance", "optimization");
      } else {
        tags.push("troubleshooting", "system-repair");
      }

      if (errorCode && errorCode !== "General") {
        const cleanCode = errorCode.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
        if (cleanCode && !tags.includes(cleanCode)) {
          tags.push(cleanCode);
        }
      }
      return tags;
    };

    if (checkQuotaCircuitBreaker()) {
      localArticles.forEach(art => {
        if (!art.tags || !Array.isArray(art.tags) || art.tags.length === 0) {
          art.tags = getRetroTags(art.category, art.errorCode);
        }
      });
      return localArticles;
    }

    // 2. Read database
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
        handleFirestoreError(err);
        if (!checkQuotaCircuitBreaker()) {
          console.warn("[FS LIST Articles Error] Admin SDK failed:", err.message);
        }
      }
    }

    if (!fetchSucceeded && adminDb && !checkQuotaCircuitBreaker()) {
      try {
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
        handleFirestoreError(err);
        if (!checkQuotaCircuitBreaker()) {
          console.error("[FS LIST Articles Error] fallback applied: ", err);
        }
      }
    }

    // 3. Merge preferring Firestore records
    const articlesMap = new Map<string, any>();
    localArticles.forEach((aBySlug: any) => articlesMap.set(aBySlug.slug, aBySlug));
    firestoreArticles.forEach((aBySlug: any) => articlesMap.set(aBySlug.slug, aBySlug));

    const mergedArticles = Array.from(articlesMap.values());
    let updatedAny = false;

    for (const art of mergedArticles) {
      if (!art.tags || !Array.isArray(art.tags) || art.tags.length === 0) {
        art.tags = getRetroTags(art.category, art.errorCode);
        updatedAny = true;
        console.log(`[Auto-Retrofitting Tags] Added tags to article "${art.slug}":`, art.tags);

        // Sync back to Cloud Firestore
        if (adminDb && !checkQuotaCircuitBreaker()) {
          try {
            await setDoc(doc(adminDb, "articles", art.slug), adminPayload(art), { merge: true });
          } catch (fsErr: any) {
            handleFirestoreError(fsErr);
            if (!checkQuotaCircuitBreaker()) {
              console.error(`[Auto-Retrofitting Tags] Firestore sync failed for ${art.slug}:`, fsErr);
            }
          }
        }
      }
    }

    if (updatedAny) {
      // Write the fully retrofitted collection back to the local database JSON resiliently
      try {
        fs.writeFileSync(filePath, JSON.stringify(mergedArticles, null, 2), "utf8");
      } catch (fsWriteErr: any) {
        console.warn("[Auto-Retrofitting Tags] Local JSON write failed (expected and non-critical on live serverless hosts):", fsWriteErr.message);
      }
    }

    return mergedArticles;
  } catch (e) {
    console.error("Error reading articles JSON:", e);
    return [];
  }
}
