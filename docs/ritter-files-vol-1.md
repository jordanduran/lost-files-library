# The Ritter Files Vol. 1 — release preparation

Confirmed: Allen Ritter; title unchanged; $49 USD; all 17 WAVs from the supplied folder, including ZWA.wav.

The storefront uses the separate product ID `ritter-files-vol-1`. It must not reuse `pack-001`, whose existing orders and file mappings refer to synthetic demos. The new release has no published checkout record yet: its commercial license and final delivery setup are pending. The current Stripe integration remains test-only.

Source inspection: 17 stereo PCM WAVs, all 44.1 kHz, mixed 16-bit and 24-bit. Total duration approximately 17 minutes 56 seconds. BPM and musical keys have not been verified and are not advertised. Private source ZIP and individual WAVs are staged under `.tools/allen-pack-v1/`, outside Git and public assets. No Dropbox credentials or full source audio are embedded in the app.

Public previews are 15-second, 128 kbps stereo MP3 excerpts starting five seconds into each WAV, with short fades. All 17 previews total approximately 4.1 MB. The original audio remains unchanged. Review excerpts before release.

Temporary artwork: `public/packs/ritter-files-vol-1-cover.png`, generated with the built-in image generation tool. The source prompt is in `docs/ritter-cover-prompt.txt`. Artwork is shown in the producer pack panel, archive, cart, and player.

Before enabling purchases: approve license terms; review artwork and preview excerpts; upload the complete ZIP into private storage with a suitable file-size limit (the source ZIP is approximately 229 MB); create the matching product/license/file records; verify the downloaded contents. Real payments additionally require the planned live-payment implementation. Do not use the synthetic-demo setup script for this release.
