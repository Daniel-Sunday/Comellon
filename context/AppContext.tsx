import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface Reply {
  id: string;
  author: string;
  avatar: string;
  avatarColor: string;
  text: string;
  timestamp: string;
  hasResonated?: boolean;
  author_id?: string;
}

export interface Entry {
  id: string;
  author: string;
  avatar: string;
  avatarColor: string;
  text: string;
  timestamp: string;
  replies: Reply[];
  hasResonated?: boolean;
  tags?: string[];
  category?: string;
  isPrivate?: boolean;
  author_id?: string;
  embedding?: number[] | null;
}

export interface MatchResult {
  entry: Entry;
  score: number; // 0 to 100
  type: 'Aligned' | 'Complementary' | 'Challenging';
  reason: string;
}

interface AppContextType {
  entries: Entry[];
  addEntry: (text: string, author?: string, isPrivate?: boolean) => Promise<void>;
  addReply: (entryId: string, text: string, author?: string) => Promise<void>;
  draftText: string;
  setDraftText: (val: string) => void;
  toggleResonance: (entryId: string) => Promise<void>;
  toggleReplyResonance: (entryId: string, replyId: string) => Promise<void>;
  replyDrafts: Record<string, string>;
  setReplyDraft: (entryId: string, text: string) => void;
  getMatches: (text: string) => MatchResult[];
  shareEntryPublicly: (entryId: string) => Promise<void>;
  session: any;
  profile: any;
  authLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: { display_name: string; username: string; bio: string }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to format timestamps to match "Yesterday", "2h ago", "Just now"
const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return 'Yesterday';
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Client-side cosine similarity calculation for 768-dimensional thought vectors
function cosineSimilarity(A: number[], B: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const INITIAL_ENTRIES: Entry[] = [
  {
    id: '1',
    author: 'Daniel',
    avatar: 'D',
    avatarColor: '#4A6FA5',
    text: 'Thinking about how we build software today. We spend 90% of our time configuring tools and only 10% actually thinking about the core logic. There has to be a simpler way.',
    timestamp: '2h ago',
    replies: [
      {
        id: '1-1',
        author: 'kelvin',
        avatar: 'K',
        avatarColor: '#58B19F',
        text: 'So true. The modern stack is a tower of cards.',
        timestamp: '1h ago',
      },
      {
        id: '1-2',
        author: 'Elon Musk',
        avatar: 'E',
        avatarColor: '#D6A2E8',
        text: "Let's delete half of the stack.",
        timestamp: '45m ago',
      }
    ],
    hasResonated: false,
    tags: ['software', 'complexity', 'tools', 'logic'],
    category: 'Software Complexity'
  },
  {
    id: '2',
    author: 'kelvin',
    avatar: 'K',
    avatarColor: '#58B19F',
    text: "A quiet notebook. That's what the internet used to feel like. Before feeds, algorithms, and notification badges ruined it. Just people writing down thoughts.",
    timestamp: '7:13 PM',
    replies: [],
    hasResonated: false,
    tags: ['internet', 'algorithms', 'notebook', 'thoughts'],
    category: 'Social Media Psychology'
  },
  {
    id: '3',
    author: 'Elon Musk',
    avatar: 'E',
    avatarColor: '#D6A2E8',
    text: "Comellon is basically digital notebook therapy. Let's see if anyone else thinks like this.",
    timestamp: 'Yesterday',
    replies: [
      {
        id: '3-1',
        author: 'Daniel',
        avatar: 'D',
        avatarColor: '#4A6FA5',
        text: 'Exactly. No likes, no numbers. Just raw thoughts.',
        timestamp: 'Yesterday',
      }
    ],
    hasResonated: true,
    tags: ['notebook', 'therapy', 'thoughts', 'social'],
    category: 'Digital Notebooks'
  },
  {
    id: '4',
    author: 'Marcus',
    avatar: 'M',
    avatarColor: '#E28743',
    text: "Bootstrapping is underrated. When you raise VC money, you aren't building a product anymore — you're building a financial asset for someone else. Clean alignment comes from customer revenue.",
    timestamp: 'Yesterday',
    replies: [],
    hasResonated: false,
    tags: ['startup', 'bootstrapping', 'funding', 'vc'],
    category: 'Startup Strategy'
  },
  {
    id: '5',
    author: 'David',
    avatar: 'D',
    avatarColor: '#2C3E50',
    text: 'Everyone glorifies bootstrapping, but speed to market is the only moat that matters in crowded industries. Venture scale is what lets you build deep tech that takes 5 years of R&D before a single dollar of revenue.',
    timestamp: '2 days ago',
    replies: [],
    hasResonated: false,
    tags: ['startup', 'vc', 'funding', 'speed'],
    category: 'Startup Strategy'
  },
  {
    id: '6',
    author: 'Sophia',
    avatar: 'S',
    avatarColor: '#9B59B6',
    text: "Language models don't think, they recall patterns. We are optimizing for mimicry rather than actual logical reasoning. The first true AGI will probably look nothing like a transformer.",
    timestamp: '2 days ago',
    replies: [],
    hasResonated: false,
    tags: ['ai', 'agi', 'reasoning', 'transformers', 'software'],
    category: 'Artificial Intelligence'
  },
  {
    id: '7',
    author: 'Grace',
    avatar: 'G',
    avatarColor: '#27AE60',
    text: 'Who cares if LLMs just predict the next token? If next-token prediction leads to emergent logical reasoning, then prediction and thinking are functionally identical.',
    timestamp: '3 days ago',
    replies: [],
    hasResonated: false,
    tags: ['ai', 'transformers', 'logic', 'reasoning'],
    category: 'Artificial Intelligence'
  },
  {
    id: '8',
    author: 'Liam',
    avatar: 'L',
    avatarColor: '#16A085',
    text: 'Entropy is the only physical quantity that requires a direction of time. In a closed system, complexity always increases. Writing thoughts down is basically an act of negative entropy.',
    timestamp: '4 days ago',
    replies: [],
    hasResonated: false,
    tags: ['physics', 'entropy', 'time', 'complexity'],
    category: 'Physics & Philosophy'
  },
  {
    id: '9',
    author: 'Aria',
    avatar: 'A',
    avatarColor: '#F39C12',
    text: "Minimalist product design isn't about removing features. It is about reducing the cognitive load required to access utility. If the user has to plan how to use your tool, you failed.",
    timestamp: '5 days ago',
    replies: [],
    hasResonated: false,
    tags: ['design', 'ux', 'minimalism', 'product'],
    category: 'Product Design'
  }
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<Entry[]>(INITIAL_ENTRIES);
  const [draftText, setDraftText] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Supabase Auth and User Profile State
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Draft embedding for real-time matches preview
  const [draftEmbedding, setDraftEmbedding] = useState<number[] | null>(null);

  // Initial Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch full entries when session or configuration changes
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchEntriesFromSupabase();
    }
  }, [session]);

  // Debounced generator to fetch draft vector embedding in background for live matches
  useEffect(() => {
    if (!isSupabaseConfigured || !draftText.trim() || draftText.trim().length < 5) {
      setDraftEmbedding(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-embedding', {
          body: { text: draftText.trim() },
        });
        if (error) throw error;
        if (data?.embedding) {
          setDraftEmbedding(data.embedding);
        }
      } catch (err) {
        console.error('Error generating draft embedding:', err);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [draftText]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchEntriesFromSupabase = async () => {
    try {
      // 1. Fetch entries joined with profiles
      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select(`
          id,
          text,
          is_private,
          category,
          tags,
          embedding,
          created_at,
          author_id,
          profiles (
            display_name,
            username,
            avatar_color
          )
        `)
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      // 2. Fetch replies joined with profiles
      const { data: repliesData, error: repliesError } = await supabase
        .from('replies')
        .select(`
          id,
          entry_id,
          text,
          created_at,
          author_id,
          profiles (
            display_name,
            username,
            avatar_color
          )
        `)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // 3. Fetch user's resonances
      let resonatedIds: string[] = [];
      let resonatedReplyIds: string[] = [];
      if (session) {
        const { data: resData } = await supabase
          .from('resonances')
          .select('entry_id')
          .eq('user_id', session.user.id);
        if (resData) resonatedIds = resData.map(r => r.entry_id);

        const { data: replyResData } = await supabase
          .from('reply_resonances')
          .select('reply_id')
          .eq('user_id', session.user.id);
        if (replyResData) resonatedReplyIds = replyResData.map(r => r.reply_id);
      }

      // 4. Map DB models to React Frontend models
      const mapped: Entry[] = (entriesData || []).map((item: any) => {
        const authorProfile = item.profiles;
        const entryReplies = (repliesData || [])
          .filter((r: any) => r.entry_id === item.id)
          .map((r: any) => ({
            id: r.id,
            author: r.profiles?.display_name || 'Anonymous',
            avatar: (r.profiles?.display_name || 'A').charAt(0).toUpperCase(),
            avatarColor: r.profiles?.avatar_color || '#7f8c8d',
            text: r.text,
            timestamp: formatTimestamp(r.created_at),
            hasResonated: resonatedReplyIds.includes(r.id),
            author_id: r.author_id,
          }));

        // pgvector returns vector data as a string (e.g. "[0.1,-0.2...]") or an array
        let embeddingVector: number[] | null = null;
        if (item.embedding) {
          embeddingVector = typeof item.embedding === 'string' 
            ? JSON.parse(item.embedding) 
            : item.embedding;
        }

        return {
          id: item.id,
          author: authorProfile?.display_name || 'Anonymous',
          avatar: (authorProfile?.display_name || 'A').charAt(0).toUpperCase(),
          avatarColor: authorProfile?.avatar_color || '#7f8c8d',
          text: item.text,
          timestamp: formatTimestamp(item.created_at),
          replies: entryReplies,
          hasResonated: resonatedIds.includes(item.id),
          tags: item.tags || [],
          category: item.category || 'General',
          isPrivate: item.is_private,
          author_id: item.author_id,
          embedding: embeddingVector,
        };
      });

      setEntries(mapped);
    } catch (err) {
      console.error('Failed to sync entries from Supabase:', err);
    }
  };

  const setReplyDraft = (entryId: string, text: string) => {
    setReplyDrafts(prev => ({
      ...prev,
      [entryId]: text
    }));
  };

  // Safe fallback writer for local sandbox mode
  const pushLocalEntry = (text: string, isPrivate: boolean) => {
    const newEntry: Entry = {
      id: Date.now().toString(),
      author: 'You',
      avatar: 'Y',
      avatarColor: '#F0706A',
      text,
      timestamp: 'Just now',
      replies: [],
      hasResonated: false,
      isPrivate
    };
    setEntries([newEntry, ...entries]);
  };

  const addEntry = async (text: string, authorName: string = 'You', isPrivate: boolean = false) => {
    if (isSupabaseConfigured && session) {
      try {
        // Fetch thought embedding from secure Supabase Edge Function (routing to Google Gemini API)
        let embedding: number[] | null = null;
        try {
          const { data, error } = await supabase.functions.invoke('get-embedding', {
            body: { text: text.trim() },
          });
          if (!error && data?.embedding) {
            embedding = data.embedding;
          }
        } catch (e) {
          console.warn('Embedding generation skipped/failed, inserting entry without vector:', e);
        }

        // Basic category and tags heuristic from content
        const words = text.toLowerCase().split(/\s+/);
        const tags = Array.from(new Set(words.filter(w => w.length > 4 && !STOP_WORDS.has(w)).slice(0, 4)));
        let category = 'General';
        if (words.includes('vc') || words.includes('funding') || words.includes('bootstrapping')) {
          category = 'Startup Strategy';
        } else if (words.includes('ai') || words.includes('agi') || words.includes('model')) {
          category = 'Artificial Intelligence';
        } else if (words.includes('notebook') || words.includes('writing') || words.includes('thoughts')) {
          category = 'Digital Notebooks';
        }

        const { error } = await supabase.from('entries').insert({
          author_id: session.user.id,
          text: text.trim(),
          is_private: isPrivate,
          embedding,
          category,
          tags,
        });

        if (error) throw error;
        await fetchEntriesFromSupabase();
      } catch (err) {
        console.error('Error adding entry to Supabase:', err);
        pushLocalEntry(text, isPrivate);
      }
    } else {
      pushLocalEntry(text, isPrivate);
    }
  };

  const addReply = async (entryId: string, text: string, authorName: string = 'You') => {
    if (isSupabaseConfigured && session) {
      try {
        const { error } = await supabase.from('replies').insert({
          entry_id: entryId,
          author_id: session.user.id,
          text: text.trim(),
        });
        if (error) throw error;
        await fetchEntriesFromSupabase();
      } catch (err) {
        console.error('Error adding reply to Supabase:', err);
      }
    } else {
      // Local fallback
      setEntries(prevEntries =>
        prevEntries.map(entry => {
          if (entry.id === entryId) {
            const newReply: Reply = {
              id: Date.now().toString(),
              author: 'You',
              avatar: 'Y',
              avatarColor: '#F0706A',
              text,
              timestamp: 'Just now'
            };
            return {
              ...entry,
              replies: [...entry.replies, newReply]
            };
          }
          return entry;
        })
      );
    }
    setReplyDraft(entryId, '');
  };

  const toggleResonance = async (entryId: string) => {
    if (isSupabaseConfigured && session) {
      try {
        const entry = entries.find(e => e.id === entryId);
        if (!entry) return;

        if (entry.hasResonated) {
          // Remove resonance row
          const { error } = await supabase
            .from('resonances')
            .delete()
            .eq('user_id', session.user.id)
            .eq('entry_id', entryId);
          if (error) throw error;
        } else {
          // Add resonance row
          const { error } = await supabase
            .from('resonances')
            .insert({
              user_id: session.user.id,
              entry_id: entryId,
            });
          if (error) throw error;
        }
        await fetchEntriesFromSupabase();
      } catch (err) {
        console.error('Failed to toggle resonance in Supabase:', err);
      }
    } else {
      // Local toggle
      setEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === entryId
            ? { ...entry, hasResonated: !entry.hasResonated }
            : entry
        )
      );
    }
  };

  const toggleReplyResonance = async (entryId: string, replyId: string) => {
    if (isSupabaseConfigured && session) {
      try {
        const entry = entries.find(e => e.id === entryId);
        const reply = entry?.replies.find(r => r.id === replyId);
        if (!reply) return;

        if (reply.hasResonated) {
          const { error } = await supabase
            .from('reply_resonances')
            .delete()
            .eq('user_id', session.user.id)
            .eq('reply_id', replyId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('reply_resonances')
            .insert({
              user_id: session.user.id,
              reply_id: replyId,
            });
          if (error) throw error;
        }
        await fetchEntriesFromSupabase();
      } catch (err) {
        console.error('Failed to toggle reply resonance in Supabase:', err);
      }
    } else {
      // Local toggle
      setEntries(prevEntries =>
        prevEntries.map(entry => {
          if (entry.id === entryId) {
            return {
              ...entry,
              replies: entry.replies.map(reply =>
                reply.id === replyId
                  ? { ...reply, hasResonated: !reply.hasResonated }
                  : reply
              )
            };
          }
          return entry;
        })
      );
    }
  };

  const shareEntryPublicly = async (entryId: string) => {
    if (isSupabaseConfigured && session) {
      try {
        const { error } = await supabase
          .from('entries')
          .update({ is_private: false })
          .eq('id', entryId);
        if (error) throw error;
        await fetchEntriesFromSupabase();
      } catch (err) {
        console.error('Error sharing entry publicly in Supabase:', err);
      }
    } else {
      // Local toggle
      setEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === entryId
            ? { ...entry, isPrivate: false, timestamp: 'Just now' }
            : entry
        )
      );
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: { display_name: string; username: string; bio: string }) => {
    if (isSupabaseConfigured && session) {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);
      if (error) throw error;
      setProfile((prev: any) => prev ? { ...prev, ...updates } : null);
      await fetchEntriesFromSupabase();
    } else {
      setProfile((prev: any) => ({
        id: 'sandbox-user',
        avatar_color: '#F0706A',
        created_at: new Date().toISOString(),
        ...updates
      }));
    }
  };

  const getMatches = (text: string): MatchResult[] => {
    if (!text || text.trim().length < 5) return [];

    // If Supabase is configured and we have embeddings, calculate similarity in Javascript
    if (isSupabaseConfigured && entries.length > 0) {
      let activeEmbedding: number[] | null = null;
      
      const matchingEntry = entries.find(e => e.text.trim() === text.trim());
      if (matchingEntry && matchingEntry.embedding) {
        activeEmbedding = matchingEntry.embedding;
      } else if (text.trim() === draftText.trim()) {
        activeEmbedding = draftEmbedding;
      }

      if (activeEmbedding) {
        const results = entries
          .filter(e => e.text.trim() !== text.trim() && !e.isPrivate && e.embedding)
          .map(entry => {
            const similarity = cosineSimilarity(activeEmbedding!, entry.embedding!);
            const score = Math.min(Math.round(similarity * 100), 100);

            const entryCategory = entry.category || 'General';
            const lowerCategory = entryCategory.toLowerCase();

            let type: 'Aligned' | 'Complementary' | 'Challenging' = 'Complementary';
            let reason = `Brings neighboring ideas related to ${lowerCategory}`;
            
            if (score > 80) {
              type = 'Aligned';
              reason = `Highly aligned perspective on ${entryCategory}`;
            } else if (score > 40) {
              // Check if opposing keywords exist to classify as challenging
              const lowerA = text.toLowerCase();
              const lowerB = entry.text.toLowerCase();
              const opposes = (lowerA.includes('vc') && lowerB.includes('bootstrapping')) ||
                              (lowerA.includes('bootstrapping') && lowerB.includes('vc')) ||
                              (lowerA.includes('emergent') && lowerB.includes('mimicry')) ||
                              (lowerA.includes('mimicry') && lowerB.includes('emergent'));
              
              if (opposes) {
                type = 'Challenging';
                reason = `Contrasting take on ${entryCategory}`;
              } else {
                type = 'Complementary';
                reason = `Adds neighboring concepts on ${entryCategory}`;
              }
            } else {
              type = 'Complementary';
              reason = `Examines adjacent concepts in ${lowerCategory}`;
            }

            return {
              entry,
              score,
              type,
              reason
            };
          })
          .filter(m => m.score > 5)
          .sort((a, b) => b.score - a.score);

        return results;
      }
    }

    // Fallback to Jaccard keyword matching in Sandbox mode
    return calculateMatches(text, entries);
  };

  return (
    <AppContext.Provider value={{
      entries,
      addEntry,
      addReply,
      draftText,
      setDraftText,
      toggleResonance,
      toggleReplyResonance,
      replyDrafts,
      setReplyDraft,
      getMatches,
      shareEntryPublicly,
      session,
      profile,
      authLoading,
      signOut,
      updateProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// --- SIMULATED SEMANTIC MATCHING UTILITIES ---

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'him', 'his', 'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of',
  'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on',
  'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'about'
]);

function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/);
  return new Set(words.filter(w => w.length > 2 && !STOP_WORDS.has(w)));
}

const calculateMatches = (inputText: string, entries: Entry[]): MatchResult[] => {
  if (!inputText || inputText.trim().length < 5) return [];
  
  const inputKeywords = extractKeywords(inputText);
  
  const results = entries.map(entry => {
    const entryKeywords = extractKeywords(entry.text);
    
    // 1. Calculate Jaccard similarity between word tokens
    const intersection = new Set([...inputKeywords].filter(x => entryKeywords.has(x)));
    const union = new Set([...inputKeywords, ...entryKeywords]);
    const wordScore = union.size > 0 ? (intersection.size / union.size) : 0;
    
    // 2. Category & Tag similarity
    const tagMatch = entry.tags?.some(tag => inputKeywords.has(tag.toLowerCase())) ? 0.3 : 0;
    
    const baseScore = wordScore * 0.7 + tagMatch;
    let score = Math.min(Math.round(baseScore * 100), 100);
    
    // Determine relationship types based on categories and opposing keyword triggers
    let type: 'Aligned' | 'Complementary' | 'Challenging' = 'Complementary';
    let reason = '';
    
    const isStartup = entry.category === 'Startup Strategy' || entry.tags?.includes('startup');
    const isAI = entry.category === 'Artificial Intelligence' || entry.tags?.includes('ai');
    const isNotebook = entry.category === 'Digital Notebooks' || entry.tags?.includes('notebook');
    
    // Simulate smart contrasting takes
    if (isStartup && (inputText.toLowerCase().includes('vc') || inputText.toLowerCase().includes('funding') || inputText.toLowerCase().includes('bootstrapping'))) {
      if (entry.text.toLowerCase().includes('bootstrapping') && inputText.toLowerCase().includes('vc')) {
        type = 'Challenging';
        score = 82; // High relevance but contrasting stance
        reason = 'Contrasting take on Startup Funding (Bootstrapped vs. Venture-backed)';
      } else if (entry.text.toLowerCase().includes('vc') && inputText.toLowerCase().includes('bootstrapping')) {
        type = 'Challenging';
        score = 82;
        reason = 'Contrasting take on Startup Funding (Venture-backed vs. Bootstrapped)';
      } else {
        type = 'Aligned';
        score = 75;
        reason = 'Shared perspective on Startup Growth dynamics';
      }
    } else if (isAI && (inputText.toLowerCase().includes('model') || inputText.toLowerCase().includes('agi') || inputText.toLowerCase().includes('llm') || inputText.toLowerCase().includes('transformer'))) {
      if (entry.text.toLowerCase().includes('mimicry') && (inputText.toLowerCase().includes('emergent') || inputText.toLowerCase().includes('reasoning'))) {
        type = 'Challenging';
        score = 88;
        reason = 'Alternative view on LLM capabilities (Mimicry vs. Emergent Thinking)';
      } else if (entry.text.toLowerCase().includes('emergent') && inputText.toLowerCase().includes('mimicry')) {
        type = 'Challenging';
        score = 88;
        reason = 'Alternative view on LLM capabilities (Emergent Thinking vs. Mimicry)';
      } else {
        type = 'Aligned';
        score = 78;
        reason = 'Shared thoughts on the limits and future of Artificial Intelligence';
      }
    } else if (isNotebook && (inputText.toLowerCase().includes('notebook') || inputText.toLowerCase().includes('quiet') || inputText.toLowerCase().includes('thoughts'))) {
      type = 'Aligned';
      score = 85;
      reason = 'Shared vision of low-stakes quiet notebook writing';
    } else if (score > 25) {
      type = 'Aligned';
      reason = `Highly aligned vocabulary in context of ${entry.category || 'general thought'}`;
    } else if (score > 8 || intersection.size > 0) {
      type = 'Complementary';
      reason = `Brings neighboring ideas related to "${[...intersection][0] || 'your concepts'}"`;
    } else {
      // Fallback matching logic for unrelated elements (low score) to populate the feed with complementary thoughts
      type = 'Complementary';
      score = 10 + (entry.text.length % 15);
      reason = `Examines adjacent concepts in ${entry.category || 'creative thoughts'}`;
    }
    
    return {
      entry,
      score,
      type,
      reason
    };
  });
  
  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
};
