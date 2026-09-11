import { useEffect, useState } from 'react';
import { AlertCircle, Check, Zap } from 'lucide-react';
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
  { id: 'enterprise', name: 'Enterprise', price: null, verifications: 'Configurable', features: ['Configurable volume', 'Custom SLA', 'On-premise option', 'Dedicated engineer'], custom: true },
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
    const key = planId.toLowerCase();
    // Never hit the self-serve upgrade endpoint for non-self-serve tiers.
    // The backend 400s on "enterprise", and Free is the default/no-cost tier.
    if (key === 'enterprise' || key === 'free') return;
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
                <div>
                  <p className="stat-label">Current Plan</p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-zinc-900">{currentPlanName}</p>
                </div>
                <div className="flex items-center gap-4">
                  {data?.status && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      data.status === 'active' ? 'bg-accent-50 text-accent-700' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${data.status === 'active' ? 'bg-accent-500' : 'bg-zinc-400'}`} />
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {plans.map((plan) => {
              const planName = (plan.name || '').toLowerCase();
              const current = (currentPlanName || '').toLowerCase();
              // Guard against a plan missing its `name` field so the comparison
              // degrades gracefully instead of throwing on .toLowerCase().
              const isCurrent = current !== '' && planName === current;
              // Backend contract: plan.name is the card title, plan.price is the
              // display price. Only an unknown price (null/undefined) means
              // custom/quote pricing (Enterprise) -> render "Custom".
              // self_serve must NOT feed this check: Free has self_serve false
              // but a real price of 0, so it must render $0/mo, not "Custom".
              // self_serve still controls button behavior below (canSelfServe).
              // typeof check covers both null and undefined without a TS
              // no-overlap complaint (price is typed `number | null`).
              const isCustom = typeof plan.price !== 'number';
              const planKey = (plan.tier || plan.id || '').toLowerCase();
              const isEnterprise = planKey === 'enterprise';
              const isFree = planKey === 'free';
              // Only self-serve tiers may attempt the upgrade endpoint.
              const canSelfServe = !isEnterprise && !isFree && plan.self_serve !== false;
              return (
                <div
                  key={plan.id}
                  className={`card relative flex flex-col p-7 ${plan.popular ? 'border-brand-300 ring-1 ring-brand-200 shadow-md' : ''}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                      Most Popular
                    </span>
                  )}
                  <h3 className="stat-label">{plan.name || plan.tier || plan.id || 'Plan'}</h3>
                  <p className="mt-3 stat-value">
                    {isCustom ? 'Custom' : `$${plan.price}`}
                    {!isCustom && <span className="font-sans text-sm font-normal text-zinc-400">/mo</span>}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {plan.verifications || (typeof plan.monthly_limit === 'number' ? `${plan.monthly_limit.toLocaleString()} verifications/month` : '')}
                  </p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {(plan.features || []).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-600">
                        <Check size={15} className="mt-0.5 shrink-0 text-accent-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    {isCurrent || (isFree && current === '') ? (
                      <button disabled className="btn-secondary w-full cursor-default opacity-60">
                        Current Plan
                      </button>
                    ) : isFree ? (
                      // Free is the default/no-cost tier: never an upgrade action,
                      // never a sales action. Users move back to Free via Cancel.
                      <button disabled className="btn-secondary w-full cursor-default opacity-60">
                        Free Plan
                      </button>
                    ) : isEnterprise || isCustom || !canSelfServe ? (
                      // Enterprise / non-self-serve tiers must never attempt the
                      // self-serve upgrade endpoint (self_serve: false on backend).
                      <a href="mailto:sales@chirographverify.com" className="btn-secondary w-full">
                        Contact Sales
                      </a>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.tier || plan.id)}
                        disabled={busy === plan.id}
                        className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {busy === plan.id ? <Spinner size={16} /> : isCurrent ? 'Current Plan' : `Choose ${plan.name || plan.tier || plan.id || 'this plan'}`}
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
