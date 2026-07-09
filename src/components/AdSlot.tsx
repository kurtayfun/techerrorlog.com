"use client";

import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle?: any[];
    __adsenseConfig?: {
      enabled: boolean;
      publisherId: string;
    };
  }
}

export default function AdSlot({ id, type = 'horizontal' }: { id: string; type?: 'horizontal' | 'sidebar' }) {
  const [adsenseConfig, setAdsenseConfig] = useState<{ enabled: boolean; publisherId: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const config = window.__adsenseConfig;
      if (config) {
        /* eslint-disable-next-line react-hooks/set-state-in-effect */
        setAdsenseConfig(config);
      }
    }
  }, []);

  useEffect(() => {
    if (adsenseConfig?.enabled && adsenseConfig?.publisherId) {
      try {
        // Initialize the ad slot with AdSense once mounted
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('Google AdSense load error for slot:', id, err);
      }
    }
  }, [adsenseConfig, id]);

  const containerClasses = type === 'sidebar' 
    ? 'md:sticky md:top-4 w-full min-w-[300px] min-h-[600px]' 
    : 'w-full min-h-[90px] md:min-h-[250px]';

  // If AdSense is active, render a compliant Google AdSense <ins> tag
  if (adsenseConfig?.enabled && adsenseConfig?.publisherId) {
    return (
      <div 
        id={`ad-container-${id}`}
        className="w-full my-6 flex items-center justify-center overflow-hidden"
      >
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={adsenseConfig.publisherId}
          data-ad-slot={id}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Elegant dashed fallback during development or when AdSense is off
  return (
    <div 
      id={`ad-slot-${id}`}
      className={`ad-placeholder my-6 bg-slate-100/50 border border-dashed border-slate-200 text-slate-400 text-xs flex items-center justify-center rounded p-4 overflow-hidden transition-all ${containerClasses}`} 
      data-ad-id={id}
      style={{ contentVisibility: 'auto' }}
    >
      <div className="text-center space-y-1">
        <span id={`ad-slot-text-${id}`} className="font-mono block">[Reklam Alanı / Ad Slot - {id}]</span>
        <span className="text-[10px] text-slate-400/80 block">AdSense deaktif veya henüz yapılandırılmamış.</span>
      </div>
    </div>
  );
}
