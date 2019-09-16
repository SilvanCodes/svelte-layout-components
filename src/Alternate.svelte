<script>
    import Stack from './layout/Stack.svelte';
    import Bracket from './layout/Bracket.svelte';
    
    export let statements = ["Hello", "World!"];
</script>

<Bracket padding="--s2" maxOut={true}>
    <div slot="center">
        <Stack>
            {#each statements as statement, i}
                {#if i%2 == 0}
                    <Bracket padding="--zero">
                        <p slot="left">{@html statement}</p>
                    </Bracket>
                {:else}
                    <Bracket padding="--zero">
                        <p slot="right">{@html statement}</p>
                    </Bracket>
                {/if}
            {/each}
        </Stack>
    </div>
</Bracket>