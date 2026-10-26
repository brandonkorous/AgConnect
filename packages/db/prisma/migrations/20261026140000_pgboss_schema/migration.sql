-- AG-11: pg-boss runs with createSchema off (agconn_app cannot CREATE on the database), so the schema is made here.
-- db-role.sql then hands it to agconn_app, which creates and owns the pg-boss tables inside it.
CREATE SCHEMA IF NOT EXISTS pgboss;
