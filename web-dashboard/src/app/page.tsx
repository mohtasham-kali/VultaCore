import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500 selection:text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-700/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-700/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            SaaS 2.0 Platform
          </div>
          <div className="flex gap-4 items-center">
            <button className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm">
              Notifications
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-white/20" />
          </div>
        </header>

        {/* Hero Section */}
        <div className="mb-20 text-center">
          <h1 className="text-6xl font-extrabold mb-6 tracking-tight">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Development</span> & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Security</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10">
            A unified ecosystem for developers and security researchers. 
            AI-powered assistance, real-time analytics, and community-driven knowledge.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/forum/dev" className="px-8 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 transition-transform">
              Join Forum
            </Link>
            <Link href="/bots/general" className="px-8 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all">
              Launch AI Bot
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Dev Forum",
              desc: "Q&A with reputation points and rewards.",
              gradient: "from-purple-500/20 to-pink-500/20",
              border: "group-hover:border-purple-500/50",
              href: "/forum/dev"
            },
            {
              title: "Security Hub",
              desc: "Exclusive cyber security discussions and tools.",
              gradient: "from-blue-500/20 to-cyan-500/20",
              border: "group-hover:border-blue-500/50",
              href: "/forum/cyber"
            },
            {
              title: "AI Mini Bots",
              desc: "Deploy specialized bots for code and security.",
              gradient: "from-emerald-500/20 to-teal-500/20",
              border: "group-hover:border-emerald-500/50",
              href: "/bots"
            },
            {
              title: "Analytics",
              desc: "Real-time usage insights and visual charts.",
              gradient: "from-orange-500/20 to-red-500/20",
              border: "group-hover:border-orange-500/50",
              href: "/analytics"
            },
            {
              title: "Profile & Points",
              desc: "Track your progress and leaderboard status.",
              gradient: "from-indigo-500/20 to-violet-500/20",
              border: "group-hover:border-indigo-500/50",
              href: "/profile"
            },
            {
              title: "System Settings",
              desc: "Configure AI models and notification preferences.",
              gradient: "from-slate-700/50 to-slate-800/50",
              border: "group-hover:border-slate-500/50",
              href: "/settings"
            }
          ].map((card, i) => (
            <Link 
              key={i} 
              href={card.href}
              className={`group relative overflow-hidden p-8 rounded-2xl bg-white/5 border border-white/10 ${card.border} transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                <p className="text-slate-400">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
