export interface NyomtatvanyEntry {
  code: string;
  title: string;
  version: string;
  adoev: string;
  adoevSort: number;
}

export interface NyomtatvanyGroup {
  key: string;
  latest: NyomtatvanyEntry;
  entries: NyomtatvanyEntry[];
}
