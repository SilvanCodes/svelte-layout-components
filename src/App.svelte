<script>
	import SampleConfiguration_000 from './SampleConfiguration_000.svelte';
	import SampleConfiguration_001 from './SampleConfiguration_001.svelte';
	import SampleConfiguration_002 from './SampleConfiguration_002.svelte';
	import SampleConfiguration_003 from './SampleConfiguration_003.svelte';
	import SampleConfiguration_004 from './SampleConfiguration_004.svelte';
	import SampleConfiguration_005 from './SampleConfiguration_005.svelte';

	let configuration = 0;
	let x0 = null;

	const PAGES = 5;

	/* spacebar press */
	document.body.onkeyup = function(e){
		if(e.keyCode === 32){
			configuration = (configuration + 1) % PAGES;
		}
	}

	function unify(e) { return e.changedTouches ? e.changedTouches[0] : e };

	function lock(e) {
		x0 = unify(e).clientX;
	}

	function move(e) {
		if(x0 || x0 === 0) {
			let dx = unify(e).clientX - x0, s = Math.sign(dx);

			/* trigger only if more the 20 percent of screen are swiped */
			let threshold = Math.abs(dx) > document.body.getBoundingClientRect().width * 0.2;

			if (!threshold) return;

			if (s > 0) {
				configuration = (configuration + 1) % PAGES;
			} else {
				configuration = (configuration + 2) % PAGES;
			}
			
			x0 = null;
		}
	}

	/* swipe with touch */
	document.body.addEventListener('touchstart', lock, false);
	document.body.addEventListener('touchend', move, false);

	/* swipe with mouse */
	// document.body.addEventListener('mousedown', lock, false);
	// document.body.addEventListener('mouseup', move, false);

	/* prevent default action */
	document.body.addEventListener('touchmove', e => { e.preventDefault() }, false);

</script>

<main>
	{#if configuration === 0}
		<SampleConfiguration_000></SampleConfiguration_000>
	{:else if configuration === 1}
		<SampleConfiguration_001></SampleConfiguration_001>
	{:else if configuration === 1}
		<SampleConfiguration_002></SampleConfiguration_002>
	{:else if configuration === 2}
		<SampleConfiguration_003></SampleConfiguration_003>
	{:else if configuration === 3}
		<SampleConfiguration_004></SampleConfiguration_004>
	{:else if configuration === 4}
		<SampleConfiguration_005></SampleConfiguration_005>
	{/if}
</main>
