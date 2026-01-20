import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Monitor, Smartphone, Tablet, Sparkles, Code, Download, Trash2, Palette, Layout as LayoutIcon, ChevronRight, Layers, RefreshCw, Save, X, Plus, Copy, Check, FileCode, FileJson, Wand2, Type as TypeIcon, GripVertical, Scan, RotateCcw, Share2, Heart, User, ExternalLink, Upload, Image, Eye, Rocket, Zap, Palette as PaletteIcon, MousePointer2, ArrowRight, ArrowUp
} from 'lucide-react';
import { LayoutSection, DesignSystem, DeviceType, SavedProject, CommunityProject, TextElementStyle } from './types';
import { generateLayout, refineLayout, generateFromImage } from './services/gemini';
import { 
  Navbar, Hero, Features, Pricing, Testimonials, Footer, Contact, Stats, CTA, FAQ, 
  LogoCloud, Newsletter, Team, Timeline 
} from './components/AdaptiveComponents';
import { generateReactCode } from './utils/codeGenerator';
import { optimizeImage } from './utils/imageOptimizer';

const SECTION_COMPONENTS: Record<string, React.FC<any>> = {
  navbar: Navbar, hero: Hero, features: Features, pricing: Pricing, testimonials: Testimonials, footer: Footer, contact: Contact, cta: CTA, stats: Stats, faq: FAQ, logoCloud: LogoCloud, newsletter: Newsletter, team: Team, timeline: Timeline
};

const STORAGE_KEY = 'adaptai_saved_projects';
const COMMUNITY_KEY = 'adaptai_community_designs';

const SUGGESTIONS = [
  {
    title: "AI SaaS Platform",
    prompt: "A modern SaaS landing page for an AI productivity tool with dark theme and glassmorphism.",
    icon: <Zap className="text-yellow-400" size={20} />,
    color: "from-yellow-500/10 to-orange-500/10"
  },
  {
    title: "Eco Coffee Brand",
    prompt: "Vibrant e-commerce homepage for a sustainable organic coffee brand with earthy tones.",
    icon: <PaletteIcon className="text-emerald-400" size={20} />,
    color: "from-emerald-500/10 to-teal-500/10"
  },
  {
    title: "Crypto Dashboard",
    prompt: "High-tech dashboard for crypto analytics featuring real-time stats and dark mode.",
    icon: <Monitor className="text-blue-400" size={20} />,
    color: "from-blue-500/10 to-indigo-500/10"
  },
  {
    title: "Space Tourism",
    prompt: "Futuristic space travel agency website with neon accents and high-impact hero sections.",
    icon: <Rocket className="text-purple-400" size={20} />,
    color: "from-purple-500/10 to-pink-500/10"
  }
];

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229'; 
};

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [sections, setSections] = useState<LayoutSection[]>([]);
  const [designSystem, setDesignSystem] = useState<DesignSystem>({
    primaryColor: '#4f46e5',
    borderRadius: '0.75rem',
    fontFamily: 'Inter',
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      showAriaLabels: true
    }
  });
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [codeTab, setCodeTab] = useState<'react' | 'json'>('react');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'layers' | 'gallery'>('design');
  const [gallerySubTab, setGallerySubTab] = useState<'templates' | 'saved' | 'community'>('templates');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextElement, setEditingTextElement] = useState<'title' | 'subtitle' | 'description' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const bgInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSavedProjects(JSON.parse(stored));
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setShowScrollTop(scrollContainerRef.current.scrollTop > 300);
    }
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const data = await generateLayout(prompt);
      setSections(data.sections);
      setDesignSystem(data.designSystem);
      setActiveTab('layers');
    } catch (err) { console.error(err); }
    finally { setIsGenerating(false); }
  };

  const handleRefine = async (refinementPrompt: string) => {
    if (!refinementPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const data = await refineLayout(sections, refinementPrompt);
      setSections(data.sections);
    } catch (err) { console.error(err); }
    finally { setIsGenerating(false); }
  };

  const updateSectionTypography = (id: string, element: 'title' | 'subtitle' | 'description', style: Partial<TextElementStyle>) => {
    setSections(prev => prev.map(s => {
      if (s.id !== id) return s;
      const currentTypography = s.style.typography || {};
      return {
        ...s,
        style: {
          ...s.style,
          typography: { ...currentTypography, [element]: { ...((currentTypography as any)[element] || {}), ...style } }
        }
      };
    }));
  };

  const loadProject = (project: SavedProject) => {
    setPrompt(project.prompt);
    setSections(project.sections);
    setDesignSystem(project.designSystem);
    setSelectedId(null);
    setActiveTab('layers');
  };

  const copyToClipboard = () => {
    const text = codeTab === 'react' ? generateReactCode(sections, designSystem) : JSON.stringify({ sections, designSystem }, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDeviceWidth = () => {
    switch (device) {
      case 'mobile': return 'w-[375px] h-[750px]';
      case 'tablet': return 'w-[768px] h-[950px]';
      default: return 'w-full h-fit';
    }
  };

  const canvasStyles = useMemo(() => ({
    '--primary': designSystem.primaryColor,
    '--primary-rgb': hexToRgb(designSystem.primaryColor),
    '--primary-foreground': '#ffffff',
    '--radius': designSystem.borderRadius,
    '--font-sans': `"${designSystem.fontFamily}", sans-serif`,
  } as React.CSSProperties), [designSystem]);

  const selectedSection = sections.find(s => s.id === selectedId);

  const handleSuggestionClick = (suggestionPrompt: string) => {
    setPrompt(suggestionPrompt);
    setActiveTab('design');
  };

  return (
    <div className="flex h-screen w-full bg-[#1e1e1e] overflow-hidden font-sans text-slate-300">
      <aside className="w-80 flex-shrink-0 bg-[#252526] border-r border-[#333] flex flex-col shadow-2xl">
        <div className="p-5 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shadow-lg"><Wand2 size={18} /></div>
            <h1 className="font-bold text-white tracking-tight">AdaptAI <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 uppercase">Pro</span></h1>
          </div>
        </div>

        <div className="flex border-b border-[#333]">
          {['design', 'layers', 'gallery'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === t ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500'}`}>{t}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6">
          {activeTab === 'design' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Magic Prompt</label>
                <div className="relative">
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your vision..." className="w-full h-32 bg-[#1e1e1e] border border-[#444] rounded-lg p-3 text-sm text-slate-200 resize-none shadow-inner outline-none focus:ring-1 ring-indigo-500" />
                  <button onClick={handleGenerate} disabled={isGenerating || !prompt} className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50"><Sparkles size={16} /></button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Global Styles</label>
                <div className="bg-[#2d2d2d] rounded-lg p-4 space-y-4 border border-[#444]">
                  <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Primary Color</span><input type="color" value={designSystem.primaryColor} onChange={(e) => setDesignSystem({...designSystem, primaryColor: e.target.value})} className="w-10 h-6 bg-transparent" /></div>
                  <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Corner Radius</span><input type="text" value={designSystem.borderRadius} onChange={(e) => setDesignSystem({...designSystem, borderRadius: e.target.value})} className="bg-[#1e1e1e] border border-[#444] rounded px-2 py-0.5 text-[10px] text-slate-400 w-16" /></div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Accessibility Options</label>
                <div className="bg-[#2d2d2d] rounded-lg p-4 space-y-3 border border-[#444]">
                  {[
                    { label: 'High Contrast', key: 'highContrast' },
                    { label: 'Reduced Motion', key: 'reducedMotion' },
                    { label: 'ARIA Support', key: 'showAriaLabels' }
                  ].map(({ label, key }) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
                      <button 
                        onClick={() => setDesignSystem({...designSystem, accessibility: { ...designSystem.accessibility, [key]: !(designSystem.accessibility as any)[key] }})}
                        className={`w-8 h-4 rounded-full relative transition-colors ${designSystem.accessibility[key as keyof typeof designSystem.accessibility] ? 'bg-indigo-600' : 'bg-slate-600'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${designSystem.accessibility[key as keyof typeof designSystem.accessibility] ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layers' && selectedSection && (
            <div className="space-y-6">
               <div className="border-t border-[#333] pt-6 space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2"><TypeIcon size={12} /> Typography</label>
                  <div className="space-y-2">
                    {['title', 'subtitle', 'description'].map((element) => {
                      const isEditing = editingTextElement === element;
                      const style = (selectedSection.style.typography as any)?.[element] || {};
                      return (
                        <div key={element} className="bg-[#2d2d2d] rounded-lg border border-[#444] overflow-hidden">
                          <button onClick={() => setEditingTextElement(isEditing ? null : element as any)} className="w-full p-3 flex items-center justify-between text-left hover:bg-[#333]"><span className="text-[10px] font-bold text-white capitalize">{element}</span><ChevronRight size={14} className={isEditing ? 'rotate-90' : ''} /></button>
                          {isEditing && (
                            <div className="p-4 space-y-4">
                              <input type="text" value={style.fontSize || ''} placeholder="Size" onChange={(e) => updateSectionTypography(selectedId!, element as any, { fontSize: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#444] rounded p-2 text-[10px] text-slate-300" />
                              <input type="color" value={style.color || '#ffffff'} onChange={(e) => updateSectionTypography(selectedId!, element as any, { color: e.target.value })} className="w-full h-8" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-6">
               <div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-[#333]">
                  {['templates', 'saved'].map(tab => (
                    <button key={tab} onClick={() => setGallerySubTab(tab as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded transition-all ${gallerySubTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{tab}</button>
                  ))}
               </div>
               <div className="space-y-4">
                  {gallerySubTab === 'templates' && (
                    <div className="grid grid-cols-1 gap-3">
                       <button onClick={() => loadProject(savedProjects[0])} className="p-4 bg-[#2d2d2d] border border-[#444] rounded-xl text-left hover:border-indigo-500 transition-all group">
                          <span className="text-xs font-bold text-white block mb-1">Modern SaaS Landing</span>
                          <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 flex items-center gap-1">Load Template <ArrowRight size={10} /></span>
                       </button>
                    </div>
                  )}
                  {gallerySubTab === 'saved' && savedProjects.map(p => (
                    <div key={p.id} onClick={() => loadProject(p)} className="p-4 bg-[#2d2d2d] border border-[#444] rounded-xl text-left hover:border-indigo-500 transition-all cursor-pointer">
                      <span className="text-xs font-bold text-white block mb-1">{p.name}</span>
                      <span className="text-[10px] text-slate-500">{new Date(p.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[#333]">
           <button onClick={() => setShowCode(!showCode)} className="w-full py-2.5 rounded bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg">{showCode ? 'Close Source' : 'Export Code'}</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#121212] overflow-hidden relative">
        <header className="h-14 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-6 shrink-0 z-50">
          <div className="flex bg-[#252526] p-1 rounded-md border border-[#444]">
            {['mobile', 'tablet', 'desktop'].map(d => (
              <button key={d} onClick={() => setDevice(d as any)} className={`p-1.5 rounded transition-all ${device === d ? 'bg-[#37373d] text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
                {d === 'mobile' ? <Smartphone size={16} /> : d === 'tablet' ? <Tablet size={16} /> : <Monitor size={16} />}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCode(true)} className="w-10 h-10 bg-indigo-600 text-white rounded-md flex items-center justify-center hover:bg-indigo-500 shadow-lg"><Download size={18} /></button>
        </header>

        <div className="flex-1 overflow-auto p-8 md:p-12 flex justify-center items-start scroll-smooth relative">
          <div className={`${getDeviceWidth()} bg-white shadow-2xl transition-all duration-700 relative min-h-[500px] border-[12px] border-[#252526] rounded-[3rem] overflow-hidden`} style={canvasStyles}>
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="h-full w-full overflow-y-auto no-scrollbar bg-white relative"
            >
              {sections.length > 0 ? (
                <>
                  <div className="flex flex-col">
                    {sections.map((section) => {
                      const Component = SECTION_COMPONENTS[section.type];
                      return Component ? (
                        <div key={section.id} className={`group relative transition-all ${section.type === 'navbar' ? 'sticky top-0 z-[100]' : ''}`} onClick={() => setSelectedId(section.id)}>
                          <Component section={section} designSystem={designSystem} isSelected={selectedId === section.id} />
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  {/* Scroll to Top Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); scrollToTop(); }}
                    className={`absolute bottom-8 right-8 w-12 h-12 rounded-full bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-[150] ${
                      showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                    aria-label="Scroll to top"
                  >
                    <ArrowUp size={24} />
                  </button>
                </>
              ) : (
                <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center p-8 md:p-16 text-center animate-in fade-in duration-500">
                  <div className="mb-10 relative">
                     <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full"></div>
                     <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center text-indigo-600 relative z-10 animate-bounce">
                        <Sparkles size={40} />
                     </div>
                  </div>
                  
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Your vision, <span className="text-indigo-600">pixel perfect.</span></h2>
                  <p className="text-slate-500 text-lg max-w-lg mb-12 leading-relaxed font-medium">From a simple thought to a fully responsive interface in seconds. Describe what you want to build.</p>

                  <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                    {SUGGESTIONS.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSuggestionClick(s.prompt)}
                        className={`group p-6 bg-gradient-to-br ${s.color} border border-slate-200 rounded-2xl text-left transition-all hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1 active:scale-95`}
                      >
                        <div className="mb-4 w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center transition-transform group-hover:scale-110">
                          {s.icon}
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm mb-2">{s.title}</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{s.prompt}</p>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <button onClick={() => setActiveTab('gallery')} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold transition-colors">
                       <LayoutIcon size={18} /> Browse Templates
                    </button>
                    <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></div>
                    <button onClick={() => setActiveTab('design')} className="flex items-center gap-2 py-4 px-8 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95">
                      <MousePointer2 size={18} /> Start Generating
                    </button>
                  </div>
                </div>
              )}
            </div>
            {isGenerating && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center animate-in fade-in duration-300">
                 <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={20} />
                 </div>
                 <p className="text-slate-900 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Assembling Components...</p>
              </div>
            )}
          </div>
        </div>

        {sections.length > 0 && (
          <div className="h-16 bg-[#1e1e1e] border-t border-[#333] flex items-center px-6 gap-4 z-50">
            <input 
              type="text"
              placeholder="Refine selected component..."
              className="flex-1 bg-[#252526] border border-[#444] rounded-lg px-4 py-2 text-xs text-slate-200 outline-none focus:ring-1 ring-indigo-500"
              onKeyDown={(e) => { if (e.key === 'Enter') { handleRefine(e.currentTarget.value); e.currentTarget.value = ''; } }}
            />
          </div>
        )}

        {showCode && (
          <div className="absolute inset-y-0 right-0 w-[600px] max-w-full bg-[#1e1e1e] z-[300] shadow-2xl border-l border-[#333] flex flex-col animate-in slide-in-from-right duration-500">
             <div className="p-5 border-b border-[#333] flex justify-between items-center bg-[#252526]">
               <div className="flex items-center gap-6">
                 <h3 className="text-white font-bold text-sm">Source Export</h3>
                 <div className="flex bg-[#1e1e1e] p-1 rounded-md border border-[#444]">
                    <button onClick={() => setCodeTab('react')} className={`px-3 py-1 rounded text-[10px] font-black ${codeTab === 'react' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>REACT</button>
                    <button onClick={() => setCodeTab('json')} className={`px-3 py-1 rounded text-[10px] font-black ${codeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>JSON</button>
                 </div>
               </div>
               <button onClick={() => setShowCode(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
             </div>
             <div className="flex-1 overflow-auto p-8 font-mono text-[11px]">
               <pre className="text-indigo-300 whitespace-pre-wrap">{codeTab === 'react' ? generateReactCode(sections, designSystem) : JSON.stringify({ sections, designSystem }, null, 2)}</pre>
               <button onClick={copyToClipboard} className="mt-8 px-4 py-2 bg-[#252526] text-white border border-[#444] rounded text-[10px] font-black">{copied ? 'COPIED' : 'COPY CODE'}</button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
