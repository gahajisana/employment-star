/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

function toSqlParams(params: unknown[]): SQLInputValue[] {
  return params.map((value) => {
    if (value === undefined) return null;
    if (value instanceof Date) return value.getTime();
    if (typeof value === "boolean") return value ? 1 : 0;
    return value as SQLInputValue;
  });
}

/**
 * In-memory D1Database test shim backed by `node:sqlite`, initialized with
 * the generated Drizzle migration SQL.
 */
export function createTestD1(): D1Database {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");

  const migrationSql = readFileSync(
    resolve(process.cwd(), "drizzle/migrations/0000_careful_liz_osborn.sql"),
    "utf8",
  );
  for (const statement of migrationSql.split("--> statement-breakpoint")) {
    const trimmed = statement.trim();
    if (trimmed) sqlite.exec(trimmed);
  }

  const prepare = (sqlText: string) => {
    const makeBound = (params: unknown[]) => {
      const bound = toSqlParams(params);
      return {
        bind(...nextParams: unknown[]) {
          return makeBound(nextParams);
        },
        async run() {
          const stmt = sqlite.prepare(sqlText);
          const info = stmt.run(...bound);
          return {
            success: true,
            meta: {
              changes: Number(info.changes),
              last_row_id: Number(info.lastInsertRowid),
              duration: 0,
              size_after: 0,
              rows_read: 0,
              rows_written: Number(info.changes),
              changed_db: Number(info.changes) > 0,
              served_by: "test-sqlite",
            },
            results: [],
          };
        },
        async all() {
          const stmt = sqlite.prepare(sqlText);
          const results = stmt.all(...bound);
          return {
            success: true,
            meta: {
              changes: 0,
              last_row_id: 0,
              duration: 0,
              size_after: 0,
              rows_read: results.length,
              rows_written: 0,
              changed_db: false,
              served_by: "test-sqlite",
            },
            results,
          };
        },
        async raw() {
          const stmt = sqlite.prepare(sqlText);
          stmt.setReturnArrays(true);
          return stmt.all(...bound) as unknown as unknown[][];
        },
        async first(colName?: string) {
          const stmt = sqlite.prepare(sqlText);
          const row = stmt.get(...bound) as Record<string, unknown> | undefined;
          if (!row) return null;
          return colName ? row[colName] : row;
        },
      };
    };

    return makeBound([]);
  };

  return {
    prepare,
    async batch(statements: D1PreparedStatement[]) {
      const results = [];
      for (const stmt of statements) {
        results.push(await stmt.all());
      }
      return results;
    },
    async exec(query: string) {
      sqlite.exec(query);
      return { count: 1, duration: 0 };
    },
    async dump() {
      return new ArrayBuffer(0);
    },
    withSession() {
      return this;
    },
  } as unknown as D1Database;
}
