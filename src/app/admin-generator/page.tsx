"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  FileText, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Grid, 
  FileCode, 
  Link2, 
  ListOrdered, 
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  Settings,
  Layers,
  Database,
  Check,
  Save,
  Globe,
  X
} from "lucide-react";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "motion/react";

interface ArticleMetadata {
  id: number;
  category: string;
  title: string;
  slug: string;
  errorCode: string;
  priority: number;
  status: "draft" | "generated" | "reviewed" | "published";
  difficulty: string;
  estTime: string;
  successRate: string;
  keywords: string[];
  updated: string | null;
  seo?: {
    meta_title: string;
    meta_description: string;
    canonical: string;
    focus_keyword: string;
    schema_type: string;
    og_title: string;
    og_description: string;
  };
}

interface CategoryData {
  id: string;
  slug: string;
  name: string;
  badge?: string;
  description: string;
  iconType: string;
}

interface PromptData {
  systemInstruction: string;
}

interface SettingData {
  siteName: string;
  siteUrl: string;
  description: string;
  rssEnabled: boolean;
  sitemapAutoUpdate: boolean;
  generationLanguageDefault: string;
  geminiModel: string;
  lastUpdated: string;
}

interface InternalLinkData {
  keyword: string;
  slug: string;
  description: string;
}

export default function AdminGeneratorPage() {
  const [activeTab, setActiveTab] = useState<"articles" | "bulk" | "categories" | "links" | "settings">("articles");
  const [loading, setLoading] = useState<boolean>(true);

  // DB States
  const [articles, setArticles] = useState<ArticleMetadata[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [settings, setSettings] = useState<SettingData | null>(null);
  const [prompts, setPrompts] = useState<PromptData | null>(null);
  const [internalLinks, setInternalLinks] = useState<InternalLinkData[]>([]);

  // Bulk Generator States
  const [bulkInput, setBulkInput] = useState<string>("");
  const [bulkQueue, setBulkQueue] = useState<Array<{ title: string; category: string; status: "idle" | "generating" | "success" | "error" | "skipped"; slug?: string; error?: string; isDuplicate?: boolean }>>([]);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);
  const [bulkCurrentIndex, setBulkCurrentIndex] = useState<number>(-1);

  // Single Article Form States
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("windows-update");
  const [newErrorCode, setNewErrorCode] = useState<string>("");
  const [newSlug, setNewSlug] = useState<string>("");
  const [newDifficulty, setNewDifficulty] = useState<string>("Medium");
  const [newEstTime, setNewEstTime] = useState<string>("10 min");
  const [newSuccessRate, setNewSuccessRate] = useState<string>("95%");
  const [newStatus, setNewStatus] = useState<"draft" | "published">("draft");
  const [newPriority, setNewPriority] = useState<number>(2);

  // Confirmation state for deleting
  const [deleteArticleId, setDeleteArticleId] = useState<number | null>(null);

  // SEO Fields
  const [newMetaTitle, setNewMetaTitle] = useState<string>("");
  const [newMetaDesc, setNewMetaDesc] = useState<string>("");

  // Prompt Edit state
  const [editPrompt, setEditPrompt] = useState<string>("");

  // Link helper state
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [linkingResult, setLinkingResult] = useState<{ linkedCount: number; modifiedFiles: string[] } | null>(null);

  // Filter & Search states
  const [articleSearch, setArticleSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch Databases from API endpoint on load
  const loadDatabase = async () => {
    setLoading(true);
    try {
      const fetchJson = async (url: string) => {
        const separator = url.includes("?") ? "&" : "?";
        const response = await fetch(`${url}${separator}_t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status} fetching ${url}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.substring(0, 50).includes("json")) {
          const bodyPeek = await response.text();
          throw new Error(`Response from ${url} was not JSON (Content-Type: ${contentType}). Body: ${bodyPeek.substring(0, 150)}`);
        }
        return response.json();
      };

      // Parallel fetches for high performance
      const [artRes, catRes, setRes, prmRes, lnkRes] = await Promise.all([
        fetchJson("/api/admin/db?type=articles"),
        fetchJson("/api/admin/db?type=categories"),
        fetchJson("/api/admin/db?type=settings"),
        fetchJson("/api/admin/db?type=prompts"),
        fetchJson("/api/admin/db?type=internal_links"),
      ]);

      if (artRes.success) setArticles(artRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (setRes.success) setSettings(setRes.data);
      if (prmRes.success) {
        setPrompts(prmRes.data);
        setEditPrompt(prmRes.data.systemInstruction || "");
      }
      if (lnkRes.success) setInternalLinks(lnkRes.data);
    } catch (e) {
      console.error("Failed to load administration databases", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Load States from localStorage on Mount
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem("admin_active_tab");
      if (savedTab) setActiveTab(savedTab as any);

      const savedBulkInput = localStorage.getItem("admin_bulk_input");
      if (savedBulkInput) setBulkInput(savedBulkInput);

      const savedSkipDup = localStorage.getItem("admin_skip_duplicates");
      if (savedSkipDup !== null) setSkipDuplicates(savedSkipDup === "true");

      const savedBulkQueue = localStorage.getItem("admin_bulk_queue");
      if (savedBulkQueue) {
        const parsedQueue = JSON.parse(savedBulkQueue);
        setBulkQueue(parsedQueue);

        // Auto-resume outstanding queue items securely with settling delay
        const savedIsProcessing = localStorage.getItem("admin_is_bulk_processing") === "true";
        if (savedIsProcessing && parsedQueue.length > 0) {
          const hasPending = parsedQueue.some((item: any) => item.status === "idle" || item.status === "generating" || item.status === "error");
          if (hasPending) {
            setIsBulkProcessing(true);
            setTimeout(() => {
              startBulkGeneration(parsedQueue);
            }, 1500);
          } else {
            localStorage.setItem("admin_is_bulk_processing", "false");
          }
        }
      }
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save activeTab to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("admin_active_tab", activeTab);
    } catch (_) {}
  }, [activeTab]);

  // Save bulkInput to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("admin_bulk_input", bulkInput);
    } catch (_) {}
  }, [bulkInput]);

  // Save bulkQueue to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("admin_bulk_queue", JSON.stringify(bulkQueue));
    } catch (_) {}
  }, [bulkQueue]);

  // Save skipDuplicates to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("admin_skip_duplicates", String(skipDuplicates));
    } catch (_) {}
  }, [skipDuplicates]);

  // Sync Slug automatically based on title
  useEffect(() => {
    if (newTitle) {
      const generated = newTitle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setNewSlug(generated);
      setNewMetaTitle(`How to Fix ${newTitle} | TechErrorLog`);
      setNewMetaDesc(`Full administrative diagnostic guide showing how to repair and resolve ${newTitle} error quickly.`);
    }
  }, [newTitle]);

  // Save database modifications
  const saveDB = async (type: string, data: any) => {
    try {
      const response = await fetch("/api/admin/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed write session");
      }
      return true;
    } catch (err: any) {
      alert(`Veritabanı güncellenirken hata oluştu: ${err.message}`);
      return false;
    }
  };

  // Add standard new article entry to register
  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSlug) {
      alert("Lütfen başlık ve slug alanlarını doldurun.");
      return;
    }

    const newId = articles.reduce((max, a) => a.id > max ? a.id : max, 0) + 1;
    const item: ArticleMetadata = {
      id: newId,
      category: newCategory,
      title: newTitle,
      slug: newSlug,
      errorCode: newErrorCode || "General",
      priority: Number(newPriority),
      status: newStatus,
      difficulty: newDifficulty,
      estTime: newEstTime,
      successRate: newSuccessRate,
      keywords: [newErrorCode || "General", "windows", "repair"],
      updated: newStatus === "published" ? new Date().toISOString() : null,
      seo: {
        meta_title: newMetaTitle || newTitle,
        meta_description: newMetaDesc || `Step-by-step resolution for ${newTitle}.`,
        canonical: `https://techerrorlog.com/blog/${newSlug}`,
        focus_keyword: newErrorCode || "General",
        schema_type: "TechArticle",
        og_title: newMetaTitle || newTitle,
        og_description: newMetaDesc || `Step-by-step resolution for ${newTitle}.`
      }
    };

    const updated = [item, ...articles];
    const success = await saveDB("articles", updated);
    if (success) {
      setArticles(updated);
      setShowAddForm(false);
      // Reset form fields
      setNewTitle("");
      setNewErrorCode("");
      setNewSlug("");
    }
  };

  // Delete article from registry
  const handleDeleteArticle = async (id: number) => {
    const updated = articles.filter(a => a.id !== id);
    const success = await saveDB("articles", updated);
    if (success) {
      setArticles(updated);
      setDeleteArticleId(null);
    }
  };

  // Change status of article dynamically
  const handleChangeStatus = async (id: number, status: "draft" | "generated" | "reviewed" | "published") => {
    const updated = articles.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status,
          updated: (status === "published" || status === "generated") ? new Date().toISOString() : a.updated
        };
      }
      return a;
    });
    const success = await saveDB("articles", updated);
    if (success) {
      setArticles(updated);
    }
  };

  // Run single generation triggered manually
  const triggerGenerateSingle = async (article: ArticleMetadata) => {
    // Set matching article to temporary generating status in articles state
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, status: "generated" as any } : a));
    
    try {
      const response = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          category: article.category,
          language: settings?.generationLanguageDefault || "tr",
          extraContext: `Use errorCode: ${article.errorCode}. Ensure template fields match perfectly.`,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed API call");
      }

      // Success, load updated database state
      await loadDatabase();
    } catch (e: any) {
      alert(`Hata oluştu: ${e.message || "Bilinmeyen hata"}`);
      // Revert status
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, status: "draft" } : a));
    }
  };

  // Solve bulk inputs parser
  const parseBulkInput = () => {
    const lines = bulkInput.split("\n");
    let currentCat = "windows-update";
    const queue: typeof bulkQueue = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check if headers
      const isHeader = !trimmed.includes(".dll") && trimmed.length < 50 && 
                       (
                         trimmed.toLowerCase().includes("kategori") || 
                         trimmed.toLowerCase().includes("category") || 
                         trimmed.toLowerCase().includes("error") || 
                         trimmed.toLowerCase().includes("bsod") || 
                         trimmed.toLowerCase().includes("blue") || 
                         trimmed.toLowerCase().includes("dll") || 
                         trimmed.toLowerCase().includes("activation") || 
                         trimmed.toLowerCase().includes("guide") ||
                         trimmed.toLowerCase().includes("performance") ||
                         trimmed.toLowerCase().includes("troubleshoot")
                       );

      if (isHeader) {
        const cleaned = trimmed.toLowerCase();
        if (cleaned.includes("update")) currentCat = "windows-update";
        else if (cleaned.includes("bsod") || cleaned.includes("blue")) currentCat = "bsod";
        else if (cleaned.includes("dll") || cleaned.includes("library")) currentCat = "dll";
        else if (cleaned.includes("gaming") || cleaned.includes("game")) currentCat = "gaming";
        else if (cleaned.includes("activation") || cleaned.includes("license")) currentCat = "activation";
        else if (cleaned.includes("driver") || cleaned.includes("hardware")) currentCat = "driver";
        else if (cleaned.includes("performance") || cleaned.includes("slow") || cleaned.includes("usage")) currentCat = "performance";
        else if (cleaned.includes("troubleshoot") || cleaned.includes("guide")) currentCat = "troubleshooting";
      } else {
        let title = trimmed;
        title = title.replace(/^[\s\d.*#-]+/g, "").trim();
        
        // Generate potential slug to check duplicates
        const computedSlug = title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/[\s-]+/g, "-")
          .replace(/^-+|-+$/g, "");

        const alreadyExists = articles.some(
          a => a.slug === computedSlug || a.title.toLowerCase().trim() === title.toLowerCase().trim()
        );

        queue.push({
          title,
          category: currentCat,
          status: "idle",
          slug: computedSlug,
          isDuplicate: alreadyExists
        });
      }
    });

    setBulkQueue(queue);
  };

  // Bulk sequential processing with optional forcedQueue, pause-checking, and status sync
  async function startBulkGeneration(forcedQueue?: any[]) {
    const queueToProcess = forcedQueue || bulkQueue;
    if (queueToProcess.length === 0) {
      alert("Lütfen önce bulk konu listesini çözümleyin.");
      return;
    }

    setIsBulkProcessing(true);
    localStorage.setItem("admin_is_bulk_processing", "true");
    const mockQueue = [...queueToProcess];

    for (let i = 0; i < mockQueue.length; i++) {
      // Periodic check for user manual pause request
      if (localStorage.getItem("admin_is_bulk_processing") === "false") {
        setIsBulkProcessing(false);
        setBulkCurrentIndex(-1);
        break;
      }

      if (mockQueue[i].status === "success" || mockQueue[i].status === "skipped") continue;
      
      // If skipDuplicates is enabled and it is duplicate, mark as skipped
      if (skipDuplicates && mockQueue[i].isDuplicate) {
        mockQueue[i].status = "skipped";
        setBulkQueue([...mockQueue]);
        continue;
      }

      setBulkCurrentIndex(i);
      mockQueue[i].status = "generating";
      setBulkQueue([...mockQueue]);

      try {
        const response = await fetch("/api/generate-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: mockQueue[i].title,
            category: mockQueue[i].category,
            language: settings?.generationLanguageDefault || "tr",
          }),
        });

        // Check again after heavy network action if user clicked pause/stop
        if (localStorage.getItem("admin_is_bulk_processing") === "false") {
          setIsBulkProcessing(false);
          setBulkCurrentIndex(-1);
          break;
        }

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed API");
        }

        mockQueue[i].status = "success";
        mockQueue[i].slug = data.slug;
      } catch (err: any) {
        mockQueue[i].status = "error";
        mockQueue[i].error = err.message || "Failed dynamic build";
      }
      setBulkQueue([...mockQueue]);

      // Introduce a 2-second delay between generations to avoid Gemini API rate limits (quota exhaustion)
      if (i < mockQueue.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setIsBulkProcessing(false);
    localStorage.setItem("admin_is_bulk_processing", "false");
    setBulkCurrentIndex(-1);
    await loadDatabase(); // sync database
  };

  // Optimize site internal links
  const runInternalLinking = async () => {
    setIsLinking(true);
    setLinkingResult(null);
    try {
      const res = await fetch("/api/internal-link", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLinkingResult({
          linkedCount: data.linkedCount,
          modifiedFiles: data.modifiedFiles || [],
        });
      } else {
        alert(data.error || "İç bağlantı iyileştirme hatası");
      }
    } catch (err) {
      console.error(err);
      alert("Bağlantı sorunu");
    } finally {
      setIsLinking(false);
    }
  };

  // Save Config parameters
  const handleSaveSettings = async () => {
    if (!settings || !prompts) return;
    
    // Update settings file
    const setSuccess = await saveDB("settings", settings);
    
    // Update prompts file
    const updatedPrompts = { systemInstruction: editPrompt };
    const pSuccess = await saveDB("prompts", updatedPrompts);

    if (setSuccess && pSuccess) {
      alert("Ayarlar ve Yapay Zeka Yönergeleri başarıyla kaydedildi!");
    }
  };

  // Filtered Article master selector
  const filteredArticles = articles.filter(art => {
    const sMatch = art.title.toLowerCase().includes(articleSearch.toLowerCase()) || 
                   art.slug.toLowerCase().includes(articleSearch.toLowerCase()) || 
                   art.errorCode.toLowerCase().includes(articleSearch.toLowerCase());
                   
    const stMatch = statusFilter === "all" || art.status === statusFilter;
    const catMatch = categoryFilter === "all" || art.category === categoryFilter;
    
    return sMatch && stMatch && catMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
        
        {/* Navigation back and status */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-blue-650 inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Site Ana Sayfası</span>
          </Link>
          
          <div className="bg-slate-900 text-white px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>SEO TROUBLESHOOT CENTRAL PANEL v2</span>
          </div>
        </div>

        {/* Header Summary */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-slate-900 font-extrabold text-3xl tracking-tight mb-2">
              Sistem <span className="text-blue-600">Beyni & İçerik</span> Yönetimi
            </h1>
            <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
              Tüm makale listelerini, dinamik kategorileri, SEO meta verilerini ve SEO çapraz iç link kurallarını tek bir panelden yönetin. 
              Değişiklikler anında <strong>durum tabanlı (draft & published)</strong> olarak sisteme işlenir.
            </p>
          </div>

          <div className="flex gap-2.5 flex-wrap shrink-0">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-wider">MAKALE</span>
              <span className="text-slate-800 font-extrabold text-lg">{articles.length}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-wider">YAYINDA</span>
              <span className="text-emerald-600 font-extrabold text-lg">
                {articles.filter(a => a.status === "published").length}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-wider">TASLAK</span>
              <span className="text-amber-600 font-extrabold text-lg">
                {articles.filter(a => a.status === "draft").length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab System Controls */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab("articles")}
            className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "articles" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              Makale Veritabanı (JSON DB)
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("bulk"); parseBulkInput(); }}
            className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "bulk" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Hızlı Toplu Makale Üretici
            </span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "categories" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Grid className="w-3.5 h-3.5" />
              Kategoriler ({categories.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("links")}
            className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "links" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5" />
              İç Link Ayarları & optimizer
            </span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "settings" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" />
              Genel Site & AI Ayarları
            </span>
          </button>
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-[11px] text-slate-400 font-mono">Veritabaı dosyaları yükleniyor...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB I: ARTICLES MASTER DATABASE */}
            {activeTab === "articles" && (
              <div className="space-y-6">
                
                {/* Search & Actions Panel */}
                <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                  <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
                    <input 
                      type="text"
                      placeholder="Başlık, slug veya error ara..."
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all w-full sm:w-[220px]"
                    />

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">Tüm Durumlar</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="generated">Generated</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">Tüm Kategoriler</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yeni Makale Kaydı Ekle</span>
                  </button>
                </div>

                {/* SLIDE-DOWN: ADD ARTICLE FORM */}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleAddArticle} className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                          <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Plus className="w-4 h-4" /> NEW ARTICLE REGISTER FORM
                          </h3>
                          <span className="text-[10px] bg-blue-50 text-blue-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">DATABASE SEED</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-6">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Başlık *</label>
                            <input 
                              type="text" 
                              required
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              placeholder="Fix Windows Update Service Error 0x80070422"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kategori *</label>
                            <select
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hata ve Yardımcı Kod *</label>
                            <input 
                              type="text" 
                              required
                              value={newErrorCode}
                              onChange={(e) => setNewErrorCode(e.target.value)}
                              placeholder="0x80070422"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="md:col-span-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Slug * (URL Adres)</label>
                            <input 
                              type="text" 
                              required
                              value={newSlug}
                              onChange={(e) => setNewSlug(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-blue-600 font-mono"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Zorluk Derecesi</label>
                            <select
                              value={newDifficulty}
                              onChange={(e) => setNewDifficulty(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Est Time</label>
                            <input 
                              type="text"
                              value={newEstTime}
                              onChange={(e) => setNewEstTime(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Başarı Oranı</label>
                            <input 
                              type="text"
                              value={newSuccessRate}
                              onChange={(e) => setNewSuccessRate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">İlk Durum</label>
                            <select
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                            >
                              <option value="draft">Taslak (Draft)</option>
                              <option value="published">Yayında (Published)</option>
                            </select>
                          </div>
                        </div>

                        {newSlug && articles.some(a => a.slug === newSlug) && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>⚠️ <strong>Dikkat:</strong> Bu URL adresi (slug) ile zaten bir makale mevcut! Kayıt ederseniz yeni bilgilerle güncellenecektir.</span>
                          </div>
                        )}

                        {/* SEO Advanced details fields toggleable */}
                        <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                          <span className="text-[10px] font-extrabold text-slate-450 block uppercase tracking-wider">SEO Fields (Search Engine Optimization)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500 block mb-1">Meta Title</label>
                              <input 
                                type="text"
                                value={newMetaTitle}
                                onChange={(e) => setNewMetaTitle(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-650"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500 block mb-1">Meta Description</label>
                              <input 
                                type="text"
                                value={newMetaDesc}
                                onChange={(e) => setNewMetaDesc(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-650"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-semibold text-xs py-2 px-4 rounded-lg cursor-pointer"
                          >
                            İptal
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            Kaydet & Veritabanına Ekle
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Master Table Grid */}
                <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">
                          <th className="py-3 px-4 w-12">ID</th>
                          <th className="py-3 px-4">Makale Bilgisi</th>
                          <th className="py-3 px-4">Kategori & Kod</th>
                          <th className="py-3 px-4 w-40">Zorluk / Süre</th>
                          <th className="py-3 px-4 w-32">Durum</th>
                          <th className="py-3 px-4 text-right w-52">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                        {filteredArticles.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-slate-400 font-mono">
                              Arama kriterlerinize uyan kayıt bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          filteredArticles.map((art) => (
                            <tr key={art.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-400">{art.id}</td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-800 block leading-tight">{art.title}</span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">slug: {art.slug}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide uppercase">
                                  {art.category}
                                </span>
                                <span className="text-[10px] text-blue-600 font-bold block mt-1">Kod: {art.errorCode}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-[10px] space-y-0.5">
                                  <div className="font-semibold text-slate-600">Zorluk: {art.difficulty}</div>
                                  <div className="text-slate-400 inline-flex gap-1 items-center"><Clock className="w-3 h-3" /> {art.estTime}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={art.status}
                                  onChange={(e) => handleChangeStatus(art.id, e.target.value as any)}
                                  className={`text-[10px] font-bold px-2 py-1 rounded border focus:outline-none cursor-pointer ${
                                    art.status === "published"
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : art.status === "draft"
                                      ? "bg-amber-50 border-amber-200 text-amber-705"
                                      : "bg-blue-50 border-blue-200 text-blue-700"
                                  }`}
                                >
                                  <option value="draft">Draft</option>
                                  <option value="generated">Generated</option>
                                  <option value="reviewed">Reviewed</option>
                                  <option value="published">Published</option>
                                </select>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex gap-2 justify-end items-center">
                                  {art.status === "draft" ? (
                                    <button
                                      onClick={() => triggerGenerateSingle(art)}
                                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[10px] py-1 px-2.5 rounded border border-blue-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                                      title="AI ile makale gövdesini oluşturur ve .mdx dosyasını kaydeder."
                                    >
                                      <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                                      AI Üret
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-emerald-600 font-extrabold inline-flex items-center gap-0.5 bg-emerald-50 border border-emerald-100 px-1 rounded">
                                        <Check className="w-3 h-3" /> MDX
                                      </span>
                                      <button
                                        onClick={() => triggerGenerateSingle(art)}
                                        className="text-[10px] text-slate-500 hover:text-slate-850 hover:underline inline-flex items-center gap-0.5"
                                        title="Makaleyi yeniden üreterek MDX içeriğini günceller."
                                      >
                                        Yeniden Üret
                                      </button>
                                      <Link
                                        href={`/blog/${art.slug}`}
                                        target="_blank"
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1 px-2.5 rounded border border-slate-200 transition-colors inline-flex items-center gap-0.5"
                                      >
                                        Oku <ChevronRight className="w-3 h-3" />
                                      </Link>
                                    </div>
                                  )}
                                  
                                  <button
                                    onClick={() => setDeleteArticleId(art.id)}
                                    className="p-1 px-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Kayıdı Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB II: BULK AUTO GENERATION QUEUE */}
            {activeTab === "bulk" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* CONFIGURABILITY COLUMN */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <ListOrdered className="w-4 h-4 text-blue-500" />
                        Toplu Yazı Listesi Girişi
                      </h3>
                      <span className="text-[10px] bg-slate-150 text-slate-550 px-2 py-0.5 rounded font-bold font-mono">MDX QUEUE</span>
                    </div>

                    <textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder={`Eklenecek konuları satır satır buraya yazın veya yapıştırın.\n\nÖrnek Format:\n\nWindows Güncelleme Hataları\n0x80244007 : SOAP Protokol Hatası\n0x0000007B : Inaccessible Boot Device Hatası\n\nDLL Hataları\napi-ms-win-crt-runtime-l1-1-0.dll is missing\nopenal32.dll was not found`}
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all h-80 whitespace-pre"
                      disabled={isBulkProcessing}
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={parseBulkInput}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        disabled={isBulkProcessing}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Konuları Ayrıştır & Listele
                      </button>
                      {bulkInput && !isBulkProcessing && (
                        <button
                          type="button"
                          onClick={() => {
                            setBulkInput("");
                            localStorage.removeItem("admin_bulk_input");
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-lg transition-all border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                          title="Giriş Kutusunu Temizle"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                  </div>
 
                  <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-50 pb-3">
                      <Globe className="w-4 h-4 text-blue-500" />
                      Yapay Zeka Dil Tercihi
                    </h3>
                    <div className="mt-3">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Varsayılan Yazım Dili</div>
                      <div className="bg-emerald-50 border border-emerald-250/30 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-emerald-850">
                          <Check className="w-4 h-4 stroke-[3px] text-emerald-600" />
                          <span className="text-xs font-extrabold font-sans">Sadece İngilizce (English-Only)</span>
                        </div>
                        <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                          Sitenin kalitesini ve global SEO performansını korumak adına tüm üretimler <strong>yalnızca İngilizce</strong> olarak sınırlandırılmıştır. Türkçe başlık veya yönlendirmeler dahi verseniz, sistem bunu otomatik olarak çevirip İngilizce kılavuz üretecektir.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* QUEUE OUTPUT COLUMN */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                          <Grid className="w-4 h-4 text-blue-500" />
                          Hazırlanan Toplu Üretim Kuyruğu ({bulkQueue.length})
                          {bulkQueue.length > 0 && !isBulkProcessing && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Kuyruğu temizlemek istediğinize emin misiniz?")) {
                                  setBulkQueue([]);
                                  localStorage.removeItem("admin_bulk_queue");
                                  localStorage.setItem("admin_is_bulk_processing", "false");
                                }
                              }}
                              className="text-[10px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md py-0.5 px-2 transition-colors border border-rose-150 ml-1.5"
                            >
                              Kuyruğu Temizle
                            </button>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-550 mt-1 font-medium leading-relaxed">
                          Sıradaki konular listeleniyor. Her makale için otomatik frontmatter ve MDX oluşturulacak, sitemap listelerine dahil edilecektir.
                        </p>
                      </div>
 
                      {bulkQueue.length > 0 && (
                        <div className="flex items-center gap-2">
                          {isBulkProcessing ? (
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg pl-3 pr-1.5 py-1">
                              <span className="text-xs text-blue-700 font-bold flex items-center gap-1.5 shrink-0">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                                Yazılıyor ({bulkCurrentIndex + 1}/{bulkQueue.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  localStorage.setItem("admin_is_bulk_processing", "false");
                                  setIsBulkProcessing(false);
                                  setBulkCurrentIndex(-1);
                                }}
                                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[10px] py-1 px-2.5 rounded-md inline-flex items-center gap-1 transition-colors border border-rose-550 shadow-sm cursor-pointer shrink-0"
                              >
                                <X className="w-3 h-3" />
                                <span>Durdur</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startBulkGeneration()}
                              disabled={isBulkProcessing}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-lg inline-flex items-center gap-2 transition-colors border border-blue-500 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Toplu Üretimi Başlat</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Queue Statistics and Duplicate Skip Toggle */}
                    {bulkQueue.length > 0 && (
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 mb-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700">Kuyruk Analizi & Çift Filtresi</span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            Yeni Konu: <span className="text-blue-650 font-extrabold">{bulkQueue.filter(x => !x.isDuplicate).length}</span> | 
                            Mevcut/Tekrar Eden: <span className="text-amber-600 font-extrabold">{bulkQueue.filter(x => x.isDuplicate).length}</span>
                          </span>
                        </div>
                        <label className="flex items-start gap-2 cursor-pointer select-none py-1.5 border-t border-slate-200/60 mt-1">
                          <input 
                            type="checkbox"
                            checked={skipDuplicates}
                            onChange={(e) => setSkipDuplicates(e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-650 border-slate-300 rounded focus:ring-blue-550 cursor-pointer mt-0.5"
                            disabled={isBulkProcessing}
                          />
                          <div>
                            <span className="font-semibold text-slate-700 block text-[11px]">Mevcut Makaleleri Atla (Oluşturulmuş olanları ezme)</span>
                            <span className="text-[10px] text-slate-450 font-normal block leading-tight">Aktif edilirse, sistemde zaten var olan makaleler tekrar üretilmez ve atlanır. Kapatılırsa üzerine yazılarak güncellenir.</span>
                          </div>
                        </label>
                      </div>
                    )}

                    {bulkQueue.length === 0 ? (
                      <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/20">
                        <span className="text-4xl">🤖</span>
                        <h4 className="text-slate-800 font-bold text-sm mt-3">Kuyruk boş</h4>
                        <p className="text-slate-500 text-[11px] max-w-xs mx-auto mt-1 leading-relaxed">
                          Sol taraftaki kutuya başlıklarınızı format kurallarına uygun olarak ekleyip ayrıştırın.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-2 divide-y divide-slate-50">
                        {bulkQueue.map((item, idx) => (
                          <div 
                            key={idx}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 pl-1.5 transition-colors ${
                              item.status === "generating" ? "bg-blue-50/30 font-medium" : 
                              item.status === "skipped" ? "opacity-60 bg-slate-50/30" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="bg-slate-100 border border-slate-200 text-slate-650 font-mono text-[9px] w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 font-bold">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="text-slate-850 font-bold text-xs leading-tight mb-1">{item.title}</h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">{item.category}</span>
                                  {item.isDuplicate && (
                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5 scale-95" title="Sistemde bu URL adresi veya tam başlık bulundu.">
                                      <AlertCircle className="w-2.5 h-2.5" /> Mevcut Yazı
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex gap-2">
                              {item.status === "idle" && (
                                item.isDuplicate && skipDuplicates ? (
                                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded uppercase font-mono border border-amber-100">atlanacak</span>
                                ) : item.isDuplicate ? (
                                  <span className="text-[9px] font-bold text-orange-600 bg-orange-50/50 px-2 py-0.5 rounded uppercase font-mono border border-orange-100">güncellenecek</span>
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-450 bg-slate-100 px-2 py-0.5 rounded uppercase font-mono">kuyrukta</span>
                                )
                              )}
                              {item.status === "generating" && (
                                <span className="text-[9px] font-bold text-blue-650 bg-blue-50 px-2 py-0.5 rounded uppercase font-mono animate-pulse flex items-center gap-1">
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> yazılıyor
                                </span>
                              )}
                              {item.status === "skipped" && (
                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase font-mono flex items-center gap-0.5" title="Mevcut içerik korundu ve atlandı.">
                                  atlandı (mevcut)
                                </span>
                              )}
                              {item.status === "success" && (
                                <span className="text-[9px] font-bold text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded uppercase font-mono flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> başarılı
                                </span>
                              )}
                              {item.status === "error" && (
                                <span className="text-[9px] font-bold text-rose-650 bg-rose-50 px-2 py-0.5 rounded uppercase font-mono" title={item.error}>hata</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB III: CATEGORIES */}
            {activeTab === "categories" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-50 pb-3">
                    <Grid className="w-4 h-4 text-blue-500" />
                    Kategorileri Yönet ({categories.length})
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => {
                      const count = articles.filter(a => a.category === cat.id).length;
                      return (
                        <div key={cat.id} className="bg-slate-50 rounded-xl border border-slate-150 p-4 space-y-2.5 relative hover:border-slate-300 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-850 text-sm">{cat.name}</span>
                            <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap">
                              {count} Makale
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 leading-normal font-sans font-normal h-12 overflow-hidden text-ellipsis line-clamp-3">
                            {cat.description}
                          </p>
                          
                          <div className="text-[10px] text-slate-400 font-mono flex gap-1 items-center">
                            <span>ID: {cat.id}</span>
                            <span>•</span>
                            <span>Slug: {cat.slug}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB IV: INTERNAL LINK OPTIMIZER RULES */}
            {activeTab === "links" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ACTIVE LINKS VIEW */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-blue-500" />
                        Otomatik İç Link Kuralları ({internalLinks.length})
                      </h3>
                      <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-650 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">OPTIMIZER BASE</span>
                    </div>

                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-2 divide-y divide-slate-100">
                      {internalLinks.map((lnk, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 pl-1">
                          <div>
                            <span className="font-extrabold text-slate-800 text-xs block">Mevcut Kelime: &quot;{lnk.keyword}&quot;</span>
                            <span className="text-[10px] text-blue-600 font-mono">Hedef: /blog/{lnk.slug}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 max-w-[150px] truncate" title={lnk.description}>
                            {lnk.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* OPTIMIZER RUNNER */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-50 pb-2">
                      <Sliders className="w-4 h-4 text-blue-500" />
                      Optimizer Motoru
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Sistem her makalenin gövdesini tarayarak o güne kadar yayınlanan tüm diğer makalelerin hata kodlarını bulur ve onları otomatik olarak linke çevirir. 
                    </p>

                    <button
                      onClick={runInternalLinking}
                      disabled={isLinking}
                      className="w-full bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      {isLinking ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Bağlantılar Kuruluyor...</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3.5 h-3.5" />
                          <span>İç Bağlantıları Optimize Et (SEO)</span>
                        </>
                      )}
                    </button>

                    {/* Linking Results Container */}
                    {linkingResult && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-emerald-900 font-bold text-xs">Optimizasyon Tamamlandı!</h4>
                          <p className="text-[11px] text-emerald-800 mt-1">
                            Sistem toplam <strong className="font-extrabold">{linkingResult.linkedCount}</strong> kelimeyi otomatik iç linke dönüştürdü.
                          </p>
                          {linkingResult.modifiedFiles.length > 0 && (
                            <div className="mt-2.5 space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase">Güncellenen Dosyalar:</span>
                              <div className="flex flex-wrap gap-1">
                                {linkingResult.modifiedFiles.map(file => (
                                  <span key={file} className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono text-[9px]">
                                    {file}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB V: GENERAL SETTINGS & PROMPT EDITOR */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm space-y-6">
                  
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-blue-500" />
                      Sistem Ayarlarını Yapılandır
                    </h3>
                    <button
                      onClick={handleSaveSettings}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      Ayarları Kaydet
                    </button>
                  </div>

                  {settings && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <span className="text-[10px] font-extrabold text-slate-450 block uppercase tracking-wider">Site Metadata Bilgileri</span>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 block">Site Adı</label>
                          <input 
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 block">Site URL (Canonical Domain)</label>
                          <input 
                            type="text"
                            value={settings.siteUrl}
                            onChange={(e) => setSettings({...settings, siteUrl: e.target.value})}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-750 w-full font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 block">Site Açıklaması</label>
                          <textarea 
                            value={settings.description}
                            onChange={(e) => setSettings({...settings, description: e.target.value})}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 w-full h-24"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <span className="text-[10px] font-extrabold text-slate-450 block uppercase tracking-wider">Otomatik Sistem Parametreleri</span>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 block">Aktif Yapay Zeka Modeli (Gemini SDK)</label>
                          <input 
                            type="text"
                            value={settings.geminiModel}
                            onChange={(e) => setSettings({...settings, geminiModel: e.target.value})}
                            className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-500 w-full font-mono cursor-not-allowed"
                            disabled
                          />
                        </div>

                        <div className="p-3 bg-blue-50/45 border border-blue-100 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-slate-600 block">Otomatik XML Sitemap Desteği</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 rounded">ACTIVE</span>
                          </div>
                          <span className="text-[10px] text-slate-450 leading-relaxed block">
                            Yeni yazılar yayınlandığı anda sitemap.xml otomatik güncellenerek arama motorlarına hazır hale gelir.
                          </span>
                        </div>

                        <div className="p-3 bg-indigo-50/45 border border-indigo-100 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-slate-600 block">Dinamik RSS Beslemesi (Feed.xml)</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 rounded">ACTIVE</span>
                          </div>
                          <span className="text-[10px] text-slate-450 leading-relaxed block">
                            RSS entegrasyonu yardımıyla tüm makale kayıtları XML formatında her an güncel servis edilir.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROMPT EDITOR FIELD */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-450 block uppercase tracking-wider">İçerik Şablonu Prompt Yönergesi (The AI Brain template)</span>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Yapay Zekanın yazacağı makalenin yapısını, formunu değiştirmek resembles templates rules details. 
                      İçerisindeki <code>{`{title}`}</code>, <code>{`{slugName}`}</code> ve <code>{`{language_label}`}</code> gibi ifadeler dinamik olarak değiştirilir.
                    </p>
                    <textarea 
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 rounded-lg p-3.5 text-xs text-slate-750 font-mono focus:outline-none focus:border-blue-500 h-96 focus:bg-white transition-all focus:ring-1 focus:ring-blue-550"
                    />
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Global standard Admin Footer */}
      <footer className="bg-white border-t border-slate-100/95 py-6 text-center text-xs text-slate-400 font-mono mt-12 select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span>© {new Date().getFullYear()} TechErrorLog.com Database Controller Panel</span>
            <div className="flex items-center justify-center gap-3">
              <Link href="/about" className="hover:text-blue-600 transition-colors">About Us</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
            </div>
          </div>
          <span className="flex items-center gap-1.5 flex-row justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Dynamic JSON File Broker Engine: Active
          </span>
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      {deleteArticleId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-650 border border-rose-150 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Makaleyi Sil</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Bu makale kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-250/30 text-[11px] text-amber-800 leading-relaxed mt-2.5 space-y-1">
                  <strong>Not:</strong> Oluşan fiziksel <code>.mdx</code> dosyası diskten silinmez, ancak makale arama indekslerinden, SEO sitemap’ten, ana sayfadan ve admin panelinden anında kaldırılır.
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setDeleteArticleId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all select-none cursor-pointer"
              >
                İptal Et
              </button>
              <button
                onClick={() => deleteArticleId !== null && handleDeleteArticle(deleteArticleId)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer select-none"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
