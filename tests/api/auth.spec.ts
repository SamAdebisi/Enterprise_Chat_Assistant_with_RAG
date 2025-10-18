// Backwards-compatible entrypoint mapping to the consolidated API test suite.
// Keeping this file allows editors or CI jobs that glob tests/ to continue working
// while the authoritative tests live in apps/api/tests.
import "../../apps/api/tests/api.spec";
