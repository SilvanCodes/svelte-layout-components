<script>
	import Stack from './Stack.svelte';
	import Sidebar from './Sidebar.svelte';
	import Cover from './Cover.svelte';
	import Bracket from './Bracket.svelte';
	import Alternate from './Alternate.svelte';
</script>


<Cover padding="--zero" margin="--zero" maxOut={true}>
	<div slot="above">
		<Bracket>
			<p slot="center">Welcome!</p>
		</Bracket>
	</div>
	<div slot="center">
		<Sidebar scale="--zero">
			<div slot="sidebar">
				<Bracket padding="--s-1">
					<p slot="center">Sidebar Title</p>
				</Bracket>
				<Bracket>
					<p slot="left">Option 1</p>
				</Bracket>
			</div>
			<div slot="not-sidebar">
				<Alternate statements={["This website is an experiment to learn webdesign.", "It is layouted according to the ideas of https://every-layout.dev/", "The color schema comes from https://colorsupplyyy.com/app"]}></Alternate>
			</div>
		</Sidebar>
	</div>
</Cover>
