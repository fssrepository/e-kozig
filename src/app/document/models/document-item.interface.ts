export interface DocumentItem {
  id?: string;
  icon: string;
  ugyfel: string;
  description: string;
  datetime: string;
  unread?: boolean;
  searchKey: string;
  items?: DocumentItemDetail[];
}

export interface DocumentItemDetail {
  description: string;
  datetime: string;
  iktatoszam: string;
  krSzam: string;
  attachments: DocumentAttachment[];
}

export interface DocumentAttachment {
  name: string;
}
