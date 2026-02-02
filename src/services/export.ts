import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { generateNIRFReport, generateNAACReport, type NIRFMetrics, type NAACCriteria, type AccreditationReportData } from './accreditation'

// JKKN Brand Colors
const JKKN_COLORS = {
  primary: [0, 51, 102] as [number, number, number],   // Navy Blue
  secondary: [204, 153, 0] as [number, number, number], // Gold
  text: [51, 51, 51] as [number, number, number],       // Dark Gray
  lightBg: [245, 245, 245] as [number, number, number], // Light Gray
}

/**
 * Format date for report display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Add JKKN header to PDF
 */
function addPDFHeader(doc: jsPDF, title: string, subtitle: string): number {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header background
  doc.setFillColor(...JKKN_COLORS.primary)
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Institution name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('J.K.K. NATTRAJA EDUCATIONAL INSTITUTIONS', pageWidth / 2, 18, { align: 'center' })

  // Report title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(title, pageWidth / 2, 30, { align: 'center' })

  // Subtitle (date)
  doc.setFontSize(10)
  doc.text(subtitle, pageWidth / 2, 40, { align: 'center' })

  // Reset text color for content
  doc.setTextColor(...JKKN_COLORS.text)

  return 55 // Return Y position after header
}

/**
 * Add section title to PDF
 */
function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...JKKN_COLORS.secondary)
  doc.rect(14, y - 5, doc.internal.pageSize.getWidth() - 28, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 18, y + 2)
  doc.setTextColor(...JKKN_COLORS.text)
  return y + 15
}

/**
 * Add footer to PDF pages
 */
function addPDFFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Generated from JKKN Solutions Hub | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
    doc.text(
      'solutions.jkkn.ai',
      pageWidth - 14,
      pageHeight - 10,
      { align: 'right' }
    )
  }
}

/**
 * Export NIRF Report as PDF
 */
export async function exportNIRFReportPDF(): Promise<Blob> {
  const report = await generateNIRFReport()
  const metrics = report.metrics as NIRFMetrics
  const doc = new jsPDF()

  let y = addPDFHeader(
    doc,
    'NIRF Metrics Report',
    `Generated on ${formatDate(new Date(report.generatedAt))}`
  )

  // Score Summary
  y = addSectionTitle(doc, 'OVERALL SCORE SUMMARY', y)

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Score', 'Max Score', 'Percentage']],
    body: [
      ['Total NIRF Score', metrics.totalScore.toString(), metrics.maxTotalScore.toString(), `${((metrics.totalScore / metrics.maxTotalScore) * 100).toFixed(1)}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // RP - Research and Professional Practice
  y = addSectionTitle(doc, 'RP - RESEARCH & PROFESSIONAL PRACTICE', y)

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Publications', metrics.RP.totalPublications.toString()],
      ['Scopus Indexed Publications', metrics.RP.scopusPublications.toString()],
      ['UGC-CARE Publications', metrics.RP.ugcCarePublications.toString()],
      ['Consultancy Projects Completed', metrics.RP.consultancyProjects.toString()],
      ['Section Score', `${metrics.RP.score} / ${metrics.RP.maxScore}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // GO - Graduation Outcomes
  y = addSectionTitle(doc, 'GO - GRADUATION OUTCOMES', y)

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Placement Rate', `${metrics.GO.placementRate}%`],
      ['Higher Studies', `${metrics.GO.higherStudies}%`],
      ['Entrepreneurship', `${metrics.GO.entrepreneurship}%`],
      ['Section Score', `${metrics.GO.score} / ${metrics.GO.maxScore}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Check if we need a new page
  if (y > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage()
    y = 20
  }

  // OI - Outreach and Inclusivity
  y = addSectionTitle(doc, 'OI - OUTREACH & INCLUSIVITY', y)

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Regional Diversity', `${metrics.OI.regionalDiversity}%`],
      ['Women Enrollment', `${metrics.OI.womenEnrollment}%`],
      ['Economically Disadvantaged', `${metrics.OI.economicallyDisadvantaged}%`],
      ['Section Score', `${metrics.OI.score} / ${metrics.OI.maxScore}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // PR - Perception
  y = addSectionTitle(doc, 'PR - PERCEPTION', y)

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Academic Peers Rating', `${metrics.PR.academicPeers}%`],
      ['Employers Rating', `${metrics.PR.employers}%`],
      ['Section Score', `${metrics.PR.score} / ${metrics.PR.maxScore}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Publications Summary
  if (report.publications.total > 0) {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      y = 20
    }

    y = addSectionTitle(doc, 'PUBLICATIONS SUMMARY', y)

    const pubByType = Object.entries(report.publications.byType || {})
      .map(([type, count]) => [type.replace(/_/g, ' ').toUpperCase(), count.toString()])

    const pubByJournal = Object.entries(report.publications.byJournal || {})
      .map(([type, count]) => [type.replace(/_/g, ' ').toUpperCase(), count.toString()])

    if (pubByJournal.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Journal Type', 'Count']],
        body: pubByJournal,
        theme: 'striped',
        headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      })

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
    }
  }

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      y = 20
    }

    y = addSectionTitle(doc, 'IMPROVEMENT RECOMMENDATIONS', y)

    autoTable(doc, {
      startY: y,
      head: [['#', 'Recommendation']],
      body: report.recommendations.map((rec, i) => [(i + 1).toString(), rec]),
      theme: 'striped',
      headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 'auto' } },
      margin: { left: 14, right: 14 },
    })
  }

  // Add footer to all pages
  addPDFFooter(doc)

  return doc.output('blob')
}

/**
 * Export NAAC Report as PDF
 */
export async function exportNAACReportPDF(): Promise<Blob> {
  const report = await generateNAACReport()
  const criteria = report.metrics as NAACCriteria
  const doc = new jsPDF()

  let y = addPDFHeader(
    doc,
    'NAAC Assessment Report',
    `Generated on ${formatDate(new Date(report.generatedAt))}`
  )

  // Score Summary with Grade
  y = addSectionTitle(doc, 'OVERALL ASSESSMENT SUMMARY', y)

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Score', `${criteria.totalScore} / ${criteria.maxTotalScore}`],
      ['CGPA (out of 4.0)', criteria.cgpa.toFixed(2)],
      ['Grade', criteria.grade],
      ['Percentage', `${((criteria.totalScore / criteria.maxTotalScore) * 100).toFixed(1)}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Criteria Summary Table
  y = addSectionTitle(doc, 'CRITERIA-WISE SCORES', y)

  autoTable(doc, {
    startY: y,
    head: [['Criterion', 'Description', 'Score', 'Max', '%']],
    body: [
      ['C1', 'Curricular Aspects', criteria.C1.score.toString(), criteria.C1.maxScore.toString(), `${((criteria.C1.score / criteria.C1.maxScore) * 100).toFixed(0)}%`],
      ['C2', 'Teaching-Learning & Evaluation', criteria.C2.score.toString(), criteria.C2.maxScore.toString(), `${((criteria.C2.score / criteria.C2.maxScore) * 100).toFixed(0)}%`],
      ['C3', 'Research, Innovations & Extension', criteria.C3.score.toString(), criteria.C3.maxScore.toString(), `${((criteria.C3.score / criteria.C3.maxScore) * 100).toFixed(0)}%`],
      ['C4', 'Infrastructure & Learning Resources', criteria.C4.score.toString(), criteria.C4.maxScore.toString(), `${((criteria.C4.score / criteria.C4.maxScore) * 100).toFixed(0)}%`],
      ['C5', 'Student Support & Progression', criteria.C5.score.toString(), criteria.C5.maxScore.toString(), `${((criteria.C5.score / criteria.C5.maxScore) * 100).toFixed(0)}%`],
      ['C6', 'Governance, Leadership & Management', criteria.C6.score.toString(), criteria.C6.maxScore.toString(), `${((criteria.C6.score / criteria.C6.maxScore) * 100).toFixed(0)}%`],
      ['C7', 'Institutional Values & Best Practices', criteria.C7.score.toString(), criteria.C7.maxScore.toString(), `${((criteria.C7.score / criteria.C7.maxScore) * 100).toFixed(0)}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 70 } },
    margin: { left: 14, right: 14 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Detailed Criterion Breakdowns
  // C1 - Curricular Aspects
  if (y > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage()
    y = 20
  }

  y = addSectionTitle(doc, 'C1 - CURRICULAR ASPECTS (Details)', y)

  autoTable(doc, {
    startY: y,
    head: [['Sub-Criterion', 'Score']],
    body: [
      ['Curriculum Design', criteria.C1.curriculumDesign.toString()],
      ['Academic Flexibility', criteria.C1.academicFlexibility.toString()],
      ['Curriculum Enrichment', criteria.C1.curriculumEnrichment.toString()],
      ['Feedback System', criteria.C1.feedback.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // C3 - Research (most important for accreditation)
  y = addSectionTitle(doc, 'C3 - RESEARCH, INNOVATIONS & EXTENSION (Details)', y)

  autoTable(doc, {
    startY: y,
    head: [['Sub-Criterion', 'Score']],
    body: [
      ['Publications', criteria.C3.publications.toString()],
      ['Consultancy', criteria.C3.consultancy.toString()],
      ['Extension Activities', criteria.C3.extension.toString()],
      ['Collaborations', criteria.C3.collaboration.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Publications Summary
  if (report.publications.total > 0) {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      y = 20
    }

    y = addSectionTitle(doc, 'PUBLICATIONS SUMMARY', y)

    const pubByJournal = Object.entries(report.publications.byJournal || {})
      .map(([type, count]) => [type.replace(/_/g, ' ').toUpperCase(), count.toString()])

    if (pubByJournal.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Journal Type', 'Count']],
        body: pubByJournal,
        theme: 'striped',
        headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      })

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
    }
  }

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      y = 20
    }

    y = addSectionTitle(doc, 'IMPROVEMENT RECOMMENDATIONS', y)

    autoTable(doc, {
      startY: y,
      head: [['#', 'Recommendation']],
      body: report.recommendations.map((rec, i) => [(i + 1).toString(), rec]),
      theme: 'striped',
      headStyles: { fillColor: JKKN_COLORS.primary, fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 'auto' } },
      margin: { left: 14, right: 14 },
    })
  }

  // Add footer to all pages
  addPDFFooter(doc)

  return doc.output('blob')
}

/**
 * Export NIRF Report as Excel
 */
export async function exportNIRFReportExcel(): Promise<Blob> {
  const report = await generateNIRFReport()
  const metrics = report.metrics as NIRFMetrics

  const wb = XLSX.utils.book_new()

  // Summary Sheet
  const summaryData = [
    ['JKKN INSTITUTIONS - NIRF METRICS REPORT'],
    [`Generated: ${formatDate(new Date(report.generatedAt))}`],
    [],
    ['OVERALL SCORE SUMMARY'],
    ['Metric', 'Score', 'Max Score', 'Percentage'],
    ['Total NIRF Score', metrics.totalScore, metrics.maxTotalScore, `${((metrics.totalScore / metrics.maxTotalScore) * 100).toFixed(1)}%`],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // Research & Professional Practice
  const rpData = [
    ['RP - RESEARCH & PROFESSIONAL PRACTICE'],
    [],
    ['Metric', 'Value'],
    ['Total Publications', metrics.RP.totalPublications],
    ['Scopus Indexed Publications', metrics.RP.scopusPublications],
    ['UGC-CARE Publications', metrics.RP.ugcCarePublications],
    ['Consultancy Projects Completed', metrics.RP.consultancyProjects],
    [],
    ['Section Score', metrics.RP.score],
    ['Maximum Score', metrics.RP.maxScore],
    ['Percentage', `${((metrics.RP.score / metrics.RP.maxScore) * 100).toFixed(1)}%`],
  ]

  const rpSheet = XLSX.utils.aoa_to_sheet(rpData)
  rpSheet['!cols'] = [{ wch: 35 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, rpSheet, 'RP - Research')

  // Graduation Outcomes
  const goData = [
    ['GO - GRADUATION OUTCOMES'],
    [],
    ['Metric', 'Value'],
    ['Placement Rate', `${metrics.GO.placementRate}%`],
    ['Higher Studies', `${metrics.GO.higherStudies}%`],
    ['Entrepreneurship', `${metrics.GO.entrepreneurship}%`],
    [],
    ['Section Score', metrics.GO.score],
    ['Maximum Score', metrics.GO.maxScore],
    ['Percentage', `${((metrics.GO.score / metrics.GO.maxScore) * 100).toFixed(1)}%`],
  ]

  const goSheet = XLSX.utils.aoa_to_sheet(goData)
  goSheet['!cols'] = [{ wch: 35 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, goSheet, 'GO - Graduation')

  // Outreach & Inclusivity
  const oiData = [
    ['OI - OUTREACH & INCLUSIVITY'],
    [],
    ['Metric', 'Value'],
    ['Regional Diversity', `${metrics.OI.regionalDiversity}%`],
    ['Women Enrollment', `${metrics.OI.womenEnrollment}%`],
    ['Economically Disadvantaged', `${metrics.OI.economicallyDisadvantaged}%`],
    [],
    ['Section Score', metrics.OI.score],
    ['Maximum Score', metrics.OI.maxScore],
    ['Percentage', `${((metrics.OI.score / metrics.OI.maxScore) * 100).toFixed(1)}%`],
  ]

  const oiSheet = XLSX.utils.aoa_to_sheet(oiData)
  oiSheet['!cols'] = [{ wch: 35 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, oiSheet, 'OI - Outreach')

  // Perception
  const prData = [
    ['PR - PERCEPTION'],
    [],
    ['Metric', 'Value'],
    ['Academic Peers Rating', `${metrics.PR.academicPeers}%`],
    ['Employers Rating', `${metrics.PR.employers}%`],
    [],
    ['Section Score', metrics.PR.score],
    ['Maximum Score', metrics.PR.maxScore],
    ['Percentage', `${((metrics.PR.score / metrics.PR.maxScore) * 100).toFixed(1)}%`],
  ]

  const prSheet = XLSX.utils.aoa_to_sheet(prData)
  prSheet['!cols'] = [{ wch: 35 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, prSheet, 'PR - Perception')

  // Publications
  const pubData = [
    ['PUBLICATIONS SUMMARY'],
    [],
    ['Total Publications', report.publications.total],
    [],
    ['By Journal Type'],
    ['Type', 'Count'],
    ...Object.entries(report.publications.byJournal || {}).map(([type, count]) => [type.replace(/_/g, ' ').toUpperCase(), count]),
    [],
    ['By Paper Type'],
    ['Type', 'Count'],
    ...Object.entries(report.publications.byType || {}).map(([type, count]) => [type.replace(/_/g, ' ').toUpperCase(), count]),
    [],
    ['By Status'],
    ['Status', 'Count'],
    ...Object.entries(report.publications.byStatus || {}).map(([status, count]) => [status.replace(/_/g, ' ').toUpperCase(), count]),
  ]

  const pubSheet = XLSX.utils.aoa_to_sheet(pubData)
  pubSheet['!cols'] = [{ wch: 30 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, pubSheet, 'Publications')

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    const recData = [
      ['IMPROVEMENT RECOMMENDATIONS'],
      [],
      ['#', 'Recommendation'],
      ...report.recommendations.map((rec, i) => [i + 1, rec]),
    ]

    const recSheet = XLSX.utils.aoa_to_sheet(recData)
    recSheet['!cols'] = [{ wch: 5 }, { wch: 80 }]
    XLSX.utils.book_append_sheet(wb, recSheet, 'Recommendations')
  }

  // Generate buffer and convert to Blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/**
 * Export NAAC Report as Excel
 */
export async function exportNAACReportExcel(): Promise<Blob> {
  const report = await generateNAACReport()
  const criteria = report.metrics as NAACCriteria

  const wb = XLSX.utils.book_new()

  // Summary Sheet
  const summaryData = [
    ['JKKN INSTITUTIONS - NAAC ASSESSMENT REPORT'],
    [`Generated: ${formatDate(new Date(report.generatedAt))}`],
    [],
    ['OVERALL ASSESSMENT SUMMARY'],
    ['Metric', 'Value'],
    ['Total Score', `${criteria.totalScore} / ${criteria.maxTotalScore}`],
    ['CGPA (out of 4.0)', criteria.cgpa],
    ['Grade', criteria.grade],
    ['Percentage', `${((criteria.totalScore / criteria.maxTotalScore) * 100).toFixed(1)}%`],
    [],
    ['CRITERIA-WISE SUMMARY'],
    ['Criterion', 'Description', 'Score', 'Max Score', 'Percentage'],
    ['C1', 'Curricular Aspects', criteria.C1.score, criteria.C1.maxScore, `${((criteria.C1.score / criteria.C1.maxScore) * 100).toFixed(0)}%`],
    ['C2', 'Teaching-Learning & Evaluation', criteria.C2.score, criteria.C2.maxScore, `${((criteria.C2.score / criteria.C2.maxScore) * 100).toFixed(0)}%`],
    ['C3', 'Research, Innovations & Extension', criteria.C3.score, criteria.C3.maxScore, `${((criteria.C3.score / criteria.C3.maxScore) * 100).toFixed(0)}%`],
    ['C4', 'Infrastructure & Learning Resources', criteria.C4.score, criteria.C4.maxScore, `${((criteria.C4.score / criteria.C4.maxScore) * 100).toFixed(0)}%`],
    ['C5', 'Student Support & Progression', criteria.C5.score, criteria.C5.maxScore, `${((criteria.C5.score / criteria.C5.maxScore) * 100).toFixed(0)}%`],
    ['C6', 'Governance, Leadership & Management', criteria.C6.score, criteria.C6.maxScore, `${((criteria.C6.score / criteria.C6.maxScore) * 100).toFixed(0)}%`],
    ['C7', 'Institutional Values & Best Practices', criteria.C7.score, criteria.C7.maxScore, `${((criteria.C7.score / criteria.C7.maxScore) * 100).toFixed(0)}%`],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // C1 - Curricular Aspects
  const c1Data = [
    ['C1 - CURRICULAR ASPECTS'],
    [],
    ['Sub-Criterion', 'Score'],
    ['Curriculum Design', criteria.C1.curriculumDesign],
    ['Academic Flexibility', criteria.C1.academicFlexibility],
    ['Curriculum Enrichment', criteria.C1.curriculumEnrichment],
    ['Feedback System', criteria.C1.feedback],
    [],
    ['Total Score', criteria.C1.score],
    ['Maximum Score', criteria.C1.maxScore],
  ]

  const c1Sheet = XLSX.utils.aoa_to_sheet(c1Data)
  c1Sheet['!cols'] = [{ wch: 30 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, c1Sheet, 'C1 - Curricular')

  // C2 - Teaching-Learning
  const c2Data = [
    ['C2 - TEACHING-LEARNING & EVALUATION'],
    [],
    ['Sub-Criterion', 'Score'],
    ['Student Enrollment', criteria.C2.studentEnrollment],
    ['Teacher Profile', criteria.C2.teacherProfile],
    ['Learning Process', criteria.C2.learningProcess],
    ['Evaluation', criteria.C2.evaluation],
    [],
    ['Total Score', criteria.C2.score],
    ['Maximum Score', criteria.C2.maxScore],
  ]

  const c2Sheet = XLSX.utils.aoa_to_sheet(c2Data)
  c2Sheet['!cols'] = [{ wch: 30 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, c2Sheet, 'C2 - Teaching')

  // C3 - Research
  const c3Data = [
    ['C3 - RESEARCH, INNOVATIONS & EXTENSION'],
    [],
    ['Sub-Criterion', 'Score'],
    ['Publications', criteria.C3.publications],
    ['Consultancy', criteria.C3.consultancy],
    ['Extension Activities', criteria.C3.extension],
    ['Collaborations', criteria.C3.collaboration],
    [],
    ['Total Score', criteria.C3.score],
    ['Maximum Score', criteria.C3.maxScore],
  ]

  const c3Sheet = XLSX.utils.aoa_to_sheet(c3Data)
  c3Sheet['!cols'] = [{ wch: 30 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, c3Sheet, 'C3 - Research')

  // C4 - Infrastructure
  const c4Data = [
    ['C4 - INFRASTRUCTURE & LEARNING RESOURCES'],
    [],
    ['Sub-Criterion', 'Score'],
    ['Physical Infrastructure', criteria.C4.physicalInfrastructure],
    ['IT Infrastructure', criteria.C4.itInfrastructure],
    ['Library', criteria.C4.library],
    [],
    ['Total Score', criteria.C4.score],
    ['Maximum Score', criteria.C4.maxScore],
  ]

  const c4Sheet = XLSX.utils.aoa_to_sheet(c4Data)
  c4Sheet['!cols'] = [{ wch: 30 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, c4Sheet, 'C4 - Infrastructure')

  // C5 - Student Support
  const c5Data = [
    ['C5 - STUDENT SUPPORT & PROGRESSION'],
    [],
    ['Sub-Criterion', 'Score'],
    ['Scholarships', criteria.C5.scholarships],
    ['Placements', criteria.C5.placements],
    ['Alumni', criteria.C5.alumni],
    [],
    ['Total Score', criteria.C5.score],
    ['Maximum Score', criteria.C5.maxScore],
  ]

  const c5Sheet = XLSX.utils.aoa_to_sheet(c5Data)
  c5Sheet['!cols'] = [{ wch: 30 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, c5Sheet, 'C5 - Students')

  // C6 - Governance
  const c6Data = [
    ['C6 - GOVERNANCE, LEADERSHIP & MANAGEMENT'],
    [],
    ['Sub-Criterion', 'Score'],
    ['Vision & Mission', criteria.C6.vision],
    ['Strategy', criteria.C6.strategy],
    ['Quality Assurance', criteria.C6.qualityAssurance],
    [],
    ['Total Score', criteria.C6.score],
    ['Maximum Score', criteria.C6.maxScore],
  ]

  const c6Sheet = XLSX.utils.aoa_to_sheet(c6Data)
  c6Sheet['!cols'] = [{ wch: 30 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, c6Sheet, 'C6 - Governance')

  // C7 - Values
  const c7Data = [
    ['C7 - INSTITUTIONAL VALUES & BEST PRACTICES'],
    [],
    ['Sub-Criterion', 'Score'],
    ['Gender Equity', criteria.C7.gender],
    ['Environmental Consciousness', criteria.C7.environment],
    ['Innovation', criteria.C7.innovation],
    ['Best Practices', criteria.C7.bestPractices],
    [],
    ['Total Score', criteria.C7.score],
    ['Maximum Score', criteria.C7.maxScore],
  ]

  const c7Sheet = XLSX.utils.aoa_to_sheet(c7Data)
  c7Sheet['!cols'] = [{ wch: 30 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, c7Sheet, 'C7 - Values')

  // Publications
  const pubData = [
    ['PUBLICATIONS SUMMARY'],
    [],
    ['Total Publications', report.publications.total],
    [],
    ['By Journal Type'],
    ['Type', 'Count'],
    ...Object.entries(report.publications.byJournal || {}).map(([type, count]) => [type.replace(/_/g, ' ').toUpperCase(), count]),
    [],
    ['By Paper Type'],
    ['Type', 'Count'],
    ...Object.entries(report.publications.byType || {}).map(([type, count]) => [type.replace(/_/g, ' ').toUpperCase(), count]),
  ]

  const pubSheet = XLSX.utils.aoa_to_sheet(pubData)
  pubSheet['!cols'] = [{ wch: 30 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, pubSheet, 'Publications')

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    const recData = [
      ['IMPROVEMENT RECOMMENDATIONS'],
      [],
      ['#', 'Recommendation'],
      ...report.recommendations.map((rec, i) => [i + 1, rec]),
    ]

    const recSheet = XLSX.utils.aoa_to_sheet(recData)
    recSheet['!cols'] = [{ wch: 5 }, { wch: 80 }]
    XLSX.utils.book_append_sheet(wb, recSheet, 'Recommendations')
  }

  // Generate buffer and convert to Blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/**
 * Generic export function
 */
export async function exportNIRFReport(format: 'pdf' | 'excel'): Promise<Blob> {
  if (format === 'pdf') {
    return exportNIRFReportPDF()
  }
  return exportNIRFReportExcel()
}

export async function exportNAACReport(format: 'pdf' | 'excel'): Promise<Blob> {
  if (format === 'pdf') {
    return exportNAACReportPDF()
  }
  return exportNAACReportExcel()
}

/**
 * Download helper
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
