// AcademiaSentinel — Local mock data
// All pages use this when the backend is unavailable

export const MOCK_INSTITUTIONS = [
  { id: 1, name: 'IIT Bombay', domain: 'iitb.ac.in', state: 'Maharashtra', type: 'IIT', naac_grade: 'A++', student_count: 12500, risk_score: 62, last_scanned: new Date(Date.now()-3600000).toISOString() },
  { id: 2, name: 'Delhi University', domain: 'du.ac.in', state: 'Delhi', type: 'University', naac_grade: 'A+', student_count: 300000, risk_score: 31, last_scanned: new Date(Date.now()-7200000).toISOString() },
  { id: 3, name: 'VIT Vellore', domain: 'vit.ac.in', state: 'Tamil Nadu', type: 'University', naac_grade: 'A++', student_count: 60000, risk_score: 28, last_scanned: new Date(Date.now()-10800000).toISOString() },
  { id: 4, name: 'Amity University Noida', domain: 'amity.edu', state: 'Uttar Pradesh', type: 'University', naac_grade: 'A', student_count: 125000, risk_score: 45, last_scanned: new Date(Date.now()-14400000).toISOString() },
  { id: 5, name: 'BITS Pilani', domain: 'bits-pilani.ac.in', state: 'Rajasthan', type: 'University', naac_grade: 'A++', student_count: 15000, risk_score: 78, last_scanned: new Date(Date.now()-18000000).toISOString() },
  { id: 6, name: 'Pune University', domain: 'unipune.ac.in', state: 'Maharashtra', type: 'University', naac_grade: 'A', student_count: 500000, risk_score: 22, last_scanned: new Date(Date.now()-21600000).toISOString() },
  { id: 7, name: 'Anna University', domain: 'annauniv.edu', state: 'Tamil Nadu', type: 'University', naac_grade: 'A++', student_count: 400000, risk_score: 55, last_scanned: new Date(Date.now()-86400000).toISOString() },
  { id: 8, name: 'NIT Trichy', domain: 'nitt.edu', state: 'Tamil Nadu', type: 'NIT', naac_grade: 'A+', student_count: 8000, risk_score: 83, last_scanned: new Date(Date.now()-172800000).toISOString() },
]

export const MOCK_ALERTS = [
  { id: 1, title: 'Credential dump: VIT student database on dark web', institution_name: 'VIT Vellore', institution_domain: 'vit.ac.in', threat_type: 'CREDENTIAL_DUMP', severity: 'CRITICAL', source: 'HIBP', source_url: null, description: 'Approximately 45,000 student credentials from vit.ac.in found circulating on dark web forums. Data includes student email IDs, hashed passwords, and enrollment numbers. Breach appears to have occurred Q1 2026.', status: 'OPEN', detected_at: new Date(Date.now()-3600000).toISOString() },
  { id: 2, title: 'JEE Advanced 2026 paper leak claim on Telegram', institution_name: 'IIT Bombay', institution_domain: 'iitb.ac.in', threat_type: 'EXAM_LEAK', severity: 'CRITICAL', source: 'TELEGRAM', source_url: null, description: 'Multiple Telegram channels are claiming to sell JEE Advanced 2026 papers for ₹5000-15000. Screenshots shared appear to show actual question patterns. Coordinated effort by 3 known leak networks.', status: 'OPEN', detected_at: new Date(Date.now()-7200000).toISOString() },
  { id: 3, title: 'Ransomware attack: BHU server encrypted', institution_name: 'Banaras Hindu University', institution_domain: 'bhu.ac.in', threat_type: 'RANSOMWARE', severity: 'CRITICAL', source: 'MANUAL', source_url: null, description: 'BHU admin server encrypted by LockBit 3.0 variant. Ransom demand of 10 BTC. Student records, exam schedules and research data reported inaccessible. Incident reported at 03:00 IST.', status: 'INVESTIGATING', detected_at: new Date(Date.now()-10800000).toISOString() },
  { id: 4, title: 'Fake MBA degrees from Amity circulating on WhatsApp', institution_name: 'Amity University Noida', institution_domain: 'amity.edu', threat_type: 'FAKE_DOCUMENT', severity: 'HIGH', source: 'PASTE_SITE', source_url: null, description: 'Forged Amity University MBA and B.Tech degree certificates with holograms being sold on WhatsApp for ₹8000–20000. Certificates include valid-looking enrollment numbers and registrar signatures.', status: 'OPEN', detected_at: new Date(Date.now()-18000000).toISOString() },
  { id: 5, title: 'DU student Aadhaar data found on paste site', institution_name: 'Delhi University', institution_domain: 'du.ac.in', threat_type: 'DATA_BREACH', severity: 'HIGH', source: 'PASTE_SITE', source_url: null, description: '2,300 Delhi University student Aadhaar numbers and addresses leaked on pastebin. Data linked to scholarship registration portal breach. CERT-In notification may be required under PDPB 2023.', status: 'OPEN', detected_at: new Date(Date.now()-28800000).toISOString() },
  { id: 6, title: 'IIT research papers stolen, listed for sale', institution_name: 'IIT Bombay', institution_domain: 'iitb.ac.in', threat_type: 'RESEARCH_THEFT', severity: 'HIGH', source: 'GOOGLE_CSE', source_url: null, description: 'Pre-publication IIT Bombay research papers on semiconductor design found listed on a Russian cybercrime forum. Seller claims insider access to faculty email accounts.', status: 'OPEN', detected_at: new Date(Date.now()-43200000).toISOString() },
  { id: 7, title: 'Phishing portal mimicking NIT Trichy login', institution_name: 'NIT Trichy', institution_domain: 'nitt.edu', threat_type: 'PHISHING', severity: 'MEDIUM', source: 'GOOGLE_CSE', source_url: null, description: 'A cloned version of NIT Trichy student portal deployed at nitt-edu.xyz is harvesting credentials. Google SafeBrowsing not yet updated. ~150 students may have been affected.', status: 'OPEN', detected_at: new Date(Date.now()-57600000).toISOString() },
  { id: 8, title: 'GATE 2026 answer key leak claim on Reddit', institution_name: 'Anna University', institution_domain: 'annauniv.edu', threat_type: 'EXAM_LEAK', severity: 'HIGH', source: 'MANUAL', source_url: null, description: 'Reddit post claiming early access to GATE 2026 CS answer key before official release. Post includes partial answers matching expected question patterns. IIT exam authority alerted.', status: 'OPEN', detected_at: new Date(Date.now()-72000000).toISOString() },
  { id: 9, title: 'BITS Pilani faculty email accounts compromised', institution_name: 'BITS Pilani', institution_domain: 'bits-pilani.ac.in', threat_type: 'CREDENTIAL_DUMP', severity: 'MEDIUM', source: 'HIBP', source_url: null, description: 'HIBP API reports 87 BITS Pilani faculty email credentials in recent breach. Accounts may have been used to send spear-phishing emails to students. Password resets recommended.', status: 'RESOLVED', detected_at: new Date(Date.now()-86400000).toISOString() },
  { id: 10, title: 'Pune University admission data paste site', institution_name: 'Pune University', institution_domain: 'unipune.ac.in', threat_type: 'DATA_BREACH', severity: 'MEDIUM', source: 'PASTE_SITE', source_url: null, description: 'Pune University 2025 admission form data for ~8,000 students leaked on paste site. Includes name, DOB, mobile, category. Likely from third-party scholarship portal integration.', status: 'OPEN', detected_at: new Date(Date.now()-129600000).toISOString() },
]

export const MOCK_PREDICT = {
  current_risk_multiplier: 2.1,
  active_windows: [{ event: 'JEE Advanced Results', risk_multiplier: 2.1 }],
  upcoming_high_risk: [
    { event: 'NEET PG 2026', date: '2026-11-02', days_until: 29, risk_multiplier: 2.8, threat_types: ['EXAM_LEAK', 'CREDENTIAL_DUMP'] },
    { event: 'Semester Exams (Dec)', date: '2026-12-01', days_until: 58, risk_multiplier: 2.4, threat_types: ['EXAM_LEAK', 'FAKE_DOCUMENT'] },
    { event: 'JEE Mains 2027 (Jan)', date: '2027-01-15', days_until: 103, risk_multiplier: 3.0, threat_types: ['EXAM_LEAK', 'PHISHING'] },
  ],
  risk_calendar: [
    { month: 1, event: 'JEE Mains (Jan)', risk_multiplier: 3.0 },
    { month: 2, event: 'Semester Finals', risk_multiplier: 2.2 },
    { month: 3, event: 'NEET / Board Exams', risk_multiplier: 2.8 },
    { month: 4, event: 'Admission Season', risk_multiplier: 1.8 },
    { month: 5, event: 'JEE Advanced', risk_multiplier: 2.5 },
    { month: 6, event: 'GATE Results / Counselling', risk_multiplier: 1.6 },
    { month: 7, event: 'New Semester Starts', risk_multiplier: 1.2 },
    { month: 8, event: 'Mid-Sems', risk_multiplier: 1.4 },
    { month: 9, event: 'Placement Season', risk_multiplier: 1.5 },
    { month: 10, event: 'JEE Prep Peak', risk_multiplier: 2.1 },
    { month: 11, event: 'NEET PG / GATE Prep', risk_multiplier: 2.8 },
    { month: 12, event: 'Semester Exams', risk_multiplier: 2.4 },
  ]
}
