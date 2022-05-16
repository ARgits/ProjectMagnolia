<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { getContext, setContext } from "svelte";
  export let elementRoot;
  console.log(elementRoot,this,getContext('external'))
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
  <!--{(console.log(this.getData()), "")}-->
</ApplicationShell>
