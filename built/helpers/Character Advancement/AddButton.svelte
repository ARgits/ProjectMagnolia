<script>
	import {data} from './store.js'
	export let type
	export let subtype
	/**
	 * Adds +1 to particular value
	 * @param type {string} - types like "attributes", "skills" etc.
	 * @param subtype {string} - like "str" or "med"
	 */
	function increase(type, subtype){
		data.update((obj)=>{
			console.log('before', type, subtype)
			obj[type][subtype].value++
			console.log('after', type,subtype,obj[type][subtype])
			return obj
		})
	}
</script>
<button on:click={()=>increase(type,subtype)}>+
</button>
<style>
	button:active {
  transform: translateY(0.1em);
}
</style>