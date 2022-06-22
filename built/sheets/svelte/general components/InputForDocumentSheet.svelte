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
  let feather;
  $: if (label && input && feather)
    input.style.width = `calc(100% - ${Math.ceil(labelElem.offsetWidth * 1.5)}px - ${Math.ceil(
      feather.offsetWidth * 1.5
    )}px)`;
  $: {
    data = { img: $document.img, system: $document.system, flags: $document.flags, name: $document.name };
  }
  $: if (type !== "text") value = type === "integer" ? parseInt(value) : parseFloat(value);

  /**
   * Forbid to type anything but digits
   * @param e - input event
   */
  function checkInput(e) {
    console.log(type);
    if (type !== "number" && type !== "integer") return;
    const input = e.target.value;
    if (!/[0-9\.,-]/.test(e.key)) e.preventDefault();
    else if (e.key === "-" && input.length > 0) e.preventDefault();
    else if (/[\.,]/.test(e.key) && (type === "integer" || input.includes(",") || input.includes(".")))
      e.preventDefault();
  }
</script>

{#if label}
  <span bind:this={labelElem}>{label}</span>
{/if}
<input
  bind:this={input}
  bind:value
  on:keypress={(e) => checkInput(e)}
  on:change={() => {
    $document.update(data);
  }}
/>
<i bind:this={feather} class="fa-solid fa-feather-pointed" />

<style lang="scss">
  input,
  span {
    background-color: inherit;
    color: inherit;
  }
  input {
    font-size: inherit;
    border: 0 solid black;
    border-bottom: 1px solid black;
  }
</style>
