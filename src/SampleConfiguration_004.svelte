<script>
	import Switcher from './layout/Switcher.svelte';
	import Cover from './layout/Cover.svelte';
	import Box from './layout/Box.svelte';
	import Reel from './layout/Reel.svelte';
</script>

<Cover>
	<div slot="above">
		<Reel itemWidth="s3">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
			<img src="favicon.png" alt="favicon">
		</Reel>
	</div>
	<div slot="center">
		<Box>
			<Switcher limit="10">
				<Box></Box>
				<Box></Box>
				<Box></Box>		
			</Switcher>	
		</Box>
	</div>
</Cover>
