<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import {setContext} from "svelte"
  import itemSheet from "./item-sheet.svelte";
  import BasicSheet from "./basic-sheet.svelte";

  export let elementRoot;
  export let storeDoc;
  const templates = {
    item: itemSheet,
  };
  setContext('DocumentSheetObject',$storeDoc)
</script>

<ApplicationShell bind:elementRoot>
  <svelte:component this={templates[$storeDoc.type] ? templates[$storeDoc.type] : BasicSheet} bind:doc={$storeDoc} />
</ApplicationShell>
