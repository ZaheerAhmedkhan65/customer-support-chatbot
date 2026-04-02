const express = require('express');
const jwt = require('jsonwebtoken');
const Subscription = require('../models/Subscription');
const Usage = require('../models/Usage');
const pool = require('../config/database');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1] || req.query.token;
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

/**
 * GET /api/subscription/plans
 * Get all available pricing plans
 */
router.get('/plans', (req, res) => {
    try {
        const plans = Subscription.getAllPlans().map(plan => ({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
            billingPeriod: plan.billingPeriod,
            limits: plan.limits
        }));
        
        res.json({ success: true, plans });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});

/**
 * GET /api/subscription/current
 * Get current user's subscription
 */
router.get('/current', authenticateToken, async (req, res) => {
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
 * GET /api/subscription/usage
 * Get current user's usage statistics
 */
router.get('/usage', authenticateToken, async (req, res) => {
    try {
        const usageStats = await Usage.getUsageStats(req.user.id);
        res.json({ success: true, usage: usageStats });
    } catch (error) {
        console.error('Error fetching usage:', error);
        res.status(500).json({ error: 'Failed to fetch usage statistics' });
    }
});

/**
 * POST /api/subscription/upgrade
 * Upgrade subscription to a higher plan
 */
router.post('/upgrade', authenticateToken, async (req, res) => {
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
 * POST /api/subscription/downgrade
 * Downgrade subscription to a lower plan
 */
router.post('/downgrade', authenticateToken, async (req, res) => {
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
 * POST /api/subscription/cancel
 * Cancel subscription (revert to free)
 */
router.post('/cancel', authenticateToken, async (req, res) => {
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
 * GET /api/subscription/check-limit
 * Check if user has exceeded their usage limit
 */
router.get('/check-limit', authenticateToken, async (req, res) => {
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
 * GET /api/subscription/limits
 * Get subscription limits for the current user
 */
router.get('/limits', authenticateToken, async (req, res) => {
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
 * POST /api/subscription/verify-payment
 * Verify payment and activate subscription (webhook endpoint)
 * In production, this would be called by Stripe/PayPal webhook
 */
router.post('/verify-payment', authenticateToken, async (req, res) => {
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