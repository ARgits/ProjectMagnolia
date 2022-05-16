<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let elementRoot;
  console.log(elementRoot,this)
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
  <!--{(console.log(this.getData()), "")}-->
</ApplicationShell>
