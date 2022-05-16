<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";
  export let elementRoot;
  const itemContext = setContext("itemContext", writable(getContext("external").application.object));

  console.log($itemContext);
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
  <!--{(console.log(this.getData()), "")}-->
</ApplicationShell>
