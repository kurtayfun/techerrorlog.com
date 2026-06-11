'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const BlogTOC = dynamic(() => import('@/components/BlogTOC'), {
  ssr: false,
});

interface LazyBlogTOCProps {
  headings: any[];
  variant?: 'sidebar' | 'mobile';
}

export default function LazyBlogTOC({ headings, variant = 'sidebar' }: LazyBlogTOCProps) {
  return <BlogTOC headings={headings} variant={variant} />;
}
