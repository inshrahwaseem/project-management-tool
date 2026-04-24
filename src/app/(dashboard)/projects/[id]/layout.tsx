'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { LayoutDashboard, ListTodo, CalendarDays, Settings, Users, FolderOpen, Activity, Flag, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { ProjectChat } from '@/components/chat/ProjectChat';
import { useSession } from 'next-auth/react';
import type { MemberRole } from '@prisma/client';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string;
  const [projectTitle, setProjectTitle] = useState('Loading...');
  const [userRole, setUserRole] = useState<MemberRole | null>(null);
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/v1/projects/${projectId}`);
        const data = await res.json();
        if (data.success) {
          setProjectTitle(data.data.title);
          
          // Find current user's role in this project
          if (session?.user) {
            const member = data.data.members.find((m: any) => m.userId === (session.user as any).id);
            if (member) setUserRole(member.role);
          }
        }
      } catch (error) {
        setProjectTitle('Project');
      }
    }
    if (projectId && session) fetchProject();
  }, [projectId, session]);

  const allTabs = [
    { name: 'Board', path: `/projects/${projectId}/board`, icon: LayoutDashboard },
    { name: 'List', path: `/projects/${projectId}/list`, icon: ListTodo },
    { name: 'Timeline', path: `/projects/${projectId}/timeline`, icon: CalendarDays },
    { name: 'Team', path: `/projects/${projectId}/team`, icon: Users },
    { name: 'Files', path: `/projects/${projectId}/files`, icon: FolderOpen },
    { name: 'Milestones', path: `/projects/${projectId}/milestones`, icon: Flag },
    { name: 'Budget', path: `/projects/${projectId}/budget`, icon: DollarSign },
    { name: 'Activity', path: `/projects/${projectId}/activity`, icon: Activity },
    { name: 'Automations', path: `/projects/${projectId}/automations`, icon: Settings, adminOnly: true },
    { name: 'Settings', path: `/projects/${projectId}/settings`, icon: Settings, adminOnly: true },
  ];

  const filteredTabs = allTabs.filter(tab => {
    if (!tab.adminOnly) return true;
    return userRole === 'OWNER' || userRole === 'ADMIN';
  });

  return (
    <div className="flex h-full flex-col space-y-4 relative">
      <div className="flex flex-col gap-4 border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">{projectTitle}</h1>
        
        <div className="flex space-x-1">
          {filteredTabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.name}
                href={tab.path}
                className={cn(
                  'relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="flex-1">
        {children}
      </div>
      
      <ProjectChat projectId={projectId} />
    </div>
  );
}
