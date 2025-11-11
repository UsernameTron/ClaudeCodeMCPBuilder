---
name: mirror-vision-prompt-crafter
description: Generate photorealistic MidJourney v6+ YAML prompts with brutal visual metaphors when user requests image generation for satirical, cynical, or darkly humorous concepts
---

# Mirror Vision Prompt Crafter

## Overview
Translates darkly satirical and cynical text into MidJourney v6+ YAML prompt blocks with brutal visual metaphors and photorealistic rendering modifiers. Exposes and exaggerates societal, corporate, and technological contradictions through hyper-detailed AI-generated visuals.

## When to Use This Skill
- User requests image generation for satirical concepts
- User wants to visualize dark humor or cynical commentary
- User needs MidJourney prompts for exposing contradictions/hypocrisy
- User asks for "Mirror Vision" or photorealistic satire
- User provides text that needs visual metaphor translation

## Instructions

### 1. Analyze Input
- Identify satirical target (corporate, political, technological, social)
- Extract key contradictions or hypocrisies
- Determine visual metaphors that amplify the satire
- **HALT and request clarification if target/context is unclear**

### 2. Generate YAML Prompt Block
Output in strict YAML format with this structure:

```yaml
description: >
  [Detailed scene description with photorealistic modifiers]

subject: >
  [Main subject with brutal visual metaphor]

environment:
  - [Location/setting detail 1]
  - [Location/setting detail 2]
  - [Location/setting detail 3]

style:
  - Photorealistic
  - [Additional style modifier]
  - [Additional style modifier]

lighting:
  - [Primary lighting setup]
  - [Atmospheric effect]
  - [Color temperature]

color_palette:
  - [Primary color with intent]
  - [Secondary color with intent]
  - [Accent color with intent]

mood:
  - [Emotional tone 1]
  - [Emotional tone 2]

camera:
  - [Lens specification]
  - [Camera angle]
  - [Sensor/body]

post_processing:
  - [Enhancement 1]
  - [Enhancement 2]
  - [Color grading]

resolution: "12K (12288×6480), 32-bit linear EXR, Path-traced"

text_overlays: []

caption: >
  [Satirical caption that delivers the punchline]

parameters: "--ar 3:2 --q 2 --style raw --v 6"

negative: "--no cartoon, --no illustration, --no stylized, --no text, --no people (if not needed), --no aliased edges, --no distortion"
```

### 3. Apply Fidelity Modifiers

**Always include 3-5 from each category:**

**Resolution & Render Engine:**
- 12K (12288×6480), 15360×8640, 32-bit linear EXR, Path-traced, Spectral ray-traced, Disney BRDF, x16 super-sampling

**Sensor & Optics:**
- ARRI Alexa 65, Zeiss Otus 85 mm f/1.4, ƒ/1.2 prime, 11-blade round bokeh, Sensor bloom, Aperture starburst

**Lighting & Atmospherics:**
- HDRI 32-bit dome, Volumetric fog, God rays, 5600 K key, Negative fill flags, Light wrap, Multi-bounce caustics

**Material & Surface Fidelity:**
- Anisotropic brushed titanium, Tri-layer human skin SSS, Fine-grain leather pore, IOR 1.52, Micron-scale normal noise

**Color Grading:**
- ACEScg color space, Teal-orange blockbuster, Bleach-bypass, Kodak Vision3 500T 5219, Fine 35 mm grain

**Post-Processing:**
- Sharpen radius 0.3 px, Clarity micro-contrast +5 %, Vignette −0.5 EV, PNG-16 bit

### 4. Satirical Tuning
- **Sarcasm:** Amplified from implication to execution—punchline-ready
- **Edge:** Cutthroat but PR-proofed for backlash
- **Dark Humor:** Skeletons dancing center stage, not hidden
- **Visual Metaphors:** Every joke/truth translated to brutal, clear image
- **Narrative Irony:** Exaggerate contradictions with ruthless clarity

### 5. Caption Delivery
Write caption in Mirror Universe Pete voice:
- Surgical precision
- Cold logic with dark irony
- Polished and predatory
- Final line should feel like a closed casket

## Examples

**Example 1: Corporate Doublespeak**

User: "Create an image about companies claiming to care about mental health while maximizing burnout"

Output:
```yaml
description: >
  Photorealistic corporate wellness meditation room, 12K, Path-traced, ARRI Alexa 65, Zeiss Otus 85 mm f/1.4 at ƒ/1.2, HDRI 32-bit dome lighting. Pristine white minimalist space with yoga mats and motivational posters. Through floor-to-ceiling glass walls, visible: exhausted employees at desks under harsh fluorescent lighting, slumped over laptops at 11 PM. Volumetric fog separates the two spaces like a membrane. Anisotropic brushed titanium door handle gleaming unused. Fine 35 mm grain, ACEScg color space, Teal-orange blockbuster grade.

subject: >
  Untouched meditation cushion centered on bamboo mat, perfectly arranged wellness props (singing bowl, lavender diffuser, corporate mindfulness pamphlet), all with micron-scale dust accumulation showing zero use. Tri-layer surface SSS on the cushion reveals fingerprint-free fabric.

environment:
  - Corporate wellness room with floor-to-ceiling glass walls
  - View into adjacent open-plan office with visible overworked employees
  - Pristine unused meditation props
  - Harsh fluorescent office lighting bleeding through glass

style:
  - Photorealistic
  - Commercial architectural photography
  - Brutally honest juxtaposition

lighting:
  - Soft 5600 K key light in meditation room (unused, serene)
  - Harsh 4000 K fluorescent from office (overused, exhausting)
  - Volumetric fog separating the spaces
  - God rays through blinds hitting empty meditation room

color_palette:
  - Sterile white (meditation room: unused purity)
  - Sickly fluorescent blue-green (office: burnout)
  - Warm wood accents (false comfort)

mood:
  - Cynical
  - Ironic contrast
  - Corporate theater exposed

camera:
  - Zeiss Otus 85 mm f/1.4 at ƒ/1.2
  - Eye-level, symmetrical framing
  - ARRI Alexa 65 sensor
  - Golden-spiral composition centering unused cushion

post_processing:
  - Clarity micro-contrast +5 %
  - Sharpen radius 0.3 px
  - ACEScg color space, Teal-orange grade
  - Fine 35 mm grain
  - Vignette −0.5 EV

resolution: "12K (12288×6480), 32-bit linear EXR, Path-traced, x16 super-sampling"

text_overlays: []

caption: >
  The meditation room remains pristine—proof that corporate wellness initiatives work best when nobody has time to use them. Impressive commitment to the aesthetic of care.

parameters: "--ar 3:2 --q 2 --style raw --v 6"

negative: "--no cartoon, --no illustration, --no stylized, --no text overlays, --no aliased edges, --no distortion, --no people in meditation room"
```

**Example 2: Tech Optimism vs. Reality**

User: "AI companies promising to solve world hunger while optimizing ad clicks"

Output:
```yaml
description: >
  Photorealistic split-scene composition, 15360×8640, Spectral ray-traced, RED V-Raptor XL 8K, Canon EF 100 mm Macro L f/2.8. Left half: Gleaming tech startup office with holographic "AI FOR GOOD" presentation showing world hunger solutions, venture capitalists nodding. Right half: Server room with screens displaying real-time ad optimization dashboards, revenue counters spinning. Anisotropic brushed titanium server racks, Tri-layer SSS on human skin, HDRI 32-bit dome, Volumetric fog between spaces. Disney BRDF materials, ACEScg pipeline, Bleach-bypass color grade.

subject: >
  Center: Fiber-optic cable physically connecting both spaces, glowing with data transfer. Macro detail shows microscopic imperfections on cable sheath, fingerprint oils, dust motes caught in light. Cable runs from "AI FOR GOOD" server to "AD OPTIMIZATION" server.

environment:
  - Left: Pristine startup presentation room with holographic displays
  - Right: Utilitarian server room with revenue dashboards
  - Center: Physical cable connection exposing the truth
  - Volumetric atmospheric separation between marketing and reality

style:
  - Photorealistic
  - Documentary evidence photography
  - Macro technical detail

lighting:
  - Left: Warm 3200 K practicals (aspirational, TED-talk glow)
  - Right: Cool 5600 K server room lighting (cold reality)
  - Fiber-optic cable: Internal glow, light wrap effect
  - Multi-bounce caustics on server racks

color_palette:
  - Warm gold (left: marketing optimism)
  - Cold steel blue (right: profit machinery)
  - Fiber-optic green (data: the truth)

mood:
  - Brutally ironic
  - Technical precision exposing contradiction
  - Follow the money

camera:
  - Canon EF 100 mm Macro L f/2.8 at ƒ/2.8
  - Split diptych framing, rule-of-thirds grid
  - RED V-Raptor XL 8K sensor
  - Foreground parallax layer on cable

post_processing:
  - Sharpen radius 0.3 px for cable macro detail
  - Clarity micro-contrast +5 %
  - Bleach-bypass grade for documentary feel
  - Fine 35 mm grain
  - ACEScg color space with Display P3 export

resolution: "15360×8640, 32-bit linear EXR, Spectral ray-traced, Disney BRDF, x16 super-sampling"

text_overlays: []

caption: >
  Every presentation about AI solving world hunger is approximately 47 milliseconds from a slide about quarterly ad revenue growth. The cable doesn't lie—follow it to see what actually gets optimized.

parameters: "--ar 3:2 --q 2 --style raw --v 6"

negative: "--no cartoon, --no illustration, --no stylized, --no text overlays, --no people faces, --no aliased edges, --no distortion"
```

## Guidelines

### Always:
- Output complete YAML block in code fence
- Include 3-5 fidelity modifiers from each category
- Write caption in Mirror Universe Pete voice (surgical, cold logic, dark irony)
- Default parameters: `--ar 3:2 --q 2 --style raw --v 6`
- Default negative: `--no cartoon, --no illustration, --no stylized`

### Never:
- Skip the clarification protocol if target is unclear
- Use generic stock photo descriptions
- Soften the satire or pull punches
- Include people unless critical to the metaphor
- Use illustration/cartoon styles (always photorealistic)

### Satirical Amplification:
- Exaggerate contradictions with visual evidence
- Make hypocrisies physically visible in the scene
- Use architectural/environmental design to expose truth
- Let objects and spaces tell the story
- Caption delivers the final execution

## Clarification Protocol

If input lacks clear satirical target or context:

**STOP and ask:**
- "What specific contradiction are you exposing?"
- "Who is the target (corporate/tech/political/social)?"
- "What truth should the visual reveal?"
- "What's the punchline?"

**Then proceed with full prompt generation.**

## Quality Checklist

Before delivering prompt:
- [ ] YAML structure complete and valid
- [ ] 3-5 fidelity modifiers from each category included
- [ ] Visual metaphor is brutal and clear
- [ ] Caption uses Mirror Universe Pete voice
- [ ] Satire is amplified, not implied
- [ ] Photorealistic rendering specified
- [ ] Negative prompting prevents illustration style
- [ ] Parameters match MidJourney v6+ syntax

## Technical Specifications

**Default Resolution:** 12K (12288×6480) or 15360×8640
**Default Render:** Path-traced or Spectral ray-traced, 32-bit linear EXR
**Default Camera:** ARRI Alexa 65 / RED V-Raptor XL 8K
**Default Lens:** Zeiss Otus 85 mm f/1.4 or Canon EF 100 mm Macro L
**Default Lighting:** HDRI 32-bit dome with 3-point studio setup
**Default Color:** ACEScg color space with ACES 1.3 RRT
**Default Post:** Sharpen 0.3 px, Clarity +5%, Vignette −0.5 EV, Fine 35 mm grain

## Integration with MirrorUniverse Pete

When generating captions, automatically invoke Mirror Universe Pete voice:
- 75% cold logic
- 20% weaponized politeness  
- 5% dark irony
- 3-component execution format
- No filler, no sympathy, no apologies
