<svelte:options accessors={true}/>

<script>
    import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte";
    import ImageWithFilePicker from "../general components/ImageWithFilePicker.svelte";
    import { getContext } from "svelte";

    const doc = getContext("DocumentSheetObject");
</script>

<header>
    <ImageWithFilePicker path={"img"} alt={"item portrait"}/>
    <h1>
        <InputForDocumentSheet valuePath="name" label="name"/>
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
            <InputForDocumentSheet valuePath="system.level.min" type="integer"/>
            /
            <InputForDocumentSheet valuePath="system.level.max" type="integer"/>
        {/if}
    </fieldset>
    <fieldset>
        <legend> Actions <i on:click={async () => {await $doc.addAction();}}
                            class="fa-solid fa-file-plus"></i></legend>
        {#each $doc.system.actionList as action}
            <div class="action">
                <span class="name">
                    {action.name}
                </span>
                <div class="control">
                    <i on:click={() => $doc.removeAction(action.id)} class="fa-solid fa-trash-can"
                       data-tooltip="delete"></i>
                    <i on:click={() => action.sheet.render(true)}
                       class="fa-solid fa-pen-to-square" data-tooltip="edit"></i>
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

    & * {
      margin: 0 0.1rem;
    }
  }

  i:hover {
    filter: drop-shadow(5px 5px 1px rgba(0, 0, 0, 0.3));
    cursor: pointer;
  }
</style>
