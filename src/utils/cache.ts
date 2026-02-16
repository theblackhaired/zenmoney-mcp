import { ZenMoneyClient } from '../api/client.js';
import type {
  DiffObject, Account, Transaction, Tag, Merchant,
  Budget, Reminder, ReminderMarker, Instrument,
  Company, Country, User, Deletion,
} from '../api/types.js';

export class DataCache {
  private client: ZenMoneyClient;
  private serverTimestamp = 0;
  private initialized = false;

  // Cached data (keyed by id for fast lookup)
  instruments = new Map<number, Instrument>();
  countries = new Map<number, Country>();
  companies = new Map<number, Company>();
  users = new Map<number, User>();
  accounts = new Map<string, Account>();
  tags = new Map<string, Tag>();
  merchants = new Map<string, Merchant>();
  reminders = new Map<string, Reminder>();
  reminderMarkers = new Map<string, ReminderMarker>();
  transactions = new Map<string, Transaction>();
  budgets = new Map<string, Budget>(); // key = `${tag}:${date}`

  constructor(client: ZenMoneyClient) {
    this.client = client;
  }

  /** Full or incremental sync */
  async sync(): Promise<DiffObject> {
    const diff = await this.client.diff({
      serverTimestamp: this.serverTimestamp,
      currentClientTimestamp: Math.floor(Date.now() / 1000),
    });

    this.applyDiff(diff);
    this.initialized = true;
    return diff;
  }

  /** Ensure cache is populated */
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.sync();
    }
  }

  /** Write entities through diff and update cache */
  async writeDiff(changes: DiffObject): Promise<DiffObject> {
    const diff = await this.client.diff({
      serverTimestamp: this.serverTimestamp,
      currentClientTimestamp: Math.floor(Date.now() / 1000),
      ...changes,
    });

    this.applyDiff(diff);
    return diff;
  }

  private applyDiff(diff: DiffObject): void {
    if (diff.serverTimestamp !== undefined) {
      this.serverTimestamp = diff.serverTimestamp;
    }

    // Apply system entities
    diff.instrument?.forEach(i => this.instruments.set(i.id, i));
    diff.country?.forEach(c => this.countries.set(c.id, c));
    diff.company?.forEach(c => this.companies.set(c.id, c));
    diff.user?.forEach(u => this.users.set(u.id, u));

    // Apply user entities
    diff.account?.forEach(a => this.accounts.set(a.id, a));
    diff.tag?.forEach(t => this.tags.set(t.id, t));
    diff.merchant?.forEach(m => this.merchants.set(m.id, m));
    diff.reminder?.forEach(r => this.reminders.set(r.id, r));
    diff.reminderMarker?.forEach(rm => this.reminderMarkers.set(rm.id, rm));
    diff.transaction?.forEach(t => this.transactions.set(t.id, t));
    diff.budget?.forEach(b => this.budgets.set(`${b.tag ?? 'null'}:${b.date}`, b));

    // Apply deletions
    diff.deletion?.forEach(d => this.applyDeletion(d));
  }

  private applyDeletion(deletion: Deletion): void {
    switch (deletion.object) {
      case 'account': this.accounts.delete(deletion.id); break;
      case 'tag': this.tags.delete(deletion.id); break;
      case 'merchant': this.merchants.delete(deletion.id); break;
      case 'reminder': this.reminders.delete(deletion.id); break;
      case 'reminderMarker': this.reminderMarkers.delete(deletion.id); break;
      case 'transaction': this.transactions.delete(deletion.id); break;
      // System entities and budgets have different deletion patterns
    }
  }

  /** Get transaction by id, null if not found */
  getTransaction(id: string): Transaction | undefined {
    return this.transactions.get(id);
  }

  /** Get account by id, null if not found */
  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }
}
