import { useEffect, useMemo, useState } from "react";
import { apiRequest, authHeaders } from "./api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";
const buttonPrimary =
  "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
const buttonMuted =
  "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50";
const buttonDanger =
  "rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600";
const panelClass =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";

function LoginView({ onLogin }) {
  const [email, setEmail] = useState("admin@fintech.local");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      onLogin(data);
    } catch (err) {
      setError(err.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50 px-4 py-8">
      <div className="mx-auto grid min-h-[80vh] max-w-5xl items-center gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md sm:p-8">
          <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Fintech Platform
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Finance Control Center</h1>
          <p className="text-sm leading-6 text-slate-600 sm:text-base">
            Secure role-based dashboard for users, financial records, and analytics. Sign in to
            access your workspace.
          </p>
          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-100 px-3 py-2">Viewer: Dashboard only</div>
            <div className="rounded-xl bg-slate-100 px-3 py-2">Analyst: Insights + records</div>
            <div className="rounded-xl bg-slate-100 px-3 py-2">Admin: Full management</div>
          </div>
        </section>

        <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-8" onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold text-slate-900">Sign In</h2>
          <p className="mt-1 text-sm text-slate-600">Use your credentials to continue.</p>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                className={`${inputClass} mt-1`}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                className={`${inputClass} mt-1`}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
          </div>

          <button className={`${buttonPrimary} mt-6 w-full`} type="submit" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
          </button>
          {error ? <div className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        </form>
      </div>
    </div>
  );
}

function toDateInput(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildTransactionQuery(filters) {
  const query = new URLSearchParams();
  if (filters.type) query.set("type", filters.type);
  if (filters.category.trim()) query.set("category", filters.category.trim());
  if (filters.from) query.set("from", new Date(filters.from).toISOString());
  if (filters.to) query.set("to", new Date(filters.to).toISOString());
  query.set("page", String(filters.page));
  query.set("pageSize", String(filters.pageSize));
  return query.toString();
}

export default function App() {
  const [auth, setAuth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [txMeta, setTxMeta] = useState({ page: 1, pageSize: 8, total: 0, totalPages: 1 });
  const [txFilters, setTxFilters] = useState({
    type: "",
    category: "",
    from: "",
    to: "",
    page: 1,
    pageSize: 8
  });
  const [txForm, setTxForm] = useState({
    id: "",
    amount: "",
    type: "INCOME",
    category: "Salary",
    occurredAt: new Date().toISOString().slice(0, 10),
    notes: ""
  });
  const [userForm, setUserForm] = useState({
    id: "",
    fullName: "",
    email: "",
    password: "",
    role: "VIEWER",
    status: "ACTIVE"
  });

  const headers = useMemo(() => {
    if (!auth?.token) {
      return null;
    }
    return authHeaders(auth.token);
  }, [auth]);

  const role = auth?.user?.role;
  const canViewRecords = role === "ADMIN" || role === "ANALYST";
  const canManageRecords = role === "ADMIN";
  const canManageUsers = role === "ADMIN";

  useEffect(() => {
    if (!auth?.token) return;
    if (role === "VIEWER") {
      setActiveTab("dashboard");
    }
  }, [auth, role]);

  async function loadSummary() {
    if (!headers) return;

    setLoadingSummary(true);
    setError("");
    try {
      const summaryData = await apiRequest("/dashboard/summary", { headers });
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || "Unable to load dashboard summary");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadTransactions(nextFilters = txFilters) {
    if (!headers || !canViewRecords) return;

    setLoadingTransactions(true);
    setError("");
    try {
      const query = buildTransactionQuery(nextFilters);
      const txData = await apiRequest(`/transactions?${query}`, { headers });
      setTransactions(txData.items || []);
      setTxMeta(
        txData.pagination || {
          page: nextFilters.page,
          pageSize: nextFilters.pageSize,
          total: txData.items?.length || 0,
          totalPages: 1
        }
      );
    } catch (err) {
      setError(err.message || "Unable to load transactions");
    } finally {
      setLoadingTransactions(false);
    }
  }

  async function loadUsers() {
    if (!headers || !canManageUsers) return;

    setLoadingUsers(true);
    setError("");
    try {
      const data = await apiRequest("/users", { headers });
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Unable to load users");
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (!headers) return;
    loadSummary();
  }, [headers]);

  useEffect(() => {
    if (!headers || !canViewRecords) return;
    loadTransactions(txFilters);
  }, [headers, canViewRecords, txFilters.page]);

  useEffect(() => {
    if (!headers || !canManageUsers) return;
    loadUsers();
  }, [headers, canManageUsers]);

  async function saveTransaction(event) {
    event.preventDefault();
    if (!headers || !canManageRecords) {
      return;
    }

    setError("");
    setFeedback("");

    const payload = {
      amount: Number(txForm.amount),
      type: txForm.type,
      category: txForm.category,
      occurredAt: new Date(txForm.occurredAt).toISOString(),
      notes: txForm.notes || null
    };

    try {
      if (txForm.id) {
        await apiRequest(`/transactions/${txForm.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload)
        });
        setFeedback("Transaction updated");
      } else {
        await apiRequest("/transactions", {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
        setFeedback("Transaction created");
      }

      setTxForm({
        id: "",
        amount: "",
        type: "INCOME",
        category: "Salary",
        occurredAt: new Date().toISOString().slice(0, 10),
        notes: ""
      });

      await Promise.all([loadSummary(), loadTransactions({ ...txFilters, page: 1 })]);
      setTxFilters((prev) => ({ ...prev, page: 1 }));
    } catch (err) {
      setError(err.message || "Unable to save transaction");
    }
  }

  async function deleteTransaction(id) {
    if (!headers || !canManageRecords) return;

    setError("");
    setFeedback("");
    try {
      await apiRequest(`/transactions/${id}`, {
        method: "DELETE",
        headers
      });
      setFeedback("Transaction deleted");
      await Promise.all([loadSummary(), loadTransactions(txFilters)]);
    } catch (err) {
      setError(err.message || "Unable to delete transaction");
    }
  }

  function startEditTransaction(item) {
    setTxForm({
      id: item.id,
      amount: Number(item.amount).toFixed(2),
      type: item.type,
      category: item.category,
      occurredAt: toDateInput(item.occurredAt),
      notes: item.notes || ""
    });
  }

  async function applyTransactionFilters(event) {
    event.preventDefault();
    const next = { ...txFilters, page: 1 };
    setTxFilters(next);
    await loadTransactions(next);
  }

  async function saveUser(event) {
    event.preventDefault();
    if (!headers || !canManageUsers) return;

    setError("");
    setFeedback("");

    try {
      if (userForm.id) {
        const payload = {
          fullName: userForm.fullName,
          role: userForm.role,
          status: userForm.status
        };
        if (userForm.password.trim()) {
          payload.password = userForm.password.trim();
        }
        await apiRequest(`/users/${userForm.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload)
        });
        setFeedback("User updated");
      } else {
        await apiRequest("/users", {
          method: "POST",
          headers,
          body: JSON.stringify({
            fullName: userForm.fullName,
            email: userForm.email,
            password: userForm.password,
            role: userForm.role,
            status: userForm.status
          })
        });
        setFeedback("User created");
      }

      setUserForm({
        id: "",
        fullName: "",
        email: "",
        password: "",
        role: "VIEWER",
        status: "ACTIVE"
      });

      await loadUsers();
    } catch (err) {
      setError(err.message || "Unable to save user");
    }
  }

  function startEditUser(user) {
    setUserForm({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status
    });
  }

  function resetUserForm() {
    setUserForm({
      id: "",
      fullName: "",
      email: "",
      password: "",
      role: "VIEWER",
      status: "ACTIVE"
    });
  }

  if (!auth) {
    return <LoginView onLogin={setAuth} />;
  }

  const tabs = [
    { key: "dashboard", label: "Dashboard", show: true },
    { key: "records", label: "Records", show: canViewRecords },
    { key: "users", label: "Users", show: canManageUsers }
  ].filter((tab) => tab.show);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-cyan-50 to-emerald-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 md:py-6">
        <section className={`${panelClass} flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between`}>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">
            Signed in as {auth.user.fullName} ({auth.user.role}, {auth.user.status})
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={
                  activeTab === tab.key
                    ? "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
                    : buttonMuted
                }
              >
                {tab.label}
              </button>
            ))}
            <button className={buttonPrimary} onClick={() => setAuth(null)}>
              Logout
            </button>
          </div>
        </section>

        {error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm text-rose-700">
            {error}
          </section>
        ) : null}
        {feedback ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
            {feedback}
          </section>
        ) : null}

      {activeTab === "dashboard" ? (
        <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <article className={panelClass}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Income</h3>
                <strong className="mt-2 block text-2xl font-semibold text-slate-900">
                  {currency.format(summary?.totals?.income || 0)}
                </strong>
            </article>
              <article className={panelClass}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Expenses</h3>
                <strong className="mt-2 block text-2xl font-semibold text-slate-900">
                  {currency.format(summary?.totals?.expense || 0)}
                </strong>
            </article>
              <article className={panelClass}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net Balance</h3>
                <strong className="mt-2 block text-2xl font-semibold text-slate-900">
                  {currency.format(summary?.totals?.net || 0)}
                </strong>
            </article>
          </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <article className={panelClass}>
                <h3 className="text-lg font-semibold text-slate-900">Top Categories</h3>
                <ul className="mt-3 space-y-2">
                {(summary?.categoryTotals || []).map((item) => (
                    <li
                      key={item.category}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                    <span>{item.category}</span>
                      <strong>{currency.format(item.total)}</strong>
                  </li>
                ))}
              </ul>
            </article>

              <article className={panelClass}>
                <h3 className="text-lg font-semibold text-slate-900">Daily Trend (Last 30 Days)</h3>
                <ul className="mt-3 space-y-2">
                {(summary?.monthlyTrend || []).slice(-8).map((item) => (
                    <li
                      key={item.day}
                      className="flex flex-col justify-between gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm sm:flex-row sm:items-center"
                    >
                    <span>{item.day}</span>
                    <span>
                      +{currency.format(item.income)} / -{currency.format(item.expense)}
                    </span>
                  </li>
                ))}
                  {(summary?.monthlyTrend || []).length === 0 ? (
                    <li className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
                      No trend data yet
                    </li>
                  ) : null}
              </ul>
            </article>
          </section>

            <section className={panelClass}>
              <h3 className="text-lg font-semibold text-slate-900">
                Recent Activity {loadingSummary ? "(Refreshing...)" : ""}
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                  {(summary?.recentActivity || []).map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="whitespace-nowrap px-3 py-2">{new Date(item.occurredAt).toLocaleDateString()}</td>
                        <td className="whitespace-nowrap px-3 py-2">{item.type}</td>
                        <td className="whitespace-nowrap px-3 py-2">{item.category}</td>
                        <td className="whitespace-nowrap px-3 py-2">{currency.format(Number(item.amount))}</td>
                        <td className="px-3 py-2">{item.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {activeTab === "records" && canViewRecords ? (
        <>
            <section className={panelClass}>
              <h3 className="text-lg font-semibold text-slate-900">Record Filters</h3>
              <form className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={applyTransactionFilters}>
              <select
                className={inputClass}
                value={txFilters.type}
                onChange={(event) => setTxFilters((prev) => ({ ...prev, type: event.target.value }))}
              >
                <option value="">All Types</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
              <input
                className={inputClass}
                placeholder="Category"
                value={txFilters.category}
                onChange={(event) =>
                  setTxFilters((prev) => ({ ...prev, category: event.target.value }))
                }
              />
              <input
                className={inputClass}
                type="date"
                value={txFilters.from}
                onChange={(event) => setTxFilters((prev) => ({ ...prev, from: event.target.value }))}
              />
              <input
                className={inputClass}
                type="date"
                value={txFilters.to}
                onChange={(event) => setTxFilters((prev) => ({ ...prev, to: event.target.value }))}
              />
                <button className={buttonPrimary} type="submit">Apply Filters</button>
            </form>
          </section>

          {canManageRecords ? (
              <section className={panelClass}>
                <h3 className="text-lg font-semibold text-slate-900">
                  {txForm.id ? "Update Transaction" : "Create Transaction"}
                </h3>
                <form className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2" onSubmit={saveTransaction}>
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Amount"
                  value={txForm.amount}
                  onChange={(event) => setTxForm((prev) => ({ ...prev, amount: event.target.value }))}
                  required
                />
                <select
                  className={inputClass}
                  value={txForm.type}
                  onChange={(event) => setTxForm((prev) => ({ ...prev, type: event.target.value }))}
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
                <input
                  className={inputClass}
                  placeholder="Category"
                  value={txForm.category}
                  onChange={(event) => setTxForm((prev) => ({ ...prev, category: event.target.value }))}
                  required
                />
                <input
                  className={inputClass}
                  type="date"
                  value={txForm.occurredAt}
                  onChange={(event) =>
                    setTxForm((prev) => ({ ...prev, occurredAt: event.target.value }))
                  }
                  required
                />
                <textarea
                  className={`${inputClass} lg:col-span-2`}
                  placeholder="Notes"
                  value={txForm.notes}
                  onChange={(event) => setTxForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
                  <div className="flex flex-wrap gap-2 lg:col-span-2">
                    <button className={buttonPrimary} type="submit">{txForm.id ? "Update" : "Save"}</button>
                  {txForm.id ? (
                    <button
                      type="button"
                        className={buttonMuted}
                      onClick={() =>
                        setTxForm({
                          id: "",
                          amount: "",
                          type: "INCOME",
                          category: "Salary",
                          occurredAt: new Date().toISOString().slice(0, 10),
                          notes: ""
                        })
                      }
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </form>
            </section>
          ) : null}

            <section className={panelClass}>
              <h3 className="text-lg font-semibold text-slate-900">
                Financial Records {loadingTransactions ? "(Refreshing...)" : ""}
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Notes</th>
                      {canManageRecords ? <th className="px-3 py-2">Actions</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                  {transactions.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="whitespace-nowrap px-3 py-2">{new Date(item.occurredAt).toLocaleDateString()}</td>
                        <td className="whitespace-nowrap px-3 py-2">{item.type}</td>
                        <td className="whitespace-nowrap px-3 py-2">{item.category}</td>
                        <td className="whitespace-nowrap px-3 py-2">{currency.format(Number(item.amount))}</td>
                        <td className="px-3 py-2">{item.notes || "-"}</td>
                      {canManageRecords ? (
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" className={buttonMuted} onClick={() => startEditTransaction(item)}>
                              Edit
                            </button>
                            <button
                              type="button"
                                className={buttonDanger}
                              onClick={() => deleteTransaction(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              <div className="mt-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                  className={buttonMuted}
                disabled={txMeta.page <= 1}
                onClick={() =>
                  setTxFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Previous
              </button>
                <span className="text-sm text-slate-600">
                Page {txMeta.page} of {txMeta.totalPages} (Total: {txMeta.total})
              </span>
              <button
                type="button"
                  className={buttonMuted}
                disabled={txMeta.page >= txMeta.totalPages}
                onClick={() =>
                  setTxFilters((prev) => ({ ...prev, page: Math.min(txMeta.totalPages, prev.page + 1) }))
                }
              >
                Next
              </button>
            </div>
          </section>
        </>
      ) : null}

      {activeTab === "users" && canManageUsers ? (
        <>
            <section className={panelClass}>
              <h3 className="text-lg font-semibold text-slate-900">
                {userForm.id ? "Update User" : "Create User"}
              </h3>
              <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={saveUser}>
              <input
                className={inputClass}
                placeholder="Full Name"
                value={userForm.fullName}
                onChange={(event) => setUserForm((prev) => ({ ...prev, fullName: event.target.value }))}
                required
              />
              <input
                className={inputClass}
                type="email"
                placeholder="Email"
                value={userForm.email}
                onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                disabled={Boolean(userForm.id)}
                required
              />
              <input
                className={inputClass}
                type="password"
                placeholder={userForm.id ? "New Password (optional)" : "Password"}
                value={userForm.password}
                onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                required={!userForm.id}
              />
              <select
                className={inputClass}
                value={userForm.role}
                onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
              >
                <option value="VIEWER">Viewer</option>
                <option value="ANALYST">Analyst</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select
                className={inputClass}
                value={userForm.status}
                onChange={(event) => setUserForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <button className={buttonPrimary} type="submit">{userForm.id ? "Update User" : "Create User"}</button>
                {userForm.id ? (
                    <button type="button" className={buttonMuted} onClick={resetUserForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>

            <section className={panelClass}>
              <h3 className="text-lg font-semibold text-slate-900">
                User Management {loadingUsers ? "(Refreshing...)" : ""}
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Created</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {users.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="whitespace-nowrap px-3 py-2">{item.fullName}</td>
                        <td className="whitespace-nowrap px-3 py-2">{item.email}</td>
                        <td className="whitespace-nowrap px-3 py-2">{item.role}</td>
                        <td className="whitespace-nowrap px-3 py-2">{item.status}</td>
                        <td className="whitespace-nowrap px-3 py-2">{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <button type="button" className={buttonMuted} onClick={() => startEditUser(item)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
      </div>
    </main>
  );
}
