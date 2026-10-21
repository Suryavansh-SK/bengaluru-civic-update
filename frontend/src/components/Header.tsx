import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-3xl mx-auto p-4 md:p-6 flex items-center justify-between">
        <Link 
          href="/" 
          className="text-xl font-bold text-white hover:text-gray-300 transition-colors"
        >
          Bengaluru Civic Update
        </Link>

        <nav className="flex gap-4 md:gap-6">
          <Link 
            href="/about" 
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            About
          </Link>
          <Link 
            href="/changelogs" 
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Changelogs
          </Link>
        </nav>
      </div>
    </header>
  );
}