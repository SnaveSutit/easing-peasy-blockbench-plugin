import { SveltePanel } from 'svelte-patching-tools/blockbench'
import { localize } from '../../util/lang'
import EasingsPanelComponent from './easings.svelte'

export const EASINGS_PANEL = new SveltePanel({
	id: `easing_peasy:panel/easings`,
	name: localize('easing_peasy.panel.easings.title'),
	component: EasingsPanelComponent,
	expand_button: false,
	icon: 'timeline',
	condition: {
		modes: [Modes.options.animate.id],
	},
	default_position: {
		slot: 'left_bar',
		folded: false,
		float_position: [0, 0],
		float_size: [200, 200],
		height: 200,
		sidebar_index: 3,
	},
	default_side: 'left',
})
