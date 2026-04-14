import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth';
import api from '@/api/client';
import { toast } from '@/hooks/useToast';

interface UserRecord {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: number;
}

interface UserListProps {
  users: UserRecord[];
  onRefresh: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function UserList({ users, onRefresh }: UserListProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(userId);
    try {
      await api.delete(`/api/v1/admin/users/${userId}`);
      toast({ variant: 'default', title: 'User deleted.' });
      onRefresh();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { data: { error: { message: string } } } }).response?.data?.error?.message
        : 'Failed to delete user';
      toast({ variant: 'destructive', title: msg ?? 'Failed to delete user' });
    } finally {
      setDeleting(null);
    }
  };

  if (users.length === 0) {
    return <div className="text-center py-16 text-text-muted font-mono text-sm">NO USERS FOUND</div>;
  }

  return (
    <div className="rounded border border-terminal-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-terminal-border bg-terminal-elevated">
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Email</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Role</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Joined</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-terminal-subtle hover:bg-terminal-elevated/40 transition-colors">
              <td className="px-4 py-3 font-mono text-sm text-text-primary">{u.email}</td>
              <td className="px-4 py-3">
                <Badge variant={u.role === 'admin' ? 'admin' : 'user'}>{u.role}</Badge>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-text-muted">{formatDate(u.created_at)}</td>
              <td className="px-4 py-3">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={u.id === currentUserId || deleting === u.id}
                  loading={deleting === u.id}
                  onClick={() => handleDelete(u.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
