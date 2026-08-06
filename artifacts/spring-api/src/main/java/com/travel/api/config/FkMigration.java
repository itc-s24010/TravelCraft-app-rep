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
