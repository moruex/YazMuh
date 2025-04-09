-- Drop all tables
DO
$$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE;', tbl.tablename);
    END LOOP;
END
$$;

-- Drop all types
DO
$$
DECLARE
    typ RECORD;
BEGIN
    FOR typ IN
        SELECT t.typname
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
          AND t.typtype = 'e'
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE;', typ.typname);
    END LOOP;
END
$$;
