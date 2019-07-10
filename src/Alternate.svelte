<script>
    import Stack from './Stack.svelte';
    import Bracket from './Bracket.svelte';
    
    export let statements = ["Hello", "World!"];
</script>

<Bracket maxOut={true}>
    <div slot="center">
        <Stack>
            {#each statements as statement, i}
                {#if i%2 == 0}
                    <Bracket>
                        <p slot="left">{statement}</p>
                    </Bracket>
                {:else}
                    <Bracket>
                        <p slot="right">{statement}</p>
                    </Bracket>
                {/if}
            {/each}
        </Stack>
    </div>
</Bracket>