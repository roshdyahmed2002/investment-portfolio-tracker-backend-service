# Transaction RPC Locking & Replay Logic

## CREATE TRANSACTION RPCs

### BUY

LOCK instrument
      ↓
READ units_held + avg_buy_cost
      ↓
INSERT transaction
      ↓
UPDATE instrument summary
      ↓
COMMIT

Reason for lock:
SELECT instrument FOR UPDATE so another transaction cannot modify
the same instrument at the same time.

This is important because BUY uses:
- units_held
- avg_buy_cost

to calculate the new instrument values.


### SELL

LOCK instrument
      ↓
READ units_held + avg_buy_cost + realized_pl
      ↓
VALIDATE units
      ↓
CALCULATE transaction realized_pl
      ↓
INSERT transaction
      ↓
UPDATE instrument summary
      ↓
COMMIT

Reason for lock:
SELECT instrument FOR UPDATE so another transaction cannot modify
the same instrument while we are using its:
- units_held
- avg_buy_cost
- realized_pl

to calculate the SELL.


### DIVIDEND CASH

LOCK instrument
      ↓
READ realized_pl
      ↓
INSERT transaction
      ↓
UPDATE instrument realized_pl
      ↓
COMMIT

Reason for lock:
SELECT instrument FOR UPDATE so another transaction cannot modify
realized_pl at the same time.


### DIVIDEND SHARES

LOCK instrument
      ↓
READ units_held + avg_buy_cost
      ↓
CALCULATE new units + avg_buy_cost
      ↓
INSERT transaction
      ↓
UPDATE instrument summary
      ↓
COMMIT

Reason for lock:
SELECT instrument FOR UPDATE so another transaction cannot modify
the same instrument while we are using:
- units_held
- avg_buy_cost

to calculate the dividend shares.


# UPDATE TRANSACTION RPC

LOCK instrument
      ↓
LOCK transaction
      ↓
UPDATE transaction
      ↓
REPLAY all transactions
      ↓
UPDATE instrument summary
      ↓
COMMIT

Reason for instrument lock:
SELECT instrument FOR UPDATE so another transaction cannot modify
the same instrument at the same time.

This prevents another BUY / SELL / DIVIDEND transaction from changing
the instrument columns we are using or rebuilding:
- units_held
- avg_buy_cost
- realized_pl

It also prevents another transaction from being created while we are
recalculating the instrument.

For example, if another SELL happens while we are recalculating,
the SELL may depend on units_held that is about to change.

The instrument lock prevents that concurrent operation.

Reason for transaction lock:
SELECT transaction FOR UPDATE so another request cannot update or
delete the same transaction while we are modifying it.

The transaction is part of the historical sequence used by replay,
so we must prevent another request from changing it at the same time.


# DELETE TRANSACTION RPC

LOCK instrument
      ↓
LOCK transaction
      ↓
DELETE transaction
      ↓
REPLAY all remaining transactions
      ↓
UPDATE instrument summary
      ↓
COMMIT

Reason for instrument lock:
SELECT instrument FOR UPDATE so another transaction cannot modify
the same instrument while we are deleting and rebuilding its state.

This prevents another BUY / SELL / DIVIDEND transaction from happening
while the instrument summary is being recalculated.

Reason for transaction lock:
SELECT transaction FOR UPDATE so another request cannot update or
delete the same transaction while we are deleting it.

After deletion, replay all remaining transactions because removing
one historical transaction can change the calculations of transactions
that came after it.


# REPLAY

The replay logic is basically the same calculation logic used when
creating transactions.

CREATE:
calculate the effect of ONE new transaction
and add it to the existing instrument state.

REPLAY:
start from zero and apply ALL existing transactions
in chronological order to rebuild the instrument state.

The replay does NOT insert new transaction rows.


## Replay flow

START

units_held = 0
avg_buy_cost = 0
realized_pl = 0

      ↓

READ transactions for this instrument
in chronological order

      ↓

BUY
→ increase units
→ recalculate avg_buy_cost

      ↓

SELL
→ validate that enough units exist
→ calculate this transaction's realized_pl
→ decrease units
→ add realized_pl to cumulative realized_pl

      ↓

DIVIDEND CASH
→ add dividend_cash to realized_pl

      ↓

DIVIDEND SHARES
→ calculate new shares
→ increase units
→ recalculate avg_buy_cost

      ↓

UPDATE instrument summary

units_held
avg_buy_cost
realized_pl


# WHY REPLAY IS NECESSARY

Changing or deleting an old transaction can affect every transaction
that comes after it.

Example:

Buy 10 @ 40
Sell 8 @ 50

This is valid:

10 units
↓
Sell 8
↓
2 units remaining


If the BUY is edited:

Buy 5 @ 40
Sell 8 @ 50

The Sell is now INVALID because:

5 units
↓
Sell 8
↓
Insufficient units

Therefore the UPDATE must fail and the whole RPC must ROLLBACK.

Another example:

Buy 100 @ 40
Buy 100 @ 50
Sell 60 @ 55

Original average buy cost:

45

Original Sell realized P/L:

60 × (55 - 45) = 600


If the first BUY is changed:

Buy 100 @ 45
Buy 100 @ 50
Sell 60 @ 55

New average buy cost:

47.5

New Sell realized P/L:

60 × (55 - 47.5) = 450

The Sell is still valid, but its realized P/L changed.

Therefore we replay all transactions so that:
- later transactions are revalidated
- later realized P/L values are recalculated
- units_held is recalculated
- avg_buy_cost is recalculated
- realized_pl is recalculated


# REPLAY + LOCKING

The UPDATE / DELETE operation must protect the instrument while
the historical transactions are being changed and replayed.

UPDATE:

LOCK instrument
      ↓
LOCK transaction
      ↓
UPDATE transaction
      ↓
REPLAY all transactions
      ↓
UPDATE instrument summary
      ↓
COMMIT


DELETE:

LOCK instrument
      ↓
LOCK transaction
      ↓
DELETE transaction
      ↓
REPLAY all remaining transactions
      ↓
UPDATE instrument summary
      ↓
COMMIT


# WHY BOTH LOCKS?

Instrument lock:

SELECT instrument FOR UPDATE so another transaction cannot modify
the same instrument at the same time.

This protects the values:
- units_held
- avg_buy_cost
- realized_pl

and prevents another BUY / SELL / DIVIDEND transaction from being
created or modified for the same instrument while we are recalculating it.


Transaction lock:

SELECT transaction FOR UPDATE so another request cannot update or
delete the same transaction while we are modifying it.

This is important because the transaction is part of the historical
sequence used by the replay.


# WHY RPC / DATABASE FUNCTION?

The UPDATE / DELETE operation requires multiple database operations
to behave as ONE atomic transaction:

LOCK instrument
      ↓
LOCK transaction
      ↓
UPDATE / DELETE transaction
      ↓
REPLAY transactions
      ↓
UPDATE instrument
      ↓
COMMIT

If anything fails during the process:

ROLLBACK EVERYTHING

We put this logic inside a PostgreSQL function and call it through
Supabase RPC because Supabase's normal JavaScript client calls do not
give us the same transaction control we have with TypeORM transactions.


# FINAL STRUCTURE

CREATE BUY:

LOCK instrument
      ↓
CREATE transaction
      ↓
UPDATE instrument
      ↓
COMMIT


CREATE SELL:

LOCK instrument
      ↓
CREATE transaction
      ↓
UPDATE instrument
      ↓
COMMIT


CREATE DIVIDEND CASH:

LOCK instrument
      ↓
CREATE transaction
      ↓
UPDATE instrument
      ↓
COMMIT


CREATE DIVIDEND SHARES:

LOCK instrument
      ↓
CREATE transaction
      ↓
UPDATE instrument
      ↓
COMMIT


UPDATE:

LOCK instrument
      ↓
LOCK transaction
      ↓
UPDATE transaction
      ↓
REPLAY
      ↓
UPDATE instrument
      ↓
COMMIT


DELETE:

LOCK instrument
      ↓
LOCK transaction
      ↓
DELETE transaction
      ↓
REPLAY
      ↓
UPDATE instrument
      ↓
COMMIT  