import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "../../components/ui/GlassCard";
import * as adminApi from "../../services/admin";

export default function AdminUsers() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users", search, role],
    queryFn: () => adminApi.fetchAdminUsers({ search: search || undefined, role: role || undefined }),
  });

  const handleUpdate = async (id: string, patch: any) => {
    await adminApi.updateAdminUser(id, patch);
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await adminApi.deleteAdminUser(id);
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.users")}</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input-glass !ps-9" placeholder={t("common.search") as string} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-glass w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">{t("common.all")}</option>
          <option value="student">{t("auth.roleStudent")}</option>
          <option value="instructor">{t("auth.roleInstructor")}</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <GlassCard className="!p-0 overflow-x-auto">
        {isLoading ? (
          <p className="p-6 text-center text-muted">{t("common.loading")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-start text-xs text-muted">
              <tr>
                <th className="p-3 text-start">Name</th>
                <th className="p-3 text-start">Email</th>
                <th className="p-3 text-start">Role</th>
                <th className="p-3 text-start">Status</th>
                <th className="p-3 text-start">XP</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 text-muted">{u.email}</td>
                  <td className="p-3">
                    <select
                      className="input-glass !py-1 !px-2 w-auto text-xs"
                      value={u.role}
                      onChange={(e) => handleUpdate(u.id, { role: e.target.value })}
                    >
                      <option value="student">student</option>
                      <option value="instructor">instructor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      className="input-glass !py-1 !px-2 w-auto text-xs"
                      value={u.status}
                      onChange={(e) => handleUpdate(u.id, { status: e.target.value })}
                    >
                      <option value="active">active</option>
                      <option value="pending">pending</option>
                      <option value="rejected">rejected</option>
                      <option value="banned">banned</option>
                    </select>
                  </td>
                  <td className="p-3">{u.xp}</td>
                  <td className="p-3">
                    <button onClick={() => handleDelete(u.id)} className="btn-ghost !p-1.5 text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}
