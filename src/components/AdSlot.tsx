import React from 'react';

export default function AdSlot({ id, type = 'horizontal' }: { id: string; type?: 'horizontal' | 'sidebar' }) {
  const containerClasses = type === 'sidebar' 
    ? 'md:sticky md:top-4 w-full min-w-[300px] min-h-[600px]' 
    : 'w-full min-h-[90px] md:min-h-[250px]';

  return (
    <div 
      id={`ad-slot-${id}`}
      className={`ad-placeholder my-6 bg-slate-100/50 border border-dashed border-slate-200 text-slate-400 text-xs flex items-center justify-center rounded p-2 overflow-hidden transition-all ${containerClasses}`} 
      data-ad-id={id}
      style={{ contentVisibility: 'auto' }}
    >
      <span id={`ad-slot-text-${id}`} className="font-mono" aria-hidden="true">[Reserved Advertisement Space - {id}]</span>
    </div>
  );
}
