package domain

import "context"

// SubscriptionRepository provides database operations for subscriptions and quotas
type SubscriptionRepository interface {
	// Subscription operations
	GetSubscriptionByOrgID(ctx context.Context, organizationID int32) (*Subscription, error)
	UpsertSubscription(ctx context.Context, subscription *Subscription) (*Subscription, error)
	DeleteSubscription(ctx context.Context, organizationID int32) error

	// Quota operations
	GetQuotaByOrgID(ctx context.Context, organizationID int32) (*QuotaTracking, error)
	UpsertQuota(ctx context.Context, quota *QuotaTracking) (*QuotaTracking, error)
	DecrementInvoiceCount(ctx context.Context, organizationID int32) (*QuotaTracking, error)

	// Combined operations
	GetQuotaStatus(ctx context.Context, organizationID int32) (*QuotaStatus, error)
}

// OrganizationAdapter provides access to organization data
type OrganizationAdapter interface {
	GetStytchOrgID(ctx context.Context, organizationID int32) (string, error)
	GetOrganizationIDByStytchOrgID(ctx context.Context, stytchOrgID string) (int32, error)
}
