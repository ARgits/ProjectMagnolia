<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { setContext } from "svelte";
  import { DocTemplate } from "../../helpers/templates.js";
  export let elementRoot;
  export let storeDoc;
  setContext("DocumentSheetObject", storeDoc);
  console.log("document type: ", $storeDoc.type);
  $: {
    console.log(`! DocumentShell - $storeDoc: `, $storeDoc);
    console.trace();
  }
</script>

<ApplicationShell bind:elementRoot>
  <svelte:component this={DocTemplate.get($storeDoc)} />
</ApplicationShell>
