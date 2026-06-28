# Footer Logo Images Fix Plan

## Problem Diagnosis

The footer renders its link lists correctly, but **both logo images are broken** (MOOG Logo and DRiV Logo show width/height = 0, `complete: false`).

**Root cause:** `content/footer.plain.html` references the logo images via absolute external URLs:
- `https://content.da.live/atulanand-code-and-theory/moogparts-poc-one/.footer/moog-logo-pos-...png`
- `https://content.da.live/atulanand-code-and-theory/moogparts-poc-one/.footer/driv-logo-corp-...png`

These URLs fail to load on the local preview (CORS / not-served errors confirmed in console). By contrast, the **nav logo works** because it was imported as a local media asset (`/media_1efe...png`), not an external `content.da.live` link.

**Original source images** (confirmed live on moogparts.com):
- MOOG Logo → `https://www.moogparts.com/content/loc-na/loc-us/fmmp-moog/en_US/_jcr_content/footer-par/footer/banner-image.img.png/MOOG-Logo-(POS)-1780687235299.png` (824×180)
- DRiV Logo → `https://www.moogparts.com/content/loc-na/loc-us/fmmp-moog/en_US/_jcr_content/footer-par/footer/bottom-bar/image.img.png/DRiV_Logo_Corp-1701718805526.png` (100×65)

## Approach

The footer images must resolve to **locally-served media assets** (like the nav logo already does) instead of broken external `content.da.live` URLs. Since content files should not be hand-edited, I'll fetch the two logos from the original site and re-import the footer fragment through the project's import tooling so the images get rehosted as proper local `/media_*` assets.

Note: the MOOG footer logo is the same artwork already imported for the nav, so it can reuse the existing local asset; only the DRiV logo is genuinely new.

## Checklist

- [ ] Confirm the dev server is running and reproduce the broken footer images in preview
- [ ] Download the two source logos from moogparts.com (MOOG Logo + DRiV Logo) into the content images folder
- [ ] Verify/confirm the existing local MOOG logo asset already in use by the nav can be reused for the footer
- [ ] Re-import the footer fragment via the content-import tooling so both logos reference local `/media_*` assets instead of `content.da.live` URLs
- [ ] Reload the local preview and verify both footer logos load (naturalWidth > 0, `complete: true`)
- [ ] Visually confirm footer layout/sizing of the logos matches the original moogparts.com footer
- [ ] Report completion

---

*Execution requires Execute mode — this plan is read-only. Approve to proceed.*
