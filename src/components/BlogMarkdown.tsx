'use client';

import React from 'react';
import Markdown from 'react-markdown';
import CodeBlock from '@/components/CodeBlock';

interface BlogMarkdownProps {
  content: string;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const markdownComponents = {
  h1: ({ children, ...props }: any) => (
    <h1 
      id={children ? slugify(String(children)) : undefined}
      className="text-2xl font-extrabold text-slate-900 mt-10 mb-5 tracking-tight border-b border-slate-100 pb-2 scroll-mt-24" 
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 
      id={children ? slugify(String(children)) : undefined}
      className="text-xl font-bold text-slate-800 mt-8 mb-4 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-2 scroll-mt-24" 
      {...props}
    >
      <span className="w-1.5 h-5 bg-blue-600 rounded"></span>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 
      id={children ? slugify(String(children)) : undefined}
      className="text-lg font-bold text-slate-800 mt-6 mb-3 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-1 scroll-mt-24" 
      {...props}
    >
      <span className="w-1 h-4 bg-blue-600 rounded"></span>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-slate-600 text-sm leading-relaxed mb-4" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc pl-5 space-y-2 mb-6 text-slate-600 text-sm" {...props}>{children}</ul>
  ),
  li: ({ children, ...props }: any) => (
    <li className="pl-1" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }: any) => {
    const getText = (node: any): string => {
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(getText).join('');
      if (node?.props?.children) return getText(node.props.children);
      return '';
    };

    const text = getText(children).trim();
    const isWarning = text.startsWith('[!WARNING]') || text.toLowerCase().includes('warning:') || text.toLowerCase().includes('caution:');
    const isNote = text.startsWith('[!NOTE]') || text.toLowerCase().includes('note:') || text.toLowerCase().includes('important:');
    const isTip = text.startsWith('[!TIP]') || text.toLowerCase().includes('tip:') || text.toLowerCase().includes('success:');

    if (isWarning) {
      return (
        <div className="my-6 p-4.5 bg-amber-50/70 border-l-4 border-amber-500 rounded-r-xl flex gap-3 text-amber-900 shadow-sm">
          <span className="text-amber-600 mt-0.5 font-bold text-lg select-none">⚠️</span>
          <div className="flex-grow text-xs leading-relaxed font-sans font-medium">
            {children}
          </div>
        </div>
      );
    }

    if (isTip) {
      return (
        <div className="my-6 p-4.5 bg-emerald-50/70 border-l-4 border-emerald-500 rounded-r-xl flex gap-3 text-emerald-900 shadow-sm">
          <span className="text-emerald-600 mt-0.5 font-bold text-lg select-none">💡</span>
          <div className="flex-grow text-xs leading-relaxed font-sans font-medium">
            {children}
          </div>
        </div>
      );
    }

    if (isNote) {
      return (
        <div className="my-6 p-4.5 bg-sky-50/70 border-l-4 border-sky-400 rounded-r-xl flex gap-3 text-sky-900 shadow-sm">
          <span className="text-sky-500 mt-0.5 font-bold text-lg select-none">ℹ️</span>
          <div className="flex-grow text-xs leading-relaxed font-sans font-medium">
            {children}
          </div>
        </div>
      );
    }

    return (
      <blockquote className="border-l-4 border-slate-200 pl-4 py-1 my-6 italic text-slate-500 leading-relaxed font-sans font-normal text-xs" {...props}>
        {children}
      </blockquote>
    );
  },
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    if (!inline && match) {
      return <CodeBlock code={codeString} language={match[1]} />;
    }
    if (!inline && codeString.includes('\n')) {
      return <CodeBlock code={codeString} language="bash" />;
    }
    return (
      <code className="bg-slate-100 text-blue-600 rounded px-1.5 py-0.5 text-xs font-mono font-medium" {...props}>
        {children}
      </code>
    );
  }
};

export default function BlogMarkdown({ content }: BlogMarkdownProps) {
  return <Markdown components={markdownComponents}>{content}</Markdown>;
}
