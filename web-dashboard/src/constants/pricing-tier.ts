export interface Tier {
  name: 'Free' | 'Standard' | 'Premium' | 'Enterprise';
  description: string;
  features: string[];
  priceId: { month: string; year: string };
  highlight?: boolean;
  badge?: string;
  gradient: string;
}

export const PricingTiers: Tier[] = [
  {
    name: 'Free',
    description: 'Perfect for exploring the platform and participating in developer discussions.',
    features: [
      'Community Forum Access',
      'Basic AI Chat (5 queries / day)',
      'Public Analytics & Leaderboards',
      'Standard Community Support',
    ],
    priceId: {
      month: 'pri_01m7zga17631vansgnv8844tqp', // live Free monthly
      year: 'pri_01m7zga17631vansgnv8844tqp',  // live Free annual
    },
    highlight: false,
    gradient: 'from-slate-700 to-slate-800',
  },
  {
    name: 'Standard',
    description: 'Designed for active developers who need automated code assistance and deep analytics.',
    features: [
      'Priority Developer Forum Support',
      'Pro AI Engine (Gemini & Mistral)',
      'Personal Real-Time Analytics',
      'REST & WebSocket API Access',
      'Unlimited Daily Inquiries',
      '7-day free trial included',
    ],
    priceId: {
      month: 'pri_01m7r11zk5c3bma7a6k0y70g5n', // live Standard monthly ($29)
      year: 'pri_01m7zg022mbd9npg4k7d9462w4',  // live Standard annual ($348)
    },
    highlight: true,
    badge: 'Most Popular',
    gradient: 'from-purple-500 to-blue-500',
  },
  {
    name: 'Premium',
    description: 'Full-scale cyber threat intelligence and advanced LLM reasoning for security researchers.',
    features: [
      'Private Cybersecurity Hub',
      'Claude 3 & Llama 3 Security Models',
      'Real-Time Vulnerability Feeds',
      'High-Rate-Limit API Access',
      'Advanced Bot Automation Suite',
      'Priority Email & Slack Support',
    ],
    priceId: {
      month: 'pri_01m7r12e4rwbrt25331y3sm88p', // live Premium monthly ($99)
      year: 'pri_01m7zga0kvb5ycrvpa9mw8n1f1',  // live Premium annual ($1188)
    },
    highlight: false,
    gradient: 'from-amber-500 to-rose-500',
  },
  {
    name: 'Enterprise',
    description: 'Tailored infrastructure, dedicated security tooling, and SLA guarantees for enterprise teams.',
    features: [
      'Dedicated Private AI Instance',
      'Custom Data Governance & On-Prem Options',
      'Guaranteed 99.9% Uptime SLA',
      'Dedicated Account Manager & 24/7 Phone Support',
      'Custom Vendor Security Audits',
    ],
    priceId: {
      month: 'pri_01m7zga1swv0y3tfj78g7bkqvj', // live Enterprise monthly
      year: 'pri_01m7zga22j5raphwqxbe31fgex',  // live Enterprise annual
    },
    highlight: false,
    gradient: 'from-emerald-500 to-teal-500',
  },
];

