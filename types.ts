export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface TextElementStyle {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  fontFamily?: string;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  showAriaLabels: boolean;
}

export interface LayoutSection {
  id: string;
  type: 'navbar' | 'hero' | 'features' | 'stats' | 'pricing' | 'testimonials' | 'faq' | 'footer' | 'cta' | 'contact' | 'logoCloud' | 'newsletter' | 'team' | 'timeline';
  content: {
    title?: string;
    subtitle?: string;
    description?: string;
    primaryButton?: { text: string; link: string; ariaLabel?: string };
    secondaryButton?: { text: string; link: string; ariaLabel?: string };
    items?: Array<{
      title?: string;
      description?: string;
      icon?: string;
      image?: string;
      price?: string;
      author?: string;
      role?: string;
      date?: string;
      ariaLabel?: string;
    }>;
  };
  style: {
    theme: 'light' | 'dark' | 'accent' | 'glass';
    padding: 'small' | 'medium' | 'large';
    alignment: 'left' | 'center' | 'right';
    backgroundImage?: string;
    typography?: {
      title?: TextElementStyle;
      subtitle?: TextElementStyle;
      description?: TextElementStyle;
    };
  };
}

export interface DesignSystem {
  primaryColor: string;
  borderRadius: string;
  fontFamily: string;
  accessibility: AccessibilitySettings;
}

export interface SavedProject {
  id: string;
  name: string;
  prompt: string;
  sections: LayoutSection[];
  designSystem: DesignSystem;
  timestamp: number;
  author?: string;
  likes?: number;
}

export interface CommunityProject extends SavedProject {
  author: string;
  likes: number;
}

export interface AppState {
  sections: LayoutSection[];
  designSystem: DesignSystem;
  currentDevice: DeviceType;
  isGenerating: boolean;
  history: string[];
}