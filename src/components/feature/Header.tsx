import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface HeaderProps {
  rightContent?: ReactNode;
}

export default function Header({ rightContent }: HeaderProps) {
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '';
  const isFee = location.pathname.startsWith('/fee-calculator');

  return (
    <header className="sticky top-0 z-20 bg-background-100/90 backdrop-blur border-b border-background-200">
      <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="https://storage.readdy-site.link/project_files/a3f5db44-7b13-4b1a-aa33-528391e05df8/e51c830a-7222-4690-8005-eb0db9eb2634_compressed_unnamed.webp"
              alt="PY之神"
              className="w-9 h-9 rounded-lg object-cover shrink-0"
            />
            <div className="leading-tight hidden sm:block">
              <span className="text-base font-bold text-foreground-950">PY之神</span>
              <span className="text-xs text-foreground-400 ml-1">v2.1</span>
            </div>
          </Link>
          <div className="flex items-center bg-background-200 rounded-full px-1 py-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                isHome
                  ? 'bg-primary-500 text-white'
                  : 'text-foreground-500 hover:text-foreground-300'
              }`}
            >
              輪珠工具
            </Link>
            <Link
              to="/fee-calculator"
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                isFee
                  ? 'bg-primary-500 text-white'
                  : 'text-foreground-500 hover:text-foreground-300'
              }`}
            >
              手續費計算機
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {rightContent}
        </div>
      </div>
    </header>
  );
}