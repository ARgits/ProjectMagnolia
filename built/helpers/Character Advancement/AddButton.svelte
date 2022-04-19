<script>
	import {getContext} from 'svelte'
	export let max
	export let type
	export let subtype
	let doc = getContext('data')
	let disabled
	$: disabled = $doc[`${type}`][`${subtype}`].value===max;
	function increase(type, subtype){
		doc.update((store)=>{
			store[`${type}`][`${subtype}`].value+=1
			return store})
	}
</script>
<button {disabled} on:click={()=>increase(type,subtype)}>+
</button>
<style>
	button:active {
  transform: translateY(0.1em);
}
</style>