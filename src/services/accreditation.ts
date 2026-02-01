import { createClient } from '@/lib/supabase/client'
import type { AccreditationMetric, MetricType } from '@/types/database'
import { getPublicationStats } from './publications'

// NIRF Metrics structure
export interface NIRFMetrics {
  RP: { // Research and Professional Practice
    totalPublications: number
    scopusPublications: number
    ugcCarePublications: number
    consultancyProjects: number
    score: number
    maxScore: number
  }
  GO: { // Graduation Outcomes
    placementRate: number
    higherStudies: number
    entrepreneurship: number
    score: number
    maxScore: number
  }
  OI: { // Outreach and Inclusivity
    regionalDiversity: number
    womenEnrollment: number
    economicallyDisadvantaged: number
    score: number
    maxScore: number
  }
  PR: { // Perception
    academicPeers: number
    employers: number
    score: number
    maxScore: number
  }
  totalScore: number
  maxTotalScore: number
}

// NAAC Criteria structure
export interface NAACCriteria {
  C1: { // Curricular Aspects
    curriculumDesign: number
    academicFlexibility: number
    curriculumEnrichment: number
    feedback: number
    score: number
    maxScore: number
  }
  C2: { // Teaching-Learning and Evaluation
    studentEnrollment: number
    teacherProfile: number
    learningProcess: number
    evaluation: number
    score: number
    maxScore: number
  }
  C3: { // Research, Innovations and Extension
    publications: number
    consultancy: number
    extension: number
    collaboration: number
    score: number
    maxScore: number
  }
  C4: { // Infrastructure and Learning Resources
    physicalInfrastructure: number
    itInfrastructure: number
    library: number
    score: number
    maxScore: number
  }
  C5: { // Student Support and Progression
    scholarships: number
    placements: number
    alumni: number
    score: number
    maxScore: number
  }
  C6: { // Governance, Leadership and Management
    vision: number
    strategy: number
    qualityAssurance: number
    score: number
    maxScore: number
  }
  C7: { // Institutional Values and Best Practices
    gender: number
    environment: number
    innovation: number
    bestPractices: number
    score: number
    maxScore: number
  }
  totalScore: number
  maxTotalScore: number
  cgpa: number
  grade: string
}

// Get all accreditation metrics
export async function getAccreditationMetrics(type?: MetricType): Promise<AccreditationMetric[]> {
  const supabase = createClient()

  let query = supabase
    .from('accreditation_metrics')
    .select('*')
    .eq('is_active', true)
    .order('metric_code', { ascending: true })

  if (type) {
    query = query.eq('metric_type', type)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Calculate NIRF metrics based on current data
export async function calculateNIRFMetrics(): Promise<NIRFMetrics> {
  const supabase = createClient()
  const pubStats = await getPublicationStats()

  // Get solutions count for consultancy
  const { data: solutions } = await supabase
    .from('solutions')
    .select('id')
    .eq('status', 'completed')

  const consultancyProjects = solutions?.length || 0

  // Calculate RP score (Research and Professional Practice)
  const rpScore = Math.min(100, (
    (pubStats.byJournalType.scopus * 10) +
    (pubStats.byJournalType.ugc_care * 5) +
    (pubStats.byJournalType.other * 2) +
    (consultancyProjects * 3)
  ))

  // Placeholder values for other metrics (would come from other data sources)
  const goScore = 0
  const oiScore = 0
  const prScore = 0

  const totalScore = rpScore + goScore + oiScore + prScore

  return {
    RP: {
      totalPublications: pubStats.total,
      scopusPublications: pubStats.byJournalType.scopus,
      ugcCarePublications: pubStats.byJournalType.ugc_care,
      consultancyProjects,
      score: rpScore,
      maxScore: 100,
    },
    GO: {
      placementRate: 0,
      higherStudies: 0,
      entrepreneurship: 0,
      score: goScore,
      maxScore: 100,
    },
    OI: {
      regionalDiversity: 0,
      womenEnrollment: 0,
      economicallyDisadvantaged: 0,
      score: oiScore,
      maxScore: 100,
    },
    PR: {
      academicPeers: 0,
      employers: 0,
      score: prScore,
      maxScore: 100,
    },
    totalScore,
    maxTotalScore: 400,
  }
}

// Calculate NAAC criteria based on current data
export async function calculateNAACCriteria(): Promise<NAACCriteria> {
  const pubStats = await getPublicationStats()

  // C3 calculation based on publications
  const c3Publications = Math.min(100, pubStats.total * 4)
  const c3Consultancy = 0 // Would come from solutions
  const c3Extension = 0
  const c3Collaboration = 0
  const c3Score = Math.round((c3Publications + c3Consultancy + c3Extension + c3Collaboration) / 4)

  // Placeholder values for other criteria
  const criteria: NAACCriteria = {
    C1: {
      curriculumDesign: 0,
      academicFlexibility: 0,
      curriculumEnrichment: 0,
      feedback: 0,
      score: 0,
      maxScore: 150,
    },
    C2: {
      studentEnrollment: 0,
      teacherProfile: 0,
      learningProcess: 0,
      evaluation: 0,
      score: 0,
      maxScore: 200,
    },
    C3: {
      publications: c3Publications,
      consultancy: c3Consultancy,
      extension: c3Extension,
      collaboration: c3Collaboration,
      score: c3Score,
      maxScore: 250,
    },
    C4: {
      physicalInfrastructure: 0,
      itInfrastructure: 0,
      library: 0,
      score: 0,
      maxScore: 100,
    },
    C5: {
      scholarships: 0,
      placements: 0,
      alumni: 0,
      score: 0,
      maxScore: 100,
    },
    C6: {
      vision: 0,
      strategy: 0,
      qualityAssurance: 0,
      score: 0,
      maxScore: 100,
    },
    C7: {
      gender: 0,
      environment: 0,
      innovation: 0,
      bestPractices: 0,
      score: 0,
      maxScore: 100,
    },
    totalScore: 0,
    maxTotalScore: 1000,
    cgpa: 0,
    grade: 'D',
  }

  // Calculate total score
  criteria.totalScore = Object.entries(criteria)
    .filter(([key]) => key.startsWith('C'))
    .reduce((sum, [, value]) => sum + (value as { score: number }).score, 0)

  // Calculate CGPA (out of 4)
  criteria.cgpa = parseFloat(((criteria.totalScore / criteria.maxTotalScore) * 4).toFixed(2))

  // Determine grade
  if (criteria.cgpa >= 3.51) criteria.grade = 'A++'
  else if (criteria.cgpa >= 3.26) criteria.grade = 'A+'
  else if (criteria.cgpa >= 3.01) criteria.grade = 'A'
  else if (criteria.cgpa >= 2.76) criteria.grade = 'B++'
  else if (criteria.cgpa >= 2.51) criteria.grade = 'B+'
  else if (criteria.cgpa >= 2.01) criteria.grade = 'B'
  else if (criteria.cgpa >= 1.51) criteria.grade = 'C'
  else criteria.grade = 'D'

  return criteria
}

// Export data for reports
export interface AccreditationReportData {
  generatedAt: string
  type: 'nirf' | 'naac'
  metrics: NIRFMetrics | NAACCriteria
  publications: {
    total: number
    byType: Record<string, number>
    byStatus: Record<string, number>
    byJournal: Record<string, number>
  }
  recommendations: string[]
}

export async function generateNIRFReport(): Promise<AccreditationReportData> {
  const metrics = await calculateNIRFMetrics()
  const pubStats = await getPublicationStats()

  const recommendations: string[] = []

  // Generate recommendations based on data
  if (metrics.RP.scopusPublications < 10) {
    recommendations.push('Increase Scopus-indexed publications to improve RP score')
  }
  if (pubStats.inProgressCount > 0) {
    recommendations.push(`${pubStats.inProgressCount} publications in progress - expedite completion`)
  }
  if (metrics.RP.consultancyProjects < 5) {
    recommendations.push('Focus on completing more consultancy projects')
  }

  return {
    generatedAt: new Date().toISOString(),
    type: 'nirf',
    metrics,
    publications: {
      total: pubStats.total,
      byType: pubStats.byPaperType as Record<string, number>,
      byStatus: pubStats.byStatus as Record<string, number>,
      byJournal: pubStats.byJournalType as Record<string, number>,
    },
    recommendations,
  }
}

export async function generateNAACReport(): Promise<AccreditationReportData> {
  const criteria = await calculateNAACCriteria()
  const pubStats = await getPublicationStats()

  const recommendations: string[] = []

  // Generate recommendations
  if (criteria.C3.publications < 50) {
    recommendations.push('Increase research publications for better C3 score')
  }
  if (criteria.cgpa < 3.0) {
    recommendations.push('Focus on improving weak criteria to achieve A grade')
  }

  // Check NAAC criterion distribution in publications
  const naacCounts = pubStats.byNaacCriterion
  for (let i = 1; i <= 7; i++) {
    const key = `C${i}`
    if (!naacCounts[key] || naacCounts[key] < 2) {
      recommendations.push(`Add more publications mapped to NAAC Criterion ${i}`)
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    type: 'naac',
    metrics: criteria,
    publications: {
      total: pubStats.total,
      byType: pubStats.byPaperType as Record<string, number>,
      byStatus: pubStats.byStatus as Record<string, number>,
      byJournal: pubStats.byJournalType as Record<string, number>,
    },
    recommendations,
  }
}
