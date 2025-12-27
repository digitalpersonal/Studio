

import { AcademySettings } from "../types";
import { DEFAULT_REGISTRATION_INVITE_CODE } from "../constants"; 

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