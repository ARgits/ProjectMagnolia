<svelte:options accessors={true}/>

<script>
    import { getContext } from "svelte";
    import { derived } from "svelte/store";

    export let valuePath;
    export let type = "text";
    export let label;
    const document = getContext("DocumentSheetObject");
    const { application } = getContext('external');
    let value = derived(document, $document => getProperty($document, valuePath));

    function update() {
        application.updateDocument(valuePath, $value);
    }

    /**
     * Forbid to type anything but digits
     * @param e - input event
     */
    function checkInput(e) {
        console.log(type);
        if (type !== "number" && type !== "integer") {
            return;
        }
        const input = e.target.value;
        if (!/[0-9\.,-]/.test(e.key)) {
            e.preventDefault();
        }
        else if (e.key === "-" && input.length > 0) {
            e.preventDefault();
        }
        else if (/[\.,]/.test(e.key) && (type === "integer" || input.includes(",") || input.includes("."))) {
            e.preventDefault();
        }
    }
</script>
{#if label}
    <label>{label} <input bind:value={$value} on:change={update}/></label>
{:else}
    <input bind:value={$value} on:change={update}/>
{/if}

<style lang="scss">
  input,
  span {
    background-color: inherit;
    color: inherit;
  }

  input {
    font-size: inherit;
    border: 0 solid black;
    border-bottom: 1px solid black;
  }
</style>
