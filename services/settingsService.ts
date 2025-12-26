
import { AcademySettings } from "../types";

const SETTINGS_KEY = 'studio_settings';

const DEFAULT_SETTINGS: AcademySettings = {
    name: 'Studio',
    cnpj: '12.345.678/0001-99',
    address: 'Rua do Fitness, 100 - Centro, São Paulo - SP',
    phone: '(11) 99999-9999',
    email: 'contato@studio.com',
    representativeName: 'Alexandre Coach',
    mercadoPagoPublicKey: '',
    mercadoPagoAccessToken: '',
    customDomain: 'studiosemovimento.com.br',
    monthlyFee: 150.00,
    inviteCode: 'STUDIO2024'
};

export const SettingsService = {
    getSettings: (): AcademySettings => {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
        return DEFAULT_SETTINGS;
    },

    saveSettings: (settings: AcademySettings) => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
};
