# OPERATIONAL SOP: GitHub Sync Policy
## Mirror Protocol
Repository-to-repository sync is handled by GitHub Actions:
2. `.github/workflows/mirror-to-original.yml` mirrors `main` from that repository into the original repository.
## Required GitHub configuration
- Repository access to both repositories.
- Contents: Read and Write.
- Pull requests: Read and Write.
Optionally add repository variable `MIRROR_TARGET_REPOSITORY` with the value `owner/repo` if the original repository is not `avdelag1/swipess`.
---
*Last Updated: 2026-04-28*
