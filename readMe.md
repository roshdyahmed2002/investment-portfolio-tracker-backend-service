///////////////////////////////////////////////////////
Database Workflow

1. Create a migration:
   supabase migration new <name>

2. Write the SQL.

3. Apply it:
   supabase db push

4. Commit the migration to Git.

Never edit an already applied migration.
Always create a new migration for schema changes.
///////////////////////////////////////////////////////////////