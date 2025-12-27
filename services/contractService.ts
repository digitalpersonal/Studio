

import { jsPDF } from "jspdf";
import { User } from "../types";
import { SettingsService } from "./settingsService";

export const ContractService = {
  _createContractDoc: (student: User) => {
    const doc = new jsPDF();
    const settings = SettingsService.getSettings(); 
    let cursorY = 20;

    const addText = (text: string, fontSize: number = 10, fontStyle: string = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fontSize);
      const splitText = doc.splitTextToSize(text, 170);
      if (align === 'center') {
        doc.text(text, 105, cursorY, { align: 'center' });
      } else if (align === 'right') {
        doc.text(text, 190, cursorY, { align: 'right' });
      } else {
        doc.text(splitText, 20, cursorY);
      }
      cursorY += (splitText.length * (fontSize * 0.5)) + 4;
    };

    // Cálculos de datas baseados na recorrência
    const today = new Date();
    const joinDate = student.planStartDate ? new Date(student.planStartDate) : new Date(student.joinDate);
    const startDateStr = joinDate.toLocaleDateString('pt-BR');
    
    const duration = student.planDuration || 12;
    const endDateObj = new Date(joinDate);
    endDateObj.setMonth(endDateObj.getMonth() + duration);
    const endDateStr = endDateObj.toLocaleDateString('pt-BR');
    
    // Endereço do aluno
    const studentAddr = student.address;
    const studentAddressStr = studentAddr 
      ? `${String(studentAddr.street)}, nº ${String(studentAddr.number)}${studentAddr.complement ? ', ' + String(studentAddr.complement) : ''}, ${String(studentAddr.neighborhood)}, ${String(studentAddr.city)}-${String(studentAddr.state)}, CEP: ${String(studentAddr.zipCode)}`
      : 'Não informado';

    // Endereço da Academia (Contratada)
    const academyAddr = settings.academyAddress;
    const academyAddressStr = academyAddr
      ? `${String(academyAddr.street)}, nº ${String(academyAddr.number)}${academyAddr.complement ? ', ' + String(academyAddr.complement) : ''}, ${String(academyAddr.neighborhood)}, ${String(academyAddr.city)}-${String(academyAddr.state)}, CEP: ${String(academyAddr.zipCode)}`
      : 'Não informado';


    // Cabeçalho
    addText("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ATIVIDADE FÍSICA", 14, "bold", "center");
    cursorY += 5;

    addText("1. IDENTIFICAÇÃO DAS PARTES", 11, "bold");
    
    const contractorInfo = `CONTRATADA: ${String(settings.name).toUpperCase()}, CNPJ nº ${String(settings.cnpj)}, com sede em ${academyAddressStr}, representada neste ato por ${String(settings.representativeName)}.`;
    addText(contractorInfo);

    const studentInfo = `CONTRATANTE: ${String(student.name).toUpperCase()}, ${String(student.nationality || 'brasileiro(a)')}, ${String(student.maritalStatus || 'estado civil não informado')}, portador(a) do RG nº ${String(student.rg || '______')} e CPF nº ${String(student.cpf || '______')}, profissão ${String(student.profession || 'não informada')}, residente e domiciliado em ${studentAddressStr}.`;
    addText(studentInfo);
    cursorY += 5;

    addText("2. DO OBJETO E MODALIDADES", 11, "bold");
    addText("O presente contrato tem como objeto a prestação de serviços de orientação em atividade física nas modalidades oferecidas pela CONTRATADA.");

    addText("3. DA VIGÊNCIA E RECORRÊNCIA", 11, "bold");
    addText(`Este contrato terá vigência de ${duration} meses, iniciando em ${startDateStr} e encerrando-se em ${endDateStr}.`);

    addText("4. DOS VALORES E FORMA DE PAGAMENTO", 11, "bold");
    const planValue = student.planValue || settings.monthlyFee;
    const formattedFee = planValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    addText(`O CONTRATANTE pagará à CONTRATADA o valor mensal de ${formattedFee}, com vencimento todo dia ${String(student.billingDay || 5)} de cada mês, durante a vigência deste instrumento.`);

    addText("5. DAS DISPOSIÇÕES GERAIS", 11, "bold");
    addText("O CONTRATANTE declara estar em plenas condições de saúde para a prática de exercícios físicos, isentando a CONTRATADA de responsabilidade por eventos decorrentes de omissão de informações de saúde.");

    cursorY += 15;
    addText(`${String(academyAddr.city || 'Local')}, ${today.toLocaleDateString('pt-BR')}`, 10, "normal", "right"); // Usar cidade da academia

    cursorY += 25;
    doc.line(20, cursorY, 90, cursorY);
    doc.line(110, cursorY, 180, cursorY);
    cursorY += 5;
    
    doc.setFontSize(8);
    doc.text(String(settings.name).toUpperCase(), 55, cursorY, { align: "center" });
    doc.text(String(student.name).toUpperCase(), 145, cursorY, { align: "center" });

    return doc;
  },

  generateContract: (student: User) => {
    const doc = ContractService._createContractDoc(student);
    doc.save(`Contrato_${String(student.name).replace(/\s+/g, '_')}.pdf`);
  }
};