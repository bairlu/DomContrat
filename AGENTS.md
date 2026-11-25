# DomContrat maintenance and publication

## Scope and authorization

Maintain this static HTML/CSS/JavaScript application. Publish changes only when the user asks to update and publish, or otherwise explicitly authorizes publication. A push to `main` triggers the GitHub Pages workflow. Do not infer permission to change repository visibility, sharing, domains or account permissions from ordinary editing requests.

## Privacy and document requirements

- Keep all form data, validation, PDF generation and previews in browser memory. Never add a Backend, database, analytics, tracking, remote document API, localStorage, sessionStorage, IndexedDB, cookies or automatic saving of entered data.
- Keep dependencies, fonts, logos and blank templates local. Never include real contracts, personal data, credentials, `.env` files, tokens, browser profiles or test outputs in Git or Pages artifacts. Tests must use clearly synthetic fixtures.
- Preserve the seven articles, Arabic/French support, sex-specific wording, user-selected CDI probation of 1–15 days, CDD dates without automatic probation, free-text tasks and the existing legal validations.
- Optional benefits belong to article 8 before the signatures, never an annex. Preserve the optional free-text otherBenefits field (maximum 3000 characters), and omit article 8 entirely when all benefits are empty. Keep filled values bold and article headings at 16pt; PDF embeds the locally licensed Amiri. Never publish proprietary Windows font files without appropriate redistribution rights.
- The current application exports PDF only. Do not reintroduce Word export, Docxtemplater, PizZip or docx-preview unless explicitly requested. Preserve original blank reference templates only as source references; they are not deployment assets. Do not put platform branding into the contract itself.
- Identity forms require employerGender and expiry dates for both parties. CNIE asks for expiry instead of issue date; passport and residence card ask for both. Other documents retain issue date. Ignore hidden dates in validation and output, and verify expiry against the contract start/signature.
- Use the selected sex for both parties throughout the contract, article 1 as a number, a monthly cash wage, plain Arabic weekday names, a space before Arabic semicolons and page-number footers. Keep punctuation with its preceding word.
- The header has no language switch; keep language selection in stage 1. The wage calculation stays unchanged, with no explanatory table: insufficient wages show the computed minimum in parentheses. Preview must show the actual PDF and a recto verso notice adapted to the real page count.
- Change wage references only after checking an official source. Edit the central register in `src/legal-config.js`, preserve effective dates and references, and explain any legal behavior changes.

## Checks before committing or publishing

1. Read Git status, this file, README and ACCEPTANCE. Preserve unrelated work. If the remote repository already exists, inspect its default branch, contents and history before integrating. Never force-push over existing history.
2. Verify `gh auth status` without printing tokens or credential files. Use the intended connected account; request user intervention only when authentication or permission is actually required.
3. Run `npm ci` when dependencies changed or are missing, then `npm run licenses`, `npm run build`, and `npm test`. Fix failures before publication.
4. Review the exact staged diff and file list. Scan first-party files and deployment assets for secrets, private keys, real personal data, absolute local paths and accidental logs. Do not print matched secret values. Keep `node_modules`, `dist`, local credentials, QA documents and archives out of source commits.
5. Confirm relative paths, `.nojekyll`, PDF fonts and offline dependencies. Test the nested repository path and both languages, CDI/CDD, chosen trial duration, editing and PDF download.

## GitHub Pages release

- Use Git and GitHub CLI as requested by the user. Use the repository's verified `origin`; do not guess an account or overwrite an existing remote.
- Commit only reviewed necessary files. Use the account's verified public noreply address for new automation commits when no repository author identity is already configured. Never place a token in a remote URL or command argument.
- The workflow is `.github/workflows/pages.yml`, building and testing before deploying only `dist`. Use GitHub Pages `build_type: workflow`.
- Inspect GitHub Actions for the pushed commit, fix any CI/build/deploy failure, and wait for successful deployment. Report the verified commit and run URL when useful.
- Check the actual Pages URL over HTTPS, fetch its HTML/CSS/JavaScript/logo, and test the live app's form, legal checks, Arabic/French previews and PDF download using synthetic inputs. Use desktop and mobile viewports when browser tooling permits. Do not transmit real user information during tests.
- Do not claim publication, successful native document rendering or device testing unless observed. Document tooling limits and retain any required follow-up clearly. Never bypass a browser, OS or authentication security barrier.

## Updates

After a requested update, repeat the checks and release procedure; pushing tested changes to `main` deploys automatically. Keep README deployment/domain instructions and ACCEPTANCE accurate. Do not add a custom domain unless the user supplies and authorizes it. Keep existing CNAME/domain settings when rebuilding or updating.


## Current derived fields and references

- PDF download names are `عقد العمل المنزلي - (worker full name).pdf`, with safe filename normalization in src/contract-data.js. Do not expose entered names through URLs or logs.
- The professional role is derived from the worker sex/language, readonly in the form, and independently derived again in PDF output. A caller-provided role must not override it.
- Other selected tasks follow the explicit label «مهام أخرى مسموح بها قانونا:» (or its French equivalent). Keep spaces before Arabic/Latin commas and semicolons, without orphan punctuation.
- Recto verso guidance stays below the PDF preview in the interface, outside the legal contract text.
- Keep the full law title visible and retain the three verified Gazette links from src/legal-config.js. External references open only on a user click, with noreferrer; never fetch them automatically or append form data.
- Build fingerprints JS/CSS filenames in published HTML to prevent stale cached assets. Stable app.js/app.css aliases serve the source-root local entry; do not remove those aliases without updating that entry and tests.


## Deposit destination and receipt

- The wizard has 8 stages: deposit destination is 7 and review is 8. Keep dependent office selection tied to the selected region and clear the office after a region change. Revalidate both documents after editing.
- src/directorates.js is a reviewed local snapshot of the Ministry's 12 regions and 54 published offices. Keep original published office names, including regional headquarters when those are the listed office. Do not invent provincial offices or use staff names, phones or email addresses. Retain Arabic names if no matching French name is published. Record verified date and official page URLs when updating.
- Account creation remains unavailable. Its button only explains that no account is needed, preserves current inputs and performs no registration or network call.
- Receipt generation/preview/download is browser-local. The receipt is a model to present to the administration. Keep deposit number/date, administration signature and stamp blank; do not claim a download proves deposit or generate official receipt numbers, stamps or signatures.
- The original Ministry logo asset and provenance must remain local. The PDF renderer clips the authentic coat of arms from the original image; never replace it with an invented or AI-generated emblem/seal. Only the receipt uses it, not the contract.
- Preserve receipt and contract tabs, their exact downloadable Blob URLs, accessible controls and legal validation. Test the new receipt in both languages and render actual PDFs for layout review.
