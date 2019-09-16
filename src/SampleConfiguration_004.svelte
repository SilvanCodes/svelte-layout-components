<script>
	import Sidebar from './layout/Sidebar.svelte';
	import Cover from './layout/Cover.svelte';
	import Bracket from './layout/Bracket.svelte';
	import Stack from './layout/Stack.svelte';
	
	import { statements } from './staticContent.js'
</script>

<Stack splitAfter="2" recursive="true">
	<p>eins</p>
	<ul>
		<li>1</li>
		<li>2</li>
		<li>3</li>
		<li>4</li>
	</ul>
	<p>zwei</p>
	<p>drei</p>
</Stack>
