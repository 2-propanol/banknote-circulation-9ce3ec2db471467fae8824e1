# Repository guidance

- The public repository and GitHub Pages deployment must contain demo data only.
- Never commit acquisition cost, sale history, seller/buyer identity, storage location, shipping details, private notes, or real banknote photos unless the user explicitly confirms they are public and publication-safe.
- Keep public catalog fields separate from private ledger fields. `data/schema.json` describes the local export, not data intended for publication.
- URL obscurity is not authentication. Do not describe the randomized Pages URL as secure or private.
- AI/OCR identification, catalog attribution, condition grading, and market pricing must remain suggestions until the user confirms them.
- Preserve the core purpose: collecting is primary; selling is limited to surplus management.
- Until the source-of-truth migration is implemented, public collection data comes read-only from `https://rune-markar.github.io/folio-7c4e19a2/data/collection.json`; join records by `items[].id`.
- Keep the two-layer boundary: World Banknote Archive fields may be public, while acquisition cost, seller/buyer identity, storage, shipping, and sale accounting remain private overlays.
- The intended future direction is FOLIO source data -> validated public projection -> World Banknote Archive. Do not create bidirectional writes or two competing canonical datasets.
