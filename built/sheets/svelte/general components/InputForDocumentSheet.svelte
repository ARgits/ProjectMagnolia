<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let value;
  export let type = "text";
  export let label;
  const document = getContext("DocumentSheetObject");
  let data;
  let labelElem;
  let input;
  $: if (label && input) input.style.width = `calc(100% - ${Math.ceil(labelElem.offsetWidth*1.5)}px)`;
  $: {
    data = { img: $document.img, system: $document.system, flags: $document.flags, name: $document.name };
  }
  function checkInput(e){
    if(type!=="number") return
    if(/[0-9\.,-]/.test(e.key)){
      console.log(/[0-9\.,]/.test(e.key), e)
      e.preventDefault();
    }
  }
</script>

{#if label}
  <span bind:this={labelElem}>{label}</span>
{/if}
<input
  bind:this={input}
  bind:value
  on:keypress={(e)=>checkInput(e)}
  on:change={() => {
    $document.update(data);
  }}
/>

<style lang="scss">
  input,
  span {
    background-color: inherit;
    color: inherit;
  }
</style>
