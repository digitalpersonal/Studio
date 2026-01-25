import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { BookOpen, ChevronDown, User as UserIcon, GraduationCap, Shield, Share2 } from 'lucide-react';

// --- DATA SOURCE ---
const helpData = {
  [UserRole.STUDENT]: [
    {
      title: 'Integração Strava',
      icon: Share2,
      questions: [
        { 
          q: 'Como vai funcionar a integração? (A Experiência)', 
          a: 'A ideia é <strong>simplicidade total</strong>. Você só conecta sua conta uma vez e depois não precisa se preocupar com mais nada.<br><br><ol class="list-decimal list-inside space-y-3"><li><strong>Conexão Única:</strong> No menu "Strava", clique em "Conectar com Strava". Você será levado ao site seguro do Strava para autorizar o acesso.</li><li><strong>Corra Normalmente:</strong> Use seu app Strava ou relógio (Garmin, Apple Watch) como sempre fez para registrar suas corridas.</li><li><strong>Sincronização Mágica:</strong> Assim que salvar a corrida no Strava, nosso sistema puxa os dados (distância, tempo, pace, etc.) automaticamente.</li><li><strong>Tudo no App:</strong> Sua corrida aparecerá na "Evolução de Corrida" e a distância será somada ao Ranking e Desafio Global, sem nenhum trabalho manual!</li></ol>' 
        },
        { 
          q: 'Por que devo conectar? Quais os benefícios para mim?', 
          a: 'Conectar sua conta transforma sua experiência no Studio:<br><br><ul class="list-disc list-inside space-y-2"><li><strong>Coaching de Precisão:</strong> Seu treinador verá seus dados reais de corrida (pace, distância, elevação), permitindo um feedback muito mais técnico e personalizado para você evoluir mais rápido.</li><li><strong>Engajamento Máximo:</strong> Participe automaticamente do Ranking e dos Desafios de corrida. Veja seu nome subir no placar em tempo real!</li><li><strong>Histórico Unificado:</strong> Todo o seu progresso, tanto das aulas de funcional quanto das suas corridas de rua, fica centralizado em um só lugar.</li></ul>' 
        },
        { 
          q: 'Preciso fazer algo a cada corrida?', 
          a: '<strong>Absolutamente nada!</strong> Depois de conectar uma vez, é só correr e deixar a mágica acontecer. A sincronização é 100% automática.' 
        },
        { 
          q: 'E se eu quiser desconectar minha conta?', 
          a: 'Na mesma tela de <strong>"Strava"</strong>, onde você fez a conexão, haverá um botão para <strong>"Desconectar"</strong>. Ao clicar, o vínculo é removido e suas atividades futuras não serão mais sincronizadas.' 
        },
      ]
    },
    {
      title: 'Agenda e Aulas',
      icon: UserIcon,
      questions: [
        { q: 'Como vejo e me inscrevo nas aulas?', a: 'Acesse a <strong>"Agenda de Aulas"</strong> no menu. As aulas são organizadas por dia da semana. Para se inscrever, encontre uma aula futura com vagas disponíveis, clique nela e confirme sua matrícula. Se a aula estiver cheia, seu nome irá para a lista de espera e você será notificado se uma vaga for liberada.' },
        { q: 'Como cancelo minha inscrição em uma aula?', a: 'Na <strong>Agenda</strong>, encontre a aula em que está inscrito e clique para abrir os detalhes. Haverá um botão para <strong>"Cancelar Inscrição"</strong>. Cancele com antecedência para liberar a vaga para outros alunos.' },
        { q: 'O que significam as cores das aulas?', a: 'As cores ajudam a diferenciar os tipos de treino. Aulas em <strong>verde</strong> são de <strong>Corrida</strong>, enquanto aulas em <strong>azul</strong> são de <strong>Funcional</strong>.' },
      ]
    },
    {
      title: 'Financeiro',
      questions: [
        { q: 'Onde vejo minhas mensalidades?', a: 'Acesse a seção <strong>"Financeiro"</strong> no menu. Lá você encontrará um histórico de todas as suas faturas, mostrando o que está pago, pendente ou em atraso.' },
        { q: 'Como posso pagar minha mensalidade pelo app?', a: 'Na tela <strong>"Financeiro"</strong>, encontre a fatura pendente ou atrasada e clique nos botões de pagamento. Você pode escolher pagar com <strong>Cartão de Crédito</strong> (será redirecionado para o ambiente seguro do Mercado Pago) ou via <strong>Pix</strong> (um QR Code e código "copia e cola" serão gerados na tela).' },
        { q: 'O pagamento é baixado na hora?', a: 'Pagamentos via <strong>Pix</strong> e <strong>Cartão</strong> são processados pelo Mercado Pago e a baixa no sistema é automática assim que o pagamento é confirmado por eles, o que geralmente leva poucos segundos.' },
      ]
    },
    {
      title: 'Acompanhando seu Progresso',
      questions: [
        { q: 'Como vejo minha evolução na corrida?', a: 'Acesse <strong>"Evolução de Corrida"</strong>. Você verá gráficos com a progressão do seu <strong>pace</strong> (ritmo por km), sua melhor marca, e um histórico detalhado de cada treino de corrida que você participou, incluindo feedback do treinador e da IA.' },
        { q: 'Onde encontro minhas avaliações físicas?', a: 'Em <strong>"Avaliações"</strong>, todas as suas avaliações físicas estarão listadas por data. Clique em "Ver Detalhes" para expandir e ver todos os dados, como bioimpedância, perímetros, fotos e resultados de testes de performance.' },
        { q: 'O que são os Treinos Individuais?', a: 'Na tela <strong>"Treinos Individuais"</strong>, seu treinador pode postar treinos complementares ou específicos para você, ideais para fazer em viagens, na academia ou em dias sem aula no Studio.' },
      ]
    },
    {
      title: 'Comunidade e Interação',
      questions: [
        { q: 'Como posto uma foto ou uma conquista?', a: 'Vá para a <strong>"Comunidade"</strong>. Use o campo no topo da página para escrever uma legenda, clique no ícone de câmera para anexar uma foto e compartilhe seu progresso com todos.' },
        { q: 'O que é o Ranking?', a: 'O <strong>"Ranking"</strong> mostra a pontuação de todos os alunos em desafios globais propostos pelo Studio. Geralmente, a pontuação é baseada na distância percorrida em treinos de corrida. É uma forma divertida de motivar a todos!' },
      ]
    }
  ],
  [UserRole.TRAINER]: [
     {
      title: 'Integração Strava',
      icon: Share2,
      questions: [
        { 
          q: 'Qual o valor da integração para o meu coaching?', 
          a: 'A integração com o Strava eleva seu coaching a um novo patamar, baseando-o em <strong>dados reais e não em suposições</strong>.<br><br><ul class="list-disc list-inside space-y-2"><li><strong>Fim do "Achismo":</strong> Tenha acesso direto aos dados precisos de cada corrida do aluno (pace, distância, elevação, etc.).</li><li><strong>Análise Profunda:</strong> Analise a consistência do ritmo, o impacto da altimetria na performance e a frequência cardíaca para entender o esforço real.</li><li><strong>Feedback Técnico e Personalizado:</strong> Seu feedback se torna muito mais valioso. Ex: "Percebi que seu pace caiu nos últimos 2km naquela subida. Vamos trabalhar força na próxima aula para corrigir isso."</li><li><strong>Eficiência Operacional:</strong> Menos tempo gasto perguntando sobre treinos e mais tempo focado em analisar, planejar e dar feedback de qualidade.</li></ul>' 
        },
        { 
          q: 'Como vejo as corridas de um aluno sincronizadas?', 
          a: 'Na tela de <strong>"Alunos & Equipe"</strong>, encontre o aluno e acesse a <strong>"Evolução de Corrida"</strong> dele. As atividades sincronizadas aparecerão automaticamente na lista, identificadas com o logo do Strava.' 
        },
        { 
          q: 'Os alunos precisam de ajuda para configurar?', 
          a: 'Não, e essa é a maior vantagem. O processo é muito simples e o aluno só precisa conectar a conta <strong>uma única vez</strong>. Depois disso, a sincronização é 100% automática. Você pode orientá-los a consultar esta Central de Ajuda na seção "Para Alunos" para ver o passo a passo.' 
        },
      ]
    },
    {
      title: 'Fluxo Essencial: Finalizar uma Chamada',
      questions: [
        { q: 'Passo a passo para fazer a chamada de uma aula', a: '1. Na <strong>Agenda</strong>, encontre a aula do dia.<br>2. Clique no ícone de check (✓) ao lado do nome da aula. Isso abrirá o modal de chamada.<br>3. Marque a caixa de seleção ao lado do nome de cada aluno presente.<br>4. Se for uma aula de <strong>Corrida</strong>, um campo de <strong>"Tempo (segundos)"</strong> aparecerá para cada aluno presente. Insira o tempo total que o aluno levou para completar o percurso.<br>5. O sistema calculará o <strong>pace</strong> automaticamente.<br>6. Adicione observações se desejar.<br>7. Clique em <strong>"Finalizar Chamada"</strong>. O sistema salvará a presença, a performance e, para aulas de corrida, gerará feedback com IA e somará a distância ao ranking do desafio.' },
        { q: 'Por que é importante preencher o tempo na aula de Corrida?', a: 'Registrar o tempo é crucial. Isso alimenta a tela de <strong>"Evolução de Corrida"</strong> do aluno, permitindo que ele veja seu progresso no pace. Além disso, o sistema usa esses dados para gerar um feedback motivacional com Inteligência Artificial e para atualizar o progresso do aluno no Desafio Global do Studio.' },
        { q: 'O que acontece se eu esquecer de fazer a chamada no dia?', a: 'O sistema sempre registra a chamada com a data do dia em que ela é finalizada. Se você esquecer, pode fazer no dia seguinte, mas terá que corrigir a data manualmente no banco de dados. O ideal é sempre finalizar a chamada logo após a aula.' },
      ]
    },
    {
      title: 'Gerenciamento de Aulas',
      questions: [
        { q: 'Qual a diferença entre "Dia da Semana" e "Data Específica" ao criar uma aula?', a: 'Use <strong>"Dia da Semana"</strong> para aulas recorrentes (ex: toda segunda-feira às 18h). Use <strong>"Data Específica"</strong> para aulas únicas ou eventos especiais (ex: um "aulão" de feriado). Ao preencher a data, o dia da semana é ajustado automaticamente.' },
        { q: 'Como matriculo ou removo alunos de uma aula?', a: 'Ao criar ou editar uma aula, você verá uma seção de <strong>"Matrículas"</strong>. Nela, há uma lista de "Matriculados" e "Alunos Disponíveis". Use a busca para encontrar alunos e clique neles para movê-los entre as listas.' },
        { q: 'Como prescrevo um treino individual para um ou mais alunos?', a: 'Vá para <strong>"Treinos Individuais"</strong> e clique em <strong>"Novo Treino"</strong>. Descreva o treino e, na seção <strong>"Alunos Destinatários"</strong>, selecione um ou mais alunos. Apenas os alunos selecionados poderão ver este treino.' },
      ]
    },
    {
      title: 'Acompanhamento de Alunos',
      questions: [
        { q: 'Como acesso o perfil de um aluno específico?', a: 'Vá para <strong>"Alunos & Equipe"</strong>. Esta tela é sua central. A partir dela, você pode clicar nos ícones de atalho para ir diretamente para a <strong>Evolução de Corrida</strong>, <strong>Avaliações</strong>, <strong>Treinos Individuais</strong> ou <strong>Financeiro</strong> daquele aluno.' },
        { q: 'Como crio uma nova avaliação física?', a: 'Acesse <strong>"Avaliações"</strong>, selecione o aluno desejado na lista suspensa e clique em <strong>"Nova Avaliação"</strong>. Preencha todos os campos possíveis, desde a bioimpedância até os testes de performance e perímetros. Dados completos geram análises mais ricas.' },
      ]
    }
  ],
  [UserRole.ADMIN]: [
    {
      title: 'Integração Strava',
      icon: Share2,
      questions: [
        { 
          q: 'Qual o valor estratégico e de negócio da integração?', 
          a: 'A integração com o Strava é uma poderosa ferramenta de <strong>engajamento, retenção e marketing</strong>.<br><br><ul class="list-disc list-inside space-y-2"><li><strong>Gamificação:</strong> O ranking automático cria uma competição saudável que incentiva os alunos a treinarem mais.</li><li><strong>Retenção (Efeito Ecossistema):</strong> Ao centralizar todos os dados de performance (funcional + corrida), o aluno cria um vínculo mais forte com o Studio, tornando o serviço mais "pegajoso" (sticky).</li><li><strong>Marketing e Atração:</strong> É um diferencial competitivo enorme. Anuncie seu "Clube de Corrida com integração total ao Strava" para atrair novos clientes, especialmente corredores de rua.</li><li><strong>Fortalecimento da Comunidade:</strong> Conecta os treinos individuais de rua à comunidade do Studio, fazendo o aluno se sentir parte de uma "equipe de corrida" mesmo quando treina sozinho.</li></ul>' 
        },
        { 
          q: 'Preciso configurar algo como administrador?', 
          a: '<strong>Não.</strong> A integração foi projetada para ser "plug-and-play". A única ação necessária é a do próprio aluno, que deve autorizar a conexão em sua conta. Não há painéis de configuração ou chaves de API para o administrador gerenciar.' 
        },
        { 
          q: 'Como posso usar os dados do Strava para a gestão?', 
          a: 'Acompanhe o engajamento do clube de corrida através do <strong>Ranking</strong>. Identifique os alunos mais ativos para criar campanhas de reconhecimento e os menos ativos para ações de reengajamento. A funcionalidade fortalece o valor percebido do seu serviço, justificando investimentos e mensalidades.' 
        },
      ]
    },
    {
      title: 'Fluxo Essencial: Gestão Financeira',
      questions: [
        { q: 'Como dar baixa em um pagamento manual (Pix, dinheiro)?', a: '1. Vá para <strong>"Alunos & Equipe"</strong>.<br>2. Encontre o aluno na lista e clique no ícone de recibo (<strong>Receipt</strong>).<br>3. Um modal abrirá com os detalhes da próxima fatura pendente.<br>4. Se necessário, aplique um <strong>desconto</strong> no campo apropriado.<br>5. O valor final a ser recebido será calculado automaticamente.<br>6. Clique em <strong>"Confirmar"</strong>. O sistema marcará a fatura como "Paga" e registrará o desconto.' },
        { q: 'Como gerar uma fatura avulsa?', a: 'Atualmente, o sistema gera faturas automaticamente na criação de um plano. Para cobranças extras, siga o mesmo fluxo de "Receber Pagamento". Se não houver fatura pendente, o sistema perguntará se você deseja <strong>gerar uma nova fatura avulsa</strong>. Confirme, e uma nova fatura será criada para o aluno, que poderá então ser paga ou ter a baixa manual.' },
        { q: 'Como enviar um lembrete de pagamento ou cobrança?', a: 'Na tela <strong>"Alunos & Equipe"</strong>, encontre o aluno. Nos botões de ação, você verá ícones do WhatsApp: um <strong>triângulo de alerta</strong> para cobrar faturas atrasadas e um <strong>balão de mensagem</strong> para lembrar de faturas que estão para vencer. Clicar neles abrirá o WhatsApp com uma mensagem pronta.' },
      ]
    },
    {
      title: 'Administração de Usuários',
      questions: [
        { q: 'Como cadastro um novo aluno?', a: 'Em <strong>"Alunos & Equipe"</strong>, clique em <strong>"Novo Cadastro"</strong>. Preencha os dados pessoais na aba <strong>"Dados Pessoais"</strong>. Em seguida, vá para a aba <strong>"Plano Financeiro"</strong>, selecione o plano desejado e preencha o valor e a duração. Salve para criar o usuário e sua primeira fatura.' },
        { q: 'O que significa "Suspender" um aluno?', a: 'Suspender (usando o botão de raio <strong class="text-red-500">ZapOff</strong>) é uma "inativação temporária". O aluno não poderá acessar o app e quaisquer automações de cobrança serão pausadas para ele. Os dados dele são mantidos. É ideal para alunos que trancaram a matrícula. Use o botão <strong class="text-green-500">Zap</strong> para reativá-lo.' },
        { q: 'Como deleto um usuário? Qual a consequência?', a: 'Excluir um usuário (ícone de lixeira) é uma <strong>ação permanente e irreversível</strong>. Todos os dados do usuário, incluindo histórico financeiro, de treinos e avaliações, serão apagados do banco de dados. Use com extrema cautela.' },
        { q: 'Posso cadastrar outros Treinadores ou Administradores?', a: 'Sim. Ao criar um novo cadastro, na aba <strong>"Dados Pessoais"</strong>, você pode definir a <strong>"Função / Nível de Acesso"</strong>. Um <strong>Treinador</strong> pode gerenciar aulas e alunos, mas não tem acesso aos relatórios financeiros. Um <strong>Administrador</strong> tem acesso a quase tudo, exceto as configurações gerais do sistema.' },
      ]
    },
    {
      title: 'Configurações (Apenas Admin Geral)',
      questions: [
        { q: 'Onde configuro as chaves do Mercado Pago?', a: 'Acesse <strong>"Configurações"</strong>. Na seção de <strong>"Integração Mercado Pago"</strong>, você deve inserir sua <strong>Public Key</strong> e seu <strong>Access Token</strong>. Você encontra essas chaves no painel de desenvolvedor do Mercado Pago, na seção "Credenciais".' },
        { q: 'O que é o Webhook e onde eu o configuro?', a: 'O Webhook é o link que o Mercado Pago usa para notificar nosso sistema sobre um pagamento (ex: Pix confirmado). Na tela de <strong>"Configurações"</strong>, copie a <strong>"URL do Webhook Central"</strong>. Cole este link no seu painel do Mercado Pago, na seção de "Webhooks", para o evento "Pagamentos". Isso garante que a baixa dos pagamentos online seja automática.' },
        { q: 'Para que serve o "Código de Convite de Cadastro"?', a: 'É uma camada de segurança. Apenas pessoas com este código podem acessar a tela de cadastro. Isso evita que pessoas aleatórias criem contas no seu sistema. Mude este código periodicamente em <strong>"Configurações"</strong> para manter a segurança.' },
      ]
    }
  ],
};

interface AccordionItemProps {
  question: string;
  answer: string;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-dark-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-5 px-6"
      >
        <span className="font-bold text-white">{question}</span>
        <ChevronDown
          size={20}
          className={`text-brand-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-5 animate-fade-in">
          <p className="text-slate-400 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: answer }} />
        </div>
      )}
    </div>
  );
};

interface HelpCenterPageProps {
  currentUser: User;
}

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<UserRole>(currentUser.role);

  const canViewAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;
  const canViewTrainer = canViewAdmin || currentUser.role === UserRole.TRAINER;

  const TabButton = ({ role, label, icon: Icon }: { role: UserRole, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(role)}
      className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
        activeTab === role ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-slate-500 hover:text-white'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="text-center">
        <BookOpen size={48} className="mx-auto text-brand-500 mb-4" />
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Central de Ajuda</h2>
        <p className="text-slate-400 mt-2 max-w-xl mx-auto">
          Encontre respostas para as perguntas mais comuns e aprenda a tirar o máximo proveito do nosso sistema.
        </p>
      </header>

      <div className="bg-dark-950 rounded-[2rem] border border-dark-800 shadow-xl overflow-hidden">
        <div className="flex border-b border-dark-800">
          <TabButton role={UserRole.STUDENT} label="Para Alunos" icon={UserIcon} />
          {canViewTrainer && <TabButton role={UserRole.TRAINER} label="Para Treinadores" icon={GraduationCap} />}
          {canViewAdmin && <TabButton role={UserRole.ADMIN} label="Para Gestores" icon={Shield} />}
        </div>

        <div className="p-4 md:p-8">
          {helpData[activeTab]?.map((category, index) => (
            <div key={index} className="mb-8">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4 px-4 flex items-center gap-3">
                {category.icon && <category.icon className="text-brand-500" size={20} />}
                {category.title}
              </h3>
              <div className="bg-dark-900 rounded-2xl border border-dark-800 overflow-hidden">
                {category.questions.map((q, qIndex) => (
                  <AccordionItem key={qIndex} question={q.q} answer={q.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
