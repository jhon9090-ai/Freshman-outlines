
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StudyOutline } from '../types';

const checkYAndAddPage = (doc: jsPDF, currentY: number, requiredHeight: number): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  if (currentY + requiredHeight > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return currentY;
};

export const generateOutlinePdf = (outline: StudyOutline): void => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Add Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(outline.title, pageWidth - margin * 2);
  y = checkYAndAddPage(doc, y, titleLines.length * 10);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 10;
  doc.setFont('helvetica', 'normal');

  // Add Subject and Date
  doc.setFontSize(12);
  doc.setTextColor(100);
  y = checkYAndAddPage(doc, y, 12);
  doc.text(`Subject: ${outline.subject}`, margin, y);
  y += 6;
  doc.text(`Created: ${new Date(outline.createdAt).toLocaleDateString()}`, margin, y);
  y += 10;
  doc.setTextColor(0);

  // Add Main Topics
  (outline.mainTopics || []).forEach(mainTopic => {
    y = checkYAndAddPage(doc, y, 10);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(mainTopic.title, margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');

    mainTopic.subtopics.forEach(subtopic => {
      y = checkYAndAddPage(doc, y, 8);
      doc.setFontSize(12);
      doc.text(`- ${subtopic.title}`, margin + 5, y);
      y += 6;

      doc.setFontSize(10);
      doc.setTextColor(80);
      subtopic.learningObjectives.forEach(obj => {
        const splitText = doc.splitTextToSize(`• ${obj.text}`, pageWidth - margin * 2 - 25);
        y = checkYAndAddPage(doc, y, splitText.length * 4);
        doc.text(splitText, margin + 10, y);
        y += splitText.length * 4 + 1;
      });
      y += 4;
      doc.setTextColor(0);
    });
    y += 5;
  });

  doc.save(`${outline.title.replace(/ /g, '_')}.pdf`);
};

export const generateProgressReportPdf = (outline: StudyOutline, mentorFeedback: string): void => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Study Progress Report', margin, y);
  y += 10;

  // Outline Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(outline.title, margin, y);
  y += 15;
  doc.setTextColor(0);

  // Progress Stats
  const totalObjectives = (outline.mainTopics || []).flatMap(t => t.subtopics.flatMap(st => st.learningObjectives)).length;
  const completedCount = outline.completedObjectives.length;
  const progress = totalObjectives > 0 ? Math.round((completedCount / totalObjectives) * 100) : 0;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Completion: ${completedCount} / ${totalObjectives} objectives (${progress}%)`, margin, y);
  y += 10;
  
  // AI Mentor Feedback
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Mentor's Feedback", margin, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const feedbackLines = doc.splitTextToSize(mentorFeedback, pageWidth - margin * 2);
  doc.text(feedbackLines, margin, y);
  y += feedbackLines.length * 5 + 10;

  // Detailed Progress
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  y = checkYAndAddPage(doc, y, 10);
  doc.text('Detailed Progress Checklist', margin, y);
  y += 10;

  (outline.mainTopics || []).forEach(mainTopic => {
    y = checkYAndAddPage(doc, y, 10);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(mainTopic.title, margin, y);
    y += 8;

    mainTopic.subtopics.forEach(subtopic => {
      y = checkYAndAddPage(doc, y, 8);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`- ${subtopic.title}`, margin + 5, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      subtopic.learningObjectives.forEach(obj => {
        const isCompleted = outline.completedObjectives.includes(obj.id);
        const prefix = isCompleted ? '✓' : '✗';
        const splitText = doc.splitTextToSize(`${prefix} ${obj.text}`, pageWidth - margin * 2 - 15);
        y = checkYAndAddPage(doc, y, splitText.length * 4 + 2);
        if (isCompleted) {
          doc.setTextColor(0, 150, 0);
        } else {
          doc.setTextColor(200, 0, 0);
        }
        doc.text(splitText, margin + 10, y);
        y += splitText.length * 4 + 1;
      });
      y += 4;
      doc.setTextColor(0);
    });
    y += 5;
  });

  doc.save(`${outline.title.replace(/ /g, '_')}_Progress_Report.pdf`);
}

export const generateComponentPdf = async (elementId: string, fileName: string, customBgColor?: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    alert('Error: Could not find element to capture for PDF.');
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: customBgColor || '#0A001F',
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${fileName}.pdf`);
  } catch(e) {
      console.error("Error generating PDF:", e);
      alert('An error occurred while generating the PDF.');
  }
};