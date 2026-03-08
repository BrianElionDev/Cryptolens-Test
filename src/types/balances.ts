export interface Balances {
    id: string;
    platform: string;
    account_type: string;
    asset: string;
    free: number;
    locked: number;
    total: number;
    unrealized_pnl: number;
    last_updated: string;
}