# DomContrat maintenance and publication

## Scope and authorization

Maintain this static HTML/CSS/JavaScript application. Publish changes only when the user asks to update and publish, or otherwise explicitly authorizes publication. A push to `main` triggers the GitHub Pages workflow. Do not infer permission to change repository visibility, sharing, domains or account permissions from ordinary editing requests.

## Privacy and document requirements

- Keep all form data, validation, DOCX/PDF generation and previews in browser memory. Never add a Backend, database, analytics, tracking, remote document API, localStorage, sessionStorage, IndexedDB, cookies or automatic saving of entered data.
- Keep dependencies, fonts, logos and blank templates local. Never include real contracts, personal data, credentials, `.env` files, tokens, browser profiles or test outputs in Git or Pages artifacts. Tests must use clearly synthetic fixtures.
- Preserve the seven articles, Arabic/French support, sex-specific wording, user-selected CDI probation of 1–15 days, CDD dates without automatic probation, free-text tasks and the existing legal validations.
- Optional benefits belong to article 8 before the signatures, never an annex. Preserve the optional free-text otherBenefits field (maximum 3000 characters), and omit article 8 entirely when all benefits are empty. Keep filled values bold and article headings at 16pt; Word specifies Arial, PDF embeds the locally licensed Amiri. Never publish proprietary Windows font files without appropriate redistribution rights.
- DOCX uses Docxtemplater and PizZip. DOCX and PDF share the current contract text. Do not put platform branding into the contract itself.
- Change wage references only after checking an official source. Edit the central register in `src/legal-config.js`, preserve effective dates and references, and explain any legal behavior changes.

## Checks before committing or publishing

1. Read Git status, this file, README and ACCEPTANCE. Preserve unrelated work. If the remote repository already exists, inspect its default branch, contents and history before integrating. Never force-push over existing history.
2. Verify `gh auth status` without printing tokens or credential files. Use the intended connected account; request user intervention only when authentication or permission is actually required.
3. Run `npm ci` when dependencies changed or are missing, then `npm run licenses`, `npm run build`, and `npm test`. Fix failures before publication.
4. Review the exact staged diff and file list. Scan first-party files and deployment assets for secrets, private keys, real personal data, absolute local paths and accidental logs. Do not print matched secret values. Keep `node_modules`, `dist`, local credentials, QA documents and archives out of source commits.
5. Confirm relative paths, `.nojekyll`, the generated blank Word templates and offline dependencies. Test the nested repository path and both languages, CDI/CDD, chosen trial duration, editing and DOCX/PDF download.

## GitHub Pages release

- Use Git and GitHub CLI as requested by the user. Use the repository's verified `origin`; do not guess an account or overwrite an existing remote.
- Commit only reviewed necessary files. Use the account's verified public noreply address for new automation commits when no repository author identity is already configured. Never place a token in a remote URL or command argument.
- The workflow is `.github/workflows/pages.yml`, building and testing before deploying only `dist`. Use GitHub Pages `build_type: workflow`.
- Inspect GitHub Actions for the pushed commit, fix any CI/build/deploy failure, and wait for successful deployment. Report the verified commit and run URL when useful.
- Check the actual Pages URL over HTTPS, fetch its HTML/CSS/JavaScript/logo, and test the live app's form, legal checks, Arabic/French previews and Word/PDF download using synthetic inputs. Use desktop and mobile viewports when browser tooling permits. Do not transmit real user information during tests.
- Do not claim publication, successful native Word rendering or device testing unless observed. Document tooling limits and retain any required follow-up clearly. Never bypass a browser, OS or authentication security barrier.

## Updates

After a requested update, repeat the checks and release procedure; pushing tested changes to `main` deploys automatically. Keep README deployment/domain instructions and ACCEPTANCE accurate. Do not add a custom domain unless the user supplies and authorizes it. Keep existing CNAME/domain settings when rebuilding or updating.
