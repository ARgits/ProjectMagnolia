<svelte:options accessors={true} />
<script>
    import {getContext} from "svelte"
    export let document
    export let value
    export let path
    async function updateDocument(){
        data = {}
        data[path] = value
        await document.update(data)
    }
</script>
<input bind:value={value} on:change={updateDocument}/>