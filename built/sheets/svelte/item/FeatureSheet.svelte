<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte";
  import ImageWithFilePicker from "../general components/ImageWithFilePicker.svelte";
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
  let sourceList={
    mar:$doc.system.source.includes('mar'),
    mag:$doc.system.source.includes('mag'),
    div:$doc.system.source.includes('div'),
    pri:$doc.system.source.includes('pri'),
    psy:$doc.system.source.includes('psy'),
  }
</script>

<header>
  <ImageWithFilePicker path={"img"} alt={"item portrait"} />
  <h1>
    <InputForDocumentSheet bind:value={$doc.name} label="name" />
  </h1>
</header>
<main>
    <fieldset>
        <legend>Source</legend>
        {#each Object.entries(CONFIG.ARd20.Source) as src}
            <input type="checkbox" bind:value={$doc.system.source.includes(src[0])} />
        {/each}
    </fieldset>
</main>
