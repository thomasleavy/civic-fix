import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface CaseData {
  caseId: string;
  title: string;
  description: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
  type: 'issue' | 'suggestion';
  images?: string[];
  location?: string;
  address?: string;
}

export const exportToPDF = async (caseData: CaseData, elementId: string = 'print-content'): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Print content element not found');
    }

    // Create a clone of the element for PDF generation
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    document.body.appendChild(clonedElement);

    // Convert to canvas
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Remove cloned element
    document.body.removeChild(clonedElement);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgScaledWidth = imgWidth * ratio;
    const imgScaledHeight = imgHeight * ratio;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, imgScaledWidth, imgScaledHeight);

    // If content is taller than one page, add additional pages
    let heightLeft = imgScaledHeight;
    let position = 0;

    while (heightLeft >= pdfHeight) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -position, imgScaledWidth, imgScaledHeight);
      heightLeft -= pdfHeight;
    }

    // Save PDF
    const fileName = `${caseData.caseId}_${caseData.type}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

export const printCase = (elementId: string = 'print-content'): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Print content element not found');
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  // Get print styles
  const printStyles = `
    <style>
      @media print {
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .no-print { display: none !important; }
        .print-break { page-break-after: always; }
        img { max-width: 100%; height: auto; }
        h1 { color: #1f2937; margin-bottom: 10px; }
        h2 { color: #374151; margin-top: 20px; margin-bottom: 10px; }
        .metadata { border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 20px; }
        .metadata-item { margin-bottom: 10px; }
      }
    </style>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${element.querySelector('h1')?.textContent || 'Case Details'}</title>
        ${printStyles}
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // Wait for images to load, then print
  setTimeout(() => {
    printWindow.print();
    // Close window after printing (optional)
    // printWindow.close();
  }, 250);
};

export const formatCaseForExport = (caseData: CaseData): string => {
  const statusLabels: Record<string, string> = {
    'under_review': 'Under Review',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed',
    'submitted': 'Submitted',
    'approved': 'Approved',
    'implemented': 'Implemented',
    'rejected': 'Rejected',
  };

  const typeLabel = caseData.type === 'issue' ? 'Issue' : 'Suggestion';
  const statusLabel = statusLabels[caseData.status] || caseData.status;

  let text = `CIVICFIX - ${typeLabel.toUpperCase()} REPORT\n`;
  text += '='.repeat(50) + '\n\n';
  text += `Case ID: ${caseData.caseId}\n`;
  text += `Title: ${caseData.title}\n`;
  text += `Status: ${statusLabel}\n`;
  text += `Category: ${caseData.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}\n`;
  text += `Created: ${new Date(caseData.createdAt).toLocaleString()}\n`;
  if (caseData.updatedAt) {
    text += `Last Updated: ${new Date(caseData.updatedAt).toLocaleString()}\n`;
  }
  if (caseData.location) {
    text += `Location: ${caseData.location}\n`;
  }
  if (caseData.address) {
    text += `Address: ${caseData.address}\n`;
  }
  text += '\n' + '-'.repeat(50) + '\n';
  text += 'DESCRIPTION\n';
  text += '-'.repeat(50) + '\n';
  text += `${caseData.description}\n\n`;

  if (caseData.images && caseData.images.length > 0) {
    text += `\nAttached Images: ${caseData.images.length} image(s)\n`;
  }

  text += '\n' + '='.repeat(50) + '\n';
  text += `Generated on: ${new Date().toLocaleString()}\n`;
  text += 'CivicFix - Community Issue Reporting Platform\n';

  return text;
};

export const downloadCaseHistory = (caseData: CaseData): void => {
  const text = formatCaseForExport(caseData);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${caseData.caseId}_history_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
