const jwt = require('jsonwebtoken');
const Subscription = require('../models/Subscription');
const Usage = require('../models/Usage');
const pool = require('../config/database');
const authenticate = require('../middleware/auth');
const router = require('./base')();

/**
 * GET /subscription/plans
 * Get all available pricing plans
 */
router.get('/plans', async (req, res) => {
    try {
        let currentSubscription = false;

        if (req.user) {
            currentSubscription = await Subscription.findByUserId(req.user.id);
        }

        const plans = Subscription.getAllPlans().map(plan => ({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
            billingPeriod: plan.billingPeriod,
            limits: plan.limits,
            features: plan.features,
            isCurrent: currentSubscription && currentSubscription.plan_id === plan.id
        }));

        res.json({ success: true, plans });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

/**
 * GET /subscription/current
 * Get current user's subscription
 */
router.get('/current', authenticate, async (req, res) => {
    try {
        const subscription = await Subscription.findByUserId(req.user.id);
        const usageStats = await Usage.getUsageStats(req.user.id);

        res.json({
            success: true,
            subscription: subscription ? {
                id: subscription.subscription_id,
                plan: subscription.plan_id,
                planName: subscription.plan.name,
                status: subscription.status,
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end
            } : null,
            usage: usageStats
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});

/**
 * GET /subscription/usage
 * Get current user's usage statistics
 */
router.get('/usage', authenticate, async (req, res) => {
    try {
        const usageStats = await Usage.getUsageStats(req.user.id);
        res.json({ success: true, usage: usageStats });
    } catch (error) {
        console.error('Error fetching usage:', error);
        res.status(500).json({ error: 'Failed to fetch usage statistics' });
    }
});

/**
 * POST /subscription/upgrade
 * Upgrade subscription to a higher plan
 */
router.post('/upgrade', authenticate, async (req, res) => {
    try {
        const { planId } = req.body;

        if (!planId || !['professional', 'enterprise'].includes(planId)) {
            return res.status(400).json({ error: 'Invalid plan ID' });
        }

        // In a real implementation, this would integrate with a payment processor
        // For now, we'll directly upgrade (demo mode)
        const result = await Subscription.updatePlan(req.user.id, planId);

        res.json({
            success: true,
            message: `Successfully upgraded to ${Subscription.getPlan(planId).name} plan`,
            subscription: result
        });
    } catch (error) {
        console.error('Error upgrading subscription:', error);
        res.status(500).json({ error: 'Failed to upgrade subscription' });
    }
});

/**
 * POST /subscription/downgrade
 * Downgrade subscription to a lower plan
 */
router.post('/downgrade', authenticate, async (req, res) => {
    try {
        const { planId } = req.body;

        if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }

        const result = await Subscription.updatePlan(req.user.id, planId);

        res.json({
            success: true,
            message: `Subscription changed to ${Subscription.getPlan(planId).name} plan`,
            subscription: result
        });
    } catch (error) {
        console.error('Error downgrading subscription:', error);
        res.status(500).json({ error: 'Failed to change subscription' });
    }
});

/**
 * POST /subscription/cancel
 * Cancel subscription (revert to free)
 */
router.post('/cancel', authenticate, async (req, res) => {
    try {
        const result = await Subscription.cancel(req.user.id);

        res.json({
            success: true,
            message: 'Subscription canceled. You will remain on your current plan until the end of the billing period.',
            subscription: result
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

/**
 * GET /subscription/check-limit
 * Check if user has exceeded their usage limit
 */
router.get('/check-limit', authenticate, async (req, res) => {
    try {
        const hasExceeded = await Usage.hasExceededLimit(req.user.id);
        const usageStats = await Usage.getUsageStats(req.user.id);

        res.json({
            success: true,
            hasExceededLimit: hasExceeded,
            usage: {
                conversations: usageStats.usage.conversations,
                limit: usageStats.limits.conversations,
                percentageUsed: usageStats.percentageUsed
            }
        });
    } catch (error) {
        console.error('Error checking limit:', error);
        res.status(500).json({ error: 'Failed to check usage limit' });
    }
});

/**
 * GET /subscription/limits
 * Get subscription limits for the current user
 */
router.get('/limits', authenticate, async (req, res) => {
    try {
        const limits = await Subscription.getLimits(req.user.id);
        const subscription = await Subscription.findByUserId(req.user.id);

        res.json({
            success: true,
            plan: subscription ? subscription.plan_id : 'free',
            limits
        });
    } catch (error) {
        console.error('Error fetching limits:', error);
        res.status(500).json({ error: 'Failed to fetch limits' });
    }
});

/**
 * POST /subscription/verify-payment
 * Verify payment and activate subscription (webhook endpoint)
 * In production, this would be called by Stripe/PayPal webhook
 */
router.post('/verify-payment', authenticate, async (req, res) => {
    try {
        const { paymentId, planId } = req.body;

        if (!paymentId || !planId) {
            return res.status(400).json({ error: 'Payment ID and plan ID are required' });
        }

        // In production, verify payment with payment processor
        // For demo, we'll just activate the subscription
        const result = await Subscription.updatePlan(req.user.id, planId);

        res.json({
            success: true,
            message: 'Payment verified and subscription activated',
            subscription: result
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

module.exports = router;