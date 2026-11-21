# vox-collage

A Claude skill for making Vox-style paper-collage explainer videos entirely in code. Output is a 1920×920 MP4 with no voice-over.

- One continuous paper world: the camera travels between ideas instead of cutting
- 2.5D parallax: every component sits on a z-depth layer
- Zoom in to focus, zoom out to reveal
- Charts, timelines and routes: the camera rides the line as it draws
- Vox-style paper maps and timelines
- Paper-puppet people: jointed head and arms only
- No captions: only names, years and numbers
- Photographed-paper finish: dust, specks, grain and print dots
- Synthesised SFX kept out of the speech band, with a separate stem

## Layout

- `SKILL.md`: the skill (playbook, API and the engine files embedded)
- `engine/`: the same engine as standalone files plus an example `scenes.js`

## Run the example

Requires Python 3 with `playwright`, `numpy`, `scipy` and `Pillow`, plus Chrome or Chromium and ffmpeg.

```bash
cd engine
mkdir -p assets out                                 # put your photos in assets/ (missing ones render as placeholders)
python3 render.py --sheet 1,4,8,13,17,20 --out out/check.jpg   # contact sheet
python3 render.py --out out/video.mp4               # full render + SFX
python3 motion_check.py out/video.mp4               # fails on any static 0.5 s
```

To install it as a Claude skill, add `SKILL.md` to your skills.

## License

MIT
