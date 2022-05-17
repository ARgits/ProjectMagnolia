<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let document;
  export let value;
  export let path;
  export let label;
  async function updateDocument() {
    let data = {};
    data[path] = value;
    await document.update(data);
  }
</script>

<label for={path}>
  {label}
  <input bind:value on:change={updateDocument} />
</label>
