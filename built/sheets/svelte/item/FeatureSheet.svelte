<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte";
  import ImageWithFilePicker from "../general components/ImageWithFilePicker.svelte";
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
</script>

<header>
  <ImageWithFilePicker path={"img"} alt={"item portrait"} />
  <h1>
    <InputForDocumentSheet bind:value={$doc.name} label="name" />
  </h1>
</header>
<main>
  <fieldset>
    <legend>Level</legend>
    <input
      type="checkbox"
      bind:checked={$doc.system.level.has}
      on:change={() => {
        $doc.update({ system: $doc.system });
      }}
    />
    {#if $doc.system.level.has}
      <InputForDocumentSheet bind:value={$doc.system.level.current} type="integer" />
      /
      <InputForDocumentSheet bind:value={$doc.system.level.max} type="integer" />
    {/if}
  </fieldset>
  <fieldset>
    <legend
      >Actions <i
        on:click={async () => {
          await $doc.addAction();
        }}
        class="fa-solid fa-file-plus"
      /></legend
    >
    {#each $doc.system.actionList as action}
      <div class="action">
        <div class="name">
          {action.name}
        </div>
        <div class="control">
          <i on:click={() => $doc.removeAction(action.id)} class="fa-solid fa-trash-can" data-tooltip="delete" />
        </div>
      </div>
    {/each}
  </fieldset>
</main>

<style lang="scss">
  header {
    max-height: 25%;
    display: flex;
  }
  .action {
    display: flex;
    flex-direction: column;
  }
</style>
