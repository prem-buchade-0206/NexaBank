import { useState, useCallback } from 'react';
import { FileText, Download, Printer, Search } from 'lucide-react';
import { MOCK_ACCOUNTS, MOCK_TRANSACTIONS } from '../../utils/mockData';
import { formatCurrency, formatDate, downloadCSV } from '../../utils';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import DatePicker from '../../components/common/DatePicker';
import { StatusBadge, TransactionTypeBadge } from '../../components/common/Badge';

const ACCOUNT_OPTIONS = MOCK_ACCOUNTS.map(a => ({
  value: a.id,
  label: `${a.customerName} — ••${a.accountNumber.slice(-4)} (${a.type.replace('_', ' ')})`,
}));

const StatementsPage = () => {
  const toast = useToast();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statement, setStatement] = useState(null);

  const generate = useCallback(async () => {
    if (!selectedAccount) { toast.error('Please select an account'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const account = MOCK_ACCOUNTS.find(a => a.id === selectedAccount);
    let txns = MOCK_TRANSACTIONS.filter(t => t.accountId === selectedAccount);
    if (dateFrom) txns = txns.filter(t => new Date(t.createdAt) >= new Date(dateFrom));
    if (dateTo) txns = txns.filter(t => new Date(t.createdAt) <= new Date(dateTo));
    txns.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const totalCredit = txns.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const totalDebit = txns.filter(t => t.type !== 'deposit').reduce((s, t) => s + t.amount, 0);
    setStatement({ account, transactions: txns, totalCredit, totalDebit, generatedAt: new Date() });
    setGenerated(true);
    setLoading(false);
    toast.success('Statement generated');
  }, [selectedAccount, dateFrom, dateTo, toast]);

  const handleExport = () => {
    if (!statement) return;
    downloadCSV(statement.transactions.map(t => ({
      Date: formatDate(t.createdAt, 'datetime'), 'TXN ID': t.txnId,
      Description: t.description, Type: t.type,
      Debit: t.type !== 'deposit' ? t.amount : '',
      Credit: t.type === 'deposit' ? t.amount : '',
      Balance: t.balance, Status: t.status,
    })), `statement_${statement.account.accountNumber}_${Date.now()}.csv`);
    toast.success('Statement exported');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Statements</h1>
          <p className="page-subtitle">Generate and download detailed account statements</p>
        </div>
        {generated && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" icon={<Printer size={15} />} onClick={() => window.print()}>Print</Button>
            <Button variant="primary" icon={<Download size={15} />} onClick={handleExport}>Export CSV</Button>
          </div>
        )}
      </div>

      {/* ── Filter Card ── */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', marginBottom: 16 }}>
          Generate Statement
        </h3>
        <div className="grid-statement-filters">

          {/* Account selector */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label required">Account</label>
            <Select
              value={selectedAccount}
              onChange={e => { setSelectedAccount(e.target.value); setGenerated(false); }}
              options={ACCOUNT_OPTIONS}
              placeholder="Select account…"
            />
          </div>

          {/* From date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">From Date</label>
            <DatePicker
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setGenerated(false); }}
              placeholder="Select from date"
              maxDate={dateTo || undefined}
            />
          </div>

          {/* To date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">To Date</label>
            <DatePicker
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setGenerated(false); }}
              placeholder="Select to date"
              minDate={dateFrom || undefined}
            />
          </div>

          <Button variant="primary" icon={<Search size={15} />} onClick={generate} loading={loading}>
            Generate
          </Button>
        </div>
      </div>

      {/* ── Statement Output ── */}
      {generated && statement && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }} id="statement-print">

          {/* Header */}
          <div style={{ background: 'var(--color-primary)', padding: '24px 28px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>Account Statement</h2>
                <p style={{ opacity: 0.8, fontSize: 13 }}>NexaBank — Secure Banking Platform</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>Generated On</p>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{formatDate(statement.generatedAt, 'datetime')}</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="grid-statement-info" style={{ padding: '20px 28px', borderBottom: '1px solid var(--color-border)' }}>
            {[
              ['Account Holder', statement.account.customerName],
              ['Account Number', statement.account.accountNumber],
              ['Account Type', statement.account.type.replace('_', ' ')],
              ['Branch', statement.account.branch],
            ].map(([label, val]) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Summary Bar */}
          <div style={{ padding: '16px 28px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Credits', value: `+${formatCurrency(statement.totalCredit)}`, color: 'var(--color-success)' },
              { label: 'Total Debits', value: `-${formatCurrency(statement.totalDebit)}`, color: 'var(--color-danger)' },
              { label: 'Transactions', value: statement.transactions.length, color: 'var(--color-text)' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>{s.label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'Poppins, sans-serif' }}>{s.value}</p>
              </div>
            ))}
            <div style={{ marginLeft: 'auto' }}>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Current Balance</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'Poppins, sans-serif' }}>{formatCurrency(statement.account.balance)}</p>
            </div>
          </div>

          {/* Transactions */}
          {statement.transactions.length === 0 ? (
            <div style={{ padding: '48px 28px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No transactions found for the selected period</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>TXN ID</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Debit</th>
                    <th style={{ textAlign: 'right' }}>Credit</th>
                    <th style={{ textAlign: 'right' }}>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.transactions.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(t.createdAt, 'datetime')}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text-subtle)' }}>{t.txnId}</td>
                      <td style={{ fontSize: 13 }}>{t.description}</td>
                      <td><TransactionTypeBadge type={t.type} /></td>
                      <td style={{ textAlign: 'right', color: 'var(--color-danger)', fontWeight: 600, fontSize: 13 }}>
                        {t.type !== 'deposit' ? formatCurrency(t.amount) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 600, fontSize: 13 }}>
                        {t.type === 'deposit' ? formatCurrency(t.amount) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13, fontFamily: 'Poppins, sans-serif' }}>{formatCurrency(t.balance)}</td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatementsPage;