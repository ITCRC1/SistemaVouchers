"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Provider } from "@/lib/types";
import TableSkeleton from "@/components/TableSkeleton";

const TYPES: { value: string; label: string }[] = [
  { value: "TOUR",      label: "Tour / Actividad" },
  { value: "TRANSPORT", label: "Transporte" },
  { value: "OTHER",     label: "Otro" },
];
const typeLabel = (v: string) => TYPES.find(t => t.value === v)?.label ?? v;

const EMPTY = { name: "", provider_type: "TOUR", contact_email: "", contact_phone: "", bank_account: "" };

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY);

  const [editTarget, setEditTarget] = useState<Provider | null>(null);
  const [editForm, setEditForm]     = useState(EMPTY);

  const load = () => {
    setLoading(true);
    api.getProviders(false).then(setProviders).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  function openEdit(p: Provider) {
    setEditTarget(p);
    setEditForm({
      name: p.name,
      provider_type: p.provider_type,
      contact_email: p.contact_email ?? "",
      contact_phone: p.contact_phone ?? "",
      bank_account: p.bank_account ?? "",
    });
    setError("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.createProvider(createForm);
      setShowCreate(false);
      setCreateForm(EMPTY);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true); setError("");
    try {
      await api.updateProvider(editTarget.provider_id, editForm);
      setEditTarget(null);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  async function toggleActive(p: Provider) {
    await api.updateProvider(p.provider_id, { is_active: !p.is_active });
    load();
  }

  const ProviderForm = ({ form, setForm, onSubmit, submitLabel, onCancel }: {
    form: typeof EMPTY;
    setForm: React.Dispatch<React.SetStateAction<typeof EMPTY>>;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    onCancel: () => void;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Nombre del proveedor</label>
        <input required value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Ej. Franklin Araya Hernandez"
          className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Tipo</label>
        <select value={form.provider_type}
          onChange={e => setForm(f => ({ ...f, provider_type: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm">
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Email de contacto</label>
        <input type="email" value={form.contact_email}
          onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
          placeholder="contacto@proveedor.com"
          className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Teléfono</label>
        <input value={form.contact_phone}
          onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
          placeholder="+506 8888-8888"
          className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Cuenta bancaria / IBAN</label>
        <input value={form.bank_account}
          onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))}
          placeholder="CR00 0000 0000 0000 0000 0000"
          className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
      </div>
      {error && <p className="text-red-600 text-sm bg-red-50 rounded px-3 py-2">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? "Guardando…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
      </div>
    </form>
  );

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <button className="btn-primary" onClick={() => { setShowCreate(true); setError(""); }}>
          + Nuevo Proveedor
        </button>
      </div>

      {/* Modal crear */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">Nuevo Proveedor</h2>
            <ProviderForm
              form={createForm} setForm={setCreateForm}
              onSubmit={handleCreate} submitLabel="Crear Proveedor"
              onCancel={() => { setShowCreate(false); setError(""); }}
            />
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">Editar Proveedor</h2>
            <ProviderForm
              form={editForm} setForm={setEditForm}
              onSubmit={handleEdit} submitLabel="Guardar cambios"
              onCancel={() => { setEditTarget(null); setError(""); }}
            />
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-th">Nombre</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Email</th>
                <th className="table-th">Teléfono</th>
                <th className="table-th">Cuenta bancaria</th>
                <th className="table-th text-center">Estado</th>
                <th className="table-th text-center">Acciones</th>
              </tr>
            </thead>
            {loading ? <TableSkeleton cols={7} rows={5} /> : (
              <tbody className="divide-y divide-gray-100">
                {providers.map(p => (
                  <tr key={p.provider_id} className={`hover:bg-gray-50 ${!p.is_active ? "opacity-50" : ""}`}>
                    <td className="table-td font-medium">{p.name}</td>
                    <td className="table-td">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">
                        {typeLabel(p.provider_type)}
                      </span>
                    </td>
                    <td className="table-td text-gray-500 text-xs">{p.contact_email ?? "—"}</td>
                    <td className="table-td text-gray-500 text-xs">{p.contact_phone ?? "—"}</td>
                    <td className="table-td font-mono text-xs text-gray-500">{p.bank_account ?? "—"}</td>
                    <td className="table-td text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="table-td text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => openEdit(p)}
                          className="text-xs text-[#0066CC] hover:underline">
                          Editar
                        </button>
                        <button onClick={() => toggleActive(p)}
                          className={`text-xs hover:underline ${p.is_active ? "text-amber-500" : "text-green-600"}`}>
                          {p.is_active ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {providers.length === 0 && (
                  <tr><td colSpan={7} className="table-td text-center text-gray-400 py-8">Sin proveedores registrados</td></tr>
                )}
              </tbody>
            )}
          </table>
        </div>
      </div>
    </>
  );
}
