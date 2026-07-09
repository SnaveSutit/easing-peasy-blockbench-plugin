<script lang="ts" module>
	import IconBack from '../../assets/easingIcons/Back.svg'
	import IconBounce from '../../assets/easingIcons/Bounce.svg'
	import IconCirc from '../../assets/easingIcons/Circ.svg'
	import IconCubic from '../../assets/easingIcons/Cubic.svg'
	import IconElastic from '../../assets/easingIcons/Elastic.svg'
	import IconExpo from '../../assets/easingIcons/Expo.svg'
	import IconLinear from '../../assets/easingIcons/Linear.svg'
	import IconQuad from '../../assets/easingIcons/Quad.svg'
	import IconQuart from '../../assets/easingIcons/Quart.svg'
	import IconQuint from '../../assets/easingIcons/Quint.svg'
	import IconSine from '../../assets/easingIcons/Sine.svg'

	import { onDestroy, onMount } from 'svelte'
	import IconInOut from '../../assets/easingIcons/InOut.svg'
	import IconOut from '../../assets/easingIcons/Out.svg'
	import {
		getEasingFunctionName,
		getKeyframeEasing,
		isFirstKeyframe,
		setKeyframeEasing,
		setKeyframeEasingArg,
	} from '../../patches/keyframeEasing'
	import { getEasingArgDefault, hasArgs } from '../../util/easing'
	import { createScopedTranslator } from '../../util/lang'

	const localize = createScopedTranslator('easing_peasy.panel.easings')

	const EASING_ICONS: Record<string, string> = {
		back: IconBack,
		bounce: IconBounce,
		circ: IconCirc,
		cubic: IconCubic,
		elastic: IconElastic,
		expo: IconExpo,
		linear: IconLinear,
		quad: IconQuad,
		quart: IconQuart,
		quint: IconQuint,
		sine: IconSine,
	}

	const EASING_MODE_ICONS: Record<string, string> = {
		in: IconExpo,
		out: IconOut,
		inout: IconInOut,
	}

	const EASING_TYPES = [
		'linear',
		'sine',
		'quad',
		'cubic',
		'quart',
		'quint',
		'expo',
		'circ',
		'elastic',
		'back',
		'bounce',
	]

	const EASING_MODES: string[] = ['in', 'out', 'inout']
</script>

<script lang="ts">
	// _Keyframe is a plain Blockbench class instance, not a $state proxy, so mutating
	// kf.easing directly (setKeyframeEasing) is invisible to Svelte. Bump this on every
	// relevant event and read it inside the derived to force recomputation even when
	// selectedKeyframe is reassigned to the same object reference.
	let version = $state(0)
	let selectedKeyframe = $state<_Keyframe | undefined>(undefined)
	let easing = $derived.by(() => {
		version
		return selectedKeyframe && getKeyframeEasing(selectedKeyframe)
	})
	let easingArg = $derived.by(() => {
		version
		return (
			easing &&
			(easing.arg ?? getEasingArgDefault(getEasingFunctionName(easing.type, easing?.mode)))
		)
	})
	let easingFunction = $derived(easing && getEasingFunctionName(easing.type, easing.mode))

	const onKeyframeSelectionChange = () => {
		selectedKeyframe = Timeline.selected.at(0)
		version++
	}

	function setAllSelectedKeyframesEasing(type: string, mode: string) {
		for (const kf of Timeline.selected) {
			setKeyframeEasing(kf, type, mode)
		}
		Blockbench.dispatchEvent('update_keyframe_selection', undefined)
	}

	function setAllSelectedKeyframesEasingArg(arg: number) {
		for (const kf of Timeline.selected) {
			setKeyframeEasingArg(kf, arg)
		}
		Blockbench.dispatchEvent('update_keyframe_selection', undefined)
	}

	onMount(() => {
		Blockbench.on('update_keyframe_selection', onKeyframeSelectionChange)
	})

	onDestroy(() => {
		Blockbench.removeListener('update_keyframe_selection', onKeyframeSelectionChange)
	})
</script>

{#if selectedKeyframe === undefined}
	<div class="message">
		{@html localize('no_keyframe_selected')}
	</div>
{:else if isFirstKeyframe(selectedKeyframe)}
	<div class="message">
		{@html localize('first_keyframe_easing')}
	</div>
{:else if selectedKeyframe?.interpolation === 'linear'}
	<div class="bar flex bar-flex-fix">
		<label
			for="easing-type-input"
			style="font-weight: unset; width: 100px; text-align: left;"
			title={localize('easing_type.description')}
		>
			{localize('easing_type.title')}
		</label>
		<div id="easing-type-input" class="easing-container">
			{#each EASING_TYPES as type}
				<button
					class="easing-type"
					title={localize(`easing_type.options.${type}`)}
					onclick={() => setAllSelectedKeyframesEasing(type, easing?.mode ?? 'inout')}
				>
					<img
						class={easing?.type === type ? 'selected' : ''}
						src={EASING_ICONS[type]}
						alt={type}
					/>
				</button>
			{/each}
		</div>
	</div>
	{#if easing?.type !== 'linear'}
		<div class="bar flex bar-flex-fix">
			<label
				for="easing_mode_input"
				class="undefined"
				style="font-weight: unset; width: 100px; text-align: left;"
				title={localize('easing_mode.description')}
			>
				{localize('easing_mode.title')}
			</label>
			{#key easingFunction}
				<div id="easing_mode_input" class="easing-container">
					{#each EASING_MODES as mode}
						<button
							class="easing-type"
							title={localize(`easing_mode.options.${mode}`)}
							onclick={() =>
								setAllSelectedKeyframesEasing(easing?.type ?? 'linear', mode)}
						>
							<img
								class={easing?.mode === mode ? 'selected' : ''}
								src={EASING_MODE_ICONS[mode]}
								alt={mode}
							/>
						</button>
					{/each}
				</div>
			{/key}
		</div>

		{#if hasArgs(easingFunction)}
			<div class="bar flex bar-flex-fix">
				<label
					for="easing_arg_input"
					class="undefined"
					style="font-weight: unset; width: 100px; text-align: left;"
					title={localize(`easing_args.easing_arg.${easing?.type}.description`)}
				>
					{localize(`easing_args.easing_arg.${easing?.type}.title`)}
				</label>
				<input
					id="easing_arg_input"
					class="dark_bordered tab_target"
					style="width: 66px; margin-left: 2px;"
					type="number"
					step="0.1"
					min="0"
					bind:value={easingArg}
					onchange={() => setAllSelectedKeyframesEasingArg(easingArg ?? 0)}
				/>
			</div>
		{/if}
	{/if}
{/if}

<style>
	label {
		background-color: var(--color-elevated);
		padding-left: 8px;
		align-content: center;
	}

	.easing-container {
		display: flex;
	}

	.selected {
		filter: invert(49%) sepia(16%) saturate(6320%) hue-rotate(198deg) brightness(101%)
			contrast(106%);
	}

	.bar-flex-fix {
		display: flex;
		margin-top: 2px;
		min-height: 32px;
		height: unset;
	}

	.message {
		margin-left: 16px;
		font-size: 16px;
		color: var(--color-subtle_text);
		text-wrap: balance;
		margin-bottom: 1rem;
		font-style: italic;
	}

	.easing-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		grid-gap: 2px;
		margin-left: 2px;
	}

	.easing-type {
		width: 32px;
		padding: 0px;
		margin: 0px;
		min-width: unset;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.easing-type:hover {
		background-color: var(--color-selected);
	}
</style>
