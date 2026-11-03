# UE Studios

Private editorial review build for Urban Edge Studios in Limassol. The homepage, six session landing pages, three audience landing pages, studio hire, house show and session planner are pre-rendered HTML in English, Greek and Russian (39 pages). English keeps its existing URLs. Greek uses `/el/` and Russian uses `/ru/`, followed by the same service path.

## Edit and review

Use Node 20 or newer. Run `npm run build` followed by `npm run check`. No external packages or network access are needed. Serve the generated `dist/` directory with a local static server to review navigation and the planner.

- Edit service titles, descriptions, content and pilot pricing in `src/content.mjs`.
- Review the page-specific search phrases and intent in [SEO-KEYWORDS.md](SEO-KEYWORDS.md). Update the corresponding Greek and Russian copy in `src/locales/el.json` and `src/locales/ru.json` whenever English text changes. Missing translations stop the build.
- Edit shared templates, homepage, rates, house show and planner copy in `build.mjs`.
- Edit styling and browser interactions in `src/assets/`. The existing set illustration lives in `src/templates/set.svg`.
- The session planner downloads a personal text brief. Contact submission, live availability and payment are not enabled.

## GitHub and Vercel review

Keep the source in the dedicated `directorserenity-spec/ue-studios` repository. Import that repository into Vercel, use the project root, and use the included `vercel.json`. Use a review branch, separate from the configured production branch. Confirm Vercel Deployment Protection for the intended audience before sharing a preview. Do not attach the public domain until approval.

Preview builds default to noindex, with self-canonicals and reciprocal hreflang links scoped to the preview hostname. The Vercel preview uses `VERCEL_URL` automatically. For another preview host, set `UE_PREVIEW_ORIGIN`. The review build omits the sitemap. When Chris approves the domain, pricing, enquiry channel and release, set `UE_PUBLIC_LAUNCH=true` and `UE_PUBLIC_ORIGIN=https://<approved-domain>` **only for the production environment**, then rebuild. The production build writes self-referencing canonicals, social URLs, a 39-URL sitemap with all language alternates and robots.txt. Remove the pre-launch UI and replace the local-only planner with the approved enquiry workflow before release.

## Art and claims

The interview-room hero, camera detail and DJ detail are labelled illustrative concepts. The Mackie ProFX12v3+ photo shows the owner's equipment. Replace concepts with cleared images and footage from the actual room before the public launch. Verify address, access, rates and VAT, evening hours, DJ setup, full-length camera recording and transfer before making guarantees.
