<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let path;
  export let alt;
  export let heightPriority;
  let img;
  $: img.style.width = heightPriority
    ? img.parentElement.clientHeight - parseFloat(getComputedStyle(img.parentElement).padding) * 2
    : img.style.width;
  const { application } = getContext("external"); //get sheet document
  const document = getContext("DocumentSheetObject");
  let src = getProperty($document, path);
  function onEditImage(event) {
    const current = src;
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: async (newVal) => {
        src = newVal;
        let updateData = {};
        updateData[path] = src;
        await $document.update(updateData);
      },
      top: application.position.top + 40,
      left: application.position.left + 10,
    });
    return fp.browse();
  }
</script>

<img bind:this={img} {alt} {src} on:click={(event) => onEditImage(event)} />

<style>
  img {
    max-height: 100%;
  }
</style>
