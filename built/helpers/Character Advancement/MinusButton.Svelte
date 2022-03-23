<script>
	import {data} from './store.js'
	export let type
	export let subtype
	function decrease(type, subtype){
		data.update((obj)=>{
			obj[type][subtype].value = obj[type][subtype].value-1
			return obj
		})
	}
</script>
<button on:click={()=>decrease(type,subtype)}>-
</button>
<style>
	button:active {
  transform: translateY(0.1em);
}
</style>