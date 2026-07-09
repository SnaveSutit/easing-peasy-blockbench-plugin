# Easing Peasy

A [Blockbench](https://www.blockbench.net/) plugin that adds easing curves to animation keyframes, simplifying the process of creating smooth animations.

## Features

- 11 easing curves: Linear, Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Elastic, Back, and Bounce.
- Each curve supports In, Out, and In-Out modes.
- Adjustable arguments for curves that support them (elasticity, overshoot, bounciness).
- A dedicated "Keyframe Easing" panel in Animate mode for editing the selected keyframe.
- Reversing keyframes correctly reverses their easing direction too.

## Usage

1. Switch to Animate mode.
2. Select a keyframe with `linear` interpolation.
3. Use the Keyframe Easing panel to choose a curve and mode.

## Installation

Install it from the Blockbench plugin store (search for "Easing Peasy"), or build it from source
and load it manually — see below.

## Development

This project uses [Bun](https://bun.sh/).

1. Install dependencies:
    - `bun install`
2. Commands:
    - `bun dev` - Development build with file watching
    - `bun build` - Production build
    - `bun test` - Run tests
    - `bun format` - Format all files with Prettier

## License

MIT
