const NETWORK_PREFIXES = {
    regtest: 'lnbcrt',
    testnet: 'lntb',
    signet: 'lntbs'
};

class LightningProvider {
    static getConfig() {
        const baseUrl = process.env.LNBITS_URL;
        const invoiceKey = process.env.LNBITS_INVOICE_KEY;
        const network = (process.env.LIGHTNING_NETWORK || '').toLowerCase();
        const expirySeconds = Number(process.env.LNBITS_INVOICE_EXPIRY_SECONDS || 900);

        if (process.env.NODE_ENV === 'production') {
            throw new Error('Test Lightning checkout is disabled in production');
        }
        if (!baseUrl || !invoiceKey) {
            throw new Error('Configure LNBITS_URL and LNBITS_INVOICE_KEY to enable Lightning checkout');
        }
        if (!Object.hasOwn(NETWORK_PREFIXES, network)) {
            throw new Error('LIGHTNING_NETWORK must be regtest, testnet, or signet');
        }
        if (!Number.isInteger(expirySeconds) || expirySeconds < 60 || expirySeconds > 3600) {
            throw new Error('LNBITS_INVOICE_EXPIRY_SECONDS must be between 60 and 3600');
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(baseUrl);
        } catch {
            throw new Error('LNBITS_URL must be a valid HTTP or HTTPS URL');
        }
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error('LNBITS_URL must use HTTP or HTTPS');
        }

        return { baseUrl: parsedUrl, invoiceKey, network, expirySeconds };
    }

    static async request(path, options = {}) {
        const { baseUrl, invoiceKey } = this.getConfig();
        const url = new URL(path, baseUrl.href.endsWith('/') ? baseUrl : `${baseUrl.href}/`);

        let response;
        try {
            response = await fetch(url, {
                ...options,
                headers: {
                    'X-API-KEY': invoiceKey,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: AbortSignal.timeout(10000)
            });
        } catch {
            const error = new Error('Lightning invoice service is unavailable');
            error.code = 'PAYMENT_PROVIDER_UNAVAILABLE';
            throw error;
        }

        if (!response.ok) {
            const error = new Error('Lightning invoice service rejected the request');
            error.code = 'PAYMENT_PROVIDER_ERROR';
            throw error;
        }
        return response.json();
    }

    static async createInvoice({ amountUsd, orderNumber }) {
        const config = this.getConfig();
        const payment = await this.request('/api/v1/payments', {
            method: 'POST',
            body: JSON.stringify({
                out: false,
                amount: Number((amountUsd / 100).toFixed(2)),
                unit: 'USD',
                memo: `Nautware ${orderNumber}`.slice(0, 40),
                expiry: config.expirySeconds,
                external_id: orderNumber
            })
        });

        if (!payment.payment_hash || !payment.payment_request) {
            throw new Error('Lightning invoice response was incomplete');
        }

        const invoice = payment.payment_request.replace(/^lightning:/i, '').toLowerCase();
        if (!invoice.startsWith(NETWORK_PREFIXES[config.network])) {
            const error = new Error(`LNbits returned an invoice that is not for ${config.network}`);
            error.code = 'PAYMENT_NETWORK_MISMATCH';
            throw error;
        }

        return {
            paymentHash: payment.payment_hash,
            paymentRequest: payment.payment_request,
            checkingId: payment.checking_id || payment.payment_hash,
            expiresAt: new Date(Date.now() + config.expirySeconds * 1000)
        };
    }

    static async getPayment(paymentHash) {
        return this.request(`/api/v1/payments/${encodeURIComponent(paymentHash)}`);
    }

    static getQrCodeUrl(paymentRequest) {
        const { baseUrl } = this.getConfig();
        const url = new URL('/api/v1/qrcode', baseUrl);
        url.searchParams.set('data', paymentRequest);
        return url.toString();
    }
}

module.exports = LightningProvider;