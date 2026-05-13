interface Window {
  bbcpage?: {
    loadModule: () => Promise<any>;
    isUKCombined: () => boolean;
  };
  orb?: {
    fig: () => boolean;
  };
  bbccookies?: {
    getCookieValue: () => any;
    allowsPerformanceCookies: () => boolean;
  };
  bbcSounds?: {
    getAudioUrl: (id: string) => string | null;
    loadAudioData: () => Promise<void>;
    init?: () => void;
  };
  __PRELOADED_STATE__?: any;
} 