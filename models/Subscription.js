const pool = require('../config/database');

// Pricing plans configuration
const PLANS = {
    free: {
        id: 'free',
        name: 'Starter',
        price: 0,
        currency: 'USD',
        billingPeriod: 'monthly',
        limits: {
            conversationsPerMonth: 1000,
            knowledgeBaseItems: 50,
            customBranding: false,
            apiAccess: false,
            analytics: 'basic',
            support: 'email'
        }
    },
    professional: {
        id: 'professional',
        name: 'Professional',
        price: 7,
        currency: 'USD',
        billingPeriod: 'monthly',
        limits: {
            conversationsPerMonth: 5000,
            knowledgeBaseItems: 500,
            customBranding: true,
            apiAccess: true,
            analytics: 'advanced',
            support: 'priority'
        }
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: null, // Custom pricing
        currency: 'USD',
        billingPeriod: 'monthly',
        limits: {
            conversationsPerMonth: -1, // Unlimited
            knowledgeBaseItems: -1, // Unlimited
            customBranding: true,
            apiAccess: true,
            analytics: 'advanced',
            support: '24/7'
        }
    }
};

class Subscription {
    /**
     * Create a new subscription for a user
     */
    static async create(userId, planId = 'free') {
        const plan = PLANS[planId];
        if (!plan) {
            throw new Error('Invalid plan ID');
        }

        const subscriptionId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        await pool.execute(
            `INSERT INTO subscriptions (user_id, subscription_id, plan_id, status, current_period_start, current_period_end) 
             VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))`,
            [userId, subscriptionId, planId, 'active']
        );

        return { subscriptionId, planId, status: 'active' };
    }

    /**
     * Get subscription by user ID
     */
    static async findByUserId(userId) {
        const [rows] = await pool.execute(
            `SELECT * FROM subscriptions 
             WHERE user_id = ? AND status = 'active' 
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );
        
        if (rows.length === 0) {
            return null;
        }

        const subscription = rows[0];
        subscription.plan = PLANS[subscription.plan_id];
        return subscription;
    }

    /**
     * Get subscription by org_id
     */
    static async findByOrgId(orgId) {
        const [rows] = await pool.execute(
            `SELECT s.* FROM subscriptions s
             INNER JOIN users u ON s.user_id = u.id
             WHERE u.org_id = ? AND s.status = 'active'
             ORDER BY s.created_at DESC LIMIT 1`,
            [orgId]
        );
        
        if (rows.length === 0) {
            return null;
        }

        const subscription = rows[0];
        subscription.plan = PLANS[subscription.plan_id];
        return subscription;
    }

    /**
     * Get plan details
     */
    static getPlan(planId) {
        return PLANS[planId] || null;
    }

    /**
     * Get all available plans
     */
    static getAllPlans() {
        return Object.values(PLANS);
    }

    /**
     * Upgrade or downgrade a subscription
     */
    static async updatePlan(userId, newPlanId) {
        const newPlan = PLANS[newPlanId];
        if (!newPlan) {
            throw new Error('Invalid plan ID');
        }

        // Deactivate current subscription
        await pool.execute(
            `UPDATE subscriptions SET status = 'canceled', canceled_at = NOW() 
             WHERE user_id = ? AND status = 'active'`,
            [userId]
        );

        // Create new subscription
        return await Subscription.create(userId, newPlanId);
    }

    /**
     * Cancel a subscription (revert to free)
     */
    static async cancel(userId) {
        await pool.execute(
            `UPDATE subscriptions SET status = 'canceled', canceled_at = NOW() 
             WHERE user_id = ? AND status = 'active'`,
            [userId]
        );

        // Create free subscription
        return await Subscription.create(userId, 'free');
    }

    /**
     * Check if subscription is active
     */
    static async isActive(userId) {
        const subscription = await Subscription.findByUserId(userId);
        return subscription !== null && subscription.status === 'active';
    }

    /**
     * Get subscription limits for a user
     */
    static async getLimits(userId) {
        const subscription = await Subscription.findByUserId(userId);
        if (!subscription) {
            return PLANS.free.limits;
        }
        return subscription.plan.limits;
    }

    /**
     * Check if a feature is available for a user
     */
    static async hasFeature(userId, feature) {
        const limits = await Subscription.getLimits(userId);
        return limits[feature] === true || (limits[feature] && limits[feature] !== 'basic');
    }
}

module.exports = Subscription;
module.exports.PLANS = PLANS;