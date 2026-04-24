'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Plus, Search, Shield, Building2, Loader2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  projects: number;
}

export default function TeamDirectoryPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/team/directory');
      const json = await res.json();
      if (json.success) setMembers(json.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    try {
      const res = await fetch('/api/v1/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setIsInviteOpen(false);
        fetchMembers(); // refresh
      } else {
        toast.error(json.error || 'Failed to send invitation');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/register?invite=team-access`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied to clipboard!');
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Directory</h1>
          <p className="text-sm text-muted-foreground">
            Manage everyone in your organization and projects.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <Link
            href="/team/workload"
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            View Workload
          </Link>
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            Copy Link
          </button>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 rounded-lg gradient-bg px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search members by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 outline-none focus:border-primary transition-colors shadow-sm"
        />
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-foreground">No members found</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {searchQuery ? 'Try adjusting your search query.' : 'Invite your team members to start collaborating.'}
          </p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredMembers.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full gradient-bg text-sm font-bold text-white shadow-sm">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  member.name[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    {member.role}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Building2 className="h-3 w-3" />
                    {member.projects} Projects
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Invite Modal Overlay */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl border border-border"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-1">Invite to Workspace</h2>
              <p className="text-sm text-muted-foreground mb-6">Send an email invitation to add a new team member to your organization.</p>
              
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmail}
                    className="flex items-center gap-2 rounded-lg gradient-bg px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
            <div className="bg-muted/30 px-6 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Invited members will receive an email with instructions to join your workspace securely.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
