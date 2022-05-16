<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";
  export let elementRoot;
  setContext("itemContext", writable(getContext("external").application.object));
  const itemContext = getContext("itemContext")
  console.log($itemContext);
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
  <input bind:value={$itemContext.data.name}/>
</ApplicationShell>
