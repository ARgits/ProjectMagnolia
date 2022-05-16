<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let elementRoot;
  console.log(elementRoot)
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
</ApplicationShell>
