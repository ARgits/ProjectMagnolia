<script>
	import {getContext} from 'svelte'
	export let min
	export let type
	export let subtype
	let doc = getContext('data')
	let disabled
	$: disabled = $doc[`${type}`][`${subtype}`].value===min;

	function decrease(type, subtype){
		doc.update((store)=>{
			store[`${type}`][`${subtype}`].value-=1
			return store})
	}
</script>
<button {disabled} on:click={()=>decrease(type,subtype)}>-
</button>
<style>
	button:active {
  transform: translateY(0.1em);
}
</style>