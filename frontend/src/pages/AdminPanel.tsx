import { useEffect, useCallback, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminOrdersTable } from '@/components/admin/AdminOrdersTable';
import { UserList } from '@/components/admin/UserList';
import { useAdminOrders } from '@/hooks/useOrders';
import api from '@/api/client';
import { toast } from '@/hooks/useToast';

interface UserRecord {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: number;
}

export function AdminPanel() {
  const { orders, loading, fetchAllOrders, updateOrderStatus } = useAdminOrders();
  const [users, setUsers] = useState<UserRecord[]>([]);

  const loadOrders = useCallback(() => fetchAllOrders(), [fetchAllOrders]);
  const loadUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/admin/users');
      setUsers(data.data.users);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load users' });
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadUsers();
  }, [loadOrders, loadUsers]);

  const handleUpdateStatus = async (id: string, status: string) => {
    return updateOrderStatus(id, status);
  };

  return (
    <AppShell title="Admin">
      <div className="mb-6">
        <h2 className="font-mono text-sm font-semibold text-text-primary tracking-widest uppercase">
          Admin Panel
        </h2>
        <p className="text-xs text-text-muted mt-1 font-sans">
          Manage all orders and users across the platform.
        </p>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">All Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          {loading ? (
            <div className="flex flex-col gap-2 mt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded bg-terminal-panel border border-terminal-border animate-pulse" />
              ))}
            </div>
          ) : (
            <AdminOrdersTable
              orders={orders}
              onUpdateStatus={handleUpdateStatus}
              onRefresh={loadOrders}
            />
          )}
        </TabsContent>

        <TabsContent value="users">
          <UserList users={users} onRefresh={loadUsers} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
