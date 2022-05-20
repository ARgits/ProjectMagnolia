<script>
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';

  export let elementRoot;
  export let storeDoc;
</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
  Name: {$storeDoc?.name}
</ApplicationShell>