const SSO_REFRESH_URL = "https://apps.thecostaricacollection.com/api/sso/refresh";

function redirectToSso(): never {
  const next = encodeURIComponent(window.location.href);
  window.location.href = `${SSO_REFRESH_URL}?next=${next}`;
  // La navegación real ocurre de forma asíncrona; no resolvemos la promesa
  // para que el código que llamó a request() no siga ejecutándose con datos falsos.
  throw new Error("Sesión vencida — redirigiendo al SSO");
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
  };
  if (!(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Mismo origen: el navegador solo habla con este frontend. La cookie crc_sso
  // viaja automáticamente (misma sede), y app/api/[...path]/route.ts la reenvía
  // al backend real — no hace falta credentials/CORS aquí.
  const res = await fetch(path, { ...opts, headers });
  if (res.status === 401) {
    redirectToSso();
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export const api = {
  // Auth
  me: () => request<import("./types").User>("/api/auth/me"),
  getUsers: () => request<import("./types").User[]>("/api/auth/users"),
  createUser: (data: unknown) => request<import("./types").User>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: number, data: unknown) => request<import("./types").User>(`/api/auth/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Providers
  getProviders: (activeOnly = true) => request<import("./types").Provider[]>(`/api/providers/?active_only=${activeOnly}`),
  createProvider: (data: unknown) => request("/api/providers/", { method: "POST", body: JSON.stringify(data) }),
  updateProvider: (id: number, data: unknown) => request(`/api/providers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProvider: (id: number) => request(`/api/providers/${id}`, { method: "DELETE" }),

  // Services
  getServices: (providerId?: number) => request<import("./types").Service[]>(`/api/services/${providerId ? `?provider_id=${providerId}` : ""}`),
  createService: (data: unknown) => request("/api/services/", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: number, data: unknown) => request(`/api/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (id: number) => request(`/api/services/${id}`, { method: "DELETE" }),

  // Vouchers
  getVouchers: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<import("./types").Voucher[]>(`/api/vouchers/${qs}`);
  },
  getVoucher: (id: number) => request<import("./types").Voucher>(`/api/vouchers/${id}`),
  getVoucherByConsecutive: (consecutive: string) => request<import("./types").Voucher>(`/api/vouchers/by-consecutive/${consecutive}`),
  createVoucher: (formData: FormData) =>
    request<import("./types").Voucher>("/api/vouchers/", { method: "POST", body: formData }),
  updateVoucherStatus: (id: number, status: string) =>
    request(`/api/vouchers/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  auditVoucher: (id: number, data: { audit_status: string; invoice_number?: string; audit_notes?: string }) =>
    request<import("./types").Voucher>(`/api/vouchers/${id}/audit`, { method: "PUT", body: JSON.stringify(data) }),
  generatePdf: (id: number) => request(`/api/vouchers/${id}/generate-pdf`, { method: "POST" }),
  downloadPdfUrl: (id: number) => `/api/vouchers/${id}/pdf`,

  // Voucher Usage
  getUsages: () => request<import("./types").VoucherUsage[]>("/api/voucher-usage/"),
  getTodayUsages: () => request<import("./types").VoucherUsage[]>("/api/voucher-usage/today"),
  registerUsage: (data: unknown) => request("/api/voucher-usage/", { method: "POST", body: JSON.stringify(data) }),

  // Audit
  getPendingAudits: () => request<import("./types").VoucherUsage[]>("/api/audit/pending"),
  validateUsage: (usageId: number, data: unknown) =>
    request(`/api/audit/${usageId}/validate`, { method: "POST", body: JSON.stringify(data) }),
  getAuditReport: () => request<import("./types").AuditLog[]>("/api/audit/report"),

  // Reports
  getDashboard: () => request<import("./types").DashboardSummary>("/api/reports/dashboard"),
  getIngresosValidados: () => request("/api/reports/ingresos-validados"),
  getPorProveedor: () => request("/api/reports/por-proveedor"),
  getPorPropiedad: () => request("/api/reports/por-propiedad"),
  getAnomalias: () => request("/api/reports/anomalias"),
  getTrazabilidad: (id: number) => request(`/api/reports/trazabilidad/${id}`),
};
