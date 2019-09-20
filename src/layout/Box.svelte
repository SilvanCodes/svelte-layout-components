<script>
    import { onMount } from 'svelte';
    import { cssValue, buildId } from '../lib/helpers';

    export let padding = 's1';
    export let color = 'color-primary';
    export let backgroundColor = 'color-secondary';
    export let borderWidth = 'border-medium';
    export let borderStyle = 'solid';
    export let borderColor = 'color-primary';

    const id = buildId('box', padding, color, backgroundColor, borderWidth, borderStyle, borderColor);

    onMount(() => {
        document.querySelectorAll(`.${id}`).forEach(e => {
            e.style.padding = cssValue(padding);
            e.style.color = cssValue(color);
            e.style.backgroundColor = cssValue(backgroundColor);

            if (borderWidth) {
                e.style.border = cssValue(borderWidth, borderStyle, borderColor);
            } else {
                e.style.outline = '0.125rem solid transparent';
                e.style.outlineOffset = '-0.125rem';
            }
        });
	});
</script>

<style>
    [class^="box"] * {
        color: inherit;
    }
</style>

<div class={id}>
    <slot>
    </slot>
</div>