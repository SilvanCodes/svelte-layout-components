<script>
	import Stack from './layout/Stack.svelte';
	import Box from './layout/Box.svelte';
</script>

<Stack splitAfter="2" recursive="true">
	<p>eins</p>
	<Box>
		<ul>
			<Box>
				<li>1</li>
			</Box>			
			<Box>
				<li>2</li>
			</Box>
			<Box>
				<li>3</li>
			</Box>
			<li>4</li>
		</ul>
	</Box>
	<p>zwei</p>
	<p>drei</p>
</Stack>
