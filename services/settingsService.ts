
import { AcademySettings } from "../types";
import { DEFAULT_REGISTRATION_INVITE_CODE } from "../constants"; 
import { SupabaseService } from "./supabaseService";

const SETTINGS_KEY = 'studio_settings';

const DEFAULT_SETTINGS: AcademySettings = {
    name: 'Studio',
    cnpj: '12.345.678/0001-99',
    academyAddress: { 
      zipCode: '37810-000',
      street: 'Rua do Fitness',
      number: '100',
      complement: 'Sala 1',
      neighborhood: 'Centro',
      city: 'Guaranésia',
      state: 'MG'
    },
    phone: '(11) 99999-9999',
    email: 'contato@studio.com',
    representativeName: 'Alexandre Coach',
    mercadoPagoPublicKey: '',
    mercadoPagoAccessToken: '',
    customDomain: 'studiosemovimento.com.br',
    monthlyFee: 150.00,
    inviteCode: 'STUDIO2024',
    registrationInviteCode: DEFAULT_REGISTRATION_INVITE_CODE, 
    logoUrl: 'https://digitalfreeshop.com.br/logostudio/logo.jpg'
};

export const SettingsService = {
    getSettings: async (): Promise<AcademySettings> => {
        try {
            const { data, error } = await SupabaseService.supabase!
                .from('settings')
                .select('*')
                .eq('id', 'main_settings')
                .maybeSingle();

            if (error || !data) return DEFAULT_SETTINGS;

            // Mapeamento explícito para garantir que nomes do DB batam com nomes do código
            return {
                ...DEFAULT_SETTINGS,
                name: data.name || DEFAULT_SETTINGS.name,
                cnpj: data.cnpj || DEFAULT_SETTINGS.cnpj,
                academyAddress: data.academy_address || DEFAULT_SETTINGS.academyAddress,
                phone: data.phone || DEFAULT_SETTINGS.phone,
                email: data.email || DEFAULT_SETTINGS.email,
                representativeName: data.representative_name || DEFAULT_SETTINGS.representativeName,
                mercadoPagoPublicKey: data.mercado_pago_public_key || '',
                mercadoPagoAccessToken: data.mercado_pago_access_token || '',
                monthlyFee: Number(data.monthly_fee) || DEFAULT_SETTINGS.monthlyFee,
                registrationInviteCode: data.registration_invite_code || DEFAULT_SETTINGS.registrationInviteCode,
                logoUrl: data.logo_url || DEFAULT_SETTINGS.logoUrl
            };
        } catch (e) {
            console.error("Falha ao buscar configurações:", e);
            return DEFAULT_SETTINGS;
        }
    },

    saveSettings: async (settings: AcademySettings) => {
        const { error } = await SupabaseService.supabase!
            .from('settings')
            .upsert({
                id: 'main_settings',
                name: settings.name,
                cnpj: settings.cnpj,
                academy_address: settings.academyAddress,
                phone: settings.phone,
                email: settings.email,
                representative_name: settings.representativeName,
                mercado_pago_public_key: settings.mercadoPagoPublicKey,
                mercado_pago_access_token: settings.mercadoPagoAccessToken,
                monthly_fee: settings.monthlyFee,
                registration_invite_code: settings.registrationInviteCode,
                logo_url: settings.logoUrl,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error("Erro ao salvar configurações no Supabase:", error);
            throw error;
        }
        
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
};
