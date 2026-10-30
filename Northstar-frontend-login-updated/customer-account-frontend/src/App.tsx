import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  CreditCard,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';

import Login from './Login';
import './styles.css';

type Customer = {
  id: number;
  name: string;
  email: string;
};

type Account = {
  id: number;
  customerId: number;
  accountNumber: string;
  type: string | null;
  balance: number;
};

type Section = 'overview' | 'customers' | 'accounts';

type Notice = {
  kind: 'success' | 'error';
  text: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

async function api<T>(url: string, init?: RequestInit, onUnauthorized?: () => void): Promise<T> {
  const token = sessionStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body.message || body.error || message;
    } catch {
      // Server returned empty or non-JSON response
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(sessionStorage.getItem('token')));
  const [section, setSection] = useState<Section>('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const [modal, setModal] = useState<'customer' | 'account' | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [accountCustomerId, setAccountCustomerId] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [balance, setBalance] = useState('0');
  const [saving, setSaving] = useState(false);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('role');
    setCustomers([]);
    setAccounts([]);
    setNotice(null);
    setIsLoggedIn(false);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [customerRows, accountRows] = await Promise.all([
        api<Customer[]>('/api/customers', undefined, handleLogout),
        api<Account[]>('/api/accounts', undefined, handleLogout),
      ]);

      setCustomers(customerRows || []);
      setAccounts(accountRows || []);
      setNotice(null);
    } catch (error) {
      setNotice({
        kind: 'error',
        text: `Could not load data. ${error instanceof Error ? error.message : ''}`,
      });
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void loadData();
  }, [loadData, isLoggedIn]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        `${customer.name} ${customer.email} ${customer.id}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [customers, search],
  );

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        `${account.id} ${account.customerId} ${account.accountNumber} ${account.type ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [accounts, search],
  );

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0,
  );

  async function submitCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await api<Customer>(
        '/api/customers',
        {
          method: 'POST',
          body: JSON.stringify({
            name: customerName.trim(),
            email: customerEmail.trim(),
          }),
        },
        handleLogout,
      );

      setNotice({ kind: 'success', text: 'Customer created successfully.' });
      setModal(null);
      setCustomerName('');
      setCustomerEmail('');
      await loadData();
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Could not create customer.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const customerIdText = accountCustomerId.trim().replace(/^CUS-/i, '');
      const customerId = Number(customerIdText);

      if (!Number.isInteger(customerId) || customerId <= 0) {
        throw new Error('Enter a valid Customer ID, such as 1 or CUS-0001.');
      }

      const amount = Number(balance);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Balance must be greater than zero.');
      }

      await api<Account>(
        '/api/accounts',
        {
          method: 'POST',
          body: JSON.stringify({
            customerId,
            type: accountType,
            balance: amount,
          }),
        },
        handleLogout,
      );

      setNotice({ kind: 'success', text: 'Account created successfully.' });
      setModal(null);
      setAccountCustomerId('');
      setAccountType('Savings');
      setBalance('0');
      await loadData();
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Could not create account.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(id: number) {
    if (!window.confirm(`Delete customer #${id}?`)) return;

    try {
      await api<void>(`/api/customers/${id}`, { method: 'DELETE' }, handleLogout);
      setNotice({ kind: 'success', text: 'Customer deleted.' });
      await loadData();
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Could not delete customer.',
      });
    }
  }

  async function deleteAccount(id: number) {
    if (!window.confirm(`Delete account #${id}?`)) return;

    try {
      await api<void>(`/api/accounts/${id}`, { method: 'DELETE' }, handleLogout);
      setNotice({ kind: 'success', text: 'Account deleted.' });
      await loadData();
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Could not delete account.',
      });
    }
  }

  const navItems: {
    id: Section;
    label: string;
    icon: typeof LayoutDashboard;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
  ];

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Building2 size={21} />
          </div>
          <div>
            <strong>ClientHub</strong>
            <span>MANAGEMENT SUITE</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${section === item.id ? 'active' : ''}`}
              onClick={() => {
                setSection(item.id);
                setSearch('');
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.id === 'customers' && <small>{customers.length}</small>}
              {item.id === 'accounts' && <small>{accounts.length}</small>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="service-status">
            <span
              className={`status-dot ${notice?.kind === 'error' ? 'offline' : ''}`}
            />
            <div>
              <strong>Backend services</strong>
              <p>
                {loading
                  ? 'Checking connection...'
                  : notice?.kind === 'error'
                  ? 'Check connection'
                  : 'Connection checked'}
              </p>
            </div>
            <button
              aria-label="Refresh data"
              className="icon-button"
              onClick={() => void loadData()}
            >
              <RefreshCw size={15} />
            </button>
          </div>

          <div className="sidebar-foot">
            React + TypeScript <span>•</span> Spring Boot APIs
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{' '}
            <strong>
              {navItems.find((item) => item.id === section)?.label}
            </strong>
          </div>

          <div className="top-actions">
            <button
              type="button"
              onClick={handleLogout}
              className="button button-secondary logout-button"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">CUSTOMER & ACCOUNT PLATFORM</div>
              <h1>
                {section === 'overview'
                  ? 'Good day, welcome back'
                  : section === 'customers'
                  ? 'Customers'
                  : 'Accounts'}
              </h1>
              <p>
                {section === 'overview'
                  ? "Here's what's happening across your services today."
                  : section === 'customers'
                  ? 'Manage customer profiles and contact information.'
                  : 'View and manage customer account records.'}
              </p>
            </div>

            <div className="heading-actions">
              <button
                className="button button-secondary"
                onClick={() => void loadData()}
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              {section !== 'overview' && (
                <button
                  className="button button-primary"
                  onClick={() =>
                    setModal(section === 'customers' ? 'customer' : 'account')
                  }
                >
                  <Plus size={17} />
                  Add {section === 'customers' ? 'customer' : 'account'}
                </button>
              )}
            </div>
          </div>

          {notice && (
            <div className={`notice ${notice.kind}`}>
              <span>
                {notice.kind === 'success' ? (
                  <Check size={17} />
                ) : (
                  <CircleAlert size={17} />
                )}
              </span>
              <p>{notice.text}</p>
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {section === 'overview' && (
            <>
              <div className="stats-grid">
                <StatCard
                  label="Total customers"
                  value={String(customers.length)}
                  note="Customer records"
                  icon={<Users size={19} />}
                  tone="violet"
                  trend="Live data"
                />

                <StatCard
                  label="Total accounts"
                  value={String(accounts.length)}
                  note="Account records"
                  icon={<CreditCard size={19} />}
                  tone="blue"
                  trend="Live data"
                />

                <StatCard
                  label="Combined balance"
                  value={currency.format(totalBalance)}
                  note="Across listed accounts"
                  icon={<Wallet size={19} />}
                  tone="green"
                  trend="Calculated"
                />

                <StatCard
                  label="Service status"
                  value={
                    loading
                      ? 'Checking'
                      : notice?.kind === 'error'
                      ? 'Review'
                      : 'Connected'
                  }
                  note="Customer + Account APIs"
                  icon={<Activity size={19} />}
                  tone="orange"
                  trend={
                    loading
                      ? 'Please wait'
                      : notice?.kind === 'error'
                      ? 'Needs attention'
                      : 'Last request OK'
                  }
                />
              </div>

              <div className="content-grid">
                <section className="panel recent-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent customers</h2>
                      <p>Latest customer records from the API</p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setSection('customers')}
                    >
                      View all <ArrowUpRight size={15} />
                    </button>
                  </div>

                  {loading ? (
                    <Loading />
                  ) : customers.length === 0 ? (
                    <EmptyState
                      title="No customers yet"
                      description="Create a customer to see records here."
                    />
                  ) : (
                    <div className="recent-list">
                      {customers
                        .slice(-5)
                        .reverse()
                        .map((customer) => (
                          <div className="recent-row" key={customer.id}>
                            <div className="person-avatar">
                              {customer.name
                                .trim()
                                .split(/\s+/)
                                .map((word) => word[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>

                            <div className="person-info">
                              <strong>{customer.name}</strong>
                              <span>{customer.email}</span>
                            </div>

                            <span className="id-tag">
                              CUS-{String(customer.id).padStart(4, '0')}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </section>

                <section className="panel service-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Service connections</h2>
                      <p>Configured local API targets</p>
                    </div>

                    <div className="soft-icon">
                      <Activity size={18} />
                    </div>
                  </div>

                  <div className="service-row">
                    <div className="service-icon purple">
                      <Users size={18} />
                    </div>
                    <div className="service-copy">
                      <strong>Customer Service</strong>
                      <span>/api/customers</span>
                    </div>
                    <span className="port-tag">:8081</span>
                  </div>

                  <div className="service-row">
                    <div className="service-icon blue">
                      <CreditCard size={18} />
                    </div>
                    <div className="service-copy">
                      <strong>Account Service</strong>
                      <span>/api/accounts</span>
                    </div>
                    <span className="port-tag">:8082</span>
                  </div>

                  <div className="service-note">
                    <CircleAlert size={16} />
                    <p>
                      Run both Spring Boot services before using create or
                      delete actions.
                    </p>
                  </div>
                </section>
              </div>

              <div className="panel quick-actions">
                <div>
                  <h2>Quick actions</h2>
                  <p>Jump into your everyday tasks.</p>
                </div>

                <button
                  className="quick-action"
                  onClick={() => {
                    setSection('customers');
                    setModal('customer');
                  }}
                >
                  <span className="quick-icon purple">
                    <Users size={18} />
                  </span>
                  <span>
                    <strong>Add a customer</strong>
                    <small>Create a new customer profile</small>
                  </span>
                  <Plus size={17} />
                </button>

                <button
                  className="quick-action"
                  onClick={() => {
                    setSection('accounts');
                    setModal('account');
                  }}
                >
                  <span className="quick-icon blue">
                    <CreditCard size={18} />
                  </span>
                  <span>
                    <strong>Create an account</strong>
                    <small>Add an account record</small>
                  </span>
                  <Plus size={17} />
                </button>
              </div>
            </>
          )}

          {section === 'customers' && (
            <section className="panel table-panel">
              <div className="table-toolbar">
                <div>
                  <h2>
                    All customers{' '}
                    <span className="count-badge">
                      {filteredCustomers.length}
                    </span>
                  </h2>
                  <p>Customer details retrieved from Customer Service.</p>
                </div>

                <div className="search-box">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search customers..."
                  />
                </div>
              </div>

              {loading ? (
                <Loading />
              ) : filteredCustomers.length === 0 ? (
                <EmptyState
                  title="No matching customers"
                  description={
                    customers.length
                      ? 'Try a different search term.'
                      : 'Add your first customer to get started.'
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>CUSTOMER</th>
                        <th>CUSTOMER ID</th>
                        <th>EMAIL ADDRESS</th>
                        <th className="right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td>
                            <div className="table-person">
                              <div className="person-avatar">
                                {customer.name
                                  .trim()
                                  .split(/\s+/)
                                  .map((word) => word[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <strong>{customer.name}</strong>
                            </div>
                          </td>
                          <td>
                            <span className="id-tag">
                              CUS-{String(customer.id).padStart(4, '0')}
                            </span>
                          </td>
                          <td>{customer.email}</td>
                          <td className="right">
                            <button
                              className="delete-button"
                              title="Delete customer"
                              aria-label={`Delete ${customer.name}`}
                              onClick={() => void deleteCustomer(customer.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {section === 'accounts' && (
            <section className="panel table-panel">
              <div className="table-toolbar">
                <div>
                  <h2>
                    All accounts{' '}
                    <span className="count-badge">
                      {filteredAccounts.length}
                    </span>
                  </h2>
                  <p>Account details retrieved from Account Service.</p>
                </div>

                <div className="search-box">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search accounts..."
                  />
                </div>
              </div>

              {loading ? (
                <Loading />
              ) : filteredAccounts.length === 0 ? (
                <EmptyState
                  title="No matching accounts"
                  description={
                    accounts.length
                      ? 'Try a different search term.'
                      : 'Create an account to get started.'
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ACCOUNT NUMBER</th>
                        <th>ACCOUNT ID</th>
                        <th>CUSTOMER ID</th>
                        <th>TYPE</th>
                        <th className="right">BALANCE</th>
                        <th className="right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((account) => (
                        <tr key={account.id}>
                          <td>
                            <div className="table-person">
                              <div className="account-avatar">
                                <CreditCard size={17} />
                              </div>
                              <strong>
                                {account.accountNumber || `Account #${account.id}`}
                              </strong>
                            </div>
                          </td>
                          <td>
                            <span className="id-tag">
                              ACC-{String(account.id).padStart(4, '0')}
                            </span>
                          </td>
                          <td>
                            CUS-{String(account.customerId).padStart(4, '0')}
                          </td>
                          <td>
                            <span className="type-chip">
                              {account.type ?? 'Not specified'}
                            </span>
                          </td>
                          <td className="right money-cell">
                            {currency.format(Number(account.balance || 0))}
                          </td>
                          <td className="right">
                            <button
                              className="delete-button"
                              title="Delete account"
                              aria-label={`Delete account ${account.id}`}
                              onClick={() => void deleteAccount(account.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          <footer className="page-footer">
            <span>
              ClientHub <span className="footer-dot">•</span> Customer & Account Management
            </span>
            <span>Data is loaded from your Spring Boot backend</span>
          </footer>
        </div>
      </main>

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModal(null);
            }
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <div className="eyebrow">NEW RECORD</div>
                <h2 id="modal-title">
                  Add {modal === 'customer' ? 'customer' : 'account'}
                </h2>
                <p>
                  {modal === 'customer'
                    ? "Enter the customer's contact details."
                    : 'Enter the account information below.'}
                </p>
              </div>

              <button
                className="icon-button close-button"
                aria-label="Close dialog"
                onClick={() => {
                  if (!saving) setModal(null);
                }}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            {modal === 'customer' ? (
              <form
                onSubmit={(event) => void submitCustomer(event)}
                className="modal-form"
              >
                <label>
                  Full name
                  <input
                    autoFocus
                    required
                    maxLength={100}
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="e.g. Ananya Sharma"
                  />
                </label>

                <label>
                  Email address
                  <input
                    required
                    type="email"
                    maxLength={150}
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    placeholder="ananya@example.com"
                  />
                </label>

                <div className="form-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setModal(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                    Create customer
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(event) => void submitAccount(event)}
                className="modal-form"
              >
                <label>
                  Customer ID
                  <input
                    autoFocus
                    required
                    value={accountCustomerId}
                    onChange={(event) =>
                      setAccountCustomerId(event.target.value)
                    }
                    placeholder="e.g. 1 or CUS-0001"
                  />
                </label>

                <label>
                  Account type
                  <div className="select-wrap">
                    <select
                      value={accountType}
                      onChange={(event) => setAccountType(event.target.value)}
                    >
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                      <option value="Salary">Salary</option>
                      <option value="Fixed Deposit">Fixed Deposit</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </label>

                <label>
                  Initial balance (₹)
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={balance}
                    onChange={(event) => setBalance(event.target.value)}
                  />
                </label>

                <div className="form-hint">
                  <CircleAlert size={15} />
                  Enter an existing customer ID and a positive opening balance.
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setModal(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                    Create account
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon,
  tone,
  trend,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  tone: string;
  trend: string;
}) {
  return (
    <section className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${tone}`}>{icon}</div>
        <span className="stat-trend">
          {trend === 'Needs attention' ? (
            <ArrowDownRight size={13} />
          ) : (
            <ArrowUpRight size={13} />
          )}
          {trend}
        </span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </section>
  );
}

function Loading() {
  return (
    <div className="loading-state">
      <LoaderCircle className="spin" size={22} />
      <span>Loading records...</span>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Building2 size={22} />
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}