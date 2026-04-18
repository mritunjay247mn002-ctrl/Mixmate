# Bundled music clips (~40s AAC)

These `.m4a` files are **short, low-bitrate clips** used by `src/audio/tracks.ts` to keep app size small.

To **regenerate**: copy full MP3s into `../sources/` (see `../sources/README.md` for expected filenames), then:

1. Edit `scripts/audio/make-music-clips.mjs` (`JOBS`: `src`, `out`, `ss` start offset in seconds).
2. Run: `npm run music:clips`
3. Update `src/audio/tracks.ts` `require()` paths if clip filenames change.

Requires devDependency `ffmpeg-static` (no system ffmpeg needed).
