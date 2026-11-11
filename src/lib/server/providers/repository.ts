import "server-only";
import { transaction } from "../db/transactions";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Provider } from "../../providers/types";
import ServiceError from "../ServiceError";
import { validateProvider } from "./validation";

const columns = `id,name,base_url AS baseUrl,movie_template AS movieTemplate,tv_template AS tvTemplate,
 enabled,is_default AS isDefault,priority,created_at AS createdAt,updated_at AS updatedAt`;
function fromRow(row: unknown): Provider {
  const p = row as Provider;
  return { ...p, enabled: !!p.enabled, isDefault: !!p.isDefault };
}
export class ProviderRepository {
  constructor(readonly db: DatabaseSync) {}
  list() { return this.db.prepare(`SELECT ${columns} FROM stream_providers ORDER BY priority,created_at,id`).all().map(fromRow); }
  get(id: string) {
    const row = this.db.prepare(`SELECT ${columns} FROM stream_providers WHERE id=?`).get(id);
    if (!row) throw ServiceError.notFound("Provider not found");
    return fromRow(row);
  }
  save(raw: unknown, id?: string) {
    const p = validateProvider(raw);
    return transaction(this.db, () => {
      const previous = id ? this.get(id) : null;
      if (this.list().some(row => row.baseUrl === p.baseUrl && row.id !== id)) throw ServiceError.conflict("A provider with this base URL already exists");
      if (!id && this.list().length >= 50) throw ServiceError.conflict("At most 50 providers can be configured");
      if (p.isDefault) this.db.prepare("UPDATE stream_providers SET is_default=0,updated_at=? WHERE is_default=1").run(Date.now());
      const now = Date.now();
      const providerId = id ?? randomUUID();
      const priority = previous?.priority ?? Math.max(-1, ...this.list().map(row => row.priority)) + 1;
      this.db.prepare(`INSERT INTO stream_providers
        (id,name,base_url,movie_template,tv_template,enabled,is_default,priority,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,base_url=excluded.base_url,movie_template=excluded.movie_template,tv_template=excluded.tv_template,
        enabled=excluded.enabled,is_default=excluded.is_default,updated_at=excluded.updated_at`).run(
        providerId, p.name, p.baseUrl, p.movieTemplate, p.tvTemplate, +p.enabled, +p.isDefault, priority,
        previous?.createdAt ?? now, now);
      this.ensureDefault();
      return this.get(providerId);
    }, "IMMEDIATE");
  }
  private ensureDefault() {
    if (!this.db.prepare("SELECT 1 FROM stream_providers WHERE is_default=1").get()) {
      this.db.prepare(`UPDATE stream_providers SET is_default=1,updated_at=? WHERE id=(
        SELECT id FROM stream_providers WHERE enabled=1 ORDER BY priority,created_at,id LIMIT 1)`).run(Date.now());
    }
  }
  update(id: string, patch: unknown) {
    return transaction(this.db, () => {
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw ServiceError.validationFailed("Expected a provider object");
      const { priority: _priority, createdAt: _createdAt, updatedAt: _updatedAt, id: _id, ...current } = this.get(id);
      void _priority; void _createdAt; void _updatedAt; void _id;
      const changes = patch as Record<string, unknown>;
      const merged = { ...current, ...changes };
      if (changes.enabled === false) merged.isDefault = false;
      return this.save(merged, id);
    }, "IMMEDIATE");
  }
  delete(id: string) {
    transaction(this.db, () => { this.get(id); this.db.prepare("DELETE FROM stream_providers WHERE id=?").run(id); this.ensureDefault(); }, "IMMEDIATE");
  }
  reorder(ids: string[]) {
    transaction(this.db, () => {
      const existing = this.list();
      if (ids.length !== existing.length || new Set(ids).size !== ids.length || ids.some(id => !existing.some(p => p.id === id))) {
        throw ServiceError.validationFailed("Ordering must contain every provider exactly once");
      }
      const stmt = this.db.prepare("UPDATE stream_providers SET priority=?,updated_at=? WHERE id=?");
      ids.forEach((id, index) => stmt.run(index, Date.now(), id));
    }, "IMMEDIATE");
    return this.list();
  }
}
