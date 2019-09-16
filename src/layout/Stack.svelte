<script>
	import { onMount } from 'svelte';

	export let space = '--s0';
	export let splitAfter = '';

	$: id = space + splitAfter;

	onMount(() => {
		document.querySelectorAll(`.stack${id} > * + *`).forEach(e => e.style.marginTop = `var(${space})`);

		if (splitAfter) {
			document.querySelectorAll(`.stack${id} > :nth-child(${splitAfter})`).forEach(e => e.style.marginBottom = 'auto');
		}
	});
</script>

<div class={`stack${id}`}>
    <slot>
    </slot>
</div>