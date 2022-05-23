<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let path;
  const document = getContext("DocumentSheetObject");
  let value = getProperty($document, path);
  async function updateDocument(value) {
    const updateData = {};
    updateData[path] = value;
    await $document.update(updateData);
  }
</script>

<input bind:value on:change={updateDocument(value)} />
