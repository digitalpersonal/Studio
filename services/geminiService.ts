

import { GoogleGenAI } from "@google/genai";
import { Assessment } from '../types';

const getAiClient = () => {
    if (!process.env.API_KEY) return null;
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const GeminiService = {
  /**
   * Analisa o progresso do aluno com base em dados técnicos profundos.
   */
  analyzeProgress: async (studentName: string, assessments: Assessment[]) => {
    const ai = getAiClient();
    if (!ai) return "Serviço de IA indisponível (Chave ausente)";

    if (assessments.length < 1) return "Inicie uma avaliação para análise.";

    const dataString = assessments.map(a => 
      `Data: ${String(a.date)}, Peso: ${a.weight}kg, Gordura: ${a.bodyFatPercentage}%, 
       Massa Muscular: ${String(a.skeletalMuscleMass || 'N/A')}kg, Gord. Visceral: Nível ${String(a.visceralFatLevel || 'N/A')},
       Cintura: ${String(a.circumferences?.waist || 'N/A')}cm, Quadril: ${String(a.circumferences?.hips || 'N/A')}cm`
    ).join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Upgrade para análise complexa
        contents: `Você é um Personal Trainer e Especialista em Fisiologia do Exercício de alto nível.
        Analise os dados de avaliação do aluno ${String(studentName)}:\n${dataString}\n
        
        Sua tarefa é fornecer um laudo técnico e motivador que aborde:
        1. Composição Corporal: Analise a troca de gordura por músculo (recomposição).
        2. Risco Metabólico: Interprete a gordura visceral e relação cintura/quadril se disponível.
        3. Dica Prática: Dê um conselho de treino ou nutrição focado no resultado atual.
        
        Mantenha o tone profissional, direto e encorajador. Máximo 200 palavras. Use Português do Brasil.`,
      });
      return response.text;
    } catch (error: any) {
        console.error("Erro na Análise Gemini:", error.message || JSON.stringify(error));
        return "A IA encontrou um problema ao analisar os dados complexos.";
    }
  }
};