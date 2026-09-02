# Transaction Locking & Replay — Quick Notes

## 1. Why lock the instrument?

The instrument contains the calculated state:

- `units_held`
- `avg_buy_cost`
- `realized_pl`

Without an instrument lock, two operations can modify/replay the same instrument at the same time:

```text
A: SELL 7
B: SELL 6

A reads units = 10
B reads units = 10

A → valid
B → valid

A → units = 3
B → units = 4
```

Both succeed even though only 10 units existed.

With the instrument lock:

```text
A: LOCK instrument
A: SELL 7 → units = 3
A: COMMIT

B: LOCK instrument
B: SELL 6
B: 6 > 3 → FAIL
```

> **Instrument lock = protect the instrument's calculated state from concurrent changes.**

---

## 2. Why lock the instrument during UPDATE / DELETE + REPLAY?

Replay rebuilds the instrument from its transaction history.

The important thing is **preventing another operation from changing the transaction history while you're rebuilding the instrument.**

Without the instrument lock:

```text
A: UPDATE transaction
A: REPLAY → reads transaction history

B: DELETE/UPDATE transaction
B: REPLAY → reads transaction history

A: UPDATE instrument
A: COMMIT

B: UPDATE instrument
B: COMMIT
```

Both RPCs can succeed, but the final instrument state can be based on a concurrent/stale version of the transaction history.

One operation can overwrite the instrument state calculated by the other.

With the instrument lock:

```text
A: LOCK instrument
   ↓
A: UPDATE transaction
   ↓
A: REPLAY
   ↓
A: UPDATE instrument
   ↓
A: COMMIT

B: LOCK instrument → WAITS
   ↓
B: UPDATE/DELETE transaction
   ↓
B: REPLAY
   ↓
B: UPDATE instrument
   ↓
B: COMMIT
```

Operations affecting the same instrument are therefore serialized.

---

## 3. Why lock the transaction?

PostgreSQL's `UPDATE` and `DELETE` already acquire a row lock automatically.

So the transaction lock is **not primarily needed because UPDATE/DELETE need a lock**.

The explicit:

```sql
SELECT ... FOR UPDATE
```

is useful because the RPC first reads the transaction, determines its old instrument, and then modifies/replays it.

It protects the specific historical transaction while we are working with it.

Example:

```text
A: LOCK transaction #10
B: tries DELETE/UPDATE transaction #10
B: WAITS

A: UPDATE #10
A: REPLAY
A: COMMIT

B: gets the lock
```

---

## 4. What if another RPC forgets to lock the instrument?

This is another reason to keep the transaction lock.

For example:

```text
UPDATE RPC:
    LOCK transaction #10
    ↓
    LOCK instrument
    ↓
    UPDATE + REPLAY

DELETE RPC:
    tries to DELETE transaction #10
```

The transaction lock prevents the DELETE from modifying that same historical transaction while the UPDATE RPC is working with it.

Ideally, however, **every transaction mutation must lock the instrument**.

---

## 5. The rule

```text
CREATE
    ↓
LOCK instrument
    ↓
CREATE transaction
    ↓
UPDATE instrument
    ↓
COMMIT


UPDATE
    ↓
LOCK transaction
    ↓
LOCK instrument(s)
    ↓
UPDATE transaction
    ↓
REPLAY
    ↓
UPDATE instrument(s)
    ↓
COMMIT


DELETE
    ↓
LOCK transaction
    ↓
LOCK instrument
    ↓
DELETE transaction
    ↓
REPLAY
    ↓
UPDATE instrument
    ↓
COMMIT
```

### Ideally

```text
CREATE  → LOCK instrument
UPDATE  → LOCK instrument + transaction
DELETE  → LOCK instrument + transaction
```

Then you have **two layers of protection**:

### Instrument lock

> Prevents concurrent operations from rebuilding the same instrument.

### Transaction lock

> Prevents concurrent operations from modifying the same historical transaction.

So:

> **Keep the transaction lock. It is not the primary lock for replay correctness, but it is a valuable defensive guarantee, especially if another RPC ever forgets to lock the instrument.**


In a normal single UPDATE or DELETE, we don't need to manually lock the row because PostgreSQL automatically locks it for that operation.

Here, however, our RPC performs multiple operations as one logical workflow — read/modify transaction → replay transaction history → update instrument. Therefore, we explicitly lock the rows that must remain consistent throughout the entire workflow, preventing another operation from intervening and mixing data between the operations.

And the key distinction:

Normal UPDATE:
UPDATE → automatic row lock → done

vs.

Our RPC:
LOCK transaction
      ↓
LOCK instrument
      ↓
UPDATE / DELETE transaction
      ↓
REPLAY history
      ↓
UPDATE instrument
      ↓
COMMIT

So the locks aren't simply for the UPDATE/DELETE itself — they protect the entire multi-step operation.

We put these locks inside the SQL function because the function executes as part of one PostgreSQL transaction. This means the locks remain held throughout the entire function execution and are released only when the transaction commits or rolls back.

So the complete idea is:

SQL Function
    ↓
BEGIN transaction
    ↓
LOCK transaction
    ↓
LOCK instrument
    ↓
UPDATE / DELETE transaction
    ↓
REPLAY history
    ↓
UPDATE instrument
    ↓
COMMIT
    ↓
Locks released

If anything fails:

ERROR
  ↓
ROLLBACK
  ↓
All changes undone
  ↓
Locks released

That's why the locking + replay logic belongs inside the PostgreSQL function: the whole workflow is atomic and protected as one transaction.

## SUPA BASE CONNECTION ##
For this project, we decided to continue using the current Supabase JS client architecture rather than switching now, since the backend and authentication/RLS setup are already built around it. We discussed that in future projects, you can instead use a normal PostgreSQL database with TypeORM, where your Node.js backend connects directly to PostgreSQL and you can write transactions, row locking, QueryBuilder, updates, deletes, and raw SQL directly in TypeORM without needing Supabase RPC functions for database operations. Supabase itself uses PostgreSQL, so it is also technically possible to connect TypeORM directly to a Supabase PostgreSQL database, but you'd need to handle authorization/RLS carefully because TypeORM connections don't automatically carry the user's Supabase JWT context.