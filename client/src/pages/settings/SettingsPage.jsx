import { useState } from 'react';
import { Sun, Moon, Monitor, User, Bell, Shield, Save, Check, Lock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { ROLE_LABELS } from '../../constants';

/* ── All sub-components defined OUTSIDE SettingsPage ────────
   If defined inside, every keystroke re-creates them → React
   unmounts/remounts → inputs lose focus.                     */

const SectionCard = ({ title, description, children }) => (
  <div className="card" style={{ padding: 24, marginBottom: 16 }}>
    {(title || description) && (
      <div style={{ marginBottom: 20 }}>
        {title && <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif' }}>{title}</h3>}
        {description && <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 3 }}>{description}</p>}
      </div>
    )}
    {children}
  </div>
);

const Toggle = ({ label, description, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
    <div style={{ paddingRight: 24 }}>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4 }}>{label}</p>
      {description && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3, lineHeight: 1.5 }}>{description}</p>}
    </div>
    <button
      role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      style={{
        width: 48, height: 26, flexShrink: 0, borderRadius: 13,
        border: '2px solid transparent', outline: 'none', cursor: 'pointer', padding: 0,
        position: 'relative',
        backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
        boxShadow: checked ? '0 0 0 3px var(--color-primary-light)' : '0 0 0 0px transparent',
        transition: 'background-color 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <span style={{
        display: 'block', position: 'absolute', top: '50%', left: 2,
        width: 18, height: 18, borderRadius: '50%', backgroundColor: '#ffffff',
        boxShadow: checked ? '0 2px 6px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.18)',
        transform: checked ? 'translate(22px,-50%)' : 'translate(0px,-50%)',
        transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
        willChange: 'transform',
      }} />
    </button>
  </div>
);

const SETTING_TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'appearance', label: 'Appearance', icon: Sun },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
];

const SettingsPage = () => {
  const { preference, setTheme, isSystem } = useTheme();
  const { user, updateUser, isAuditor } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', email: user?.email || '',
    phone: '', branch: user?.branch || '',
  });
  const [notifPrefs, setNotifPrefs] = useState({
    deposits: true, withdrawals: true, transfers: true, loans: true, system: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    updateUser({ name: profileForm.name });
    toast.success('Profile updated successfully');
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences and system settings</p>
        </div>
      </div>

      <div className="grid-settings">
        {/* Tab list */}
        <div className="card" style={{ padding: 8 }}>
          {SETTING_TABS
            .filter(tab => !(isAuditor && tab.key === 'security'))
            .map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px',
                  borderRadius: 8, border: 'none',
                  background: activeTab === tab.key ? 'var(--color-primary-light)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  fontSize: 14, cursor: 'pointer', transition: 'all 0.15s ease',
                  textAlign: 'left', marginBottom: 2,
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
        </div>

        {/* Content */}
        <div>
          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <>
              {isAuditor && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 10, marginBottom: 16 }}>
                  <Lock size={16} style={{ color: 'var(--color-warning-dark)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning-dark)', marginBottom: 2 }}>Read-only access</p>
                    <p style={{ fontSize: 12, color: 'var(--color-warning-dark)', opacity: 0.85, lineHeight: 1.5 }}>Auditors cannot modify profile information.</p>
                  </div>
                </div>
              )}
              <SectionCard title="Profile Information" description={isAuditor ? 'Your profile details — view only' : 'Update your personal details'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                  <Avatar name={user?.name} size="xl" />
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif' }}>{user?.name}</p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{ROLE_LABELS[user?.role]} · {user?.branch}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 4 }}>{user?.email}</p>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" value={profileForm.name}
                      onChange={e => !isAuditor && setProfileForm(p => ({ ...p, name: e.target.value }))}
                      readOnly={isAuditor} style={isAuditor ? { cursor: 'not-allowed', opacity: 0.65 } : {}} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-control" value={profileForm.email} readOnly style={{ cursor: 'not-allowed', opacity: 0.65 }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-control" value={profileForm.phone}
                      onChange={e => !isAuditor && setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder={isAuditor ? '—' : '+91 98765 43210'}
                      readOnly={isAuditor} style={isAuditor ? { cursor: 'not-allowed', opacity: 0.65 } : {}} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <input className="form-control" value={profileForm.branch} readOnly style={{ cursor: 'not-allowed', opacity: 0.65 }} />
                  </div>
                </div>
                {!isAuditor && (
                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="primary" icon={<Save size={15} />} onClick={handleSaveProfile} loading={saving}>Save Changes</Button>
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {/* ── Appearance ── */}
          {activeTab === 'appearance' && (
            <SectionCard title="Theme Preference" description="Choose how NexaBank looks — applied instantly.">
              <div className="grid-3" style={{ marginBottom: 20 }}>
                {[
                  { key: 'light', label: 'Light', desc: 'Warm ivory — clean and professional', Icon: Sun, preview: ['#f5f4f0', '#fdfcfb', '#4f46e5'] },
                  { key: 'dark', label: 'Dark', desc: 'Deep navy — premium fintech feel', Icon: Moon, preview: ['#07090f', '#0d1117', '#6366f1'] },
                  { key: 'system', label: 'System', desc: 'Automatically follows your OS setting', Icon: Monitor, preview: ['#f5f4f0', '#0d1117', '#818cf8'] },
                ].map(({ key, label, desc, Icon, preview }) => {
                  const isActive = preference === key;
                  return (
                    <button key={key} onClick={() => setTheme(key)}
                      className={isActive ? 'theme-card-active' : ''}
                      style={{
                        padding: 0, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                        border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: 'var(--color-surface)', overflow: 'hidden',
                        boxShadow: isActive ? 'var(--shadow-primary)' : 'var(--shadow-xs)',
                        transform: isActive ? 'translateY(-2px)' : 'none',
                        transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
                      }}
                    >
                      <div style={{ height: 70, background: key === 'system' ? `linear-gradient(135deg,${preview[0]} 50%,${preview[1]} 50%)` : preview[0], borderBottom: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, background: key === 'dark' || key === 'system' ? '#0d1117' : '#1e1b4b' }}>
                          {[0, 1, 2, 3].map(i => <div key={i} style={{ margin: '6px 4px', height: 4, borderRadius: 2, background: i === 1 ? preview[2] : 'rgba(255,255,255,0.15)' }} />)}
                        </div>
                        <div style={{ marginLeft: 32, display: 'flex', gap: 4 }}>
                          {[preview[2], '#059669', '#d97706'].map((c, i) => (
                            <div key={i} style={{ width: 28, height: 30, borderRadius: 5, background: key === 'dark' ? '#161b22' : '#fdfcfb', border: `1px solid ${key === 'dark' ? 'rgba(255,255,255,0.08)' : '#e0ddd8'}`, borderTop: `3px solid ${c}` }} />
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: isActive ? 'var(--color-primary)' : 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon size={12} style={{ color: isActive ? '#fff' : 'var(--color-text-muted)' }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? 'var(--color-primary)' : 'var(--color-text)', fontFamily: 'Poppins, sans-serif' }}>{label}</span>
                          </div>
                          {isActive && <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="#fff" strokeWidth={3} /></div>}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {isSystem && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', borderRadius: 10, fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>
                  <Monitor size={15} />
                  System theme active — switches automatically when your OS preference changes.
                </div>
              )}
            </SectionCard>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <SectionCard title="Notification Preferences" description="Choose which events you want to be notified about">
              <Toggle label="Deposit Alerts" description="Get notified when a deposit is made" checked={notifPrefs.deposits} onChange={v => setNotifPrefs(p => ({ ...p, deposits: v }))} />
              <Toggle label="Withdrawal Alerts" description="Get notified when a withdrawal is made" checked={notifPrefs.withdrawals} onChange={v => setNotifPrefs(p => ({ ...p, withdrawals: v }))} />
              <Toggle label="Transfer Alerts" description="Get notified when a transfer occurs" checked={notifPrefs.transfers} onChange={v => setNotifPrefs(p => ({ ...p, transfers: v }))} />
              <Toggle label="Loan Updates" description="Notifications for loan approvals and payments" checked={notifPrefs.loans} onChange={v => setNotifPrefs(p => ({ ...p, loans: v }))} />
              <Toggle label="System Alerts" description="Critical system-level notifications" checked={notifPrefs.system} onChange={v => setNotifPrefs(p => ({ ...p, system: v }))} />
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={() => toast.success('Preferences saved')} icon={<Save size={15} />}>Save Preferences</Button>
              </div>
            </SectionCard>
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && !isAuditor && (
            <SectionCard title="Security Settings" description="Manage your password and security preferences">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-control" placeholder="••••••••" /></div>
                <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-control" placeholder="••••••••" /></div>
                <div className="form-group"><label className="form-label">Confirm New Password</label><input type="password" className="form-control" placeholder="••••••••" /></div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" onClick={() => toast.success('Password changed')} icon={<Shield size={15} />}>Update Password</Button>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;