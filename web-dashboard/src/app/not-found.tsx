import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">404</h1>
      <p className="text-slate-400 text-xl mb-8">Page Not Found</p>
      <Link 
        href="/" 
        className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
