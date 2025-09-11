'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from './ui/sidebar';
import {
  LayoutDashboard,
  Sparkles,
  Wand2,
  Library,
} from 'lucide-react';

const routeTitles: { [key: string]: { title: string; icon: React.ElementType } } = {
  '/dashboard': { title: 'Bảng điều khiển', icon: LayoutDashboard },
  '/dashboard/builder': { title: 'Xây dựng đề thi', icon: Wand2 },
  '/dashboard/my-tests': { title: 'Đề thi của tôi', icon: Library },
};

export function AppHeader() {
  const pathname = usePathname();
  const currentRoute = routeTitles[pathname] || { title: 'Examaker', icon: () => null };
  const Icon = currentRoute.icon;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">{currentRoute.title}</h1>
      </div>
    </header>
  );
}
