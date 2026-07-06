export type FormEditorViewport = 'desktop' | 'mobile';

export type FormFieldType =
  | 'header'
  | 'text'
  | 'textarea'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'number'
  | 'email'
  | 'tel';

export type AutofillKey =
  | 'fullName'
  | 'familyName'
  | 'givenName'
  | 'birthName'
  | 'birthDate'
  | 'motherName'
  | 'taxId'
  | 'addressZip'
  | 'addressCity'
  | 'addressStreet'
  | 'email'
  | 'phone';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldLayout {
  col?: number;
  row?: number;
  colSpan: number;
  rowSpan: number;
}

export interface FormFieldDefinition {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  autofillKey?: AutofillKey;
  options?: FormFieldOption[];
  layout?: FormFieldLayout;
}

export interface FormSectionLayout {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface FormTemplateGrid {
  columns: number;
  rows: number;
}

export interface FormSectionDefinition {
  id: string;
  title: string;
  navCode?: string;
  description?: string;
  mandatory?: boolean;
  layout: FormSectionLayout;
  fields: FormFieldDefinition[];
}

export interface FormTemplatePage {
  id: string;
  title: string;
  mandatory: boolean;
  sections: FormSectionDefinition[];
}

export interface FormTemplate {
  id: string;
  name: string;
  navCode: string;
  description: string;
  mandatory: boolean;
  grid: FormTemplateGrid;
  pages: FormTemplatePage[];
  updatedAt: string;
  sections: FormSectionDefinition[];
}

export interface FormDocument {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  userId: string;
  savedAt: string;
  data: Record<string, string | boolean | number | null>;
}

export interface DemoUserProfile {
  id: string;
  fullName: string;
  familyName: string;
  givenName: string;
  birthName: string;
  birthDate: string;
  motherName: string;
  taxId: string;
  addressZip: string;
  addressCity: string;
  addressStreet: string;
  email: string;
  phone: string;
}

export const DEFAULT_USER_PROFILE: DemoUserProfile = {
  id: 'user-1',
  fullName: 'Farkas Anna',
  familyName: 'Farkas',
  givenName: 'Anna',
  birthName: 'Farkas Anna',
  birthDate: '1988-04-17',
  motherName: 'Tóth Éva',
  taxId: '8394726150',
  addressZip: '1133',
  addressCity: 'Budapest',
  addressStreet: 'Váci út 62-64.',
  email: 'anna.farkas@example.hu',
  phone: '+36 30 123 4567'
};

export const SECTION_LIBRARY: FormSectionDefinition[] = [
  {
    id: 'person-data',
    title: 'Személyes adatok',
    navCode: 'NAV-SZEMELY',
    description: 'Név, születési adatok és adóazonosító',
    layout: { col: 1, row: 1, colSpan: 6, rowSpan: 2 },
    fields: [
      { id: 'familyName', label: 'Vezetéknév', type: 'text', required: true, autofillKey: 'familyName' },
      { id: 'givenName', label: 'Keresztnév', type: 'text', required: true, autofillKey: 'givenName' },
      { id: 'birthName', label: 'Születési név', type: 'text', autofillKey: 'birthName' },
      { id: 'birthDate', label: 'Születési dátum', type: 'date', autofillKey: 'birthDate' },
      { id: 'motherName', label: 'Anyja neve', type: 'text', autofillKey: 'motherName' },
      { id: 'taxId', label: 'Adóazonosító jel', type: 'text', required: true, autofillKey: 'taxId' }
    ]
  },
  {
    id: 'address-data',
    title: 'Lakcím',
    navCode: 'NAV-CIM',
    description: 'Állandó vagy levelezési cím',
    layout: { col: 7, row: 1, colSpan: 6, rowSpan: 2 },
    fields: [
      { id: 'addressZip', label: 'Irányítószám', type: 'text', autofillKey: 'addressZip' },
      { id: 'addressCity', label: 'Település', type: 'text', autofillKey: 'addressCity' },
      { id: 'addressStreet', label: 'Közterület, házszám', type: 'text', autofillKey: 'addressStreet' }
    ]
  },
  {
    id: 'contact-data',
    title: 'Kapcsolattartás',
    navCode: 'NAV-KAPCS',
    description: 'E-mail, telefon és tárhely értesítés',
    layout: { col: 1, row: 3, colSpan: 4, rowSpan: 1 },
    fields: [
      { id: 'email', label: 'E-mail', type: 'email', autofillKey: 'email' },
      { id: 'phone', label: 'Telefon', type: 'tel', autofillKey: 'phone' },
      { id: 'tarhelyNotice', label: 'Tárhely értesítés', type: 'checkbox' }
    ]
  },
  {
    id: 'representative-data',
    title: 'Képviselő',
    navCode: 'NAV-REP',
    description: 'Könyvelő vagy állandó meghatalmazott adatai',
    layout: { col: 5, row: 3, colSpan: 4, rowSpan: 2 },
    fields: [
      { id: 'representativeName', label: 'Képviselő neve', type: 'text', placeholder: 'Könyvelő / iroda' },
      { id: 'representativeTaxId', label: 'Képviselő adóazonosítója', type: 'text' },
      {
        id: 'representativeRole',
        label: 'Jogosultság',
        type: 'select',
        options: [
          { label: 'Megtekintés', value: 'read' },
          { label: 'Beadás', value: 'submit' },
          { label: 'Teljes körű', value: 'full' }
        ]
      }
    ]
  },
  {
    id: 'nav-permissions',
    title: 'NAV jogosultságok',
    navCode: 'NAV-JOG',
    description: 'ONYA, HIPA és tárhely műveletek',
    layout: { col: 9, row: 3, colSpan: 4, rowSpan: 2 },
    fields: [
      { id: 'onyaAccess', label: 'ONYA űrlapkitöltés', type: 'checkbox' },
      { id: 'hipaAccess', label: 'HIPA ügyintézés', type: 'checkbox' },
      { id: 'documentAccess', label: 'Dokumentumok olvasása', type: 'checkbox' },
      {
        id: 'approvalMode',
        label: 'Jóváhagyás',
        type: 'select',
        options: [
          { label: 'Mindig szükséges', value: 'always' },
          { label: 'Csak kritikus műveletnél', value: 'critical' },
          { label: '30 nap után automatikus', value: 'auto30' }
        ]
      }
    ]
  },
  {
    id: 'business-data',
    title: 'Vállalkozási adatok',
    navCode: 'NAV-VALL',
    description: 'EV vagy társas vállalkozás alapadatai',
    layout: { col: 1, row: 5, colSpan: 6, rowSpan: 2 },
    fields: [
      { id: 'businessName', label: 'Vállalkozás neve', type: 'text' },
      { id: 'businessTaxNumber', label: 'Adószám', type: 'text' },
      { id: 'businessActivity', label: 'Főtevékenység', type: 'text' },
      {
        id: 'taxMode',
        label: 'Adózási mód',
        type: 'select',
        options: [
          { label: 'Átalányadó', value: 'atalany' },
          { label: 'VSZJA', value: 'vszja' },
          { label: 'Társasági adó', value: 'tao' }
        ]
      }
    ]
  },
  {
    id: 'case-message',
    title: 'Ügy leírása',
    navCode: 'NAV-UZENET',
    description: 'Szabad szöveges beadvány rész',
    layout: { col: 7, row: 5, colSpan: 6, rowSpan: 2 },
    fields: [
      { id: 'caseSubject', label: 'Tárgy', type: 'text' },
      { id: 'caseDescription', label: 'Indoklás', type: 'textarea' }
    ]
  }
];

export const DEFAULT_FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'nav-representation-template',
    name: 'Állandó meghatalmazás',
    navCode: 'UJEGYKE',
    description: 'Képviseleti jogosultság és HIPA kapcsolódás ONYA-stílusú űrlaphoz.',
    mandatory: true,
    grid: { columns: 12, rows: 6 },
    updatedAt: '2026-06-11T00:00:00.000Z',
    pages: [
      {
        id: 'page-representation-main',
        title: 'Alapadatok',
        mandatory: true,
        sections: cloneSections(['person-data', 'address-data', 'contact-data'])
      },
      {
        id: 'page-representation-permissions',
        title: 'Jogosultságok',
        mandatory: true,
        sections: cloneSections(['representative-data', 'nav-permissions'])
      }
    ],
    sections: cloneSections(['person-data', 'address-data', 'contact-data', 'representative-data', 'nav-permissions'])
  },
  {
    id: 'nav-tax-registration-template',
    name: 'Adózói adatbejelentő',
    navCode: 'T101E',
    description: 'Alap személyes és vállalkozási adatok bejelentéséhez.',
    mandatory: false,
    grid: { columns: 12, rows: 6 },
    updatedAt: '2026-06-11T00:00:00.000Z',
    pages: [
      {
        id: 'page-registration-main',
        title: 'Adózó',
        mandatory: true,
        sections: cloneSections(['person-data', 'address-data', 'contact-data'])
      },
      {
        id: 'page-registration-business',
        title: 'Vállalkozás',
        mandatory: false,
        sections: cloneSections(['business-data'])
      }
    ],
    sections: cloneSections(['person-data', 'address-data', 'contact-data', 'business-data'])
  },
  {
    id: 'epapir-request-template',
    name: 'e-Papír beadvány',
    navCode: 'EPAPIR',
    description: 'Általános ügyindítás személyes adatokkal és szöveges beadvánnyal.',
    mandatory: false,
    grid: { columns: 12, rows: 6 },
    updatedAt: '2026-06-11T00:00:00.000Z',
    pages: [
      {
        id: 'page-epapir-main',
        title: 'Beküldő',
        mandatory: true,
        sections: cloneSections(['person-data', 'contact-data'])
      },
      {
        id: 'page-epapir-message',
        title: 'Beadvány',
        mandatory: true,
        sections: cloneSections(['case-message'])
      }
    ],
    sections: cloneSections(['person-data', 'contact-data', 'case-message'])
  }
];

function cloneSections(ids: string[]): FormSectionDefinition[] {
  return ids
    .map(id => SECTION_LIBRARY.find(section => section.id === id))
    .filter((section): section is FormSectionDefinition => !!section)
    .map(section => JSON.parse(JSON.stringify(section)));
}
