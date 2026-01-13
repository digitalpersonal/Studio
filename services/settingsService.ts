
import { AcademySettings } from "../types";
import { DEFAULT_REGISTRATION_INVITE_CODE } from "../constants"; 

const SETTINGS_KEY = 'studio_settings';

const DEFAULT_SETTINGS: AcademySettings = {
    name: 'Studio Fitness',
    cnpj: '12.345.678/0001-99',
    academyAddress: { 
      zipCode: '37810-000',
      street: 'Rua Principal',
      number: '100',
      complement: '',
      neighborhood: 'Centro',
      city: 'Guaranésia',
      state: 'MG'
    },
    phone: '(35) 99104-8020',
    email: 'contato@studio.com.br',
    representativeName: 'Rosinaldo Admin',
    mercadoPagoPublicKey: '',
    mercadoPagoAccessToken: '',
    customDomain: '',
    supabaseProjectId: 'xdjrrxrepnnkvpdbbtot', // Valor padrão baseado na URL do projeto do usuário
    monthlyFee: 150.00,
    inviteCode: 'STUDIO2024',
    registrationInviteCode: DEFAULT_REGISTRATION_INVITE_CODE, 
};

export const SettingsService = {
    getSettings: (): AcademySettings => {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            const parsedSettings = JSON.parse(stored);
            return { 
                ...DEFAULT_SETTINGS, 
                ...parsedSettings,
                academyAddress: typeof parsedSettings.academyAddress === 'string' 
                                ? DEFAULT_SETTINGS.academyAddress 
                                : { ...DEFAULT_SETTINGS.academyAddress, ...parsedSettings.academyAddress }
            };
        }
        return DEFAULT_SETTINGS;
    },

    saveSettings: (settings: AcademySettings) => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
};
