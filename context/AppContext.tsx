import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface Reply {
  id: string;
  author: string;
  avatar: string;
  avatarColor: string;
  text: string;
  timestamp: string;
  hasResonated?: boolean;
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
}

export interface MatchResult {
  entry: Entry;
  score: number; // 0 to 100
  type: 'Aligned' | 'Complementary' | 'Challenging';
  reason: string;
}

interface AppContextType {
  entries: Entry[];
  addEntry: (text: string, author?: string, isPrivate?: boolean) => void;
  addReply: (entryId: string, text: string, author?: string) => void;
  draftText: string;
  setDraftText: (val: string) => void;
  toggleResonance: (entryId: string) => void;
  toggleReplyResonance: (entryId: string, replyId: string) => void;
  replyDrafts: Record<string, string>;
  setReplyDraft: (entryId: string, text: string) => void;
  getMatches: (text: string) => MatchResult[];
  shareEntryPublicly: (entryId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

  const setReplyDraft = (entryId: string, text: string) => {
    setReplyDrafts(prev => ({
      ...prev,
      [entryId]: text
    }));
  };

  const addEntry = (text: string, author: string = 'You', isPrivate: boolean = false) => {
    const newEntry: Entry = {
      id: Date.now().toString(),
      author,
      avatar: author.charAt(0).toUpperCase(),
      avatarColor: author === 'You' ? '#F0706A' : '#7f8c8d', // Coral-rose for current user
      text,
      timestamp: 'Just now',
      replies: [],
      hasResonated: false,
      isPrivate
    };
    setEntries([newEntry, ...entries]);
  };

  const addReply = (entryId: string, text: string, author: string = 'You') => {
    setEntries(prevEntries =>
      prevEntries.map(entry => {
        if (entry.id === entryId) {
          const newReply: Reply = {
            id: Date.now().toString(),
            author,
            avatar: author.charAt(0).toUpperCase(),
            avatarColor: author === 'You' ? '#F0706A' : '#7f8c8d',
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
    // Clear reply draft after publishing
    setReplyDraft(entryId, '');
  };

  const toggleResonance = (entryId: string) => {
    setEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.id === entryId
          ? { ...entry, hasResonated: !entry.hasResonated }
          : entry
      )
    );
  };

  const toggleReplyResonance = (entryId: string, replyId: string) => {
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
  };

  const getMatches = (text: string): MatchResult[] => {
    return calculateMatches(text, entries);
  };

  const shareEntryPublicly = (entryId: string) => {
    setEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.id === entryId
          ? { ...entry, isPrivate: false, timestamp: 'Just now' }
          : entry
      )
    );
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
      shareEntryPublicly
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
