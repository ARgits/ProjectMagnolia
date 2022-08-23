<svelte:options accessors={true}></svelte:options>
<script>
    import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";

    export let elementRoot;
    export let statistics;
</script>
<ApplicationShell bind:elementRoot>
    <h1>this is statistics</h1>
    {#each statistics as stat}
    {/each}
</ApplicationShell>

<style></style>