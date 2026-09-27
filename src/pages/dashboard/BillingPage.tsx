import { useEffect, useState } from 'react';
import { AlertCircle, Check, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { LoadingState, EmptyState, ErrorBanner } from '@/components/Feedback';
import Spinner from '@/components/Spinner';
import { getBilling, upgradePlan, cancelPlan } from '@/lib/dashboard';
import { describeError } from '@/lib/errors';
import type { Billing as BillingType, BillingPlan } from '@/lib/types';

const FALLBACK_PLANS: BillingPlan[] = [
  { id: 'free', name: 'Free', price: 0, verifications: '1,000 verifications/month', features: ['1,000 verifications/month', 'Basic device intelligence', 'Community support'], custom: false },
  { id: 'developer', name: 'Developer', price: 29, verifications: '10,000 verifications/month', features: ['10,000 verifications/month', 'Full device intelligence', 'Webhooks', 'Email support'], custom: false },
  { id: 'growth', name: 'Growth', price: 99, verifications: '50,000 verifications/month', features: ['50,000 verifications/month', 'Advanced analytics', 'Priority webhooks', 'Priority support'], popular: true, custom: false },
  { id: 'scale', name: 'Scale', price: 299, verifications: '250,000 verifications/month', features: ['250,000 verifications/month', 'Custom rules', 'SLA', 'Dedicated support'], custom: false },
  { id: 'enterprise', name: 'Enterprise', price: null, verifications: 'Configurable', features: ['Configurable volume', 'Custom SLA', 'On-premise option', 'Dedicated engineer'], custom: true },
];

/**
 * Per-tier feature bullets.
 *
 * The billing endpoint returns only the enforced catalog (id, name, price,
 * price_minor, price_label, monthly_limit, self_serve) — it sends no
 * `features` or `verifications` array, so plan.features is always undefined
 * at runtime and the cards rendered empty. These bullets are display copy
 * keyed by the same tier ids the server enforces; prices and limits always
 * come from the server payload and are never read from here.
 */
const TIER_FEATURES: Record<string, string[]> = {
  free: ['1,000 verifications / month', 'Device intelligence', 'Community support'],
  developer: ['10,000 verifications / month', 'Full device intelligence', 'Webhook delivery', 'Email support'],
  growth: ['50,000 verifications / month', 'Advanced analytics', 'Priority webhooks', 'Priority support'],
  scale: ['250,000 verifications / month', 'Custom verification rules', 'Uptime SLA', 'Dedicated support'],
  enterprise: ['Custom verification volume', 'Custom SLA', 'On-premise deployment', 'Dedicated engineer'],
};

/** Short line under the price. Falls back to the server's monthly_limit. */
function planAllowance(plan: BillingPlan): string {
  if (plan.verifications) return plan.verifications;
  if (typeof plan.monthly_limit === 'number') {
    return `${plan.monthly_limit.toLocaleString()} verifications / month`;
  }
  return '';
}

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
        if (!cancelled) setError(describeError(err, 'billing information'));
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
      const result = await upgradePlan(planId);
      // The backend starts a Flutterwave hosted checkout and returns its link in
      // `checkout_url`. Send the browser there immediately — do NOT re-fetch
      // billing state first: the tenant's plan is unchanged until Flutterwave
      // confirms payment, and the user is leaving the page.
      if (result?.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }
      // Defensive: a 200 without a checkout link means checkout never started.
      setActionError('Checkout could not be started. Please try again.');
    } catch (err) {
      setActionError(describeError(err, 'changing the plan'));
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
      setActionError(describeError(err, 'cancelling the plan'));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardPageHeader title="Plans" description="Choose the plan that fits your verification volume" />
        <LoadingState />
      </>
    );
  }

  const plans = data?.plans?.length ? data.plans : FALLBACK_PLANS;
  // Server-authoritative: the tier id comes from the session's effective
  // entitlement, never derived client-side from the catalog.
  const effectiveTier = (data?.effective_tier || data?.billing_tier || '').toLowerCase();
  const currentPlan = plans.find((p) => (p.tier || p.id || '').toLowerCase() === effectiveTier);
  const currentPlanName = currentPlan?.name || (data?.effective_tier || data?.billing_tier || '');
  const isPaidTier = effectiveTier !== '' && effectiveTier !== 'free';

  return (
    <>
      <DashboardPageHeader
        title="Plans"
        description="Choose the plan that fits your verification volume"
      />
      {error ? (
        <div className="card p-6">
          <EmptyState icon={<AlertCircle size={24} />} title="Couldn't load billing info" description={error} />
        </div>
      ) : (
        <div className="space-y-6">
          {actionError && <ErrorBanner message={actionError} />}

          {currentPlanName && (
            <div className="plan-card plan-card-current flex-row flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-line/30 bg-blue-soft/10">
                  <ShieldCheck size={20} strokeWidth={1.7} className="text-blue-text" />
                </span>
                <div>
                  <p className="text-[13px] text-secondary">Current plan</p>
                  <p className="mt-1 text-[19px] font-medium leading-none text-primary">{currentPlanName}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {data?.billing_status && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-semibold capitalize ${
                    data.billing_status === 'active'
                      ? 'bg-accent-500/10 text-accent-400'
                      : 'bg-surface-3 text-secondary'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      data.billing_status === 'active' ? 'bg-accent-500' : 'bg-line-strong'
                    }`} />
                    {data.billing_status}
                  </span>
                )}
                {data?.has_pending_payment && (
                  <span className="text-[13px] font-medium text-warning">Payment pending</span>
                )}
                {isPaidTier && (
                  <button onClick={handleCancel} disabled={busy === 'cancel'} className="plan-cta plan-cta-secondary h-9 w-auto px-4">
                    {busy === 'cancel' ? <Spinner size={14} /> : 'Cancel plan'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => {
              const planKey = (plan.tier || plan.id || '').toLowerCase();
              const isCurrent = planKey !== '' && planKey === effectiveTier.toLowerCase();
              // Backend contract: plan.name is the card title, plan.price is the
              // display price. Only an unknown price (null/undefined) means
              // custom/quote pricing (Enterprise) -> render "Custom".
              // self_serve must NOT feed this check: Free has self_serve false
              // but a real price of 0, so it must render $0/mo, not "Custom".
              const isCustom = typeof plan.price !== 'number';
              const isEnterprise = planKey === 'enterprise';
              const isFree = planKey === 'free';
              // Only self-serve tiers may attempt the upgrade endpoint.
              const canSelfServe = !isEnterprise && !isFree && plan.self_serve !== false;
              // The recommended card is the most popular paid tier that is
              // not already the current one, so the badge always points at a
              // plan the reader can actually act on.
              const isFeatured = planKey === 'growth' && !isCurrent;
              const features = TIER_FEATURES[planKey] || plan.features || [];
              const allowance = planAllowance(plan);
              return (
                <div
                  key={plan.id}
                  className={`plan-card ${
                    isFeatured ? 'plan-card-featured' : isCurrent ? 'plan-card-current' : ''
                  }`}
                >
                  {isFeatured && <span className="plan-glow" aria-hidden="true" />}

                  <div className="relative flex items-start justify-between gap-3">
                    <h3 className="plan-name">{plan.name || plan.tier || plan.id || 'Plan'}</h3>
                    {isCurrent && (
                      <span className="plan-badge plan-badge-current">
                        <Check size={11} strokeWidth={2.5} />
                        Current
                      </span>
                    )}
                    {isFeatured && (
                      <span className="plan-badge plan-badge-featured">Popular</span>
                    )}
                  </div>

                  <p className="plan-price relative">
                    {isCustom ? 'Custom' : `$${plan.price}`}
                    {!isCustom && (
                      <span className="ml-1 align-baseline text-[14px] font-normal text-text-micro">/mo</span>
                    )}
                  </p>

                  {allowance && (
                    <p className="relative mt-2.5 text-[13px] text-secondary">{allowance}</p>
                  )}

                  {features.length > 0 && (
                    <>
                      <div className="plan-divider relative my-5" />
                      <ul className="relative flex-1 space-y-2.5">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-secondary">
                            <Check
                              size={14}
                              strokeWidth={2.2}
                              className="mt-[3px] shrink-0 text-accent-400"
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="relative mt-6">
                    {isCurrent ? (
                      <button disabled className="plan-cta plan-cta-secondary">
                        Your current plan
                      </button>
                    ) : isFree ? (
                      // Free is the default/no-cost tier: never an upgrade action,
                      // never a sales action. Users move back to Free via Cancel.
                      <button disabled className="plan-cta plan-cta-secondary">
                        Included by default
                      </button>
                    ) : isEnterprise || isCustom || !canSelfServe ? (
                      // Enterprise / non-self-serve tiers must never attempt the
                      // self-serve upgrade endpoint (self_serve: false on backend).
                      <a href="mailto:sales@chirographverify.com" className="plan-cta plan-cta-secondary">
                        Contact sales
                      </a>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.tier || plan.id)}
                        disabled={busy === plan.id}
                        className={`plan-cta ${isFeatured ? 'plan-cta-primary' : 'plan-cta-secondary'}`}
                      >
                        {busy === plan.id ? (
                          <Spinner size={15} />
                        ) : (
                          <>
                            {isFeatured ? `Upgrade to ${plan.name || plan.tier}` : 'Upgrade'}
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="x-banner">
            <Zap size={16} className="shrink-0 text-warning" />
            <p className="flex-1 text-[13px] leading-relaxed text-secondary">
              Payments are processed securely by Flutterwave. Plan changes are applied by the backend
              once payment is confirmed, so your allowance never changes early.
            </p>
          </div>

          <div className="x-panel flex flex-col p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="section-title">Invoices</h3>
                <p className="mt-1 text-[13px] text-secondary">
                  Every charge and receipt for this account.
                </p>
              </div>
              <a
                href="/dashboard/billing/payments"
                className="inline-flex items-center gap-1 text-[13px] text-secondary transition-colors hover:text-primary"
              >
                View payments
                <ArrowRight size={13} />
              </a>
            </div>
            <div className="flex flex-1 items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-3 text-secondary">
                  <Check size={18} strokeWidth={1.8} />
                </div>
                <p className="text-[14px] text-secondary">No invoices yet</p>
                <p className="mt-1 text-[13px] text-text-micro">
                  Payment history will appear here after your first purchase
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
