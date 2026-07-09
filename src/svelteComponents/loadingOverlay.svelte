<script lang="ts">
	import { sineInOut } from 'svelte/easing'
	import { fade } from 'svelte/transition'
	import { localize } from '../util/lang'
</script>

<div transition:fade={{ duration: 150, easing: sineInOut }} class="loading-overlay">
	<h1>{localize('easing_peasy.loading_overlay.title')}</h1>
</div>

<style>
	.loading-overlay {
		display: flex;
		justify-content: center;
		align-items: center;

		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 9999;
		pointer-events: auto;
		background-color: #000000aa;
	}
</style>
