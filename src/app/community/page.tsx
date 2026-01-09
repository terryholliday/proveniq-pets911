'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Users, MessageCircle, Heart, Calendar, Plus, Search, ArrowLeftRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ForumCategory = 'LOST_PET_ADVICE' | 'SIGHTING_TIPS' | 'PREVENTION' | 'GENERAL';

type ForumReply = {
  id: string;
  body: string;
  created_at: string;
};

type ForumPost = {
  id: string;
  category: ForumCategory;
  title: string;
  body: string;
  created_at: string;
  replies: ForumReply[];
};

const STORAGE_KEY = 'proveniq_forums_v1';

function makeId() {
  const cryptoAny = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
  if (cryptoAny?.randomUUID) return cryptoAny.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const CATEGORY_LABELS: Record<ForumCategory, string> = {
  LOST_PET_ADVICE: 'Lost Pet Advice',
  SIGHTING_TIPS: 'Sighting Tips',
  PREVENTION: 'Prevention',
  GENERAL: 'General',
};

export default function CommunitySupportPage() {
  const [activeTab, setActiveTab] = useState<'forums' | 'stories' | 'events'>('forums');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [activePostId, setActivePostId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState<ForumCategory>('LOST_PET_ADVICE');
  const [createError, setCreateError] = useState<string | null>(null);

  const [replyBody, setReplyBody] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setPosts([]);
        return;
      }
      const parsed = JSON.parse(raw) as ForumPost[];
      if (Array.isArray(parsed)) setPosts(parsed);
    } catch {
      setPosts([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch {
      // ignore
    }
  }, [posts]);

  const activePost = useMemo(() => posts.find((p) => p.id === activePostId) || null, [posts, activePostId]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => (selectedCategory === 'ALL' ? true : p.category === selectedCategory))
      .filter((p) => {
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          p.replies.some((r) => r.body.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [posts, selectedCategory, query]);

  const createPost = () => {
    setCreateError(null);
    const title = newTitle.trim();
    const body = newBody.trim();
    if (!title || title.length < 6) {
      setCreateError('Title must be at least 6 characters.');
      return;
    }
    if (!body || body.length < 12) {
      setCreateError('Post must be at least 12 characters.');
      return;
    }

    const post: ForumPost = {
      id: makeId(),
      category: newCategory,
      title,
      body,
      created_at: new Date().toISOString(),
      replies: [],
    };

    setPosts((prev) => [post, ...prev]);
    setActivePostId(post.id);
    setNewTitle('');
    setNewBody('');
    setNewCategory('LOST_PET_ADVICE');
  };

  const addReply = () => {
    setReplyError(null);
    if (!activePost) return;
    const body = replyBody.trim();
    if (!body || body.length < 3) {
      setReplyError('Reply must be at least 3 characters.');
      return;
    }
    const reply: ForumReply = { id: makeId(), body, created_at: new Date().toISOString() };
    setPosts((prev) =>
      prev.map((p) => (p.id === activePost.id ? { ...p, replies: [...p.replies, reply] } : p))
    );
    setReplyBody('');
  };

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              <span className="font-bold text-white">Community Support</span>
            </div>
            <Link
              href="/resources"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              ← Back to Resources
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-white">Community</h1>
              <p className="text-slate-400">
                Ask questions, share tips, and learn from others. Forums are available now; other modules are coming soon.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant={activeTab === 'forums' ? 'default' : 'outline'}
                className={activeTab === 'forums' ? '' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}
                onClick={() => setActiveTab('forums')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Discussion Forums
              </Button>
              <Button
                variant={activeTab === 'stories' ? 'default' : 'outline'}
                className={activeTab === 'stories' ? '' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}
                onClick={() => setActiveTab('stories')}
              >
                <Heart className="w-4 h-4 mr-2" />
                Success Stories
              </Button>
              <Button
                variant={activeTab === 'events' ? 'default' : 'outline'}
                className={activeTab === 'events' ? '' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}
                onClick={() => setActiveTab('events')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Local Events
              </Button>
            </div>
          </div>

          {/* Discussion Forums */}
          {activeTab === 'forums' && (
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-400" />
                    Start a Discussion
                  </h2>

                  {createError && (
                    <Alert className="mb-3 border-amber-500 bg-amber-500/10">
                      <AlertDescription className="text-amber-200">{createError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as ForumCategory)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />

                    <textarea
                      value={newBody}
                      onChange={(e) => setNewBody(e.target.value)}
                      placeholder="Share details (what happened, what you've tried, what you need help with)"
                      rows={5}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                    />

                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={createPost}>
                      Post
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-2">Use the right tools</h3>
                  <div className="space-y-2 text-slate-300 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                      If your pet is missing, file a report first.
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                      If you spot a pet, report a sighting.
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <Link href="/missing/report" className="block">
                      <Button className="bg-blue-600 hover:bg-blue-700 w-full">Report Missing Pet</Button>
                    </Link>
                    <Link href="/sighting/report" className="block">
                      <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 w-full">
                        Report Sighting
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-4">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search discussions"
                        className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as ForumCategory | 'ALL')}
                      className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="ALL">All categories</option>
                      {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      className="border-slate-600 text-slate-200 hover:bg-slate-800"
                      onClick={() => {
                        setActivePostId(null);
                        setReplyBody('');
                        setReplyError(null);
                      }}
                      disabled={!activePostId}
                    >
                      <ArrowLeftRight className="w-4 h-4 mr-2" />
                      List
                    </Button>
                  </div>
                </div>

                {!activePost ? (
                  <div className="space-y-3">
                    {filteredPosts.length === 0 ? (
                      <Alert className="border-slate-600 bg-slate-800/50">
                        <AlertDescription className="text-slate-300">
                          No discussions yet. Start the first one.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      filteredPosts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setActivePostId(p.id)}
                          className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-4 hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs text-slate-400 mb-1">{CATEGORY_LABELS[p.category]}</div>
                              <div className="text-white font-semibold truncate">{p.title}</div>
                              <div className="text-slate-400 text-sm line-clamp-2 mt-1">{p.body}</div>
                            </div>
                            <div className="text-slate-300 text-sm whitespace-nowrap">{p.replies.length} replies</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <div className="text-xs text-slate-400">{CATEGORY_LABELS[activePost.category]}</div>
                    <h2 className="text-xl font-bold text-white mt-1">{activePost.title}</h2>
                    <p className="text-slate-300 mt-3 whitespace-pre-wrap">{activePost.body}</p>

                    <div className="mt-6">
                      <h3 className="text-white font-semibold mb-3">Replies</h3>
                      {activePost.replies.length === 0 ? (
                        <p className="text-slate-400">No replies yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {activePost.replies.map((r) => (
                            <div key={r.id} className="bg-slate-900/40 border border-slate-700 rounded-lg p-3">
                              <div className="text-slate-200 text-sm whitespace-pre-wrap">{r.body}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4">
                        {replyError && (
                          <Alert className="mb-3 border-amber-500 bg-amber-500/10">
                            <AlertDescription className="text-amber-200">{replyError}</AlertDescription>
                          </Alert>
                        )}
                        <textarea
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          placeholder="Write a reply"
                          rows={4}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={addReply}>
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Stories */}
          {activeTab === 'stories' && (
            <div className="space-y-6">
              <Alert className="border-purple-500 bg-purple-500/10">
                <AlertDescription className="text-purple-200">
                  <strong>Success Stories (coming soon).</strong> This will highlight verified reunifications and rescues.
                </AlertDescription>
              </Alert>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-white font-semibold mb-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    Verified reunions
                  </div>
                  <p className="text-slate-400 text-sm">
                    We’ll publish stories only after verification to reduce scams and protect privacy.
                  </p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-white font-semibold mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Impact ledger alignment
                  </div>
                  <p className="text-slate-400 text-sm">
                    Stories will be grounded in outcomes (reunified, treated, fostered) with court-safe provenance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Local Events */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <Alert className="border-purple-500 bg-purple-500/10">
                <AlertDescription className="text-purple-200">
                  <strong>Local Events (coming soon).</strong> Adoption days, microchip clinics, volunteer trainings.
                </AlertDescription>
              </Alert>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-white font-semibold mb-2">
                    <Calendar className="w-5 h-5 text-orange-400" />
                    County-based discovery
                  </div>
                  <p className="text-slate-400 text-sm">
                    Events will be filterable by county and focused on reunification, prevention, and response readiness.
                  </p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-white font-semibold mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Verified hosts
                  </div>
                  <p className="text-slate-400 text-sm">
                    We’ll only list vetted shelters/clinics/partners to avoid fraud and misinformation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Back to Resources */}
          <div className="mt-10 text-center">
            <Link href="/resources" className="inline-block">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                ← Back to All Resources
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
