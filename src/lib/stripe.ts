import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;
  
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  
  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
  });
  
  return stripeInstance;
}

export { getStripe };

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: {
      ideasPerDay: 5,
      platformsCount: 1,
      scheduling: 'basic',
      history: '7days',
      toneCustomization: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 9,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    features: {
      ideasPerDay: -1,
      platformsCount: -1,
      scheduling: 'advanced',
      history: 'unlimited',
      toneCustomization: true,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

export interface SubscriptionStatus {
  plan: PlanType;
  isActive: boolean;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
}

export async function getSubscription(userId: string): Promise<SubscriptionStatus> {
  const stripe = getStripe();
  
  const customers = await stripe.customers.list({
    email: userId,
    limit: 1,
  });

  if (customers.data.length === 0) {
    return { plan: 'free', isActive: true, currentPeriodEnd: null, cancelAt: null };
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customers.data[0].id,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return { plan: 'free', isActive: true, currentPeriodEnd: null, cancelAt: null };
  }

  const sub = subscriptions.data[0];
  const currentPeriodEnd = (sub as any).current_period_end || (sub as any).currentPeriodEnd;
  const cancelAt = (sub as any).cancel_at || (sub as any).cancelAt;
  
  return {
    plan: 'pro',
    isActive: sub.status === 'active',
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
    cancelAt: cancelAt ? new Date(cancelAt * 1000) : null,
  };
}

export async function checkQuota(userId: string, feature: string): Promise<{ canProceed: boolean; reason?: string }> {
  const subscription = await getSubscription(userId);
  
  if (subscription.plan === 'pro') {
    return { canProceed: true };
  }

  switch (feature) {
    case 'ideas':
      return { canProceed: false, reason: 'Upgrade to Pro for unlimited ideas' };
    case 'platforms':
      return { canProceed: false, reason: 'Upgrade to Pro to unlock all platforms' };
    case 'history':
      return { canProceed: false, reason: 'Upgrade to Pro for full history access' };
    default:
      return { canProceed: true };
  }
}