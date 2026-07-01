-- Seed an initial admin so the system is usable on day 1.
-- The password hash below corresponds to "ChangeMe123!" — rotate it on first login.
-- Generate a fresh hash with:
--   node -e "import('bcryptjs').then(m=>m.default.hash('YourPass',10).then(console.log))"
INSERT INTO users (full_name, email, password_hash, role, is_active)
VALUES (
  'Bazar Admin',
  'admin@bazar-trace.local',
  '$2a$10$7Q9T0Z3aE8m6jYg1jJgVQOeT8Z9hKj0o2qW9pR7sH7VbXqLqV5y3W',
  'ADMIN',
  1
);

COMMIT;
