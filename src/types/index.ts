export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FooterColumn {
  heading: string;
  links: NavItem[];
}

export interface FrictionArea {
  topic: string;
  solved: number;
  attempted: number;
  totalSubmissions: number;
  waCount: number;
  tleCount: number;
  avgAttemptsBeforeAC: number;
  confidence: "high" | "medium" | "low";
  action: string;
}

export interface TrainingProblem {
  name: string;
  rating: number;
  tags: string[];
  reason: string;
}

export interface DayQueue {
  day: number;
  label: string;
  focus: string;
}

export interface UserProfile {
  handle: string;
  rating: number;
  maxRating: number;
  country: string;
  totalSubmissions: number;
  uniqueSolved: number;
  mainLanguage: string;
}

export interface ErrorBreakdown {
  wrongAnswer: number;
  timeLimitExceeded: number;
  runtimeError: number;
  compileError: number;
  memoryLimitExceeded: number;
}

export interface PricingPlan {
  name: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  comingSoon?: boolean;
}
