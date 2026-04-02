import { useState, useEffect } from 'react';
import api from '../api/axios';

const INTEGRITY_LABELS = {
    ration_cards_without_wallet: 'Ration cards without wallet',
    ration_cards_without_members: 'Ration cards without family members',
    orphaned_family_members: 'Orphaned family members',
    shops_without_area: 'Shops without area',
    negative_wallet_balances: 'Negative wallet balances',
    suspicious_transactions: 'Suspicious transactions (>50kg)',
    duplicate_card_numbers: 'Duplicate card numbers',
    unlinked_beneficiary_users: 'Unlinked beneficiary users',
};

const SECURITY_LABELS = {
    helmet_headers: 'Helmet security headers',
    rate_limiting: 'Rate limiting configured',
    otp_cleanup: 'OTP expiry cleanup',
    users_without_password: 'Users without password hash',
    duplicate_beneficiary_mobile: 'Duplicate beneficiary mobile',
    anonymous_transactions: 'Anonymous transactions',
};

const CHECKLIST_ITEMS = [
    'AAY card allocation confirmed (35kg flat)',
    'BPL card allocation confirmed (5kg × family size)',
    'APL card allocation confirmed (correct kg × family size)',
    'Double claim prevention tested and working',
    'Cross-shop transaction rejection confirmed',
    'Entitlement idempotency confirmed (ran twice, second was skipped)',
    'Schema fields finalized (no more renames)',
    'node-pg-migrate configured and tested',
    'Helmet + rate limiting confirmed active',
    'Joi validation on all critical endpoints',
];

const STORAGE_KEY = 'pds_validation_checklist';

const loadChecklist = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

const StatusBadge = ({ status }) => {
    if (status === 'pass') {
        return (
            <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-900 text-green-300">
                ✓ Pass
            </span>
        );
    }
    if (status === 'warn') {
        return (
            <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-yellow-900 text-yellow-300">
                ⚠ Warning
            </span>
        );
    }
    return (
        <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-red-900 text-red-300">
            ✗ Fail
        </span>
    );
};

const CheckTable = ({ checks, labels, expanded, onToggle }) => (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                    <th className="px-4 py-3 text-left">Check</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Detail</th>
                </tr>
            </thead>
            <tbody>
                {checks.map((c) => {
                    const hasRows = c.rows && c.rows.length > 0;
                    const detail = c.detail || (c.count > 0 ? `${c.count} issues found` : null);
                    return (
                        <>
                            <tr key={c.check} className="border-t border-gray-800 hover:bg-gray-800/40 transition">
                                <td className="px-4 py-3 text-gray-200">{labels[c.check] || c.check}</td>
                                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                <td className="px-4 py-3">
                                    {c.status === 'pass' && <span className="text-gray-500">—</span>}
                                    {c.status !== 'pass' && detail && (
                                        <span className="flex items-center gap-2">
                                            <span className={c.status === 'warn' ? 'text-yellow-400' : 'text-red-400'}>
                                                {detail}
                                            </span>
                                            {hasRows && (
                                                <button
                                                    type="button"
                                                    onClick={() => onToggle(c.check)}
                                                    className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-0.5"
                                                >
                                                    {expanded[c.check] ? 'Hide' : 'Show'}
                                                </button>
                                            )}
                                        </span>
                                    )}
                                </td>
                            </tr>
                            {expanded[c.check] && hasRows && (
                                <tr key={`${c.check}-expand`} className="bg-gray-800/60">
                                    <td colSpan={3} className="px-6 py-3">
                                        <table className="w-full text-xs text-gray-300">
                                            <thead>
                                                <tr>
                                                    {Object.keys(c.rows[0]).map((col) => (
                                                        <th key={col} className="text-left py-1 pr-4 text-gray-500 uppercase">{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {c.rows.map((row, i) => (
                                                    // biome-ignore lint/suspicious/noArrayIndexKey: static list
                                                    <tr key={i} className="border-t border-gray-700">
                                                        {Object.values(row).map((val, j) => (
                                                            // biome-ignore lint/suspicious/noArrayIndexKey: static list
                                                            <td key={j} className="py-1 pr-4">{String(val)}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            )}
                        </>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const Validation = () => {
    const [integrityLoading, setIntegrityLoading] = useState(false);
    const [integrityResult, setIntegrityResult] = useState(null);
    const [integrityError, setIntegrityError] = useState('');

    const [securityLoading, setSecurityLoading] = useState(false);
    const [securityResult, setSecurityResult] = useState(null);
    const [securityError, setSecurityError] = useState('');

    const [expanded, setExpanded] = useState({});
    const [checklist, setChecklist] = useState(loadChecklist);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(checklist));
    }, [checklist]);

    const runIntegrityCheck = async () => {
        setIntegrityLoading(true);
        setIntegrityError('');
        setIntegrityResult(null);
        try {
            const { data } = await api.get('/api/admin/validation/integrity');
            setIntegrityResult(data);
        } catch (err) {
            setIntegrityError(err.response?.data?.detail || err.response?.data?.error || 'Check failed.');
        } finally {
            setIntegrityLoading(false);
        }
    };

    const runSecurityCheck = async () => {
        setSecurityLoading(true);
        setSecurityError('');
        setSecurityResult(null);
        try {
            const { data } = await api.get('/api/admin/validation/security');
            setSecurityResult(data);
        } catch (err) {
            setSecurityError(err.response?.data?.detail || err.response?.data?.error || 'Check failed.');
        } finally {
            setSecurityLoading(false);
        }
    };

    const toggleExpand = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    const toggleChecklist = (item) => setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));

    const completedCount = CHECKLIST_ITEMS.filter((item) => checklist[item]).length;
    const allChecked = completedCount === CHECKLIST_ITEMS.length;

    // Readiness score
    const integrityReady = integrityResult?.blockchain_ready === true;
    const securityReady = securityResult?.security_ready === true;
    const checklistReady = allChecked;
    const readyCount = [integrityReady, securityReady, checklistReady].filter(Boolean).length;
    const allReady = readyCount === 3;

    return (
        <div className="p-8 bg-gray-950 min-h-screen text-white">
            <h1 className="text-2xl font-bold">Pre-Blockchain Validation</h1>
            <p className="text-sm text-gray-400 mt-1">
                Run all checks before enabling blockchain integration
            </p>

            {/* ── Integrity Section ─────────────────────────────────────────── */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-gray-200">Integrity Checks</h2>
                    <button
                        type="button"
                        onClick={runIntegrityCheck}
                        disabled={integrityLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                    >
                        {integrityLoading ? 'Running checks...' : 'Run Integrity Check'}
                    </button>
                </div>

                {!integrityResult && !integrityLoading && (
                    <div className="rounded-xl bg-gray-800 border border-gray-700 px-5 py-4 text-gray-400 text-sm mb-3">
                        Run integrity check to see blockchain readiness
                    </div>
                )}
                {integrityResult?.blockchain_ready && (
                    <div className="rounded-xl bg-green-900/50 border border-green-700 px-5 py-3 text-green-300 text-sm font-medium mb-3">
                        ✅ System is blockchain ready! All 8 checks passed.
                    </div>
                )}
                {integrityResult && !integrityResult.blockchain_ready && (
                    <div className="rounded-xl bg-red-900/50 border border-red-700 px-5 py-3 text-red-300 text-sm font-medium mb-3">
                        ❌ Not ready. {integrityResult.summary.failed} check{integrityResult.summary.failed !== 1 ? 's' : ''} failed.
                    </div>
                )}
                {integrityError && (
                    <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm mb-3">
                        {integrityError}
                    </div>
                )}
                {integrityResult && (
                    <CheckTable
                        checks={integrityResult.checks}
                        labels={INTEGRITY_LABELS}
                        expanded={expanded}
                        onToggle={toggleExpand}
                    />
                )}
            </div>

            {/* ── Security Section ──────────────────────────────────────────── */}
            <div className="mt-10">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-gray-200">Security Checks</h2>
                    <button
                        type="button"
                        onClick={runSecurityCheck}
                        disabled={securityLoading}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                    >
                        {securityLoading ? 'Running checks...' : 'Run Security Check'}
                    </button>
                </div>

                {!securityResult && !securityLoading && (
                    <div className="rounded-xl bg-gray-800 border border-gray-700 px-5 py-4 text-gray-400 text-sm mb-3">
                        Run security check to validate system hardening
                    </div>
                )}
                {securityResult?.security_ready && securityResult.summary.warnings === 0 && (
                    <div className="rounded-xl bg-green-900/50 border border-green-700 px-5 py-3 text-green-300 text-sm font-medium mb-3">
                        ✅ Security validated. No failures or warnings.
                    </div>
                )}
                {securityResult?.security_ready && securityResult.summary.warnings > 0 && (
                    <div className="rounded-xl bg-yellow-900/50 border border-yellow-700 px-5 py-3 text-yellow-300 text-sm font-medium mb-3">
                        ⚠ Security checks passed with {securityResult.summary.warnings} warning{securityResult.summary.warnings !== 1 ? 's' : ''}.
                    </div>
                )}
                {securityResult && !securityResult.security_ready && (
                    <div className="rounded-xl bg-red-900/50 border border-red-700 px-5 py-3 text-red-300 text-sm font-medium mb-3">
                        ❌ Security issues found. {securityResult.summary.failed} check{securityResult.summary.failed !== 1 ? 's' : ''} failed.
                    </div>
                )}
                {securityError && (
                    <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm mb-3">
                        {securityError}
                    </div>
                )}
                {securityResult && (
                    <CheckTable
                        checks={securityResult.checks}
                        labels={SECURITY_LABELS}
                        expanded={expanded}
                        onToggle={toggleExpand}
                    />
                )}
            </div>

            {/* ── Manual Checklist ──────────────────────────────────────────── */}
            <div className="mt-10">
                <h2 className="text-base font-semibold text-gray-200">Manual Validation Checklist</h2>
                <p className="text-sm text-gray-400 mt-1">Complete these before blockchain integration</p>

                <div className="mt-4 bg-gray-900 rounded-2xl border border-gray-800 p-5 flex flex-col gap-3">
                    {CHECKLIST_ITEMS.map((item) => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!checklist[item]}
                                onChange={() => toggleChecklist(item)}
                                className="w-4 h-4 accent-green-500 cursor-pointer"
                            />
                            <span className={`text-sm ${checklist[item] ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                                {item}
                            </span>
                        </label>
                    ))}
                </div>
                <p className="mt-3 text-sm text-gray-400">{completedCount} / {CHECKLIST_ITEMS.length} completed</p>
            </div>

            {/* ── Readiness Score ───────────────────────────────────────────── */}
            <div className="mt-10 bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <h2 className="text-base font-semibold text-gray-200 mb-1">Blockchain Readiness Score</h2>
                <p className="text-sm text-gray-500 mb-5">{readyCount} / 3 systems ready</p>

                <div className="flex flex-col gap-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                        <span>{integrityReady ? '🟢' : '🔴'}</span>
                        <span className={integrityReady ? 'text-green-300' : 'text-red-400'}>
                            Integrity Checks (all 8 pass)
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span>{securityReady ? '🟢' : '🔴'}</span>
                        <span className={securityReady ? 'text-green-300' : 'text-red-400'}>
                            Security Checks (0 failures)
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span>{checklistReady ? '🟢' : '🔴'}</span>
                        <span className={checklistReady ? 'text-green-300' : 'text-red-400'}>
                            Manual Checklist (all {CHECKLIST_ITEMS.length} checked)
                        </span>
                    </div>
                </div>

                <div className="text-center py-4 border-t border-gray-800">
                    {allReady ? (
                        <p className="text-green-400 text-lg font-semibold">🚀 Ready for blockchain integration</p>
                    ) : (
                        <p className="text-yellow-400 text-base font-medium">⚠ Complete all checks before proceeding</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Validation;
