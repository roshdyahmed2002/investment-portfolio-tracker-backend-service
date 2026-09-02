# Investment Portfolio Tracker — Supabase Database Workflow

## Structure

```text
supabase/
├── config.toml
├── migrations/
│   └── *.sql
└── database/
    ├── enums.sql
    ├── tables.sql
    └── functions.sql
```

* `database/` → current desired database state (**source of truth**).
* `migrations/` → generated migration history.
* `enums.sql` → enums/types.
* `tables.sql` → tables, constraints, indexes, RLS, grants.
* `functions.sql` → RPCs/database functions.

## New Laptop

```bash
git clone <repository>
cd <repository>
npm install
npx supabase start
```

The database is reproducible from the repository.

## Declarative Schema Workflow

Edit the files in:

```text
supabase/database/
```

Then run:

```bash
npx supabase db schema declarative sync
```

The CLI compares the declared schema, generates the required migration, and can apply it to the local database.

Then test the application.

## Reset Local Database

```bash
npx supabase db reset
```

This rebuilds the local database from the migration history.

Use it to verify that the complete database can be recreated from scratch.

**Do not reset every time you start working.**

For normal development:

```bash
npx supabase start
```

## Remote Database

Check migrations:

```bash
npx supabase migration list
```

Push pending migrations:

```bash
npx supabase db push
```

## Rules

1. Edit `supabase/database/`, not applied migrations.
2. Run `npx supabase db schema declarative sync`.
3. Test locally.
4. Review the generated migration.
5. Commit schema + migration to Git.
6. Use `npx supabase db push` for the remote database.
7. Never modify an already-applied migration.

## Complete Workflow

```text
Edit supabase/database/
          ↓
declarative sync
          ↓
Generated migration
          ↓
Test locally
          ↓
Review + Git commit
          ↓
db push
          ↓
Remote Supabase
```

**Source of truth:** `supabase/database/`
**History:** `supabase/migrations/`