
export const ROLE_OPTIONS = [
  'Android',
  'Architect',
  'Backend',
  'Certification',
  'Electrical Engineering',
  'Electrical Testing',
  'Firmware',
  'Frontend',
  'iOS',
  'Industrial Design',
  'Manager',
  'Mechanical Engineering',
  'Mechanical Testing',
  'NPI',
  'Product Manager',
  'Product Owner',
  'QA',
  'SQE',
  'SRE',
  'System',
  'Technical Project Manager',
  'UI/UX Design',
  'Wearable Engineering'
] as const;

export type Role = typeof ROLE_OPTIONS[number];

// Additional logging to verify the constant is properly exported
console.log('roles.ts: ROLE_OPTIONS exported', { 
  ROLE_OPTIONS, 
  type: typeof ROLE_OPTIONS, 
  isArray: Array.isArray(ROLE_OPTIONS),
  length: ROLE_OPTIONS?.length 
});
