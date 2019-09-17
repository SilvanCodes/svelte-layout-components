<script>
    import Box from './layout/Box.svelte';
    import Stack from './layout/Stack.svelte';
    import Cluster from './layout/Cluster.svelte';
    
    export let statements = ["Hello", "World!"];
</script>

<Box padding="s2">
        <Stack>
            {#each statements as statement, i}
                {#if i%2 == 0}
                    <Cluster space="s3" justify="flex-start">
                        <div>
                            <p>{@html statement}</p>
                        </div>
                    </Cluster>
                {:else}
                    <Cluster space="s3" justify="flex-end">
                        <div>
                            <p>{@html statement}</p>
                        </div>
                    </Cluster>
                {/if}
            {/each}
        </Stack>
</Box>