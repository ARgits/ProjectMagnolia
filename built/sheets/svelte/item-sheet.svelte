<svelte:options accessors={true} />

<script>
  export let doc;
</script>

Name: <input bind:value={doc.name} />
