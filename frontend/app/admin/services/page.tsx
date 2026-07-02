"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Service } from "@/lib/types";
import { getStoredUser } from "@/lib/auth";
import TableSkeleton from "@/components/TableSkeleton";

const SERVICE_TYPES: { value: string; label: string }[] = [
  { value: "TOUR",      label: "Tour" },
  { value: "TRANSPORT", label: "Transporte" },
  { value: "ACTIVITY",  label: "Actividad" },
  { value: "OTHER",     label: "Otro" },
];
const CATEGORIES = ["TOURS", "SPA", "TRANSFERS", "OTHERS"];
const typeLabel = (v: string) => SERVICE_TYPES.find(t => t.value === v)?.label ?? v;

const EMPTY = { service_name: "", service_type: "TOUR", description: "", pricing_code: "", category: "TOURS", currency: "USD" };

export default function ServicesPage() {
  const isAdmin = getStoredUser()?.role === "admin";
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY);

  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [editForm, setEditForm]     = useState(EMPTY);

  const load = () => {
    setLoading(true);
    api.getServices().then(setServices).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  function openEdit(s: Service) {
    setEditTarget(s);
    setEditForm({
      service_name: s.service_name,
      service_type: s.service_type,
      description: s.description ?? "",
      pricing_code: s.pricing_code ?? "",
      category: s.category ?? "TOURS",
      currency: s.currency,
    });
    setError("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.createService(createForm);
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
      await api.updateService(editTarget.service_id, editForm);
      setEditTarget(null);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  async function handleDelete(s: Service) {
    if (!confirm(`¿Eliminar el servicio "${s.service_name}"?\nSolo es posible si no tiene vouchers registrados.`)) return;
    try {
      await api.deleteService(s.service_id);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  const ServiceForm = ({ form, setForm, onSubmit, submitLabel, onCancel }: {
    form: typeof EMPTY;
    setForm: React.Dispatch<React.SetStateAction<typeof EMPTY>>;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    onCancel: () => void;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="w-32">
          <label className="text-xs text-gray-500 block mb-1">Código</label>
          <input value={form.pricing_code}
            onChange={e => setForm(f => ({ ...f, pricing_code: e.target.value.toUpperCase() }))}
            placeholder="TE-0001"
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">Categoría</label>
          <select value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Nombre del servicio / experiencia</label>
        <input required value={form.service_name}
          onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))}
          placeholder="Ej. Corcovado National Park Nature Walk"
          className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Tipo</label>
        <select value={form.service_type}
          onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm">
          {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Descripción (opcional)</label>
        <textarea value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Descripción breve del servicio"
          className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
      </div>
      <p className="text-xs text-gray-400">Los precios por canal se gestionan en <strong>Tarifas</strong>.</p>
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
        <h1 className="text-2xl font-bold">Catálogo de Servicios</h1>
        <button className="btn-primary" onClick={() => { setShowCreate(true); setError(""); }}>
          + Nuevo Servicio
        </button>
      </div>

      {/* Modal crear */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">Nuevo Servicio</h2>
            <ServiceForm
              form={createForm} setForm={setCreateForm}
              onSubmit={handleCreate} submitLabel="Crear Servicio"
              onCancel={() => { setShowCreate(false); setError(""); }}
            />
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-5">Editar Servicio</h2>
            <ServiceForm
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
                <th className="table-th">Código</th>
                <th className="table-th">Servicio / Experiencia</th>
                <th className="table-th">Categoría</th>
                <th className="table-th">Tipo</th>
                <th className="table-th text-center">Estado</th>
                <th className="table-th text-center">Acciones</th>
              </tr>
            </thead>
            {loading ? <TableSkeleton cols={6} rows={5} /> : (
              <tbody className="divide-y divide-gray-100">
                {services.map(s => (
                  <tr key={s.service_id} className={`hover:bg-gray-50 ${!s.is_active ? "opacity-50" : ""}`}>
                    <td className="table-td font-mono text-xs text-gray-500">{s.pricing_code ?? "—"}</td>
                    <td className="table-td font-medium">
                      {s.service_name}
                      {s.description && <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>}
                    </td>
                    <td className="table-td text-xs text-gray-600">{s.category ?? "—"}</td>
                    <td className="table-td">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">
                        {typeLabel(s.service_type)}
                      </span>
                    </td>
                    <td className="table-td text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="table-td text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openEdit(s)} className="text-xs text-[#0066CC] hover:underline">Editar</button>
                          <button onClick={() => handleDelete(s)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                        </div>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">Sin servicios</td></tr>
                )}
              </tbody>
            )}
          </table>
        </div>
      </div>
    </>
  );
}
