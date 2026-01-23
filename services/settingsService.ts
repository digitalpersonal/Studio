
import { AcademySettings } from "../types";
import { DEFAULT_REGISTRATION_INVITE_CODE } from "../constants"; 
import { SupabaseService } from "./supabaseService";

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
    pixKey: '',
    customDomain: 'studiosemovimento.com.br',
    monthlyFee: 150.00,
    inviteCode: 'STUDIO2024',
    registrationInviteCode: DEFAULT_REGISTRATION_INVITE_CODE, 
};

export const SettingsService = {
    /**
     * Busca as configurações diretamente do Supabase.
     * Não utiliza mais o cache local (localStorage).
     */
    getSettings: async (): Promise<AcademySettings> => {
        try {
            const remote = await SupabaseService.getAcademySettings();
            if (remote) {
                return remote;
            }
        } catch (e) {
            console.error("Erro ao buscar configurações no Supabase:", e);
        }
        return DEFAULT_SETTINGS;
    },

    /**
     * Salva as configurações exclusivamente no banco de dados.
     */
    saveSettings: async (settings: AcademySettings) => {
        try {
            await SupabaseService.updateAcademySettings(settings);
        } catch (e) {
            console.error("Erro ao persistir configurações no Supabase:", e);
            throw e;
        }
    }
};
