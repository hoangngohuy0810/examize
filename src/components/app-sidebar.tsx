'use client';

import {
  LayoutDashboard,
  Sparkles,
  Wand2,
  Library,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    href: '/dashboard',
    label: 'Bảng điều khiển',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/builder',
    label: 'Xây dựng đề thi',
    icon: Wand2,
  },
  {
    href: '/dashboard/my-tests',
    label: 'Đề thi của tôi',
    icon: Library,
  }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Logo className="size-7 text-primary" />
          <span className="text-lg font-semibold text-sidebar-foreground">
            Examaker
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                as={Link}
                href={item.href}
                isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                tooltip={item.label}
                className={cn(
                  'text-sidebar-foreground',
                  pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard') &&
                    'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
                )}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
