import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ApiProvider = 'anthropic' | 'groq' | 'openai' | 'deepseek';

export const API_PROVIDERS: { id: ApiProvider; name: string; model: string; free: boolean }[] = [
  { id: 'anthropic', name: 'Anthropic (Claude)', model: 'claude-sonnet-4-20250514', free: false },
  { id: 'groq', name: 'Groq (Free)', model: 'llama-3.1-70b-versatile', free: true },
  { id: 'openai', name: 'OpenAI (GPT)', model: 'gpt-4o-mini', free: false },
  { id: 'deepseek', name: 'DeepSeek (Free)', model: 'deepseek-chat', free: true },
];

export interface User {
  id: string;
  niche: string | null;
  frequency: string | null;
  streak: number;
  longestStreak: number;
}

export interface Platform {
  id: string;
  platform: string;
  connected: boolean;
}

export interface Post {
  id: string;
  platformId: string;
  platform: string;
  title: string;
  content: string;
  scheduledAt: string | null;
  postedAt: string | null;
  status: 'draft' | 'scheduled' | 'posted';
}

export interface Idea {
  id: string;
  type: string;
  platform: string;
  content: string;
  used: boolean;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
  platforms: Platform[];
  setPlatforms: (platforms: Platform[]) => void;
  addPlatform: (platform: Platform) => void;
  removePlatform: (platformId: string) => void;
  updatePlatformConnection: (platform: string, connected: boolean) => void;
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  ideas: Idea[];
  setIdeas: (ideas: Idea[]) => void;
  markIdeaUsed: (id: string) => void;
  composePlatform: string;
  setComposePlatform: (platform: string) => void;
  composeContent: string;
  setComposeContent: (content: string) => void;
  activeTab: 'home' | 'ideas' | 'compose' | 'settings';
  setActiveTab: (tab: 'home' | 'ideas' | 'compose' | 'settings') => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  apiProvider: ApiProvider;
  setApiProvider: (provider: ApiProvider) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  hasCompletedOnboarding: false,
  platforms: [] as Platform[],
  posts: [] as Post[],
  ideas: [] as Idea[],
  composePlatform: 'instagram',
  composeContent: '',
  activeTab: 'home' as const,
  isLoading: false,
  toast: null as { message: string; type: 'success' | 'error' | 'info' } | null,
  apiKey: '',
  apiProvider: 'anthropic' as ApiProvider,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUser: (user) => set({ user }),
      updateUser: (updates) => set((state) => ({ 
        user: state.user ? { ...state.user, ...updates } : null 
      })),
      setHasCompletedOnboarding: (value) => set({ hasCompletedOnboarding: value }),
      setPlatforms: (platforms) => set({ platforms }),
      addPlatform: (platform) => set((state) => ({ 
        platforms: [...state.platforms, platform] 
      })),
      removePlatform: (id) => set((state) => ({ 
        platforms: state.platforms.filter((p) => p.id !== id) 
      })),
      updatePlatformConnection: (platform, connected) => set((state) => ({
        platforms: state.platforms.map((p) => 
          p.platform === platform ? { ...p, connected } : p
        )
      })),
      setPosts: (posts) => set({ posts }),
      addPost: (post) => set((state) => ({ 
        posts: [post, ...state.posts] 
      })),
      updatePost: (id, updates) => set((state) => ({
        posts: state.posts.map((p) => 
          p.id === id ? { ...p, ...updates } : p
        )
      })),
      deletePost: (id) => set((state) => ({ 
        posts: state.posts.filter((p) => p.id !== id) 
      })),
      setIdeas: (ideas) => set({ ideas }),
      markIdeaUsed: (id) => set((state) => ({
        ideas: state.ideas.map((i) => 
          i.id === id ? { ...i, used: true } : i
        )
      })),
      setComposePlatform: (platform) => set({ composePlatform: platform }),
      setComposeContent: (content) => set({ composeContent: content }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      showToast: (message, type = 'success') => set({ toast: { message, type } }),
      clearToast: () => set({ toast: null }),
      setApiKey: (key) => set({ apiKey: key }),
      setApiProvider: (provider) => set({ apiProvider: provider }),
      reset: () => set(initialState),
    }),
    {
      name: 'nudge-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        platforms: state.platforms,
        posts: state.posts,
        apiKey: state.apiKey,
        apiProvider: state.apiProvider,
      }),
    }
  )
);