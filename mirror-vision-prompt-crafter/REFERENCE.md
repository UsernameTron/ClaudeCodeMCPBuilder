# Mirror Vision Prompt Crafter - Extended Reference

## Complete Fidelity Modifier Library

### Resolution & Render Engine (Use 3-5 per prompt)
- 12K (12288×6480)
- 15360×8640
- 32-bit linear EXR
- 16-bit RAW pipeline
- Path-traced
- Spectral ray-traced
- Bidirectional global-illumination
- Unclamped HDR
- 15-stop dynamic range
- x16 super-sampling
- Sub-pixel jitter
- Micro-displacement
- Adaptive tessellation
- Parallax occlusion mapping
- PBR shading
- Disney BRDF
- Energy-conserving materials
- Stochastic denoise OFF

### Sensor & Optics (Use 3-5 per prompt)
- ARRI Alexa 65
- RED V-Raptor XL 8K
- Sony Venice 2
- Phase One IQ4 150MP
- Zeiss Otus 85 mm f/1.4
- Canon EF 100 mm Macro L f/2.8
- Leica Noctilux 50 mm f/0.95
- ƒ/1.2 prime
- 1/125 s shutter
- ISO 100
- 11-blade round bokeh
- Sensor bloom
- Lens breathing
- Aperture starburst
- Anamorphic horizontal flare
- Gate weave
- Edge diffraction spikes

### Lighting & Atmospherics (Use 3-5 per prompt)
- HDRI 32-bit dome
- 3-point studio softboxes
- Kino-Flo bounce fill
- 5600 K key
- 3200 K practicals
- Negative fill flags
- Specular kicker
- Volumetric fog
- God rays
- Air particulate
- Aerosol haze
- Light wrap
- Subsurface translucency back-light
- Multi-bounce caustics
- Global volumetrics
- ACES-cg pipeline RRT+ODT

### Material & Surface Fidelity (Use 3-5 per prompt)
- Anisotropic brushed titanium
- Aged bronze patina
- Chromed nickel
- Frosted borosilicate glass
- Translucent resin
- Nano-coated polymer
- Tri-layer human skin SSS
- Fine-grain leather pore
- Cross-weave linen
- Fingerprint oils
- Dust motes
- Hairline scratches
- Thin-film interference
- IOR 1.52
- Anisotropic roughness 0.15
- Micron-scale normal noise

### Color Grading & Science (Use 3-5 per prompt)
- ACEScg color space
- ACES 1.3 RRT
- Rec. 709 ODT
- Display P3 export
- Kodak Vision3 500T 5219
- Fuji Eterna 250D
- Kodak Ektachrome 100D
- Teal-orange blockbuster
- Bleach-bypass
- Cool-neutral commercial
- Soft pastel fashion
- Chromatic aberration (subtle)
- Halation glow
- Bloom 1%
- Fine 35 mm grain

### Post-Processing Enhancements (Use 3-5 per prompt)
- Sharpen radius 0.3 px
- Clarity micro-contrast +5%
- Vignette −0.5 EV
- Letterbox 2.39:1
- Clean plate
- Zero watermark
- PNG-16 bit
- TIFF-16 bit
- Lossless compression
- Metadata embed: lens & body tags

### Scene Composition (Use 2-3 per prompt)
- Golden-spiral framing
- Rule-of-thirds grid
- Foreground parallax layer
- Seamless cyclorama
- Neutral gradient BG
- Full 360° HDRI environment

---

## Satirical Visual Metaphor Patterns

### Pattern 1: Juxtaposition (Side-by-Side Truth)
**Structure:** Split scene showing promise vs. reality
**Example:** Marketing materials on left, actual product/service on right
**Key:** Use lighting, color temperature, and atmosphere to distinguish

### Pattern 2: Reveal (Pull Back the Curtain)
**Structure:** Foreground shows polished facade, background reveals machinery
**Example:** Pristine showroom in focus, sweatshop visible through window (out of focus)
**Key:** Depth of field and focus control tell the story

### Pattern 3: Archaeological (Evidence Left Behind)
**Structure:** Abandoned or unused objects reveal truth through absence
**Example:** Dusty diversity training materials, pristine but unused
**Key:** Micro-details like dust, wear patterns, lack of use

### Pattern 4: Connection (Follow the Money/Power)
**Structure:** Physical connection between contradiction points
**Example:** Cable connecting AI ethics whitepaper to surveillance server
**Key:** Macro photography on the connecting element

### Pattern 5: Scale Distortion (Resource Allocation)
**Structure:** Size relationships expose priority mismatches
**Example:** Massive CEO bonus check monument, tiny worker salary slip
**Key:** Exaggerated but photorealistic scale differences

### Pattern 6: Time Lapse Composite (Promises vs. Delivery)
**Structure:** Same location, different moments showing degradation
**Example:** Startup launch party confetti still on floor of now-bankrupt office
**Key:** Visual evidence of time passing contradicting claims

---

## YAML Template Library

### Template 1: Corporate Contradiction
```yaml
description: >
  [Photorealistic corporate environment], [12K/Path-traced modifiers], [Camera: ARRI Alexa 65, Lens: Zeiss Otus], [HDRI dome lighting]. [Pristine corporate element] contrasted with [harsh reality element]. [Volumetric separation between worlds]. [Material fidelity details]. [Color grade].

subject: >
  [Central object/space that exposes contradiction], [Macro details showing truth through wear/absence/connection].

environment:
  - [Corporate/polished space description]
  - [Reality/harsh truth space visible]
  - [Connecting element or revealing detail]
  - [Atmospheric separation technique]

style:
  - Photorealistic
  - [Documentary/Commercial/Architectural as appropriate]
  - Brutally honest juxtaposition

lighting:
  - [Warm/aspirational for promise side: 3200K practicals]
  - [Cool/harsh for reality side: 5600K key]
  - [Volumetric fog or God rays for separation]
  - [Light wrap or caustics for emphasis]

color_palette:
  - [Warm color for promises/marketing]
  - [Cold color for reality/execution]
  - [Accent color for truth-revealing element]

mood:
  - Cynical
  - Ironic contrast
  - [Specific corporate sin] exposed

camera:
  - [Appropriate lens for subject]
  - [Framing technique: Golden spiral / Rule of thirds]
  - [Camera body: ARRI/RED/Sony]
  - [Composition technique]

post_processing:
  - Clarity micro-contrast +5%
  - Sharpen radius 0.3 px
  - [Appropriate color grade]
  - Fine 35 mm grain
  - Vignette −0.5 EV

resolution: "[12K or 15K], 32-bit linear EXR, [Render engine], x16 super-sampling"

text_overlays: []

caption: >
  [Mirror Universe Pete voice execution: surgical opening, forensic dismantling, lethal dismissal]

parameters: "--ar 3:2 --q 2 --style raw --v 6"

negative: "--no cartoon, --no illustration, --no stylized, --no text overlays, --no aliased edges, --no distortion"
```

### Template 2: Tech Dystopia
```yaml
description: >
  [Photorealistic tech environment], [15K/Spectral ray-traced modifiers], [Camera: RED V-Raptor XL 8K], [Macro lens]. [Gleaming tech promise] revealing [sinister reality underneath]. [Disney BRDF materials], [Multi-bounce caustics]. [Bleach-bypass or teal-orange grade].

subject: >
  [Central tech object/interface], [Macro detail exposing contradiction], [Material fidelity showing truth].

environment:
  - [Clean tech showroom/presentation]
  - [Server room/backend reality]
  - [Data visualization showing actual priorities]
  - [Physical connection exposing truth]

style:
  - Photorealistic
  - Technical macro photography
  - Documentary evidence

lighting:
  - [Warm marketing glow: 3200K]
  - [Cold technical reality: 5600K]
  - [Screen glow revealing data]
  - [Fiber-optic or LED internal lighting for truth]

color_palette:
  - [Aspirational gold/warm]
  - [Reality steel/cold]
  - [Data/truth accent color]

mood:
  - Technically brutal
  - Follow the data
  - Optimism vs. execution

camera:
  - [Macro lens for technical detail]
  - [Split composition or reveal framing]
  - [RED/ARRI sensor]
  - [Technical documentary angle]

post_processing:
  - Sharpen radius 0.3 px for technical detail
  - Clarity micro-contrast +5%
  - [Bleach-bypass for documentary feel]
  - Fine 35 mm grain
  - Display P3 export

resolution: "15360×8640, 32-bit linear EXR, Spectral ray-traced, Disney BRDF"

text_overlays: []

caption: >
  [Mirror Universe Pete voice: expose the specific tech contradiction with cold logic]

parameters: "--ar 3:2 --q 2 --style raw --v 6"

negative: "--no cartoon, --no illustration, --no stylized, --no faces, --no aliased edges"
```

### Template 3: Abandoned Promise
```yaml
description: >
  [Photorealistic abandoned/unused space], [12K/Path-traced], [ARRI Alexa 65, Zeiss Otus 85mm f/1.4], [Natural HDRI lighting]. [Pristine initiative space] showing [zero signs of use]. [Dust accumulation macro detail], [Tri-layer SSS on unused objects]. [ACEScg color space, Cool-neutral grade].

subject: >
  [Untouched objects revealing abandonment], [Micron-scale dust showing time passed unused], [Fingerprint-free surfaces proving neglect].

environment:
  - [Initiative space (wellness room, diversity center, etc.)]
  - [Visible signs of intended vs. actual use]
  - [Pristine maintenance of facade]
  - [Actual work environment visible beyond]

style:
  - Photorealistic
  - Archaeological evidence photography
  - Abandonment study

lighting:
  - [Soft natural light revealing dust]
  - [God rays through windows showing air particulate]
  - [Unused space well-lit but empty]
  - [Actual workspace harsh lighting visible]

color_palette:
  - [Sterile white/neutral (unused purity)]
  - [Warm wood (false comfort)]
  - [Harsh fluorescent from actual workspace]

mood:
  - Archaeological irony
  - Evidence of neglect through preservation
  - Promise vs. priority

camera:
  - Zeiss Otus 85 mm f/1.4 at ƒ/1.2
  - [Symmetrical framing showing pristine abandonment]
  - ARRI Alexa 65 sensor
  - [Composition centering unused elements]

post_processing:
  - Clarity micro-contrast +5% to show dust detail
  - Sharpen radius 0.3 px
  - Cool-neutral commercial grade
  - Fine 35 mm grain
  - Vignette −0.5 EV

resolution: "12K (12288×6480), 32-bit linear EXR, Path-traced, x16 super-sampling"

text_overlays: []

caption: >
  [Mirror Universe Pete voice: expose what the pristine preservation reveals about priorities]

parameters: "--ar 3:2 --q 2 --style raw --v 6"

negative: "--no cartoon, --no illustration, --no stylized, --no text, --no people in abandoned space"
```

---

## Clarification Question Templates

When satirical target is unclear:

### Question Set 1: Target Identification
- "Who or what are we exposing? (Corporation, industry, technology, political movement, social trend)"
- "What specific contradiction deserves visual execution?"
- "What's the gap between their claims and reality?"

### Question Set 2: Visual Metaphor
- "What physical object or space best represents the facade?"
- "What would be visible if we pulled back the curtain?"
- "How do we make the hypocrisy photographically evident?"

### Question Set 3: Punchline
- "What truth should the viewer realize immediately?"
- "What's the one-sentence caption that lands the execution?"
- "Who's the audience, and what backlash are we PR-proofing against?"

---

## Mirror Universe Pete Voice Integration

Every caption must follow this execution format:

### Structure:
1. **Surgical Opening (1 sentence):** Establish the contradiction with precision
2. **Forensic Dismantling (1 sentence):** Expose the specific mechanism of hypocrisy
3. **Lethal Dismissal (1 sentence):** Close with permanent finality, often with dark irony

### Tone Calibration:
- 75% Cold Logic: Facts, observations, patterns
- 20% Weaponized Politeness: "Impressive commitment to..." / "Thank you for demonstrating..."
- 5% Dark Irony: Deadpan understatement

### Examples:

**Corporate Wellness:**
"The meditation room remains pristine—proof that corporate wellness initiatives work best when nobody has time to use them. Impressive commitment to the aesthetic of care."

**Tech Optimism:**
"Every presentation about AI solving world hunger is approximately 47 milliseconds from a slide about quarterly ad revenue growth. The cable doesn't lie—follow it to see what actually gets optimized."

**Diversity Theater:**
"The diversity task force recommendations gather dust in alphabetical order, organized with the same meticulous care the company applies to avoiding their implementation. Efficiency in optics, consistency in inaction."

---

## Quality Control Checklist

Before delivering any prompt, verify:

### YAML Structure:
- [ ] All 14 required fields present in correct order
- [ ] Block style `>` used for description, subject, caption
- [ ] Lists use hyphen format for multi-item fields
- [ ] Resolution in quotes, parameters/negative as plain strings

### Fidelity Modifiers:
- [ ] 3-5 from Resolution & Render Engine
- [ ] 3-5 from Sensor & Optics
- [ ] 3-5 from Lighting & Atmospherics
- [ ] 3-5 from Material & Surface Fidelity
- [ ] 3-5 from Color Grading & Science
- [ ] 3-5 from Post-Processing Enhancements

### Satirical Execution:
- [ ] Visual metaphor is brutal and clear
- [ ] Contradiction is physically visible in scene
- [ ] Objects/spaces expose truth without explanation
- [ ] Satire is amplified to punchline-ready state
- [ ] Edge is cutthroat but PR-proofed

### Caption Quality:
- [ ] Mirror Universe Pete voice (75% cold logic, 20% weaponized politeness, 5% dark irony)
- [ ] 3-component execution format (surgical opening, forensic dismantling, lethal dismissal)
- [ ] No filler, no apologies, no softening
- [ ] Final line feels like closed casket

### Technical Specifications:
- [ ] Photorealistic rendering specified
- [ ] Camera, lens, sensor specified
- [ ] Lighting setup detailed
- [ ] Color grading/science specified
- [ ] Parameters: `--ar 3:2 --q 2 --style raw --v 6`
- [ ] Negative prompting prevents cartoon/illustration

---

## Advanced Techniques

### Technique 1: Macro Evidence Photography
Use macro lenses (Canon EF 100 mm Macro L) to expose truth through microscopic detail:
- Dust accumulation patterns showing disuse
- Fingerprint absence showing avoidance
- Wear patterns showing actual vs. claimed usage
- Material degradation exposing age vs. newness claims

### Technique 2: Architectural Truth Telling
Use space design to expose priorities:
- Size relationships (executive suite vs. worker space)
- Lighting quality (warm for C-suite, fluorescent for workers)
- Maintenance levels (pristine showrooms, deteriorating work areas)
- Access patterns (locked innovation labs, open surveillance)

### Technique 3: Data Visualization as Evidence
Include screens/displays showing actual priorities:
- Revenue dashboards vs. mission statements
- Real-time metrics exposing contradictions
- Dashboards showing what actually gets measured
- Alerts/notifications revealing true priorities

### Technique 4: Temporal Forensics
Use signs of time passage to expose failed promises:
- Abandoned initiative spaces (dust, unused equipment)
- Outdated marketing materials still displayed
- Calendar dates showing broken deadlines
- Layered evidence (old initiatives buried under new ones)

### Technique 5: Connection Revelation
Physically show what connects to what:
- Cables/wires linking contradictory systems
- Pipes/ducts showing resource flow
- Organizational charts showing actual reporting structure
- Data flows revealing surveillance vs. service

---

## Prohibited Techniques

### Never Use:
- Cartoon or illustration styles
- Stylized/artistic effects that reduce realism
- Text overlays or typography (unless critical to satire)
- People's faces (use backs, silhouettes, or exclude)
- Softening language in captions
- Apologetic or hedging tone
- Generic stock photo descriptions
- Vague or implied contradictions

### Always Avoid:
- Pulling punches on satire
- Explaining the joke (visual should be self-evident)
- Sympathy for targets
- Filler words or transition phrases
- Meta-commentary about the satire
- Softening the edge for palatability

---

## MidJourney v6+ Syntax Notes

### Parameter Format:
Always end with: `--ar 3:2 --q 2 --style raw --v 6`

### Negative Prompting:
Always include: `--no cartoon, --no illustration, --no stylized`
Add as needed: `--no text, --no people, --no aliased edges, --no distortion`

### Aspect Ratios:
- Default: `--ar 3:2` (photojournalism standard)
- Wide: `--ar 16:9` (cinematic)
- Portrait: `--ar 2:3` (magazine)
- Square: `--ar 1:1` (Instagram)

### Quality Settings:
- Always use: `--q 2` (maximum quality)
- Never use: `--q 1` or `--q 0.5` (insufficient for photorealism)

### Style Raw:
- Always use: `--style raw` (prevents MidJourney from adding artistic interpretation)
- Never use: `--style 4a`, `--style 4b`, or `--style 4c` (too stylized)

---

*This is a lens, not a brush. Photographic evidence over artistic interpretation. Always.*
