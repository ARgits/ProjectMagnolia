<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import {setContext} from "svelte"
  import {DocTemplate} from "../../helpers/templates.js"
  export let elementRoot;
  export let storeDoc;
  setContext('DocumentSheetObject',storeDoc)
</script>

<ApplicationShell bind:elementRoot>
  <svelte:component this={DocTemplate.get($storeDoc)} bind:doc={$storeDoc} />
</ApplicationShell>
