import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  approveManualPaymentIntentAdminApi,
  createPaymentIntentApi,
  getActivePaymentGatewaysApi,
  getManualReviewIntentsAdminApi,
  getTenantWalletApi,
  getWalletTransactionsApi,
  mapRawPaymentGateway,
  mapRawPaymentIntent,
  mapRawTenantWallet,
  mapRawWalletTransaction,
} from '../billing';
import { supabaseRequest } from '../supabase-client';

vi.mock('../supabase-client', () => ({
  supabaseRequest: vi.fn(),
}));

describe('billing & payment-gateway core api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapRawPaymentGateway', () => {
    it('normalizes payment gateway row and rate_per_credit numeric value', () => {
      const raw = {
        channel: 'bank_transfer',
        currency: 'VND',
        driver: 'sepay',
        id: 'bank_vietqr',
        is_active: true,
        name: 'Chuyen khoan Ngan hang 24/7 (VietQR)',
        public_config: { account_no: '0000123456789', bank_name: 'MBBank' },
        rate_per_credit: '1000.000000',
        sort_order: 2,
      };

      const mapped = mapRawPaymentGateway(raw);
      expect(mapped).toEqual({
        channel: 'bank_transfer',
        currency: 'VND',
        driver: 'sepay',
        id: 'bank_vietqr',
        is_active: true,
        name: 'Chuyen khoan Ngan hang 24/7 (VietQR)',
        public_config: { account_no: '0000123456789', bank_name: 'MBBank' },
        rate_per_credit: 1000,
        sort_order: 2,
      });
    });
  });

  describe('mapRawTenantWallet & mapRawWalletTransaction', () => {
    it('normalizes integer Xu balance and transaction ledger rows', () => {
      const wallet = mapRawTenantWallet({
        balance_credits: '450',
        id: 'w-1',
        tenant_id: 't-1',
        total_spent_credits: '150',
        total_topped_up_credits: '600',
        updated_at: '2026-10-14T00:00:00Z',
      });

      expect(wallet.balance_credits).toBe(450);
      expect(wallet.total_topped_up_credits).toBe(600);
      expect(wallet.total_spent_credits).toBe(150);

      const tx = mapRawWalletTransaction({
        amount_credits: '-50',
        balance_after_credits: '400',
        created_at: '2026-10-14T01:00:00Z',
        description: 'Purchase proxy',
        id: 'tx-1',
        reference_id: 'ord-1',
        reference_type: 'commerce_order',
        tenant_id: 't-1',
        tx_type: 'purchase',
        wallet_id: 'w-1',
      });

      expect(tx.amount_credits).toBe(-50);
      expect(tx.balance_after_credits).toBe(400);
      expect(tx.tx_type).toBe('purchase');
    });
  });

  describe('getActivePaymentGatewaysApi & getTenantWalletApi', () => {
    it('queries active payment gateways via billing RPC', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          channel: 'e_wallet',
          currency: 'VND',
          driver: 'momo_ipn',
          id: 'momo_ewallet',
          name: 'MoMo',
          public_config: { wallet_phone: '0900000000' },
          rate_per_credit: 1000,
          sort_order: 3,
        },
      ]);

      const gateways = await getActivePaymentGatewaysApi();
      expect(supabaseRequest).toHaveBeenCalledWith(
        '/rest/v1/rpc/get_active_gateways',
        expect.objectContaining({
          method: 'POST',
          schema: 'billing',
        }),
      );
      expect(gateways).toHaveLength(1);
      expect(gateways[0]?.id).toBe('momo_ewallet');
    });

    it('returns zero-balance fallback when tenant has no wallet row yet', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([]);
      const wallet = await getTenantWalletApi('tenant-uuid-1');

      expect(wallet.tenant_id).toBe('tenant-uuid-1');
      expect(wallet.balance_credits).toBe(0);
    });

    it('fetches wallet transaction ledger for a tenant', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          amount_credits: 100,
          balance_after_credits: 100,
          created_at: '2026-10-14T00:00:00Z',
          description: 'Nap 100 Xu',
          id: 'tx-100',
          tenant_id: 'tenant-uuid-1',
          tx_type: 'topup',
          wallet_id: 'w-1',
        },
      ]);

      const txs = await getWalletTransactionsApi('tenant-uuid-1');
      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining(
          '/rest/v1/wallet_transactions?tenant_id=eq.tenant-uuid-1',
        ),
        { schema: 'billing' },
      );
      expect(txs[0]?.amount_credits).toBe(100);
    });
  });

  describe('createPaymentIntentApi & approveManualPaymentIntentAdminApi', () => {
    it('creates a payment intent in Xu and maps checkout_payload', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce({
        amount_credits: 200,
        checkout_payload: {
          qr_image_url:
            'https://img.vietqr.io/image/970422-0000123456789-compact2.png',
          transfer_code: 'TQ12AB34',
        },
        created_at: '2026-10-14T00:00:00Z',
        expires_at: '2026-10-14T00:30:00Z',
        gateway_id: 'bank_vietqr',
        id: 'intent-1',
        pay_amount: 200_000,
        pay_currency: 'VND',
        status: 'pending',
        target_id: 'tenant-uuid-1',
        target_type: 'wallet_topup',
        tenant_id: 'tenant-uuid-1',
        transfer_code: 'TQ12AB34',
      });

      const intent = await createPaymentIntentApi({
        amount_credits: 200,
        gateway_id: 'bank_vietqr',
        target_id: 'tenant-uuid-1',
        target_type: 'wallet_topup',
        tenant_id: 'tenant-uuid-1',
      });

      expect(supabaseRequest).toHaveBeenCalledWith(
        '/rest/v1/rpc/create_payment_intent',
        expect.objectContaining({
          body: JSON.stringify({
            _amount_credits: 200,
            _buyer_email: null,
            _gateway_id: 'bank_vietqr',
            _target_id: 'tenant-uuid-1',
            _target_type: 'wallet_topup',
            _tenant_id: 'tenant-uuid-1',
          }),
          method: 'POST',
          schema: 'billing',
        }),
      );
      expect(intent.transfer_code).toBe('TQ12AB34');
      expect(intent.pay_amount).toBe(200_000);
    });

    it('lists manual_review intents and force-approves via settle_payment_intent RPC', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        mapRawPaymentIntent({
          amount_credits: 50,
          gateway_id: 'momo_ewallet',
          id: 'intent-late-1',
          pay_amount: 50_000,
          pay_currency: 'VND',
          status: 'manual_review',
          target_id: 't-1',
          target_type: 'wallet_topup',
          transfer_code: 'TQ998877',
        }),
      ]);

      const manualList = await getManualReviewIntentsAdminApi();
      expect(manualList).toHaveLength(1);
      expect(manualList[0]?.status).toBe('manual_review');

      vi.mocked(supabaseRequest).mockResolvedValueOnce({
        amount_credits: 50,
        idempotent: false,
        intent_id: 'intent-late-1',
        settled: true,
      });

      const approval = await approveManualPaymentIntentAdminApi(
        'intent-late-1',
        'Verified MoMo receipt manually',
      );
      expect(supabaseRequest).toHaveBeenLastCalledWith(
        '/rest/v1/rpc/settle_payment_intent',
        expect.objectContaining({
          body: JSON.stringify({
            _actual_pay_amount: null,
            _force_approve: true,
            _intent_id: 'intent-late-1',
            _provider_tx_id: null,
            _raw_metadata: { admin_note: 'Verified MoMo receipt manually' },
            _transfer_code: null,
          }),
          method: 'POST',
          schema: 'billing',
        }),
      );
      expect(approval.settled).toBe(true);
    });
  });
});
