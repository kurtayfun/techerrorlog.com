'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const BlogMarkdown = dynamic(() => import('@/components/BlogMarkdown'), {
  ssr: false,
  loading: () => <div className="space-y-4 animate-pulse"><div className="h-4 bg-slate-100 rounded w-2/3"></div><div className="h-4 bg-slate-100 rounded"></div><div className="h-4 bg-slate-100 rounded w-5/6"></div></div>
});

interface LazyBlogMarkdownProps {
  content: string;
}

export default function LazyBlogMarkdown({ content }: LazyBlogMarkdownProps) {
  return <BlogMarkdown content={content} />;
}
