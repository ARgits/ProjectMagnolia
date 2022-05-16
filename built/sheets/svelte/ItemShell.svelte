<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let elementRoot;
  this.Logging();
</script>

<ApplicationShell bind:elementRoot>
  <div>blank sheet</div>
</ApplicationShell>
