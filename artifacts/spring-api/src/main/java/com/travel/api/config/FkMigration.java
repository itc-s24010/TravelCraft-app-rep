package com.travel.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Fixes foreign-key constraints that were created pointing to the wrong
 * (singular) table names instead of the JPA-managed (plural) table names.
 * Runs once at startup; safe to re-run (checks before altering).
 */
@Component
public class FkMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(FkMigration.class);

    private final JdbcTemplate jdbc;

    public FkMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        // trip (singular) → trips (plural)
        fixFk("budget",         "budget_trip_id_fkey",         "trip_id",     "trip",     "trips",      "trip_id");
        fixFk("accommodation",  "accommodation_trip_id_fkey",  "trip_id",     "trip",     "trips",      "trip_id");
        fixFk("transportation", "transportation_trip_id_fkey", "trip_id",     "trip",     "trips",      "trip_id");
        fixFk("expense",        "expense_trip_id_fkey",        "trip_id",     "trip",     "trips",      "trip_id");
        fixFk("notification",   "notification_trip_id_fkey",   "trip_id",     "trip",     "trips",      "trip_id");
        fixFk("schedule_items", "schedule_items_trip_id_fkey", "trip_id",     "trip",     "trips",      "trip_id");
        // category (singular) → categories (plural)
        fixFk("budget",         "budget_category_id_fkey",     "category_id", "category", "categories", "category_id");
        fixFk("expense",        "expense_category_id_fkey",    "category_id", "category", "categories", "category_id");

        // Preserve existing personal records by assigning them to the trip owner
        // when the per-user ownership columns are introduced.
        migrateBudgetUserColumn();
        migrateExpenseUserColumn();
        backfillBudgetUser();
        backfillExpenseUser();
        migrateCategoryOwnership();
        backfillOwner("transportation");
        backfillOwner("accommodation");
        backfillOwner("notification");
        enforceBudgetUser();
        enforceExpenseUser();
        enforcePersonalOwnership("transportation");
        enforcePersonalOwnership("accommodation");
        enforcePersonalOwnership("notification");
        ensureIsCompletedColumn();
        ensureTripDateColumns();
        ensureExpenseDateIsOptional();
        ensureChecklistTable();
    }

    private void ensureIsCompletedColumn() {
        try {
            jdbc.execute("ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;");
        } catch (Exception e) {
            log.warn("Failed to ensure is_completed column on trips table: {}", e.getMessage());
        }
    }

    private void ensureChecklistTable() {
        try {
            jdbc.execute("""
                    CREATE TABLE IF NOT EXISTS public.checklist_items (
                        item_id   BIGSERIAL PRIMARY KEY,
                        trip_id   BIGINT NOT NULL REFERENCES public.trips(trip_id) ON DELETE CASCADE,
                        label     TEXT   NOT NULL,
                        is_done   BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                    );
                    """);
            jdbc.execute("CREATE INDEX IF NOT EXISTS idx_checklist_trip ON public.checklist_items (trip_id, created_at)");
        } catch (Exception e) {
            log.warn("[FkMigration] Could not ensure checklist_items table: {}", e.getMessage());
        }
    }

    private void ensureTripDateColumns() {
        try {
            jdbc.execute("ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS start_date DATE;");
            jdbc.execute("ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS end_date DATE;");
            jdbc.execute("UPDATE public.trips SET start_date = trip_date WHERE start_date IS NULL AND trip_date IS NOT NULL;");
        } catch (Exception e) {
            log.warn("Failed to ensure date columns on trips table: {}", e.getMessage());
        }
    }

    private void ensureExpenseDateIsOptional() {
        try {
            jdbc.execute("ALTER TABLE public.expense ALTER COLUMN expense_date DROP NOT NULL");
        } catch (Exception e) {
            log.warn("Failed to make expense_date optional: {}", e.getMessage());
        }
    }

    private void migrateBudgetUserColumn() {
        try {
            Integer oldColumn = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='budget' AND column_name='created_by_user_id'", Integer.class);
            Integer newColumn = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='budget' AND column_name='user_id'", Integer.class);
            if ((newColumn == null || newColumn == 0) && oldColumn != null && oldColumn > 0) {
                jdbc.execute("ALTER TABLE public.budget RENAME COLUMN created_by_user_id TO user_id");
                jdbc.execute("ALTER INDEX IF EXISTS idx_budget_trip_owner RENAME TO idx_budget_trip_user");
            } else if (newColumn != null && newColumn > 0 && oldColumn != null && oldColumn > 0) {
                jdbc.execute("UPDATE public.budget SET user_id = created_by_user_id WHERE user_id IS NULL");
                jdbc.execute("ALTER TABLE public.budget DROP COLUMN created_by_user_id");
            }
        } catch (Exception e) {
            log.warn("[FkMigration] Could not migrate budget owner column: {}", e.getMessage());
        }
    }

    private void migrateExpenseUserColumn() {
        try {
            Integer oldColumn = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='expense' AND column_name='created_by_user_id'", Integer.class);
            Integer newColumn = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='expense' AND column_name='user_id'", Integer.class);
            if ((newColumn == null || newColumn == 0) && oldColumn != null && oldColumn > 0) {
                jdbc.execute("ALTER TABLE public.expense RENAME COLUMN created_by_user_id TO user_id");
                jdbc.execute("ALTER INDEX IF EXISTS idx_expense_trip_owner RENAME TO idx_expense_trip_user");
            } else if (newColumn != null && newColumn > 0 && oldColumn != null && oldColumn > 0) {
                jdbc.execute("UPDATE public.expense SET user_id = created_by_user_id WHERE user_id IS NULL");
                jdbc.execute("ALTER TABLE public.expense DROP COLUMN created_by_user_id");
            } else if (newColumn == null || newColumn == 0) {
                jdbc.execute("ALTER TABLE public.expense ADD COLUMN user_id bigint");
            }
        } catch (Exception e) {
            log.warn("[FkMigration] Could not migrate expense user column: {}", e.getMessage());
        }
    }

    private void backfillOwner(String table) {
        try {
            jdbc.execute("UPDATE public." + table + " x SET created_by_user_id = t.user_id " +
                    "FROM public.trips t WHERE x.trip_id = t.trip_id AND x.created_by_user_id IS NULL");
        } catch (Exception e) {
            log.debug("[FkMigration] Owner backfill skipped for {}: {}", table, e.getMessage());
        }
    }

    private void backfillBudgetUser() {
        try {
            jdbc.execute("UPDATE public.budget x SET user_id = t.user_id " +
                    "FROM public.trips t WHERE x.trip_id = t.trip_id AND x.user_id IS NULL");
        } catch (Exception e) {
            log.debug("[FkMigration] Budget user backfill skipped: {}", e.getMessage());
        }
    }

    private void backfillExpenseUser() {
        try {
            jdbc.execute("UPDATE public.expense x SET user_id = t.user_id " +
                    "FROM public.trips t WHERE x.trip_id = t.trip_id AND x.user_id IS NULL");
        } catch (Exception e) {
            log.debug("[FkMigration] Expense user backfill skipped: {}", e.getMessage());
        }
    }

    private void migrateCategoryOwnership() {
        try {
            jdbc.execute("ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id bigint");
            jdbc.execute("""
                    DO $$
                    DECLARE
                      user_rec record;
                      category_rec record;
                      budget_rec record;
                      expense_rec record;
                      owned_category_id bigint;
                    BEGIN
                      FOR user_rec IN SELECT user_id FROM public.users LOOP
                        FOR category_rec IN
                          SELECT category_name FROM (
                            VALUES ('交通費'), ('宿泊費'), ('食費'), ('観光・体験'), ('お土産'), ('その他')
                          ) default_names(category_name)
                          UNION
                          SELECT category_name FROM public.categories WHERE user_id IS NULL
                        LOOP
                          IF NOT EXISTS (
                            SELECT 1 FROM public.categories
                            WHERE user_id = user_rec.user_id AND category_name = category_rec.category_name
                          ) THEN
                            INSERT INTO public.categories (user_id, category_name)
                            VALUES (user_rec.user_id, category_rec.category_name);
                          END IF;
                        END LOOP;
                      END LOOP;

                      FOR budget_rec IN
                        SELECT b.budget_id, b.user_id, c.category_name
                        FROM public.budget b
                        JOIN public.categories c ON c.category_id = b.category_id
                        WHERE b.user_id IS NOT NULL
                          AND (c.user_id IS NULL OR c.user_id <> b.user_id)
                      LOOP
                        SELECT category_id INTO owned_category_id
                        FROM public.categories
                        WHERE user_id = budget_rec.user_id AND category_name = budget_rec.category_name
                        ORDER BY category_id
                        LIMIT 1;

                        IF owned_category_id IS NOT NULL THEN
                          UPDATE public.budget SET category_id = owned_category_id
                          WHERE budget_id = budget_rec.budget_id;
                        END IF;
                      END LOOP;

                      FOR expense_rec IN
                        SELECT e.expense_id, e.user_id, c.category_name
                        FROM public.expense e
                        JOIN public.categories c ON c.category_id = e.category_id
                        WHERE e.user_id IS NOT NULL
                          AND (c.user_id IS NULL OR c.user_id <> e.user_id)
                      LOOP
                        SELECT category_id INTO owned_category_id
                        FROM public.categories
                        WHERE user_id = expense_rec.user_id AND category_name = expense_rec.category_name
                        ORDER BY category_id
                        LIMIT 1;

                        IF owned_category_id IS NOT NULL THEN
                          UPDATE public.expense SET category_id = owned_category_id
                          WHERE expense_id = expense_rec.expense_id;
                        END IF;
                      END LOOP;

                      DELETE FROM public.categories c
                      WHERE c.user_id IS NULL
                        AND NOT EXISTS (SELECT 1 FROM public.budget b WHERE b.category_id = c.category_id)
                        AND NOT EXISTS (SELECT 1 FROM public.expense e WHERE e.category_id = c.category_id);
                    END $$;
                    """);
            jdbc.execute("CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories (user_id)");
            jdbc.execute("ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey");
            jdbc.execute("ALTER TABLE public.categories ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE");
        } catch (Exception e) {
            log.warn("[FkMigration] Could not migrate category ownership: {}", e.getMessage());
        }
    }

    /** Makes the privacy boundary part of the schema, not only an API convention. */
    private void enforcePersonalOwnership(String table) {
        try {
            jdbc.execute("CREATE INDEX IF NOT EXISTS idx_" + table + "_trip_owner ON public." + table + " (trip_id, created_by_user_id)");
            jdbc.execute("ALTER TABLE public." + table + " ALTER COLUMN created_by_user_id SET NOT NULL");
            jdbc.execute("ALTER TABLE public." + table + " DROP CONSTRAINT IF EXISTS " + table + "_created_by_user_id_fkey");
            jdbc.execute("ALTER TABLE public." + table + " ADD CONSTRAINT " + table + "_created_by_user_id_fkey " +
                    "FOREIGN KEY (created_by_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE");
        } catch (Exception e) {
            log.warn("[FkMigration] Could not enforce personal ownership for {}: {}", table, e.getMessage());
        }
    }

    private void enforceBudgetUser() {
        try {
            jdbc.execute("CREATE INDEX IF NOT EXISTS idx_budget_trip_user ON public.budget (trip_id, user_id)");
            jdbc.execute("ALTER TABLE public.budget ALTER COLUMN user_id SET NOT NULL");
            jdbc.execute("ALTER TABLE public.budget DROP CONSTRAINT IF EXISTS budget_user_id_fkey");
            jdbc.execute("ALTER TABLE public.budget ADD CONSTRAINT budget_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE");
        } catch (Exception e) {
            log.warn("[FkMigration] Could not enforce budget user ownership: {}", e.getMessage());
        }
    }

    private void enforceExpenseUser() {
        try {
            jdbc.execute("CREATE INDEX IF NOT EXISTS idx_expense_trip_user ON public.expense (trip_id, user_id)");
            jdbc.execute("ALTER TABLE public.expense ALTER COLUMN user_id SET NOT NULL");
            jdbc.execute("ALTER TABLE public.expense DROP CONSTRAINT IF EXISTS expense_user_id_fkey");
            jdbc.execute("ALTER TABLE public.expense ADD CONSTRAINT expense_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE");
        } catch (Exception e) {
            log.warn("[FkMigration] Could not enforce expense user ownership: {}", e.getMessage());
        }
    }

    /**
     * If {@code table}'s FK constraint {@code constraintName} still references
     * the wrong table {@code wrongRef}, drop it and recreate it pointing to
     * {@code correctRef}.
     *
     * @param table          table that owns the FK (e.g. "budget")
     * @param constraintName FK constraint name (e.g. "budget_trip_id_fkey")
     * @param column         FK column on the owning table (e.g. "trip_id")
     * @param wrongRef       old referenced table name (e.g. "trip")
     * @param correctRef     correct referenced table name (e.g. "trips")
     * @param refColumn      PK column on the referenced table (e.g. "trip_id")
     */
    private void fixFk(String table, String constraintName, String column,
                       String wrongRef, String correctRef, String refColumn) {
        try {
            String checkSql = """
                    SELECT COUNT(*) FROM information_schema.referential_constraints rc
                    JOIN information_schema.table_constraints tc
                      ON rc.constraint_name = tc.constraint_name
                     AND rc.constraint_schema = tc.constraint_schema
                    JOIN information_schema.table_constraints uc
                      ON rc.unique_constraint_name = uc.constraint_name
                     AND rc.unique_constraint_schema = uc.constraint_schema
                    WHERE tc.table_name = ?
                      AND tc.constraint_name = ?
                      AND uc.table_name = ?
                    """;
            Integer count = jdbc.queryForObject(checkSql, Integer.class, table, constraintName, wrongRef);

            if (count != null && count > 0) {
                log.warn("[FkMigration] {}.{} → '{}' is wrong; fixing to '{}'...", table, constraintName, wrongRef, correctRef);
                jdbc.execute("ALTER TABLE public." + table + " DROP CONSTRAINT IF EXISTS " + constraintName);
                jdbc.execute("ALTER TABLE public." + table
                        + " ADD CONSTRAINT " + constraintName
                        + " FOREIGN KEY (" + column + ") REFERENCES public." + correctRef + "(" + refColumn + ") ON DELETE CASCADE");
                log.info("[FkMigration] Fixed: {} → {}", table, constraintName);
            } else {
                log.debug("[FkMigration] {}.{} OK (no fix needed)", table, constraintName);
            }
        } catch (Exception e) {
            log.warn("[FkMigration] Could not check/fix {}.{}: {}", table, constraintName, e.getMessage());
        }
    }
}
