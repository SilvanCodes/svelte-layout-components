<script>
	import Sidebar from './Sidebar.svelte';
	import Cover from './Cover.svelte';
	import Bracket from './Bracket.svelte';
    import Alternate from './Alternate.svelte';
    import Button from './Button.svelte';
	import Stack from './Stack.svelte';
	
	import { statements } from './staticContent.js'
</script>


<Cover padding="--zero" margin="--zero" maxOut={true}>
	<div slot="above">
		<Bracket>
			<h1 slot="center">Welcome!</h1>
		</Bracket>
	</div>
	<div slot="center">
		<Sidebar>
			<div slot="sidebar">
				<Bracket padding="--s-1">
					<p slot="center">Sidebar Title</p>
				</Bracket>
                <Bracket padding="--s-1">
					<div slot="center">
                        <Stack>
                            <Button priority="ternary">Option 1</Button>
                            <Button priority="ternary">Option 2</Button>
                            <Button priority="ternary">Option 3</Button>
                        </Stack>
                    </div>
				</Bracket>
				
			</div>
			<div slot="not-sidebar">
				<Alternate {statements}></Alternate>
			</div>
		</Sidebar>
	</div>
    <div slot="below">
        <Bracket>
            <p slot="center">Footer</p>
        </Bracket>
    </div>
</Cover>
