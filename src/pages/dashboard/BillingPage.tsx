import { useEffect, useState } from 'react';
import { CreditCard, AlertCircle, Check, Zap } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState, ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import { getBilling, upgradePlan, cancelPlan } from '@/lib/dashboard';
import { ApiError } from '@/lib/apiClient';
import type { Billing as BillingType, BillingPlan } from '@/lib/types';

const FALLBACK_PLANS: BillingPlan[] = [
  { id: 'free', name: 'Free', price: 0, verifications: '1,000 verifications/month', features: ['1,000 verifications/month', 'Basic device intelligence', 'Community support'], custom: false },
  { id: 'developer', name: 'Developer', price: 29, verifications: '10,000 verifications/month', features: ['10,000 verifications/month', 'Full device intelligence', 'Webhooks', 'Email support'], custom: false },
  { id: 'growth', name: 'Growth', price: 99, verifications: '50,000 verifications/month', features: ['50,000 verifications/month', 'Advanced analytics', 'Priority webhooks', 'Priority support'], popular: true, custom: false },
  { id: 'scale', name: 'Scale', price: 299, verifications: '250,000 verifications/month', features: ['250,000 verifications/month', 'Custom rules', 'SLA', 'Dedicated support'], custom: false },
  { id: 'enterprise', name: 'Enterprise', price: 0, verifications: 'Configurable', features: ['Configurable volume', 'Custom SLA', 'On-premise option', 'Dedicated engineer'], custom: true },
];

export default function BillingPage() {
  const [data, setData] = useState<BillingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getBilling();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load billing info.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUpgrade = async (planId: string) => {
    setActionError('');
    setBusy(planId);
    try {
      await upgradePlan(planId);
      const res = await getBilling();
      setData(res);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to change plan.');
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    setActionError('');
    if (!confirm('Are you sure you want to cancel your subscription? You will be moved to the Free plan at the end of the current billing period.')) return;
    setBusy('cancel');
    try {
      await cancelPlan();
      const res = await getBilling();
      setData(res);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to cancel plan.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardPageHeader title="Billing" description="Manage your subscription and plan" />
        <LoadingState />
      </>
    );
  }

  const plans = data?.plans?.length ? data.plans : FALLBACK_PLANS;
  const currentPlanName = data?.currentPlanName || data?.currentPlan || '';

  return (
    <>
      <DashboardPageHeader title="Billing" description="Manage your subscription and plan" />
      {error ? (
        <div className="card p-6">
          <EmptyState icon={<AlertCircle size={24} />} title="Couldn't load billing info" description={error} />
        </div>
      ) : (
        <div className="space-y-6">
          {actionError && <ErrorBanner message={actionError} />}

          {currentPlanName && (
            <div className="card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <CreditCard size={20} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Current Plan</p>
                    <p className="text-lg font-bold text-slate-900">{currentPlanName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {data?.status && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      data.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${data.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {data.status}
                    </span>
                  )}
                  {data?.cancelAtPeriodEnd && (
                    <span className="text-xs text-amber-600">Cancels at period end</span>
                  )}
                  {currentPlanName !== 'Free' && (
                    <button onClick={handleCancel} disabled={busy === 'cancel'} className="btn-secondary text-sm">
                      {busy === 'cancel' ? <Spinner size={16} /> : 'Cancel Plan'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {plans.map((plan) => {
              const isCurrent = currentPlanName.toLowerCase() === plan.name.toLowerCase();
              return (
                <div
                  key={plan.id}
                  className={`card relative flex flex-col p-6 ${plan.popular ? 'border-brand-300 ring-1 ring-brand-200' : ''}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {plan.custom ? 'Custom' : `$${plan.price}`}
                    {!plan.custom && <span className="text-sm font-normal text-slate-400">/mo</span>}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{plan.verifications}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5">
                    {isCurrent ? (
                      <button disabled className="btn-secondary w-full cursor-default opacity-60">
                        Current Plan
                      </button>
                    ) : plan.custom ? (
                      <a href="mailto:sales@chirographverify.com" className="btn-secondary w-full">
                        Contact Sales
                      </a>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={busy === plan.id}
                        className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {busy === plan.id ? <Spinner size={16} /> : isCurrent ? 'Current Plan' : `Choose ${plan.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-2.5">
              <Zap size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                Payments are processed securely by Flutterwave. Plan changes are handled by the backend to ensure accurate billing.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
