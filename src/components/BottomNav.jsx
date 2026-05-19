import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, TrendingUp, BarChart2, LayoutList } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/history', label: 'History', Icon: Calendar },
  { to: '/templates', label: 'Templates', Icon: LayoutList },
  { to: '/progress', label: 'Progress', Icon: TrendingUp },
  { to: '/stats', label: 'Stats', Icon: BarChart2 },
];

export default function BottomNav() {
  const location = useLocation();

  // Hide on workout routes
  if (location.pathname.startsWith('/workout')) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-16">
        {tabs.map(({ to, label, Icon }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <Icon
                size={20}
                className={isActive ? 'text-accent' : 'text-muted'}
              />
              <span
                className={`text-xs font-body font-medium ${isActive ? 'text-accent' : 'text-muted'}`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
