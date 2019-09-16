<script>
	import { onMount } from 'svelte';

	export let space = '--s0';
	export let recursive = false;
	export let splitAfter = '';

	$: id = space + recursive + splitAfter;

	onMount(() => {
		if (recursive) {
			document.querySelectorAll(`.stack${id} * + *`).forEach(e => e.style.marginTop = `var(${space})`);
		} else {
			document.querySelectorAll(`.stack${id} > * + *`).forEach(e => e.style.marginTop = `var(${space})`);
		}

		if (splitAfter) {
			document.querySelectorAll(`.stack${id} > :nth-child(${splitAfter})`).forEach(e => e.style.marginBottom = 'auto');
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

<div class={`stack${id}`}>
    <slot>
    </slot>
</div>
