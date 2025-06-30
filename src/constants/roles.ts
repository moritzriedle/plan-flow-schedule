
export const ROLE_OPTIONS = [
  'Electrical Engineering',
  'Mechanical Engineering', 
  'Certification',
  'Industrial Design',
  'UI/UX Design',
  'Backend',
  'Android',
  'iOS',
  'Firmware',
  'Frontend',
  'System',
  'SRE',
  'QA',
  'Electrical Testing',
  'Mechanical Testing',
  'SQE',
  'NPI',
  'Wearable Engineering',
  'Architect',
  'Technical Project Manager',
  'Product Owner',
  'Product Manager',
  'Manager'
] as const;

export type Role = typeof ROLE_OPTIONS[number];
