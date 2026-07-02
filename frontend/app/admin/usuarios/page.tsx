"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { getStoredUser } from "@/lib/auth";

const ROLES = [
  { value: "admin", label: "Administrador", color: "bg-[#002147] text-white" },
  { value: "user",  label: "Usuario",        color: "bg-blue-100 text-blue-800" },
];

const roleLabel = (r: string) => ROLES.find(x => x.value === r)?.label ?? r;
const roleColor = (r: string) => ROLES.find(x => x.value === r)?.color ?? "bg-gray-100 text-gray-600";

const EMPTY_CREATE = { name: "", username: "", password: "", role: "user" };

export default function UsuariosPage() {
  const router = useRouter();
  const me = getStoredUser();

  useEffect(() => {
    if (me && me.role !== "admin") router.replace("/admin/vouchers");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);

  // Edit modal
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm]     = useState({ name: "", username: "", password: "", role: "user" });

  const load = () => {
    setLoading(true);
    api.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  function openEdit(u: User) {
    setEditTarget(u);
    setEditForm({ name: u.name, username: u.username ?? "", password: "", role: u.role });
    setError("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.createUser(createForm);
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear usuario");
    } finally { setSaving(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true); setError("");
    try {
      const updates: Record<string, unknown> = {};
      if (editForm.name !== editTarget.name) updates.name = editForm.name;
      if (editForm.username !== (editTarget.username ?? "")) updates.username = editForm.username;
      if (editForm.role !== editTarget.role && editTarget.user_id !== me?.user_id) updates.role = editForm.role;
      if (editForm.password) updates.password = editForm.password;
      if (Object.keys(updates).length > 0) await api.updateUser(editTarget.user_id, updates);
      setEditTarget(null);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  async function toggleActive(u: User) {
    if (u.user_id === me?.user_id) return;
    await api.updateUser(u.user_id, { is_active: !u.is_active });
    load();
  }

return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Solo los administradores pueden crear y gestionar usuarios.</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowCreate(true); setError(""); }}>
          + Nuevo Usuario
        </button>
      </div>

      {/* Modal crear usuario */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-5">Nuevo Usuario</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nombre completo</label>
                <input required placeholder="Ej. Juan Retana" value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Usuario</label>
                <input required placeholder="ej. jretana" value={createForm.username}
                  onChange={e => setCreateForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Contraseña inicial</label>
                <input required type="password" placeholder="Mínimo 8 caracteres" value={createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Rol</label>
                <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Creando…" : "Crear Usuario"}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setError(""); }}
                  className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar usuario */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-1">Editar usuario</h2>
            <p className="text-xs text-gray-400 mb-5">Deja la contraseña en blanco para no cambiarla.</p>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nombre completo</label>
                <input required value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Usuario</label>
                <input required value={editForm.username}
                  onChange={e => setEditForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nueva contraseña</label>
                <input type="password" placeholder="Dejar en blanco para no cambiar" value={editForm.password}
                  onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              {editTarget.user_id !== me?.user_id && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Rol</label>
                  <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              )}
              {error && <p className="text-red-600 text-sm bg-red-50 rounded px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
                <button type="button" onClick={() => { setEditTarget(null); setError(""); }}
                  className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="table-th">Nombre</th>
              <th className="table-th">Usuario</th>
              <th className="table-th">Rol</th>
              <th className="table-th text-center">Estado</th>
              <th className="table-th text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">Cargando…</td></tr>
            )}
            {!loading && users.map(u => (
              <tr key={u.user_id} className={`hover:bg-gray-50 ${!u.is_active ? "opacity-50" : ""}`}>
                <td className="table-td font-medium">
                  {u.name}
                  {u.user_id === me?.user_id && (
                    <span className="ml-2 text-xs text-blue-500">(tú)</span>
                  )}
                </td>
                <td className="table-td">
                  <span className="font-mono font-semibold text-[#002147]">
                    {u.username ?? <span className="text-gray-400 font-normal">—</span>}
                  </span>
                </td>
                <td className="table-td">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColor(u.role)}`}>
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td className="table-td text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="table-td text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => openEdit(u)}
                      className="text-xs text-[#0066CC] hover:underline">
                      Editar
                    </button>
                    {u.user_id !== me?.user_id && u.username !== "admin" && (
                      <button onClick={() => toggleActive(u)}
                        className={`text-xs hover:underline ${u.is_active ? "text-amber-500" : "text-green-600"}`}>
                        {u.is_active ? "Desactivar" : "Activar"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">Sin usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
