import { registerPatch, registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import LoadingOverlay from '../svelteComponents/loadingOverlay.svelte'
import {
	EASING_DEFAULT,
	type EasingKey,
	easingFunctions,
	getEasingArgDefault,
	hasArgs,
} from '../util/easing'

// Use an overlay to prevent the user from interacting with the UI while the patch is being applied.
// This prevents the user from loading a model with keyframe easing data before the patch is applied, which would cause the data to be lost.
const UNMOUNT_LOADING_OVERLAY = injectComponent({
	component: LoadingOverlay,
	elementSelector: () => document.body,
	prepend: true,
	outro: true,
})

declare global {
	interface _Keyframe {
		easing?: EasingKey
		easingArgs?: number[]
	}
}

interface EasingProperties {
	easing: EasingKey
	easingArgs?: number[]
}

function lerp(start: number, stop: number, amt: number): number {
	return amt * (stop - start) + start
}

export function isFirstKeyframe(kf: _Keyframe): boolean {
	return (
		kf.animator.keyframes
			.filter(k => k.channel === kf.channel)
			.sort((a, b) => a.time - b.time)[0] === kf
	)
}

export function getKeyframeEasing(kf: _Keyframe): { type: string; mode?: string; arg?: number } {
	if (!kf.easing) return { type: 'linear' }
	const match = /ease(InOut|Out|In)?(.+)/.exec(kf.easing)
	if (!match) return { type: kf.easing }

	const type = match[2].toLowerCase()
	const mode = match[1]?.toLowerCase() ?? 'inout'

	if (hasArgs(kf.easing)) {
		return {
			type,
			mode,
			arg: kf.easingArgs?.at(0) ?? getEasingArgDefault(kf.easing),
		}
	}
	return { type, mode }
}

export function setKeyframeEasing(kf: _Keyframe, type: string, mode = 'inout') {
	if (type === 'linear') {
		kf.easing = 'linear'
	} else {
		const name = getEasingFunctionName(type, mode)
		if (kf.easing !== name) {
			Project.saved = false
		}
		kf.easing = name
	}

	if (!hasArgs(kf.easing)) {
		delete kf.easingArgs
	}
}

export function setKeyframeEasingArg(kf: _Keyframe, arg: number | undefined) {
	if (arg == undefined || isNaN(arg)) {
		delete kf.easingArgs
	} else {
		if (kf.easingArgs?.at(0) !== arg) {
			Project.saved = false
		}
		kf.easingArgs = [arg]
	}
}

export function getEasingFunctionName(type: string, mode = 'inout') {
	if (type === 'linear') return 'linear'
	return `ease${
		mode && mode !== 'inout' ? mode[0].toUpperCase() + mode.slice(1) : 'InOut'
	}${type[0].toUpperCase() + type.slice(1)}`
}

registerPatch({
	id: `easing_peasy:keyframe/properties`,

	apply: () => {
		// @ts-expect-error - Blockbench types are broken.
		const keyframe = Blockbench.Keyframe as typeof _Keyframe
		const properties = [
			new Property(keyframe, 'string', 'easing', {
				default: EASING_DEFAULT,
				condition: () => Project?.format.animation_mode,
			}),

			new Property(keyframe, 'array', 'easingArgs', {
				condition: () => Project?.format.animation_mode,
			}),
		]

		void UNMOUNT_LOADING_OVERLAY()

		return { properties }
	},
	revert: ({ properties }) => {
		for (const prop of properties) {
			prop.delete()
		}
	},
})

registerPropertyOverridePatch({
	id: 'easing_peasy:keyframe/getLerp',
	// @ts-expect-error - Blockbench types are broken.
	target: (Blockbench.Keyframe as typeof _Keyframe).prototype,
	key: 'getLerp',

	get(original) {
		return function (this: _Keyframe, other, axis, amount, allowExpression): number {
			const easing = other.easing ?? 'linear'

			if (!Project?.format.animation_mode || easing === 'linear')
				return original.call(this, other, axis, amount, allowExpression)

			let easingFunc = easingFunctions[easing]
			if (hasArgs(easing)) {
				const arg1 =
					Array.isArray(other.easingArgs) && other.easingArgs.length > 0
						? other.easingArgs[0]
						: getEasingArgDefault(easing)

				easingFunc = easingFunc.bind(null, arg1 ?? 0)
			}
			const easedAmount = easingFunc(amount)
			const start = this.calc(axis)
			const stop = other.calc(axis)
			const result = lerp(start, stop, easedAmount)

			if (Number.isNaN(result)) {
				throw new Error('Invalid easing function or arguments.')
			}
			return result
		}
	},
})

export function reverseEasing(easing?: EasingKey) {
	if (!easing) return easing
	if (easing.startsWith('easeInOut')) return easing
	if (easing.startsWith('easeIn')) return easing.replace('easeIn', 'easeOut')
	if (easing.startsWith('easeOut')) return easing.replace('easeOut', 'easeIn')
	return easing
}

registerPropertyOverridePatch({
	id: `easing_peasy:action-click-override/reverse-keyframes`,
	target: BarItems.reverse_keyframes as Action,
	key: 'click',

	condition: () => Project?.format.animation_mode,

	get: original => {
		return (event?: Event) => {
			original?.(event)
			// There's not really an easy way to merge our undo operation with the original one so we'll make a new one instead
			Undo.initEdit({ keyframes: Timeline.selected || undefined })

			const kfByAnimator: Record<string, _Keyframe[]> = {}
			for (const kf of Timeline.selected || []) {
				kfByAnimator[kf.animator.uuid] ??= []
				kfByAnimator[kf.animator.uuid].push(kf)
			}

			const kfByAnimatorAndChannel: Record<string, Record<string, _Keyframe[]>> = {}
			for (const [animatorUuid, keyframes] of Object.entries(kfByAnimator)) {
				const channel: Record<string, _Keyframe[]> = {}
				kfByAnimatorAndChannel[animatorUuid] = channel
				for (const kf of keyframes) {
					channel[kf.channel] ??= []
					channel[kf.channel].push(kf)
				}
			}

			for (const channelGroups of Object.values(kfByAnimatorAndChannel)) {
				for (const keyframes of Object.values(channelGroups)) {
					// Ensure keyframes are in temporal order. Not sure if this is already the case, but it couldn't hurt
					keyframes.sort((a, b) => a.time - b.time)
					// Reverse easing direction
					const easingData: EasingProperties[] = keyframes
						.filter(kf => kf.easing)
						.map((kf: _Keyframe) => ({
							easing: reverseEasing(kf.easing)!,
							easingArgs: kf.easingArgs,
						}))
					// Shift easing data to the right by one keyframe
					keyframes.forEach((kf: _Keyframe, i: number) => {
						if (i == 0) {
							kf.easing = undefined
							kf.easingArgs = undefined
							return
						}
						const newEasingData = easingData[i - 1]
						kf.easing = newEasingData.easing
						kf.easingArgs = newEasingData.easingArgs
					})
				}
			}

			Undo.finishEdit('Reverse keyframe easing')
			updateKeyframeSelection()
			Animator.preview()
		}
	},
})
