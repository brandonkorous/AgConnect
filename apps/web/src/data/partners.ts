export type Partner = {
  id: string;
  altEn: string;
  altEs: string;
  abbreviation: string;
};

export const partners: Partner[] = [
  { id: 'cdfa', abbreviation: 'CDFA', altEn: 'California Department of Food and Agriculture', altEs: 'Departamento de Alimentación y Agricultura de California' },
  { id: 'f3', abbreviation: 'F3', altEn: 'F3 Innovate', altEs: 'F3 Innovate' },
  { id: 'calosba', abbreviation: 'CalOSBA', altEn: 'California Office of the Small Business Advocate', altEs: 'Oficina del Pequeño Negocio de California' },
  { id: 'edd', abbreviation: 'EDD', altEn: 'California Employment Development Department', altEs: 'Departamento de Desarrollo del Empleo de California' },
  { id: 'fwib', abbreviation: 'FWIB', altEn: 'Fresno Workforce Investment Board', altEs: 'Junta de Inversión Laboral de Fresno' },
  { id: 'eoc', abbreviation: 'EOC', altEn: 'Fresno Economic Opportunities Commission', altEs: 'Comisión de Oportunidades Económicas de Fresno' },
];
