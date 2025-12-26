
import { AcademySettings } from "../types";

const SETTINGS_KEY = 'studio_settings';

const DEFAULT_SETTINGS: AcademySettings = {
    name: 'Studio',
    cnpj: '12.345.678/0001-99',
    email: 'contato@studio.com',
    phone: '(35) 99104-8020',
    representativeName: 'Silvio Torres de Sá Filho',
    representativeCpf: '000.000.000-00',
    representativeRg: 'MG-00.000.000',
    
    // Endereço
    street: 'Rua Principal',
    number: '100',
    neighborhood: 'Centro',
    city: 'Guaranésia',
    state: 'MG',
    zipCode: '37810-000',

    // Mercado Pago
    mercadoPagoPublicKey: '',
    mercadoPagoAccessToken: '',
    webhookUrl: 'https://studiosemovimento.com.br/api/webhooks/mercadopago',

    // Contrato & Gerais
    contractTerms: 'O CONTRATANTE declara estar em plenas condições de saúde para a prática de exercícios físicos, isentando a CONTRATADA de responsabilidade por eventos decorrentes de omissão de informações de saúde. O presente contrato tem vigência determinada e a interrupção precoce pode acarretar em multa de 20% sobre o valor remanescente.',
    monthlyFee: 150.00,
    inviteCode: 'STUDIO2024',
    customDomain: 'studiosemovimento.com.br'
};

export const SettingsService = {
    getSettings: (): AcademySettings => {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            try {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            } catch (e) {
                return DEFAULT_SETTINGS;
            }
        }
        return DEFAULT_SETTINGS;
    },

    saveSettings: (settings: AcademySettings) => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
};
