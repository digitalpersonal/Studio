import { jsPDF } from "jspdf";
import { User, AcademySettings, Plan } from "../types";
import { SettingsService } from "./settingsService";
import { SupabaseService } from "./supabaseService";

export const ContractService = {
  _createContractDoc: (student: User, settings: AcademySettings, plans: Plan[]) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 40;
    let y = margin;

    const addText = (text: string, x: number, startY: number, options: any = {}) => {
        // Function to handle text wrapping and y-position update
        doc.setFont(options.font || 'helvetica', options.style || 'normal');
        doc.setFontSize(options.size || 9);
        doc.setTextColor(options.color || '#000000');
        const splitText = doc.splitTextToSize(text, options.maxWidth || pageWidth - margin * 2);
        doc.text(splitText, x, startY, { align: options.align || 'left' });
        const textHeight = doc.getTextDimensions(splitText, { fontSize: options.size || 9 }).h;
        return startY + textHeight + (options.lineSpacing || 4);
    };
    
    // Helper for adding a bolded title before a paragraph
    const addClause = (title: string, text: string, startY: number) => {
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, startY);
        const titleWidth = doc.getTextWidth(title);
        const remainingText = doc.splitTextToSize(text, pageWidth - margin * 2 - titleWidth - 4);
        doc.setFont('helvetica', 'normal');
        doc.text(remainingText, margin + titleWidth + 4, startY);
        const textHeight = doc.getTextDimensions(remainingText).h;
        return startY + textHeight + 10;
    };
    
    const addParagraph = (title: string, text: string, startY: number) => {
        return addClause(title, text, startY); // Same logic as clause
    };

    const studentPlan = plans.find(p => p.id === student.planId);
    const academyFullAddress = `${settings.academyAddress.street}, ${settings.academyAddress.number} – ${settings.academyAddress.neighborhood} – ${settings.academyAddress.city}/${settings.academyAddress.state}`;


    // =========================================================================
    // HEADER
    // =========================================================================
    y = addText(settings.name.toUpperCase(), pageWidth / 2, y, { size: 12, style: 'bold', align: 'center' });
    y = addText(academyFullAddress, pageWidth / 2, y, { size: 9, align: 'center' });
    y = addText(`CNPJ: ${settings.cnpj}`, pageWidth / 2, y, { size: 9, align: 'center' });
    y += 20;

    // =========================================================================
    // PARTIES
    // =========================================================================
    const contratadaText = `CONTRATATADA (ACADEMIA): ${settings.name}, com sede em ${academyFullAddress}, CEP: ${settings.academyAddress.zipCode}, inscrita no CNPJ sob o nº ${settings.cnpj}, neste ato representada por ${settings.representativeName}.`;
    y = addText(contratadaText, margin, y, { style: 'bold' });
    y += 15;

    let contratanteText = `CONTRATANTE (ALUNO): ${student.name || '____________________________________________________________'} Nascimento: ${student.birthDate ? new Date(student.birthDate + 'T03:00:00').toLocaleDateString('pt-BR') : '____/____/__________'}, Carteira de Identidade nº ${student.rg || '________________'}, CPF nº ${student.cpf || '____________________'}, residente na Rua ${student.address?.street || '_________________________________ _______________________________________'}, nº ${student.address?.number || '_______'}, CEP ${student.address?.zipCode || '________-____'}, Cidade ${student.address?.city || '____________________'}, fone ${student.phoneNumber || '____________________'}`;
    y = addText(contratanteText, margin, y, { style: 'bold' });
    y += 15;
    
    y = addText('As partes identificadas acima têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas a seguir.', margin, y, { align: 'justify' });
    y += 15;

    // =========================================================================
    // CLAUSES
    // =========================================================================
    y = addClause('Cláusula 1ª.', `O objeto do presente contrato é a prestação, pela ACADEMIA ao CLIENTE, dos serviços de sessões coletivas de atividades físicas, estando com sua proposta em conformidade com o CREF/ CONFEF, através de seus profissionais e das aulas de atividade física. O CLIENTE, através do presente, está se matriculando na ACADEMIA para o período de ${student.planDuration || '______'} meses, cujos treinos ocorrerão nas • segundas, • terças, • quartas, • quintas, • sextas e • sábados, das ___ :___ às ___ :___ horas.`, y);
    y = addParagraph('Parágrafo 1º.', 'A direção da ACADEMIA não se recusa a manter um diálogo construtivo com o CLIENTE ou seus RESPONSÁVEIS que demonstre um verdadeiro interesse na melhoria da qualidade das aulas e no seu processo evolutivo.', y);
    y = addParagraph('Parágrafo 2º.', 'Solicitações de mudanças eventuais no horário aqui estabelecido deverão ser encaminhadas à ACADEMIA com no mínimo 24 horas de antecedência.', y);

    y = addClause('Cláusula 2ª.', 'O CLIENTE se obriga a observar estrita e exclusivamente as orientações dos profissionais da ACADEMIA para a prática das atividades físicas. A ACADEMIA não se responsabiliza por danos físicos de qualquer natureza resultantes da inobservância do cliente a estas orientações, pelo acatamento à orientação de estranhos ou ainda pelo uso inadequado dos aparelhos e equipamentos da ACADEMIA.', y);
    y = addClause('Cláusula 3ª.', 'Somente nos planos trimestral e semestral será concedida uma licença de afastamento de respectivamente 7 e 15 dias, com direito a reposição do período não usufruído ao final do período contratado. Esta licença deverá ser formalizada junto à recepção da ACADEMIA por escrito e com pelo menos 15 dias de antecedência.. Casos excepcionais serão tratados em comum acordo.', y);
    y = addClause('Cláusula 4ª.', 'A ACADEMIA, livre de quaisquer ônus para com o CLIENTE, poderá utilizar-se da sua imagem para fins exclusivos de divulgação da ACADEMIA e suas atividades, podendo, para tanto, reproduzi-la ou divulgá-la junto a internet, jornais e todos os demais meios de comunicação públicos ou privados.', y);
    y = addParagraph('Parágrafo 1º.', 'Em nenhuma hipótese poderá a imagem do CLIENTE ser utilizada de maneira contrária à moral ou aos bons costumes ou à ordem pública.', y);
    y = addParagraph('Parágrafo 2º.', 'O não comparecimento do CLIENTE às dependências da ACADEMIA, ora contratada, não exime o pagamento, tendo em vista a disponibilidade do serviço.', y);
    y = addParagraph('Parágrafo 3º.', 'No caso de menores, após o término das sessões, deverá o RESPONSÁVEL retirá-lo em seguida.', y);

    y = addClause('Cláusula 5ª.', 'Todo o regulamento interno da ACADEMIA precisa ser seguido pelo CLIENTE.', y);

    // Clause 6 - REMUNERAÇÃO (Dynamic)
    y = addClause('Cláusula 6ª REMUNERAÇÃO.', 'Pela prestação dos serviços, referentes ao período contratado conforme previsto na cláusula 1ª, o CLIENTE pagará à ACADEMIA tanto à vista em dinheiro bem como parcelado ou à vista no pix ou cartão todo o período contratado no ato da matrícula a tempo e modo conforme os detalhes especificados abaixo.', y);
    
    // Dynamic Pricing Info
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#f97316'); // Brand color for title
    y = addText('DETALHES DO PLANO CONTRATADO', margin, y);
    y += 2;

    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y); // horizontal line
    y += 15;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000');

    if (studentPlan) {
        const finalValue = studentPlan.price - (student.planDiscount || 0);

        const addDetailLine = (label: string, value: string) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text(value, margin + 120, y);
            y += 15;
        };
        
        addDetailLine('Plano Contratado:', studentPlan.title);
        addDetailLine('Frequência:', studentPlan.frequency || 'Não especificada');
        addDetailLine('Duração do Contrato:', `${studentPlan.durationMonths} ${studentPlan.durationMonths > 1 ? 'meses' : 'mês'}`);
        addDetailLine('Valor Mensal Original:', `R$ ${studentPlan.price.toFixed(2)}`);

        if ((student.planDiscount || 0) > 0) {
            addDetailLine('Desconto Aplicado:', `- R$ ${student.planDiscount?.toFixed(2)}`);
        }
        
        doc.setFont('helvetica', 'bold');
        addDetailLine('VALOR FINAL MENSAL:', `R$ ${finalValue.toFixed(2)}`);
        y += 5;

    } else {
        y = addText('Nenhum plano selecionado no cadastro do aluno.', margin, y, { style: 'bold', color: '#ef4444' });
    }

    doc.line(margin, y, pageWidth - margin, y); // horizontal line
    y += 15;

    doc.setFontSize(8);
    y = addText('CLIENTES do quadro discente anterior a 2023 terão um desconto de R$10.', margin, y);
    y = addText('Atestado Médico é obrigatório para todos e a Avaliação Física será cobrada no dia da mesma no valor de R$ 20,00.', margin, y);
    y += 15;
    
    doc.setFontSize(9);
    
    // Check for page break
    if (y > pageHeight - 250) {
        doc.addPage();
        y = margin;
    }

    y = addClause('Cláusula 7ª.', 'O CLIENTE/ RESPONSÁVEL se obriga a ressarcir a ACADEMIA por qualquer dano causado por ele, por dolo ou culpa, até 48 horas após a constatação do evento e sua consequente comunicação formal ao CLIENTE.', y);
    y = addClause('Cláusula 8ª.', 'Após 30 dias de inadimplência, a matrícula será trancada automaticamente e o cliente considerado desistente.', y);
    y = addParagraph('Parágrafo 1º.', 'Se algum recesso na oferta de sessões de treinos ocorrerem por iniciativa da ACADEMIA, o ressarcimento do CLIENTE se dará na forna de reposição de aulas.', y);
    y = addParagraph('Parágrafo 2º.', 'Caso o CLIENTE venha solicitar trancamento de sua matrícula durante a vigência deste contrato, por qualquer que seja o motivo, terá o mesmo que fazê-lo por escrito de próprio punho, justificando o motivo e só após data da entrega da solicitação terá direito aos dias que faltarem para o término do seu contrato, retirando na recepção o contra-recibo dos dias restantes.', y);
    y = addClause('Cláusula 9ª RENOVAÇÃO.', 'Após o período discriminado na Cláusula 1ª, um novo contrato precisará ser firmado, caso haja interesse de ambas as partes.', y);
    y = addClause('Cláusula 10ª. RESCISÃO.', 'O presente instrumento NÃO poderá ser rescindido unilateralmente a qualquer momento por qualquer uma das partes.', y);
    y = addParagraph('Parágrafo Único –', 'Caso o CLIENTE desista expressamente do contrato em qualquer época, a ACADEMIA cobrará 50% do período não usufruído, por ter-se caracterizado uma quebra de contrato por parte do CLIENTE.', y);
    
    if (y > pageHeight - 150) {
        doc.addPage();
        y = margin;
    }

    y = addClause('Cláusula 11ª FORO.', 'As partes atribuem ao presente contrato plena eficácia e força executiva e extrajudicial.. Para dirimir quaisquer controvérsias originadas por este contrato, fica eleito o Fórum da Comarca de Guaranésia, arcando a parte vencida em demanda judicial com as custas processuais a que der causa e com os honorários advocatícios arbitrados do patrono da parte vencedora.', y);
    
    const finalDeclaration = "Estou ciente de todas as propostas deste Contrato de Prestação de Serviços, dias e horários que escolhi, e assumo a validade e veracidade das cláusulas nele descritas. Declaro ainda estar em perfeitas condições de saúde, conhecendo e assumindo todos os riscos advindos da atividade física à minha pessoa ou àquele por quem me responsabilizo não portando também nenhuma moléstia que possa prejudicar os demais frequentadores da ACADEMIA.\n\nPor estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor, juntamente com duas testemunhas idôneas, rubricando todas as suas páginas.";
    y = addText(finalDeclaration, margin, y, { align: 'justify' });
    y += 20;

    const today = new Date();
    const dateText = `${settings.academyAddress.city}, ${today.toLocaleDateString('pt-BR', { day: '2-digit' })} de ${today.toLocaleDateString('pt-BR', { month: 'long' })} de ${today.toLocaleDateString('pt-BR', { year: 'numeric' })}`;
    y = addText(dateText, pageWidth / 2, y, { align: 'center' });
    y += 40;

    // Signatures
    doc.setFontSize(9);
    y = addText(`Nome do Contratante: _______________________________________________________ Assinatura: _______________________________________________`, margin, y);
    y = addText(student.name.toUpperCase(), margin + 110, y - 14);
    y += 20;

    y = addText(`Representante do Contratado:________________________________________________ Assinatura: _______________________________________________`, margin, y);
    y = addText(settings.representativeName.toUpperCase(), margin + 145, y - 14);
    y += 20;

    y = addText('Nome testemunha 1: _________________________________________ R.G. ______________________ Assinatura: ___________________________________', margin, y);
    y += 20;
    
    y = addText('Nome testemunha 1: _________________________________________ R.G. ______________________ Assinatura: ___________________________________', margin, y);
    y += 30;

    // Addendum
    if (y > pageHeight - 200) {
        doc.addPage();
        y = margin;
    }

    y = addText('Termos Aditivos de Prorrogação do Presente Contrato', pageWidth/2, y, {style: 'bold', align: 'center'});
    y += 15;
    y = addText('As partes identificadas acima estão em comum acordo em celebrar as seguintes prorrogações de vigência do presente contrato;', margin, y);
    y += 15;
    
    const addendumBlock = (letter: string, startY: number) => {
        let currentY = startY;
        currentY = addText(`${letter}. Por ______ mês(es) adicionais, a partir de ____/____/__________ Assinaturas:`, margin, currentY);
        currentY = addText('Contrante- ____________________________________________________ Contratado- ____________________________________________________', margin, currentY);
        currentY = addText('Nome testemunha 1: ___________________________________ R.G. ______________________ Assinatura: ________________________________', margin, currentY);
        currentY = addText('Nome testemunha 2: ___________________________________ R.G. ______________________ Assinatura: ________________________________', margin, currentY);
        return currentY + 10;
    };
    
    y = addendumBlock('a', y);
    y = addendumBlock('b', y);
    y = addendumBlock('c', y);

    return doc;
  },

  generateContract: async (student: User) => {
    if (!student.cpf || !student.rg || !student.address?.zipCode) {
      throw new Error("Dados cadastrais incompletos para gerar o contrato. Verifique CPF, RG e Endereço.");
    }
    if (!student.planId) {
        throw new Error("O aluno não possui um plano ativo. Associe um plano no cadastro antes de gerar o contrato.");
    }

    const [settings, plans] = await Promise.all([
      SettingsService.getSettings(),
      SupabaseService.getPlans()
    ]);
    
    const doc = ContractService._createContractDoc(student, settings, plans);
    doc.save(`Contrato_${student.name.replace(/\s/g, '_')}.pdf`);
  }
};