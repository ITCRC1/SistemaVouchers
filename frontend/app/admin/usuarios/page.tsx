"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { getStoredUser } from "@/lib/auth";

const ROLES = [
  { value: "admin", label: "Administrador", color: "bg-[#002147] text-white" },
  { value: "user",  label: "Usuario",        color: "bg-blue-100 text-blue-800" },
];

const roleLabel = (r: string) => ROLES.find(x => x.value === r)?.label ?? r;
const roleColor = (r: string) => ROLES.find(x => x.value === r)?.color ?? "bg-gray-100 text-gray-600";

const EMPTY_FORM = { name: "", email: "", username: "", password: "", role: "user" };

export default function UsuariosPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPwd, setResetPwd] = useState("");
  const me = getStoredUser();

  const load = () => {
    setLoading(true);
    api.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.createUser(form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear usuario");
    } finally { setSaving(false); }
  }

  async function toggleActive(u: User) {
    if (u.user_id === me?.user_id) return;
    await api.updateUser(u.user_id, { is_active: !u.is_active });
    load();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser || !resetPwd) return;
    setSaving(true); setError("");
    try {
      await api.updateUser(editUser.user_id, { password: resetPwd });
      setEditUser(null);
      setResetPwd("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cambiar contraseña");
    } finally { setSaving(false); }
  }

  async function changeRole(u: User, role: string) {
    if (u.user_id === me?.user_id) return;
    await api.updateUser(u.user_id, { role });
    load();
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Solo los administradores pueden crear y gestionar usuarios.</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setError(""); }}>
          + Nuevo Usuario
        </button>
      </div>

      {/* Modal crear usuario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-5">Nuevo Usuario</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nombre completo</label>
                <input required placeholder="Ej. Juan Retana" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Usuario <span className="text-gray-400">(para iniciar sesión sin @)</span>
                </label>
                <input placeholder="ej. jretana" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Email</label>
                <input required type="email" placeholder="usuario@thecrc.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Contraseña inicial</label>
                <input required type="password" placeholder="Mínimo 8 caracteres" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Rol</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Creando…" : "Crear Usuario"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setError(""); }}
                  className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-1">Cambiar contraseña</h2>
            <p className="text-sm text-gray-500 mb-4">{editUser.name}</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input required type="password" placeholder="Nueva contraseña" value={resetPwd}
                onChange={e => setResetPwd(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
              {error && <p className="text-red-600 text-sm bg-red-50 rounded px-3 py-2">{error}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Guardando…" : "Guardar"}
                </button>
                <button type="button" onClick={() => { setEditUser(null); setResetPwd(""); setError(""); }}
                  className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="table-th">Nombre</th>
              <th className="table-th">Usuario / Email</th>
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
                  {u.username && (
                    <div className="font-mono text-sm font-semibold text-[#002147]">{u.username}</div>
                  )}
                  <div className="text-xs text-gray-400">{u.email}</div>
                </td>
                <td className="table-td">
                  {u.user_id === me?.user_id ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColor(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => changeRole(u, e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  )}
                </td>
                <td className="table-td text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="table-td text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => { setEditUser(u); setError(""); }}
                      className="text-xs text-[#0066CC] hover:underline">
                      Cambiar contraseña
                    </button>
                    {u.user_id !== me?.user_id && (
                      <button onClick={() => toggleActive(u)}
                        className={`text-xs hover:underline ${u.is_active ? "text-red-500" : "text-green-600"}`}>
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
