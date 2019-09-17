<script>
	import { onMount } from 'svelte';
	import { cssValue, buildId } from '../lib/helpers';

	export let space = 's0';
	export let recursive = false;
	/** splitAfter can only be a number (handed as a string), but not a CSS-variable */
	export let splitAfter = '';

	const id = buildId('stack', space, recursive, splitAfter);

	onMount(() => {
		if (recursive) {
			document.querySelectorAll(`.${id} * + *`).forEach(e => e.style.marginTop = cssValue(space));
		} else {
			document.querySelectorAll(`.${id} > * + *`).forEach(e => e.style.marginTop = cssValue(space));
		}

		if (splitAfter) {
			document.querySelectorAll(`.${id} > :nth-child(${splitAfter})`).forEach(e => e.style.marginBottom = 'auto');
		}
	});
</script>

<style>
	[class^="stack"] {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
    }

	/* allow for split even if no sibling height is available */
	[class^="stack"]:only-child {
        height: 100%;
    }
</style>

<div class={id}>
    <slot>
    </slot>
</div>
