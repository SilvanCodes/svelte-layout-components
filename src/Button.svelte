<script>
    import { onMount } from 'svelte';

    export let priority = 'primary';
    
    $: id = priority;

	onMount(() => {
        switch (priority) {
            case 'primary':
                document.querySelectorAll(`.button${id}`).forEach(e => {
                    e.style.background = `var(--color-primary)`;
                    e.style.color = `black`;
                });
                break;
            case 'secondary':
                document.querySelectorAll(`.button${id}`).forEach(e => {
                    e.style.background = `var(--color-secondary)`;
                    e.style.color = `white`;
                });
                break;
            case 'ternary':
                document.querySelectorAll(`.button${id}`).forEach(e => {
                    e.style.background = `var(--color-ternary)`;
                    e.style.color = `black`;
                });
                break;
        }
	});
</script>

<style>
    [class^="button"] {
        padding: var(--s-3);
        border-radius: var(--s-3);
        font-family: JosefinSlab;
    }
</style>

<div class={`button${id}`}>
    <slot></slot>
</div>