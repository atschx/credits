// ============================================================================
// Domain Entity Types
// ============================================================================

export interface Account {
  id: string
  name: string
  billingEmail: string
  rateCardId: string | null
  status: 'active' | 'suspended' | 'closed'
  createdAt: string
  totalBalance?: number
}

export interface CreditBalance {
  id: string
  accountId: string
  totalBalance: number
  purchasedBalance: number
  promotionalBalance: number
  bonusBalance: number
}

export interface CreditGrant {
  id: string
  accountId: string
  grantTypeId: string
  originalAmount: number
  remainingAmount: number
  costBasisPerUnit: number
  currency: string
  sourceReference: string | null
  expiresAt: string | null
  createdAt: string
}

export interface CreditTransaction {
  id: string
  accountId: string
  grantId: string | null
  type: TransactionType
  amount: number
  revenueImpact: number
  description: string
  idempotencyKey: string
  createdAt: string
}

export type TransactionType =
  | 'purchase'
  | 'promotional'
  | 'bonus'
  | 'consumption'
  | 'refund'
  | 'expiration'
  | 'adjustment'

export interface TransactionLineItem {
  id: string
  transactionId: string
  feeCategoryId: string
  amount: number
  revenueImpact: number
  label: string | null
}

export interface GrantType {
  id: string
  name: string
  code: string
  isRevenueBearing: boolean
  accountingTreatment: string
  defaultExpiryDays: number
  grantCount?: number
  activeGrantCount?: number
}

export interface FeeCategory {
  id: string
  code: string
  name: string
  isRevenue: boolean
  isRefundable: boolean
  glAccountCode: string
}

export interface RateCard {
  id: string
  name: string
  currency: string
  status: 'draft' | 'active' | 'archived'
  effectiveFrom: string
  effectiveTo: string | null
}

export interface RateCardItem {
  id: string
  rateCardId: string
  actionCode: string
  actionName: string
  unitOfMeasure: string
  baseCreditCost: number
  feeCreditCost: number
  feeCategoryId: string | null
}

// ============================================================================
// Dashboard
// ============================================================================

export interface DashboardStats {
  totalAccounts: number
  activeAccounts: number
  totalGranted: number
  totalConsumed: number
  recognizedRevenue: number
  deferredRevenue: number
  monthlyRevenue: MonthlyRevenue[]
  accountRevenue: AccountRevenue[]
}

export interface MonthlyRevenue {
  month: string
  recognizedRevenue: number
}

export interface AccountRevenue {
  accountId: string
  accountName: string
  recognizedRevenue: number
  totalConsumed: number
}

// ============================================================================
// API / Pagination
// ============================================================================

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
}

export interface SelectOption {
  value: string
  label: string
}

// ============================================================================
// Component Props
// ============================================================================

export type AccountStatus = Account['status']
export type RateCardStatus = RateCard['status']
export type EntityStatus = AccountStatus | RateCardStatus
