<script>
	import {data} from './store.js'
	export let type
	export let subtype
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