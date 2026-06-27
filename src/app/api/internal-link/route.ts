import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAllDocs } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const docs = await getAllDocs();
    if (docs.length === 0) {
      return NextResponse.json({ message: "No documents found to link.", linkedCount: 0 });
    }

    const contentDir = path.join(process.cwd(), "src/content");
    let totalReplacements = 0;
    const modifiedFiles: string[] = [];

    // Create a list of link targets based on errorCodes and titles
    const targets = docs.map((doc) => {
      // Clean up errorCode
      const code = doc.metadata.errorCode?.trim() || "";
      const slug = doc.metadata.slug;
      const titleCleaned = doc.metadata.title.toLowerCase().replace(/error/g, "").trim();

      return {
        slug,
        code,
        titleCleaned,
      };
    }).filter(t => t.code && t.code.toLowerCase() !== "general" && t.code.length > 3);

    for (const doc of docs) {
      const fileName = `${doc.metadata.slug}.mdx`;
      const filePath = path.join(contentDir, fileName);
      if (!fs.existsSync(filePath)) continue;

      let fileContent = fs.readFileSync(filePath, "utf8");
      
      // Separate frontmatter and body
      const parts = fileContent.split("---");
      if (parts.length < 3) continue;

      const frontmatter = parts[1];
      let body = parts.slice(2).join("---");

      let fileWasModified = false;

      // For every target (except ourselves), replace plain text matches in body
      for (const target of targets) {
        if (target.slug === doc.metadata.slug) continue;

        // Ensure we match the error code boundaries (not already inside an MD link, backtick string, or HTML tag)
        // A simple but effective regex that avoids replacing matches already inside [...] or `...` or inside a url
        const escapedCode = target.code.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        
        // Match occurrences of target.code that are NOT:
        // - preceded by [ or / (e.g. [0x80070002 or /blog/0x8)
        // - inside backticks `0x80070002`
        // - already inside a markdown link [0x80070002](/blog/...)
        const regex = new RegExp(`(?<!\\[|\\/|\`|slug:\\s*")\\b${escapedCode}\\b(?!\\]|\`|\\.mdx)`, "gi");

        if (regex.test(body)) {
          // Replace matching elements with a clean internal markdown link
          body = body.replace(regex, `[${target.code}](/blog/${target.slug})`);
          fileWasModified = true;
          totalReplacements++;
        }
      }

      if (fileWasModified) {
        fs.writeFileSync(filePath, `---${frontmatter}---${body}`, "utf8");
        modifiedFiles.push(doc.metadata.slug);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Internal linking complete across documents.`,
      linkedCount: totalReplacements,
      modifiedFiles,
    });
  } catch (error: any) {
    console.error("Error running internal linking service:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
