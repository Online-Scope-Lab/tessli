# Tessli Visual Asset Manifest

Status: **canonical reference intake completed; production use remains controlled**

The canonical, user-authorized source references live under:

```text
docs/ref-img/
```

They are art-direction references, not production UI. Their hashes below make later visual comparisons reproducible without modifying their pixels.

The hero artwork's origin and rights chain are not recorded here. It is excluded from the MIT licence regardless, with Online Scope as rights holder; see [`TRADEMARKS.md`](../TRADEMARKS.md) and [`decisions.md`](decisions.md).

## Hero artwork

Canonical source:

```text
docs/ref-img/tessli-hero-geometry.webp
```

- dimensions: `1200 × 800`
- format: WebP
- size: `107,546 bytes`
- SHA-256: `6512760bc1d14ad84a7a81d573abe756cdde44b42b1c80fa4182a8c3b0f1e6b3`
- purpose: canonical art-direction source
- accessibility: decorative; render with empty alt text

Approved production derivative:

```text
web/public/brand/tessli-hero-geometry.webp
```

- dimensions: `900 × 614`
- size: `61,732 bytes`
- SHA-256: `0bf8d0fcea17d10b041b2bc08422679acf4fffd7c54fc70c1b18aba9d1d85583`
- use: decorative hero art only; it must retain intrinsic dimensions and an empty alt attribute.
- CI checks this SHA-256; never modify the file.

A separate mobile crop requires approval after the real Newsreader headline wrapping is reviewed in-browser. Do not merely shrink the desktop composition below 390px.

## Canonical desktop references

These are canonical desktop art-direction captures. They preserve composition, hierarchy, and component language but are not production UI assets.

### Explore

- path: `docs/ref-img/explore-desktop.webp`
- dimensions: `1200 × 849`
- size: `48,744 bytes`
- SHA-256: `c59333f47a69cde89cf3971cd5b99ef358701f346d248712360c59aa9640ea14`

### Collections

- path: `docs/ref-img/collections-desktop.webp`
- dimensions: `1200 × 849`
- size: `51,658 bytes`
- SHA-256: `5e02b4c2775e854bf78e364d5d0d8d0f6b04a2c74bfb418fd0030b22edd468ae`

### Saved

- path: `docs/ref-img/saved-desktop.webp`
- dimensions: `1200 × 849`
- size: `42,034 bytes`
- SHA-256: `d00e2e30ba64c95455af405f130e3e9457f60b7659b37085bf23f8175a76e5c1`

### Full Reference

- path: `docs/ref-img/full-reference-desktop.webp`
- dimensions: `1200 × 849`
- size: `42,952 bytes`
- SHA-256: `f98bc42b544fb40dcf1a260ac055707eb533edd5883d9c62150e128ee1901cea`

## Asset rules

- References are art-direction and layout targets, not sources of fictional data.
- Do not use the reference screenshots inside the production Tessli application.
- Production hero may be re-exported after crop approval, but preserve transparency and the warm stone/charcoal/orange palette.
- Do not apply a second heavy grain layer over the hero.
- Resource thumbnails are not included as production assets; they follow `docs/data-and-media-contract.md`.
- External site logos and images use the frozen preview → favicon → lettermark fallback chain.
