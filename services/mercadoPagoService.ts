
import { Payment } from "../types";
import { SettingsService } from "./settingsService";

// Declaração para o SDK global do Mercado Pago carregado no index.html
declare global {
  interface Window {
    MercadoPago: any;
  }
}

export const MercadoPagoService = {
    /**
     * Inicializa o SDK do Mercado Pago com a chave pública configurada
     */
    getMPInstance: async () => {
        const settings = await SettingsService.getSettings();
        if (!settings.mercadoPagoPublicKey) {
            console.warn("Mercado Pago: Chave Pública não configurada.");
            return null;
        }
        if (typeof window.MercadoPago === 'undefined') {
            console.error("Mercado Pago: SDK não carregado.");
            return null;
        }
        return new window.MercadoPago(String(settings.mercadoPagoPublicKey), {
            locale: 'pt-BR'
        });
    },

    /**
     * Processa um pagamento individual (Checkout Pro ou Pix/Cartão)
     */
    processPayment: async (payment: Payment): Promise<{ 
        status: 'approved' | 'rejected' | 'pending', 
        id: string, 
        init_point?: string,
        pix_qr_code?: string,
        pix_copy_paste?: string
    }> => {
        const settings = await SettingsService.getSettings();
        const mp = await MercadoPagoService.getMPInstance();
        
        console.log(`[Mercado Pago] Iniciando checkout de R$ ${payment.amount} para fatura: ${String(payment.description)}`);

        // Simula o tempo de resposta da API do Mercado Pago
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockPreferenceId = `pref_${Math.random().toString(36).substr(2, 9)}`;
        
        // Se as chaves estiverem configuradas, o init_point seria o link real do Mercado Pago
        // Aqui simulamos o retorno de um Pix dinâmico usando a chave da academia ou um mock
        const pixCode = settings.pixKey || "00020126580014BR.GOV.BCB.PIX0136STUDIO-MOCK-PRODUCAO-CHECKOUT-20245204000053039865802BR5913STUDIO_FITNESS6009SAO_PAULO62070503***6304D1E2";

        return {
            status: 'pending', 
            id: mockPreferenceId,
            init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${mockPreferenceId}`,
            pix_qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixCode)}`,
            pix_copy_paste: pixCode
        };
    },

    /**
     * Cria uma assinatura recorrente
     */
    createSubscription: async (studentEmail: string, amount: number, planName: string): Promise<{ status: 'created', init_point: string, id: string }> => {
        const settings = await SettingsService.getSettings();
        console.log(`[Mercado Pago] Criando plano recorrente: ${String(planName)} - R$ ${amount}/mês`);

        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockSubId = `sub_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            status: 'created',
            id: mockSubId,
            init_point: `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=${mockSubId}`
        };
    }
};
