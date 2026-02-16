// Timestamps
/** Unix timestamp in seconds */
export type UnixTimestamp = number;

// Entity names for forceFetch
export type EntityName = 'instrument' | 'country' | 'company' | 'user' | 'account' | 'tag' | 'budget' | 'merchant' | 'reminder' | 'reminderMarker' | 'transaction';

// Auth
export interface AuthData {
  accessToken: string;
  tokenType: 'bearer';
  expiresIn: number;
  refreshToken: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
  apiKey: string;
  apiSecret: string;
}

// System entities (read-only, numeric IDs)
export interface Instrument {
  id: number;
  changed: UnixTimestamp;
  title: string;
  /** Short currency code, e.g., "USD" */
  shortTitle: string;
  /** Currency symbol, e.g., "$" */
  symbol: string;
  /** Exchange rate to base currency */
  rate: number;
}

export interface Country {
  id: number;
  title: string;
  domain: string;
  currency: Instrument['id'];
  changed: UnixTimestamp;
}

export interface Company {
  id: number;
  changed: UnixTimestamp;
  title: string;
  fullTitle: string | null;
  www: string | null;
  country: Country['id'] | null;
}

export interface User {
  id: number;
  changed: UnixTimestamp;
  login: string | null;
  currency: Instrument['id'];
  /** Parent user ID for family accounting */
  parent: User['id'] | null;
}

// User entities (mutable, string UUID IDs)
export interface Account {
  /** UUID */
  id: string;
  user: User['id'];
  instrument: Instrument['id'];
  type: 'cash' | 'ccard' | 'checking' | 'loan' | 'deposit' | 'emoney' | 'debt';
  role: number | null;
  company: Company['id'] | null;
  title: string;
  syncID: string[] | null;
  balance: number;
  startBalance: number;
  creditLimit: number;
  /** Whether to include in total balance */
  inBalance: boolean;
  savings: boolean | null;
  enableCorrection: boolean;
  enableSMS: boolean;
  archive: boolean;
  private: boolean;
  // Loan/Deposit specific (may be null for other types)
  capitalization: boolean | null;
  percent: number | null;
  /** Start date in yyyy-MM-dd format */
  startDate: string | null;
  endDateOffset: number | null;
  endDateOffsetInterval: 'day' | 'week' | 'month' | 'year' | null;
  payoffStep: number | null;
  payoffInterval: 'month' | 'year' | null;
  changed: UnixTimestamp;
}

// Tag = Category in ZenMoney
export interface Tag {
  /** UUID */
  id: string;
  user: User['id'];
  changed: UnixTimestamp;
  icon: string | null;
  budgetIncome: boolean;
  budgetOutcome: boolean;
  required: boolean | null;
  /** 32-bit ARGB color: (a << 24) + (r << 16) + (g << 8) + b */
  color: number | null;
  picture: string | null;
  title: string;
  showIncome: boolean;
  showOutcome: boolean;
  /** Parent tag ID - max 1 level nesting */
  parent: Tag['id'] | null;
}

export interface Merchant {
  /** UUID */
  id: string;
  user: User['id'];
  title: string;
  changed: UnixTimestamp;
}

// Shared between Transaction, Reminder, ReminderMarker
export interface TransactionSpecification {
  incomeInstrument: Instrument['id'];
  incomeAccount: Account['id'];
  income: number;
  outcomeInstrument: Instrument['id'];
  outcomeAccount: Account['id'];
  outcome: number;
}

export interface Transaction extends TransactionSpecification {
  /** UUID */
  id: string;
  user: User['id'];
  changed: UnixTimestamp;
  created: UnixTimestamp;
  deleted: boolean;
  hold: boolean | null;
  tag: Tag['id'][] | null;
  merchant: Merchant['id'] | null;
  payee: string | null;
  originalPayee: string | null;
  comment: string | null;
  /** Transaction date in yyyy-MM-dd format */
  date: string;
  /** Merchant Category Code */
  mcc: number | null;
  reminderMarker: ReminderMarker['id'] | null;
  // Original operation currency (may differ from account currency)
  opIncome: number | null;
  opIncomeInstrument: Instrument['id'] | null;
  opOutcome: number | null;
  opOutcomeInstrument: Instrument['id'] | null;
  latitude: number | null;
  longitude: number | null;
  qrCode: string | null;
}

export interface Reminder extends TransactionSpecification {
  /** UUID */
  id: string;
  user: User['id'];
  changed: UnixTimestamp;
  tag: Tag['id'][] | null;
  merchant: Merchant['id'] | null;
  payee: string | null;
  comment: string | null;
  interval: 'day' | 'week' | 'month' | 'year' | null;
  step: number | null;
  points: number[] | null;
  /** Start date in yyyy-MM-dd format */
  startDate: string;
  /** End date in yyyy-MM-dd format */
  endDate: string | null;
  notify: boolean;
}

export interface ReminderMarker extends TransactionSpecification {
  /** UUID */
  id: string;
  user: User['id'];
  changed: UnixTimestamp;
  tag: Tag['id'][] | null;
  merchant: Merchant['id'] | null;
  payee: string | null;
  comment: string | null;
  /** Date in yyyy-MM-dd format */
  date: string;
  reminder: Reminder['id'];
  state: 'planned' | 'processed' | 'deleted';
  notify: boolean;
}

export interface Budget {
  user: User['id'];
  changed: UnixTimestamp;
  /** Category UUID. '00000000-0000-0000-0000-000000000000' = aggregate budget */
  tag: Tag['id'] | null;
  /** Month in yyyy-MM-dd format (always first day of month) */
  date: string;
  income: number;
  incomeLock: boolean;
  outcome: number;
  outcomeLock: boolean;
}

export interface Deletion {
  id: string;
  object: EntityName;
  stamp: UnixTimestamp;
  user: User['id'];
}

// Main sync object — both request and response for v8/diff
export interface DiffObject {
  serverTimestamp?: number;
  currentClientTimestamp?: number;
  forceFetch?: EntityName[];
  // System entities
  instrument?: Instrument[];
  country?: Country[];
  company?: Company[];
  user?: User[];
  // User entities
  account?: Account[];
  tag?: Tag[];
  merchant?: Merchant[];
  reminder?: Reminder[];
  reminderMarker?: ReminderMarker[];
  transaction?: Transaction[];
  budget?: Budget[];
  // Deletions
  deletion?: Deletion[];
}
