<script>
    import Cover from './layout/Cover.svelte';
	import Box from './layout/Box.svelte';
	import Bracket from './layout/Bracket.svelte';
</script>

<Box backgroundColor="white">
    <Bracket>
        <Cover minHeight="1rem">
            <div slot="above">
                <slot name="title"></slot>
            </div>
            <slot></slot>
        </Cover>
    </Bracket>
</Box>