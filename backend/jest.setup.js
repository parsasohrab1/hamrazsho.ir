// Runs before any test file is loaded — provides the env vars env.ts
// requires (DATABASE_URL, JWT secrets) so importing modules under test
// never needs a real database or real secrets.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.JWT_ACCESS_SECRET ??= "dev_only_test_access_secret";
process.env.JWT_REFRESH_SECRET ??= "dev_only_test_refresh_secret";
