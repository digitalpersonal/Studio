

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
    getMPInstance: () => {
        const settings = SettingsService.getSettings();
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
    processPayment: async (payment: Payment): Promise<{ status: 'approved' | 'rejected' | 'pending', id: string, init_point?: string }> => {
        const settings = SettingsService.getSettings();
        const mp = MercadoPagoService.getMPInstance();
        
        console.log(`[Mercado Pago] Iniciando checkout de R$ ${payment.amount} para fatura: ${String(payment.description)}`);

        // Em uma integração real com backend, você enviaria os dados para sua API
        // que criaria uma 'preference' no Mercado Pago usando o Access Token.
        // Como estamos no frontend, simularemos a chamada de API e o retorno do init_point.

        if (!settings.mercadoPagoAccessToken && !settings.mercadoPagoPublicKey) {
            console.log("Modo Simulação Ativo (Sem chaves configuradas)");
        }

        // Simula o tempo de resposta da API
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulação de retorno de um Checkout Pro
        // Se tivéssemos um backend, aqui retornaríamos o link real do MP
        const mockPreferenceId = `pref_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            status: 'pending', 
            id: mockPreferenceId,
            init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${mockPreferenceId}`
        };
    },

    /**
     * Cria uma assinatura recorrente
     */
    createSubscription: async (studentEmail: string, amount: number, planName: string): Promise<{ status: 'created', init_point: string, id: string }> => {
        const settings = SettingsService.getSettings();
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