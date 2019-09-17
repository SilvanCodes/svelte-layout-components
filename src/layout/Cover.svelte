<script>
    import { onMount } from 'svelte';
    import { cssValue } from '../lib/helpers';

    export let space = 's0';
    export let minHeight = '100vh';
    export let pad = true;

    const id = 'cover' + space + minHeight + pad;

	onMount(() => {
        document.querySelectorAll(`.${id}`).forEach(e => e.style.minHeight = cssValue(minHeight));
        document.querySelectorAll(`.${id} > .above`).forEach(e => e.style.spaceBottom = cssValue(space));
        document.querySelectorAll(`.${id} > .below`).forEach(e => e.style.marginTop = cssValue(space));

        if (pad) {
           document.querySelectorAll(`.${id}`).forEach(e => e.style.padding = cssValue(space)); 
        }
	});
</script>

<style>
    [class^="cover"] {
        display: flex;
        flex-direction: column;
    }

    [class^="cover"] > .center {
        margin-top: auto;
        margin-bottom: auto;
    }

    [class^="cover"] > .above {
        margin-top: 0;
    }

    [class^="cover"] > .below {
        margin-bottom: 0;
    }
</style>

<div class={id}>
    <div class="above">
        <slot name="above"></slot>
    </div>
    <div class="center">
        <slot name="center"></slot>
    </div>
    <div class="below">
        <slot name="below"></slot>
    </div>
</div>