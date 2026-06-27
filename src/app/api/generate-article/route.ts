import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { adminDb } from "@/lib/firebase-admin";
import { doc, setDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

// Initialize Gemini client lazily to avoid application crashing if the key is missing in other contexts
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Generate URL slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Resilient wrapper for Gemini content generation with retry and fallback
async function generateContentWithRetry(
  ai: GoogleGenAI,
  primaryModel: string,
  contents: string,
  config: any,
  retries = 3,
  delayMs = 1500
): Promise<any> {
  let lastError: any = null;
  // Rotate between models when quota or congestion errors are hit
  const modelsToTry = [primaryModel, "gemini-3.1-flash-lite", "gemini-flash-latest"];

  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Gemini API] Querying model ${currentModel} (Attempt ${attempt}/${retries})`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const errMessage = error.message || String(error);
        const errStatus = error.status || error.code || 0;

        console.log(
          `[Gemini API] (Handled log) Attempt ${attempt} failed for model ${currentModel}. Status: ${errStatus}. Info: `,
          errMessage
        );

        // Detect if it is a rate limit or quota exceeded error (429)
        const isQuotaExceeded =
          errStatus === 429 ||
          errMessage.includes("429") ||
          errMessage.includes("RESOURCE_EXHAUSTED") ||
          errMessage.includes("quota") ||
          errMessage.includes("Quota") ||
          errMessage.includes("limit") ||
          errMessage.includes("Too Many Requests");

        // Detect if it is a service overload or unavailable error (503)
        const isServiceUnavailable =
          errStatus === 503 ||
          errMessage.includes("503") ||
          errMessage.includes("UNAVAILABLE") ||
          errMessage.includes("high demand") ||
          errMessage.includes("overload") ||
          errMessage.includes("busy");

        const isTransient = isQuotaExceeded || isServiceUnavailable;

        // If it's a structural or validation error, try the fallback model immediately
        if (!isTransient) {
          console.log("[Gemini API] Non-transient error encountered. Switching model directly...");
          break;
        }

        // Critical optimisation: If quota is exhausted (429), or the model is heavily overloaded (503),
        // repeating immediately on the SAME model is guaranteed to trigger more 429/503 errors.
        // We bypass subsequent retries for this model and immediately switch to the next model in modelsToTry!
        if (isQuotaExceeded || isServiceUnavailable) {
          console.log(`[Gemini API] ${isQuotaExceeded ? "Quota exceeded" : "Model overloaded"} on ${currentModel}. Skipping remaining retries for this model to fall back immediately.`);
          break; // Break the retry loop for this model, proceeding directly to the next model in modelsToTry
        }

        if (attempt < retries) {
          const waitTime = delayMs * Math.pow(2, attempt - 1);
          console.log(`[Gemini API] Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
    console.log(`[Gemini API] Finished queries/attempts for model ${currentModel}. Moving to next if available...`);
  }

  throw lastError || new Error("Failed to generate content after retries and fallback.");
}

export async function POST(req: NextRequest) {
  try {
    const { title, category, extraContext = "" } = await req.json();
    const language = "en"; // Force English only

    if (!title || !category) {
      return NextResponse.json(
        { error: "Title and category are required fields." },
        { status: 400 }
      );
    }

    const ai = getAiClient();
    const slugName = generateSlug(title);

    // Try to load system instruction from prompts.json, otherwise fallback
    let systemInstruction = "";
    try {
      const promptsPath = path.join(process.cwd(), "src/data/prompts.json");
      if (fs.existsSync(promptsPath)) {
        const promptsObj = JSON.parse(fs.readFileSync(promptsPath, "utf8"));
        if (promptsObj && promptsObj.systemInstruction) {
          systemInstruction = promptsObj.systemInstruction
            .replace(/{language_label}/g, "English (English)")
            .replace(/{slugName}/g, slugName)
            .replace(/{title}/g, title)
            .replace(/{categoryName}/g, category)
            .replace(/{difficulty}/g, "Medium")
            .replace(/{estTime}/g, "10 min")
            .replace(/{successRate}/g, "95%")
            .replace(/{dateName}/g, new Date().toISOString().slice(0, 10))
            .replace(/{authorName}/g, "TechErrorLog Team")
            .replace(/{description_placeholder}/g, `Resolve ${title} issues using our comprehensive troubleshooting manual.`);
        }
      }
    } catch (e) {
      console.error("Failed to read system prompt from prompts.json, using fallback: ", e);
    }

    if (!systemInstruction) {
      systemInstruction = `You are a professional Windows Support Engineer and Technical Content Writer.
Your job is to write a highly detailed, professional, and diagnostic guide/manual for a Windows error or system tool.
You MUST write and generate the entire output including headers and content STRICTLY in English (English), even if the title, category, or extra context contains Turkish or other languages. If the user provides a title or context in Turkish, automatically translate it and write the entire article beautifully in professional English. The frontmatter keys must remain exactly in English as keys, populated with English values (except universal technical terms like error codes).

You MUST follow this exact structure and include these visual elements:

1. **Frontmatter**:
At the very top of your response, output a standard YAML frontmatter block enclosed in ---. It must contain:
slug: "${slugName}"
title: "(The title of the guide in English)"
description: "(A clear, interesting 1-sentence technical description of the error code or guide in English)"
errorCode: "(The precise error code, dll name, or utility code, e.g. 0x80070002)"
category: "${category}"
difficulty: "(Easy, Medium, or Advanced)"
estTime: "(Estimated time to solve, e.g. 5-10 min, 15 min)"
successRate: "(Expected success rate, e.g. 98%, 95%)"
date: "${new Date().toISOString().slice(0, 10)}"
author: "TechErrorLog Team"

Ensure that there is a blank line after the closing frontmatter delimiter '---'.

2. **Article Structure (The Template)**:
Generate the markdown body using these exact headings. These headings are extremely critical because the Next.js router splits content by "### Deep Resolution Methods". So, you MUST use these exact headings:

### Introduction
Write an "Error Overview" explaining what this issue is, introducing the error, who it affects, and a welcoming opening.

### Symptoms & Root Causes
Provide a comprehensive list of symptoms, why it happens, and what causes the files or registry to get corrupted (e.g. system files corrupt, DLL missing, power outrage, misaligned registries, incompatible driver packages).

### Quick Fix (30-Second Solution)
Provide a very fast, easily copy-pasteable, 30-second quick resolution. Use brief markdown bullet points and highlight critical advice.

### Deep Resolution Methods
This section MUST BE TITLED EXACTLY '### Deep Resolution Methods'. It contains the comprehensive, step-by-step solutions (including Cmd/PowerShell CLI commands block, registry alterations, directory locations, or Microsoft installer repairs). Ensure all command snippets are wrapped inside corresponding \`\`\`bash or \`\`\` powershell blocks.

### Advanced Fixes & Alternative Methods
Provide alternative diagnostic tools (e.g. Memory Diagnostic parameters, administrative SFC/DISM parameters, MSConfig clean boot steps) or deeper workarounds for advanced system administrators.

### FAQ Assistance
Optionally provide 2-3 detailed, bullet-proof frequently asked questions and answers contextually tailored to this error.

Ensure the output is written in beautiful, structured markdown, using code blocks, lists, and highlighting where appropriate. Do not use unrequested decoration, telemetry labels, or mock system output. Write like a friendly, highly skilled computer engineer.`;
    }

    const prompt = `Please generate the full, detailed MDX article for:
Title: "${title}"
Category: "${category}"
Additional Guidelines or Context: "${extraContext}"

Write it STRICTLY in English. Translating any Turkish parameters if needed.
Ensure the YAML frontmatter block is complete and is followed by '### Introduction'.`;

    const response = await generateContentWithRetry(
      ai,
      "gemini-3.5-flash",
      prompt,
      {
        systemInstruction,
        temperature: 0.7,
      }
    );

    const mdxContent = response.text;
    if (!mdxContent) {
      throw new Error("Failed to generate content from Gemini API.");
    }

    // Attempt to write to content directory
    const contentDir = path.join(process.cwd(), "src/content");
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    const filePath = path.join(contentDir, `${slugName}.mdx`);
    fs.writeFileSync(filePath, mdxContent, "utf8");

    // Extract errorCode from generated content or guess it
    let inferredErrorCode = "General";
    try {
      const match = mdxContent.match(/errorCode:\s*["']?([^"'\n]+)["']?/);
      if (match && match[1]) {
        inferredErrorCode = match[1].trim();
      } else {
        const parts = slugName.split("-");
        const lastPart = parts[parts.length - 1];
        if (lastPart.startsWith("0x") || lastPart.endsWith(".dll") || lastPart.length > 4) {
          inferredErrorCode = lastPart;
        }
      }
    } catch (e) {
       console.error("Error inferring dynamic error code:", e);
    }

    // UPDATE DATABASE (articles.json)
    const articlesPath = path.join(process.cwd(), "src/data/articles.json");
    if (fs.existsSync(articlesPath)) {
      try {
        const fileContent = fs.readFileSync(articlesPath, "utf8");
        const articles = JSON.parse(fileContent);

        const index = articles.findIndex((a: any) => a.slug === slugName);
        if (index !== -1) {
          // If already in DB, update status and timestamp
          articles[index].status = "published";
          articles[index].updated = new Date().toISOString();
          articles[index].errorCode = articles[index].errorCode || inferredErrorCode;
        } else {
          // Insert as new article entry
          const newId = articles.reduce((max: number, a: any) => a.id > max ? a.id : max, 0) + 1;
          
          // Map category nicely
          let mappedCategory = "windows-update";
          const catClean = category.toLowerCase();
          if (catClean.includes("update")) mappedCategory = "windows-update";
          else if (catClean.includes("bsod") || catClean.includes("blue")) mappedCategory = "bsod";
          else if (catClean.includes("dll") || catClean.includes("library")) mappedCategory = "dll";
          else if (catClean.includes("gaming") || catClean.includes("game")) mappedCategory = "gaming";
          else if (catClean.includes("activation") || catClean.includes("license")) mappedCategory = "activation";
          else if (catClean.includes("driver") || catClean.includes("hardware")) mappedCategory = "driver";
          else if (catClean.includes("performance") || catClean.includes("slow") || catClean.includes("usage")) mappedCategory = "performance";
          else if (catClean.includes("troubleshoot") || catClean.includes("guide") || catClean.includes("safe mode")) mappedCategory = "troubleshooting";

          articles.push({
            id: newId,
            category: mappedCategory,
            title,
            slug: slugName,
            errorCode: inferredErrorCode,
            priority: 2,
            status: "published",
            difficulty: "Medium",
            estTime: "10 min",
            successRate: "95%",
            keywords: [inferredErrorCode, "fix", "error"],
            updated: new Date().toISOString(),
            seo: {
              meta_title: `How to Fix ${title} | TechErrorLog`,
              meta_description: `Learn how to diagnose and resolve ${title} issues using our professional, step-by-step troubleshooting playbook.`,
              canonical: `https://techerrorlog.com/blog/${slugName}`,
              focus_keyword: inferredErrorCode,
              schema_type: "TechArticle",
              og_title: `Resolve ${title}`,
              og_description: `Complete diagnostic playbook for fixing ${title} errors.`
            }
          });
        }
        fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2), "utf8");

        // Write the article metadata with full content directly into Cloud Firestore
        if (adminDb) {
          try {
            const index = articles.findIndex((a: any) => a.slug === slugName);
            const savedMetadata = index !== -1 ? articles[index] : articles[articles.length - 1];
            await setDoc(doc(adminDb, "articles", slugName), {
              ...savedMetadata,
              content: mdxContent,
              secretToken: "AI_STUDIO_SECURE_ADMIN_SECRET_2026"
            });
            console.log(`[FS Sync Success] Generated article ${slugName} secured in Cloud Firestore.`);
          } catch (fsErr) {
            console.error(`[FS Sync Fail] Could not save generated article ${slugName} to Firestore:`, fsErr);
          }
        }
      } catch (err) {
        console.error("Failed to update articles.json db:", err);
      }
    }

    return NextResponse.json({
      success: true,
      slug: slugName,
      filePath,
      metadata: {
        title,
        category,
        slug: slugName,
      },
    });
  } catch (error: any) {
    console.error("Error generating article:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during article generation." },
      { status: 500 }
    );
  }
}
