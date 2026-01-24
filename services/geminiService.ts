

import { GoogleGenAI } from "@google/genai";
import { Assessment, User, ClassSession, AttendanceRecord } from '../types';

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
  },

  analyzeRunningPerformance: async (student: User, classSession: ClassSession, record: AttendanceRecord): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Análise de IA indisponível.";

    const performanceData = `
      - Distância: ${classSession.distanceKm || 'N/A'} km
      - Tempo Total: ${record.totalTimeSeconds ? `${record.totalTimeSeconds} segundos` : 'N/A'}
      - Pace Médio: ${record.averagePace || 'N/A'}
    `;

    const prompt = `
      Você é um treinador de corrida profissional, especialista em motivar atletas amadores.
      O aluno(a) ${student.name} acabou de completar um treino de corrida.
      
      Dados do Treino:
      - Título da Aula: ${classSession.title}
      - Semana do Ciclo (1 a 4): ${classSession.weekOfCycle || 'N/A'}
      - Foco da Semana: ${classSession.weekFocus || 'Sem foco definido.'}
      - Objetivo da Semana: ${classSession.weekObjective || 'Sem objetivo definido.'}
      
      Desempenho do Aluno na Aula:
      ${performanceData}
      
      Sua tarefa é gerar um feedback curto (2-3 frases, máximo 50 palavras) para o aluno.
      
      REGRAS OBRIGATÓRIAS:
      1.  **Tom:** Seja extremamente positivo, motivador e encorajador.
      2.  **Linguagem:** Use Português do Brasil, de forma clara e profissional.
      3.  **Foco:** Conecte o desempenho do aluno com o objetivo da semana, se possível.
      4.  **PROIBIDO:** Nunca use um tom negativo, crítico ou punitivo. Não foque em "o que melhorar", mas sim em "o que foi bom".
      
      Exemplo de feedback ideal:
      "Excelente trabalho hoje, ${student.name.split(' ')[0]}! Você demonstrou muita consistência para cumprir o objetivo de ritmo da semana. Cada passo é um progresso na sua jornada. Continue com essa energia!"
      
      Gere o feedback agora.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "Ótimo trabalho no treino de hoje! Continue assim.";
    } catch (error) {
      console.error("Erro na Análise de Corrida com Gemini:", error);
      return "Ótimo trabalho no treino de hoje! Continue com essa dedicação."; // Fallback positivo
    }
  },

  generateCycleSummary: async (studentName: string, cycleData: (AttendanceRecord & { classDetails?: ClassSession })[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Análise de IA indisponível.";

    if (cycleData.length === 0) {
      return "Não há dados suficientes para gerar um resumo do ciclo.";
    }

    const performanceString = cycleData.map(d => 
      `- Data: ${d.date}, Aula: ${d.classDetails?.title || 'N/A'}, Semana: ${d.classDetails?.weekOfCycle || 'N/A'}, Distância: ${d.classDetails?.distanceKm || 'N/A'}km, Pace: ${d.averagePace || 'N/A'}`
    ).join('\n');

    const prompt = `
      Você é um treinador de corrida de elite, especialista em análise de dados e fisiologia.
      Sua tarefa é escrever um resumo de fechamento de ciclo de 4 semanas para o(a) atleta ${studentName}.

      Dados de Performance do Ciclo (4 semanas):
      ${performanceString}

      Analise os dados e gere um resumo técnico, porém motivador, com no máximo 150 palavras.
      
      O resumo DEVE abordar os seguintes pontos:
      1.  **Evolução Geral:** Compare o desempenho inicial (Semana 1) com o final (Semana 4). Houve melhora no pace para distâncias similares?
      2.  **Consistência:** Comente sobre a frequência e a regularidade do(a) atleta no ciclo.
      3.  **Ponto de Destaque:** Identifique o melhor treino ou a maior evolução (ex: melhor pace, maior distância, etc.).
      4.  **Recomendação para o Próximo Ciclo:** Dê uma orientação clara e concisa para o próximo ciclo (ex: "focar em manter o ritmo em distâncias maiores" ou "trabalhar a velocidade em tiros curtos").

      Use uma linguagem profissional, positiva e direta. Formate o texto em parágrafos curtos.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });
      return response.text || "Excelente ciclo de treinos! Sua dedicação trouxe ótimos resultados. Continue focado(a) para o próximo!";
    } catch (error) {
      console.error("Erro na Geração de Resumo de Ciclo com Gemini:", error);
      return "Parabéns por completar o ciclo! Sua consistência é a chave para a evolução contínua."; // Fallback
    }
  },
};