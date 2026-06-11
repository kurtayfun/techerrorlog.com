'use client';

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackPanelProps {
  slug: string;
}

export default function FeedbackPanel({ slug }: FeedbackPanelProps) {
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const savedFeedback = localStorage.getItem(`feedback-${slug}`);
    if (savedFeedback === 'yes' || savedFeedback === 'no') {
      setTimeout(() => {
        setVoted(savedFeedback as 'yes' | 'no');
      }, 0);
    }
  }, [slug]);

  const handleVote = (vote: 'yes' | 'no') => {
    localStorage.setItem(`feedback-${slug}`, vote);
    setVoted(vote);
    if (vote === 'yes') {
      setShowAnimation(true);
      // Automatically turn off celebration after 4 seconds
      const timer = setTimeout(() => setShowAnimation(false), 4000);
      return () => clearTimeout(timer);
    }
  };

  const handleReset = () => {
    localStorage.removeItem(`feedback-${slug}`);
    setVoted(null);
    setShowAnimation(false);
  };

  return (
    <div id="feedback-panel-container" className="my-10 border border-slate-200/90 rounded-2xl bg-slate-50/40 p-6 relative overflow-hidden select-none">
      
      {/* Celebration Particle Background for 'Yes' Vote */}
      <AnimatePresence>
        {showAnimation && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            {[...Array(12)].map((_, i) => {
              const angle = (i * 360) / 12;
              const radius = 80 + ((i * 7) % 40);
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              const delay = (i * 0.05) % 0.3;
              const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500'];
              const colorClass = colors[i % colors.length];

              return (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full ${colorClass}`}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1.2, 0.8, 0],
                    x: [0, x],
                    y: [0, y],
                    opacity: [1, 1, 0.8, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: delay,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
            Was This Solution Helpful?
          </h3>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Your feedback helps us improve our system recovery guides for the community.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {voted === null ? (
            <>
              <button
                id="feedback-vote-yes"
                onClick={() => handleVote('yes')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 hover:text-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                <span>Yes, Solved 👍</span>
              </button>
              <button
                id="feedback-vote-no"
                onClick={() => handleVote('no')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 hover:text-rose-700 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ThumbsDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 transition-colors" />
                <span>No, Unresolved 👎</span>
              </button>
            </>
          ) : voted === 'yes' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3"
            >
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-4 py-2 text-xs font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600 animate-bounce" />
                <span>Awesome! Resolved.</span>
              </div>
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-semibold tracking-wide underline cursor-pointer"
              >
                Change
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3"
            >
              <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-4 py-2 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-slate-500" />
                <span>Feedback submitted</span>
              </div>
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-semibold tracking-wide underline cursor-pointer"
              >
                Change
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Conditionally reveal tip messages based on vote style instructions */}
      <AnimatePresence>
        {voted === 'yes' && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="border-t border-slate-200/60 pt-4"
          >
            <div className="flex gap-2.5 items-start">
              <span className="text-lg">🎉</span>
              <div>
                <h4 className="font-bold text-xs text-slate-800 mb-0.5">Excellent! Glad we could help</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans font-normal">
                  To maintain system stability, keep running safety updates periodically and scan integrity with SFC or DISM.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {voted === 'no' && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="border-t border-slate-200/60 pt-4"
          >
            <div className="flex gap-2.5 items-start">
              <span className="text-lg text-rose-500 bg-rose-50 p-1.5 rounded-lg border border-rose-100/50">⚠️</span>
              <div>
                <h4 className="font-bold text-xs text-rose-955 mb-1 flex items-center gap-1.5">
                  Alternative Troubleshooting Resources
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans font-normal mb-2.5">
                  We are sorry this guide didn&apos;t resolve your problem! You can look up standalone packages directly on the Microsoft Update Catalog, or search for alternative resolutions.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://www.catalog.update.microsoft.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>Microsoft Update Catalog</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-300 text-xs text-slate-350 select-none">•</span>
                  <button
                    onClick={() => {
                      const faqElement = document.getElementById('alternative-methods');
                      if (faqElement) {
                        faqElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Alternative Methods
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
