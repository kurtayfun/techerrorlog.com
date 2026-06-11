import fs from 'fs';
import path from 'path';
import { z } from 'zod';

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

export async function getAllDocs(): Promise<Doc[]> {
  try {
    const contentDir = path.join(process.cwd(), 'content');
    if (!fs.existsSync(contentDir)) {
      return [];
    }
    const files = fs.readdirSync(contentDir);
    const mdxFiles = files.filter((file) => file.endsWith('.mdx') || file.endsWith('.md'));

    const docs = mdxFiles.map((file) => {
      const fullPath = path.join(contentDir, file);
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      return parseFrontmatter(fileContent);
    });

    return docs.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());
  } catch (error) {
    console.error('Error fetching dynamic docs:', error);
    return [];
  }
}

export async function getDocBySlug(slug: string): Promise<Doc | null> {
  try {
    const contentDir = path.join(process.cwd(), 'content');
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
  const lines = content.split('\n');
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
      // Generate standard URL-compatible ID matching the Markdown parser
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export function getCategoriesData() {
  try {
    const filePath = path.join(process.cwd(), "data/categories.json");
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.error("Error reading categories JSON:", e);
  }
  return [];
}

export function getSettingsData() {
  try {
    const filePath = path.join(process.cwd(), "data/settings.json");
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.error("Error reading settings JSON:", e);
  }
  return {};
}

export function getArticlesData() {
  try {
    const filePath = path.join(process.cwd(), "data/articles.json");
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.error("Error reading articles JSON:", e);
  }
  return [];
}

