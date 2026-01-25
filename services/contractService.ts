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

    // Helper para adicionar texto com quebra de linha automática
    const addText = (text: string, x: number, startY: number, options: any = {}) => {
        doc.setFont(options.font || 'helvetica', options.style || 'normal');
        doc.setFontSize(options.size || 9);
        doc.setTextColor(options.color || '#000000');
        const splitText = doc.splitTextToSize(text, options.maxWidth || pageWidth - margin * 2 - (x - margin));
        doc.text(splitText, x, startY, { align: options.align || 'left' });
        const textHeight = doc.getTextDimensions(splitText, { fontSize: options.size || 9 }).h;
        return startY + textHeight + (options.lineSpacing || 4);
    };
    
    // Helper para adicionar uma linha com texto e preenchimento
    const addField = (label: string, value: string | undefined, x: number, startY: number, lineWidth: number) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(label, x, startY);
        const labelWidth = doc.getTextWidth(label);
        
        doc.setFont('helvetica', 'bold');
        doc.text(String(value || '').toUpperCase(), x + labelWidth, startY);
        doc.setDrawColor(0);
        doc.line(x + labelWidth, startY + 2, x + lineWidth, startY + 2);
        return startY;
    };


    // =========================================================================
    // PÁGINA 1
    // =========================================================================

    // Cabeçalho
    y = addText('STUDIO SAÚDE EM MOVIMENTO', pageWidth / 2, y, { size: 12, style: 'bold', align: 'center' });
    y = addText('Rua Barão do Rio Branco 95 – Centro – Guaranésia/MG', pageWidth / 2, y, { size: 9, style: 'normal', align: 'center' });
    y = addText(`CNPJ: ${settings.cnpj}`, pageWidth / 2, y, { size: 9, style: 'normal', align: 'center' });
    y += 15;

    // CONTRATADA
    y = addText('CONTRATATADA (ACADEMIA):', margin, y, { style: 'bold' });
    const academyAddressStr = `${settings.academyAddress.street}, ${settings.academyAddress.number}, Bairro: ${settings.academyAddress.neighborhood}, CEP: ${settings.academyAddress.zipCode} Cidade de ${settings.academyAddress.city}, Estado de ${settings.academyAddress.state}`;
    let contratadaText = `Studio Saúde Em Movimento, ${academyAddressStr}, CNPJ ${settings.cnpj}, Proprietário: ${settings.representativeName}, Residente: Rua Roque Taliberti 66, Bairro: Jr, RG: 067441-AP, CPF: 41602359849, Cidade de Guaranésia, Estado de Minas Gerais`;
    y = addText(contratadaText, margin, y, { align: 'justify' });
    y += 10;

    // CONTRATANTE
    y = addText('CONTRATANTE (CLIENTE):', margin, y, { style: 'bold' });
    
    let lineY = y;
    addField('', student.name, margin, lineY, 380);
    addField('Nascimento:', undefined, 400, lineY, 515);
    if(student.birthDate) doc.text(new Date(student.birthDate + 'T03:00:00').toLocaleDateString('pt-BR'), 455, lineY);

    lineY += 18;
    addField('Carteira de Identidade n°', student.rg, margin, lineY, 200);
    addField('CPF n°', student.cpf, 220, lineY, 350);
    addField('residente na Rua', student.address?.street, 360, lineY, 515);

    lineY += 18;
    addField('n°', student.address?.number, margin, lineY, 100);
    addField('CEP', student.address?.zipCode, 110, lineY, 230);
    addField('Cidade', student.address?.city, 240, lineY, 400);
    addField('fone', student.phoneNumber, 410, lineY, 515);
    y = lineY + 18;

    y = addText('As partes identificadas acima têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas a seguir:', margin, y, { align: 'justify' });
    y += 5;

    // Cláusulas
    const clauses1 = [
        { title: 'Cláusula 1ª.', text: `O objeto do presente contrato é a prestação, pela ACADEMIA ao CLIENTE, dos serviços de sessões coletivas de atividades físicas, estando com sua proposta em conformidade com o CREF/ CONFEF, através de seus profissionais e das aulas de atividade física. O CLIENTE, através do presente, está se matriculando na ACADEMIA para o período de ${student.planDuration || '___'} meses, cujos treinos ocorrerão nas ☐ segundas, ☐ terças, ☐ quartas, ☐ quintas, ☐ sextas e ☐ sábados, das ___:___ às ___:___ horas.`},
        { sub: 'Parágrafo 1º.', text: 'A direção da ACADEMIA não se recusa a manter um diálogo construtivo com o CLIENTE ou seus RESPONSÁVEIS que demonstre um verdadeiro interesse na melhoria da qualidade das aulas e no seu processo evolutivo.'},
        { sub: 'Parágrafo 2º.', text: 'Solicitações de mudanças eventuais no horário aqui estabelecido deverão ser encaminhadas à ACADEMIA com no mínimo 24 horas de antecedência.'},
        { title: 'Cláusula 2ª.', text: 'O CLIENTE se obriga a observar estrita e exclusivamente as orientações dos profissionais da ACADEMIA para a prática das atividades físicas. A ACADEMIA não se responsabiliza por danos físicos de qualquer natureza resultantes da inobservância do cliente a estas orientações, pelo acatamento à orientação de estranhos ou ainda pelo uso inadequado dos aparelhos e equipamentos da ACADEMIA.'},
        { title: 'Cláusula 3ª.', text: 'Somente nos planos trimestral e semestral será concedida uma licença de afastamento de respectivamente 7 e 15 dias, com direito a reposição do período não usufruído ao final do período contratado. Esta licença deverá ser formalizada junto à recepção da ACADEMIA por escrito e com pelo menos 15 dias de antecedência.. Casos excepcionais serão tratados em comum acordo.'},
        { title: 'Cláusula 4ª.', text: 'A ACADEMIA, livre de quaisquer ônus para com o CLIENTE, poderá utilizar-se da sua imagem para fins exclusivos de divulgação da ACADEMIA e suas atividades, podendo, para tanto, reproduzi-la ou divulgá-la junto a internet, jornais e todos os demais meios de comunicação públicos ou privados.'},
        { sub: 'Parágrafo 1º.', text: 'Em nenhuma hipótese poderá a imagem do CLIENTE ser utilizada de maneira contrária à moral ou aos bons costumes ou à ordem pública.'},
        { sub: 'Parágrafo 2º.', text: 'O não comparecimento do CLIENTE às dependências da ACADEMIA, ora contratada, não exime o pagamento, tendo em vista a disponibilidade do serviço.'},
        { sub: 'Parágrafo 3º.', text: 'No caso de menores, após o término das sessões, deverá o RESPONSÁVEL retirá-lo em seguida.'},
        { title: 'Cláusula 5ª.', text: 'Todo o regulamento interno da ACADEMIA precisa ser seguido pelo CLIENTE.'},
        { title: 'Cláusula 6ª REMUNERAÇÃO.', text: 'Pela prestação dos serviços, referentes ao período contratado conforme previsto na cláusula 1ª, o CLIENTE pagará à ACADEMIA tanto à vista em dinheiro bem como parcelado ou à vista no pix ou cartão todo o período contratado no ato da matrícula a tempo e modo conforme opção feita pelo CLIENTE entre as abaixo especificadas em valores mensais.'}
    ];

    clauses1.forEach(c => {
        let fullText = c.text;
        doc.setFont('helvetica', 'bold');
        if(c.title) {
            doc.text(c.title, margin, y);
            fullText = `     ${c.text}`;
        } else if (c.sub) {
            doc.text(c.sub, margin, y);
            fullText = `      ${c.text}`;
        }
        y = addText(fullText, margin, y, {align: 'justify', style: 'normal'});
        y += 5;
    });

    // Planos Dinâmicos
    const kidsPlans = plans.filter(p => p.planType === 'KIDS');
    const regularPlans = plans.filter(p => ['MENSAL', 'TRIMESTRAL', 'SEMESTRAL'].includes(p.planType));
    const avulsoPlans = plans.filter(p => p.planType === 'AVULSO');
    
    const startY = y;
    let contentY = y + 10;
    
    if (kidsPlans.length > 0) {
        contentY = addText("Plano Kids (para crianças até 12 anos):", margin + 5, contentY, { style: 'bold' });
        const line = 'Mensal: ' + kidsPlans.map(p => `☐ R$${p.price.toFixed(2)} ${p.frequency}`).join('  ');
        contentY = addText(line, margin + 15, contentY, {});
        contentY += 5;
    }
    
    if (regularPlans.length > 0) {
        contentY = addText("Plano para Alunos (adolescentes e adultos):", margin + 5, contentY, { style: 'bold' });
    
        const monthly = regularPlans.filter(p => p.planType === 'MENSAL');
        const quarterly = regularPlans.filter(p => p.planType === 'TRIMESTRAL');
        const semiAnnually = regularPlans.filter(p => p.planType === 'SEMESTRAL');
    
        if (monthly.length > 0) {
            const line = 'Mensal: ' + monthly.map(p => `☐ R$${p.price.toFixed(2)} ${p.frequency}`).join('  ');
            contentY = addText(line, margin + 15, contentY, {});
        }
        if (quarterly.length > 0) {
            const line = 'Trimestral: ' + quarterly.map(p => `☐ R$${p.price.toFixed(2)} ${p.frequency}`).join('  ');
            contentY = addText(line, margin + 15, contentY, {});
        }
        if (semiAnnually.length > 0) {
            const line = 'Semestral: ' + semiAnnually.map(p => `☐ R$${p.price.toFixed(2)} ${p.frequency}`).join('  ');
            contentY = addText(line, margin + 15, contentY, {});
        }
        contentY += 5;
    }
    
    if (avulsoPlans.length > 0) {
        contentY = addText("Plano Avulso:", margin + 5, contentY, { style: 'bold' });
        const line = avulsoPlans.map(p => `☐ R$${p.price.toFixed(2)} (${p.frequency})`).join('  ');
        contentY = addText(line, margin + 15, contentY, {});
        contentY += 5;
    }
    
    const finalContentY = contentY;
    const rectHeight = finalContentY - startY + 5; 
    
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin, startY, pageWidth - margin * 2, rectHeight);
    y = startY + rectHeight + 5;


    // =========================================================================
    // PÁGINA 2
    // =========================================================================
    doc.addPage();
    y = margin;

    const clauses2 = [
        { text: 'CLIENTES do quadro discente anterior a 2023 terão um desconto de R$10.'},
        { text: 'Atestado Médico é obrigatórios para todos e a Avaliação Física será cobrada no dia da mesma no valor de R$ 20,00.'},
        { title: 'Cláusula 7ª.', text: 'O CLIENTE/ RESPONSÁVEL se obriga a ressarcir a ACADEMIA por qualquer dano causado por ele, por dolo ou culpa, até 48 horas após a constatação do evento e sua consequente comunicação formal ao CLIENTE.'},
        { title: 'Cláusula 8ª.', text: 'Após 30 dias de inadimplência, a matrícula será trancada automaticamente e o cliente considerado desistente.'},
        { sub: 'Parágrafo 1º.', text: 'Se algum recesso na oferta de sessões de treinos ocorrerem por iniciativa da ACADEMIA, o ressarcimento do CLIENTE se dará na forma de reposição de aulas.'},
        { sub: 'Parágrafo 2º.', text: 'Caso o CLIENTE venha solicitar trancamento de sua matrícula durante a vigência deste contrato, por qualquer que seja o motivo, terá o mesmo que fazê-lo por escrito de próprio punho, justificando o motivo e só após data da entrega da solicitação terá direito aos dias que faltarem para o término do seu contrato, retirando na recepção o contra-recibo dos dias restantes.'},
        { title: 'Cláusula 9ª RENOVAÇÃO.', text: 'Após o período discriminado na Cláusula 1ª, um novo contrato precisará ser firmado, caso haja interesse de ambas as partes.'},
        { title: 'Cláusula 10ª. RESCISÃO.', text: 'O presente instrumento NÃO poderá ser rescindido unilateralmente a qualquer momento por qualquer uma das partes.'},
        { sub: 'Parágrafo Único –', text: 'Caso o CLIENTE desista expressamente do contrato em qualquer época, a ACADEMIA cobrará 50% do período não usufruído, por ter-se caracterizado uma quebra de contrato por parte do CLIENTE.'},
        { title: 'Cláusula 11ª FORO.', text: 'As partes atribuem ao presente contrato plena eficácia e força executiva e extrajudicial.. Para dirimir quaisquer controvérsias originadas por este contrato, fica eleito o Fórum da Comarca de Guaranésia, arcando a parte vencida em demanda judicial com as custas processuais a que der causa e com os honorários advocatícios arbitrados do patrono da parte vencedora.'},
    ];

    clauses2.forEach(c => {
        let fullText = c.text;
        doc.setFont('helvetica', 'bold');
        if(c.title) {
            doc.text(c.title, margin, y);
            fullText = `     ${c.text}`;
        } else if (c.sub) {
            doc.text(c.sub, margin, y);
            fullText = `      ${c.text}`;
        }
        y = addText(fullText, margin, y, {align: 'justify', style: 'normal'});
        y += 5;
    });

    y += 10;
    const finalDeclaration = "Estou ciente de todas as propostas deste Contrato de Prestação de Serviços, dias e horários que escolhi, e assumo a validade e veracidade das cláusulas nele descritas. Declaro ainda estar em perfeitas condições de saúde, conhecendo e assumindo todos os riscos advindos da atividade física à minha pessoa ou àquele por quem me responsabilizo não portando também nenhuma moléstia que possa prejudicar os demais frequentadores da ACADEMIA.\n\nPor estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor, juntamente com duas testemunhas idôneas, rubricando todas as suas páginas.";
    y = addText(finalDeclaration, margin, y, {align: 'justify'});
    y += 20;

    const today = new Date();
    const dateText = `Guaranésia, ${today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    y = addText(dateText, pageWidth / 2, y, { align: 'center' });
    y += 40;

    // Assinaturas
    const addSignatureLine = (label: string, sublabel?: string) => {
        doc.line(margin, y + 2, margin + 250, y + 2);
        y = addText(label, margin, y + 8, {style: 'bold'});
        if(sublabel) y = addText(sublabel, margin, y, {});
        y += 20;
    };
    
    addSignatureLine(`Nome do Contratante: ${student.name.toUpperCase()}`, 'Assinatura:');
    addSignatureLine(`Representante do Contratado: ${settings.representativeName.toUpperCase()}`, 'Assinatura:');
    addSignatureLine('Nome testemunha 1:', 'R.G.                                    Assinatura:');
    addSignatureLine('Nome testemunha 2:', 'R.G.                                    Assinatura:');
    y+=10;

    // Termos Aditivos
    y = addText('Termos Aditivos de Prorrogação do Presente Contrato', pageWidth / 2, y, { style: 'bold', align: 'center' });
    y = addText('As partes identificadas acima estão em comum acordo em celebrar as seguintes prorrogações de vigência do presente contrato;', margin, y, {align: 'justify'});

    const addAditivo = (letter: string) => {
        y += 15;
        y = addText(`${letter}. Por ___ mês(es) adicionais, a partir de ___/___/___.`, margin, y);
        y = addText('Assinaturas:', margin, y);
        y = addText('Contrante- _________________________ Contratado- _________________________', margin, y);
        y = addText('Nome testemunha 1: __________________ R.G. ___________ Assinatura: ______________', margin, y);
        y = addText('Nome testemunha 2: __________________ R.G. ___________ Assinatura: ______________', margin, y);
    };

    addAditivo('a');
    addAditivo('b');
    
    return doc;
  },

  generateContract: async (student: User) => {
    const settings = await SettingsService.getSettings();
    const plans = await SupabaseService.getPlans();
    if (!student.cpf || !student.rg || !student.address?.street) {
        alert("Faltam dados essenciais do aluno (CPF, RG, Endereço) para gerar o contrato.");
        return;
    }
    const doc = ContractService._createContractDoc(student, settings, plans);
    doc.save(`Contrato_${String(student.name).replace(/\s+/g, '_')}.pdf`);
  }
};