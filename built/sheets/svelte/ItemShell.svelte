<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { getContext, setContext } from "svelte";
  export let elementRoot;
  const item = getContext('external').application.object
  console.log(elementRoot,this, item)
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
  <!--{(console.log(this.getData()), "")}-->
</ApplicationShell>
