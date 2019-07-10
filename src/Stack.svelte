<script>
	import { onMount } from 'svelte';

    export let scale = '--s0';

	onMount(() => {
		document.querySelectorAll(`.stack${scale} > * + *`).forEach(e => e.style.marginTop = `var(${scale})`);
	});
</script>

<div class={`stack${scale}`}>
    <slot>
    </slot>
</div>