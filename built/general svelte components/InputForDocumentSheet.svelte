<svelte:options accessors={true} />

<script>
    import {getContext} from "svelte"
  export let value;
  const document = getContext('DocumentSheetObject')
  console.log(document)
  let data;
  $:data = {img:document.img, system:document.system, flags:document.flags}
</script>

Name: <input bind:value={value} on:change={()=>{document.update(data)}} />
