# OPERATIONAL SOP: GitHub Sync Policy

Lovable manages the working repository sync. Agents must not run local `git add`, `git commit`, `git pull`, or `git push` commands from the sandbox.

## Mirror Protocol

Repository-to-repository sync is handled by GitHub Actions:

1. Changes made in Lovable sync to the Lovable-connected GitHub repository.
2. `.github/workflows/mirror-to-original.yml` mirrors `main` from that repository into the original repository.
3. `.github/workflows/sync-from-original.yml` opens a pull request when the original repository has new changes that need to come back into the Lovable-connected repository.

## Required GitHub configuration

Add a repository secret named `MIRROR_REPO_TOKEN` to the Lovable-connected GitHub repository. It must be a fine-grained GitHub token with:

- Repository access to both repositories.
- Contents: Read and Write.
- Pull requests: Read and Write.

Optionally add repository variable `MIRROR_TARGET_REPOSITORY` with the value `owner/repo` if the original repository is not `avdelag1/swipess`.

---

*Last Updated: 2026-04-28*
