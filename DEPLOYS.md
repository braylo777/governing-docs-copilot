# Deploys

| When (CT) | Worker version | Deployment | Commit | Rollback point |
| --- | --- | --- | --- | --- |
| 2026-10-28 09:29 | 1ae83d35-59be-454a-a132-e8ffd8535de0 | 104f4afe-7ee0-46a5-af1c-729b87a6d881 | first deploy | none before this (new Worker). To take it down without deleting, disable the workers.dev route. |

Post-deploy check: Playwright suite run against the live URL, 2/2 passed.
