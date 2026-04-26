'use client';

import { useState, useEffect } from 'react';
import { useAppStore, Post, Idea, API_PROVIDERS, ApiProvider } from '@/stores/useAppStore';

const platMeta: Record<string, { key: string; icon: string; cls: string; limit: number }> = {
  Instagram: { key: 'ig', icon: 'fa-instagram', cls: 'pb-ig', limit: 2200 },
  'X / Twitter': { key: 'tw', icon: 'fa-x-twitter', cls: 'pb-tw', limit: 280 },
  LinkedIn: { key: 'li', icon: 'fa-linkedin', cls: 'pb-li', limit: 3000 },
  TikTok: { key: 'tk', icon: 'fa-tiktok', cls: 'pb-tk', limit: 150 },
};

const demoIdeas = [
  { type: 'Carousel', platform: 'ig', content: 'Share 5 things you wish you knew when you started out. First slide: the hook. Last slide: a question that invites comments.' },
  { type: 'Thread', platform: 'tw', content: 'Break down one mistake you made this week and what you\'d do differently. People respect honesty more than polish.' },
  { type: 'Story', platform: 'ig', content: 'A day-in-the-life snap story. No script, no editing. Authenticity is the strategy.' },
  { type: 'Video', platform: 'tk', content: '60-second "here\'s what no one tells you about your niche" — controversial angle, confident delivery.' },
  { type: 'Post', platform: 'li', content: 'Write about the lesson that took you the longest to learn professionally. Short, personal, no fluff.' },
];

const niches = ['Creator', 'Business', 'Freelancer', 'Student', 'Fitness', 'Tech'];
const platforms = ['Instagram', 'X / Twitter', 'LinkedIn', 'TikTok'];
const frequencies = [
  { key: 'daily', name: 'Every day', sub: '7 posts/week · Builds fast momentum', tag: 'FASTEST' },
  { key: '3x', name: '3 times a week', sub: 'Mon · Wed · Fri · Steady & sustainable', tag: 'POPULAR' },
  { key: 'weekly', name: 'Once a week', sub: '1 solid post · Low stress, still consistent', tag: 'CHILL' },
];

export default function Home() {
  const store = useAppStore();
  const [screen, setScreen] = useState<'ob1' | 'ob2' | 'ob3' | 'app'>('ob1');
  const [tab, setTab] = useState<'home' | 'ideas' | 'compose' | 'settings'>('home');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [selectedFreq, setSelectedFreq] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideaFilter, setIdeaFilter] = useState('all');
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  const scheduledPosts = store.posts.filter(p => p.status === 'scheduled');
  const streak = store.user?.streak ?? 9;

  useEffect(() => {
    if (store.hasCompletedOnboarding) {
      setScreen('app');
    }
  }, [store.hasCompletedOnboarding]);

  const goOb2 = () => { if (selectedNiche) { store.updateUser({ niche: selectedNiche }); setScreen('ob2'); }};
  const goOb3 = () => { if (selectedPlatforms.size > 0) { 
    selectedPlatforms.forEach(p => store.updatePlatformConnection(p, true));
    setScreen('ob3');
  }};
  const goApp = () => {
    store.updateUser({ frequency: selectedFreq });
    store.setHasCompletedOnboarding(true);
    setScreen('app');
  };

  const showTab = (t: 'home' | 'ideas' | 'compose' | 'settings') => { setTab(t); store.setActiveTab(t); };
  
  const togglePlatform = (p: string) => {
    const next = new Set(selectedPlatforms);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setSelectedPlatforms(next);
  };

  const generateIdeas = async () => {
    setIsGenerating(true);
    const niche = store.user?.niche || 'Creator';
    const platformList = Array.from(selectedPlatforms).join(', ') || 'Instagram, X';
    const provider = store.apiProvider;
    
    const prompt = `Generate 5 post ideas for a ${niche} on ${platformList}. 
Each idea should feel personal, authentic, and be easy to execute in under 30 minutes.
Return ONLY valid JSON array: [{"type":"Post type","plat":"ig/tw/li/tk","text":"1-2 sentence idea"}]`;

    try {
      const apiKey = store.apiKey || apiKeyInput;
      if (!apiKey) throw new Error('No API key');
      
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey, provider }),
      });
      const data = await res.json();
      
      if (data.error) {
        store.showToast(data.error, 'error');
        throw new Error(data.error);
      }
      
      const ideas: Idea[] = data.ideas.map((i: any, idx: number) => ({
        id: `idea-${Date.now()}-${idx}`,
        type: i.type,
        platform: i.plat,
        content: i.text,
        used: false,
      }));
      store.setIdeas(ideas);
    } catch {
      store.setIdeas(demoIdeas.map((i, idx) => ({ ...i, id: `demo-${Date.now()}-${idx}`, used: false })));
    }
    setIsGenerating(false);
  };

  const polishPost = async () => {
    const content = store.composeContent.trim();
    if (!content) { store.showToast('Write something first!', 'error'); return; }
    const plat = store.composePlatform;
    const provider = store.apiProvider;
    
    try {
      const apiKey = store.apiKey || apiKeyInput;
      if (!apiKey) throw new Error('No API key');
      
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platform: plat, apiKey, provider }),
      });
      const data = await res.json();
      store.setComposeContent(data.polished);
      store.showToast('Post polished!', 'success');
    } catch {
      store.showToast('Add API key in Settings', 'error');
    }
  };

  const addHashtags = async () => {
    const content = store.composeContent.trim();
    if (!content) { store.showToast('Write something first!', 'error'); return; }
    const provider = store.apiProvider;
    
    try {
      const apiKey = store.apiKey || apiKeyInput;
      if (!apiKey) throw new Error('No API key');
      
      const res = await fetch('/api/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, apiKey, provider }),
      });
      const data = await res.json();
      store.setComposeContent(content + '\n\n' + data.hashtags);
      store.showToast('Hashtags added!', 'success');
    } catch {
      store.showToast('Add API key in Settings', 'error');
    }
  };

  const schedulePost = () => {
    const content = store.composeContent.trim();
    if (!content) { store.showToast('Write something first!', 'error'); return; }
    
    const newPost: Post = {
      id: `post-${Date.now()}`,
      platformId: store.composePlatform,
      platform: store.composePlatform,
      title: content.slice(0, 48) + (content.length > 48 ? '...' : ''),
      content,
      scheduledAt: new Date().toISOString(),
      postedAt: null,
      status: 'scheduled',
    };
    store.addPost(newPost);
    store.setComposeContent('');
    store.updateUser({ streak: streak + 1 });
    store.showToast('Post scheduled!', 'success');
    showTab('home');
  };

  const useIdea = (idea: Idea) => {
    store.setComposeContent(idea.content);
    store.setComposePlatform(idea.platform);
    store.markIdeaUsed(idea.id);
    showTab('compose');
    store.showToast('Idea loaded!', 'success');
  };

  const renderOnboarding = () => (
    <div className="ob">
      <div className="ob-logo">nudge<em>.</em></div>
      <div className="ob-prog">
        <div className={`ob-dot ${screen === 'ob1' || screen === 'ob2' || screen === 'ob3' ? 'on' : ''}`}></div>
        <div className={`ob-dot ${screen === 'ob2' || screen === 'ob3' ? 'on' : ''}`}></div>
        <div className={`ob-dot ${screen === 'ob3' ? 'on' : ''}`}></div>
      </div>
    </div>
  );

  if (screen === 'ob1') {
    return (
      <div className="screen active">
        {renderOnboarding()}
        <div className="ob">
          <div className="ob-step">Step 1 of 3</div>
          <div className="ob-h">What's your space?</div>
          <div className="ob-sub">We&apos;ll tailor your post ideas and reminders around what you actually do.</div>
          <div className="chip-grid">
            {niches.map(n => (
              <div key={n} className={`chip ${selectedNiche === n ? 'sel' : ''}`} onClick={() => setSelectedNiche(n)}>
                <div className="chip-icon"><i className={`fa-solid ${n === 'Creator' ? 'fa-palette' : n === 'Business' ? 'fa-building' : n === 'Freelancer' ? 'briefcase' : n === 'Student' ? 'graduation-cap' : n === 'Fitness' ? 'dumbbell' : 'fa-code'}`}></i></div>
                <div className="chip-name">{n}</div>
                <div className="chip-desc">{n === 'Creator' ? 'Content, art, videos' : n === 'Business' ? 'Brand, products, services' : n === 'Freelancer' ? 'Skills, portfolio, clients' : n === 'Student' ? 'Learning, projects, growth' : n === 'Fitness' ? 'Health, routines, progress' : 'Code, tools, products'}</div>
              </div>
            ))}
          </div>
          <button className="btn-p" disabled={!selectedNiche} onClick={goOb2}>Continue →</button>
        </div>
      </div>
    );
  }

  if (screen === 'ob2') {
    return (
      <div className="screen active">
        {renderOnboarding()}
        <div className="ob">
          <div className="ob-step">Step 2 of 3</div>
          <div className="ob-h">Where do you want to grow?</div>
          <div className="ob-sub">Pick the platforms. You can always add more later — no pressure.</div>
          <div className="plat-list">
            {platforms.map(p => (
              <div key={p} className={`plat-row ${selectedPlatforms.has(p) ? 'sel' : ''}`} onClick={() => togglePlatform(p)}>
                <div className="plat-row-icon">
                  <i className={`fa-brands ${platMeta[p]?.icon}`}></i>
                </div>
                <div className="plat-row-name">{p}</div>
                <div className="check-circle">
                  {selectedPlatforms.has(p) ? <i className="fa-solid fa-circle-check"></i> : <i className="fa-regular fa-circle"></i>}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-p" disabled={selectedPlatforms.size === 0} onClick={goOb3}>Continue →</button>
        </div>
      </div>
    );
  }

  if (screen === 'ob3') {
    return (
      <div className="screen active">
        {renderOnboarding()}
        <div className="ob">
          <div className="ob-step">Step 3 of 3</div>
          <div className="ob-h">How often do you want to post?</div>
          <div className="ob-sub">Be honest. A realistic goal you keep beats an ambitious one you abandon.</div>
          <div className="freq-list">
            {frequencies.map(f => (
              <div key={f.key} className={`freq-row ${selectedFreq === f.key ? 'sel' : ''}`} onClick={() => setSelectedFreq(f.key)}>
                <div className="freq-info"><div className="freq-name">{f.name}</div><div className="freq-sub">{f.sub}</div></div>
                <div className="freq-tag">{f.tag}</div>
              </div>
            ))}
          </div>
          <button className="btn-p" disabled={!selectedFreq} onClick={goApp}>Let&apos;s go →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen active">
      <style>{`
        .ob{flex:1;display:flex;flex-direction:column;padding:2rem 1.5rem}
        .ob-logo{font-family:'Instrument Serif',serif;font-size:36px;color:var(--amber);margin-bottom:2.5rem;letter-spacing:-.5px}
        .ob-logo em{font-style:italic}
        .ob-prog{display:flex;gap:.4rem;margin-bottom:1.5rem}
        .ob-dot{height:3px;border-radius:2px;flex:1;background:var(--b2);transition:background .3s}
        .ob-dot.on{background:var(--amber)}
        .ob-step{font-size:11px;color:var(--t3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.4rem}
        .ob-h{font-size:22px;font-weight:600;line-height:1.3;margin-bottom:.4rem}
        .ob-sub{font-size:14px;color:var(--t2);line-height:1.6;margin-bottom:1.75rem}
        
        .app-bar{position:sticky;top:0;z-index:10;background:rgba(13,12,10,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--b1);padding:.8rem 1.25rem;display:flex;align-items:center;justify-content:space-between}
        .app-logo{font-family:'Instrument Serif',serif;font-size:22px;color:var(--amber);letter-spacing:-.3px}
        .app-logo em{font-style:italic}
        .streak-pill{background:var(--amber-bg);border:1px solid rgba(232,148,42,.25);border-radius:20px;padding:.28rem .75rem;font-size:12px;font-weight:600;color:var(--amber-l);display:flex;align-items:center;gap:.3rem}
        .tab-content{flex:1;overflow-y:auto;padding-bottom:72px}
        .tab-pane{display:none;padding:1.1rem 1.1rem 0;animation:fadeIn .2s ease}
        .tab-pane.active{display:block}
        .bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--s1);border-top:1px solid var(--b1);display:flex;z-index:20;padding-bottom:env(safe-area-inset-bottom)}
        .nav-item{flex:1;display:flex;flex-direction:column;align-items:center;padding:.65rem .5rem .4rem;cursor:pointer;color:var(--t3);gap:2px;transition:color .15s}
        .nav-item.active{color:var(--amber)}
        .nav-icon{font-size:18px;line-height:1}
        .nav-lbl{font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
        
        .nudge-card{background:var(--amber-bg);border:1px solid rgba(232,148,42,.28);border-radius:var(--rlg);padding:1.1rem;margin-bottom:.85rem}
        .nudge-tag{font-size:9px;font-weight:700;color:var(--amber);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.4rem}
        .nudge-msg{font-size:15px;font-weight:600;line-height:1.35;margin-bottom:.3rem}
        .nudge-sub{font-size:12px;color:var(--t2);margin-bottom:.9rem}
        
        .stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:.85rem}
        .stat-card{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);padding:1rem}
        .stat-val{font-size:30px;font-weight:600;line-height:1}
        .stat-lbl{font-size:11px;color:var(--t2);margin-top:.2rem}
        .stat-up{font-size:11px;color:var(--green);margin-top:.25rem}
        
        .post-card{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);padding:.875rem 1rem;margin-bottom:.5rem;display:flex;gap:.75rem}
        .post-card.done{opacity:.45}
        .post-time{font-size:11px;color:var(--t3);min-width:46px;padding-top:2px;line-height:1.5}
        .post-body{flex:1}
        .post-title{font-size:13px;font-weight:500;margin-bottom:3px}
        .post-meta{font-size:12px;color:var(--t2);display:flex;align-items:center;gap:.3rem;flex-wrap:wrap}
        .sdot{width:5px;height:5px;border-radius:50%;display:inline-block;vertical-align:middle}
        .sdot-s{background:var(--amber)}
        .sdot-d{background:var(--green)}
        
        .filters{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.85rem}
        .filter-btn{background:var(--s2);border:1px solid var(--b1);border-radius:20px;padding:.35rem .85rem;font-size:12px;font-weight:500;cursor:pointer;color:var(--t2);font-family:inherit;transition:all .15s}
        .filter-btn.active{background:var(--amber-bg);border-color:rgba(232,148,42,.35);color:var(--amber-l)}
        .gen-btn{width:100%;background:var(--s2);border:1.5px dashed var(--b2);border-radius:var(--r);padding:.9rem;font-size:14px;font-weight:500;color:var(--t2);cursor:pointer;font-family:inherit;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:.5rem;margin-bottom:.85rem}
        .gen-btn:hover{border-color:var(--amber);color:var(--amber-l)}
        
        .idea-card{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);padding:1rem;margin-bottom:.6rem;transition:border-color .15s}
        .idea-card:hover{border-color:var(--b2)}
        .idea-head{display:flex;align-items:center;gap:.5rem;margin-bottom:.55rem}
        .idea-type{font-size:10px;font-weight:700;color:var(--t3);letter-spacing:.07em;text-transform:uppercase}
        .idea-text{font-size:13px;line-height:1.55;color:var(--text);margin-bottom:.8rem}
        .idea-foot{display:flex;align-items:center;justify-content:space-between}
        .btn-use{background:transparent;border:1px solid var(--b2);border-radius:var(--rsm);padding:.38rem .85rem;font-size:12px;font-weight:500;color:var(--t2);cursor:pointer;font-family:inherit;transition:all .15s}
        .btn-use:hover{border-color:var(--amber);color:var(--amber)}
        
        .plat-select{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.85rem}
        .ps-btn{background:var(--s2);border:1.5px solid var(--b1);border-radius:20px;padding:.38rem .9rem;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;color:var(--t2)}
        .ps-btn.on{border-color:var(--amber);color:var(--amber-l);background:var(--amber-bg)}
        .compose-box{background:var(--s2);border:1.5px solid var(--b1);border-radius:var(--r);overflow:hidden;margin-bottom:.6rem;transition:border-color .15s}
        .compose-box:focus-within{border-color:var(--b2)}
        .compose-box textarea{width:100%;background:transparent;border:none;outline:none;padding:1rem;font-size:14px;color:var(--text);font-family:inherit;resize:none;min-height:150px;line-height:1.6}
        .compose-box textarea::placeholder{color:var(--t3)}
        .compose-bar{border-top:1px solid var(--b1);padding:.65rem .9rem;display:flex;align-items:center;justify-content:space-between}
        .char-c{font-size:12px;color:var(--t3)}
        .char-c.warn{color:var(--red)}
        .compose-ctas{display:flex;gap:.5rem;margin-bottom:.85rem}
        
        .sched-panel{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);padding:.9rem 1rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem}
        .sched-lbl{font-size:13px;color:var(--t2)}
        .time-sel{background:var(--s3);border:1px solid var(--b2);border-radius:var(--rsm);padding:.35rem .7rem;font-size:13px;color:var(--text);font-family:inherit;outline:none;cursor:pointer}
        
        .settings-sec{margin-bottom:1.5rem}
        .settings-h{font-size:11px;font-weight:700;color:var(--t3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.65rem}
        .conn-card{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);padding:.9rem 1.1rem;display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem}
        .conn-icon{font-size:20px;width:28px;text-align:center}
        .conn-name{font-size:14px;font-weight:500}
        .conn-status{font-size:12px;color:var(--t2);margin-top:1px;display:flex;align-items:center;gap:.3rem}
        .cdot{width:6px;height:6px;border-radius:50%;background:var(--b2)}
        .cdot.on{background:var(--green)}
        .btn-conn{background:var(--amber-bg);border:1px solid rgba(232,148,42,.3);border-radius:var(--rsm);padding:.38rem .85rem;font-size:12px;font-weight:600;color:var(--amber-l);cursor:pointer;font-family:inherit;white-space:nowrap}
        .btn-conn:hover{background:rgba(232,148,42,.2)}
        
        .policy-box{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);overflow:hidden}
        .policy-row{display:flex;align-items:flex-start;gap:.65rem;padding:.75rem 1rem;border-bottom:1px solid var(--b1)}
        .policy-row:last-child{border-bottom:none}
        .p-icon{font-size:14px;margin-top:1px;flex-shrink:0}
        .p-text{font-size:12px;color:var(--t2);line-height:1.5}
        .p-text strong{color:var(--text);font-weight:500}
        .api-wrap{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);overflow:hidden}
        .api-input{width:100%;background:transparent;border:none;outline:none;padding:.9rem 1rem;font-size:13px;color:var(--text);font-family:inherit}
        .api-input::placeholder{color:var(--t3)}
        .api-note{font-size:11px;color:var(--t3);margin-top:.5rem;line-height:1.5}
        .api-provider-list{display:flex;flex-direction:column;gap:.5rem}
        .api-provider-row{background:var(--s2);border:1.5px solid var(--b1);border-radius:var(--r);padding:.75rem 1rem;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:space-between}
        .api-provider-row.sel{border-color:var(--amber);background:var(--amber-bg)}
        .api-provider-name{font-size:13px;font-weight:600}
        .api-provider-model{font-size:11px;color:var(--t2);margin-top:1px}
        .free-tag{font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;background:var(--b2);color:var(--text)}
        .free-tag.free{background:rgba(82,184,112,.2);color:#6ACA88}
        .kofi-btn{display:flex;align-items:center;justify-content:center;gap:.5rem;background:#13c5fa;border:none;border-radius:var(--r);padding:.75rem 1rem;font-size:14px;font-weight:600;color:#fff;cursor:pointer;font-family:inherit;text-decoration:none;transition:all .15s}
        .kofi-btn:hover{background:#0eb3f0}
      `}</style>
      
      <div className="app-bar">
        <div className="app-logo">nudge<em>.</em></div>
        <div className="streak-pill">🔥 {streak}-day streak</div>
      </div>
      
      <div className="tab-content">
        {tab === 'home' && (
          <div className="tab-pane active">
            <div className="nudge-card fade">
              <div className="nudge-tag">⏰ Today&apos;s nudge</div>
              <div className="nudge-msg">You haven&apos;t posted today. Don&apos;t break the streak.</div>
              <div className="nudge-sub">Your best window closes in <strong>2 hours</strong>. That&apos;s plenty of time.</div>
              <button className="btn-as" onClick={() => showTab('ideas')}>Get ideas →</button>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-val">{streak}</div><div className="stat-lbl">Day streak</div><div className="stat-up">Personal best 🎉</div></div>
              <div className="stat-card"><div className="stat-val">{store.posts.filter(p => p.status === 'posted').length}</div><div className="stat-lbl">Posts this month</div><div className="stat-up">↑ 6 from last month</div></div>
              <div className="stat-card"><div className="stat-val">{scheduledPosts.length}</div><div className="stat-lbl">Scheduled</div></div>
              <div className="stat-card"><div className="stat-val">+218</div><div className="stat-lbl">New followers</div><div className="stat-up">↑ 12% this week</div></div>
            </div>
            <div className="sec-head" style={{ marginTop: '0.2rem' }}>Upcoming</div>
            {store.posts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '2rem', fontSize: '14px' }}>No scheduled posts yet.</div>
            ) : (
              store.posts.map(p => (
                <div key={p.id} className={`post-card ${p.status === 'posted' ? 'done' : ''}`}>
                  <div className="post-time">{p.scheduledAt ? new Date(p.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(', ', '\n') : '—'}</div>
                  <div className="post-body">
                    <div className="post-title">{p.title}</div>
                    <div className="post-meta">
                      <span className={`pbadge ${platMeta[p.platform]?.cls || ''}`}>{platMeta[p.platform]?.icon} {p.platform}</span>
                      <span className={`sdot ${p.status === 'posted' ? 'sdot-d' : 'sdot-s'}`}></span>
                      <span>{p.status === 'posted' ? 'Published' : 'Scheduled'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {tab === 'ideas' && (
          <div className="tab-pane active">
            <div className="filters">
              {['all', 'carousel', 'thread', 'video', 'story'].map(f => (
                <button key={f} className={`filter-btn ${ideaFilter === f ? 'active' : ''}`} onClick={() => setIdeaFilter(f)}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
            <button className="gen-btn" id="gen-btn" onClick={generateIdeas} disabled={isGenerating}>
              <span>✦</span> {isGenerating ? 'Generating...' : 'Generate fresh ideas for me'}
            </button>
            {isGenerating && (
              <div className="loading"><div className="ldot"></div><div className="ldot"></div><div className="ldot"></div></div>
            )}
            {store.ideas.length === 0 && !isGenerating && (
              <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '2rem', fontSize: '14px' }}>Tap generate to get AI-powered ideas.</div>
            )}
            {(ideaFilter === 'all' ? store.ideas : store.ideas.filter(i => i.type.toLowerCase().includes(ideaFilter))).map((idea, i) => (
              <div key={idea.id} className="idea-card fade" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="idea-head">
                  <span className={`pbadge ${platMeta[idea.platform]?.cls || ''}`}>{platMeta[idea.platform]?.icon} {idea.platform}</span>
                  <span className="idea-type">{idea.type}</span>
                </div>
                <div className="idea-text">{idea.content}</div>
                <div className="idea-foot">
                  <div></div>
                  <button className="btn-use" onClick={() => useIdea(idea)}>Use this idea →</button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {tab === 'compose' && (
          <div className="tab-pane active">
            <div className="sec-head">Platform</div>
            <div className="plat-select">
              {platforms.map(p => (
                <button key={p} className={`ps-btn ${store.composePlatform === platMeta[p]?.key ? 'on' : ''}`} onClick={() => store.setComposePlatform(platMeta[p]?.key || p)}>{platMeta[p]?.icon} {p}</button>
              ))}
            </div>
            <div className="sec-head">Your post</div>
            <div className="compose-box">
              <textarea 
                value={store.composeContent} 
                onChange={(e) => store.setComposeContent(e.target.value)}
                placeholder="What's on your mind? Even a rough thought works — AI can polish it..." 
              />
              <div className="compose-bar">
                <div className={`char-c ${store.composeContent.length > (platMeta[store.composePlatform]?.limit || 280) * 0.9 ? 'warn' : ''}`}>{store.composeContent.length} / {platMeta[store.composePlatform]?.limit || 280}</div>
              </div>
            </div>
            <div className="compose-ctas">
              <button className="btn-ghost" onClick={polishPost}>✦ Polish with AI</button>
              <button className="btn-ghost" onClick={addHashtags}>＃ Suggest hashtags</button>
            </div>
            <div className="sec-head">Schedule</div>
            <div className="sched-panel">
              <div className="sched-lbl">Post time</div>
              <select className="time-sel">
                <option>Today, 5:00 PM</option>
                <option>Today, 7:00 PM</option>
                <option>Tomorrow, 9:00 AM</option>
                <option>Tomorrow, 12:00 PM</option>
                <option>Friday, 5:00 PM</option>
              </select>
            </div>
            <button className="btn-p" onClick={schedulePost} style={{ marginTop: '0.3rem' }}>Schedule post</button>
          </div>
        )}
        
        {tab === 'settings' && (
          <div className="tab-pane active">
<div className="settings-sec">
              <div className="settings-h">AI Provider</div>
              <div className="api-provider-list">
                {API_PROVIDERS.map(p => (
                  <div 
                    key={p.id} 
                    className={`api-provider-row ${store.apiProvider === p.id ? 'sel' : ''}`}
                    onClick={() => store.setApiProvider(p.id)}
                  >
                    <div className="api-provider-info">
                      <div className="api-provider-name">{p.name}</div>
                      <div className="api-provider-model">{p.model}</div>
                    </div>
                    <div className={`free-tag ${p.free ? 'free' : ''}`}>{p.free ? 'FREE' : 'PAID'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="settings-sec">
              <div className="settings-h">API Key (BYOK)</div>
              <div className="api-wrap">
                <input 
                  className="api-input" 
                  type="password" 
                  placeholder={store.apiProvider === 'groq' ? 'gsk_...' : store.apiProvider === 'deepseek' ? 'sk-' : 'sk-...'} 
                  value={apiKeyInput}
                  onChange={(e) => { setApiKeyInput(e.target.value); store.setApiKey(e.target.value); }}
                  autoComplete="off"
                />
              </div>
              <div className="api-note">
                {store.apiProvider === 'anthropic' && 'Get free key at console.anthropic.com'}
                {store.apiProvider === 'groq' && 'Get free key at console.groq.com'}
                {store.apiProvider === 'deepseek' && 'Get free key at platform.deepseek.com'}
                {store.apiProvider === 'openai' && 'Get key at platform.openai.com'}
              </div>
            </div>
            <div className="settings-sec">
              <div className="settings-h">Support the project</div>
              <a href="https://ko-fi.com/nudge" target="_blank" rel="noopener noreferrer" className="kofi-btn">
                <i className="fa-solid fa-mug-hot"></i> Buy me a coffee
              </a>
            </div>
            <div className="settings-sec">
              <div className="settings-h">Privacy & policy</div>
              <div className="policy-box">
                <div className="policy-row"><div className="p-icon">✅</div><div className="p-text"><strong>OAuth 2.0 only.</strong> We never see or store your password.</div></div>
                <div className="policy-row"><div className="p-icon">✅</div><div className="p-text"><strong>Publish-only scope.</strong> We only request permission to post.</div></div>
                <div className="policy-row"><div className="p-icon">✅</div><div className="p-text"><strong>Your data stays yours.</strong> We don&apos;t sell or share your content.</div></div>
                <div className="policy-row"><div className="p-icon">🚫</div><div className="p-text"><strong>We never read your DMs</strong> or access your followers list.</div></div>
              </div>
            </div>
            <div className="settings-sec">
              <div className="settings-h">Claude API key (BYOK)</div>
              <div className="api-wrap">
                <input 
                  className="api-input" 
                  type="password" 
                  placeholder="sk-ant-..." 
                  value={apiKeyInput}
                  onChange={(e) => { setApiKeyInput(e.target.value); store.setApiKey(e.target.value); }}
                  autoComplete="off"
                />
              </div>
              <div className="api-note">Bring your own key. Get one free at console.anthropic.com</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bottom-nav">
        <div className={`nav-item ${tab === 'home' ? 'active' : ''}`} onClick={() => showTab('home')}>
          <i className={`fa-solid fa-house${tab === 'home' ? '' : '-user'}`}></i><div className="nav-lbl">Home</div>
        </div>
        <div className={`nav-item ${tab === 'ideas' ? 'active' : ''}`} onClick={() => showTab('ideas')}>
          <i className="fa-regular fa-lightbulb"></i><div className="nav-lbl">Ideas</div>
        </div>
        <div className={`nav-item ${tab === 'compose' ? 'active' : ''}`} onClick={() => showTab('compose')}>
          <i className="fa-regular fa-pen-to-square"></i><div className="nav-lbl">Compose</div>
        </div>
        <div className={`nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => showTab('settings')}>
          <i className="fa-solid fa-gear"></i><div className="nav-lbl">Settings</div>
        </div>
      </div>
    </div>
  );
}