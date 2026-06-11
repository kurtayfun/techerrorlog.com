'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="code-block-container my-6 rounded-xl overflow-hidden border border-[#1e293b] bg-[#0b0f19] shadow-lg font-mono text-sm leading-relaxed">
      {/* Terminal Titlebar */}
      <div className="code-block-titlebar bg-[#030712] px-4 py-2.5 flex items-center justify-between border-b border-[#1e293b]/70 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-[#94a3b8] font-bold uppercase tracking-wider">
            {language || 'terminal'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded text-xs text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/60 transition-colors focus:outline-none cursor-pointer select-none"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-semibold">Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="code-block-body p-4.5 overflow-x-auto bg-[#070a12]/95 leading-relaxed text-[#c3dafe]">
        <pre className="text-xs sm:text-sm font-mono select-text">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
