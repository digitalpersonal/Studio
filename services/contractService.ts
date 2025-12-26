
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

    // Datas
    const joinDate = student.planStartDate ? new Date(student.planStartDate) : new Date(student.joinDate);
    const startDateStr = joinDate.toLocaleDateString('pt-BR');
    const duration = student.planDuration || 12;
    const endDateObj = new Date(joinDate);
    endDateObj.setMonth(endDateObj.getMonth() + duration);
    const endDateStr = endDateObj.toLocaleDateString('pt-BR');
    
    // Endereço do aluno
    const addr = student.address;
    const addressStr = addr 
      ? `${addr.street}, nº ${addr.number}${addr.complement ? ', ' + addr.complement : ''}, ${addr.neighborhood}, ${addr.city}-${addr.state}, CEP: ${addr.zipCode}`
      : 'Não informado';

    // Endereço da academia
    const academyAddrStr = `${settings.street}, ${settings.number}, ${settings.neighborhood}, ${settings.city}-${settings.state}`;

    // Título
    addText("CONTRATO DE PRESTAÇÃO DE SERVIÇOS FITNESS", 16, "bold", "center");
    cursorY += 5;

    addText("1. IDENTIFICAÇÃO DAS PARTES", 11, "bold");
    const contractorInfo = `CONTRATADA: ${settings.name.toUpperCase()}, CNPJ nº ${settings.cnpj}, com sede em ${academyAddrStr}, representada por ${settings.representativeName}, CPF nº ${settings.representativeCpf}.`;
    addText(contractorInfo);

    const studentInfo = `CONTRATANTE: ${student.name.toUpperCase()}, portador(a) do RG nº ${student.rg || '______'} e CPF nº ${student.cpf || '______'}, residente em ${addressStr}.`;
    addText(studentInfo);
    cursorY += 5;

    addText("2. VIGÊNCIA E VALORES", 11, "bold");
    const planValue = student.planValue || settings.monthlyFee;
    const formattedFee = planValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    addText(`O plano contratado possui duração de ${duration} meses, iniciando em ${startDateStr} e encerrando em ${endDateStr}. O valor mensal é de ${formattedFee}, com vencimento todo dia ${student.billingDay || 5}.`);

    addText("3. TERMOS E CONDIÇÕES", 11, "bold");
    addText(settings.contractTerms);

    cursorY += 20;
    addText(`${settings.city}, ${new Date().toLocaleDateString('pt-BR')}`, 10, "normal", "right");

    cursorY += 30;
    doc.line(20, cursorY, 90, cursorY);
    doc.line(110, cursorY, 180, cursorY);
    cursorY += 5;
    
    doc.setFontSize(8);
    doc.text(settings.name.toUpperCase(), 55, cursorY, { align: "center" });
    doc.text(student.name.toUpperCase(), 145, cursorY, { align: "center" });

    return doc;
  },

  generateContract: (student: User) => {
    const doc = ContractService._createContractDoc(student);
    doc.save(`Contrato_${student.name.replace(/\s+/g, '_')}.pdf`);
  }
};
